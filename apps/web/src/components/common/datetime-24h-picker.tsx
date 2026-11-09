"use client";

import React, { useMemo } from "react";
import { Calendar, Clock } from "lucide-react";

export interface DateTime24hPickerProps {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  minDate?: string; // "YYYY-MM-DD"
  label?: string;
  icon?: "calendar" | "clock";
  openTime?: string; // e.g. "07:00"
  closeTime?: string; // e.g. "21:00"
  className?: string;
  variant?: "compact" | "stacked";
}

// Generate slots from 00:00 to 23:30 in 30-minute intervals
const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  const hh = String(h).padStart(2, "0");
  TIME_SLOTS.push(`${hh}:00`);
  TIME_SLOTS.push(`${hh}:30`);
}

export function DateTime24hPicker({
  value,
  onChange,
  minDate,
  label,
  icon = "calendar",
  openTime,
  closeTime,
  className = "",
  variant = "stacked",
}: DateTime24hPickerProps) {
  // Parse date and time from value
  const { datePart, timePart } = useMemo(() => {
    if (!value || !value.includes("T")) {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const d = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      const t = `${pad(now.getHours())}:00`;
      return { datePart: d, timePart: t };
    }
    const [d, rawT] = value.split("T");
    const t = rawT ? rawT.substring(0, 5) : "08:00";
    return { datePart: d, timePart: t };
  }, [value]);

  const handleDateChange = (newDate: string) => {
    onChange(`${newDate}T${timePart}`);
  };

  const handleTimeChange = (newTime: string) => {
    onChange(`${datePart}T${newTime}`);
  };

  const parseMins = (tStr?: string) => {
    if (!tStr) return null;
    const [h, m] = tStr.split(":").map(Number);
    if (isNaN(h)) return null;
    return h * 60 + (m || 0);
  };

  const openMins = parseMins(openTime);
  const closeMins = parseMins(closeTime);

  // Hiển thị giờ tinh gọn: chỉ "07:00", "07:30", v.v. (bỏ ngoặc và bỏ chữ ngoài giờ)
  const formatSlotLabel = (slot: string) => {
    return slot;
  };

  if (variant === "compact") {
    // For Home Hero Search Dock (horizontal compact)
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="flex items-center gap-1 bg-transparent">
          <Calendar className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <input
            type="date"
            value={datePart}
            min={minDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-transparent outline-none font-semibold text-xs text-slate-800 w-[115px] cursor-pointer"
          />
        </div>
        <span className="text-slate-300 font-normal">|</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <select
            value={timePart}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="bg-transparent outline-none font-bold text-xs text-blue-700 cursor-pointer"
            title="Chọn giờ"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot} className="text-slate-800 font-medium">
                {formatSlotLabel(slot)}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Variant: Stacked (For Vehicle Detail panel and Booking forms)
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          {icon === "calendar" ? (
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
          ) : (
            <Clock className="h-3.5 w-3.5 text-blue-600" />
          )}
          {label}
        </span>
      )}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-7 relative">
          <input
            type="date"
            value={datePart}
            min={minDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full text-xs h-9.5 px-3 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="col-span-5 relative">
          <select
            value={timePart}
            onChange={(e) => handleTimeChange(e.target.value)}
            className="w-full text-xs h-9.5 px-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            title="Chọn giờ"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {formatSlotLabel(slot)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export function format24hDateTime(dateTimeStr?: string | null): string {
  if (!dateTimeStr) return "";
  const d = new Date(dateTimeStr);
  if (isNaN(d.getTime())) return dateTimeStr;
  const pad = (n: number) => String(n).padStart(2, "0");
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
}

export function formatLocalIsoString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  return `${year}-${month}-${day}T${hours}:00`;
}

/**
 * Tự động tính toán đủ 24h cho 1 ngày trả xe khi chọn thời gian nhận xe.
 * Trường hợp thời gian trả tính toán trễ hơn giờ mở cửa của cửa hàng,
 * để thành thời gian mở cửa cuối cùng của cửa hàng (closeTime).
 */
export function calculate24hReturnTime(
  pickupDateTimeStr: string,
  storeOpenTime?: string,
  storeCloseTime?: string
): string {
  if (!pickupDateTimeStr || !pickupDateTimeStr.includes("T")) {
    return pickupDateTimeStr;
  }
  const [pickupDate, pickupTime] = pickupDateTimeStr.split("T");

  const dateObj = new Date(pickupDate);
  if (isNaN(dateObj.getTime())) return pickupDateTimeStr;

  // Cộng đủ 1 ngày (24h)
  dateObj.setDate(dateObj.getDate() + 1);

  const pad = (n: number) => String(n).padStart(2, "0");
  const returnDate = `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;

  let returnTime = pickupTime ? pickupTime.substring(0, 5) : "08:00";

  const close = storeCloseTime || "21:00";
  const open = storeOpenTime || "07:00";

  // Nếu thời gian trả tính toán trễ hơn giờ đóng cửa của cửa hàng -> chuyển thành giờ đóng cửa (giờ mở cửa cuối cùng)
  if (returnTime > close) {
    returnTime = close;
  }
  if (returnTime < open) {
    returnTime = open;
  }

  return `${returnDate}T${returnTime}`;
}


