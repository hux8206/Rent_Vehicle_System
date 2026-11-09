import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "VehicleRent - Nền Tảng Cho Thuê Xe Trực Tuyến Đa Đối Tác",
  description:
    "Hệ sinh thái cho thuê xe máy, ô tô tự lái: Giữ chỗ 10 phút chống xung đột, thanh toán VietQR động và ví đối tác FIFO.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 border-b bg-white" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
