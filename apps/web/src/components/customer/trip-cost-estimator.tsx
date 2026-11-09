"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Navigation,
  Fuel,
  Zap,
  TrendingDown,
  ShieldCheck,
  Compass,
  MapPin,
  ChevronRight,
} from "lucide-react";

interface RoutePreset {
  id: string;
  name: string;
  region: string;
  distanceKm: number;
  terrain: "mountain" | "coastal" | "mixed" | "city";
  terrainLabel: string;
  bestVehicleType: number; // 0: Xe số, 1: Tay ga, 2: Côn tay, 3: Xe điện
  bestVehicleName: string;
  advice: string;
}

const PRESET_ROUTES: RoutePreset[] = [
  {
    id: "danang-haivan-hoian",
    name: "Đà Nẵng ➔ Đèo Hải Vân ➔ Hội An",
    region: "Miền Trung",
    distanceKm: 65,
    terrain: "mountain",
    terrainLabel: "Đèo biển uốn lượn, dốc cua",
    bestVehicleType: 2, // Côn tay hoặc Xe số
    bestVehicleName: "Xe Côn tay (Winner/Exciter) hoặc Xe số",
    advice:
      "Đèo dốc quanh co cần lực kéo tốt và hãm động cơ bằng số thấp khi xuống đèo để chống cháy bố thắng.",
  },
  {
    id: "hanoi-tamdao",
    name: "Hà Nội ➔ Tam Đảo / Ba Vì",
    region: "Miền Bắc",
    distanceKm: 80,
    terrain: "mountain",
    terrainLabel: "Đường cao tốc & Đèo dốc cao",
    bestVehicleType: 0,
    bestVehicleName: "Xe số khỏe (Wave RSX / Future)",
    advice:
      "Dốc Tam Đảo rất dốc, khuyến nghị ưu tiên xe số để an toàn tối đa khi đổ đèo.",
  },
  {
    id: "hcm-vungtau",
    name: "TP. Hồ Chí Minh ➔ Vũng Tàu",
    region: "Miền Nam",
    distanceKm: 95,
    terrain: "coastal",
    terrainLabel: "Đường trường bằng phẳng ven biển",
    bestVehicleType: 1,
    bestVehicleName: "Xe tay ga êm ái (Air Blade / Lead)",
    advice:
      "Đường trường thoáng, cốp rộng chứa đồ bơi và hành lý, tư thế ngồi êm ái chống mỏi lưng.",
  },
  {
    id: "dalat-nhatrang",
    name: "Đà Lạt ➔ Đèo Khánh Lê ➔ Nha Trang",
    region: "Tây Nguyên & Miền Trung",
    distanceKm: 135,
    terrain: "mountain",
    terrainLabel: "Đèo mây dài 30km, dốc dài",
    bestVehicleType: 2,
    bestVehicleName: "Xe côn tay hoặc Xe số phuộc êm",
    advice:
      "Đèo dài nhất Việt Nam, sương mù và dốc liên tục. Tuyệt đối không rà thắng xe ga liên tục.",
  },
  {
    id: "city-tour",
    name: "City Tour Khám Phá Nội Thành",
    region: "Toàn quốc",
    distanceKm: 35,
    terrain: "city",
    terrainLabel: "Đô thị đông đúc, dừng đèn đỏ",
    bestVehicleType: 3,
    bestVehicleName: "Xe máy điện thông minh (VinFast)",
    advice:
      "Tiết kiệm chi phí 85%, vận hành êm ái không tiếng ồn, thân thiện với môi trường đô thị.",
  },
];

// Current benchmark fuel & energy prices (VND)
const PETROL_PRICE_PER_LITER = 23800; // Xăng RON 95
const ELECTRIC_COST_PER_KM = 80; // ~8.000 VND / 100km

interface TripCostEstimatorProps {
  onSelectCategory?: (typeIndex: number) => void;
}

export function TripCostEstimator({ onSelectCategory }: TripCostEstimatorProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    PRESET_ROUTES[0].id
  );
  const [distanceKm, setDistanceKm] = useState<number>(PRESET_ROUTES[0].distanceKm);
  const [tripDays, setTripDays] = useState<number>(2);

  const activeRoute = useMemo(() => {
    return (
      PRESET_ROUTES.find((r) => r.id === selectedRouteId) || PRESET_ROUTES[0]
    );
  }, [selectedRouteId]);

  const handleSelectPreset = (route: RoutePreset) => {
    setSelectedRouteId(route.id);
    setDistanceKm(route.distanceKm);
  };

  // Calculations
  const stats = useMemo(() => {
    // Distance both ways + local roaming (approx 1.3x)
    const totalKm = distanceKm * 2;

    // Fuel consumption benchmarks (L/100km)
    const xeSoLiters = (totalKm / 100) * 1.6;
    const xeGaLiters = (totalKm / 100) * 2.2;
    const conTayLiters = (totalKm / 100) * 2.3;

    const xeSoCost = Math.round(xeSoLiters * PETROL_PRICE_PER_LITER);
    const xeGaCost = Math.round(xeGaLiters * PETROL_PRICE_PER_LITER);
    const conTayCost = Math.round(conTayLiters * PETROL_PRICE_PER_LITER);
    const evCost = Math.round(totalKm * ELECTRIC_COST_PER_KM);

    // Savings vs standard gas scooter
    const evSavings = Math.max(0, xeGaCost - evCost);
    const evSavingsPercent = Math.round((evSavings / xeGaCost) * 100);

    return {
      totalKm,
      xeSo: { liters: xeSoLiters.toFixed(1), cost: xeSoCost },
      xeGa: { liters: xeGaLiters.toFixed(1), cost: xeGaCost },
      conTay: { liters: conTayLiters.toFixed(1), cost: conTayCost },
      ev: { cost: evCost, savingsPercent: evSavingsPercent },
    };
  }, [distanceKm]);

  return (
    <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8 text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Công Cụ Hỗ Trợ Chuyến Đi
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex flex-wrap items-center gap-3">
            <span>Dự Toán Chi Phí & Lộ Trình Thông Minh</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
              Xăng RON95: ~23.8k/L
            </span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Chọn cung đường phượt hoặc kéo cự ly để tính chính xác tiền xăng, so sánh mức tiêu hao và nhận gợi ý dòng xe an toàn nhất.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
          <div className="px-3 py-1 text-xs text-slate-600 font-semibold">Thời gian:</div>
          {[1, 2, 3, 5].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setTripDays(d)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                tripDays === d
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {d} ngày
            </button>
          ))}
        </div>
      </div>

      {/* Preset Route Pills */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Compass className="h-4 w-4 text-blue-600" />
          Các Cung Đường Phổ Biến Được Yêu Thích:
        </label>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {PRESET_ROUTES.map((route) => {
            const isSelected = selectedRouteId === route.id;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => handleSelectPreset(route)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-all text-left ${
                  isSelected
                    ? "bg-blue-50 border-blue-600 text-blue-700 shadow-xs font-bold"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <MapPin
                  className={`h-3.5 w-3.5 ${
                    isSelected ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <span>{route.name}</span>
                <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 font-mono">
                  {route.distanceKm} km
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance Slider */}
      <div className="mb-8 bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Khoảng cách di chuyển một chiều:
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-600 font-mono">
              {distanceKm}
            </span>
            <span className="text-xs font-semibold text-slate-500">km</span>
            <span className="text-xs text-slate-500 ml-2">
              (Khứ hồi ~{stats.totalKm} km)
            </span>
          </div>
        </div>

        <input
          type="range"
          min={10}
          max={350}
          step={5}
          value={distanceKm}
          onChange={(e) => {
            setDistanceKm(Number(e.target.value));
            setSelectedRouteId("custom");
          }}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
        />

        <div className="flex justify-between text-[11px] text-slate-500 font-mono mt-2">
          <span>10 km (Dạo phố)</span>
          <span>100 km (Cuối tuần)</span>
          <span>200 km (Đi đèo xa)</span>
          <span>350 km (Phượt xuyên tỉnh)</span>
        </div>
      </div>

      {/* Results Comparison Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Xe số */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase">
              1. Xe Số Phổ Thông
            </span>
            <Badge variant="outline" className="text-[10px] bg-slate-100 border-slate-200 text-slate-700">
              1.6L / 100km
            </Badge>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.xeSo.cost.toLocaleString("vi-VN")}{" "}
            <span className="text-xs text-slate-500 font-sans font-normal">đ</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Fuel className="h-3 w-3 text-amber-500" />
            Hao ~{stats.xeSo.liters} lít xăng
          </div>
          <div className="text-[11px] text-emerald-600 mt-2 font-medium">
            ✓ Bền bỉ, tiết kiệm xăng, leo dốc khỏe
          </div>
        </div>

        {/* Xe ga */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase">
              2. Xe Tay Ga Cao Cấp
            </span>
            <Badge variant="outline" className="text-[10px] bg-slate-100 border-slate-200 text-slate-700">
              2.2L / 100km
            </Badge>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.xeGa.cost.toLocaleString("vi-VN")}{" "}
            <span className="text-xs text-slate-500 font-sans font-normal">đ</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Fuel className="h-3 w-3 text-amber-500" />
            Hao ~{stats.xeGa.liters} lít xăng
          </div>
          <div className="text-[11px] text-blue-600 mt-2 font-medium">
            ✓ Cốp lớn, tư thế ngồi êm ái, chống mỏi
          </div>
        </div>

        {/* Côn tay */}
        <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase">
              3. Xe Côn Tay Thể Thao
            </span>
            <Badge variant="outline" className="text-[10px] bg-slate-100 border-slate-200 text-slate-700">
              2.3L / 100km
            </Badge>
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {stats.conTay.cost.toLocaleString("vi-VN")}{" "}
            <span className="text-xs text-slate-500 font-sans font-normal">đ</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Fuel className="h-3 w-3 text-amber-500" />
            Hao ~{stats.conTay.liters} lít xăng
          </div>
          <div className="text-[11px] text-indigo-600 mt-2 font-medium">
            ✓ Lực kéo tốt, phanh số an toàn khi đổ đèo
          </div>
        </div>

        {/* Xe điện */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 border-2 border-emerald-500/70 p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-2 right-2">
            <Badge className="bg-emerald-600 text-white font-bold text-[10px] uppercase">
              Tiết kiệm {stats.ev.savingsPercent}%
            </Badge>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-emerald-600" />
              4. Xe Máy Điện
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">
            {stats.ev.cost.toLocaleString("vi-VN")}{" "}
            <span className="text-xs text-slate-500 font-sans font-normal">đ</span>
          </div>
          <div className="text-xs text-emerald-700 mt-1 flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-emerald-600" />
            Rẻ hơn xe ga ~{(stats.xeGa.cost - stats.ev.cost).toLocaleString("vi-VN")}đ
          </div>
          <div className="text-[11px] text-emerald-700 mt-2 font-medium">
            ✓ 0 Khí thải, êm như bay, đi nội thành cực hời
          </div>
        </div>
      </div>

      {/* Route & Safety Recommendation Banner */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex-shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                Khuyến nghị lộ trình:
              </span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] font-bold">
                {activeRoute.bestVehicleName}
              </Badge>
            </div>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed">
              {activeRoute.advice}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {onSelectCategory && (
            <Button
              type="button"
              onClick={() => onSelectCategory(activeRoute.bestVehicleType)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl h-10 px-4 gap-1.5 shadow-sm"
            >
              <span>Xem Xe Đề Xuất Phù Hợp</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
