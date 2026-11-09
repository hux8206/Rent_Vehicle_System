"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, Store, VehicleModel, Review } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Store as StoreIcon,
  MapPin,
  Phone,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Bike,
  Star,
  Zap,
  Info,
  MessageSquare,
  User as UserIcon,
  Calendar,
  Sparkles,
  Clock,
} from "lucide-react";

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [store, setStore] = useState<Store | null>(null);
  const [vehicles, setVehicles] = useState<VehicleModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStoreDetail() {
      setIsLoading(true);
      try {
        const data = await api.customer.getStoreDetail(id);
        setStore(data);
        if (data.vehicleModels && data.vehicleModels.length > 0) {
          setVehicles(data.vehicleModels as VehicleModel[]);
        } else {
          setVehicles([]);
        }
      } catch {
        setStore(null);
        setVehicles([]);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadStoreDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container py-24 text-center text-slate-400">
        <StoreIcon className="h-10 w-10 animate-pulse mx-auto text-blue-600 mb-2 opacity-70" />
        <p className="text-sm font-semibold">Đang tải thông tin chi nhánh đối tác...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="container max-w-lg mx-auto py-24 px-4 text-center space-y-4">
        <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200">
          <StoreIcon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Chi nhánh hiện không khả dụng</h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          Cửa hàng này hiện đang tạm ngưng hoạt động, đang trong quá trình bảo trì sửa chữa hoặc tài khoản đối tác đang bị khóa.
        </p>
        <div className="pt-2">
          <Link href="/stores">
            <Button className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs">
              <ArrowLeft className="h-4 w-4" /> Xem Danh Sách Nhà Xe Khác
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const depositPercent = store.rentalPolicy?.depositPercent || 30;
  const rating = store.avgRating ? Number(store.avgRating).toFixed(1) : "5.0";
  const reviewCount = store.reviewCount ?? (store.reviews?.length || 0);
  const reviewsList = store.reviews || [];

  return (
    <div className="py-8 bg-slate-50/60 min-h-screen">
      <div className="container max-w-6xl mx-auto px-4 space-y-8">
        {/* Back Link */}
        <Link
          href="/stores"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách cửa hàng
        </Link>

        {/* Store Header Banner Card */}
        <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <div className="relative h-64 sm:h-72 w-full bg-slate-900">
            <img
              src={store.storeImage || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80"}
              alt={store.storeName}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Đối tác xác thực chính thức
                  </span>
                  <span className="bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-300 text-slate-900" />
                    <span>{rating}</span>
                    <span className="text-[10px] font-semibold text-slate-800">
                      ({reviewCount} đánh giá)
                    </span>
                  </span>
                  {store.province && (
                    <span className="bg-white/20 backdrop-blur-md text-white font-semibold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-blue-300" />
                      {store.province}
                    </span>
                  )}
                  <span className="bg-purple-600/90 backdrop-blur-md text-white font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <Clock className="h-3 w-3 text-purple-200" />
                    Mở cửa: {store.openTime || "07:00"} - {store.closeTime || "21:00"}
                  </span>
                  <span className="bg-blue-600/80 backdrop-blur-md text-white font-semibold text-[10px] px-2.5 py-1 rounded-full">
                    Cọc {depositPercent}%
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">{store.storeName}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                  <span>{store.address}</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl flex items-center gap-3 shrink-0">
                <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-300">Hotline đặt xe</div>
                  <div className="text-sm font-extrabold text-white">{store.phoneContact}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
            <div className="md:col-span-2 space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Giới thiệu nhà xe</h4>
              <p className="leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {store.description || "Nhà xe chuyên nghiệp, dịch vụ chu đáo, hỗ trợ giao xe tận nơi nhanh chóng, xe luôn được bảo dưỡng định kỳ."}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-sm">Chính sách cọc & Hoàn tiền</h4>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <div>
                  <span className="font-semibold text-slate-800 block">Quy định hủy đơn:</span>
                  <span className="text-slate-600">{store.rentalPolicy?.cancelRule || "Hủy trước 24h hoàn 100% cọc."}</span>
                </div>
                <div className="border-t pt-2">
                  <span className="font-semibold text-slate-800 block">Điều kiện hoàn tiền:</span>
                  <span className="text-slate-600">{store.rentalPolicy?.refundCondition || "Hoàn tiền nhanh qua tài khoản ngân hàng."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicles Showroom Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Dòng Xe Thuộc Cửa Hàng ({vehicles.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các phương tiện sẵn sàng bàn giao trực tiếp tại cửa hàng hoặc giao tận nơi theo yêu cầu.
              </p>
            </div>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400">
              <Bike className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">Cửa hàng hiện chưa cập nhật dòng xe nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => {
                const available = v.availableCount !== undefined ? v.availableCount : 3;

                return (
                  <Link
                    key={v.id}
                    href={`/vehicles/${v.id}`}
                    className="block h-full group outline-none"
                  >
                    <div className="h-full bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-blue-400/50 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer">
                      <div>
                        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={
                              v.images && v.images[0]
                                ? v.images[0]
                                : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80"
                            }
                            alt={v.name}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 flex gap-1.5">
                            <span className="bg-white/95 text-slate-900 font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs">
                              {v.type === 1 ? "Tay ga" : v.type === 0 ? "Xe số" : v.type === 2 ? "Côn tay" : "Xe điện"}
                            </span>
                            <span className="bg-slate-900/80 text-white font-semibold text-[10px] px-2.5 py-1 rounded-full">
                              {v.brand}
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-2.5">
                          <h3 className="font-extrabold text-base text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                            {v.name}
                          </h3>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {v.specifications || "Xe đời mới, trang bị khóa thông minh Smartkey, cốp rộng chứa đồ, động cơ êm ái."}
                          </p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex items-center justify-between gap-3 border-t border-slate-100 mt-2 pt-4">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">Đơn giá</div>
                          <div className="text-base font-black text-slate-900">
                            {Number(v.rentPrice).toLocaleString("vi-VN")} đ
                            <span className="text-xs font-normal text-slate-500">/ngày</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                          <span>Chi tiết & Đặt</span>
                          <span className="text-sm font-black">→</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Customer Reviews Section */}
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-slate-900">
                  Đánh Giá Từ Khách Hàng
                </h2>
                <span className="bg-amber-50 text-amber-800 font-bold text-xs px-2.5 py-0.5 rounded-full border border-amber-200">
                  ★ {rating} ({reviewCount} đánh giá)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Điểm số được tổng hợp từ tất cả đánh giá của khách thuê các dòng xe thuộc nhà xe này.
              </p>
            </div>
          </div>

          {reviewsList.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 text-center text-slate-400">
              <MessageSquare className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <h4 className="text-sm font-bold text-slate-700">Chưa có đánh giá nào</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Nhà xe này hiện chưa có lượt đánh giá nào từ khách thuê. Hãy là người đầu tiên thuê xe và chia sẻ trải nghiệm của bạn!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewsList.map((rev) => {
                const customerName = rev.user?.fullName || rev.customer?.fullName || rev.customerName || "Khách hàng";
                const bookedModelName =
                  rev.booking?.bookingDetails?.[0]?.vehicleModel?.name ||
                  rev.booking?.bookingDetails?.[0]?.model?.name ||
                  "Phương tiện thuê";
                const createdDate = rev.createdAt
                  ? new Date(rev.createdAt).toLocaleDateString("vi-VN")
                  : "Gần đây";

                return (
                  <div
                    key={rev.id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                            {customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{customerName}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {createdDate}
                            </div>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= rev.rateStar
                                  ? "fill-amber-400 text-amber-500"
                                  : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment */}
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                        &quot;{rev.comment}&quot;
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-medium text-slate-600">Đã thuê:</span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        {bookedModelName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
