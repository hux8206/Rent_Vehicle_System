import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật Thông Tin - VehicleRent",
  description:
    "Cam kết bảo vệ dữ liệu cá nhân, thông tin liên hệ và lịch sử giao dịch của khách hàng và đối tác trên sàn VehicleRent.",
};

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-4 border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Văn bản pháp lý sàn TMĐT VehicleRent
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Chính Sách Bảo Mật Thông Tin Cá Nhân
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            VehicleRent cam kết bảo vệ quyền riêng tư và an toàn tuyệt đối cho dữ liệu của Khách thuê xe và Đối tác nhà xe
            theo quy định của pháp luật Việt Nam (Nghị định 52/2013/NĐ-CP, Nghị định 85/2021/NĐ-CP và Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân).
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            <span>Phiên bản: <strong>2.5 (Cập nhật ngày 09/11/2026)</strong></span>
            <span>•</span>
            <span>Phạm vi: <strong>Toàn bộ nền tảng Web & API VehicleRent</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              ✓ Cập nhật ngày 09/11/2026: Bổ sung biểu ngữ Cookie Consent, tối ưu WCAG 2.1 và kiểm soát bí mật API
            </span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200/80 space-y-8 text-slate-700 text-sm md:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">1</span>
              <h2>Mục đích thu thập thông tin</h2>
            </div>
            <p>
              VehicleRent thu thập thông tin của Quý khách nhằm mục đích vận hành dịch vụ sàn giao dịch thương mại điện tử cho thuê phương tiện tự lái, bao gồm:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-600 text-sm">
              <li>Xác thực danh tính tài khoản đăng nhập và phân quyền (Khách hàng, Đối tác nhà xe, Quản trị viên).</li>
              <li>Tạo lập và xử lý đơn đặt xe, theo dõi trạng thái thanh toán cọc tự động qua VietQR PayOS.</li>
              <li>Kết nối liên lạc giữa Khách thuê và Cơ sở cho thuê để thực hiện bàn giao và nhận lại xe thực tế.</li>
              <li>Hỗ trợ khách hàng giải quyết tranh chấp, xử lý sự cố va chạm hoặc thông báo vi phạm luật giao thông (phạt nguội) nếu có.</li>
              <li>Ngăn chặn các hành vi gian lận tài chính, rửa tiền hoặc phá hoại hệ thống.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">2</span>
              <h2>Phạm vi dữ liệu thu thập & Cam kết bảo mật Giấy phép lái xe</h2>
            </div>
            <p>
              Thông tin thu thập trên website bao gồm:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-1">Dành cho Khách thuê:</strong>
                Họ và tên, Số điện thoại liên hệ, Địa chỉ Email, Lịch sử đặt xe và đánh giá trải nghiệm dịch vụ.
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <strong className="text-slate-900 block mb-1">Dành cho Đối tác nhà xe:</strong>
                Tên cơ sở kinh doanh, Địa chỉ cửa hàng, Số tài khoản ngân hàng nhận doanh thu, Giờ hoạt động và danh sách phương tiện.
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 text-sm flex gap-3 items-start mt-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Chính sách đặc biệt về Giấy phép lái xe (GPLX) & Giấy tờ tùy thân:</strong>
                <p className="mt-1 text-amber-800 text-xs leading-relaxed">
                  Để loại bỏ triệt để nguy cơ rò rỉ dữ liệu nhạy cảm trên môi trường trực tuyến, <strong>VehicleRent KHÔNG yêu cầu khách hàng tải ảnh chụp GPLX/CCCD lên hệ thống</strong>. Thay vào đó, Khách hàng có trách nhiệm mang theo bản gốc hợp lệ để Đối tác đối chiếu trực tiếp tại quầy lúc bàn giao chìa khóa xe.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">3</span>
              <h2>Thời gian lưu trữ dữ liệu</h2>
            </div>
            <p>
              Dữ liệu của Quý khách sẽ được lưu trữ an toàn trong suốt thời gian tài khoản còn hoạt động trên sàn. Trường hợp Quý khách đóng tài khoản hoặc gửi yêu cầu xóa dữ liệu, VehicleRent sẽ tiến hành xóa hoặc ẩn danh hóa thông tin, ngoại trừ các chứng từ kế toán, lịch sử giao dịch nạp/rút tiền bắt buộc phải lưu trữ tối thiểu theo luật Kế toán và Thuế hiện hành.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">4</span>
              <h2>Chia sẻ thông tin với bên thứ ba</h2>
            </div>
            <p>
              VehicleRent cam kết không bán, trao đổi hoặc chia sẻ thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích quảng cáo khi chưa có sự đồng ý, ngoại trừ các trường hợp sau:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-sm">
              <li><strong>Đối tác trực tiếp cho thuê xe:</strong> Cung cấp Họ tên và SĐT của người thuê để phục vụ việc giao nhận và bàn giao phương tiện đúng hẹn.</li>
              <li><strong>Cổng thanh toán trung gian:</strong> Chuyển tiếp mã giao dịch và số tiền cọc qua đối tác PayOS/VietQR để sinh mã thanh toán bảo mật.</li>
              <li><strong>Cơ quan pháp luật có thẩm quyền:</strong> Cung cấp hồ sơ đơn thuê và thông tin người điều khiển khi có văn bản yêu cầu chính thức từ cơ quan Công an/Tòa án (đặc biệt trong các vụ việc liên quan đến tai nạn, tranh chấp pháp lý hoặc phạt nguội vi phạm giao thông).</li>
            </ul>
          </section>

          {/* Section 5 - KHAI BÁO TRACKING BÊN THỨ 3 (NGHỊ ĐỊNH 13) */}
          <section className="space-y-4 p-5 md:p-6 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">5</span>
              <h2>Khai báo Đối tác Bên thứ ba & Công nghệ Theo dõi (Tracking)</h2>
            </div>

            <p className="text-sm">
              Tuân thủ Nghị định 13/2023/NĐ-CP, VehicleRent minh bạch toàn bộ các nhà cung cấp dịch vụ hạ tầng kỹ thuật và công nghệ bên thứ ba được tích hợp trên nền tảng:
            </p>

            <div className="space-y-3 text-xs md:text-sm">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>💳 Cổng thanh toán VietQR — PayOS (Công ty Cổ phần PayOS)</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Mục đích:</strong> Tự động tạo mã QR VietQR động theo chuẩn Napas và xử lý webhook đối soát giao dịch cọc đơn thuê, nạp ví đối tác theo thời gian thực.
                  <br />
                  <strong>Dữ liệu truyền tải:</strong> Mã đơn thuê (OrderCode), số tiền cọc/nạp và nội dung chuyển khoản. VehicleRent tuyệt đối không thu thập hoặc lưu trữ thông tin thẻ ngân hàng, tài khoản internet banking hay mã OTP của Quý khách.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 space-y-1">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>☁️ Hạ tầng lưu trữ hình ảnh — Cloudinary (Cloudinary Inc.) & Cloudflare R2</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  <strong>Mục đích:</strong> Lưu trữ và tối ưu hóa tốc độ phân phối ảnh đại diện của cơ sở nhà xe và ảnh các dòng xe máy, ô tô trên nền tảng CDN toàn cầu.
                  <br />
                  <strong>Phạm vi dữ liệu:</strong> Chỉ lưu trữ ảnh phương tiện và ảnh cửa hàng. VehicleRent không lưu trữ hình ảnh giấy tờ tùy thân của khách hàng trên hệ thống CDN này.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cam kết Không Sử Dụng Cookie Tiếp Thị & Tracking Quảng Cáo Xuyên Nền Tảng</span>
                </div>
                <p className="text-emerald-800 text-xs leading-relaxed">
                  VehicleRent <strong>KHÔNG tích hợp</strong> Facebook Pixel, TikTok Pixel, Google Ads Remarketing hay bất kỳ công cụ gián điệp theo dõi hành vi xuyên trang nào để quảng cáo lại. Chúng tôi không bán dữ liệu hành vi tìm kiếm của người dùng cho bên thứ ba.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">6</span>
              <h2>Biện pháp bảo vệ an toàn thông tin</h2>
            </div>
            <p>
              Chúng tôi áp dụng các tiêu chuẩn an ninh kỹ thuật nghiêm ngặt và hiện đại để bảo vệ hệ thống:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm">
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Mật khẩu người dùng được băm một chiều bằng thuật toán <strong>Bcrypt (Salt round 10)</strong>.</span>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Mã hóa đường truyền HTTPS/TLS 1.3 và thiết lập đầy đủ bảo mật Helmet/CSP.</span>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>Phân quyền kiểm soát truy cập đa tầng (Role-Based Access Control) cho Admin, Partner và Customer.</span>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Eye className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <span>Bảo vệ chống tấn công Brute-force & DoS với bộ lọc giới hạn tần suất (Rate Limiting).</span>
              </div>
              <div className="sm:col-span-2 flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span><strong>Quản lý bí mật API (Secrets Management):</strong> Toàn bộ khóa bảo mật kết nối ngân hàng PayOS, CDN Cloudinary và cơ sở dữ liệu được cô lập server-side, bảo vệ nghiêm ngặt qua <code>.gitignore</code> và cam kết không lưu trữ trên kho GitHub công khai.</span>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">7</span>
              <h2>Quyền của người dùng & Thông tin liên hệ</h2>
            </div>
            <p className="text-sm">
              Quý khách có toàn quyền xem, chỉnh sửa thông tin hồ sơ của mình tại mục <Link href="/profile" className="text-blue-600 font-semibold hover:underline">Hồ Sơ Cá Nhân</Link>. Mọi thắc mắc, khiếu nại hoặc yêu cầu hủy bỏ thông tin, vui lòng gửi phản hồi về Ban Quản Trị Sàn:
            </p>
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 text-xs md:text-sm text-slate-700 space-y-1">
              <p><strong>Bộ phận An toàn & Bảo mật Dữ liệu VehicleRent</strong></p>
              <p>Email: <a href="mailto:privacy@vehiclerent.vn" className="text-blue-600 hover:underline">privacy@vehiclerent.vn</a></p>
              <p>Hotline hỗ trợ: <strong>1900 6868 (8:00 - 21:00 hàng ngày)</strong></p>
              <p>Địa chỉ văn phòng: Tòa nhà Công Nghệ VehicleRent, TP. Đà Nẵng, Việt Nam.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

