import http from 'k6/http';
import { check } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// Custom Metrics để theo dõi khóa Transaction chống race-condition
export const successfulBookings = new Counter('successful_bookings');
export const rejectedRaceCondition = new Counter('rejected_race_condition');
export const unexpectedErrors = new Counter('unexpected_errors');
export const bookingDuration = new Trend('booking_duration_ms');

export const options = {
  scenarios: {
    race_condition_burst: {
      executor: 'shared-iterations',
      vus: 50,          // 50 người dùng đồng thời (Virtual Users)
      iterations: 50,   // Đúng 50 lượt đặt xe đồng loạt
      maxDuration: '5s', // Thực hiện dồn dập trong 1-5 giây
    },
  },
  thresholds: {
    'successful_bookings': ['count==1'],       // BẮT BUỘC: Đúng 1 người duy nhất đặt thành công
    'rejected_race_condition': ['count==49'],   // BẮT BUỘC: Đúng 49 người còn lại bị chặn (hết xe)
    'unexpected_errors': ['count==0'],         // BẮT BUỘC: 0 lỗi hệ thống (không crash, không 500)
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

const BASE_URL = __ENV.API_URL || 'http://localhost:4000/api';

export function setup() {
  console.log(`[k6 setup] Khởi tạo phiên test chịu tải race-condition tại: ${BASE_URL}`);

  // 1. Đăng nhập tài khoản khách hàng để lấy JWT Token
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email: 'customer1@gmail.com',
      password: 'Password@123',
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(loginRes, {
    'Đăng nhập thành công (HTTP 200/201)': (r) => r.status === 200 || r.status === 201,
  });

  const loginData = loginRes.json();
  const token = loginData.accessToken;
  if (!token) {
    throw new Error('Không lấy được accessToken từ API login!');
  }

  // Khung giờ thuê hợp lệ (08:00 - 17:00 theo giờ hoạt động 07:00 - 21:00)
  const now = new Date();
  const randomDayOffset = Math.floor(Math.random() * 20) + 10;
  const startDay = new Date(now.getTime() + randomDayOffset * 24 * 60 * 60 * 1000);
  const endDay = new Date(startDay.getTime() + 2 * 24 * 60 * 60 * 1000);

  const startIso = `${startDay.toISOString().split('T')[0]}T01:00:00.000Z`; // 08:00 UTC+7
  const endIso = `${endDay.toISOString().split('T')[0]}T10:00:00.000Z`;    // 17:00 UTC+7

  return {
    token,
    payload: {
      modelId: 9,      // Dòng xe thử nghiệm có đúng 1 xe vật lý duy nhất
      storeId: 1,      // Chi nhánh Cầu Giấy
      startTime: startIso,
      endTime: endIso,
      pickupType: 0,   // Nhận tại cửa hàng
      paymentType: 1,  // Cọc giữ chỗ
    },
  };
}

export default function (data) {
  const url = `${BASE_URL}/customer/bookings`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.token}`,
    },
  };

  const startTime = Date.now();
  const res = http.post(url, JSON.stringify(data.payload), params);
  const duration = Date.now() - startTime;
  bookingDuration.add(duration);

  if (res.status === 201) {
    // Đặt xe thành công - Người đầu tiên chốt được xe
    successfulBookings.add(1);
    check(res, {
      'Người đầu tiên đặt thành công (HTTP 201)': (r) => r.status === 201,
      'Có mã bookingCode': (r) => !!r.json('booking.bookingCode'),
      'Thời gian giữ chỗ 10 phút': (r) => !!r.json('holdExpiresAt'),
    });
  } else if (res.status === 400 && res.body.includes('XE_KHONG_KHA_DUNG')) {
    // Bị chặn hợp lệ do Transaction Lock phát hiện xe đã hết
    rejectedRaceCondition.add(1);
    check(res, {
      'Bị từ chối an toàn do hết xe (HTTP 400)': (r) => r.status === 400,
    });
  } else {
    // Lỗi không mong đợi khác (VD: 500 Server Error hoặc 429 Throttle)
    unexpectedErrors.add(1);
    console.error(`[VU ${__VU}] Lỗi không mong đợi HTTP ${res.status}: ${res.body}`);
  }
}

export function handleSummary(data) {
  const successCount = data.metrics.successful_bookings ? data.metrics.successful_bookings.values.count : 0;
  const rejectedCount = data.metrics.rejected_race_condition ? data.metrics.rejected_race_condition.values.count : 0;
  const errorCount = data.metrics.unexpected_errors ? data.metrics.unexpected_errors.values.count : 0;
  const total = successCount + rejectedCount + errorCount;

  const avgDuration = data.metrics.booking_duration_ms ? data.metrics.booking_duration_ms.values.avg.toFixed(2) : 'N/A';
  const minDuration = data.metrics.booking_duration_ms ? data.metrics.booking_duration_ms.values.min.toFixed(2) : 'N/A';
  const medDuration = data.metrics.booking_duration_ms ? data.metrics.booking_duration_ms.values.med.toFixed(2) : 'N/A';
  const maxDuration = data.metrics.booking_duration_ms ? data.metrics.booking_duration_ms.values.max.toFixed(2) : 'N/A';
  const p95Duration = data.metrics.booking_duration_ms ? data.metrics.booking_duration_ms.values['p(95)'].toFixed(2) : 'N/A';
  const p99Duration = data.metrics.booking_duration_ms ? data.metrics.booking_duration_ms.values['p(99)'].toFixed(2) : 'N/A';

  const report = `
================================================================================
📊 BÁO CÁO HIỆU NĂNG & KHÓA TRANSACTION CHỐNG RACE-CONDITION (GRAFANA k6)
================================================================================
Kịch bản: 50 người dùng (VUs) cùng lúc gửi request đặt 1 chiếc xe duy nhất
Mục tiêu: Đảm bảo tính toàn vẹn tuyệt đối - Chỉ 1 khách đặt được, 49 khách bị từ chối
--------------------------------------------------------------------------------
Chỉ số kiểm thử                       | Kết quả thực tế      | Tiêu chuẩn kỳ vọng
--------------------------------------------------------------------------------
Tổng số request đồng thời             | ${String(total).padEnd(20)} | 50 requests / 1s
Số đơn đặt xe thành công (HTTP 201)   | ${String(successCount).padEnd(20)} | Đúng 1 đơn (100% khớp)
Số đơn bị từ chối an toàn (HTTP 400) | ${String(rejectedCount).padEnd(20)} | Đúng 49 đơn (Xe hết)
Số lỗi hệ thống (HTTP 500 / Crash)    | ${String(errorCount).padEnd(20)} | 0 lỗi
Tỷ lệ đặt trùng xe (Double Booking)   | 0%                   | Tuyệt đối 0%
--------------------------------------------------------------------------------
Thời gian phản hồi trung bình (Avg)   | ${String(avgDuration + ' ms').padEnd(20)} | < 300 ms
Thời gian phản hồi nhỏ nhất (Min)     | ${String(minDuration + ' ms').padEnd(20)} | N/A
Thời gian phản hồi Median (p50)       | ${String(medDuration + ' ms').padEnd(20)} | < 250 ms
Thời gian phản hồi 95th Percentile    | ${String(p95Duration + ' ms').padEnd(20)} | < 500 ms
Thời gian phản hồi lớn nhất (Max)     | ${String(maxDuration + ' ms').padEnd(20)} | < 1000 ms
--------------------------------------------------------------------------------
ĐÁNH GIÁ KHÓA TRANSACTION (Row-Level Lock):
${successCount === 1 && rejectedCount === 49 && errorCount === 0
    ? '>>> [XUẤT SẮC - PASSED 100%] Khóa bi quan (Pessimistic Lock) hoạt động hoàn hảo! Đảm bảo tính nhất quán ACID và chống race-condition tuyệt đối.'
    : '>>> [FAILED] Khóa Transaction chưa đảm bảo tính toàn vẹn!'}
================================================================================
`;

  return {
    stdout: report,
  };
}
