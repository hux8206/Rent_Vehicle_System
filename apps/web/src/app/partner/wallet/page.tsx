"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, PartnerWallet, WalletHistory, Store } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeft,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Building2,
  Send,
  RefreshCw,
  Lock,
  ExternalLink,
  Loader2,
  Search,
  RotateCcw,
  Calendar,
  Download,
  Smartphone,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

function PartnerWalletContent() {
  const searchParams = useSearchParams();
  const storeIdParam = searchParams?.get("storeId");

  const [wallet, setWallet] = useState<PartnerWallet | null>(null);
  const [histories, setHistories] = useState<WalletHistory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Security Lock (Chỉ bảo vệ chức năng Rút Tiền Về Ngân Hàng, nhân viên vẫn xem được số dư & lịch sử)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [ownerPasswordInput, setOwnerPasswordInput] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [isWithdrawPasswordModalOpen, setIsWithdrawPasswordModalOpen] = useState(false);

  // Deposit modal
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(500000);
  const [depositQrInfo, setDepositQrInfo] = useState<any>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Withdraw modal (Rút tiền về ngân hàng)
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(500000);
  const [withdrawNote, setWithdrawNote] = useState<string>("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [bankInfo, setBankInfo] = useState<{
    bankName: string;
    bankAccountNum: string;
    fullName: string;
  }>({
    bankName: "Vietcombank",
    bankAccountNum: "9876543210",
    fullName: "Đối tác Nhà xe",
  });

  // History Filter states
  const [historySearch, setHistorySearch] = useState("");
  const [historyFromDate, setHistoryFromDate] = useState("");
  const [historyToDate, setHistoryToDate] = useState("");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("ALL");

  const currentBranch = useMemo(() => {
    if (!storeIdParam || !stores.length) return null;
    return stores.find((s) => s.id === Number(storeIdParam)) || null;
  }, [storeIdParam, stores]);

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const branchId = storeIdParam ? Number(storeIdParam) : undefined;
      const [w, h, storesData] = await Promise.all([
        api.partner.getWallet(),
        api.partner.getWalletHistory(1, 100, branchId),
        api.partner.getStores().catch(() => []),
      ]);
      setWallet(w);
      setHistories(h.histories);
      setStores(storesData || []);
      if (storesData && storesData.length > 0) {
        const s = storesData[0];
        setBankInfo({
          bankName: s.partner?.bankName || "Vietcombank",
          bankAccountNum: s.partner?.bankAccountNum || "9876543210",
          fullName: s.partner?.fullName || "Đối tác Nhà xe",
        });
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const sessionUnlocked = sessionStorage.getItem("partner_owner_unlocked");
    if (sessionUnlocked === "true") {
      setIsUnlocked(true);
    }
    fetchWalletData();
  }, [storeIdParam]);

  // Tự động lắng nghe Webhook PayOS nạp tiền ví thành công (polling 2s)
  const initialBalanceRef = useRef<number>(0);

  useEffect(() => {
    if (depositQrInfo && wallet) {
      initialBalanceRef.current = Number(wallet.balance || 0);
    }
  }, [depositQrInfo]);

  useEffect(() => {
    if (!depositQrInfo) return;

    const pollInterval = setInterval(async () => {
      try {
        const [latestWallet, latestHistory] = await Promise.all([
          api.partner.getWallet(),
          api.partner.getWalletHistory(1, 20),
        ]);
        if (latestWallet && Number(latestWallet.balance) > initialBalanceRef.current) {
          clearInterval(pollInterval);
          setWallet(latestWallet);
          setHistories(latestHistory.histories);
          setIsDepositOpen(false);
          setDepositQrInfo(null);
          toast.success(
            `🎉 Nạp tiền thành công! Số dư ví mới: ${Number(latestWallet.balance).toLocaleString("vi-VN")} đ.`,
            { duration: 5000 }
          );
        }
      } catch {
        // silent fail during poll
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [depositQrInfo]);

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ownerPasswordInput.trim()) return;
    setIsVerifyingPassword(true);
    try {
      const res = await api.partner.verifyOwnerPassword(ownerPasswordInput.trim());
      if (res.verified) {
        setIsUnlocked(true);
        sessionStorage.setItem("partner_owner_unlocked", "true");
        toast.success("Đã xác thực Mật khẩu Chủ Cửa Hàng!");
        setIsWithdrawPasswordModalOpen(false);
        setWithdrawAmount(balance > 0 ? balance : 500000);
        setIsWithdrawOpen(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Mật khẩu chủ cửa hàng không chính xác!");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentBal = Number(wallet?.balance || 0);
    if (withdrawAmount < 50000) {
      toast.error("Số tiền rút tối thiểu là 50.000 VNĐ");
      return;
    }
    if (withdrawAmount > currentBal) {
      toast.error(`Số dư khả dụng (${currentBal.toLocaleString("vi-VN")} đ) không đủ để rút`);
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const res = await api.partner.requestPayout({
        amount: withdrawAmount,
        note: withdrawNote,
      });

      const newBal = currentBal - withdrawAmount;
      setWallet((prev) => (prev ? { ...prev, balance: newBal } : null));

      const newHistory: WalletHistory = {
        id: Date.now(),
        walletId: wallet?.id || 1,
        type: 3, // Withdrawal
        amount: withdrawAmount,
        balanceBefore: currentBal,
        balanceAfter: newBal,
        description: `Yêu cầu rút tiền về ${bankInfo.bankName} - STK: ${bankInfo.bankAccountNum}`,
        createdAt: new Date().toISOString(),
      };
      setHistories((prev) => [newHistory, ...prev]);

      toast.success(
        res.message || "Tạo yêu cầu rút tiền thành công! Admin sẽ duyệt và giải ngân vào tài khoản ngân hàng của bạn."
      );
      setIsWithdrawOpen(false);
      setWithdrawNote("");
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo yêu cầu rút tiền.");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleCreateDepositQr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (depositAmount <= 0) return;

    setIsGeneratingQr(true);
    try {
      const res = await api.partner.deposit({
        amount: depositAmount,
        description: `Nạp ví đối tác ${depositAmount.toLocaleString()}đ`,
      });
      setDepositQrInfo(res);
      toast.success("Đã sinh mã VietQR nạp ví!");
    } catch {
      toast.error("Không thể tạo mã thanh toán.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleDownloadDepositQr = () => {
    if (!depositQrInfo?.qrCode) {
      toast.error("Mã QR chưa sẵn sàng");
      return;
    }
    try {
      const link = document.createElement("a");
      link.href = depositQrInfo.qrCode;
      link.download = `VietQR-Nap-Vi-${wallet?.partnerId || "partner"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải mã QR về máy!");
    } catch {
      window.open(depositQrInfo.qrCode, "_blank");
    }
  };

  const handleSimulateDepositSuccess = () => {
    const newBal = Number(wallet?.balance || 0) + depositAmount;
    setWallet((prev) => (prev ? { ...prev, balance: newBal } : null));

    const newHistory: WalletHistory = {
      id: Date.now(),
      walletId: wallet?.id || 1,
      type: 0, // Deposit
      amount: depositAmount,
      balanceBefore: wallet?.balance || 0,
      balanceAfter: newBal,
      description: `Nạp tiền vào ví đối tác qua VietQR (${depositAmount.toLocaleString("vi-VN")} đ)`,
      createdAt: new Date().toISOString(),
    };

    setHistories((prev) => [newHistory, ...prev]);
    setIsDepositOpen(false);
    setDepositQrInfo(null);
    toast.success(
      `Nạp thành công ${depositAmount.toLocaleString("vi-VN")} đ! Hệ thống đã tự động quét và giải phóng các đơn trong Hàng chờ FIFO.`
    );
  };

  const isBranchStaffMode = Boolean(storeIdParam || currentBranch);

  const filteredHistories = useMemo(() => {
    return histories.filter((h) => {
      // Mỗi chi nhánh chỉ hiển thị các giao dịch mà khách hàng đặt ở chi nhánh đó không hiển thị chung (Requirement 2)
      if (isBranchStaffMode && currentBranch) {
        if (!h.booking || (h.booking.storeId && h.booking.storeId !== currentBranch.id)) {
          return false;
        }
        if (!h.bookingId && !h.booking) {
          return false;
        }
      }

      // Type
      if (historyTypeFilter !== "ALL" && String(h.type) !== historyTypeFilter) return false;
      // Date Range
      if (historyFromDate) {
        const itemDate = new Date(h.createdAt).toISOString().split("T")[0];
        if (itemDate < historyFromDate) return false;
      }
      if (historyToDate) {
        const itemDate = new Date(h.createdAt).toISOString().split("T")[0];
        if (itemDate > historyToDate) return false;
      }
      // Search
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const matchDesc = h.description?.toLowerCase().includes(q);
        const matchCode = h.booking?.bookingCode?.toLowerCase().includes(q);
        const matchAmount = String(h.amount).includes(q);
        if (!matchDesc && !matchCode && !matchAmount) return false;
      }
      return true;
    });
  }, [histories, historySearch, historyFromDate, historyToDate, historyTypeFilter, isBranchStaffMode, currentBranch]);

  const balance = wallet?.balance !== undefined ? Number(wallet.balance) : 0;
  const creditLimit = wallet?.creditLimit !== undefined ? Number(wallet.creditLimit) : 500000;

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-5xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {currentBranch ? (
                <Link
                  href={`/partner?mode=branch&storeId=${currentBranch.id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 transition-colors bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Chi Nhánh: {currentBranch.storeName}
                </Link>
              ) : (
                <Link
                  href="/partner?mode=owner"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Tổng Bộ Chủ Cửa Hàng
                </Link>
              )}
              <span className="text-slate-300">•</span>
              <Badge variant="outline" className="text-[10px] font-bold uppercase text-slate-600">
                {currentBranch ? "Phân hệ Nhân Viên & Chi Nhánh" : "Phân hệ Chủ Cửa Hàng (HQ)"}
              </Badge>
              {isBranchStaffMode ? (
                <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px]">
                  👁️ Chế độ Nhân viên (Chỉ quan sát số dư & xem sổ cái)
                </Badge>
              ) : isUnlocked ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                  ✓ Quyền Chủ Xe: Mở Khóa Rút Tiền
                </Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
                  🔒 Chế độ Chủ Cửa Hàng (Cần mở khóa để rút tiền)
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isBranchStaffMode ? "Quan Sát Số Dư & Lịch Sử Giao Dịch" : "Quản Lý Ví & Lịch Sử Giao Dịch"}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              {isBranchStaffMode
                ? "Nhân viên theo dõi số dư bảo lãnh và tra cứu toàn bộ biến động sổ cái các giao dịch đặt cọc, hoàn tiền và khấu trừ hoa hồng của cơ sở."
                : "Theo dõi biến động số dư, nạp tiền mở khóa các đơn hàng chờ FIFO và đối soát toàn bộ lịch sử thu cọc, hoàn tiền và hoa hồng sàn."}
            </p>
          </div>

          {!isBranchStaffMode && (
            <div className="flex items-center gap-2.5">
              <Button
                onClick={() => {
                  if (!isUnlocked) {
                    setIsWithdrawPasswordModalOpen(true);
                    return;
                  }
                  setWithdrawAmount(balance > 0 ? balance : 500000);
                  setIsWithdrawOpen(true);
                }}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-xs"
              >
                <Building2 className="h-4 w-4" /> Rút tiền về tài khoản ngân hàng
              </Button>

              <Button
                onClick={() => {
                  setIsDepositOpen(true);
                  setDepositQrInfo(null);
                }}
                size="sm"
                variant="outline"
                className="border-slate-300 hover:bg-slate-100 font-bold text-xs rounded-xl gap-1.5 shadow-xs"
              >
                <QrCode className="h-4 w-4 text-amber-600" /> Nạp ví VietQR
              </Button>
            </div>
          )}
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Balance Card */}
          <Card className="rounded-2xl border-slate-200 shadow-xs bg-white p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Số dư ví khả dụng</span>
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {balance.toLocaleString("vi-VN")} <span className="text-sm font-semibold text-slate-500">VNĐ</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Ví đang hoạt động bình thường
            </div>
          </Card>

          {/* Credit Limit Card */}
          <Card className="rounded-2xl border-slate-200 shadow-xs bg-white p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Hạn mức nợ cho phép</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700">
              -{creditLimit.toLocaleString("vi-VN")} <span className="text-sm font-semibold text-slate-500">VNĐ</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Cho phép nhận đơn đến khi số dư đạt mức âm này
            </div>
          </Card>

          {/* Policy summary */}
          <Card className="rounded-2xl border-slate-200 shadow-xs bg-white p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Cơ chế hàng chờ FIFO</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-800 leading-tight">
              Tự động khớp đơn đặt trước
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed">
              Khi nạp tiền bù số dư, hệ thống tự động quét đơn từ cũ đến mới (createdAt ASC) để trừ hoa hồng.
            </div>
          </Card>
        </div>

        {/* Transaction History Table */}
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Lịch Sử Biến Động Số Dư
              </CardTitle>
              <CardDescription className="text-xs">
                Toàn bộ các giao dịch nạp tiền, trừ phí hoa hồng 10% sàn và hoàn tiền
              </CardDescription>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Hiển thị: {filteredHistories.length}/{histories.length} giao dịch
            </span>
          </CardHeader>

          {/* History Filters Bar */}
          <div className="p-4 sm:p-5 border-b bg-slate-50/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
            <div className="lg:col-span-5 relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Tìm theo nội dung, mã đơn, số tiền..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9.5 text-xs h-9 rounded-xl bg-white"
              />
            </div>

            <div className="lg:col-span-2">
              <Input
                type="date"
                value={historyFromDate}
                onChange={(e) => setHistoryFromDate(e.target.value)}
                className="text-xs h-9 rounded-xl bg-white"
                title="Từ ngày"
              />
            </div>

            <div className="lg:col-span-2">
              <Input
                type="date"
                value={historyToDate}
                onChange={(e) => setHistoryToDate(e.target.value)}
                className="text-xs h-9 rounded-xl bg-white"
                title="Đến ngày"
              />
            </div>

            <div className="lg:col-span-2">
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="w-full h-9 text-xs font-semibold px-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              >
                <option value="ALL">Tất cả loại GD</option>
                <option value="0">Nạp tiền vào ví (+)</option>
                <option value="1">Trừ hoa hồng 10% (-)</option>
                <option value="2">Hoàn tiền (+)</option>
                <option value="3">Rút về ngân hàng (-)</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHistorySearch("");
                  setHistoryFromDate("");
                  setHistoryToDate("");
                  setHistoryTypeFilter("ALL");
                }}
                className="w-full h-9 rounded-xl text-xs text-slate-600 hover:text-slate-900"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <CardContent className="p-0">
            {filteredHistories.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Không tìm thấy giao dịch nào phù hợp với bộ lọc.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Loại GD</TableHead>
                    <TableHead className="text-xs">Mô tả / Mã đơn</TableHead>
                    <TableHead className="text-xs text-right">Biến động</TableHead>
                    <TableHead className="text-xs text-right">Số dư sau GD</TableHead>
                    <TableHead className="text-xs text-right">Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistories.map((h) => {
                    const isDeposit = h.type === 0;
                    const isCommission = h.type === 1;
                    const isRefund = h.type === 2;
                    const isWithdraw = h.type === 3;

                    return (
                      <TableRow key={h.id}>
                        <TableCell>
                          {isDeposit && (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 gap-1 text-[11px]">
                              <ArrowDownLeft className="h-3 w-3 text-emerald-600" /> Cộng tiền / Nạp ví
                            </Badge>
                          )}
                          {isCommission && (
                            <Badge className="bg-amber-50 text-amber-800 border-amber-200 gap-1 text-[11px]">
                              <ArrowUpRight className="h-3 w-3 text-amber-600" /> Khấu trừ hoa hồng sàn
                            </Badge>
                          )}
                          {isRefund && (
                            <Badge className="bg-blue-50 text-blue-800 border-blue-200 gap-1 text-[11px]">
                              <ArrowDownLeft className="h-3 w-3 text-blue-600" /> Hoàn tiền ví
                            </Badge>
                          )}
                          {isWithdraw && (
                            <Badge className="bg-purple-50 text-purple-800 border-purple-200 gap-1 text-[11px]">
                              <Building2 className="h-3 w-3 text-purple-600" /> Rút về tài khoản
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="font-semibold text-slate-800">{h.description}</div>
                          {h.booking && (
                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                              <span>Đơn: {h.booking.bookingCode}</span>
                              {h.booking.store?.storeName && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-1.5 py-0.5 rounded font-sans border border-blue-100">
                                  {h.booking.store.storeName}
                                </span>
                              )}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-right font-bold">
                          {isDeposit || isRefund ? (
                            <span className="text-emerald-600">
                              +{Number(h.amount).toLocaleString("vi-VN")} đ
                            </span>
                          ) : isWithdraw ? (
                            <span className="text-purple-700">
                              -{Number(h.amount).toLocaleString("vi-VN")} đ
                            </span>
                          ) : (
                            <span className="text-amber-700">
                              -{Number(h.amount).toLocaleString("vi-VN")} đ
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-right font-mono font-medium text-slate-700">
                          {Number(h.balanceAfter).toLocaleString("vi-VN")} đ
                        </TableCell>

                        <TableCell className="text-xs text-right text-slate-500">
                          {new Date(h.createdAt).toLocaleString("vi-VN")}
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

      {/* Deposit Modal */}
      <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Nạp Tiền Vào Ví Đối Tác</DialogTitle>
            <DialogDescription className="text-xs">
              Thanh toán cọc hoa hồng qua cổng VietQR PayOS để tiếp nhận đơn liên tục.
            </DialogDescription>
          </DialogHeader>

          {!depositQrInfo ? (
            <form onSubmit={handleCreateDepositQr} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Chọn nhanh số tiền nạp:</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[200000, 500000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        depositAmount === amt
                          ? "border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-600/10"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {(amt / 1000).toLocaleString()}k đ
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hoặc nhập số tiền tùy chọn (VNĐ):</Label>
                <Input
                  type="number"
                  step="50000"
                  min="50000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  required
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDepositOpen(false)}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isGeneratingQr}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isGeneratingQr ? "Đang sinh QR..." : "Tạo mã nạp ví VietQR"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 pt-2 text-center">
              <div className="w-56 h-56 mx-auto bg-slate-50 border rounded-2xl p-2 flex items-center justify-center">
                {depositQrInfo.qrCode ? (
                  <img src={depositQrInfo.qrCode} alt="Mã QR PayOS nạp tiền vào ví đối tác" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="h-20 w-20 text-slate-300 animate-pulse" />
                )}
              </div>

              <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-2xl border text-left">
                {depositQrInfo?.accountName && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Chủ tài khoản:</span>
                    <strong className="text-slate-900 uppercase font-bold">{depositQrInfo.accountName}</strong>
                  </div>
                )}
                {depositQrInfo?.accountNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Số tài khoản:</span>
                    <strong className="font-mono text-slate-900 font-bold">{depositQrInfo.accountNumber}</strong>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Số tiền nạp:</span>
                  <strong className="text-amber-700 font-black text-sm">{depositAmount.toLocaleString("vi-VN")} VNĐ</strong>
                </div>
                <div className="flex justify-between items-center border-t pt-1.5">
                  <span className="text-slate-500">Nội dung CK:</span>
                  <strong className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-600 font-bold">
                    {`NAP VI P${wallet?.partnerId || ''}`.trim() || 'NAP VI PARTNER'}
                  </strong>
                </div>
              </div>

              {/* Mobile Actions: Chuyển khoản ngay & Tải QR */}
              <div className="space-y-2 pt-1">
                {depositQrInfo?.checkoutUrl && (
                  <Button
                    type="button"
                    onClick={() => {
                      window.open(depositQrInfo.checkoutUrl, "_blank");
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-xs cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Chuyển Khoản Ngay (Mở App Ngân Hàng)</span>
                  </Button>
                )}

                {depositQrInfo?.qrCode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadDepositQr}
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 font-bold text-xs h-10 rounded-xl gap-2 shadow-xs cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Tải Mã QR Về Máy</span>
                  </Button>
                )}
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2 text-left">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>Sau khi nạp thành công, hệ thống tự động quét và duyệt các đơn trong Hàng chờ FIFO.</span>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-amber-800 bg-amber-50/80 py-2.5 px-3 rounded-xl border border-amber-200">
                <Loader2 className="h-4 w-4 animate-spin text-amber-600 shrink-0" />
                <span>Hệ thống đang tự động lắng nghe Webhook ngân hàng...</span>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDepositOpen(false);
                    setDepositQrInfo(null);
                  }}
                  className="w-full sm:w-auto"
                >
                  Đóng cửa sổ
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleSimulateDepositSuccess}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  [Mô phỏng nạp test]
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal (Rút tiền về ngân hàng) */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Yêu Cầu Rút Tiền Về Ngân Hàng
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tiền sẽ được giải ngân về số tài khoản ngân hàng chính chủ của bạn đã liên kết với cửa hàng.
            </DialogDescription>
          </DialogHeader>

          {/* Bank Destination Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Tài khoản thụ hưởng nhận tiền
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{bankInfo.bankName}</span>
              <span className="font-mono font-bold text-emerald-700">{bankInfo.bankAccountNum}</span>
            </div>
            <div className="text-[11px] text-slate-600">
              Chủ tài khoản: <strong>{bankInfo.fullName}</strong>
            </div>
          </div>

          <form onSubmit={handleRequestWithdraw} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Số tiền muốn rút (VNĐ):</Label>
                <span className="text-[11px] text-slate-500">
                  Khả dụng: <strong className="text-emerald-700 font-bold">{balance.toLocaleString("vi-VN")} đ</strong>
                </span>
              </div>
              <Input
                type="number"
                step="50000"
                min="50000"
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="font-bold text-base"
                required
              />
              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[200000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWithdrawAmount(amt)}
                    className="p-1.5 rounded-lg border text-[11px] font-bold hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    {(amt / 1000).toLocaleString()}k
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWithdrawAmount(balance)}
                  className="p-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-[11px] font-black text-emerald-800 hover:bg-emerald-100 transition-colors"
                >
                  Tất cả
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ghi chú (Tùy chọn):</Label>
              <Input
                placeholder="VD: Rút doanh thu tuần..."
                value={withdrawNote}
                onChange={(e) => setWithdrawNote(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
              ⚠️ Yêu cầu rút tiền tối thiểu là <strong>50.000 VNĐ</strong>. Ban Quản Trị Sàn sẽ xử lý và chuyển khoản cho bạn trong vòng 24 giờ làm việc.
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsWithdrawOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingWithdraw || balance <= 0 || withdrawAmount > balance}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
              >
                {isSubmittingWithdraw ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Đang gửi yêu cầu...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Xác Nhận Rút Tiền
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Xác thực Mật khẩu Chủ Cửa Hàng khi rút tiền */}
      <Dialog open={isWithdrawPasswordModalOpen} onOpenChange={setIsWithdrawPasswordModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-2xl p-6 bg-white space-y-4">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1">
              <Lock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Xác Thực Quyền Chủ Cửa Hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chức năng rút tiền về tài khoản ngân hàng yêu cầu Mật khẩu Chủ Cửa Hàng (Owner HQ) để đảm bảo an toàn tài chính.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyPassword} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Mật khẩu Chủ Cửa Hàng *</Label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={ownerPasswordInput}
                onChange={(e) => setOwnerPasswordInput(e.target.value)}
                className="text-xs h-10 rounded-xl"
                autoFocus
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsWithdrawPasswordModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isVerifyingPassword}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
              >
                {isVerifyingPassword ? "Đang xác thực..." : "Xác Nhận & Tiếp Tục Rút Tiền"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PartnerWalletPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      }
    >
      <PartnerWalletContent />
    </Suspense>
  );
}


