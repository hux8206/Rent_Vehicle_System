import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vehicle Rental Platform - Hệ Thống Thuê Xe Trực Tuyến Đa Đối Tác",
  description:
    "Nền tảng kết nối đối tác cho thuê xe và khách hàng, giữ chỗ 10 phút, thanh toán tự động qua VietQR.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen antialiased bg-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}

