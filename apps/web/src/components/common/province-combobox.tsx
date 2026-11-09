"use client";

import React, { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check, Search, X } from "lucide-react";
import { VIETNAMESE_PROVINCES } from "@/lib/constants";

interface ProvinceComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
}

export function ProvinceCombobox({
  value = "",
  onChange,
  placeholder = "Chọn tỉnh / thành phố...",
  className = "",
  includeAllOption = false,
  allOptionLabel = "Toàn quốc (Tất cả tỉnh/thành)",
}: ProvinceComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredProvinces = VIETNAMESE_PROVINCES.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const cleanP = p.toLowerCase().replace(/^tp\.\s*/i, "");
    return p.toLowerCase().includes(q) || cleanP.includes(q);
  });

  const isAllSelected = !value || value === "all" || value === allOptionLabel;

  const displayLabel = isAllSelected
    ? includeAllOption
      ? allOptionLabel
      : ""
    : value;

  const handleSelect = (prov: string) => {
    onChange(prov);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(includeAllOption ? "all" : "");
    setSearchQuery("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button / Input Display */}
      <div
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className="flex items-center justify-between gap-1.5 cursor-pointer w-full py-1 text-xs select-none"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
          <span
            className={`font-semibold truncate ${
              displayLabel ? "text-slate-800" : "text-slate-400"
            }`}
          >
            {displayLabel || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {!isAllSelected && value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:text-slate-600 rounded-full hover:bg-slate-100"
              title="Xóa lựa chọn"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 max-w-[90vw] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input inside popover */}
          <div className="relative mb-2">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Gõ tên tỉnh / thành phố..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-medium"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* List of Provinces */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 text-xs">
            {includeAllOption && !searchQuery && (
              <button
                type="button"
                onClick={() => handleSelect("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                  isAllSelected
                    ? "bg-blue-50 text-blue-700 font-bold"
                    : "text-slate-700 hover:bg-slate-50 font-medium"
                }`}
              >
                <span>📍 {allOptionLabel}</span>
                {isAllSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
              </button>
            )}

            {filteredProvinces.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Không tìm thấy tỉnh thành phù hợp
              </div>
            ) : (
              filteredProvinces.map((prov) => {
                const isSelected = value === prov;
                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => handleSelect(prov)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : "text-slate-700 hover:bg-slate-50 font-medium"
                    }`}
                  >
                    <span>{prov}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

