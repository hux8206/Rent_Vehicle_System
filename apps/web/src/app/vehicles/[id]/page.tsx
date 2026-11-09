"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, VehicleModel } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookingModal } from "@/components/customer/booking-modal";
import { DigitalHandoverModal } from "@/components/customer/digital-handover-modal";
import {
  DateTime24hPicker,
  formatLocalIsoString,
  calculate24hReturnTime,
} from "@/components/common/datetime-24h-picker";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Store,
  Info,
  Car,
  Bike,
  HelpCircle,
  AlertCircle,
  FileCheck2,
  Star,
  User,
} from "lucide-react";

export default function VehicleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const now = new Date();
  const defaultStart = formatLocalIsoString(new Date(now.getTime() + 2 * 60 * 60 * 1000));
  const defaultEnd = calculate24hReturnTime(defaultStart, "07:00", "21:00");

  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [model, setModel] = useState<VehicleModel | null>(null);
  const [selectedImg, setSelectedImg] = useState<string>("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isHandoverOpen, setIsHandoverOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [minDeposit, setMinDeposit] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [res, cfg] = await Promise.all([
          api.customer.getVehicleDetail(
            id,
            new Date(startTime).toISOString(),
            new Date(endTime).toISOString()
          ),
          api.config.get(),
        ]);
        setModel(res);
        if (cfg?.minDepositPercent !== undefined) {
          setMinDeposit(Number(cfg.minDepositPercent));
        }
        if (res.images && res.images.length > 0) {
          setSelectedImg(res.images[0]);
        }
      } catch {
        setModel(null);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadData();
  }, [id, startTime, endTime]);

  if (isLoading) {
    return (
      <div className="container py-24 text-center text-slate-500">
        <Bike className="h-10 w-10 animate-pulse mx-auto text-blue-600 mb-2 opacity-80" />
        <p className="text-sm font-semibold">Đang tải thông tin dòng xe...</p>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="container max-w-lg mx-auto py-24 px-4 text-center space-y-4">
        <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Dòng xe hiện không khả dụng</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Dòng xe này không tồn tại, cửa hàng đang tạm ngưng hoạt động hoặc tài khoản đối tác đang bị khóa bởi hệ thống.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs">
              <ArrowLeft className="h-4 w-4" /> Về trang chủ tìm xe
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Pricing calculation & Time validation
  const start = new Date(startTime);
  const end = new Date(endTime);
  const isTimeValid =
    !isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() > start.getTime();
  const diffHours = isTimeValid
    ? (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    : 0;
  const dayRent = isTimeValid ? Math.ceil(diffHours / 24) : 0;
  const pricePerDay = Number(model.rentPrice);
  const rentAmount = dayRent * pricePerDay;
  const rawDepositPercent = model.store?.rentalPolicy?.depositPercent !== undefined
    ? Number(model.store.rentalPolicy.depositPercent)
    : minDeposit;
  const depositPercent = Math.max(minDeposit, rawDepositPercent);
  const depositAmount = Math.round((rentAmount * depositPercent) / 100);

  // Giờ hoạt động của cửa hàng (Requirement 1)
  const storeOpenTime = model.store?.openTime || "07:00";
  const storeCloseTime = model.store?.closeTime || "21:00";

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };

  const extractMinutesFromStr = (dateTimeStr: string) => {
    if (dateTimeStr && dateTimeStr.includes("T")) {
      const timePart = dateTimeStr.split("T")[1].substring(0, 5);
      const [h, m] = timePart.split(":").map(Number);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
    return -1;
  };

  const startMins = extractMinutesFromStr(startTime);
  const endMins = extractMinutesFromStr(endTime);
  const openMins = parseTime(storeOpenTime);
  const closeMins = parseTime(storeCloseTime);

  const isStartWithinHours = startMins === -1 || (startMins >= openMins && startMins <= closeMins);
  const isEndWithinHours = endMins === -1 || (endMins >= openMins && endMins <= closeMins);
  const isHoursValid = isStartWithinHours && isEndWithinHours;

  // Khi chọn thời gian nhận xe: hệ thống tự động tính toán đủ 24h cho 1 ngày và hiện số thời gian trả tương ứng.
  // Trường hợp thời gian trả tính toán trễ hơn giờ mở cửa của cửa hàng -> điều chỉnh về thời gian mở cửa cuối cùng của cửa hàng (closeTime).
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    const newEnd = calculate24hReturnTime(newStart, storeOpenTime, storeCloseTime);
    setEndTime(newEnd);
  };

  const availableCount =
    model.availableCount !== undefined ? model.availableCount : 3;

  return (
    <div className="py-8 bg-slate-50/60 min-h-screen">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách xe
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Gallery, Details, Store, Policy */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="h-80 sm:h-96 w-full rounded-2xl overflow-hidden border bg-white shadow-xs">
                <img
                  src={
                    selectedImg ||
                    "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={`Hình ảnh xe ${model.brand ? model.brand + " " : ""}${model.name || "cho thuê tự lái"} tại nhà xe ${model.store?.storeName || ""}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80";
                  }}
                  className="w-full h-full object-cover"
                />
              </div>

              {model.images && model.images.length > 1 && (
                <div className="flex gap-2">
                  {model.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      aria-label={`Xem ảnh ${idx + 1} của dòng xe ${model.name}`}
                      onClick={() => setSelectedImg(img)}
                      className={`h-20 w-24 rounded-xl overflow-hidden border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        selectedImg === img ? "border-blue-600 ring-2 ring-blue-600/30" : "border-slate-200 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt={`${model.name || "Dòng xe"} - Ảnh chi tiết ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Overview */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white font-semibold text-xs">{model.brand}</Badge>
                    <Badge variant="outline" className="text-xs">
                      {model.type === 1 ? "Tay ga" : model.type === 0 ? "Xe số" : model.type === 2 ? "Côn tay" : "Xe điện"}
                    </Badge>
                  </div>
                  <Badge
                    className={`text-xs font-bold ${
                      availableCount > 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
                    }`}
                  >
                    {availableCount > 0 ? `Còn ${availableCount} xe khả dụng` : "Tạm hết xe giờ này"}
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                  {model.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold text-xs bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    <span className="text-amber-900 font-mono text-sm">{model.avgRating || 5.0}</span>
                    <span className="text-slate-500 font-normal">
                      ({model.reviewCount || model.reviews?.length || 0} đánh giá)
                    </span>
                  </div>
                  <span className="text-xs text-slate-300">•</span>
                  <p className="text-xs text-slate-500">
                    Đơn giá niêm yết: <span className="font-bold text-blue-600 text-sm">{pricePerDay.toLocaleString("vi-VN")} đ</span>/ngày 24h
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-0 space-y-4 text-xs text-slate-600">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-800 text-sm">Thông số kỹ thuật & Tiện ích</h4>
                  <p className="leading-relaxed bg-slate-50 p-3.5 rounded-xl border">
                    {model.specifications || "Trang bị động cơ đời mới, khóa thông minh Smartkey, cốp rộng chứa đồ, phanh an toàn. Đã qua bảo dưỡng và kiểm định định kỳ."}
                  </p>
                </div>

                {/* Plates list */}
                {model.vehicleItems && (
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-slate-800 text-sm">Danh sách biển số xe thuộc dòng này:</h4>
                    <div className="flex flex-wrap gap-2">
                      {model.vehicleItems.map((item) => (
                        <span
                          key={item.id}
                          className={`px-2.5 py-1 rounded-lg border font-mono font-medium text-xs ${
                            item.status === 0
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : item.status === 2
                              ? "bg-slate-100 text-slate-500 border-slate-200 line-through"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {item.licensePlate} ({item.color || "Tiêu chuẩn"})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 6-Point Safety Inspection & Digital Handover Seal */}
            <Card className="rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-xs overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                        <CheckCircle2 className="h-3 w-3" /> Kiểm định 6 điểm kỹ thuật số
                      </div>
                      <h3 className="text-base font-black text-slate-900 mt-0.5">
                        Biên Bản Bàn Giao & Kiểm Tra 6 Điểm Kỹ Thuật Số
                      </h3>
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => setIsHandoverOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-9 px-4 gap-1.5 shadow-xs"
                  >
                    <span>Xem biên bản bàn giao xe</span>
                    <FileCheck2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Trước khi nhận xe, cửa hàng cùng bạn kiểm tra phanh, lốp, đèn, gương, vạch xăng và chụp ảnh 4 góc lưu trữ điện tử. Cam kết <strong className="text-slate-900 font-bold">Không phạt vạ trầy xước hao mòn</strong> và <strong className="text-slate-900 font-bold">Cứu hộ khẩn cấp 24/7</strong> mọi cung đường.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div className="text-[11px] font-bold text-slate-700">Phanh & Tay Lái</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Đã kiểm tra</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div className="text-[11px] font-bold text-slate-700">Đèn & Xi-Nhan</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Đạt chuẩn đêm</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div className="text-[11px] font-bold text-slate-700">Lốp & Áp Suất</div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">✓ Gai sâu an toàn</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div className="text-[11px] font-bold text-slate-700">Hợp Đồng & Ảnh</div>
                    <div className="text-[10px] text-blue-600 font-semibold mt-0.5">✓ Ký số minh bạch</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store & Rental Policy Card */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="p-6 pb-3 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Store className="h-5 w-5 text-blue-600" /> Thông tin nhà xe & Chính sách thuê
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold">Tên cửa hàng:</span>
                    <div className="flex items-center gap-2">
                      <div className="font-bold text-slate-900 text-sm">{model.store?.storeName || "Nhà xe Thành Đạt"}</div>
                      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                        {model.store?.avgRating ? Number(model.store.avgRating).toFixed(1) : "5.0"}
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({model.store?.reviewCount || 0})
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold">Số điện thoại liên hệ:</span>
                    <div className="font-bold text-slate-900">{model.store?.phoneContact || "0902000002"}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold">Giờ mở cửa đón khách:</span>
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Clock className="h-4 w-4 text-cyan-600" />
                      <span>{storeOpenTime} - {storeCloseTime}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-slate-500 font-semibold">Địa chỉ cửa hàng:</span>
                    <div className="text-slate-700">
                      {model.store?.address || "123 Xuân Thủy, Cầu Giấy, Hà Nội"}
                      {model.store?.province && (
                        <span className="ml-2 inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">
                          {model.store.province}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <h5 className="font-bold text-slate-800">Chính sách cọc & Hoàn tiền:</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
                    <div className="bg-slate-50 p-3 rounded-xl border">
                      <span className="font-semibold text-slate-800 block mb-0.5">Mức đặt cọc giữ xe:</span>
                      <span>Chỉ cần cọc <strong className="text-blue-600 font-bold">{depositPercent}%</strong> tổng tiền thuê.</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border">
                      <span className="font-semibold text-slate-800 block mb-0.5">Quy định hủy đơn:</span>
                      <span>{model.store?.rentalPolicy?.cancelRule || "Hủy trước 24h được hoàn 100% tiền cọc."}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews and Ratings Section */}
            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
              <CardHeader className="p-6 pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-400" /> Đánh giá từ khách hàng
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-1">
                    Trải nghiệm thực tế từ những khách hàng đã thuê dòng xe này
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                  <span className="font-extrabold text-amber-900 text-sm">{model.avgRating ?? 5.0}</span>
                  <span className="text-xs text-amber-700">({model.reviewCount ?? 0} đánh giá)</span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {model.reviews && model.reviews.length > 0 ? (
                  <div className="divide-y divide-slate-100 space-y-4">
                    {model.reviews.map((rev) => (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                              <User className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-xs text-slate-800">
                                {rev.customerName || rev.customer?.fullName || "Khách hàng"}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {rev.createdAt
                                  ? new Date(rev.createdAt).toLocaleDateString("vi-VN", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                    })
                                  : "Gần đây"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= rev.rateStar
                                    ? "fill-amber-400 text-amber-500"
                                    : "fill-slate-100 text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rev.comment && (
                          <p className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100 leading-relaxed">
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    <Star className="h-8 w-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-medium text-slate-600">Chưa có đánh giá nào cho mẫu xe này</p>
                    <p className="text-[11px] mt-0.5">Hãy là người đầu tiên trải nghiệm và chia sẻ đánh giá nhé!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Reservation Booking Sidebar */}
          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200/80 shadow-lg sticky top-20 bg-white">
              <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/70">
                <span className="text-xs font-bold text-blue-700">
                  Tính tiền & Đặt chỗ tức thì
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-blue-700">
                    {pricePerDay.toLocaleString("vi-VN")} đ
                  </span>
                  <span className="text-xs text-slate-500">/ 24 giờ thuê</span>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                {/* Store Operating Hours Pill */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Clock className="h-4 w-4 text-cyan-600 shrink-0" />
                    <span>Giờ mở cửa đón khách:</span>
                  </span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                    {storeOpenTime} - {storeCloseTime}
                  </span>
                </div>

                {/* Date-time inputs */}
                <div className="space-y-3">
                  <DateTime24hPicker
                    label="Nhận xe"
                    icon="calendar"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    minDate={new Date().toISOString().split("T")[0]}
                    openTime={storeOpenTime}
                    closeTime={storeCloseTime}
                  />

                  <DateTime24hPicker
                    label="Trả xe"
                    icon="clock"
                    value={endTime}
                    onChange={setEndTime}
                    minDate={startTime.split("T")[0] || new Date().toISOString().split("T")[0]}
                    openTime={storeOpenTime}
                    closeTime={storeCloseTime}
                  />

                  {!isTimeValid && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                      <div>
                        <p className="font-bold">Thời gian nhận/trả không hợp lệ</p>
                        <p className="mt-0.5 text-[11px] text-red-600 leading-normal">
                          Thời gian trả xe phải sau thời gian nhận xe. Vui lòng điều chỉnh lại ngày giờ.
                        </p>
                      </div>
                    </div>
                  )}

                  {isTimeValid && !isHoursValid && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                      <div>
                        <p className="font-bold">Ngoài giờ mở cửa của nhà xe</p>
                        <p className="mt-0.5 text-[11px] text-amber-800 leading-normal">
                          Nhà xe chỉ hoạt động từ <strong>{storeOpenTime}</strong> đến <strong>{storeCloseTime}</strong>. Vui lòng chọn giờ trong khung giờ này để được phục vụ.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculation breakdown */}
                <div className="border rounded-2xl p-4 bg-slate-50/70 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Số ngày tính theo mốc 24h:</span>
                    <span className={`font-bold ${!isTimeValid ? "text-red-500" : "text-slate-800"}`}>
                      {isTimeValid ? `${dayRent} ngày` : "Không hợp lệ"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Đơn giá ngày:</span>
                    <span>{pricePerDay.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 border-t pt-2">
                    <span>Tổng tiền thuê xe:</span>
                    <span>{isTimeValid ? `${rentAmount.toLocaleString("vi-VN")} đ` : "0 đ"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-700 border-t border-dashed pt-2">
                    <span>Tiền cọc cần thanh toán ({depositPercent}%):</span>
                    <span className="text-sm">{isTimeValid ? `${depositAmount.toLocaleString("vi-VN")} đ` : "0 đ"}</span>
                  </div>
                </div>

                {/* Features Pill */}
                <div className="space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Giữ xe 10 phút chống xung đột lịch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    <span>Quét mã VietQR chuyển khoản tức thì</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md disabled:bg-slate-200 disabled:text-slate-500"
                  disabled={availableCount <= 0 || !isTimeValid || !isHoursValid}
                  onClick={() => setIsBookingOpen(true)}
                >
                  {!isTimeValid
                    ? "Thời gian trả xe không hợp lệ"
                    : !isHoursValid
                    ? "Ngoài giờ mở cửa của nhà xe"
                    : availableCount > 0
                    ? "Xác nhận đặt xe & Giữ chỗ"
                    : "Tạm hết xe trong khung giờ này"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {model && (
        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          model={model}
          startTime={startTime}
          endTime={endTime}
        />
      )}

      {/* Digital Handover & 6-Point Inspection Modal */}
      {model && (
        <DigitalHandoverModal
          isOpen={isHandoverOpen}
          onClose={() => setIsHandoverOpen(false)}
          vehicle={model}
        />
      )}
    </div>
  );
}
