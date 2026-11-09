"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bike, Mail, Lock, User, Phone, Store, UserCheck, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") === "partner" ? "partner" : "customer";

  const { registerCustomer, registerPartner } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(initialType);

  // Form fields (unified minimalist inputs)
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    phone?: string;
    email?: string;
    password?: string;
    general?: string;
  }>({});

  const validate = () => {
    const errors: typeof fieldErrors = {};
    if (!fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên.";
    if (!phone.trim()) errors.phone = "Vui lòng nhập số điện thoại.";
    else if (!/^[0-9+ ]{9,15}$/.test(phone.trim())) errors.phone = "Số điện thoại không hợp lệ.";
    if (!email.trim()) errors.email = "Vui lòng nhập email.";
    else if (!/\S+@\S+\.\S+/.test(email.trim())) errors.email = "Định dạng email không hợp lệ.";
    if (!password) errors.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6) errors.password = "Mật khẩu phải từ 6 ký tự trở lên.";
    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setFieldErrors({});

    try {
      if (activeTab === "partner") {
        await registerPartner({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        });
        toast.success("Đăng ký tài khoản Đối tác thành công! Hãy thiết lập hồ sơ cửa hàng.");
        router.push("/partner/onboarding");
      } else {
        await registerCustomer({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        });
        toast.success("Đăng ký tài khoản Khách thuê thành công! Chào mừng bạn.");
        router.push("/");
      }
    } catch (err: any) {
      const msg = err.message || "Đăng ký thất bại. Email có thể đã được sử dụng.";
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
              Tạo Tài Khoản
            </h1>
            <p className="text-xs text-slate-500">
              Chọn vai trò của bạn để bắt đầu trải nghiệm nền tảng
            </p>
          </div>

          {/* Role Tabs */}
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setFieldErrors({}); }} className="w-full">
            <TabsList className="grid grid-cols-2 mb-5 bg-slate-100 p-1 rounded-2xl">
              <TabsTrigger
                value="customer"
                className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-xs py-2.5 gap-1.5 transition-all"
              >
                <UserCheck className="h-3.5 w-3.5" /> Khách thuê xe
              </TabsTrigger>
              <TabsTrigger
                value="partner"
                className="text-xs font-bold rounded-xl data-[state=active]:bg-white data-[state=active]:text-amber-700 data-[state=active]:shadow-xs py-2.5 gap-1.5 transition-all"
              >
                <Store className="h-3.5 w-3.5" /> Đối tác nhà xe
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* General Error Banner */}
          {fieldErrors.general && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-medium leading-relaxed">{fieldErrors.general}</span>
            </div>
          )}

          {/* Minimalist Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Họ và tên</Label>
              <div className="relative">
                <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined }));
                  }}
                  className={`pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${
                    fieldErrors.fullName ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Số điện thoại</Label>
              <div className="relative">
                <Phone className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="tel"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  className={`pl-10 text-xs h-11 rounded-2xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all ${
                    fieldErrors.phone ? "border-red-500 focus-visible:ring-red-400" : ""
                  }`}
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-[11px] font-semibold text-red-600 pl-1">{fieldErrors.phone}</p>
              )}
            </div>

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
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
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
              <Label className="text-xs font-bold text-slate-700">Mật khẩu</Label>
              <div className="relative">
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
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
              className={`w-full h-11 rounded-2xl text-white font-bold text-xs gap-2 shadow-md transition-all mt-2 ${
                activeTab === "partner"
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
              }`}
            >
              {isLoading
                ? "Đang xử lý..."
                : activeTab === "partner"
                ? "Đăng Ký Đối Tác Nhà Xe"
                : "Đăng Ký Khách Thuê"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Footer Navigation */}
          <div className="text-center pt-4 border-t border-slate-100 text-xs text-slate-500">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-bold text-blue-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-50/40">
      <Suspense fallback={<div className="text-center py-12 text-xs">Đang tải...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
