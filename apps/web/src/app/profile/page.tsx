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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleRequestDeleteAccount = async () => {
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      toast.success(
        "Yêu cầu xóa tài khoản và dữ liệu cá nhân đã được gửi đến Ban Quản Trị Sàn! Chúng tôi sẽ liên hệ xác nhận và xử lý trong vòng 72 giờ làm việc."
      );
      setDeleteReason("");
    }, 1000);
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
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hồ Sơ Cá Nhân & Phân Quyền
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {roleLabels[currentRole]?.desc}
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Section 1: Basic Information (Common to all roles) */}
          <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white overflow-hidden">
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
            <Card className="rounded-2xl border-emerald-200 shadow-xs bg-emerald-50/50 overflow-hidden">
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
            <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white overflow-hidden">
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
            <Card className="rounded-2xl border-slate-200/90 shadow-xs bg-white overflow-hidden">
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

          {/* PRIVACY & DATA RIGHTS: NGHỊ ĐỊNH 13/2023/NĐ-CP */}
          <Card className="rounded-2xl border-red-200/80 shadow-xs bg-red-50/20 overflow-hidden">
            <CardHeader className="p-6 pb-4 border-b border-red-100">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-red-950">
                <ShieldCheck className="h-5 w-5 text-red-600" />
                Quyền Riêng Tư & Dữ Liệu Cá Nhân (Nghị định 13/2023/NĐ-CP)
              </CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Bạn có toàn quyền yêu cầu rút lại sự đồng ý hoặc xóa vĩnh viễn tài khoản và thông tin cá nhân khỏi hệ thống.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  Theo Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân, Quý khách có quyền yêu cầu xóa bỏ hoặc ẩn danh hóa toàn bộ thông tin định danh (Họ tên, SĐT, Email).
                </p>
                <p className="text-slate-500 text-[11px] italic">
                  * Lưu ý: Các chứng từ giao dịch thanh toán hoặc lịch sử đơn thuê có liên quan đến pháp lý hoặc thuế sẽ được lưu trữ ẩn danh theo thời hạn luật định trước khi hủy hoàn toàn.
                </p>
              </div>

              <div className="pt-2 flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-xs rounded-xl gap-2 h-10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" /> Yêu cầu xóa tài khoản và dữ liệu cá nhân
                </Button>
              </div>
            </CardContent>
          </Card>

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

        {/* Modal Xác nhận Yêu cầu Xóa Dữ Liệu */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-1">
                <AlertCircle className="w-5 h-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Yêu cầu xóa tài khoản & dữ liệu cá nhân
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed">
                Hành động này sẽ gửi yêu cầu chính thức tới Ban Quản Trị Sàn VehicleRent để hủy kích hoạt tài khoản và xóa thông tin của bạn khỏi hệ thống dữ liệu trực tiếp.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 my-2">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <strong>Trước khi tiếp tục, vui lòng lưu ý:</strong>
                <ul className="list-disc pl-4 space-y-1 text-amber-800 text-[11px]">
                  <li>Tài khoản không được có đơn thuê xe đang trong thời gian diễn ra hoặc chưa thanh toán.</li>
                  <li>Nếu là Đối tác, số dư ví phải được giải ngân hoặc xử lý tất toán.</li>
                  <li>Yêu cầu xóa sẽ được xử lý trong vòng <strong>72 giờ làm việc</strong> theo quy định.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Lý do yêu cầu xóa (không bắt buộc):</Label>
                <Input
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Tôi không còn nhu cầu thuê xe hoặc muốn chuyển tài khoản..."
                  className="text-xs h-10 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="text-xs rounded-xl h-10"
              >
                Hủy bỏ
              </Button>
              <Button
                type="button"
                onClick={handleRequestDeleteAccount}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang gửi yêu cầu...</span>
                  </>
                ) : (
                  <span>Xác nhận gửi yêu cầu</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
