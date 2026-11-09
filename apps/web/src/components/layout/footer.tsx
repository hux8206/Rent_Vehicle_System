import React from "react";
import Link from "next/link";
import { Bike, ShieldCheck, QrCode, Clock, Scale, Building2, MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300 pt-12 pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-blue-600 p-1.5 text-white">
                <Bike className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">VehicleRent</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Nền tảng công nghệ cho thuê xe trực tuyến đa đối tác. Giữ chỗ 10 phút chống xung đột,
              thanh toán VietQR tự động và trừ hoa hồng ví theo cơ chế FIFO.
            </p>
          </div>

          {/* Customer Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Khách Hàng</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/" className="hover:text-white transition-colors">Tìm kiếm dòng xe</Link></li>
              <li><Link href="/stores" className="hover:text-white transition-colors">Danh sách cửa hàng đối tác</Link></li>
              <li><Link href="/customer/bookings" className="hover:text-white transition-colors">Lịch sử đơn thuê</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">Hồ sơ cá nhân</Link></li>
            </ul>
          </div>

          {/* Partner Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Đối Tác (Partner)</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/partner/onboarding" className="hover:text-white transition-colors">Đăng ký cửa hàng (Onboarding)</Link></li>
              <li><Link href="/partner/vehicles" className="hover:text-white transition-colors">Quản lý dòng xe & Biển số</Link></li>
              <li><Link href="/partner/bookings" className="hover:text-white transition-colors">Quản lý đơn thuê & Bàn giao</Link></li>
              <li><Link href="/partner/wallet" className="hover:text-white transition-colors">Ví đối tác & Nạp VietQR</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              Pháp Lý & Chính Sách
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/terms" className="hover:text-white transition-colors font-medium text-slate-300">
                  Điều khoản & Phạt nguội
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors font-medium text-slate-300">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-white transition-colors font-medium text-slate-300">
                  Hủy chuyến & Hoàn tiền cọc
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Chính sách Cookie & Phiên
                </Link>
              </li>
            </ul>
          </div>

          {/* System & Standards */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Hệ Thống</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Worker quét hủy 10 phút tự động</span>
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Webhook VietQR tức thời (PayOS)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
                <span>Bàn giao theo biển số thực tế</span>
              </div>
            </div>
          </div>
        </div>

        {/* Operator Information & Contact (Decree 52 & Decree 85 Compliance) */}
        <div className="py-6 border-b border-slate-800 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-blue-400 shrink-0 mt-0.5">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Đơn vị vận hành
                </p>
                <p className="text-slate-200 font-semibold text-sm leading-snug">
                  Dự án Nền tảng Cho thuê xe tự lái VehicleRent
                </p>
                <p className="text-slate-400">
                  <span className="text-slate-300 font-medium">Đại diện quản lý:</span> Nguyễn Văn Hữu
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Địa chỉ liên hệ
                </p>
                <p className="text-slate-200 font-medium leading-relaxed">
                  phường Cẩm Lệ, TP. Đà Nẵng
                </p>
                <p className="text-[11px] text-slate-500">Khu vực điều hành và hỗ trợ mạng lưới đối tác</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-amber-400 shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Hotline hỗ trợ
                </p>
                <a
                  href="tel:0384340974"
                  className="text-amber-400 hover:text-amber-300 font-bold text-sm transition-colors inline-block"
                >
                  0384 340 974
                </a>
                <p className="text-[11px] text-slate-500">Hỗ trợ 24/7 đặt xe & xử lý sự cố phát sinh</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  Email hỗ trợ
                </p>
                <a
                  href="mailto:huunguyen0802@gmail.com"
                  className="text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors break-all inline-block"
                >
                  huunguyen0802@gmail.com
                </a>
                <p className="text-[11px] text-slate-500">Phản hồi khiếu nại & pháp lý trong vòng 24h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 VehicleRent Platform. Sàn thương mại điện tử cho thuê xe máy & ô tô tự lái.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1.5 text-xs text-slate-400">
            <Link href="/terms" className="hover:text-white transition-colors">Điều khoản dịch vụ</Link>
            <span>•</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <span>•</span>
            <Link href="/refund" className="hover:text-white transition-colors">Hủy & Hoàn cọc</Link>
            <span>•</span>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
