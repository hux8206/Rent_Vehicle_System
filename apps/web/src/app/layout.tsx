import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-heading",
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
    <html lang="vi" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen flex flex-col antialiased bg-slate-50 text-slate-900 font-sans">
        <AuthProvider>
          <Suspense fallback={<div className="h-16 border-b bg-white" />}>
            <Navbar />
          </Suspense>
          <main className="flex-1">{children}</main>
          <Footer />
          <CookieConsentBanner />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
