"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { api, Store, SystemConfig, PayoutRequest, PlatformStats, Booking } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Shield,
  TrendingUp,
  DollarSign,
  Users,
  Store as StoreIcon,
  Bike,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Layers,
  Settings,
  Percent,
  CreditCard,
  Sliders,
  Save,
  RefreshCw,
  XCircle,
  HelpCircle,
  Loader2,
  Search,
  RotateCcw,
  ShieldAlert,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminDashboardPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"6m" | "30d" | "7d">("6m");

  // System Configuration states (Requirement 2)
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [creditLimit, setCreditLimit] = useState<number>(500000);
  const [minDepositPercent, setMinDepositPercent] = useState<number>(15);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Payout Management states
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [payoutSearch, setPayoutSearch] = useState("");
  const [payoutFromDate, setPayoutFromDate] = useState("");
  const [payoutToDate, setPayoutToDate] = useState("");
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("ALL");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, cfg, pList, stats, bList] = await Promise.all([
        api.admin.getStores().catch(() => []),
        api.admin.getConfig().catch(() => null),
        api.admin.getPayouts().catch(() => []),
        api.admin.getPlatformStats().catch(() => null),
        api.admin.getBookings().catch(() => []),
      ]);
      setStores(s || []);
      setPlatformStats(stats);
      setAllBookings(bList || []);
      if (cfg) {
        setCommissionRate(Number(cfg.commissionRate));
        setCreditLimit(Number(cfg.creditLimit));
        setMinDepositPercent(Number(cfg.minDepositPercent));
      }
      setPayouts(pList || []);
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Biểu đồ doanh thu & hoa hồng động 100% dữ liệu thực tế
  const dynamicRevenueTrend = useMemo(() => {
    if (timeRange === "6m") {
      if (platformStats?.revenueTrend && platformStats.revenueTrend.length > 0) {
        return platformStats.revenueTrend;
      }
      const now = new Date();
      const list = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        list.push({
          month: `T${d.getMonth() + 1}/${d.getFullYear()}`,
          revenue: 0,
          commission: 0,
          bookings: 0,
        });
      }
      return list;
    }

    if (timeRange === "30d") {
      const today = new Date();
      const points = [];
      for (let i = 29; i >= 0; i -= 3) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        const dayFormatted = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

        const dayBookings = allBookings.filter((b) => {
          const bDate = new Date(b.createdAt).toISOString().split("T")[0];
          return bDate === dateStr;
        });

        const rev = dayBookings
          .filter((b) => [1, 3, 4].includes(b.status))
          .reduce((sum, b) => sum + Number(b.rentAmount || 0), 0);
        const comm = dayBookings
          .filter((b) => [3, 4].includes(b.status))
          .reduce((sum, b) => sum + Number(b.commissionAmount || 0), 0);

        points.push({
          month: dayFormatted,
          revenue: rev,
          commission: comm,
          bookings: dayBookings.length,
        });
      }
      return points;
    }

    if (timeRange === "7d") {
      const today = new Date();
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayName = d.toLocaleDateString("vi-VN", { weekday: "short" });
        const dayFormatted = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        const dateStr = d.toISOString().split("T")[0];

        const dayBookings = allBookings.filter((b) => {
          const bDate = new Date(b.createdAt).toISOString().split("T")[0];
          return bDate === dateStr;
        });

        const rev = dayBookings
          .filter((b) => [1, 3, 4].includes(b.status))
          .reduce((sum, b) => sum + Number(b.rentAmount || 0), 0);
        const comm = dayBookings
          .filter((b) => [3, 4].includes(b.status))
          .reduce((sum, b) => sum + Number(b.commissionAmount || 0), 0);

        days.push({
          month: `${dayName} (${dayFormatted})`,
          revenue: rev,
          commission: comm,
          bookings: dayBookings.length,
        });
      }
      return days;
    }

    return [];
  }, [timeRange, platformStats, allBookings]);

  // Phân bổ trạng thái đơn đặt 100% dữ liệu thực tế
  const dynamicBookingStatusData = useMemo(() => {
    if (platformStats?.bookingStatusBreakdown) {
      const nonZero = platformStats.bookingStatusBreakdown.filter((item) => item.count > 0);
      if (nonZero.length > 0) return nonZero;
      return platformStats.bookingStatusBreakdown;
    }
    return [
      { name: "Đã hoàn tất", status: 4, value: 0, count: 0, color: "#10B981" },
      { name: "Đang cho thuê", status: 3, value: 0, count: 0, color: "#3B82F6" },
      { name: "Chờ bàn giao", status: 1, value: 0, count: 0, color: "#06B6D4" },
      { name: "Hàng chờ FIFO", status: 2, value: 0, count: 0, color: "#8B5CF6" },
      { name: "Chờ thanh toán", status: 0, value: 0, count: 0, color: "#F59E0B" },
      { name: "Đã hủy", status: 5, value: 0, count: 0, color: "#EF4444" },
    ];
  }, [platformStats]);

  // Nhu cầu phân loại xe 100% dữ liệu thực tế
  const dynamicVehicleCategoryData = useMemo(() => {
    if (platformStats?.vehicleCategoryDistribution && platformStats.vehicleCategoryDistribution.length > 0) {
      return platformStats.vehicleCategoryDistribution;
    }
    return [
      { category: "Xe số", type: 0, total: 0, rented: 0 },
      { category: "Xe tay ga", type: 1, total: 0, rented: 0 },
      { category: "Côn tay", type: 2, total: 0, rented: 0 },
      { category: "Xe điện", type: 3, total: 0, rented: 0 },
    ];
  }, [platformStats]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await api.admin.updateConfig({
        commissionRate,
        creditLimit,
        minDepositPercent,
      });
      toast.success(
        `Cập nhật cấu hình sàn thành công! Hoa hồng: ${commissionRate}%, Hạn mức nợ: ${creditLimit.toLocaleString("vi-VN")}đ, Cọc tối thiểu: ${minDepositPercent}%.`
      );
    } catch {
      toast.error("Không thể lưu cấu hình. Vui lòng thử lại!");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleReviewPayout = async (id: number, status: number) => {
    setIsProcessingPayout(true);
    try {
      const res = await api.admin.reviewPayout(id, {
        status,
        note: status === 1 ? "Đã chuyển khoản thành công" : "Từ chối và hoàn trả tiền ví",
      });
      toast.success(res.message || "Thao tác thành công!");
      // Cập nhật lại danh sách payout
      setPayouts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );
    } catch {
      toast.error("Lỗi khi xử lý yêu cầu rút tiền.");
    } finally {
      setIsProcessingPayout(false);
    }
  };

  const pendingPayouts = payouts.filter((p) => p.status === 0);
  const pendingPayoutAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingStoresCount = stores.filter((s) => s.status === 0).length;

  const filteredAdminPayouts = useMemo(() => {
    return payouts.filter((p) => {
      if (payoutStatusFilter !== "ALL" && String(p.status) !== payoutStatusFilter) return false;
      if (payoutFromDate) {
        const d = new Date(p.createdAt).toISOString().split("T")[0];
        if (d < payoutFromDate) return false;
      }
      if (payoutToDate) {
        const d = new Date(p.createdAt).toISOString().split("T")[0];
        if (d > payoutToDate) return false;
      }
      if (payoutSearch.trim()) {
        const q = payoutSearch.toLowerCase();
        const matchId = String(p.id).includes(q) || `po-${p.id}`.includes(q);
        const matchName = p.partner?.fullName?.toLowerCase().includes(q) || p.accountHolder.toLowerCase().includes(q);
        const matchBank = p.bankName.toLowerCase().includes(q) || p.bankAccountNum.includes(q);
        const matchPhone = p.partner?.phone?.includes(q);
        if (!matchId && !matchName && !matchBank && !matchPhone) return false;
      }
      return true;
    });
  }, [payouts, payoutSearch, payoutFromDate, payoutToDate, payoutStatusFilter]);

  return (
    <div className="py-8 sm:py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Báo Cáo & Trung Tâm Điều Hành Sàn
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Giám sát trực quan dữ liệu doanh thu, hoa hồng tích lũy 10%, trạng thái vận hành và phê duyệt đối tác.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/admin/transactions">
              <Button
                size="sm"
                variant="outline"
                className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl gap-2 shadow-xs h-10 px-4 border-slate-200"
              >
                <Receipt className="h-4 w-4 text-emerald-600" />
                <span>Quản Lý Giao Dịch</span>
                {pendingPayouts.length > 0 && (
                  <span className="bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {pendingPayouts.length}
                  </span>
                )}
              </Button>
            </Link>

            <Link href="/admin/stores">
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl gap-2 shadow-xs h-10 px-4"
              >
                <StoreIcon className="h-4 w-4" />
                <span>Duyệt Cửa Hàng</span>
                {pendingStoresCount > 0 && (
                  <span className="bg-white text-red-700 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                    {pendingStoresCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Priority Pending Payout Requests Alert (Requirement 1) */}
        {pendingPayouts.length > 0 && (
          <div className="rounded-2xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/70 p-5 shadow-xs text-emerald-950 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 text-white border-none text-[10px] font-black uppercase">
                      Yêu cầu tài chính ưu tiên
                    </Badge>
                    <span className="text-xs font-bold text-emerald-900">
                      Có {pendingPayouts.length} yêu cầu rút tiền đang chờ giải ngân
                    </span>
                  </div>
                  <h4 className="font-black text-base text-slate-900 mt-0.5">
                    Tổng số tiền đối tác yêu cầu rút:{" "}
                    <span className="text-emerald-700 font-mono text-lg font-black">
                      {pendingPayoutAmount.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </h4>
                  <p className="text-xs text-emerald-800/90 mt-0.5">
                    Đối tác đã gửi yêu cầu rút doanh thu về tài khoản ngân hàng chính chủ. Admin có thể duyệt chi trực tiếp hoặc mở Quản Lý Giao Dịch.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link href="/admin/transactions">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs gap-1.5"
                  >
                    <span>Xem tất cả giao dịch</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick List of Pending Payouts (Top 3) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
              {pendingPayouts.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  className="bg-white/95 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-200/90 shadow-2xs flex flex-col justify-between space-y-2.5"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-slate-900">#PO-{p.id}</span>
                      <span className="font-black text-emerald-700 font-mono text-sm">
                        {Number(p.amount).toLocaleString("vi-VN")} đ
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {p.partner?.fullName || p.accountHolder}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {p.bankName} • <span className="font-mono font-semibold text-slate-900">{p.bankAccountNum}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase">
                      Chủ TK: {p.accountHolder}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      onClick={() => handleReviewPayout(p.id, 1)}
                      disabled={isProcessingPayout}
                      className="h-7.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex-1 shadow-2xs"
                    >
                      Duyệt chi tiền
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewPayout(p.id, 2)}
                      disabled={isProcessingPayout}
                      className="h-7.5 text-[11px] font-bold text-rose-700 border-rose-200 hover:bg-rose-50 rounded-lg flex-1"
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Moderation Alert */}
        {pendingStoresCount > 0 && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-amber-900">
                  Có {pendingStoresCount} cửa hàng đối tác mới đang chờ quản trị viên kiểm duyệt!
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  Vui lòng kiểm tra hồ sơ mặt tiền, thông tin ngân hàng và chính sách cọc trước khi kích hoạt.
                </p>
              </div>
            </div>
            <Link href="/admin/stores">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shrink-0">
                Kiểm duyệt ngay
              </Button>
            </Link>
          </div>
        )}

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Tổng doanh thu toàn sàn</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {(platformStats?.totalRevenue || 0).toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-bold text-slate-500">đ</span>
              </div>
              <div className="text-[11px] text-blue-600 font-bold flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" /> Tổng {allBookings.length} đơn đặt trên toàn sàn
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Hoa hồng sàn thực thu ({commissionRate}%)</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-700 tracking-tight">
                {(platformStats?.totalCommission || 0).toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-bold text-slate-500">đ</span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">
                Khấu trừ từ ví đối tác khi bàn giao xe
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Hệ thống Cửa hàng</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <StoreIcon className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {platformStats?.totalStores ?? stores.length}{" "}
                <span className="text-xs font-semibold text-slate-500">chi nhánh</span>
              </div>
              <div className="text-[11px] text-amber-700 font-bold mt-1">
                {pendingStoresCount > 0
                  ? `${pendingStoresCount} hồ sơ đang chờ xét duyệt`
                  : `${platformStats?.approvedStores ?? stores.filter((s) => s.status === 1).length} chi nhánh đang hoạt động`}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Tổng xe sẵn sàng bàn giao</span>
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Bike className="h-4 w-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {platformStats?.totalVehicles || 0}{" "}
                <span className="text-xs font-semibold text-slate-500">phương tiện</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">
                Sẵn sàng: {platformStats?.availableVehicles || 0} • Đang thuê: {platformStats?.rentedVehicles || 0} (Phủ: {platformStats?.occupancyRate || 0}%)
              </div>
            </div>
          </Card>
        </div>

        {/* ─── Visual Charts Section ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Revenue & Commission Trend (Area Chart - 2 Cols) */}
          <Card className="lg:col-span-2 rounded-2xl border-slate-200/80 shadow-xs bg-white p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Biểu Đồ Doanh Thu & Hoa Hồng Sàn Thực Tế
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu phát sinh thực tế từ các đơn thuê trên nền tảng (không dùng số liệu ảo).
                </CardDescription>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setTimeRange("6m")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    timeRange === "6m" ? "bg-white text-blue-700 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  6 Tháng
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange("30d")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    timeRange === "30d" ? "bg-white text-blue-700 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  30 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange("7d")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    timeRange === "7d" ? "bg-white text-blue-700 shadow-2xs font-bold" : "hover:text-slate-900"
                  }`}
                >
                  7 Ngày
                </button>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dynamicRevenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) =>
                      val >= 1000000
                        ? `${(val / 1000000).toFixed(1)}Tr`
                        : val >= 1000
                        ? `${(val / 1000).toFixed(0)}k`
                        : `${val}`
                    }
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${Number(value).toLocaleString("vi-VN")} đ`,
                      name === "revenue" ? "Doanh thu sàn (GMV)" : `Hoa hồng thực thu (${commissionRate}%)`,
                    ]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "1rem",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-slate-700">
                        {value === "revenue" ? "Tổng Doanh Thu (GMV)" : `Hoa Hồng Thực Thu (${commissionRate}%)`}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCommission)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Booking Status Breakdown (Donut Chart - 1 Col) */}
          <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-6 space-y-4">
            <div className="pb-2 border-b">
              <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-indigo-600" />
                Cơ Cấu Trạng Thái Đơn Hàng
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {allBookings.length > 0
                  ? `Phân bổ từ tổng số ${allBookings.length} đơn đặt thực tế.`
                  : "Chưa phát sinh đơn đặt nào trên sàn."}
              </CardDescription>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              {allBookings.length === 0 ? (
                <div className="text-center p-6 space-y-2">
                  <PieChartIcon className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600">Chưa có đơn đặt nào</p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    Biểu đồ trạng thái sẽ hiển thị tự động khi có khách hàng đặt thuê xe.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dynamicBookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                    >
                      {dynamicBookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [
                        `${value} đơn (${item?.payload?.value || 0}%)`,
                        item?.payload?.name || "Số lượng",
                      ]}
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        borderRadius: "0.75rem",
                        border: "1px solid #E2E8F0",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
              {dynamicBookingStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-600 truncate">{item.name}:</span>
                  <span className="font-bold text-slate-900 ml-auto">
                    {item.count} đơn ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Chart 3: Vehicle Type & Inventory Demand (Bar Chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-2xl border-slate-200/80 shadow-xs bg-white p-6 space-y-4">
            <div className="pb-2 border-b flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-amber-600" />
                  Nhu Cầu Thuê Theo Phân Loại Dòng Xe
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Số lượng xe đang cho thuê thực tế so với tổng số xe vật lý sẵn có trong kho.
                </CardDescription>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dynamicVehicleCategoryData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={{ stroke: "#E2E8F0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      `${val} xe`,
                      name === "total" ? "Tổng số xe đăng ký" : "Số xe đang có khách thuê",
                    ]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "0.75rem",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-slate-700">
                        {value === "total" ? "Tổng số xe đăng ký" : "Số xe đang có khách thuê"}
                      </span>
                    )}
                  />
                  <Bar dataKey="total" fill="#E2E8F0" radius={[6, 6, 0, 0]} name="total" />
                  <Bar dataKey="rented" fill="#3B82F6" radius={[6, 6, 0, 0]} name="rented" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Quick Management Shortcuts */}
          <div className="space-y-4 flex flex-col justify-between">
            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <StoreIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Kiểm Duyệt Cửa Hàng</h3>
                  <span className="text-[11px] text-slate-500">Phê duyệt đối tác mới gia nhập</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Kiểm tra hình ảnh mặt tiền, số điện thoại liên hệ và số tài khoản ngân hàng của nhà xe.
              </p>
              <Link href="/admin/stores" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Vào duyệt đối tác <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Quản Trị Người Dùng</h3>
                  <span className="text-[11px] text-slate-500">Hồ sơ khách hàng & đối tác</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Tra cứu danh tính, xem ảnh GPLX 2 mặt của khách thuê và quản trị trạng thái tài khoản.
              </p>
              <Link href="/admin/users" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Xem danh sách người dùng <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-9 w-9 rounded-xl bg-red-50 text-red-700 flex items-center justify-center font-bold">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Kiểm Duyệt Đánh Giá</h3>
                  <span className="text-[11px] text-slate-500">Bảo vệ tính minh bạch sàn</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Ẩn hoặc xóa các nhận xét tiêu cực sai sự thật hoặc nội dung spam từ phía khách hàng.
              </p>
              <Link href="/admin/reviews" className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1">
                Kiểm duyệt đánh giá <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          </div>
        </div>

        {/* ─── CẤU HÌNH HỆ THỐNG SÀN (Requirement 2) ─── */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Sliders className="h-4 w-4" />
                </div>
                <CardTitle className="text-lg font-black text-slate-900">
                  Cấu Hình Chính Sách Hoa Hồng, Hạn Mức Âm & Mức Cọc Sàn
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Tùy chỉnh linh hoạt tỷ lệ hoa hồng, tiền âm cho phép và mức cọc tối thiểu toàn hệ thống. Có thể tắt hoặc đặt 0% trong giai đoạn đầu kích cầu.
              </CardDescription>
            </div>

            <Button
              onClick={handleSaveConfig}
              disabled={isSavingConfig}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl gap-2 shadow-xs h-10 px-5 shrink-0"
            >
              {isSavingConfig ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Lưu Cấu Hình Hệ Thống
                </>
              )}
            </Button>
          </div>

          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Setting 1: Commission Rate */}
            <div className="rounded-2xl border border-slate-200/80 p-5 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Percent className="h-4 w-4 text-purple-600" /> Tỷ Lệ Hoa Hồng Sàn (%)
                  </Label>
                  <span className="text-base font-black text-purple-700 font-mono">
                    {commissionRate}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Phần trăm khấu trừ khi bàn giao xe. Đặt <strong>0%</strong> trong giai đoạn đầu để miễn phí hoa hồng thu hút đối tác.
                </p>
                <div className="pt-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="font-bold text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCommissionRate(0)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      commissionRate === 0
                        ? "bg-purple-100 border-purple-300 text-purple-800 font-black"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    0% (Miễn phí hoa hồng)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommissionRate(10)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      commissionRate === 10
                        ? "bg-purple-100 border-purple-300 text-purple-800 font-black"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    10% (Chuẩn sàn)
                  </button>
                </div>
                {commissionRate === 0 ? (
                  <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Đang kích hoạt: Miễn 100% hoa hồng sàn
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-500">
                    Sàn sẽ trích {commissionRate}% tổng tiền thuê sau khi giao xe.
                  </div>
                )}
              </div>
            </div>

            {/* Setting 2: Credit Limit */}
            <div className="rounded-2xl border border-slate-200/80 p-5 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-blue-600" /> Tiền Âm Cho Phép (Hạn Mức Nợ)
                  </Label>
                  <span className="text-sm font-black text-blue-700 font-mono">
                    -{creditLimit.toLocaleString("vi-VN")} đ
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cho phép đối tác nhận đơn khi số dư ví bị âm. Đặt <strong>0 đ</strong> nếu không cho phép nợ ví.
                </p>
                <div className="pt-2">
                  <Input
                    type="number"
                    min="0"
                    step="50000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="font-bold text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCreditLimit(0)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      creditLimit === 0
                        ? "bg-blue-100 border-blue-300 text-blue-800 font-black"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    0 đ (Không nợ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditLimit(500000)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      creditLimit === 500000
                        ? "bg-blue-100 border-blue-300 text-blue-800 font-black"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    500.000 đ
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreditLimit(1000000)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      creditLimit === 1000000
                        ? "bg-blue-100 border-blue-300 text-blue-800 font-black"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    1.000.000 đ
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  Khi lưu sẽ tự động đồng bộ hạn mức nợ cho toàn bộ ví đối tác.
                </div>
              </div>
            </div>

            {/* Setting 3: Min Deposit Percent */}
            <div className="rounded-2xl border border-slate-200/80 p-5 bg-slate-50/50 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Shield className="h-4 w-4 text-emerald-600" /> Mức Cọc Tối Thiểu Hệ Thống (%)
                  </Label>
                  <span className="text-base font-black text-emerald-700 font-mono">
                    {minDepositPercent}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Cửa hàng không thể cài mức cọc thấp hơn giá trị này. Mặc định <strong>15%</strong> toàn hệ thống.
                </p>
                <div className="pt-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={minDepositPercent}
                    onChange={(e) => setMinDepositPercent(Number(e.target.value))}
                    className="font-bold text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMinDepositPercent(0)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      minDepositPercent === 0
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-black"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    0% (Tắt cọc)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinDepositPercent(15)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      minDepositPercent === 15
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-black"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    15% (Chuẩn sàn)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMinDepositPercent(30)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors ${
                      minDepositPercent === 30
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800 font-black"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    30%
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  {minDepositPercent === 0
                    ? "Không bắt buộc khách đặt cọc trước."
                    : `Khách bắt buộc cọc tối thiểu ${minDepositPercent}% khi đặt xe.`}
                </div>
              </div>
            </div>
          </form>

          {/* Business rule reminder note */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">Quy tắc dòng tiền và khấu trừ hoa hồng an toàn (Đã kích hoạt):</span>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                Khi khách hàng quét VietQR, tiền chuyển vào tài khoản ngân hàng sàn và <strong>hệ thống tự động cộng đủ số dư vào Ví đối tác</strong>. Hoa hồng sàn ({commissionRate}%) <strong>CHỈ BỊ TRỪ KHI đối tác xác nhận bàn giao xe thành công cho khách</strong>. Nếu khách không đến nhận xe / hủy đơn, toàn bộ tiền cọc thuộc về đối tác mà sàn không khấu trừ bất kỳ khoản phí nào.
              </p>
            </div>
          </div>
        </Card>

        {/* ─── QUẢN LÝ YÊU CẦU RÚT TIỀN (Payout Management) ─── */}
        <Card className="rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Quản Lý Yêu Cầu Rút Tiền Của Đối Tác Nhà Xe
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Xem xét và giải ngân số dư ví của các chủ xe về số tài khoản ngân hàng chính chủ.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">
                Hiển thị: {filteredAdminPayouts.length}/{payouts.length}
              </span>
              <Link href="/admin/transactions">
                <Button size="sm" variant="outline" className="text-xs h-8 rounded-xl font-bold gap-1 bg-white">
                  <span>Trang Giao Dịch Chi Tiết</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>

          {/* Filter Bar for Payouts */}
          <div className="p-4 sm:p-5 border-b bg-slate-50/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-5 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Tìm theo mã #PO, tên đối tác, STK, ngân hàng..."
                value={payoutSearch}
                onChange={(e) => setPayoutSearch(e.target.value)}
                className="pl-9.5 text-xs h-9 rounded-xl bg-white"
              />
            </div>
            <div className="lg:col-span-2">
              <Input
                type="date"
                value={payoutFromDate}
                onChange={(e) => setPayoutFromDate(e.target.value)}
                className="text-xs h-9 rounded-xl bg-white"
                title="Từ ngày"
              />
            </div>
            <div className="lg:col-span-2">
              <Input
                type="date"
                value={payoutToDate}
                onChange={(e) => setPayoutToDate(e.target.value)}
                className="text-xs h-9 rounded-xl bg-white"
                title="Đến ngày"
              />
            </div>
            <div className="lg:col-span-2">
              <select
                value={payoutStatusFilter}
                onChange={(e) => setPayoutStatusFilter(e.target.value)}
                className="w-full h-9 text-xs font-semibold px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="0">Chờ duyệt (Pending)</option>
                <option value="1">Đã chi (Approved)</option>
                <option value="2">Đã từ chối (Rejected)</option>
              </select>
            </div>
            <div className="lg:col-span-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPayoutSearch("");
                  setPayoutFromDate("");
                  setPayoutToDate("");
                  setPayoutStatusFilter("ALL");
                }}
                className="w-full h-9 rounded-xl text-xs"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {filteredAdminPayouts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Không tìm thấy yêu cầu rút tiền nào phù hợp bộ lọc.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Mã / Ngày tạo</TableHead>
                    <TableHead className="text-xs">Đối tác & Cửa hàng</TableHead>
                    <TableHead className="text-xs">Thông tin Ngân hàng thụ hưởng</TableHead>
                    <TableHead className="text-xs text-right">Số tiền rút</TableHead>
                    <TableHead className="text-xs text-center">Trạng thái</TableHead>
                    <TableHead className="text-xs text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdminPayouts.map((p) => {
                    const isPending = p.status === 0;
                    const isApproved = p.status === 1;
                    const isRejected = p.status === 2;

                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-mono">
                          <div className="font-bold text-slate-900">#PO-{p.id}</div>
                          <div className="text-[11px] text-slate-500">
                            {new Date(p.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="font-bold text-slate-800">
                            {p.partner?.fullName || p.accountHolder}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.partner?.stores?.[0]?.storeName || p.partner?.phone}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="font-bold text-blue-700">
                            {p.bankName}
                          </div>
                          <div className="font-mono text-slate-700">
                            STK: {p.bankAccountNum}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase">
                            Chủ TK: {p.accountHolder}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-right font-black text-emerald-600 font-mono text-sm">
                          {Number(p.amount).toLocaleString("vi-VN")} đ
                        </TableCell>

                        <TableCell className="text-xs text-center">
                          {isPending && (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1">
                              <Clock className="h-3 w-3" /> Chờ duyệt
                            </Badge>
                          )}
                          {isApproved && (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Đã chi
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] gap-1">
                              <XCircle className="h-3 w-3" /> Đã từ chối
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-right">
                          {isPending ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                disabled={isProcessingPayout}
                                onClick={() => handleReviewPayout(p.id, 1)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold h-7 px-2.5 rounded-lg"
                              >
                                Duyệt chi
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessingPayout}
                                onClick={() => handleReviewPayout(p.id, 2)}
                                className="text-rose-600 hover:bg-rose-50 border-rose-200 text-[11px] font-bold h-7 px-2.5 rounded-lg"
                              >
                                Từ chối
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Hoàn tất</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
