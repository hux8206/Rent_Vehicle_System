import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Cookie, Key, Sliders, ShieldCheck, Database, Trash2, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Chính Sách Cookie & Phiên Đăng Nhập - VehicleRent",
  description:
    "Tìm hiểu cách VehicleRent sử dụng Cookie và bộ nhớ trình duyệt để duy trì phiên đăng nhập an toàn và tối ưu trải nghiệm tìm kiếm xe.",
};

export default function CookiesPolicyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-4 border border-emerald-100">
            <Cookie className="w-4 h-4 text-emerald-600" />
            Minh bạch công nghệ lưu trữ
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Chính Sách Cookie & Phiên Đăng Nhập
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed">
            Chính sách này giải thích cách thức <strong>VehicleRent</strong> sử dụng Cookie và các công nghệ lưu trữ web (Local Storage, Session Storage) nhằm duy trì phiên đăng nhập, tăng tốc tải trang và bảo vệ an toàn tài khoản của bạn.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>Cập nhật lần cuối: <strong>Tháng 11/2026</strong></span>
            <span>•</span>
            <span>Nguyên tắc: <strong>Không bán dữ liệu hoặc chia sẻ Cookie cho bên quảng cáo thứ ba</strong></span>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-200/80 space-y-8 text-slate-700 text-sm md:text-base leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">1</span>
              <h2>Cookie và Bộ nhớ Web là gì?</h2>
            </div>
            <p>
              <strong>Cookie</strong> và <strong>Web Storage (Local Storage, Session Storage)</strong> là các tệp dữ liệu văn bản nhỏ được lưu trữ trên trình duyệt của máy tính hoặc điện thoại khi bạn truy cập website. Chúng giúp hệ thống ghi nhớ trạng thái tương tác của bạn, tránh việc phải đăng nhập lại mỗi khi chuyển trang và đảm bảo quy trình thanh toán diễn ra mượt mà.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">2</span>
              <h2>Các loại Cookie và Công nghệ lưu trữ tại VehicleRent</h2>
            </div>
            <p>VehicleRent phân loại công nghệ lưu trữ theo các mục đích sử dụng rõ ràng:</p>

            <div className="space-y-3 mt-2 text-sm">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Key className="w-4 h-4 text-emerald-600" />
                  <h3>1. Cookie Xác Thực Phiên & Token Đăng Nhập (Bắt buộc)</h3>
                </div>
                <p className="text-slate-600 text-xs md:text-sm">
                  Lưu trữ JWT (JSON Web Token) được cấp phát sau khi bạn đăng nhập thành công. Token này cho phép bạn truy cập an toàn vào trang Quản lý đơn thuê, Ví đối tác hoặc Bảng điều khiển quản trị mà không cần nhập lại mật khẩu. Token tự động hết hạn sau 7 ngày hoặc ngay khi bạn bấm Đăng xuất.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h3>2. Bộ nhớ Tùy Chọn & Trải Nghiệm (Functional Storage)</h3>
                </div>
                <p className="text-slate-600 text-xs md:text-sm">
                  Ghi nhớ khoảng thời gian nhận - trả xe, vị trí tỉnh/thành phố và phân loại xe (xe số, xe ga, xe côn, ô tô 4 chỗ, 7 chỗ) mà bạn vừa tìm kiếm, giúp bạn không phải chọn lại từ đầu khi quay lại trang chủ.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h3>3. Bảo Vệ An Toàn & Phòng Chống Gian Lận (Security)</h3>
                </div>
                <p className="text-slate-600 text-xs md:text-sm">
                  Ghi nhận dấu hiệu các hành vi tấn công giả mạo (CSRF protection, Rate-limiting headers), ngăn chặn bot tự động quét và tạo đơn ảo làm cạn kiệt số lượng xe khả dụng của các nhà xe.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">3</span>
              <h2>Cam kết KHÔNG sử dụng Cookie theo dõi quảng cáo bên thứ 3</h2>
            </div>
            <p className="text-sm">
              VehicleRent hoạt động dựa trên mô hình sàn giao dịch dịch vụ thuần túy. Chúng tôi <strong>không cài đặt mã theo dõi hành vi xuyên nền tảng (Cross-site tracking)</strong> và không bán cookie cho các mạng lưới quảng cáo tiếp thị lại (remarketing) nhằm bảo đảm trải nghiệm không bị làm phiền cho người dùng.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-lg md:text-xl">
              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">4</span>
              <h2>Cách quản lý hoặc xóa Cookie trên thiết bị của bạn</h2>
            </div>
            <p className="text-sm">
              Bạn có thể dễ dàng quản lý, vô hiệu hóa hoặc xóa sạch Cookie bất cứ lúc nào thông qua cài đặt của trình duyệt:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm text-slate-600">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Google Chrome:</strong> Cài đặt → Quyền riêng tư và bảo mật → Xóa dữ liệu duyệt web / Cookie và dữ liệu trang web khác.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Apple Safari:</strong> Tùy chọn (Preferences) → Quyền riêng tư (Privacy) → Quản lý dữ liệu trang web.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Mozilla Firefox:</strong> Cài đặt → Quyền riêng tư & Bảo mật → Cookie và dữ liệu trang web.
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <strong>Microsoft Edge:</strong> Cài đặt → Cookie và quyền của trang web → Quản lý và xóa cookie.
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex gap-2 items-center">
              <Trash2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                * Lưu ý: Khi bạn bấm <strong>Đăng xuất</strong> trong menu tài khoản, token phiên làm việc sẽ được xóa ngay lập tức khỏi trình duyệt.
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

