"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api, Booking } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Clock,
  QrCode,
  Star,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Store,
  Bike,
  RotateCcw,
  ExternalLink,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { format24hDateTime } from "@/components/common/datetime-24h-picker";

export default function CustomerBookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review modal
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [rateStar, setRateStar] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // VietQR modal for pending bookings
  const [qrModalBooking, setQrModalBooking] = useState<Booking | null>(null);
  const [qrData, setQrData] = useState<any>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await api.customer.getMyBookings();
      setBookings(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Tự động lắng nghe Webhook PayOS khi modal VietQR đang mở
  useEffect(() => {
    if (!qrModalBooking) return;
    const targetBookingId = qrModalBooking.id;

    const pollInterval = setInterval(async () => {
      try {
        const data = await api.customer.getMyBookings();
        const found = data.find((b: Booking) => b.id === targetBookingId);
        if (found && (found.status === 1 || (found as any).bookingStatus === 1 || (found as any).bookingStatus === 4)) {
          clearInterval(pollInterval);
          setBookings(data);
          setQrModalBooking(null);
          setQrData(null);
          toast.success(
            "🎉 Đã nhận thanh toán cọc thành công! Đơn xe đã được xác nhận (Confirmed).",
            { duration: 5000 }
          );
        }
      } catch {
        // bỏ qua lỗi trong lúc poll
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [qrModalBooking]);

  const handleOpenQr = async (b: Booking) => {
    setQrModalBooking(b);
    try {
      const data = await api.customer.getPaymentQr(b.id);
      setQrData(data);
    } catch {
      // fallback
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn giữ chỗ này?")) return;
    try {
      await api.customer.cancelBooking(bookingId);
      toast.success("Đã hủy đơn thành công.");
      fetchBookings();
    } catch {
      toast.error("Không thể hủy đơn.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewBooking) return;
    setIsSubmittingReview(true);
    try {
      await api.customer.submitReview(reviewBooking.id, {
        rateStar,
        comment: reviewComment,
      });
      toast.success("Cảm ơn bạn đã gửi đánh giá trải nghiệm!");
      // Cập nhật ngay lập tức vào state để khóa không cho đánh giá lại và hiển thị đúng số sao
      setBookings((prev) =>
        prev.map((b) =>
          b.id === reviewBooking.id
            ? {
                ...b,
                review: {
                  id: Date.now(),
                  bookingId: b.id,
                  customerId: b.customerId,
                  storeId: b.storeId,
                  rateStar,
                  comment: reviewComment,
                },
              }
            : b
        )
      );
      setReviewBooking(null);
      setReviewComment("");
      fetchBookings();
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi đánh giá.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status
      if (statusFilter !== "ALL" && String(b.status) !== statusFilter) return false;

      // Date Range
      if (fromDate) {
        const itemDate = new Date(b.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(b.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = b.bookingCode?.toLowerCase().includes(q);
        const matchStore = b.store?.storeName?.toLowerCase().includes(q);
        const matchModel = b.bookingDetails?.some((d) =>
          d.model?.name?.toLowerCase().includes(q)
        );
        if (!matchCode && !matchStore && !matchModel) return false;
      }

      return true;
    });
  }, [bookings, searchQuery, fromDate, toDate, statusFilter]);

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge className="bg-amber-500 text-white gap-1 animate-pulse">
            <Clock className="h-3 w-3" /> Chờ cọc (Giữ xe 10p)
          </Badge>
        );
      case 1:
        return (
          <Badge className="bg-blue-600 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" /> Đã xác nhận (Chờ nhận xe)
          </Badge>
        );
      case 2:
        return (
          <Badge className="bg-orange-600 text-white gap-1">
            <AlertCircle className="h-3 w-3" /> Hàng chờ xử lý (Ví đối tác)
          </Badge>
        );
      case 3:
        return (
          <Badge className="bg-indigo-600 text-white gap-1">
            <Bike className="h-3 w-3" /> Đang thuê xe (Active)
          </Badge>
        );
      case 4:
        return (
          <Badge className="bg-emerald-600 text-white gap-1">
            <CheckCircle2 className="h-3 w-3" /> Hoàn tất
          </Badge>
        );
      case 5:
        return (
          <Badge className="bg-slate-500 text-white gap-1">
            <XCircle className="h-3 w-3" /> Đã hủy / Hết hạn
          </Badge>
        );
      default:
        return <Badge variant="outline">Trạng thái #{status}</Badge>;
    }
  };

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Lịch Sử Đơn Thuê Xe
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Theo dõi tình trạng đơn đặt chỗ, thanh toán cọc VietQR và biên bản bàn giao xe thực tế.
            </p>
          </div>
          <Link href="/">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs rounded-xl gap-1.5">
              <Bike className="h-4 w-4" /> Đặt thêm xe mới
            </Button>
          </Link>
        </div>

        {/* Search & Date Range Filter Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          <div className="lg:col-span-5 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Tìm theo mã đơn BK-..., dòng xe, tên nhà xe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 text-xs h-9.5 rounded-xl bg-slate-50/50"
            />
          </div>

          <div className="lg:col-span-2">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="text-xs h-9.5 rounded-xl bg-slate-50/50"
              title="Từ ngày đặt xe"
            />
          </div>

          <div className="lg:col-span-2">
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="text-xs h-9.5 rounded-xl bg-slate-50/50"
              title="Đến ngày"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9.5 text-xs font-semibold px-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="0">Chờ thanh toán cọc</option>
              <option value="1">Đã cọc (Chờ giao xe)</option>
              <option value="2">Hàng chờ (Thiếu ví)</option>
              <option value="3">Đang thuê (Active)</option>
              <option value="4">Hoàn tất (Completed)</option>
              <option value="5">Đã hủy (Cancelled)</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFromDate("");
                setToDate("");
                setStatusFilter("ALL");
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
            <Clock className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
            <p className="text-xs font-semibold">Đang tải lịch sử đơn thuê...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="text-center py-16 rounded-2xl border shadow-xs p-8 bg-white">
            <Bike className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {bookings.length === 0 ? "Chưa có đơn thuê nào" : "Không tìm thấy đơn thuê nào phù hợp"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {bookings.length === 0
                ? "Bạn chưa thực hiện đơn đặt xe nào trên hệ thống. Hãy chọn ngay chiếc xe ưng ý cho chuyến đi!"
                : "Hãy thử xóa từ khóa tìm kiếm hoặc mở rộng khoảng ngày lọc."}
            </p>
            {bookings.length === 0 && (
              <Link href="/" className="inline-block mt-4">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs rounded-xl font-bold">
                  Tìm xe ngay
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => {
              const detail = b.bookingDetails?.[0];
              const isPending = b.status === 0;
              const isCompleted = b.status === 4;

              return (
                <Card
                  key={b.id}
                  className="rounded-2xl border-slate-200 shadow-xs hover:shadow-md transition-shadow bg-white overflow-hidden"
                >
                  <CardHeader className="p-4 sm:p-5 pb-3 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-sm text-slate-900">
                        {b.bookingCode}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500">
                        Ngày tạo: {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    <div>{getStatusBadge(b.status)}</div>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Vehicle & Store info */}
                      <div className="space-y-1.5 flex-1">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {detail?.model?.name || "Dòng xe cho thuê"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <Store className="h-3.5 w-3.5 text-blue-600" />
                            {b.store?.storeName || "Nhà xe đối tác"}
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

                        {/* Handed over vehicle plate */}
                        {detail?.vehicleItem && (
                          <div className="pt-1">
                            <span className="text-xs font-semibold text-slate-700">Biển số bàn giao: </span>
                            <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {detail.vehicleItem.licensePlate} ({detail.vehicleItem.color || "Tiêu chuẩn"})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pricing breakdown */}
                      <div className="text-left md:text-right border-t md:border-t-0 md:border-l md:pl-6 pt-3 md:pt-0 space-y-1 min-w-[180px]">
                        <div className="text-xs text-slate-500">
                          Tổng tiền: <strong className="text-slate-800 font-bold">{Number(b.rentAmount).toLocaleString("vi-VN")} đ</strong>
                        </div>
                        <div className="text-xs text-blue-600 font-bold">
                          Tiền cọc: {Number(b.depositAmount).toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="border-t pt-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[11px] text-slate-500">
                        {isPending && "Phiên giữ chỗ sẽ tự động hủy nếu không thanh toán trong 10 phút."}
                        {isCompleted && "Chuyến đi đã hoàn thành an toàn. Hãy để lại đánh giá cho nhà xe!"}
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBooking(b.id)}
                              className="text-xs text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-8 rounded-lg"
                            >
                              Hủy đơn đặt xe
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleOpenQr(b)}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 rounded-lg gap-1.5"
                            >
                              <QrCode className="h-3.5 w-3.5" /> Thanh toán cọc VietQR
                            </Button>
                          </>
                        )}

                        {isCompleted && (
                          b.review ? (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-amber-50/80 border border-amber-200 px-3 py-1.5 rounded-xl text-xs">
                              <div className="flex items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`h-3.5 w-3.5 ${
                                        s <= b.review!.rateStar
                                          ? "text-amber-500 fill-amber-400"
                                          : "text-slate-200 fill-slate-100"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-bold text-amber-900 ml-1">
                                  {b.review.rateStar}/5 sao
                                </span>
                              </div>
                              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                                ✓ Đã đánh giá
                              </span>
                              {b.review.comment && (
                                <span className="text-[11px] text-slate-600 italic truncate max-w-[200px]">
                                  "{b.review.comment}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setReviewBooking(b);
                                setRateStar(5);
                                setReviewComment("");
                              }}
                              className="text-xs border-amber-300 bg-amber-50/50 text-amber-900 hover:bg-amber-100 h-8 rounded-lg gap-1.5 shadow-2xs"
                            >
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" /> Viết đánh giá chuyến đi
                            </Button>
                          )
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

      {/* VietQR View Modal */}
      {qrModalBooking && (
        <Dialog open={!!qrModalBooking} onOpenChange={() => setQrModalBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6 text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Thanh Toán VietQR Giữ Chỗ</DialogTitle>
              <DialogDescription className="text-xs">
                Mã đơn: <span className="font-mono font-bold text-slate-900">{qrModalBooking.bookingCode}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 flex flex-col items-center">
              <div className="w-56 h-56 bg-slate-50 border rounded-2xl p-2 flex items-center justify-center">
                {qrData?.qrCode ? (
                  <img src={qrData.qrCode} alt="Mã QR PayOS thanh toán cọc đơn thuê xe" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="h-20 w-20 text-slate-300 animate-pulse" />
                )}
              </div>
              <div className="mt-3 text-xs space-y-1.5 w-full bg-slate-50 p-3.5 rounded-2xl border text-left">
                {qrData?.accountName && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Chủ tài khoản:</span>
                    <strong className="text-slate-900 uppercase font-bold">{qrData.accountName}</strong>
                  </div>
                )}
                {qrData?.accountNumber && (
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Số tài khoản:</span>
                    <strong className="font-mono text-slate-900 font-bold">{qrData.accountNumber}</strong>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-600">
                  <span>Số tiền cọc:</span>
                  <strong className="text-blue-700 font-black">{Number(qrModalBooking.depositAmount).toLocaleString("vi-VN")} VNĐ</strong>
                </div>
                <div className="flex justify-between items-center text-slate-600 border-t pt-1.5">
                  <span>Nội dung CK:</span>
                  <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-600 font-bold">
                    {qrData?.transactionRef || qrModalBooking.bookingCode}
                  </strong>
                </div>
              </div>
              {qrData?.checkoutUrl && (
                <a
                  href={qrData.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  <span>Mở cổng thanh toán PayOS trực tiếp</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrModalBooking(null)}
                className="w-full"
              >
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Modal */}
      {reviewBooking && (
        <Dialog open={!!reviewBooking} onOpenChange={() => setReviewBooking(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Đánh giá dịch vụ nhà xe</DialogTitle>
              <DialogDescription className="text-xs">
                Đơn thuê xe {reviewBooking.bookingDetails?.[0]?.model?.name} ({reviewBooking.store?.storeName})
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
              {/* Star Rating */}
              <div className="space-y-1.5 text-center py-2">
                <Label className="text-xs font-semibold text-slate-700">Chấm điểm chất lượng:</Label>
                <div className="flex justify-center gap-2 mt-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRateStar(s)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          s <= rateStar
                            ? "text-amber-500 fill-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Textarea */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Nhận xét chi tiết:</Label>
                <Textarea
                  placeholder="Chia sẻ trải nghiệm về chất lượng xe, độ sạch sẽ, thái độ phục vụ của chủ nhà xe..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="text-xs min-h-[90px]"
                  required
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReviewBooking(null)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingReview}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

