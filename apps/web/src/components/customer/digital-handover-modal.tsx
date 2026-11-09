"use client";

import React, { useState } from "react";
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
  ShieldCheck,
  CheckCircle2,
  Camera,
  Gauge,
  Fuel,
  Disc,
  Eye,
  FileCheck2,
  PhoneCall,
  Lock,
} from "lucide-react";

interface DigitalHandoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleModel;
}

export function DigitalHandoverModal({
  isOpen,
  onClose,
  vehicle,
}: DigitalHandoverModalProps) {
  // Fuel / Battery interactive slider
  const [fuelLevel, setFuelLevel] = useState<number>(85);
  const [activeTab, setActiveTab] = useState<"checklist" | "guarantee">("checklist");

  const checklistItems = [
    {
      title: "1. Hệ thống Phanh Trước & Phanh Sau",
      desc: "Hành trình phanh đạt chuẩn, má phanh còn độ bám cao, dầu phanh đầy đủ không rò rỉ.",
      status: "ĐẠT CHUẨN",
      icon: Disc,
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "2. Đèn Pha / Cos & Xi-Nhan 2 Bên",
      desc: "Toàn bộ bóng LED/Halogen hoạt động tốt, tầm chiếu sáng đêm rõ nét, đèn phanh sau sáng khi bóp thắng.",
      status: "ĐẠT CHUẨN",
      icon: Eye,
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "3. Cặp Gương Chiếu Hậu Nguyên Bản",
      desc: "Đầy đủ 2 gương đúng quy chuẩn giao thông đường bộ, mặt kính trong không mờ nứt, chỉnh góc linh hoạt.",
      status: "ĐẠT CHUẨN",
      icon: ShieldCheck,
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "4. Áp Suất & Gai Lốp Xe",
      desc: "Lốp không cán đinh, áp suất lốp trước ~2.0 kg/cm², sau ~2.25 kg/cm². Rãnh gai sâu bám đường tốt khi trời mưa.",
      status: "ĐẠT CHUẨN",
      icon: Gauge,
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      title: "5. Mức Xăng / Dung Lượng Pin Khi Bàn Giao",
      desc: "Ghi nhận mức xăng thực tế khi bàn giao. Khách hàng chỉ cần đổ xăng tương đương khi trả xe.",
      status: "MINH BẠCH",
      icon: Fuel,
      accent: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      title: "6. Chụp Ảnh & Video Hiện Trạng 4 Góc",
      desc: "Lưu trữ kỹ thuật số ảnh 4 mặt xe vào hợp đồng điện tử trước khi lăn bánh. Tránh tuyệt đối mọi tranh chấp trầy xước.",
      status: "LƯU TRỮ ĐIỆN TỬ",
      icon: Camera,
      accent: "text-blue-700 bg-blue-50 border-blue-200",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white border-slate-200 text-slate-900 rounded-3xl shadow-2xl">
        {/* Header with safety seal */}
        <div className="bg-slate-50 p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Quy Trình Kiểm Tra Minh Bạch 100%
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900">
                  Biên Bản Kiểm Định 6 Điểm An Toàn
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-xs mt-0.5">
                  Áp dụng cho dòng xe:{" "}
                  <span className="text-blue-600 font-bold">{vehicle.name}</span>{" "}
                  • Biển kiểm soát xác thực theo từng xe
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex items-center gap-2 mt-5">
            <button
              type="button"
              onClick={() => setActiveTab("checklist")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "checklist"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              6 Hạng Mục Kỹ Thuật
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("guarantee")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "guarantee"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Cam Kết 3 Không & SOS 24/7
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "checklist" ? (
            <>
              <div className="grid grid-cols-1 gap-3">
                {checklistItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/90 flex items-start gap-3.5 hover:bg-white hover:border-slate-300 transition-colors"
                    >
                      <div
                        className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 ${item.accent}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 tracking-wide">
                            {item.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
                            {item.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Fuel Gauge Simulator */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase">
                      Đo vạch xăng bàn giao:
                    </span>
                  </div>
                  <span className="text-sm font-black text-amber-700 font-mono">
                    {fuelLevel}% ({Math.round((fuelLevel / 100) * 4.2)} Lít)
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={fuelLevel}
                  onChange={(e) => setFuelLevel(Number(e.target.value))}
                  className="w-full h-2 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
                <p className="text-[11px] text-slate-600 mt-2">
                  💡 Nhân viên cửa hàng sẽ cùng bạn tích chọn vạch xăng thực tế trên điện thoại khi nhận xe và gửi email xác nhận tức thì.
                </p>
              </div>

              {/* Verified Certificate Seal */}
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-black uppercase text-blue-800 tracking-wider">
                    Chứng Chỉ An Toàn Số: #VR-SAFE-2026
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Được kiểm định bởi Kỹ thuật viên đối tác ủy quyền
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white font-bold text-xs px-3 py-1">
                  100% ĐẠT CHUẨN
                </Badge>
              </div>
            </>
          ) : (
            /* Guarantees & Moat */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  Chính Sách &quot;3 Không&quot; Bảo Vệ Khách Thuê:
                </h4>
                <ul className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">1.</span>
                    <span>
                      <strong className="text-slate-900">Không phạt trầy xước hao mòn:</strong>{" "}
                      Các vết xước dăm tự nhiên trong quá trình gửi bãi đỗ không bao giờ bị tính phí.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">2.</span>
                    <span>
                      <strong className="text-slate-900">Không giữ CCCD / Hộ chiếu gốc:</strong>{" "}
                      Chỉ đối chiếu và chụp ảnh lưu hồ sơ. Bạn luôn giữ giấy tờ tùy thân bên người để an tâm du lịch.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">3.</span>
                    <span>
                      <strong className="text-slate-900">Không ép buộc mua bảo hiểm phụ:</strong>{" "}
                      Mọi xe đều có sẵn Bảo hiểm TNDS bắt buộc và gói Cứu hộ 24/7 của hệ thống.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-100 border border-rose-200 text-rose-700 flex-shrink-0">
                    <PhoneCall className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-700 uppercase tracking-wide">
                      Đội Cứu Hộ Khẩn Cấp 24/7 (Roadside SOS)
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Xe bị thủng lốp, hỏng hóc kỹ thuật hoặc sự cố giữa đường? Hotline điều phối kỹ thuật viên hoặc xe thay thế đến tận nơi trong vòng 30 - 45 phút trên toàn hệ thống mạng lưới chi nhánh.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-blue-600" />
            Bảo mật & Ký số trực tiếp trên ứng dụng
          </span>
          <Button
            type="button"
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl px-5"
          >
            Đã Hiểu & Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
