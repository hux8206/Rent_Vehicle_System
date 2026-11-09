"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, Store, StoreUpdateRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Store as StoreIcon,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  User,
  Percent,
  AlertCircle,
  ArrowRight,
  FileEdit,
  History,
  Building2,
  Camera,
  PauseCircle,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminStoresPage() {
  // Main view mode: "stores" | "update_requests"
  const [activeMainTab, setActiveMainTab] = useState<"stores" | "update_requests">("stores");

  // Stores state
  const [stores, setStores] = useState<Store[]>([]);
  const [filterStatus, setFilterStatus] = useState<number | undefined>(undefined);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  // Update requests state
  const [updateRequests, setUpdateRequests] = useState<StoreUpdateRequest[]>([]);
  const [filterUpdateStatus, setFilterUpdateStatus] = useState<number | undefined>(undefined);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  // Reject Modals
  const [rejectingStore, setRejectingStore] = useState<Store | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingRequest, setRejectingRequest] = useState<StoreUpdateRequest | null>(null);
  const [requestRejectReason, setRequestRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load stores
  const fetchStores = async () => {
    setIsLoadingStores(true);
    try {
      const data = await api.admin.getStores(filterStatus);
      // Deduplicate stores by ID so every store appears exactly once
      const uniqueStores = Array.from(new Map(data.map((s) => [s.id, s])).values());
      setStores(uniqueStores);
    } catch {
      setStores([]);
    } finally {
      setIsLoadingStores(false);
    }
  };

  // Load update requests
  const fetchUpdateRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await api.admin.getStoreUpdateRequests(filterUpdateStatus);
      setUpdateRequests(data);
    } catch {
      setUpdateRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [filterStatus]);

  useEffect(() => {
    fetchUpdateRequests();
  }, [filterUpdateStatus]);

  // Handle Approve Store Onboarding
  const handleApproveStore = async (storeId: number) => {
    try {
      await api.admin.approveStore(storeId);
      toast.success("Đã phê duyệt cửa hàng đối tác thành công!");
      fetchStores();
    } catch {
      toast.error("Không thể duyệt cửa hàng.");
    }
  };

  // Handle Reject Store Onboarding
  const handleRejectStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingStore || !rejectReason.trim()) return;

    setIsSubmitting(true);
    try {
      await api.admin.rejectStore(rejectingStore.id, rejectReason.trim());
      toast.success("Đã từ chối hồ sơ cửa hàng kèm lý do phản hồi đối tác.");
      setRejectingStore(null);
      setRejectReason("");
      fetchStores();
    } catch {
      toast.error("Không thể từ chối hồ sơ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Approve Update Request
  const handleApproveUpdateRequest = async (requestId: number) => {
    try {
      await api.admin.approveStoreUpdateRequest(requestId);
      toast.success("Đã phê duyệt yêu cầu thay đổi thông tin cửa hàng thành công!");
      fetchUpdateRequests();
      fetchStores();
    } catch (err: any) {
      toast.error(err.message || "Không thể duyệt yêu cầu cập nhật.");
    }
  };

  // Handle Reject Update Request
  const handleRejectUpdateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRequest || !requestRejectReason.trim()) return;

    setIsSubmitting(true);
    try {
      await api.admin.rejectStoreUpdateRequest(rejectingRequest.id, requestRejectReason.trim());
      toast.success("Đã từ chối yêu cầu thay đổi thông tin kèm lý do.");
      setRejectingRequest(null);
      setRequestRejectReason("");
      fetchUpdateRequests();
    } catch (err: any) {
      toast.error(err.message || "Không thể từ chối yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Count pending update requests
  const pendingUpdateCount = updateRequests.filter((r) => r.status === 0).length;

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-600">
              Quản Trị Đối Tác
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Kiểm Duyệt Cửa Hàng & Thông Tin Đối Tác
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Phê duyệt cửa hàng mới đăng ký và kiểm duyệt các yêu cầu thay đổi thông tin cơ sở từ đối tác.
            </p>
          </div>

          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-xs rounded-xl">
              ← Về Dashboard
            </Button>
          </Link>
        </div>

        {/* Primary View Switcher */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveMainTab("stores")}
            className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px ${
              activeMainTab === "stores"
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building2 className="h-4 w-4" />
            Danh Sách Cửa Hàng
          </button>

          <button
            onClick={() => setActiveMainTab("update_requests")}
            className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm transition-all border-b-2 -mb-px ${
              activeMainTab === "update_requests"
                ? "border-red-600 text-red-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileEdit className="h-4 w-4" />
            Duyệt Cập Nhật Thông Tin
            {pendingUpdateCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                {pendingUpdateCount} mới
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: DANH SÁCH CỬA HÀNG */}
        {activeMainTab === "stores" && (
          <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: undefined, label: "Tất cả cửa hàng" },
                { id: 0, label: "Chờ kiểm duyệt (PENDING)" },
                { id: 1, label: "Đã phê duyệt (ACTIVE)" },
                { id: 2, label: "Đã từ chối (REJECTED)" },
              ].map((tab) => (
                <button
                  key={String(tab.id)}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                    filterStatus === tab.id
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Stores List */}
            {isLoadingStores ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Đang tải danh sách cửa hàng...
              </div>
            ) : stores.length === 0 ? (
              <Card className="text-center py-16 rounded-3xl border shadow-xs bg-white p-8">
                <StoreIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Không có cửa hàng nào trong mục này</h3>
              </Card>
            ) : (
              <div className="space-y-4">
                {stores.map((s) => {
                  const isPending = s.status === 0;
                  const isActive = s.status === 1;
                  const isRejected = s.status === 2;

                  return (
                    <Card
                      key={s.id}
                      className={`rounded-2xl border shadow-xs bg-white overflow-hidden transition-all ${
                        isPending ? "border-amber-300 ring-2 ring-amber-500/10" : "border-slate-200"
                      }`}
                    >
                      <CardHeader className="p-5 pb-3 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-900">{s.storeName}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-500">{s.phoneContact}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-[11px] text-slate-400">Mã chi nhánh: #{s.id}</span>
                        </div>

                        <div>
                          {isPending && (
                            <Badge className="bg-amber-500 text-white gap-1 animate-pulse">
                              <Clock className="h-3 w-3" /> Chờ duyệt (Pending)
                            </Badge>
                          )}
                          {isActive && (
                            <Badge className="bg-emerald-600 text-white gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Đang hoạt động (Active)
                            </Badge>
                          )}
                          {s.status === 3 && (
                            <Badge className="bg-amber-600 text-white gap-1">
                              <PauseCircle className="h-3 w-3" /> Tạm ngừng hoạt động
                            </Badge>
                          )}
                          {s.status === 4 && (
                            <Badge className="bg-indigo-600 text-white gap-1">
                              <Wrench className="h-3 w-3" /> Đang sửa chữa / Bảo trì
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge className="bg-red-600 text-white gap-1">
                              <XCircle className="h-3 w-3" /> Bị từ chối (Rejected)
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Facade image */}
                          <div className="md:col-span-1 h-36 rounded-xl overflow-hidden border bg-slate-100">
                            <img
                              src={
                                s.storeImage ||
                                "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
                              }
                              alt="Store cover"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Store details */}
                          <div className="md:col-span-3 space-y-3 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-slate-700">Địa chỉ:</span>
                                  <p className="text-slate-600">
                                    {s.address}
                                    {s.province && (
                                      <span className="ml-1.5 inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-blue-100">
                                        {s.province}
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-slate-700">Chủ nhà xe:</span>
                                  <p className="text-slate-600">
                                    {s.partner?.fullName || "Đối tác"} ({s.partner?.phone || s.phoneContact})
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <CreditCard className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-slate-700">Tài khoản ngân hàng:</span>
                                  <p className="font-mono text-slate-800 font-bold">
                                    {s.partner?.bankAccountNum || "9876543210"} - {s.partner?.bankName || "Vietcombank"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-2">
                                <Percent className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-semibold text-slate-700">Tỷ lệ tiền cọc yêu cầu:</span>
                                  <p className="text-slate-900 font-bold">
                                    {s.rentalPolicy?.depositPercent || 30}% giá trị đơn
                                  </p>
                                </div>
                              </div>
                            </div>

                            {s.description && (
                              <div className="bg-slate-50 p-2.5 rounded-xl border text-[11px] text-slate-600">
                                <strong>Mô tả: </strong> {s.description}
                              </div>
                            )}

                            {isRejected && s.rejectReason && (
                              <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-xs text-red-800 flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                                <div>
                                  <strong>Lý do từ chối:</strong> {s.rejectReason}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions Bar */}
                        <div className="border-t pt-3 flex items-center justify-between gap-3">
                          <span className="text-[11px] text-slate-400">ID Cửa hàng: #{s.id}</span>

                          <div className="flex items-center gap-2">
                            {isPending && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setRejectingStore(s);
                                    setRejectReason("");
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-8 rounded-xl"
                                >
                                  Từ chối
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveStore(s.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl gap-1.5"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Phê duyệt (ACTIVE)
                                </Button>
                              </>
                            )}

                            {isRejected && (
                              <Button
                                size="sm"
                                onClick={() => handleApproveStore(s.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl gap-1.5"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Xem xét lại & Phê duyệt
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DUYỆT YÊU CẦU CẬP NHẬT THÔNG TIN */}
        {activeMainTab === "update_requests" && (
          <div className="space-y-6">
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
              <FileEdit className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Quy trình kiểm duyệt thay đổi thông tin cửa hàng</p>
                <p className="text-blue-700 mt-0.5">
                  Các đối tác đang hoạt động (đã được duyệt) khi thay đổi tên, địa chỉ, ảnh, chính sách cọc hoặc tài khoản ngân hàng sẽ gửi yêu cầu tại đây.
                  Thông tin cũ của cửa hàng được bảo toàn cho đến khi Quản trị viên sàn phê duyệt.
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                { id: undefined, label: "Tất cả yêu cầu" },
                { id: 0, label: "Chờ duyệt (PENDING)" },
                { id: 1, label: "Đã phê duyệt (APPROVED)" },
                { id: 2, label: "Đã từ chối (REJECTED)" },
              ].map((tab) => (
                <button
                  key={String(tab.id)}
                  onClick={() => setFilterUpdateStatus(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                    filterUpdateStatus === tab.id
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-white text-slate-600 hover:bg-slate-100 border"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Requests List */}
            {isLoadingRequests ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Đang tải danh sách yêu cầu thay đổi thông tin...
              </div>
            ) : updateRequests.length === 0 ? (
              <Card className="text-center py-16 rounded-3xl border shadow-xs bg-white p-8">
                <FileEdit className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">Không có yêu cầu cập nhật nào</h3>
                <p className="text-xs text-slate-500 mt-1">Khi đối tác gửi thay đổi thông tin cửa hàng, hồ sơ sẽ hiển thị tại đây.</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {updateRequests.map((req) => {
                  const isPending = req.status === 0;
                  const isApproved = req.status === 1;
                  const isRejected = req.status === 2;
                  const originalStore = req.store;

                  // Lọc chính xác các trường thông tin THỰC SỰ THAY ĐỔI
                  const changedItems: Array<{
                    key: string;
                    label: string;
                    oldVal?: any;
                    newVal: any;
                    type: "image" | "text" | "badge";
                  }> = [];

                  // 1. Ảnh mặt tiền cửa hàng
                  if (req.storeImage && req.storeImage.trim() !== (originalStore?.storeImage || "").trim()) {
                    changedItems.push({
                      key: "storeImage",
                      label: "Ảnh mặt tiền cửa hàng",
                      oldVal: originalStore?.storeImage,
                      newVal: req.storeImage,
                      type: "image",
                    });
                  }

                  // 2. Tên cửa hàng
                  if (req.storeName && req.storeName.trim() !== (originalStore?.storeName || "").trim()) {
                    changedItems.push({
                      key: "storeName",
                      label: "Tên cửa hàng / Nhà xe",
                      oldVal: originalStore?.storeName,
                      newVal: req.storeName,
                      type: "text",
                    });
                  }

                  // 2b. Tỉnh / Thành phố
                  if (req.province && req.province.trim() !== (originalStore?.province || "").trim()) {
                    changedItems.push({
                      key: "province",
                      label: "Tỉnh / Thành phố",
                      oldVal: originalStore?.province || "Chưa thiết lập",
                      newVal: req.province,
                      type: "text",
                    });
                  }

                  // 3. Địa chỉ
                  if (req.address && req.address.trim() !== (originalStore?.address || "").trim()) {
                    changedItems.push({
                      key: "address",
                      label: "Địa chỉ chi nhánh",
                      oldVal: originalStore?.address,
                      newVal: req.address,
                      type: "text",
                    });
                  }

                  // 4. Số điện thoại liên hệ
                  if (req.phoneContact && req.phoneContact.trim() !== (originalStore?.phoneContact || "").trim()) {
                    changedItems.push({
                      key: "phoneContact",
                      label: "Số điện thoại liên hệ",
                      oldVal: originalStore?.phoneContact,
                      newVal: req.phoneContact,
                      type: "text",
                    });
                  }

                  // 5. Tỷ lệ tiền cọc (%)
                  if (
                    req.depositPercent !== undefined &&
                    Number(req.depositPercent) !== Number(originalStore?.rentalPolicy?.depositPercent || 0)
                  ) {
                    changedItems.push({
                      key: "depositPercent",
                      label: "Tỷ lệ tiền cọc (%)",
                      oldVal: `${originalStore?.rentalPolicy?.depositPercent || 15}%`,
                      newVal: `${req.depositPercent}%`,
                      type: "badge",
                    });
                  }

                  // 6. Tài khoản ngân hàng
                  const oldBankStr = `${req.partner?.bankAccountNum || ""} - ${req.partner?.bankName || ""}`.trim();
                  const newBankStr = `${req.bankAccountNum || ""} - ${req.bankName || ""}`.trim();
                  if (newBankStr && newBankStr !== oldBankStr && newBankStr !== "-") {
                    changedItems.push({
                      key: "bankAccount",
                      label: "Tài khoản ngân hàng thụ hưởng",
                      oldVal: oldBankStr || "(Chưa có)",
                      newVal: newBankStr,
                      type: "text",
                    });
                  }

                  // 7. Quy định hủy đơn & hoàn cọc
                  if (
                    req.cancelRule &&
                    req.cancelRule.trim() !== (originalStore?.rentalPolicy?.cancelRule || "").trim()
                  ) {
                    changedItems.push({
                      key: "cancelRule",
                      label: "Chính sách hủy đơn & hoàn cọc",
                      oldVal: originalStore?.rentalPolicy?.cancelRule,
                      newVal: req.cancelRule,
                      type: "text",
                    });
                  }

                  // 8. Mô tả / Giới thiệu
                  if (
                    req.description !== undefined &&
                    (req.description || "").trim() !== (originalStore?.description || "").trim()
                  ) {
                    changedItems.push({
                      key: "description",
                      label: "Giới thiệu / Mô tả",
                      oldVal: originalStore?.description,
                      newVal: req.description,
                      type: "text",
                    });
                  }

                  return (
                    <Card
                      key={req.id}
                      className={`rounded-2xl border shadow-xs bg-white overflow-hidden transition-all ${
                        isPending ? "border-amber-300 ring-2 ring-amber-500/10" : "border-slate-200"
                      }`}
                    >
                      <CardHeader className="p-5 pb-3 border-b bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-sm text-slate-900">
                            Yêu Cầu Thay Đổi Thông Tin: #{req.id}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-700">
                            Chi nhánh #{req.storeId} ({originalStore?.storeName || req.storeName})
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500">
                            Gửi ngày: {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-600 text-white text-[11px] font-bold">
                            {changedItems.length > 0
                              ? `${changedItems.length} thông tin cần thay đổi`
                              : "Yêu cầu cập nhật"}
                          </Badge>

                          {isPending && (
                            <Badge className="bg-amber-500 text-white gap-1 animate-pulse">
                              <Clock className="h-3 w-3" /> Chờ xem xét
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge className="bg-emerald-600 text-white gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Đã cập nhật
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge className="bg-red-600 text-white gap-1">
                              <XCircle className="h-3 w-3" /> Đã từ chối
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="p-5 space-y-5">
                        {/* Partner & Branch info banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
                            <span>
                              Cơ sở: <strong className="text-slate-900">{originalStore?.storeName || req.storeName}</strong> (#{req.storeId})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-600">
                            <User className="h-4 w-4 text-blue-600 shrink-0" />
                            <span>
                              Đối tác gửi yêu cầu: <strong>{req.partner?.fullName}</strong> ({req.partner?.email} - {req.partner?.phone})
                            </span>
                          </div>
                        </div>

                        {/* ONLY DISPLAY CHANGED INFORMATION */}
                        {changedItems.length === 0 ? (
                          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
                            Các thông tin gửi lên trùng khớp với hồ sơ hiện tại trên hệ thống.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-1">
                              <FileEdit className="h-4 w-4 text-blue-600" />
                              <span>Danh sách thông tin cần thay đổi ({changedItems.length}):</span>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {changedItems.map((item) => {
                                if (item.type === "image") {
                                  return (
                                    <div
                                      key={item.key}
                                      className="p-4 rounded-2xl bg-amber-50/50 border-2 border-amber-300 space-y-3"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                          <Camera className="h-4 w-4 text-amber-700" />
                                          {item.label} (Đổi sang ảnh mới)
                                        </span>
                                        <Badge className="bg-amber-600 text-white text-[10px]">Cần thay đổi</Badge>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                        {item.oldVal && (
                                          <div className="space-y-1">
                                            <span className="text-[11px] font-semibold text-slate-500 block">Ảnh hiện tại:</span>
                                            <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                                              <img
                                                src={item.oldVal}
                                                alt="Ảnh cũ"
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                          </div>
                                        )}

                                        <div className="space-y-1">
                                          <span className="text-[11px] font-bold text-emerald-800 block">
                                            Ảnh mới đối tác gửi duyệt:
                                          </span>
                                          <div className="relative h-44 w-full rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md bg-slate-100 group">
                                            <img
                                              src={item.newVal}
                                              alt="Ảnh mặt tiền mới"
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute bottom-2 right-2">
                                              <a
                                                href={item.newVal}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xs"
                                              >
                                                Xem ảnh gốc ↗
                                              </a>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={item.key}
                                    className="p-3.5 rounded-2xl bg-blue-50/40 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                  >
                                    <div className="space-y-0.5">
                                      <span className="font-bold text-slate-800 block text-xs">{item.label}</span>
                                      {item.oldVal && (
                                        <span className="text-[11px] text-slate-400 block">
                                          Hiện tại: <span className="line-through text-slate-500 font-medium">{item.oldVal}</span>
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-left sm:text-right">
                                      <span className="inline-flex items-center gap-1 font-bold text-blue-900 bg-white px-3.5 py-1.5 rounded-xl border border-blue-300 shadow-2xs text-xs">
                                        <ArrowRight className="h-3 w-3 text-blue-500" />
                                        <span>{item.newVal}</span>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Rejection reason note */}
                        {isRejected && req.rejectReason && (
                          <div className="bg-red-50 p-3 rounded-xl border border-red-200 text-xs text-red-800 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                            <div>
                              <strong>Lý do từ chối:</strong> {req.rejectReason}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        {isPending && (
                          <div className="border-t pt-3 flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRejectingRequest(req);
                                setRequestRejectReason("");
                              }}
                              className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-8 rounded-xl"
                            >
                              Từ chối yêu cầu
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveUpdateRequest(req.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl gap-1.5"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Phê duyệt thay đổi
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Store Onboarding Modal */}
      {rejectingStore && (
        <Dialog open={!!rejectingStore} onOpenChange={() => setRejectingStore(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-red-700">
                Từ chối hồ sơ cửa hàng
              </DialogTitle>
              <DialogDescription className="text-xs">
                Cửa hàng: <strong>{rejectingStore.storeName}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRejectStoreSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Lý do từ chối (gửi trực tiếp đến đối tác) *
                </Label>
                <Textarea
                  placeholder="VD: Ảnh chụp mặt tiền chưa rõ biển hiệu, địa chỉ không khớp với GPKD..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-xs min-h-[90px]"
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingStore(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? "Đang gửi..." : "Xác nhận Từ chối"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Reject Store Update Request Modal */}
      {rejectingRequest && (
        <Dialog open={!!rejectingRequest} onOpenChange={() => setRejectingRequest(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-red-700">
                Từ chối yêu cầu cập nhật thông tin
              </DialogTitle>
              <DialogDescription className="text-xs">
                Yêu cầu cập nhật cho cửa hàng: <strong>{rejectingRequest.storeName}</strong>
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRejectUpdateRequestSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Lý do từ chối thay đổi thông tin *
                </Label>
                <Textarea
                  placeholder="VD: Tên cửa hàng mới trùng lặp thương hiệu đã bảo hộ, hoặc số tài khoản không chính chủ..."
                  value={requestRejectReason}
                  onChange={(e) => setRequestRejectReason(e.target.value)}
                  className="text-xs min-h-[90px]"
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRejectingRequest(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isSubmitting ? "Đang gửi..." : "Xác nhận Từ chối"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
