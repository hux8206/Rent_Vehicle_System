# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary:** Khách du lịch và người đi công tác đến các thành phố lớn/điểm du lịch (Hà Nội, TP.HCM, Đà Nẵng, v.v.), cần thuê xe máy hoặc ô tô tự lái nhanh chóng, tin cậy, không rườm rà giấy tờ phức tạp.
- **Secondary:** Đối tác chủ nhà xe (Partner) quản lý danh mục xe, kiểm soát biển số xe thực tế và tối ưu công suất xe cho thuê; Quản trị viên sàn (Admin) kiểm duyệt cửa hàng, giám sát giao dịch và hoa hồng.

## Product Purpose
Hệ thống sàn thương mại điện tử kết nối khách thuê xe và đối tác nhà xe đa khu vực, giải quyết triệt để tình trạng đặt trùng xe (double-booking), quy trình cọc thiếu minh bạch và thủ tục đối soát thanh toán thủ công.

## Positioning
Nền tảng cho thuê phương tiện tự lái áp dụng mô hình quản lý kho 2 tầng (Dòng xe trừu tượng - Biển số xe thực tế) kết hợp cơ chế giữ chỗ 10 phút chống xung đột thời gian thực và thanh toán tự động qua VietQR động liên kết ví đối tác khấu trừ FIFO.

## Operating Context
- Người dùng truy cập chủ yếu qua trình duyệt di động hoặc máy tính cá nhân khi chuẩn bị hành trình hoặc ngay khi vừa đáp máy bay/tàu hỏa.
- Môi trường thanh toán: Ứng dụng ngân hàng số quét mã VietQR tự động khớp đơn trong 10 phút.
- Khâu nhận xe: Khách hàng xuất trình GPLX đã xác minh trên web khi nhận bàn giao trực tiếp tại cửa hàng hoặc nhận xe giao tận nơi.

## Capabilities and Constraints
- **Capabilities:**
  - Tìm kiếm và lọc dòng xe theo khoảng thời gian [startTime, endTime], phân loại xe (xe số, tay ga, côn tay, ô tô/xe điện), cửa hàng.
  - Tính chính xác số lượng xe khả dụng theo thời gian thực (tổng xe không bảo dưỡng trừ số xe đang bận/đang giữ chỗ).
  - Giữ chỗ tức thì 10 phút chống tranh chấp chỗ (race condition).
  - Tải lên ảnh 2 mặt Giấy phép lái xe (GPLX) bắt buộc để xác thực danh tính trước khi tạo đơn.
  - Tích hợp thanh toán PayOS / VietQR động: tự động đối soát webhook, cập nhật trạng thái đơn hàng.
  - Quản lý cửa hàng (onboarding), danh mục dòng xe và trạng thái từng biển số xe cho đối tác.
- **Constraints:**
  - Quy tắc 10 phút hết hạn giữ xe (Hold expiry worker chạy ngầm mỗi 1 phút).
  - Hoa hồng sàn 10% tính trên tổng tiền thuê, trừ tự động từ ví đối tác theo cơ chế hạn mức tín dụng và hàng chờ FIFO.
  - Bắt buộc phải có ảnh GPLX hợp lệ mới cho phép giữ chỗ.

## Brand Commitments
- **Name:** VehicleRent Platform
- **Tone:** Hiện đại, tốc độ, minh bạch, an tâm, chuẩn chỉ.
- **Visuals:** Tối ưu độ tương phản, hình ảnh xe sắc nét thực tế, thông số rõ ràng, hiển thị giá niêm yết minh bạch không phụ phí ẩn.

## Evidence on Hand
- API Backend NestJS hoàn thiện tại `apps/api` (`http://localhost:4000/api`, Swagger UI tại `http://localhost:4000/api/docs`).
- Mô hình dữ liệu Prisma MySQL: 12 thực thể (`User`, `Store`, `RentalPolicy`, `VehicleModel`, `VehicleItem`, `Booking`, `BookingDetail`, `PartnerWallet`, `WalletHistory`, `Payment`, `Review`, `Notification`).
- Seed data sẵn có: 4 dòng xe mẫu, 12 xe vật lý thực tế, tài khoản test cho Admin, Partner, Customer.
- Cấu trúc frontend Next.js 14 App Router, Tailwind CSS, Shadcn UI tại `apps/web`.

## Product Principles
1. **Minh bạch và thời gian thực:** Không bao giờ hiển thị xe ảo hoặc cho phép đặt trùng xe; số lượng xe khả dụng luôn phản ánh chính xác theo thời gian thực.
2. **Tối giản thao tác đặt xe (Frictionless):** Tối ưu luồng khách hàng từ tìm kiếm -> chọn xe -> tải ảnh GPLX -> thanh toán VietQR trong vòng chưa đầy 2 phút.
3. **An toàn và xác thực:** Đảm bảo tính pháp lý thông qua lưu trữ ảnh GPLX hai mặt và ràng buộc bàn giao đúng biển số thực tế.
4. **Đối soát tự động:** Không dùng duyệt tiền thủ công; tự động hóa toàn bộ vòng đời thanh toán qua Webhook và xử lý hàng chờ FIFO.

## Accessibility & Inclusion
- Giao diện đáp ứng (responsive) chuẩn mực trên màn hình mobile di động từ 360px đến desktop 4K.
- Trực quan hóa trạng thái đơn hàng và đếm ngược 10 phút với màu sắc, icon và văn bản rõ ràng.

