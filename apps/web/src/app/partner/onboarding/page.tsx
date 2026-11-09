"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Store } from "@/lib/api";
import { VIETNAMESE_BANKS } from "@/lib/constants";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Store as StoreIcon,
  ShieldAlert,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  CreditCard,
  Percent,
  Upload,
  Camera,
  Loader2,
  RefreshCw,
  Trash2,
  Info,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { ProvinceCombobox } from "@/components/common/province-combobox";

function PartnerOnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get("storeId");

  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [store, setStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [storeName, setStoreName] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [phoneContact, setPhoneContact] = useState(user?.phone || "");
  const [description, setDescription] = useState("");
  const [storeImage, setStoreImage] = useState(
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
  );
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chỉ tải lên tệp định dạng hình ảnh!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "img_store");
    setIsUploadingImage(true);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");

      setStoreImage(data.url);
      toast.success("Tải ảnh mặt tiền cửa hàng thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh. Vui lòng thử lại!");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };
  const [depositPercent, setDepositPercent] = useState<number>(15);
  const [minDepositPercent, setMinDepositPercent] = useState<number>(15);
  const [cancelRule, setCancelRule] = useState(
    "Hủy trước 24h được hoàn 100% cọc. Hủy trong vòng 24h giữ lại 50% cọc."
  );
  const [refundCondition, setRefundCondition] = useState(
    "Hoàn tiền qua số tài khoản ngân hàng của đối tác trong vòng 24h làm việc."
  );
  const [openTime, setOpenTime] = useState<string>("07:00");
  const [closeTime, setCloseTime] = useState<string>("21:00");
  const [bankAccountNum, setBankAccountNum] = useState(
    user?.bankAccountNum || "9876543210"
  );
  const [bankName, setBankName] = useState(user?.bankName || "Vietcombank");

  const populateStoreFields = (s: Store, currentMinDeposit: number) => {
    setStore(s);
    setStoreName(s.storeName);
    setProvince(s.province || "");
    setAddress(s.address);
    setPhoneContact(s.phoneContact);
    setDescription(s.description || "");
    setOpenTime(s.openTime || "07:00");
    setCloseTime(s.closeTime || "21:00");
    if (s.storeImage) setStoreImage(s.storeImage);
    if (s.rentalPolicy) {
      setDepositPercent(Number(s.rentalPolicy.depositPercent));
      if (s.rentalPolicy.cancelRule) setCancelRule(s.rentalPolicy.cancelRule);
      if (s.rentalPolicy.refundCondition) setRefundCondition(s.rentalPolicy.refundCondition);
    } else {
      setDepositPercent(currentMinDeposit);
    }
  };

  useEffect(() => {
    async function loadStore() {
      setIsLoading(true);
      try {
        const [storesData, sysConfig] = await Promise.all([
          api.partner.getStores(),
          api.config.get(),
        ]);
        setStores(storesData || []);

        const currentMinDeposit =
          sysConfig?.minDepositPercent !== undefined
            ? Number(sysConfig.minDepositPercent)
            : 15;
        setMinDepositPercent(currentMinDeposit);

        if (storesData && storesData.length > 0) {
          const targetStoreId = queryStoreId
            ? Number(queryStoreId)
            : typeof window !== "undefined" && localStorage.getItem("active_partner_store_id")
            ? Number(localStorage.getItem("active_partner_store_id"))
            : null;

          let s = targetStoreId
            ? (storesData || []).find((item) => item.id === targetStoreId) || null
            : null;

          if (!s) s = storesData[0];

          if (typeof window !== "undefined") {
            localStorage.setItem("active_partner_store_id", String(s.id));
            localStorage.setItem("active_partner_store_name", s.storeName);
          }

          populateStoreFields(s, currentMinDeposit);
        } else {
          setDepositPercent(currentMinDeposit);
        }
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    loadStore();
  }, [queryStoreId]);

  const handleSelectStore = (selected: Store) => {
    populateStoreFields(selected, minDepositPercent);
    if (typeof window !== "undefined") {
      localStorage.setItem("active_partner_store_id", String(selected.id));
      localStorage.setItem("active_partner_store_name", selected.storeName);
    }
    router.replace(`/partner/onboarding?storeId=${selected.id}`);
  };

  const handleSubmitOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !address || !phoneContact || !bankAccountNum || !bankName) {
      toast.error("Vui lòng điền đầy đủ các trường thông tin bắt buộc!");
      return;
    }

    if (depositPercent < minDepositPercent) {
      toast.error(
        `Mức cọc không được thấp hơn mức tối thiểu do sàn quy định (${minDepositPercent}%)`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      if (store && store.status === 1) {
        // Kiểm tra xem có thông tin nào thay đổi so với hiện tại không
        const isStoreNameChanged = storeName.trim() !== store.storeName.trim();
        const isProvinceChanged = province.trim() !== (store.province || "").trim();
        const isAddressChanged = address.trim() !== store.address.trim();
        const isPhoneChanged = phoneContact.trim() !== store.phoneContact.trim();
        const isDescChanged = (description || "").trim() !== (store.description || "").trim();
        const isImageChanged = (storeImage || "").trim() !== (store.storeImage || "").trim();
        const isDepositChanged = Number(depositPercent) !== Number(store.rentalPolicy?.depositPercent || 0);
        const isCancelRuleChanged = (cancelRule || "").trim() !== (store.rentalPolicy?.cancelRule || "").trim();
        const isBankNumChanged = (bankAccountNum || "").trim() !== (user?.bankAccountNum || "").trim();
        const isBankNameChanged = (bankName || "").trim() !== (user?.bankName || "").trim();
        const isOpenTimeChanged = (openTime || "").trim() !== (store.openTime || "").trim();
        const isCloseTimeChanged = (closeTime || "").trim() !== (store.closeTime || "").trim();

        const hasAnyChange =
          isStoreNameChanged ||
          isProvinceChanged ||
          isAddressChanged ||
          isPhoneChanged ||
          isDescChanged ||
          isImageChanged ||
          isDepositChanged ||
          isCancelRuleChanged ||
          isBankNumChanged ||
          isBankNameChanged ||
          isOpenTimeChanged ||
          isCloseTimeChanged;

        if (!hasAnyChange) {
          toast.info("Thông tin chi nhánh không có gì thay đổi so với hiện tại, không cần gửi yêu cầu cập nhật!");
          setIsSubmitting(false);
          return;
        }

        // Cửa hàng ĐÃ ĐƯỢC DUYỆT (Active):
        // Gửi yêu cầu cập nhật thông tin (StoreUpdateRequest), KHÔNG tạo bản sao chi nhánh mới!
        await api.partner.requestStoreUpdate(store.id, {
          storeName,
          province: province.trim() || undefined,
          address,
          phoneContact,
          description,
          storeImage,
          depositPercent,
          cancelRule,
          bankAccountNum,
          bankName,
          openTime,
          closeTime,
        });
        toast.success(
          "Đã gửi yêu cầu thay đổi thông tin chi nhánh lên Ban quản trị sàn phê duyệt! Admin duyệt sẽ cập nhật vào chi nhánh hiện tại mà không tạo chi nhánh mới."
        );
      } else if (store && (store.status === 0 || store.status === 2)) {
        // Cửa hàng đang chờ duyệt hoặc bị từ chối: Cập nhật thông tin chi nhánh hiện tại
        const updated = await api.partner.updateStore(store.id, {
          storeName,
          province: province.trim() || undefined,
          address,
          phoneContact,
          description,
          storeImage,
          openTime,
          closeTime,
        });
        await api.partner.upsertRentalPolicy(store.id, {
          depositPercent,
          cancelRule,
          refundCondition,
        });
        setStore(updated);
        toast.success(
          store.status === 2
            ? "Đã cập nhật lại thông tin hồ sơ và gửi lại xét duyệt!"
            : "Đã cập nhật thông tin hồ sơ chi nhánh chờ duyệt thành công!"
        );
      } else {
        // Chưa có chi nhánh nào: Đăng ký chi nhánh đầu tiên
        const created = await api.partner.createStore({
          storeName,
          province: province.trim() || undefined,
          address,
          phoneContact,
          description,
          storeImage,
          depositPercent,
          cancelRule,
          refundCondition,
          bankAccountNum,
          bankName,
          openTime,
          closeTime,
        });
        setStore(created);
        toast.success("Đã gửi hồ sơ cửa hàng! Đang chờ Admin sàn phê duyệt.");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể lưu thông tin cửa hàng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return {
          title: "Đang chờ Admin phê duyệt (PENDING)",
          desc: "Hồ sơ cửa hàng của bạn đã được gửi lên ban quản trị sàn. Quá trình kiểm duyệt thường diễn ra trong 2-4 giờ làm việc.",
          badge: <Badge className="bg-amber-500 text-white gap-1"><Clock className="h-3 w-3" /> Chờ duyệt (Pending)</Badge>,
          color: "border-amber-200 bg-amber-50/40 text-amber-900",
        };
      case 1:
        return {
          title: "Cửa hàng đã được phê duyệt (ACTIVE)",
          desc: "Xin chúc mừng! Cửa hàng của bạn đã hoạt động chính thức trên sàn. Bạn có thể thêm dòng xe và đón nhận đơn đặt từ khách hàng.",
          badge: <Badge className="bg-emerald-600 text-white gap-1"><CheckCircle2 className="h-3 w-3" /> Đã duyệt (Active)</Badge>,
          color: "border-emerald-200 bg-emerald-50/40 text-emerald-900",
        };
      case 2:
        return {
          title: "Hồ sơ bị từ chối (REJECTED)",
          desc: `Lý do từ chối: "${store?.rejectReason || "Thông tin cửa hàng chưa hợp lệ hoặc thiếu chứng từ."}". Vui lòng cập nhật lại và gửi lại.`,
          badge: <Badge className="bg-red-600 text-white gap-1"><XCircle className="h-3 w-3" /> Bị từ chối (Rejected)</Badge>,
          color: "border-red-200 bg-red-50/40 text-red-900",
        };
      default:
        return {
          title: "Chưa có cửa hàng",
          desc: "Vui lòng hoàn tất biểu mẫu đăng ký bên dưới để trở thành đối tác chính thức.",
          badge: <Badge variant="outline">Chưa đăng ký</Badge>,
          color: "border-slate-200 bg-slate-50 text-slate-800",
        };
    }
  };

  const statusInfo = getStatusInfo(store ? store.status : -1);

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Link
              href="/partner?mode=owner"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-100/70 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Quay Lại Quản Lý Chi Nhánh (Chủ Cửa Hàng)
            </Link>
          </div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Khu Vực Chủ Cửa Hàng (Master Owner HQ) • Quản Lý Hồ Sơ
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Hồ Sơ Chi Nhánh: {store?.storeName || ""}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Khai báo và cập nhật thông tin cơ sở, ảnh mặt tiền, giờ hoạt động, chính sách cọc và thông tin tài khoản ngân hàng để nhận thanh toán.
          </p>
        </div>

        {/* Branch Selector if partner has multiple stores */}
        {stores.length > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <StoreIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Đang chỉnh sửa hồ sơ chi nhánh:</span>
                <span className="text-[11px] text-slate-500">Mỗi chi nhánh có hồ sơ và ảnh mặt tiền riêng biệt</span>
              </div>
            </div>
            <select
              value={store?.id || ""}
              onChange={(e) => {
                const found = stores.find((s) => s.id === Number(e.target.value));
                if (found) handleSelectStore(found);
              }}
              className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-slate-50 text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-500/20"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.storeName} ({s.status === 1 ? "Đã duyệt" : s.status === 0 ? "Chờ duyệt" : "Bị từ chối"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Current Approval Status Card */}
        {store && (
          <div className={`rounded-2xl border p-5 ${statusInfo.color} shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{statusInfo.title}</span>
                {statusInfo.badge}
              </div>
              <p className="text-xs opacity-90 max-w-xl leading-relaxed">
                {statusInfo.desc}
              </p>
            </div>

            {store.status === 1 && (
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs shrink-0" asChild>
                <a href={`/partner/vehicles?storeId=${store.id}`}>Quản lý Đội xe chi nhánh này</a>
              </Button>
            )}
          </div>
        )}

        {/* Form Container */}
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 border-b bg-slate-50/60">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-700" />
              Thông Tin Cửa Hàng & Thanh Toán
            </CardTitle>
            <CardDescription className="text-xs">
              Mọi thay đổi sẽ được gửi kiểm duyệt để đảm bảo an toàn cho khách thuê xe trên sàn.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmitOnboarding} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <StoreIcon className="h-4 w-4 text-blue-600" /> 1. Cơ sở kinh doanh
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Tên cửa hàng / Nhà xe <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="VD: Nhà Xe Thành Đạt (Chi Nhánh Cầu Giấy)..."
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tỉnh / Thành phố <span className="text-red-500">*</span></Label>
                    <div className="border border-slate-200 rounded-xl px-3 py-1 bg-white">
                      <ProvinceCombobox
                        value={province}
                        onChange={(val) => setProvince(val === "all" ? "" : val)}
                        placeholder="Chọn tỉnh / thành phố..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Số điện thoại liên hệ đối tác <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="090..."
                      value={phoneContact}
                      onChange={(e) => setPhoneContact(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Địa chỉ chi tiết (để khách đến lấy xe) <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>

                  {/* Store Facade Image Upload (Direct file / camera) */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Ảnh mặt tiền cửa hàng / Cơ sở cho thuê</Label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={imageInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {isUploadingImage ? (
                      <div className="h-40 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 flex flex-col items-center justify-center gap-2 text-amber-700">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-xs font-semibold">Đang tải ảnh lên...</span>
                      </div>
                    ) : storeImage ? (
                      <div className="relative h-44 w-full sm:w-96 rounded-2xl overflow-hidden border bg-slate-100 group shadow-xs">
                        <img src={storeImage} alt="Store facade" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <RefreshCw className="h-3.5 w-3.5" /> Đổi ảnh
                          </button>
                          <button
                            type="button"
                            onClick={() => setStoreImage("")}
                            className="bg-red-600 text-white p-1.5 rounded-lg text-xs shadow-xs cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="h-36 w-full sm:w-96 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-400 bg-slate-50/60 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Camera className="h-5 w-5" />
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-bold block text-slate-800">Chụp ảnh hoặc Tải ảnh mặt tiền</span>
                          <span className="text-[10px] text-slate-400">JPG, PNG, WEBP (Tối đa 10MB)</span>
                        </div>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Giới thiệu cửa hàng</Label>
                    <Textarea
                      placeholder="Giới thiệu về kinh nghiệm, các dòng xe nổi bật, dịch vụ giao xe..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:col-span-2 pt-2 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Giờ mở cửa đón khách (HH:mm)</Label>
                      <Input
                        type="time"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        className="text-xs font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Giờ đóng cửa (HH:mm)</Label>
                      <Input
                        type="time"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        className="text-xs font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rental Policy */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-emerald-600" /> 2. Chính sách cọc & Hoàn hủy
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tỷ lệ tiền cọc (%) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      min={minDepositPercent}
                      max="100"
                      value={depositPercent}
                      onChange={(e) => setDepositPercent(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-semibold">Quy định hủy đơn & Hoàn cọc</Label>
                    <Input
                      value={cancelRule}
                      onChange={(e) => setCancelRule(e.target.value)}
                      placeholder="VD: Hủy trước 24h được hoàn 100%..."
                    />
                  </div>
                </div>
              </div>

              {/* Bank Info for Commission & Payouts */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-indigo-600" /> 3. Tài khoản ngân hàng nhận tiền
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Số tài khoản ngân hàng <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Số tài khoản chính chủ..."
                      value={bankAccountNum}
                      onChange={(e) => setBankAccountNum(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Ngân hàng thụ hưởng <span className="text-red-500">*</span></Label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
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
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 px-6 rounded-xl shadow-xs"
                >
                  {isSubmitting
                    ? "Đang lưu..."
                    : store?.status === 1
                    ? "Gửi Yêu Cầu Cập Nhật (Admin Duyệt)"
                    : store
                    ? "Lưu Thay Đổi Hồ Sơ Chờ Duyệt"
                    : "Gửi Hồ Sơ Đăng Ký Đối Tác"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PartnerOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <PartnerOnboardingContent />
    </Suspense>
  );
}

