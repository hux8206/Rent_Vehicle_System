"use client";

import React from "react";
import Link from "next/link";
import { VehicleModel } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Scale,
  X,
  Fuel,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Bike,
  Gauge,
  Luggage,
} from "lucide-react";

interface VehicleCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleModel[];
  onRemoveVehicle: (id: number) => void;
  onClearAll: () => void;
}

export function VehicleCompareModal({
  isOpen,
  onClose,
  vehicles,
  onRemoveVehicle,
  onClearAll,
}: VehicleCompareModalProps) {
  const typeLabels: Record<number, string> = {
    0: "Xe số",
    1: "Tay ga",
    2: "Côn tay",
    3: "Xe điện",
  };

  const typeSpecs: Record<
    number,
    {
      fuelUsage: string;
      trunkCapacity: string;
      terrain: string;
      keyType: string;
      advantage: string;
    }
  > = {
    0: {
      fuelUsage: "1.5 - 1.8 L / 100km",
      trunkCapacity: "9 - 12 L (Vừa 1 mũ nửa đầu)",
      terrain: "Leo đèo dốc cực tốt, phượt đường dài",
      keyType: "Khóa cơ / Khóa từ",
      advantage: "Bền bỉ, siêu tiết kiệm xăng, leo dốc khỏe",
    },
    1: {
      fuelUsage: "2.1 - 2.4 L / 100km",
      trunkCapacity: "18 - 28 L (Cốp rộng 2 mũ bảo hiểm)",
      terrain: "Nội thành, dạo biển, đường bằng phẳng",
      keyType: "Khóa thông minh Smartkey chống trộm",
      advantage: "Êm ái, cốp để đồ rộng, tiện lợi du lịch",
    },
    2: {
      fuelUsage: "2.3 - 2.6 L / 100km",
      trunkCapacity: "Không có cốp (Gắn balo phượt)",
      terrain: "Phượt đèo núi hiểm trở, tăng tốc cao tốc",
      keyType: "Khóa cơ thể thao / Smartkey",
      advantage: "Động cơ mạnh mẽ, cảm giác lái thể thao",
    },
    3: {
      fuelUsage: "0đ tiền xăng (Sạc ~8.000đ / 100km)",
      trunkCapacity: "22 - 25 L (Cốp rộng thoải mái)",
      terrain: "Thành phố, khu du lịch sinh thái",
      keyType: "Smartkey + Mở khóa NFC / App",
      advantage: "Không tiếng ồn, không mùi xăng, tiết kiệm 85% năng lượng",
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl rounded-3xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto bg-white border border-slate-200">
        <DialogHeader className="pb-3 border-b border-slate-100 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Scale className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                So Sánh Đối Đầu Trực Quan ({vehicles.length}/3 Dòng Xe)
              </DialogTitle>
            </div>
            {vehicles.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
              >
                Xóa tất cả
              </Button>
            )}
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Đối chiếu chi tiết giá thuê, mức cọc, mức tiêu hao nhiên liệu và địa hình tối ưu để chọn chiếc xe ưng ý nhất.
          </DialogDescription>
        </DialogHeader>

        {vehicles.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Bike className="h-12 w-12 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">Chưa chọn xe nào để so sánh</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Hãy nhấn nút "So sánh" trên các thẻ xe ở trang chủ để đưa vào bảng đối chiếu này (tối đa 3 xe cùng lúc).
            </p>
          </div>
        ) : (
          <div className="pt-2 space-y-6">
            {/* Grid Columns for Compared Vehicles */}
            <div className={`grid grid-cols-1 md:grid-cols-${vehicles.length} gap-4`}>
              {vehicles.map((v, idx) => {
                const spec = typeSpecs[v.type] || typeSpecs[1];
                const coverImg =
                  v.images && v.images.length > 0
                    ? v.images[0]
                    : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80";

                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all space-y-4 flex flex-col justify-between relative group"
                  >
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => onRemoveVehicle(v.id)}
                      className="absolute top-3 right-3 h-7 w-7 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 flex items-center justify-center transition-colors z-10"
                      title="Xóa khỏi bảng so sánh"
                    >
                      <X className="h-4 w-4" />
                    </button>

                    <div className="space-y-3">
                      {/* Image */}
                      <div className="h-36 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                        <img
                          src={coverImg}
                          alt={v.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="bg-slate-900/85 text-white font-bold text-[10px] px-2 py-0.5 rounded-full">
                            Xe {idx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Title & Brand */}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-2 py-0.5">
                            {typeLabels[v.type] || "Xe máy"}
                          </Badge>
                          <span className="text-[11px] font-bold text-slate-500 uppercase">
                            {v.brand}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-base text-slate-900 mt-1 line-clamp-1">
                          {v.name}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                          <span className="truncate">{v.store?.storeName || "Nhà xe đối tác"}</span>
                        </p>
                      </div>

                      {/* Price Highlight */}
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-medium">Giá thuê:</span>
                        <div>
                          <strong className="text-lg font-black text-blue-600">
                            {Number(v.rentPrice).toLocaleString("vi-VN")} đ
                          </strong>
                          <span className="text-xs text-slate-400">/ngày</span>
                        </div>
                      </div>

                      {/* Detailed Specs Table */}
                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="pb-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Fuel className="h-3.5 w-3.5 text-amber-500" /> Nhiên liệu:
                          </span>
                          <span className="font-semibold text-slate-800 text-right">{spec.fuelUsage}</span>
                        </div>

                        <div className="pb-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Luggage className="h-3.5 w-3.5 text-blue-500" /> Cốp xe:
                          </span>
                          <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]" title={spec.trunkCapacity}>
                            {spec.trunkCapacity}
                          </span>
                        </div>

                        <div className="pb-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <Gauge className="h-3.5 w-3.5 text-indigo-500" /> Địa hình:
                          </span>
                          <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]" title={spec.terrain}>
                            {spec.terrain}
                          </span>
                        </div>

                        <div className="pb-1.5 border-b border-slate-100 flex items-center justify-between">
                          <span className="text-slate-500 flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Khóa xe:
                          </span>
                          <span className="font-semibold text-slate-800 text-right truncate max-w-[140px]">
                            {spec.keyType}
                          </span>
                        </div>

                        <div className="pt-1">
                          <span className="text-[11px] font-bold text-slate-500 block mb-0.5 uppercase tracking-wider">
                            Điểm nổi trội:
                          </span>
                          <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-200 leading-relaxed font-medium">
                            ✓ {spec.advantage}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Book Button */}
                    <div className="pt-2">
                      <Link href={`/vehicles/${v.id}`} onClick={onClose} className="block">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-1.5 shadow-xs transition-colors">
                          <span>Xem Chi Tiết & Đặt Xe</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Floating Bottom Dock for Compare ───────────────────────────────────
interface FloatingCompareBarProps {
  vehicles: VehicleModel[];
  onOpenModal: () => void;
  onRemoveVehicle: (id: number) => void;
  onClearAll: () => void;
}

export function FloatingCompareBar({
  vehicles,
  onOpenModal,
  onRemoveVehicle,
  onClearAll,
}: FloatingCompareBarProps) {
  if (vehicles.length === 0) return null;

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200/90 rounded-2xl p-3 sm:px-5 sm:py-3 shadow-xl flex flex-wrap items-center justify-between gap-4 max-w-2xl w-full">
        {/* Left: Selected vehicles pills */}
        <div className="flex items-center gap-2.5 overflow-x-auto">
          <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Scale className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold text-slate-700 hidden sm:inline whitespace-nowrap">
            So sánh ({vehicles.length}/3):
          </span>

          <div className="flex items-center gap-2">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full pl-1.5 pr-2 py-1 text-xs text-slate-800"
              >
                <img
                  src={
                    v.images && v.images.length > 0
                      ? v.images[0]
                      : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=100&q=80"
                  }
                  alt={v.name}
                  className="h-5 w-5 rounded-full object-cover"
                />
                <span className="font-semibold max-w-[90px] sm:max-w-[120px] truncate text-[11px] text-slate-800">
                  {v.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveVehicle(v.id)}
                  className="text-slate-400 hover:text-red-500 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            size="sm"
            onClick={onOpenModal}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs gap-1.5"
          >
            <span>So Sánh Chi Tiết</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>

          <button
            type="button"
            onClick={onClearAll}
            className="text-slate-400 hover:text-slate-700 text-xs p-1"
            title="Đóng thanh so sánh"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
