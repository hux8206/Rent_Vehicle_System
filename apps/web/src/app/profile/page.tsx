"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { VIETNAMESE_BANKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CreditCard,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Lock,
  Loader2,
  Trash2,
  RefreshCw,
  Shield,
  Store,
  Wallet,
  ArrowRight,
  Bike,
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bankAccountNum, setBankAccountNum] = useState("");
  const [bankName, setBankName] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setPhone(user.phone || "");
      setBankAccountNum(user.bankAccountNum || "");
      setBankName(user.bankName || "");
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      toast.error("Vui lòng điền đầy đủ họ tên và số điện thoại!");
      return;
    }

    setIsSaving(true);
    try {
      await api.auth.updateProfile({
        fullName,
        phone,
        bankAccountNum: bankAccountNum || undefined,
        bankName: bankName || undefined,
      });
      await refreshUser();
      toast.success("Cập nhật thông tin hồ sơ thành công!");
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabels: Record<number, { label: string; badge: string; color: string; desc: string }> = {
    0: {
      label: "Admin Sàn",
      badge: "Ban Quản Trị Sàn",
      color: "bg-red-50 text-red-700 border-red-200",
      desc: "Quản lý toàn quyền hệ thống, phê duyệt đối tác và giám sát luồng thanh toán.",
    },
    1: {
      label: "Đối Tác Xe",
      badge: "Chủ Xe Đối Tác",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      desc: "Kinh doanh cho thuê xe, quản lý biển số vật lý và nhận thanh toán doanh thu.",
    },
    2: {
      label: "Khách Hàng",
      badge: "Khách Thuê Tự Lái",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      desc: "Thuê xe máy, ô tô tự lái giữ chỗ 10 phút và quét mã VietQR.",
    },
  };

  const currentRole = user?.role !== undefined ? user.role : 2;

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Hồ Sơ Cá Nhân
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Thông Tin Tài Khoản & Phân Quyền
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {roleLabels[currentRole]?.desc}
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Section 1: Basic Information (Common to all roles) */}
          <Card className="rounded-3xl border-slate-200/90 shadow-xs bg-white overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" /> Thông Tin Cơ Bản
                </CardTitle>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold py-1 px-3 ${roleLabels[currentRole]?.color}`}
                >
                  {roleLabels[currentRole]?.badge}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Họ và tên</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="text-xs h-10 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Số điện thoại liên hệ</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912345678"
                    className="text-xs h-10 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-700">Địa chỉ Email đăng nhập</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="text-xs h-10 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400">
                    Email là mã định danh tài khoản cố định và không thể thay đổi.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ─── ROLE-SPECIFIC SECTIONS ──────────────────────────────── */}

          {/* ROLE 2: Customer - Privacy Notice */}
          {currentRole === 2 && (
            <Card className="rounded-3xl border-emerald-200 shadow-xs bg-emerald-50/50 overflow-hidden">
              <CardContent className="p-6 flex items-start gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-emerald-950 text-sm">Bảo Mật Dữ Liệu Khách Hàng</h4>
                  <p className="text-emerald-800 leading-relaxed">
                    Hệ thống không lưu trữ hình ảnh Giấy phép lái xe cá nhân trên máy chủ để đảm bảo an toàn tuyệt đối thông tin riêng tư. Khi nhận xe thực tế tại cửa hàng, Quý khách chỉ cần xuất trình bằng lái xe chính chủ bản gốc để nhân viên đối chiếu trực tiếp.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ROLE 1: Partner - Banking Info & Quick Navigation */}
          {currentRole === 1 && (
            <Card className="rounded-3xl border-slate-200/90 shadow-xs bg-white overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-600" /> Tài Khoản Ngân Hàng Nhận Tiền Thuê (Đối tác)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Thông tin nhận tiền chuyển khoản và quyết toán doanh thu từ sàn VehicleRent.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Tên ngân hàng thụ hưởng</Label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="">-- Chọn ngân hàng thụ hưởng --</option>
                      {VIETNAMESE_BANKS.map((b) => (
                        <option key={b.code} value={b.shortName}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Số tài khoản nhận tiền</Label>
                    <Input
                      value={bankAccountNum}
                      onChange={(e) => setBankAccountNum(e.target.value)}
                      placeholder="9876543210"
                      className="text-xs h-10 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t flex flex-wrap gap-3">
                  <Link href="/partner/vehicles">
                    <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5 border-amber-300 text-amber-800">
                      <Bike className="h-4 w-4" /> Quản lý Dòng xe & Biển số
                    </Button>
                  </Link>
                  <Link href="/partner/wallet">
                    <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1.5 border-amber-300 text-amber-800">
                      <Wallet className="h-4 w-4" /> Ví Đối Tác & Nạp Tiền
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ROLE 0: Admin - System Privileges Card */}
          {currentRole === 0 && (
            <Card className="rounded-3xl border-slate-200/90 shadow-xs bg-white overflow-hidden">
              <CardHeader className="p-6 pb-4 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" /> Đặc Quyền Quản Trị Viên Toàn Hệ Thống
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Tài khoản của bạn có cấp quyền cao nhất (SuperAdmin).
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200 text-red-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-red-600" /> Duyệt Cửa Hàng
                    </div>
                    <p className="text-[11px] text-red-700">Phê duyệt hoặc từ chối đối tác mở điểm thuê xe.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" /> Quản Trị Users
                    </div>
                    <p className="text-[11px] text-blue-700">Kiểm tra thông tin định danh và khóa tài khoản vi phạm.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Đối Soát Doanh Thu
                    </div>
                    <p className="text-[11px] text-emerald-700">Theo dõi dòng tiền, cọc và hoa hồng 10% tự động.</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-start">
                  <Link href="/admin">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl gap-1.5">
                      Đến Bảng Điều Khiển Quản Trị Sàn <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-11 px-8 rounded-xl shadow-md cursor-pointer"
            >
              {isSaving ? "Đang lưu thay đổi..." : "Lưu Thay Đổi Hồ Sơ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
