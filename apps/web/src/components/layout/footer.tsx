import React from "react";
import Link from "next/link";
import { Bike, ShieldCheck, HeartHandshake, Zap, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-900 text-slate-300 pt-12 pb-8 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          <div className="space-y-3 md:col-span-1">
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

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Khách Hàng</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/" className="hover:text-white transition-colors">Tìm kiếm dòng xe</Link></li>
              <li><Link href="/stores" className="hover:text-white transition-colors">Danh sách cửa hàng đối tác</Link></li>
              <li><Link href="/customer/bookings" className="hover:text-white transition-colors">Lịch sử đơn thuê</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">Hồ sơ cá nhân & GPLX</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Đối Tác (Partner)</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/partner/onboarding" className="hover:text-white transition-colors">Đăng ký cửa hàng (Onboarding)</Link></li>
              <li><Link href="/partner/vehicles" className="hover:text-white transition-colors">Quản lý dòng xe & Biển số</Link></li>
              <li><Link href="/partner/bookings" className="hover:text-white transition-colors">Quản lý đơn thuê & Bàn giao</Link></li>
              <li><Link href="/partner/wallet" className="hover:text-white transition-colors">Ví đối tác & Nạp VietQR</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Hệ Thống</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-400 shrink-0" />
                <span>Worker quét hủy 10 phút tự động</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Webhook VietQR tức thời (PayOS)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0" />
                <span>Bàn giao theo biển số thực tế</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 VehicleRent Platform. Next.js 14 App Router + Shadcn UI.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition-colors">Điều khoản dịch vụ</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">Chính sách bảo mật</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">Hỗ trợ 24/7</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

