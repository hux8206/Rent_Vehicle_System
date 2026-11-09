import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  CreditCard,
  Building,
  ArrowLeft,
  CalendarCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Chính Sách Hủy Chuyến & Hoàn Tiền Cọc - VehicleRent",
  description:
    "Quy định minh bạch về đặt cọc, cơ chế giữ chỗ 10 phút, điều kiện hủy đơn và thời gian hoàn tiền cọc trên sàn VehicleRent.",
};

export default function RefundPolicyPage() {
  return (
    <div className="bg-slate-50 min-h-screen py-10 md:py-16">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Navigation / Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về trang chủ
          </Link>
        </div>

        {/* Header Hero */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold mb-4 border border-amber-200">
            <RotateCcw className="w-4 h-4 text-amber-600" />
            Minh bạch tài chính & Quyền lợi khách hàng
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Chính Sách Hủy Chuyến & Hoàn Tiền Cọc
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            Để đảm bảo quyền lợi công bằng cho cả Khách thuê xe và Đối tác nhà xe, VehicleRent áp dụng quy trình đặt cọc tự động qua VietQR và chính sách hoàn tiền minh bạch theo các mốc thời gian rõ ràng.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Tiêu chuẩn: <strong>Hệ thống VietQR tự động & Khấu trừ ví đối tác</strong></span>
            <span>•</span>
            <span>Thời gian xử lý hoàn cọc: <strong>24h - 48h làm việc</strong></span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200/80 space-y-9 text-slate-700 text-sm md:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">1</span>
              <h2>Cơ chế Đặt Cọc & Giữ Chỗ Tự Động 10 Phút</h2>
            </div>
            <p>
              Khi bạn tạo đơn thuê xe trên sàn VehicleRent:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" /> Tỷ lệ đặt cọc đơn thuê:
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tiền cọc được tính theo tỷ lệ phần trăm trên tổng giá trị đơn thuê (tối thiểu 15%, do từng đối tác nhà xe quy định cụ thể trong mục Chính sách của cơ sở).
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-slate-900 block flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" /> Giữ chỗ độc quyền 10 phút:
                </strong>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hệ thống khóa xe vật lý trong vòng 10 phút để bạn quét mã VietQR PayOS. Nếu sau 10 phút chưa thanh toán cọc, đơn sẽ tự động hủy và xe được mở lại cho khách khác.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 - TIMELINE REFUND TABLE */}
          <section className="space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">2</span>
              <h2>Bảng Quy Định Tỷ Lệ Hoàn Tiền Cọc Khi Hủy Chuyến</h2>
            </div>
            <p className="text-sm">
              Trường hợp Khách hàng chủ động yêu cầu hủy đơn đã cọc thành công, mức hoàn tiền cọc được tính căn cứ theo thời điểm gửi yêu cầu so với <strong>Giờ Nhận Xe (Start Time)</strong>:
            </p>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-100/80 text-slate-900 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 md:p-4">Thời điểm hủy đơn</th>
                    <th className="p-3.5 md:p-4">Tỷ lệ hoàn tiền cọc</th>
                    <th className="p-3.5 md:p-4">Ghi chú & Chi phí</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3.5 md:p-4 font-semibold text-emerald-700">
                      Trước giờ nhận xe ≥ 24 giờ
                    </td>
                    <td className="p-3.5 md:p-4 font-bold text-emerald-600">
                      Hoàn 100% tiền cọc
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-500 text-xs">
                      Khách hàng nhận lại đầy đủ tiền cọc (trừ phí cổng thanh toán nếu có).
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="p-3.5 md:p-4 font-semibold text-amber-700">
                      Trước giờ nhận xe từ 12h đến dưới 24h
                    </td>
                    <td className="p-3.5 md:p-4 font-bold text-amber-600">
                      Hoàn 50% tiền cọc
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-500 text-xs">
                      50% tiền cọc còn lại được chuyển bù đắp chi phí giữ xe cho Chủ cửa hàng.
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 bg-rose-50/30">
                    <td className="p-3.5 md:p-4 font-semibold text-rose-700">
                      Dưới 12 giờ hoặc Không đến nhận xe (No-Show)
                    </td>
                    <td className="p-3.5 md:p-4 font-bold text-rose-600">
                      Không hoàn cọc (0%)
                    </td>
                    <td className="p-3.5 md:p-4 text-slate-500 text-xs">
                      100% tiền cọc được bồi hoàn cho Chủ xe để bù đắp thiệt hại chi phí cơ hội.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 - FAULT BY STORE / FORCE MAJEURE */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">3</span>
              <h2>Trường hợp Hủy do Lỗi từ Cửa hàng hoặc Bất khả kháng</h2>
            </div>
            <p>
              Khách hàng được <strong>hoàn tiền cọc 100% ngay lập tức</strong> kèm hỗ trợ tìm phương tiện thay thế nếu rơi vào các trường hợp:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
              <li><strong>Lỗi từ Cửa hàng:</strong> Đến giờ bàn giao xe nhưng cửa hàng không có xe, xe bị sự cố kỹ thuật nghiêm trọng không thể vận hành và cửa hàng không cung cấp được dòng xe tương đương hoặc tốt hơn để thay thế.</li>
              <li><strong>Thông tin xe không đúng mô tả:</strong> Xe giao thực tế sai lệch lớn so với hình ảnh hoặc phân loại dòng xe đã đăng ký trên sàn (ví dụ khách đặt xe ga nhưng giao xe số).</li>
              <li><strong>Sự kiện bất khả kháng:</strong> Bão lũ, thiên tai, sạt lở đường hoặc các lệnh cấm di chuyển chính thức do cơ quan Nhà nước ban hành tại địa phương nhận xe.</li>
            </ul>
          </section>

          {/* Section 4 - REFUND PROCESS & TIME */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">4</span>
              <h2>Quy trình & Thời gian nhận lại Tiền Hoàn Cọc</h2>
            </div>
            <div className="space-y-2.5 text-xs md:text-sm text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-2.5 items-start">
                <span className="font-bold text-blue-600 shrink-0">Bước 1:</span>
                <div>Khách hàng thao tác bấm <strong>Hủy đơn</strong> trong trang <Link href="/customer/bookings" className="text-blue-600 hover:underline font-medium">Lịch sử đơn thuê</Link> hoặc liên hệ Hotline tổng đài <strong>1900 6868</strong>.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-2.5 items-start">
                <span className="font-bold text-blue-600 shrink-0">Bước 2:</span>
                <div>Hệ thống tự động đối chiếu mốc thời gian hủy so với giờ nhận xe để xác định tỷ lệ hoàn cọc (100% hoặc 50%).</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex gap-2.5 items-start">
                <span className="font-bold text-blue-600 shrink-0">Bước 3:</span>
                <div>Bộ phận Kế toán VehicleRent thực hiện lệnh chuyển khoản hoàn tiền về số tài khoản ngân hàng của Quý khách trong vòng <strong>24 giờ - 48 giờ làm việc</strong> (không tính Thứ 7, Chủ nhật và ngày Lễ Tết).</div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold">5</span>
              <h2>Quy định về Tiền Thế Chân / Đặt cọc tài sản khi nhận xe</h2>
            </div>
            <p className="text-sm">
              Ngoài tiền cọc đơn thuê được thanh toán qua PayOS trên web, tại thời điểm nhận xe thực tế tại chi nhánh, tùy theo loại xe (xe máy phân khối lớn hoặc ô tô), cửa hàng có thể yêu cầu giữ Căn cước công dân gốc hoặc tiền cọc giữ xe (thế chân) theo thỏa thuận dân sự. Tiền thế chân này sẽ được cửa hàng <strong>hoàn trả 100% ngay khi khách hàng trả xe nguyên vẹn</strong> theo đúng biên bản bàn giao.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

