"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Booking, VehicleItem, Store } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Bike,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MapPin,
  Calendar,
  Wallet,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  Loader2,
  Store as StoreIcon,
  Search,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { format24hDateTime } from "@/components/common/datetime-24h-picker";

function PartnerBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get("storeId");

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<number | undefined>(undefined); // undefined: all, 1: confirmed, 2: waiting queue, 3: active, 4: completed
  const [isLoading, setIsLoading] = useState(true);

  // Search & Date range filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Handover modal state
  const [handoverBooking, setHandoverBooking] = useState<Booking | null>(null);
  const [availablePlates, setAvailablePlates] = useState<VehicleItem[]>([]);
  const [selectedPlateId, setSelectedPlateId] = useState<number | null>(null);
  const [isHandoverLoading, setIsHandoverLoading] = useState(false);

  const fetchBookings = async (status?: number) => {
    setIsLoading(true);
    try {
      const storesData = await api.partner.getStores();
      setStores(storesData || []);

      const approved = (storesData || []).filter((s) => s.status === 1);
      if (approved.length === 0) {
        toast.warning("Hồ sơ cửa hàng chưa được Admin duyệt (status = PENDING). Vui lòng hoàn tất Onboarding!");
        router.push("/partner/onboarding");
        return;
      }

      const targetStoreId = queryStoreId
        ? Number(queryStoreId)
        : typeof window !== "undefined" && localStorage.getItem("active_partner_store_id")
        ? Number(localStorage.getItem("active_partner_store_id"))
        : null;

      let currentStore = targetStoreId
        ? (storesData || []).find((s) => s.id === targetStoreId) || null
        : null;

      if (!currentStore && approved.length > 0) {
        currentStore = approved[0];
      }

      setSelectedStore(currentStore);
      if (currentStore && typeof window !== "undefined") {
        localStorage.setItem("active_partner_store_id", String(currentStore.id));
        localStorage.setItem("active_partner_store_name", currentStore.storeName);
      }

      const data = await api.partner.getBookings(status, currentStore ? currentStore.id : undefined);
      setBookings(data || []);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab, queryStoreId]);

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    if (typeof window !== "undefined") {
      localStorage.setItem("active_partner_store_id", String(store.id));
      localStorage.setItem("active_partner_store_name", store.storeName);
    }
    router.replace(`/partner/bookings?storeId=${store.id}`);
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Date range filter
      if (fromDate) {
        const itemDate = new Date(b.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(b.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }
      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.bookingCode?.toLowerCase().includes(q);
        const matchCustomer =
          b.customer?.fullName?.toLowerCase().includes(q) || b.customer?.phone?.includes(q);
        const matchModel = b.bookingDetails?.some((d) =>
          d.model?.name?.toLowerCase().includes(q)
        );
        const matchPlate = b.bookingDetails?.some((d) =>
          d.vehicleItem?.licensePlate?.toLowerCase().includes(q)
        );
        if (!matchCode && !matchCustomer && !matchModel && !matchPlate) return false;
      }
      return true;
    });
  }, [bookings, searchQuery, fromDate, toDate]);

  const handleOpenHandover = async (b: Booking) => {
    setHandoverBooking(b);
    setSelectedPlateId(null);
    const detail = b.bookingDetails?.[0];
    if (detail?.modelId) {
      try {
        const plates = await api.partner.getItems(detail.modelId);
        // Hiển thị các xe đang Sẵn sàng (status = 0) HOẶC xe đã được gán giữ chỗ cho đơn này (status = 1)
        const selectablePlates = plates.filter(
          (p) => p.status === 0 || p.id === detail?.vehicleItemId
        );
        setAvailablePlates(selectablePlates);

        // Tự động chọn trước biển số xe đã được giữ chỗ cho đơn này
        if (detail?.vehicleItemId && selectablePlates.some((p) => p.id === detail.vehicleItemId)) {
          setSelectedPlateId(detail.vehicleItemId);
        } else if (selectablePlates.length > 0) {
          setSelectedPlateId(selectablePlates[0].id);
        }
      } catch {
        setAvailablePlates([]);
      }
    }
  };

  const handleConfirmHandover = async () => {
    if (!handoverBooking || !selectedPlateId) {
      toast.error("Vui lòng chọn 1 biển số xe để bàn giao!");
      return;
    }

    setIsHandoverLoading(true);
    try {
      await api.partner.handover(handoverBooking.id, selectedPlateId);
      toast.success("Bàn giao xe thành công! Đơn chuyển sang trạng thái Đang thuê (ActiveRental).");
      setHandoverBooking(null);
      fetchBookings(activeTab);
    } catch {
      toast.error("Không thể bàn giao xe.");
    } finally {
      setIsHandoverLoading(false);
    }
  };

  const handleCompleteRental = async (bookingId: number) => {
    if (!confirm("Xác nhận khách đã trả xe đầy đủ nguyên vẹn?")) return;
    try {
      await api.partner.complete(bookingId);
      toast.success("Hoàn tất đơn thuê! Xe đã được tự động đưa về kho khả dụng (Available).");
      fetchBookings(activeTab);
    } catch {
      toast.error("Không thể hoàn tất đơn.");
    }
  };

  const waitingCount = bookings.filter((b) => b.status === 2).length;

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Đối tác nhà xe • Phân hệ vận hành chi nhánh
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quản Lý Đơn Thuê & Bàn Giao Xe
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {selectedStore
                ? `Đang quản lý đơn thuê của cơ sở: ${selectedStore.storeName}`
                : "Xử lý đơn hàng, giải phóng hàng chờ FIFO và chọn biển số xe thực tế khi khách đến nhận."}
            </p>
          </div>

          {stores.filter((s) => s.status === 1).length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Chi nhánh:</span>
              <select
                value={selectedStore?.id || ""}
                onChange={(e) => {
                  const s = stores.find((item) => item.id === Number(e.target.value));
                  if (s) handleSelectStore(s);
                }}
                className="h-10 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-amber-500/20"
              >
                {stores
                  .filter((s) => s.status === 1)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Warning Banner if there are WaitingQueue bookings */}
        {waitingCount > 0 && (
          <div className="rounded-2xl border border-orange-300 bg-orange-50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-orange-950">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm">
                  Cảnh báo: Có {waitingCount} đơn trong Hàng chờ (WaitingQueue)!
                </h4>
                <p className="text-xs text-orange-800">
                  Hạn mức ví đối tác hiện đã chạm giới hạn. Vui lòng liên hệ Chủ cửa hàng kiểm tra ví để giải phóng hàng chờ.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: undefined, label: "Tất cả đơn" },
              { id: 2, label: `Hàng chờ FIFO (Thiếu ví)` },
              { id: 1, label: "Chờ bàn giao xe (Confirmed)" },
              { id: 3, label: "Đang cho thuê (Active)" },
              { id: 4, label: "Đã hoàn tất (Completed)" },
            ].map((tab) => (
              <button
                key={String(tab.id)}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-slate-500 font-semibold text-xs">
            Hiển thị: <strong className="text-slate-900 font-mono">{filteredBookings.length}</strong>/{bookings.length} đơn
          </span>
        </div>

        {/* Search & Date Range Filters Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo mã đơn BK-..., tên khách, SĐT, dòng xe, biển số..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 text-xs h-9.5 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="lg:col-span-3 flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs h-9.5 rounded-xl bg-slate-50/50"
              title="Từ ngày đặt xe"
            />
          </div>

          <div className="lg:col-span-3 flex items-center gap-1.5">
            <span className="text-xs text-slate-400 shrink-0">đến</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs h-9.5 rounded-xl bg-slate-50/50"
              title="Đến ngày"
            />
          </div>

          <div className="lg:col-span-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFromDate("");
                setToDate("");
              }}
              className="w-full h-9.5 rounded-xl text-xs text-slate-600 hover:text-slate-900"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        {isLoading ? (
          <div className="text-center py-16 text-slate-500">
            <Clock className="h-8 w-8 animate-spin mx-auto text-amber-600 mb-2" />
            <p className="text-xs font-semibold">Đang tải danh sách đơn thuê...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="text-center py-16 rounded-3xl border shadow-xs bg-white p-8">
            <Bike className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">Không tìm thấy đơn thuê nào phù hợp</h3>
            <p className="text-xs text-slate-500 mt-1">Hãy thử xóa bộ lọc hoặc chọn mục trạng thái khác.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const detail = b.bookingDetails?.[0];
              const isWaiting = b.status === 2;
              const isConfirmed = b.status === 1;
              const isActive = b.status === 3;
              const isCompleted = b.status === 4;

              return (
                <Card
                  key={b.id}
                  className={`rounded-2xl border shadow-xs bg-white overflow-hidden transition-all ${
                    isWaiting ? "border-orange-300 bg-orange-50/20" : "border-slate-200"
                  }`}
                >
                  <CardHeader className="p-4 sm:p-5 pb-3 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {b.bookingCode}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        Tạo lúc: {new Date(b.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    <div>
                      {isWaiting && (
                        <Badge className="bg-orange-600 text-white gap-1 animate-pulse">
                          <AlertCircle className="h-3 w-3" /> Hàng chờ FIFO (Thiếu số dư ví)
                        </Badge>
                      )}
                      {isConfirmed && (
                        <Badge className="bg-blue-600 text-white gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Chờ giao xe cho khách
                        </Badge>
                      )}
                      {isActive && (
                        <Badge className="bg-indigo-600 text-white gap-1">
                          <Bike className="h-3 w-3" /> Khách đang đi xe
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-emerald-600 text-white gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Đã hoàn tất & Đã trả xe
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Customer & Vehicle Info */}
                      <div className="space-y-1.5 flex-1">
                        <div className="text-base font-extrabold text-slate-900">
                          {detail?.model?.name || "Dòng xe cho thuê"}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-semibold text-slate-800">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                            {b.customer?.fullName || "Khách thuê"} ({b.customer?.phone || "09..."})
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-blue-600" />
                            {format24hDateTime(b.startTime)} → {format24hDateTime(b.endTime)} ({b.dayRent} ngày)
                          </span>
                          {b.pickupType === 1 && (
                            <span className="flex items-center gap-1 text-indigo-600 font-medium">
                              <MapPin className="h-3.5 w-3.5" /> Giao tận nơi: {b.deliveryAddress}
                            </span>
                          )}
                        </div>

                        {/* Handover Plate Info */}
                        {detail?.vehicleItem && (
                          <div className="pt-1 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-700">
                              {isActive || isCompleted ? "Biển số bàn giao: " : "Xe giữ chỗ: "}
                            </span>
                            <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                              {detail.vehicleItem.licensePlate} ({detail.vehicleItem.color || "Tiêu chuẩn"})
                              {!isActive && !isCompleted && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 font-sans px-1.5 py-0.2 rounded font-semibold">
                                  Đang giữ chỗ
                                </span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pricing breakdown & Commission */}
                      <div className="text-left md:text-right border-t md:border-t-0 md:border-l md:pl-6 pt-3 md:pt-0 space-y-1 min-w-[200px]">
                        <div className="text-xs text-slate-500">
                          Doanh thu đơn: <strong className="text-slate-900 font-bold">{Number(b.rentAmount).toLocaleString("vi-VN")} đ</strong>
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          Khách đã cọc: {Number(b.depositAmount).toLocaleString("vi-VN")} đ
                        </div>
                        <div className="text-xs text-amber-700 font-bold">
                          Phí hoa hồng sàn 10%: -{Number(b.commissionAmount).toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="border-t pt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        {isWaiting && "Đơn tự động duyệt khi đối tác nạp đủ tiền bù hoa hồng sàn."}
                        {isConfirmed && "Khách đã đến cửa hàng? Hãy chọn biển số xe rảnh để bàn giao."}
                        {isActive && "Khách đã mang xe về trả lại cửa hàng?"}
                      </div>

                      <div className="flex items-center gap-2">
                        {isConfirmed && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenHandover(b)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-xl gap-1.5"
                          >
                            <Bike className="h-3.5 w-3.5" /> Bàn giao xe cho khách
                          </Button>
                        )}

                        {isActive && (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteRental(b.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-xl gap-1.5"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Xác nhận nhận lại xe
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

      {/* Handover Modal (Select Available License Plate) */}
      {handoverBooking && (
        <Dialog open={!!handoverBooking} onOpenChange={() => setHandoverBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Bàn Giao Xe Vật Lý (Biển Số)</DialogTitle>
              <DialogDescription className="text-xs">
                Chọn 1 biển số xe đang rảnh trong kho để giao cho khách hàng:{" "}
                <strong>{handoverBooking.customer?.fullName}</strong> ({handoverBooking.customer?.phone})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700">Dòng xe thuê:</span>
                <div className="font-bold text-sm text-slate-900 bg-slate-50 p-2.5 rounded-xl border">
                  {handoverBooking.bookingDetails?.[0]?.model?.name}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-900">
                  Chọn 1 biển số xe khả dụng ({availablePlates.length} xe có thể bàn giao):
                </span>

                {availablePlates.length === 0 ? (
                  <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs">
                    Hiện không còn xe nào của dòng này có sẵn trong kho! Vui lòng kiểm tra lại trạng thái xe.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availablePlates.map((plate) => {
                      const isPreAssigned = plate.id === handoverBooking.bookingDetails?.[0]?.vehicleItemId;
                      return (
                        <div
                          key={plate.id}
                          onClick={() => setSelectedPlateId(plate.id)}
                          className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition-all ${
                            selectedPlateId === plate.id
                              ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10 font-bold"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{plate.licensePlate}</span>
                            {isPreAssigned && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                                Xe đã giữ cho đơn này
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500">Màu: {plate.color || "Tiêu chuẩn"}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHandoverBooking(null)}
                disabled={isHandoverLoading}
              >
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmHandover}
                disabled={!selectedPlateId || isHandoverLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isHandoverLoading ? "Đang xử lý..." : "Xác nhận bàn giao xe"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function PartnerBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <PartnerBookingsContent />
    </Suspense>
  );
}

