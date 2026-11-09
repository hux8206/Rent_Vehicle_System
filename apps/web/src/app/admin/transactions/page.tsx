"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  api,
  PayoutRequest,
  PaymentRecord,
  WalletHistory,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Receipt,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Building2,
  ExternalLink,
  ChevronRight,
  RotateCcw,
  Download,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminTransactionsPage() {
  const [activeTab, setActiveTab] = useState<"payouts" | "payments" | "wallet">("payouts");
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [walletHistories, setWalletHistories] = useState<any[]>([]);

  // Filter states
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Payout review modal
  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<1 | 2>(1); // 1: Approve, 2: Reject
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [poData, payData, whData] = await Promise.all([
        api.admin.getPayouts(),
        api.admin.getPayments(),
        api.admin.getWalletHistories(),
      ]);
      setPayouts(poData || []);
      setPayments(payData || []);
      setWalletHistories(whData || []);
    } catch {
      toast.error("Không thể tải toàn bộ dữ liệu giao dịch.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset filters
  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setStatusFilter("ALL");
  };

  // ─── Filtered Datasets ───────────────────────────────────────────
  const filteredPayouts = useMemo(() => {
    return payouts.filter((p) => {
      // Status
      if (statusFilter !== "ALL" && String(p.status) !== statusFilter) return false;

      // Date Range
      if (fromDate) {
        const itemDate = new Date(p.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(p.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Keyword Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = String(p.id).includes(q) || `po-${p.id}`.includes(q);
        const matchPartner = p.partner?.fullName?.toLowerCase().includes(q) || p.accountHolder.toLowerCase().includes(q);
        const matchPhone = p.partner?.phone?.toLowerCase().includes(q);
        const matchBank = p.bankName.toLowerCase().includes(q) || p.bankAccountNum.toLowerCase().includes(q);
        const matchStore = p.partner?.stores?.some((s) => s.storeName.toLowerCase().includes(q));
        if (!matchId && !matchPartner && !matchPhone && !matchBank && !matchStore) return false;
      }

      return true;
    });
  }, [payouts, search, fromDate, toDate, statusFilter]);

  const filteredPayments = useMemo(() => {
    return payments.filter((pay) => {
      // Status
      if (statusFilter !== "ALL" && String(pay.paymentStatus) !== statusFilter) return false;

      // Date Range
      if (fromDate) {
        const itemDate = new Date(pay.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(pay.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Keyword Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchRef = pay.transactionRef.toLowerCase().includes(q);
        const matchBookingCode = pay.booking?.bookingCode?.toLowerCase().includes(q);
        const matchCustomer = pay.booking?.customer?.fullName?.toLowerCase().includes(q) || pay.booking?.customer?.phone?.includes(q);
        const matchStore = pay.booking?.store?.storeName?.toLowerCase().includes(q);
        if (!matchRef && !matchBookingCode && !matchCustomer && !matchStore) return false;
      }

      return true;
    });
  }, [payments, search, fromDate, toDate, statusFilter]);

  const filteredWalletHistories = useMemo(() => {
    return walletHistories.filter((wh) => {
      // Type/Status
      if (statusFilter !== "ALL" && String(wh.type) !== statusFilter) return false;

      // Date Range
      if (fromDate) {
        const itemDate = new Date(wh.createdAt).toISOString().split("T")[0];
        if (itemDate < fromDate) return false;
      }
      if (toDate) {
        const itemDate = new Date(wh.createdAt).toISOString().split("T")[0];
        if (itemDate > toDate) return false;
      }

      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchDesc = wh.description?.toLowerCase().includes(q);
        const matchPartner = wh.wallet?.partner?.fullName?.toLowerCase().includes(q) || wh.wallet?.partner?.phone?.includes(q);
        const matchBooking = wh.booking?.bookingCode?.toLowerCase().includes(q);
        if (!matchDesc && !matchPartner && !matchBooking) return false;
      }

      return true;
    });
  }, [walletHistories, search, fromDate, toDate, statusFilter]);

  // Handle Review Payout
  const handleReviewPayout = async () => {
    if (!selectedPayout) return;
    setIsSubmittingReview(true);
    try {
      const res = await api.admin.reviewPayout(selectedPayout.id, {
        status: reviewAction,
        note: reviewNote.trim() || (reviewAction === 1 ? "Đã chuyển khoản giải ngân thành công" : "Từ chối và hoàn tiền về ví"),
      });
      toast.success(res.message || "Xử lý yêu cầu rút tiền thành công!");
      setPayouts((prev) =>
        prev.map((p) => (p.id === selectedPayout.id ? { ...p, status: reviewAction, note: reviewNote } : p))
      );
      setSelectedPayout(null);
      setReviewNote("");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi xử lý rút tiền.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Overall Metrics
  const pendingPayouts = payouts.filter((p) => p.status === 0);
  const totalPendingPayoutAmount = pendingPayouts.reduce((acc, cur) => acc + Number(cur.amount), 0);

  const approvedPayouts = payouts.filter((p) => p.status === 1);
  const totalApprovedPayoutAmount = approvedPayouts.reduce((acc, cur) => acc + Number(cur.amount), 0);

  const successPayments = payments.filter((p) => p.paymentStatus === 1);
  const totalPayosRevenue = successPayments.reduce((acc, cur) => acc + Number(cur.amount), 0);

  return (
    <div className="py-8 sm:py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
              <Receipt className="h-4 w-4" /> Trung Tâm Tài Chính Sàn
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Quản Lý Giao Dịch & Dòng Tiền Toàn Sàn
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Giám sát dòng tiền cọc PayOS, xử lý yêu cầu rút tiền của đối tác và tra cứu biến động số dư ví.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="text-xs font-semibold rounded-xl h-9 gap-1.5 bg-white shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>
            <Link href="/admin">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold rounded-xl h-9 text-slate-600"
              >
                Về Báo Cáo Sàn
              </Button>
            </Link>
          </div>
        </div>

        {/* Priority Pending Payout Banner */}
        {pendingPayouts.length > 0 && (
          <div className="rounded-3xl border border-amber-300 bg-amber-50/90 p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-amber-950 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-600 text-white border-none text-[10px] font-black uppercase">
                    Cần phê duyệt ngay
                  </Badge>
                  <span className="text-xs font-bold text-amber-800">
                    {pendingPayouts.length} yêu cầu rút tiền
                  </span>
                </div>
                <h4 className="font-extrabold text-base text-amber-950 mt-0.5">
                  Tổng tiền yêu cầu giải ngân:{" "}
                  <span className="font-mono text-emerald-800">
                    {totalPendingPayoutAmount.toLocaleString("vi-VN")} VNĐ
                  </span>
                </h4>
                <p className="text-xs text-amber-800/90 mt-0.5">
                  Vui lòng đối soát và chuyển khoản vào tài khoản ngân hàng chính chủ của đối tác trước khi duyệt.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setActiveTab("payouts");
                setStatusFilter("0");
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0"
            >
              Xem {pendingPayouts.length} yêu cầu chờ duyệt
            </Button>
          </div>
        )}

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Thu cọc qua PayOS
              </span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalPayosRevenue.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>{successPayments.length} giao dịch thành công</span>
            </div>
          </Card>

          {/* Card 2 */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Rút tiền chờ duyệt
              </span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono">
              {totalPendingPayoutAmount.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-amber-800 font-medium">
              {pendingPayouts.length} lệnh đang chờ admin duyệt
            </div>
          </Card>

          {/* Card 3 */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Đã giải ngân rút ví
              </span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              {totalApprovedPayoutAmount.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-slate-500">
              {approvedPayouts.length} lượt rút tiền đã chi trả
            </div>
          </Card>

          {/* Card 4 */}
          <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tổng biến động ví
              </span>
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-700 font-mono">
              {walletHistories.length} lượt
            </div>
            <div className="text-[11px] text-slate-500">
              Nạp ví, trừ hoa hồng 10%, hoàn cọc
            </div>
          </Card>
        </div>

        {/* ─── TAB NAVIGATION & ADVANCED FILTERS ─── */}
        <Card className="rounded-3xl border-slate-200/80 shadow-xs bg-white overflow-hidden space-y-4 p-5 sm:p-6">
          {/* Top Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("payouts");
                  handleResetFilters();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "payouts"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <DollarSign className="h-4 w-4 text-emerald-600" />
                <span>Yêu Cầu Rút Tiền</span>
                {pendingPayouts.length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
                    {pendingPayouts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("payments");
                  handleResetFilters();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "payments"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Receipt className="h-4 w-4 text-blue-600" />
                <span>Giao Dịch PayOS ({payments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("wallet");
                  handleResetFilters();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === "wallet"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-purple-600" />
                <span>Biến Động Số Dư Ví ({walletHistories.length})</span>
              </button>
            </div>

            {/* Results Counter */}
            <div className="text-xs font-semibold text-slate-500">
              Hiển thị:{" "}
              <span className="font-bold text-slate-900 font-mono">
                {activeTab === "payouts"
                  ? filteredPayouts.length
                  : activeTab === "payments"
                  ? filteredPayments.length
                  : filteredWalletHistories.length}
              </span>{" "}
              bản ghi
            </div>
          </div>

          {/* Filter Bar (Search + Date Range + Status) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-1">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={
                  activeTab === "payouts"
                    ? "Tìm theo mã #PO, tên đối tác, STK, ngân hàng, SĐT..."
                    : activeTab === "payments"
                    ? "Tìm theo mã đơn BK-..., mã giao dịch TX-..., khách, SĐT..."
                    : "Tìm theo nội dung, tên đối tác, số điện thoại..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9.5 text-xs h-10 rounded-xl bg-slate-50/50"
              />
            </div>

            {/* From Date */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs h-10 rounded-xl bg-slate-50/50"
                title="Từ ngày"
              />
            </div>

            {/* To Date */}
            <div className="lg:col-span-2">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-xs h-10 rounded-xl bg-slate-50/50"
                title="Đến ngày"
              />
            </div>

            {/* Status Dropdown */}
            <div className="lg:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 text-xs font-semibold px-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {activeTab === "payouts" && (
                  <>
                    <option value="0">Chờ duyệt (Pending)</option>
                    <option value="1">Đã chi tiền (Approved)</option>
                    <option value="2">Đã từ chối (Rejected)</option>
                  </>
                )}
                {activeTab === "payments" && (
                  <>
                    <option value="1">Thành công (Success)</option>
                    <option value="0">Đang chờ (Pending)</option>
                    <option value="2">Thất bại (Failed)</option>
                  </>
                )}
                {activeTab === "wallet" && (
                  <>
                    <option value="0">Nạp ví (Deposit)</option>
                    <option value="1">Trừ hoa hồng sàn 10%</option>
                    <option value="2">Hoàn tiền (Refund)</option>
                    <option value="3">Rút tiền (Withdrawal)</option>
                  </>
                )}
              </select>
            </div>

            {/* Reset Filter Button */}
            <div className="lg:col-span-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="w-full h-10 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {(search || fromDate || toDate || statusFilter !== "ALL") && (
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Đang lọc theo:</span>
              {search && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                  Từ khóa: "{search}"
                </Badge>
              )}
              {fromDate && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                  Từ: {fromDate}
                </Badge>
              )}
              {toDate && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                  Đến: {toDate}
                </Badge>
              )}
              {statusFilter !== "ALL" && (
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">
                  Trạng thái: {statusFilter}
                </Badge>
              )}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-red-600 hover:underline font-semibold ml-1 cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}

          {/* ─── TAB 1: PAYOUT REQUESTS TABLE ─── */}
          {activeTab === "payouts" && (
            <div className="border rounded-2xl overflow-hidden mt-3">
              {filteredPayouts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-1">
                  <DollarSign className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy yêu cầu rút tiền nào</p>
                  <p className="text-slate-400">Hãy thử thay đổi điều kiện tìm kiếm hoặc ngày lọc.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-xs font-bold">Mã / Ngày tạo</TableHead>
                      <TableHead className="text-xs font-bold">Đối tác & Cửa hàng</TableHead>
                      <TableHead className="text-xs font-bold">Ngân hàng thụ hưởng</TableHead>
                      <TableHead className="text-xs font-bold text-right">Số tiền rút</TableHead>
                      <TableHead className="text-xs font-bold text-center">Trạng thái</TableHead>
                      <TableHead className="text-xs font-bold">Ghi chú</TableHead>
                      <TableHead className="text-xs font-bold text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayouts.map((p) => {
                      const isPending = p.status === 0;
                      const isApproved = p.status === 1;
                      const isRejected = p.status === 2;

                      return (
                        <TableRow key={p.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-mono">
                            <div className="font-bold text-slate-900">#PO-{p.id}</div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(p.createdAt).toLocaleDateString("vi-VN")}{" "}
                              {new Date(p.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {p.partner?.fullName || p.accountHolder}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {p.partner?.stores?.[0]?.storeName || `SĐT: ${p.partner?.phone}`}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-blue-700 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> {p.bankName}
                            </div>
                            <div className="font-mono text-slate-900 font-bold">
                              {p.bankAccountNum}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase">
                              Chủ TK: {p.accountHolder}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-right font-black text-emerald-700 font-mono text-sm">
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
                                <CheckCircle2 className="h-3 w-3" /> Đã chi trả
                              </Badge>
                            )}
                            {isRejected && (
                              <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] gap-1">
                                <XCircle className="h-3 w-3" /> Đã từ chối
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">
                            {p.note || "—"}
                          </TableCell>

                          <TableCell className="text-xs text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPayout(p);
                                    setReviewAction(1);
                                    setReviewNote("Đã chuyển khoản giải ngân thành công");
                                  }}
                                  className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 shadow-xs"
                                >
                                  Duyệt chi
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPayout(p);
                                    setReviewAction(2);
                                    setReviewNote("Thông tin số tài khoản hoặc ngân hàng không khớp");
                                  }}
                                  className="h-7 text-[11px] font-bold text-rose-700 border-rose-200 hover:bg-rose-50 rounded-lg px-2.5"
                                >
                                  Từ chối
                                </Button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Đã xử lý
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* ─── TAB 2: PAYOS PAYMENTS TABLE ─── */}
          {activeTab === "payments" && (
            <div className="border rounded-2xl overflow-hidden mt-3">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-1">
                  <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy giao dịch PayOS nào</p>
                  <p className="text-slate-400">Chưa có giao dịch quét cọc VietQR phù hợp bộ lọc.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-xs font-bold">Mã GD / Thời gian</TableHead>
                      <TableHead className="text-xs font-bold">Đơn đặt xe</TableHead>
                      <TableHead className="text-xs font-bold">Khách hàng</TableHead>
                      <TableHead className="text-xs font-bold">Nhà xe / Chi nhánh</TableHead>
                      <TableHead className="text-xs font-bold text-right">Số tiền cọc</TableHead>
                      <TableHead className="text-xs font-bold text-center">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((pay) => {
                      const isSuccess = pay.paymentStatus === 1;
                      const isPending = pay.paymentStatus === 0;

                      return (
                        <TableRow key={pay.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-mono">
                            <div className="font-bold text-blue-700">
                              {pay.transactionRef}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(pay.createdAt).toLocaleDateString("vi-VN")}{" "}
                              {new Date(pay.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900 font-mono">
                              {pay.booking?.bookingCode || `BK-#${pay.bookingId}`}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {pay.paymentType === 1 ? "Đặt cọc xe" : "Thanh toán toàn bộ"}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {pay.booking?.customer?.fullName || "Khách vãng lai"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              SĐT: {pay.booking?.customer?.phone || "—"}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {pay.booking?.store?.storeName || "—"}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px]">
                              {pay.booking?.store?.address || "—"}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-right font-black text-slate-900 font-mono text-sm">
                            {Number(pay.amount).toLocaleString("vi-VN")} đ
                          </TableCell>

                          <TableCell className="text-xs text-center">
                            {isSuccess && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Đã nhận tiền
                              </Badge>
                            )}
                            {isPending && (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1">
                                <Clock className="h-3 w-3" /> Chờ quét mã
                              </Badge>
                            )}
                            {pay.paymentStatus === 2 && (
                              <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-[10px] gap-1">
                                <XCircle className="h-3 w-3" /> Thất bại
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* ─── TAB 3: WALLET HISTORIES TABLE ─── */}
          {activeTab === "wallet" && (
            <div className="border rounded-2xl overflow-hidden mt-3">
              {filteredWalletHistories.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs space-y-1">
                  <ArrowUpRight className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Không tìm thấy biến động số dư ví nào</p>
                  <p className="text-slate-400">Hãy thử thay đổi điều kiện ngày hoặc từ khóa lọc.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/80">
                      <TableHead className="text-xs font-bold">Thời gian</TableHead>
                      <TableHead className="text-xs font-bold">Đối tác / Chi nhánh</TableHead>
                      <TableHead className="text-xs font-bold">Loại giao dịch</TableHead>
                      <TableHead className="text-xs font-bold text-right">Biến động (+/-)</TableHead>
                      <TableHead className="text-xs font-bold text-right">Số dư trước / sau</TableHead>
                      <TableHead className="text-xs font-bold">Nội dung chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWalletHistories.map((wh) => {
                      const isDeposit = wh.type === 0;
                      const isCommission = wh.type === 1;
                      const isRefund = wh.type === 2;
                      const isWithdrawal = wh.type === 3;

                      return (
                        <TableRow key={wh.id} className="hover:bg-slate-50/50">
                          <TableCell className="text-xs font-mono">
                            <div className="font-bold text-slate-900">
                              {new Date(wh.createdAt).toLocaleDateString("vi-VN")}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {new Date(wh.createdAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            <div className="font-bold text-slate-900">
                              {wh.wallet?.partner?.fullName || "Đối tác"}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {wh.wallet?.partner?.stores?.[0]?.storeName || `SĐT: ${wh.wallet?.partner?.phone}`}
                            </div>
                          </TableCell>

                          <TableCell className="text-xs">
                            {isDeposit && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] gap-1">
                                <ArrowDownLeft className="h-3 w-3" /> Nạp tiền ví
                              </Badge>
                            )}
                            {isCommission && (
                              <Badge className="bg-purple-50 text-purple-800 border-purple-300 text-[10px] gap-1">
                                <Receipt className="h-3 w-3" /> Trừ hoa hồng 10%
                              </Badge>
                            )}
                            {isRefund && (
                              <Badge className="bg-blue-50 text-blue-800 border-blue-300 text-[10px] gap-1">
                                <RotateCcw className="h-3 w-3" /> Hoàn tiền ví
                              </Badge>
                            )}
                            {isWithdrawal && (
                              <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-[10px] gap-1">
                                <ArrowUpRight className="h-3 w-3" /> Rút tiền về NH
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-right font-mono font-black text-sm">
                            {isDeposit || isRefund ? (
                              <span className="text-emerald-600">
                                +{Number(wh.amount).toLocaleString("vi-VN")} đ
                              </span>
                            ) : (
                              <span className="text-rose-600">
                                -{Number(wh.amount).toLocaleString("vi-VN")} đ
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="text-xs text-right font-mono">
                            <div className="text-slate-500 text-[11px]">
                              Trước: {Number(wh.balanceBefore).toLocaleString("vi-VN")} đ
                            </div>
                            <div className="font-bold text-slate-900">
                              Sau: {Number(wh.balanceAfter).toLocaleString("vi-VN")} đ
                            </div>
                          </TableCell>

                          <TableCell className="text-xs text-slate-700 max-w-[240px]">
                            <div className="truncate font-medium">{wh.description}</div>
                            {wh.booking?.bookingCode && (
                              <div className="text-[11px] text-blue-600 font-mono">
                                Đơn: {wh.booking.bookingCode}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* ─── REVIEW PAYOUT DIALOG ─── */}
      {selectedPayout && (
        <Dialog open={!!selectedPayout} onOpenChange={() => setSelectedPayout(null)}>
          <DialogContent className="max-w-md rounded-3xl p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                {reviewAction === 1 ? "Phê Duyệt Giải Ngân Tiền Rút" : "Từ Chối Yêu Cầu Rút Tiền"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mã yêu cầu: <span className="font-mono font-bold text-slate-900">#PO-{selectedPayout.id}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="p-4 bg-slate-50 rounded-2xl border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Đối tác:</span>
                <strong className="text-slate-900">{selectedPayout.partner?.fullName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <strong className="text-blue-700">{selectedPayout.bankName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <strong className="font-mono text-slate-900">{selectedPayout.bankAccountNum}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <strong className="text-slate-900 uppercase">{selectedPayout.accountHolder}</strong>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-slate-500">Số tiền cần chuyển:</span>
                <strong className="font-mono text-base font-black text-emerald-700">
                  {Number(selectedPayout.amount).toLocaleString("vi-VN")} VNĐ
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ghi chú xác nhận / Lý do từ chối:</Label>
              <Input
                type="text"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Nhập ghi chú hoặc mã giao dịch ngân hàng..."
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPayout(null)}
                disabled={isSubmittingReview}
                className="rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleReviewPayout}
                disabled={isSubmittingReview}
                className={`rounded-xl font-bold text-white ${
                  reviewAction === 1
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isSubmittingReview
                  ? "Đang xử lý..."
                  : reviewAction === 1
                  ? "Xác nhận đã giải ngân"
                  : "Xác nhận từ chối"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

