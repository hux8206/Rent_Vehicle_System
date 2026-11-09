"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "vehiclerent_cookie_consent";

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const hasConsented = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!hasConsented) {
        // Small delay for smooth entry after hydration
        const timer = setTimeout(() => setIsVisible(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback if localStorage is disabled/restricted in environment
      setIsVisible(false);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted_" + new Date().toISOString());
    } catch {
      // Ignore write errors (e.g. private mode quota)
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      role="region"
      aria-label="Thông báo Cookie và Bảo mật"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-2xl border border-slate-700/80 space-y-3.5">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shrink-0 mt-0.5">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-sm">
              <span>Thông báo Cookie & Bảo mật</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <p className="text-slate-300 leading-relaxed">
              VehicleRent sử dụng cookie cần thiết để duy trì phiên đăng nhập và bảo mật giao dịch đặt xe của bạn.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800">
          <Link
            href="/privacy"
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-md py-1 px-1.5 transition-colors"
          >
            Chính sách bảo mật →
          </Link>

          <Button
            type="button"
            size="sm"
            onClick={handleAccept}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-4 rounded-xl shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer"
          >
            Đã hiểu & Chấp nhận
          </Button>
        </div>
      </div>
    </aside>
  );
}

