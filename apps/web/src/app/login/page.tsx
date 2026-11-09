"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Bike, Mail, Lock, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const errorParam = searchParams.get("error");

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  useEffect(() => {
    if (errorParam === "unauthorized") {
      setFieldErrors({ general: "Vui lòng đăng nhập để tiếp tục truy cập trang này." });
    } else if (errorParam === "forbidden") {
      setFieldErrors({ general: "Tài khoản của bạn không có quyền truy cập vào phân hệ này." });
    }
  }, [errorParam]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; password?: string; general?: string } = {};

    if (!email.trim()) {
      errors.email = "Vui lòng nhập địa chỉ email.";
    }
    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setFieldErrors({});

    try {
      const loggedUser = await login(email.trim(), password);
      toast.success(`Đăng nhập thành công! Chào mừng ${loggedUser.fullName}.`);

      // Intelligent Redirection based on role
      if (loggedUser.role === 0) {
        router.push("/admin");
      } else if (loggedUser.role === 1) {
        try {
          const stores = await api.partner.getStores();
          const hasActiveStore = stores.some((s) => s.status === 1);
          if (hasActiveStore) {
            router.push("/partner");
          } else {
            router.push("/partner/onboarding");
          }
        } catch {
          router.push("/partner/onboarding");
        }
      } else {
        if (callbackUrl && !callbackUrl.startsWith("/admin") && !callbackUrl.startsWith("/partner")) {
          router.push(callbackUrl);
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      const msg = err.message || "Email hoặc mật khẩu không chính xác.";
      setFieldErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Back to Home Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
      </Link>

      <Card className="rounded-3xl border-slate-200/90 shadow-xl overflow-hidden bg-white">
        <CardContent className="p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="rounded-xl bg-blue-600 p-2 text-white shadow-md">
                <Bike className="h-5 w-5" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                VehicleRent
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Đăng Nhập
            </h1>
            <p className="text-xs text-slate-500">
              Chào mừng bạn trở lại! Nhập thông tin tài khoản để tiếp tục.
            </p>
          </div>

          {/* General Error Banner */}
          {fieldErrors.general && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                fieldErrors.general.toLowerCase().includes("khóa") ||
                fieldErrors.general.toLowerCase().includes("khoá")
                  ? "bg-red-50/90 border-red-300 text-red-900 shadow-xs"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {fieldErrors.general.toLowerCase().includes("khóa") ||
              fieldErrors.general.toLowerCase().includes("khoá") ? (
                <div className="h-8 w-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Lock className="h-4 w-4" />
                </div>
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              )}
              <div className="space-y-0.5">
                {(fieldErrors.general.toLowerCase().includes("khóa") ||
                  fieldErrors.general.toLowerCase().includes("khoá")) && (
                  <div className="font-black text-red-950 text-xs">
                    Tài khoản đã bị khóa bởi Quản trị viên
                  </div>
                )}
                <div className="font-medium leading-relaxed">{fieldErrors.general}</div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Email</Label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  className={`pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${
                    fieldErrors.email ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-700">Mật khẩu</Label>
                <span className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                  Quên mật khẩu?
                </span>
              </div>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  className={`pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${
                    fieldErrors.password ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-md shadow-blue-600/25 transition-all mt-2"
            >
              {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-bold text-blue-600 hover:underline">
              Đăng ký ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50/40">
      <Suspense fallback={<div className="text-center py-12 text-xs">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
