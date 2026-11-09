"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { VehicleModel, api } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  QrCode,
  ShieldCheck,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  MapPin,
  Calendar,
  Loader2,
  Trash2,
  RefreshCw,
  Smartphone,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { format24hDateTime } from "@/components/common/datetime-24h-picker";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: VehicleModel;
  startTime: string;
  endTime: string;
}

export function BookingModal({
  isOpen,
  onClose,
  model,
  startTime,
  endTime,
}: BookingModalProps) {
  const router = useRouter();
  const { user } = useAuth();

  // Form states
  const [step, setStep] = useState<"form" | "payment">("form");
  const [pickupType, setPickupType] = useState<number>(0); // 0: Tại cửa hàng, 1: Giao tận nơi
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [paymentType, setPaymentType] = useState<number>(1); // 1: Cọc 30%, 0: Toàn bộ
  const [hasAgreedLicense, setHasAgreedLicense] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment states
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [qrInfo, setQrInfo] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 minutes in seconds
  const [minDeposit, setMinDeposit] = useState<number>(0);

  useEffect(() => {
    api.config
      .get()
      .then((cfg) => {
        if (cfg?.minDepositPercent !== undefined) {
          setMinDeposit(Number(cfg.minDepositPercent));
        }
      })
      .catch(() => {});
  }, []);

  // Calculation & Time validation
  const start = new Date(startTime);
  const end = new Date(endTime);
  const isTimeValid =
    !isNaN(start.getTime()) && !isNaN(end.getTime()) && end.getTime() > start.getTime();
  const diffHours = isTimeValid
    ? (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    : 0;
  const dayRent = isTimeValid ? Math.ceil(diffHours / 24) : 0;
  const unitPrice = Number(model.rentPrice);
  const rentAmount = dayRent * unitPrice;
  const rawDepositPercent = model.store?.rentalPolicy?.depositPercent !== undefined
    ? Number(model.store.rentalPolicy.depositPercent)
    : minDeposit;
  // Tôn trọng mức cọc tối thiểu do Admin quy định
  const depositPercent = Math.max(minDeposit, rawDepositPercent);
  const depositAmount =
    paymentType === 1 ? Math.round((rentAmount * depositPercent) / 100) : rentAmount;

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
  const isOperatingHoursValid = isStartWithinHours && isEndWithinHours;

  const handleDownloadQr = () => {
    if (!qrInfo?.qrCode) {
      toast.error("Mã QR chưa sẵn sàng để tải về");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = qrInfo.qrCode;
      link.download = `VietQR-${bookingResult?.booking?.bookingCode || "booking"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải mã QR về máy! Bạn có thể quét mã từ thư viện ảnh trên App ngân hàng.");
    } catch {
      window.open(qrInfo.qrCode, "_blank");
    }
  };

  // Countdown timer for 10-minute hold
  useEffect(() => {
    if (step !== "payment" || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          toast.error("Phiên giữ chỗ 10 phút đã hết hạn! Vui lòng đặt lại.");
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft, onClose]);

  // Tự động lắng nghe Webhook PayOS xác nhận thanh toán thành công (polling 2.5s)
  useEffect(() => {
    if (step !== "payment" || !bookingResult?.booking?.id) return;
    const targetBookingId = bookingResult.booking.id;

    const pollInterval = setInterval(async () => {
      try {
        const bookings = await api.customer.getMyBookings();
        const found: any = bookings.find((b: any) => b.id === targetBookingId);
        if (found && (found.status === 1 || found.bookingStatus === 1 || found.bookingStatus === 4)) {
          clearInterval(pollInterval);
          toast.success(
            "🎉 Thanh toán thành công! Đơn xe của bạn đã được xác nhận (Confirmed).",
            { duration: 5000 }
          );
          onClose();
          router.push("/customer/bookings");
        }
      } catch {
        // bỏ qua lỗi mạng tạm thời trong lúc poll
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [step, bookingResult, onClose, router]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTimeValid) {
      toast.error("Thời gian trả xe phải sau thời gian nhận xe! Vui lòng chọn lại thời gian đặt xe.");
      return;
    }
    if (!isOperatingHoursValid) {
      toast.error(
        `Giờ nhận/trả xe (${startTime.split("T")[1]?.substring(0, 5)} - ${endTime.split("T")[1]?.substring(0, 5)}) ngoài khung giờ hoạt động của nhà xe (${storeOpenTime} - ${storeCloseTime}). Vui lòng điều chỉnh lại!`
      );
      return;
    }
    if (!hasAgreedLicense) {
      toast.error("Vui lòng xác nhận bạn đã có Giấy phép lái xe chính chủ hợp lệ để tiếp tục!");
      return;
    }
    if (pickupType === 1 && !deliveryAddress.trim()) {
      toast.error("Vui lòng nhập địa chỉ giao xe tận nơi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.customer.createBooking({
        modelId: model.id,
        storeId: model.storeId,
        startTime,
        endTime,
        pickupType,
        deliveryAddress: pickupType === 1 ? deliveryAddress : undefined,
        paymentType,
      });

      setBookingResult(res);
      // Fetch or generate QR
      const qrData = await api.customer.getPaymentQr(res.booking.id);
      setQrInfo(qrData);
      setStep("payment");
      setTimeLeft(600);
      toast.success("Đã tạo phiên giữ xe 10 phút! Vui lòng thanh toán cọc.");
    } catch (err: any) {
      toast.error(err.message || "Không thể đặt xe lúc này. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePaymentSuccess = () => {
    toast.success("Thanh toán thành công! Đơn hàng đã chuyển sang trạng thái Confirmed.");
    onClose();
    router.push("/customer/bookings");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border border-slate-200 shadow-2xl">
        {/* Header - Fixed at top */}
        <DialogHeader className="shrink-0 p-5 sm:p-6 pb-4 border-b bg-slate-50/80">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              {step === "form" ? "Bước 1/2: Xác thực & Đặt xe" : "Bước 2/2: Giữ xe 10 phút & Quét VietQR"}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {step === "form" ? `Đặt xe ${model.name}` : "Thanh toán VietQR động"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-600">
            {step === "form"
              ? "Cung cấp hình ảnh GPLX 2 mặt và chọn phương thức nhận xe để khởi tạo phiên giữ chỗ."
              : "Hệ thống đang tạm khóa xe trong 10 phút. Quét mã QR bằng ứng dụng ngân hàng số."}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {step === "form" ? (
            <form id="booking-form" onSubmit={handleCreateBooking} className="space-y-5">
              {/* Summary Banner */}
              <div className="rounded-2xl border bg-blue-50/50 border-blue-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900 text-sm">{model.name}</span>
                  <div className="text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      {format24hDateTime(startTime)} → {format24hDateTime(endTime)} ({isTimeValid ? `${dayRent} ngày` : "Thời gian không hợp lệ"})
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                      <Clock className="h-3 w-3 text-purple-600" />
                      Mở cửa: {storeOpenTime} - {storeCloseTime}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right sm:border-l sm:pl-4 border-blue-200">
                  <span className="text-slate-500 text-[11px] block">Tổng tiền cọc cần thanh toán:</span>
                  <div className="text-lg font-black text-blue-700">
                    {isTimeValid ? `${depositAmount.toLocaleString("vi-VN")} đ` : "0 đ"}
                  </div>
                </div>
              </div>

              {/* Operating Hours Alert Banner */}
              {!isOperatingHoursValid && (
                <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs">
                  <Clock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Giờ nhận hoặc trả xe ngoài giờ mở cửa của nhà xe:</span>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      Nhà xe chỉ hoạt động từ <strong>{storeOpenTime}</strong> đến <strong>{storeCloseTime}</strong> hàng ngày. Vui lòng quay lại màn hình chọn xe để điều chỉnh lại khung giờ nhằm đảm bảo có nhân viên bàn giao xe cho bạn!
                    </p>
                  </div>
                </div>
              )}

              {/* Time Validation Alert Banner */}
              {!isTimeValid && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Thời gian đặt xe không hợp lệ:</span>
                    <p className="mt-0.5 text-red-600 leading-relaxed">
                      Ngày giờ trả xe ({format24hDateTime(endTime)}) không được trước hoặc bằng ngày giờ nhận xe ({format24hDateTime(startTime)}). Vui lòng điều chỉnh lại thời gian trước khi xác nhận đặt xe.
                    </p>
                  </div>
                </div>
              )}

              {/* Pickup Option */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-800">Hình thức nhận xe</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPickupType(0)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      pickupType === 0
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/30"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-600" /> Nhận tại cửa hàng
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {model.store?.address || "Địa chỉ nhà xe đối tác"}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickupType(1)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      pickupType === 1
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/30"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Giao xe tận nơi
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Giao đến khách sạn / sân bay / địa chỉ của bạn
                    </div>
                  </button>
                </div>

                {pickupType === 1 && (
                  <div className="pt-1.5">
                    <Input
                      placeholder="Nhập địa chỉ giao xe chi tiết (ví dụ: Khách sạn Mường Thanh, 123 Võ Nguyên Giáp)..."
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      required
                      className="text-xs h-10 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {/* Driver License Legal Notice & Confirmation */}
              <div className="rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/70 p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
                      Cam Kết Giấy Phép Lái Xe (GPLX) Chính Chủ
                      <Badge className="bg-amber-600 text-white text-[10px] uppercase font-bold tracking-wider">
                        Bắt buộc
                      </Badge>
                    </h4>
                    <p className="text-xs text-amber-900/90 leading-relaxed">
                      Theo quy định của pháp luật và chính sách thuê xe, người nhận xe bắt buộc phải có <strong>Giấy phép lái xe chính chủ hợp lệ</strong> và xuất trình <strong>bản gốc</strong> khi nhận xe tại cửa hàng.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/80 border border-amber-200/90 p-3 text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    <strong>Cảnh báo quan trọng:</strong> Nếu tại thời điểm nhận xe, Quý khách <strong>không có bằng lái chính chủ</strong> hoặc bằng lái không hợp lệ, <strong>cửa hàng sẽ từ chối bàn giao xe</strong> và không chịu trách nhiệm hoàn lại tiền cọc.
                  </p>
                </div>

                {/* Checkbox confirmation */}
                <label
                  onClick={(e) => {
                    // Prevent double triggering if clicked directly on input
                    if ((e.target as HTMLElement).tagName !== "INPUT") {
                      setHasAgreedLicense(!hasAgreedLicense);
                    }
                  }}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-all ${
                    hasAgreedLicense
                      ? "bg-amber-100/90 border-amber-400 ring-2 ring-amber-400/30 text-amber-950 font-bold"
                      : "bg-white border-slate-200 text-slate-700 hover:border-amber-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hasAgreedLicense}
                    onChange={(e) => setHasAgreedLicense(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs leading-relaxed">
                    Tôi xác nhận đã có <strong>Giấy phép lái xe chính chủ hợp lệ</strong> và cam kết mang theo bản gốc khi nhận xe. Tôi hiểu rằng cửa hàng sẽ không giao xe nếu tôi không xuất trình được bằng lái.
                  </span>
                </label>
              </div>

              {/* Payment Method Option */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-800">Tùy chọn thanh toán</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType(1)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === 1
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/30"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    <div className="font-bold text-xs">Cọc trước {depositPercent}% giữ xe</div>
                    <div className="text-xs text-blue-600 font-extrabold mt-1">
                      {Math.round((rentAmount * depositPercent) / 100).toLocaleString("vi-VN")} đ
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType(0)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      paymentType === 0
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-2 ring-blue-600/30"
                        : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                    }`}
                  >
                    <div className="font-bold text-xs">Thanh toán 100%</div>
                    <div className="text-xs text-slate-700 font-extrabold mt-1">
                      {rentAmount.toLocaleString("vi-VN")} đ
                    </div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Step 2: Payment with VietQR & 10-Minute Countdown */
            <div className="space-y-6">
              {/* Live Countdown Banner with Orange Glow */}
              <motion.div
                animate={{
                  scale: [1, 1.015, 1],
                  boxShadow: [
                    "0 0 0 rgba(249, 115, 22, 0)",
                    "0 8px 20px -4px rgba(249, 115, 22, 0.35)",
                    "0 0 0 rgba(249, 115, 22, 0)",
                  ],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="rounded-2xl bg-orange-50/80 border-2 border-orange-400/60 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-500/20 text-orange-700 flex items-center justify-center font-bold">
                    <Clock className="h-5 w-5 animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Thời gian giữ chỗ còn lại</h4>
                    <p className="text-xs text-slate-600">
                      Xe đã được tạm khóa. Quá 10 phút đơn sẽ tự động hủy.
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-black font-mono text-orange-600 tracking-wider">
                  {formatTimer(timeLeft)}
                </div>
              </motion.div>

              {/* Driver License Handover Notice */}
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-4 flex items-start gap-3 text-amber-950 shadow-xs">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <h4 className="font-extrabold text-sm text-amber-900 flex items-center gap-1.5">
                    LƯU Ý QUAN TRỌNG KHI ĐẾN NHẬN XE
                  </h4>
                  <p className="text-amber-800 leading-relaxed">
                    Quý khách bắt buộc phải mang theo <strong>Giấy phép lái xe chính chủ (bản gốc)</strong> khi đến nhận xe tại cửa hàng. <strong>Cửa hàng sẽ đối chiếu và không bàn giao xe</strong> nếu Quý khách không xuất trình được bằng lái chính chủ hợp lệ!
                  </p>
                </div>
              </div>

              {/* QR Code and Payment Details */}
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                {/* Dynamic QR Display */}
                <div className="flex flex-col items-center bg-white p-4 border border-slate-200 rounded-2xl shadow-sm w-full sm:w-auto shrink-0">
                  {qrInfo?.qrCode ? (
                    <img
                      src={qrInfo.qrCode}
                      alt="VietQR Code"
                      className="w-56 h-56 object-contain"
                    />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center bg-slate-50 rounded-xl text-slate-400 gap-2">
                      <QrCode className="h-12 w-12" />
                      <span className="text-xs">Đang sinh mã VietQR...</span>
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500 mt-2 text-center">
                    Quét bằng mọi ứng dụng Mobile Banking
                  </span>

                  {/* Actions for Mobile: Chuyển khoản ngay & Tải QR */}
                  <div className="w-full space-y-2 mt-3 pt-3 border-t border-slate-100">
                    {qrInfo?.checkoutUrl && (
                      <Button
                        type="button"
                        onClick={() => {
                          window.open(qrInfo.checkoutUrl, "_blank");
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9.5 rounded-xl gap-2 shadow-xs cursor-pointer"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Chuyển Khoản Ngay (Mở App)</span>
                      </Button>
                    )}

                    {qrInfo?.qrCode && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadQr}
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs h-9.5 rounded-xl gap-2 shadow-xs cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        <span>Tải Mã QR Về Máy</span>
                      </Button>
                    )}
                  </div>

                  <div className="mt-2.5 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-xl text-center leading-normal max-w-[220px] border border-slate-100">
                    💡 <strong>Mẹo điện thoại:</strong> Tải QR về máy, sau đó mở App ngân hàng chọn <strong>Quét QR từ Thư viện ảnh</strong> để thanh toán siêu nhanh!
                  </div>
                </div>

                {/* Transfer Breakdown */}
                <div className="flex-1 space-y-3 text-xs w-full">
                  <div className="bg-slate-50 p-4 rounded-2xl border space-y-2.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Mã đơn đặt xe:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {bookingResult?.booking?.bookingCode || "BK-..."}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Chủ tài khoản:</span>
                      <span className="font-bold text-slate-900 uppercase">
                        {qrInfo?.accountName || "NGUYEN VAN HUU"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-slate-900">
                        {qrInfo?.bankName || (qrInfo?.bin === "970422" ? "MB Bank (Quân Đội)" : "MB Bank / PayOS")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Số tài khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900">
                          {qrInfo?.accountNumber || "VQRQANJGX1330"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(qrInfo?.accountNumber || "VQRQANJGX1330");
                            toast.success("Đã sao chép số tài khoản!");
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                          title="Sao chép số tài khoản"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 border-t pt-2">
                      <span>Số tiền cọc cần chuyển:</span>
                      <span className="text-base font-black text-blue-700">
                        {depositAmount.toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 border-t pt-2">
                      <span>Nội dung chuyển khoản:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {bookingResult?.payment?.transactionRef || "VR-..."}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(bookingResult?.payment?.transactionRef || "");
                            toast.success("Đã sao chép nội dung chuyển khoản!");
                          }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                          title="Sao chép nội dung"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
                    <span>Đang tự động lắng nghe thanh toán từ Mobile Banking...</span>
                  </div>

                  {/* Dev Sandbox simulation button */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleSimulatePaymentSuccess}
                    className="w-full text-[11px] text-slate-400 hover:text-slate-600 h-7"
                  >
                    [Mô phỏng thanh toán test]
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Always visible at bottom, never clipped */}
        <DialogFooter className="shrink-0 p-4 sm:p-5 border-t bg-white flex flex-row items-center justify-end gap-2">
          {step === "form" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 text-xs font-semibold rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                form="booking-form"
                disabled={isSubmitting || !isTimeValid || !hasAgreedLicense}
                className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md gap-1.5 cursor-pointer disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Đang khóa xe 10 phút...</span>
                  </>
                ) : !isTimeValid ? (
                  <span>Thời gian không hợp lệ</span>
                ) : (
                  <span>Xác nhận & Giữ xe 10 phút</span>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 text-xs font-semibold rounded-xl"
            >
              Đóng cửa sổ
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
