"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api, User, UserDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Search,
  Shield,
  Store,
  UserCheck,
  Lock,
  Unlock,
  CreditCard,
  FileText,
  Eye,
  Building2,
  Bike,
  ClipboardList,
  Star,
  Wallet,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  FileEdit,
  ExternalLink,
  ZoomIn,
  X,
  History,
  Car,
  Tag,
  Filter,
  Check,
  Hash,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // User details modal
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Delete locked user modal
  const [deletingUser, setDeletingUser] = useState<{ id: number; fullName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Partner modal tabs and filters
  const [partnerActiveTab, setPartnerActiveTab] = useState<string>("stores");
  const [partnerBranchFilter, setPartnerBranchFilter] = useState<number | "all">("all");
  const [modelSearchQuery, setModelSearchQuery] = useState("");
  const [bookingSearchQuery, setBookingSearchQuery] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.getUsers();
      setUsers(data as User[]);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await api.admin.toggleUserStatus(userId);
      const newStatus = res.status;
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      if (userDetail && userDetail.id === userId) {
        setUserDetail((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      toast.success(
        `Đã ${newStatus ? "mở khóa" : "khóa"} tài khoản người dùng #${userId}.`
      );
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật trạng thái tài khoản.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      if (selectedUserId === deletingUser.id) {
        setSelectedUserId(null);
        setUserDetail(null);
      }
      toast.success(`Đã xóa vĩnh viễn tài khoản "${deletingUser.fullName}" (#${deletingUser.id}) thành công.`);
      setDeletingUser(null);
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa tài khoản này.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewDetail = async (userId: number) => {
    setSelectedUserId(userId);
    setIsLoadingDetail(true);
    setPartnerActiveTab("stores");
    setPartnerBranchFilter("all");
    setModelSearchQuery("");
    setBookingSearchQuery("");
    try {
      const detail = await api.admin.getUserDetail(userId);
      setUserDetail(detail);
    } catch (err: any) {
      toast.error(err.message || "Không thể tải chi tiết người dùng.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const nonAdminUsers = users.filter((u) => u.role !== 0);

  const filteredUsers = nonAdminUsers.filter((u) => {
    const matchRole = roleFilter === undefined || u.role === roleFilter;
    const matchStatus = statusFilter === undefined || u.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      (u.bankAccountNum && u.bankAccountNum.includes(q));
    return matchRole && matchStatus && matchSearch;
  });

  const roleBadges: Record<number, { label: string; color: string; icon: any }> = {
    0: { label: "Admin Sàn", color: "bg-red-50 text-red-800 border-red-200", icon: Shield },
    1: { label: "Đối Tác (Partner)", color: "bg-amber-50 text-amber-800 border-amber-200", icon: Store },
    2: { label: "Khách Hàng (Customer)", color: "bg-blue-50 text-blue-800 border-blue-200", icon: UserCheck },
  };

  // Aggregated Stats
  const totalCustomers = nonAdminUsers.filter((u) => u.role === 2).length;
  const totalPartners = nonAdminUsers.filter((u) => u.role === 1).length;
  const totalLocked = nonAdminUsers.filter((u) => !u.status).length;

  return (
    <div className="py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-6xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-600">
              Quản Trị Hệ Thống
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Quản Lý Đối Tác & Khách Hàng Chi Tiết
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Xem hồ sơ chi tiết đối tác, chi nhánh trực thuộc, ví hoa hồng hoặc lịch sử đặt đơn và đánh giá của khách hàng.
            </p>
          </div>

          <Link href="/admin">
            <Button variant="outline" size="sm" className="text-xs rounded-xl">
              ← Về Dashboard
            </Button>
          </Link>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Tổng tài khoản</span>
              <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">{nonAdminUsers.length}</div>
            <span className="text-[11px] text-slate-400">Tất cả tài khoản trong hệ thống</span>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Khách thuê xe</span>
              <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-700">{totalCustomers}</div>
            <span className="text-[11px] text-blue-600 font-semibold">Tài khoản khách hàng</span>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Đối tác nhà xe</span>
              <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Store className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700">{totalPartners}</div>
            <span className="text-[11px] text-amber-600 font-semibold">Chủ xe đối tác liên kết</span>
          </Card>

          <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Tài khoản bị khóa</span>
              <div className="h-8 w-8 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-red-700">{totalLocked}</div>
            <span className="text-[11px] text-red-600 font-semibold">Tạm ngưng quyền truy cập</span>
          </Card>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              placeholder="Tìm theo tên, email, SĐT, GPLX, STK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: undefined, label: "Tất cả vai trò" },
              { id: 2, label: "Khách hàng (Customer)" },
              { id: 1, label: "Đối tác (Partner)" },
            ].map((r) => (
              <button
                key={String(r.id)}
                onClick={() => setRoleFilter(r.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  roleFilter === r.id
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r.label}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            {[
              { val: undefined, label: "Tất cả TT" },
              { val: true, label: "Hoạt động" },
              { val: false, label: "Đã khóa" },
            ].map((st) => (
              <button
                key={String(st.val)}
                onClick={() => setStatusFilter(st.val)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st.val
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Đang tải danh sách tài khoản...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                Không tìm thấy tài khoản người dùng nào khớp với bộ lọc.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="text-xs font-bold text-slate-700">Người dùng</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Vai trò</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Pháp lý / Ngân hàng</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Hoạt động gắn liền</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Trạng thái</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => {
                    const roleObj = roleBadges[u.role] || roleBadges[2];
                    const Icon = roleObj.icon;
                    const isPartner = u.role === 1;
                    const isCustomer = u.role === 2;

                    return (
                      <TableRow key={u.id} className="hover:bg-slate-50/50">
                        {/* Name & Contact */}
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center shrink-0 uppercase border">
                              {u.fullName?.charAt(0) || "U"}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.fullName}</span>
                                <span className="text-[11px] font-mono text-slate-400">#{u.id}</span>
                              </div>
                              <div className="text-slate-500 font-mono text-[11px]">{u.email}</div>
                              <div className="text-slate-500 text-[11px]">SĐT: {u.phone}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Badge className={`${roleObj.color} text-[11px] gap-1 font-semibold`}>
                            <Icon className="h-3 w-3" /> {roleObj.label}
                          </Badge>
                        </TableCell>

                        {/* Legal / Bank */}
                        <TableCell className="text-xs text-slate-600">
                          {u.bankAccountNum ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                              <span>STK: <strong className="font-mono">{u.bankAccountNum}</strong> ({u.bankName})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Chưa khai báo STK</span>
                          )}
                        </TableCell>

                        {/* Summary Metrics */}
                        <TableCell className="text-xs">
                          {isPartner && (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-slate-700">
                                <Building2 className="h-3.5 w-3.5 text-purple-600" />
                                <span><strong>{u._count?.stores || 0}</strong> chi nhánh</span>
                              </div>
                              {u.partnerWallet && (
                                <div className="text-[11px] text-amber-700 font-semibold">
                                  Ví: {Number(u.partnerWallet.balance).toLocaleString("vi-VN")} đ
                                </div>
                              )}
                            </div>
                          )}

                          {isCustomer && (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-blue-700 font-medium">
                                <ClipboardList className="h-3.5 w-3.5" />
                                <span><strong>{u._count?.bookings || 0}</strong> đơn đã đặt</span>
                              </div>
                              <div className="flex items-center gap-1 text-amber-700 text-[11px]">
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                <span>{u._count?.reviews || 0} đánh giá</span>
                              </div>
                            </div>
                          )}

                          {!isPartner && !isCustomer && (
                            <span className="text-xs text-red-600 font-bold">Quản trị tối cao</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          {u.status ? (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]">
                              Hoạt động
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-800 border-red-200 text-[11px]">
                              Đã khóa
                            </Badge>
                          )}
                        </TableCell>

                        {/* Action Buttons */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetail(u.id)}
                              className="text-xs h-8 px-2.5 rounded-xl text-blue-700 border-blue-200 hover:bg-blue-50 font-bold gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Chi tiết</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(u.id, u.status)}
                              className={`text-xs h-8 px-2.5 rounded-xl gap-1 ${
                                u.status
                                  ? "text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                                  : "text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                              }`}
                            >
                              {u.status ? (
                                <>
                                  <Lock className="h-3.5 w-3.5" /> Khóa
                                </>
                              ) : (
                                <>
                                  <Unlock className="h-3.5 w-3.5" /> Mở
                                </>
                              )}
                            </Button>

                            {!u.status && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setDeletingUser({ id: u.id, fullName: u.fullName })}
                                className="text-xs h-8 px-2.5 rounded-xl gap-1 text-red-600 hover:text-white hover:bg-red-600 border-red-200 transition-colors"
                                title="Xóa vĩnh viễn tài khoản bị khóa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Xóa</span>
                              </Button>
                            )}
                          </div>
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

      {/* ===================================================================== */}
      {/* MODAL: CHI TIẾT NGƯỜI DÙNG TOÀN DIỆN (PARTNER & CUSTOMER)             */}
      {/* ===================================================================== */}
      <Dialog
        open={selectedUserId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserId(null);
            setUserDetail(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl rounded-3xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
          {isLoadingDetail || !userDetail ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Đang tải toàn bộ dữ liệu chi tiết người dùng...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Profile Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 text-white font-black text-xl flex items-center justify-center border border-white/20 uppercase">
                    {userDetail.fullName.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black">{userDetail.fullName}</h2>
                      <span className="text-xs text-slate-300 font-mono">ID: #{userDetail.id}</span>
                      {userDetail.status ? (
                        <Badge className="bg-emerald-500 text-white text-[10px]">Hoạt động</Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white text-[10px]">Đã khóa</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 flex items-center gap-3">
                      <span>📧 {userDetail.email}</span>
                      <span>📞 {userDetail.phone}</span>
                      <span>
                        📅 Tham gia: {new Date(userDetail.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(userDetail.id, userDetail.status)}
                    className={`text-xs font-bold h-9 rounded-xl gap-1.5 ${
                      userDetail.status
                        ? "bg-red-600/20 text-red-300 border-red-500/40 hover:bg-red-600/30"
                        : "bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30"
                    }`}
                  >
                    {userDetail.status ? (
                      <>
                        <Lock className="h-4 w-4" /> Khóa tài khoản
                      </>
                    ) : (
                      <>
                        <Unlock className="h-4 w-4" /> Mở khóa tài khoản
                      </>
                    )}
                  </Button>

                  {!userDetail.status && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingUser({ id: userDetail.id, fullName: userDetail.fullName })}
                      className="text-xs font-bold h-9 rounded-xl gap-1.5 bg-red-600 hover:bg-red-700 text-white border-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Xóa vĩnh viễn</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* DETAILS FOR PARTNER (ROLE === 1) */}
              {userDetail.role === 1 && (() => {
                // Flatten all models across partner stores
                const allPartnerModels =
                  userDetail.stores?.flatMap((s) =>
                    (s.vehicleModels || []).map((m) => ({
                      ...m,
                      storeName: s.storeName,
                      storeAddress: s.address,
                      storePhone: s.phoneContact,
                    }))
                  ) || [];

                // Flatten all bookings across partner stores
                const allPartnerBookings =
                  userDetail.stores?.flatMap((s) =>
                    (s.bookings || []).map((b) => ({
                      ...b,
                      storeName: s.storeName,
                      storeAddress: s.address,
                      storePhone: s.phoneContact,
                    }))
                  ) || [];

                // Filtered models
                const displayedModels = allPartnerModels.filter((m) => {
                  const matchBranch =
                    partnerBranchFilter === "all" || m.storeId === partnerBranchFilter;
                  const q = modelSearchQuery.toLowerCase().trim();
                  const matchText =
                    !q ||
                    m.name.toLowerCase().includes(q) ||
                    m.brand.toLowerCase().includes(q);
                  return matchBranch && matchText;
                });

                // Filtered bookings
                const displayedBookings = allPartnerBookings.filter((b) => {
                  const matchBranch =
                    partnerBranchFilter === "all" || b.storeId === partnerBranchFilter;
                  const q = bookingSearchQuery.toLowerCase().trim();
                  const matchText =
                    !q ||
                    b.bookingCode.toLowerCase().includes(q) ||
                    b.customer?.fullName?.toLowerCase().includes(q) ||
                    b.customer?.phone?.includes(q);
                  return matchBranch && matchText;
                });

                const typeLabels: Record<number, string> = {
                  0: "Xe số",
                  1: "Tay ga",
                  2: "Côn tay",
                  3: "Xe điện",
                };

                const bookingStatusLabels: Record<number, { text: string; color: string }> = {
                  0: { text: "Chờ thanh toán cọc", color: "bg-amber-500 text-white" },
                  1: { text: "Đã cọc - Chờ nhận xe", color: "bg-blue-600 text-white" },
                  2: { text: "Hàng chờ xác nhận", color: "bg-purple-600 text-white" },
                  3: { text: "Đang thuê xe", color: "bg-indigo-600 text-white" },
                  4: { text: "Đã hoàn thành", color: "bg-emerald-600 text-white" },
                  5: { text: "Đã hủy", color: "bg-red-600 text-white" },
                };

                const itemStatusLabels: Record<number, { text: string; color: string }> = {
                  0: { text: "Sẵn sàng", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
                  1: { text: "Đã giữ chỗ", color: "bg-amber-100 text-amber-800 border-amber-300" },
                  2: { text: "Đang thuê", color: "bg-blue-100 text-blue-800 border-blue-300" },
                  3: { text: "Bảo dưỡng", color: "bg-rose-100 text-rose-800 border-rose-300" },
                };

                return (
                  <Tabs value={partnerActiveTab} onValueChange={setPartnerActiveTab} className="w-full">
                    <TabsList className="w-full justify-start rounded-2xl p-1 bg-slate-100 overflow-x-auto flex-nowrap gap-1">
                      <TabsTrigger value="stores" className="rounded-xl text-xs gap-1.5 whitespace-nowrap">
                        <Building2 className="h-3.5 w-3.5 text-purple-600" />
                        Chi Nhánh Trực Thuộc ({userDetail.stores?.length || 0})
                      </TabsTrigger>
                      <TabsTrigger value="models" className="rounded-xl text-xs gap-1.5 whitespace-nowrap">
                        <Bike className="h-3.5 w-3.5 text-indigo-600" />
                        Kho Dòng Xe ({allPartnerModels.length})
                      </TabsTrigger>
                      <TabsTrigger value="bookings" className="rounded-xl text-xs gap-1.5 whitespace-nowrap">
                        <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                        Đơn Đặt Của Partner ({allPartnerBookings.length})
                      </TabsTrigger>
                      <TabsTrigger value="wallet" className="rounded-xl text-xs gap-1.5 whitespace-nowrap">
                        <Wallet className="h-3.5 w-3.5 text-amber-600" />
                        Ví Đối Tác & Giao Dịch
                      </TabsTrigger>
                      <TabsTrigger value="requests" className="rounded-xl text-xs gap-1.5 whitespace-nowrap">
                        <FileEdit className="h-3.5 w-3.5 text-blue-600" />
                        Yêu Cầu Cập Nhật ({userDetail.storeUpdateRequests?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: STORES */}
                    <TabsContent value="stores" className="space-y-4 pt-2">
                      {userDetail.stores?.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400">
                          Đối tác này chưa tạo chi nhánh nào.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {userDetail.stores?.map((s) => (
                            <div
                              key={s.id}
                              className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3 hover:border-slate-300 transition-all"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-900">{s.storeName}</span>
                                  <span className="text-xs text-slate-400">• Mã: #{s.id}</span>
                                  {s.status === 1 && (
                                    <Badge className="bg-emerald-600 text-white text-[10px]">
                                      Hoạt động (ACTIVE)
                                    </Badge>
                                  )}
                                  {s.status === 3 && (
                                    <Badge className="bg-amber-600 text-white text-[10px]">
                                      Tạm ngừng (PAUSED)
                                    </Badge>
                                  )}
                                  {s.status === 4 && (
                                    <Badge className="bg-indigo-600 text-white text-[10px]">
                                      Sửa chữa (MAINTENANCE)
                                    </Badge>
                                  )}
                                  {s.status === 0 && (
                                    <Badge className="bg-amber-500 text-white text-[10px]">
                                      Chờ duyệt (PENDING)
                                    </Badge>
                                  )}
                                  {s.status === 2 && (
                                    <Badge className="bg-red-600 text-white text-[10px]">
                                      Bị từ chối (REJECTED)
                                    </Badge>
                                  )}
                                </div>

                                <div className="text-xs text-slate-500 font-semibold">
                                  Cọc: <strong className="text-slate-900">{s.rentalPolicy?.depositPercent || 15}%</strong>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                                <div className="flex items-start gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                  <span>{s.address}</span>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <Phone className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  <span>Hotline: {s.phoneContact}</span>
                                </div>
                              </div>

                              {/* Action row with buttons to view models & bookings */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-slate-500 text-xs">
                                  <span>Quy mô:</span>
                                  <span className="font-semibold text-indigo-700">
                                    {s.vehicleModels?.length || 0} dòng xe
                                  </span>
                                  <span>•</span>
                                  <span className="font-semibold text-blue-700">
                                    {s.bookings?.length || 0} đơn đặt
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setPartnerBranchFilter(s.id);
                                      setPartnerActiveTab("models");
                                    }}
                                    className="h-8 px-3 text-xs font-bold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 border-indigo-200 rounded-xl gap-1.5 shadow-xs"
                                  >
                                    <Bike className="h-3.5 w-3.5" />
                                    <span>Xem dòng xe ({s.vehicleModels?.length || 0}) →</span>
                                  </Button>

                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setPartnerBranchFilter(s.id);
                                      setPartnerActiveTab("bookings");
                                    }}
                                    className="h-8 px-3 text-xs font-bold text-blue-700 bg-blue-50/70 hover:bg-blue-100 border-blue-200 rounded-xl gap-1.5 shadow-xs"
                                  >
                                    <ClipboardList className="h-3.5 w-3.5" />
                                    <span>Xem đơn đặt ({s.bookings?.length || 0}) →</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* TAB 2: MODELS */}
                    <TabsContent value="models" className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Filter className="h-3.5 w-3.5 text-indigo-600" /> Chi nhánh:
                          </span>
                          <select
                            value={partnerBranchFilter}
                            onChange={(e) =>
                              setPartnerBranchFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                            }
                            className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-500/20"
                          >
                            <option value="all">Tất cả chi nhánh ({allPartnerModels.length} dòng xe)</option>
                            {userDetail.stores?.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.storeName} ({st.vehicleModels?.length || 0} xe)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="relative w-full sm:w-64">
                          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <Input
                            placeholder="Tìm tên dòng xe, hãng..."
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
                          />
                        </div>
                      </div>

                      {displayedModels.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                          <Bike className="h-10 w-10 text-slate-300 mx-auto" />
                          <h4 className="text-sm font-bold text-slate-700">Không tìm thấy dòng xe nào</h4>
                          <p className="text-xs text-slate-400">
                            Chi nhánh được chọn chưa có dòng xe nào hoặc không khớp với từ khóa tìm kiếm.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {displayedModels.map((m) => {
                            const coverImg =
                              m.images && m.images.length > 0
                                ? m.images[0]
                                : "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=400&q=80";

                            return (
                              <div
                                key={m.id}
                                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-white shadow-xs transition-all space-y-3 flex flex-col justify-between"
                              >
                                <div className="flex gap-3.5">
                                  <div
                                    onClick={() => setPreviewImage(coverImg)}
                                    className="h-20 w-24 rounded-xl overflow-hidden bg-slate-100 border shrink-0 cursor-pointer relative group"
                                    title="Nhấn để phóng to ảnh"
                                  >
                                    <img src={coverImg} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <ZoomIn className="h-4 w-4 text-white" />
                                    </div>
                                  </div>

                                  <div className="space-y-1 min-w-0 flex-1 text-xs">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <Badge className="bg-slate-900 text-white text-[10px] px-2 py-0.5">
                                        {m.brand}
                                      </Badge>
                                      <Badge variant="outline" className="text-[10px] text-indigo-700 border-indigo-200 bg-indigo-50/50">
                                        {typeLabels[m.type] || "Xe máy"}
                                      </Badge>
                                      <span className="text-[11px] font-mono text-slate-400 ml-auto">#{m.id}</span>
                                    </div>

                                    <h4 className="font-extrabold text-sm text-slate-900 truncate" title={m.name}>
                                      {m.name}
                                    </h4>

                                    <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1 truncate">
                                      <Building2 className="h-3 w-3 shrink-0" />
                                      <span className="truncate">{m.storeName}</span>
                                    </p>

                                    <div className="pt-0.5">
                                      <span className="text-slate-400 text-[11px]">Giá niêm yết: </span>
                                      <strong className="text-emerald-700 font-black text-sm">
                                        {Number(m.rentPrice).toLocaleString("vi-VN")} đ
                                      </strong>
                                      <span className="text-slate-400 text-[11px]">/ngày</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Physical Vehicle Items (Biển số xe thực tế) */}
                                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="font-bold text-slate-600 flex items-center gap-1">
                                      <Tag className="h-3 w-3 text-slate-400" />
                                      Đội xe vật lý ({m.vehicleItems?.length || 0} xe):
                                    </span>
                                  </div>

                                  {m.vehicleItems && m.vehicleItems.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                                      {m.vehicleItems.map((vi) => {
                                        const st = itemStatusLabels[vi.status] || itemStatusLabels[0];
                                        return (
                                          <div
                                            key={vi.id}
                                            className={`px-2 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 ${st.color}`}
                                            title={`Biển số: ${vi.licensePlate} - Màu: ${vi.color || "Không rõ"} - Trạng thái: ${st.text}`}
                                          >
                                            <span className="font-bold">{vi.licensePlate}</span>
                                            {vi.color && <span className="opacity-70 text-[10px]">({vi.color})</span>}
                                            <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                                            <span className="text-[10px] font-sans font-medium">{st.text}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[11px] text-slate-400 italic">Chưa có biển số xe vật lý nào được thêm.</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* TAB 3: BOOKINGS */}
                    <TabsContent value="bookings" className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Filter className="h-3.5 w-3.5 text-blue-600" /> Chi nhánh:
                          </span>
                          <select
                            value={partnerBranchFilter}
                            onChange={(e) =>
                              setPartnerBranchFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                            }
                            className="h-9 px-3 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="all">Tất cả chi nhánh ({allPartnerBookings.length} đơn đặt)</option>
                            {userDetail.stores?.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.storeName} ({st.bookings?.length || 0} đơn)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="relative w-full sm:w-72">
                          <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <Input
                            placeholder="Tìm mã đơn, tên khách, SĐT..."
                            value={bookingSearchQuery}
                            onChange={(e) => setBookingSearchQuery(e.target.value)}
                            className="pl-9 h-9 text-xs rounded-xl bg-white border-slate-200"
                          />
                        </div>
                      </div>

                      {displayedBookings.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                          <ClipboardList className="h-10 w-10 text-slate-300 mx-auto" />
                          <h4 className="text-sm font-bold text-slate-700">Chưa có đơn đặt xe nào</h4>
                          <p className="text-xs text-slate-400">
                            Chi nhánh này chưa phát sinh đơn thuê nào từ khách hàng hoặc không khớp với bộ lọc tìm kiếm.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {displayedBookings.map((b) => {
                            const st = bookingStatusLabels[b.status] || bookingStatusLabels[0];
                            const detail = b.bookingDetails?.[0];
                            const modelName = detail?.model?.name || "Dòng xe";
                            const plate = detail?.vehicleItem?.licensePlate;

                            return (
                              <div
                                key={b.id}
                                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white shadow-xs transition-all space-y-3"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold font-mono text-sm text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg border">
                                      #{b.bookingCode}
                                    </span>
                                    <Badge className={`${st.color} text-[10px]`}>{st.text}</Badge>
                                    <span className="text-xs text-slate-400">•</span>
                                    <span className="text-xs font-semibold text-purple-700 flex items-center gap-1">
                                      <Building2 className="h-3 w-3" /> {b.storeName}
                                    </span>
                                  </div>

                                  <span className="text-[11px] text-slate-400">
                                    Đặt ngày: {new Date(b.createdAt).toLocaleString("vi-VN")}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                  <div className="space-y-1">
                                    <span className="text-slate-400 text-[11px]">Khách hàng thuê:</span>
                                    <p className="font-bold text-slate-900">{b.customer?.fullName || "Khách hàng"}</p>
                                    <p className="text-slate-600 flex items-center gap-1">
                                      <Phone className="h-3 w-3 text-emerald-600 shrink-0" />
                                      <span>{b.customer?.phone || "Chưa có SĐT"}</span>
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-slate-400 text-[11px]">Xe thuê & Biển số:</span>
                                    <p className="font-bold text-slate-900 flex items-center gap-1.5 truncate">
                                      <Bike className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                                      <span className="truncate">{modelName}</span>
                                    </p>
                                    <p className="text-[11px] text-slate-600 font-mono">
                                      Biển số: {plate ? <strong className="text-indigo-700">{plate}</strong> : <span className="italic text-slate-400">Chờ bàn giao xe</span>}
                                    </p>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-slate-400 text-[11px]">Lịch trình thuê:</span>
                                    <p className="font-semibold text-slate-800">
                                      {new Date(b.startTime).toLocaleDateString("vi-VN")} → {new Date(b.endTime).toLocaleDateString("vi-VN")}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {b.pickupType === 1 ? `Giao tận nơi: ${b.deliveryAddress || "Theo yêu cầu"}` : "Nhận tại cửa hàng"}
                                    </p>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-4 text-[11px]">
                                    <div>
                                      <span className="text-slate-400">Tổng tiền thuê: </span>
                                      <strong className="text-slate-900 font-bold">{Number(b.rentAmount).toLocaleString("vi-VN")} đ</strong>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Đã cọc: </span>
                                      <strong className="text-emerald-700 font-bold">{Number(b.depositAmount).toLocaleString("vi-VN")} đ</strong>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Hoa hồng sàn: </span>
                                      <strong className="text-amber-700 font-bold">{Number(b.commissionAmount).toLocaleString("vi-VN")} đ</strong>
                                    </div>
                                  </div>

                                  <div className="text-[11px] font-semibold text-slate-500">
                                    {b.payments && b.payments.length > 0 && b.payments[0].paymentStatus === 1 ? (
                                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px] gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Đã nhận cọc VietQR
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-[10px] gap-1">
                                        <Clock className="h-3 w-3" /> Chờ xác nhận thanh toán
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* TAB 4: WALLET */}
                    <TabsContent value="wallet" className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-1">
                          <span className="text-slate-500 font-semibold">Số dư ví hoa hồng</span>
                          <div className="text-xl font-black text-amber-700">
                            {Number(userDetail.partnerWallet?.balance || 0).toLocaleString("vi-VN")} đ
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-semibold">Hạn mức nợ âm sàn</span>
                          <div className="text-xl font-black text-slate-800">
                            -{Number(userDetail.partnerWallet?.creditLimit || 500000).toLocaleString("vi-VN")} đ
                          </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-slate-500 font-semibold">Tài khoản ngân hàng</span>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            {userDetail.bankAccountNum || "Chưa thiết lập"}
                          </div>
                          <span className="text-[11px] text-slate-500">{userDetail.bankName}</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Lịch sử biến động ví gần nhất
                        </h4>
                        {userDetail.partnerWallet?.histories?.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">Chưa có giao dịch ví nào.</p>
                        ) : (
                          <div className="space-y-2">
                            {userDetail.partnerWallet?.histories?.map((h) => (
                              <div
                                key={h.id}
                                className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between gap-3"
                              >
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-800">{h.description}</p>
                                  <span className="text-[10px] text-slate-400">
                                    {new Date(h.createdAt).toLocaleString("vi-VN")}
                                  </span>
                                </div>
                                <div className="text-right font-mono font-bold text-slate-900">
                                  {Number(h.amount).toLocaleString("vi-VN")} đ
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* TAB 5: UPDATE REQUESTS */}
                    <TabsContent value="requests" className="space-y-3 pt-2">
                      {userDetail.storeUpdateRequests?.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-8">
                          Đối tác chưa từng gửi yêu cầu thay đổi thông tin cửa hàng nào.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {userDetail.storeUpdateRequests?.map((r) => (
                            <div
                              key={r.id}
                              className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">
                                    Yêu cầu #{r.id} ({r.store?.storeName || r.storeName})
                                  </span>
                                  {r.status === 0 && (
                                    <Badge className="bg-amber-500 text-white text-[10px]">Chờ duyệt</Badge>
                                  )}
                                  {r.status === 1 && (
                                    <Badge className="bg-emerald-600 text-white text-[10px]">Đã duyệt</Badge>
                                  )}
                                  {r.status === 2 && (
                                    <Badge className="bg-red-600 text-white text-[10px]">Bị từ chối</Badge>
                                  )}
                                </div>
                                <p className="text-slate-500 text-[11px]">
                                  Đổi thành: {r.storeName} • {r.address} • Cọc: {r.depositPercent}%
                                </p>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                );
              })()}

              {/* DETAILS FOR CUSTOMER (ROLE === 2) */}
              {userDetail.role === 2 && (
                <Tabs defaultValue="bookings" className="w-full">
                  <TabsList className="w-full justify-start rounded-2xl p-1 bg-slate-100">
                    <TabsTrigger value="bookings" className="rounded-xl text-xs gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5 text-blue-600" />
                      Lịch Sử Đơn Đặt ({userDetail.bookings?.length || 0})
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="rounded-xl text-xs gap-1.5">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                      Đánh Giá Đã Viết ({userDetail.reviews?.length || 0})
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB 1: CUSTOMER BOOKINGS */}
                  <TabsContent value="bookings" className="space-y-3 pt-2">
                    {userDetail.bookings?.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400">
                        Khách hàng này chưa phát sinh đơn đặt xe nào trên hệ thống.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userDetail.bookings?.map((b) => {
                          const statusLabels: Record<number, { text: string; color: string }> = {
                            0: { text: "Chờ thanh toán cọc", color: "bg-amber-500 text-white" },
                            1: { text: "Đã cọc - Chờ nhận xe", color: "bg-blue-600 text-white" },
                            2: { text: "Hàng chờ xác nhận", color: "bg-purple-600 text-white" },
                            3: { text: "Đang thuê xe", color: "bg-indigo-600 text-white" },
                            4: { text: "Đã hoàn thành", color: "bg-emerald-600 text-white" },
                            5: { text: "Đã hủy", color: "bg-red-600 text-white" },
                          };
                          const st = statusLabels[b.status] || statusLabels[0];

                          return (
                            <div
                              key={b.id}
                              className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold font-mono text-sm text-slate-900">
                                    {b.bookingCode}
                                  </span>
                                  <Badge className={`${st.color} text-[10px]`}>{st.text}</Badge>
                                </div>
                                <span className="text-xs text-slate-400">
                                  Ngày tạo: {new Date(b.createdAt).toLocaleDateString("vi-VN")}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                                <div>
                                  <span className="text-slate-400">Cửa hàng thuê:</span>
                                  <p className="font-semibold text-slate-900">{b.store?.storeName}</p>
                                </div>
                                <div>
                                  <span className="text-slate-400">Thời gian thuê:</span>
                                  <p className="font-semibold text-slate-800">
                                    {new Date(b.startTime).toLocaleDateString("vi-VN")} →{" "}
                                    {new Date(b.endTime).toLocaleDateString("vi-VN")} ({Number(b.dayRent)} ngày)
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-slate-400">Tổng tiền:</span>
                                  <p className="font-black text-slate-900 text-sm">
                                    {Number(b.rentAmount).toLocaleString("vi-VN")} đ
                                  </p>
                                  <span className="text-[11px] text-emerald-600">
                                    Cọc: {Number(b.depositAmount).toLocaleString("vi-VN")} đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  {/* TAB 2: CUSTOMER REVIEWS */}
                  <TabsContent value="reviews" className="space-y-3 pt-2">
                    {userDetail.reviews?.length === 0 ? (
                      <div className="text-center py-10 text-xs text-slate-400">
                        Khách hàng này chưa để lại đánh giá nào.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userDetail.reviews?.map((rv) => (
                          <div
                            key={rv.id}
                            className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{rv.store?.storeName}</span>
                                <div className="flex items-center text-amber-500">
                                  {Array.from({ length: rv.rateStar }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {rv.createdAt && new Date(rv.createdAt).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                            <p className="text-slate-700 italic">"{rv.comment}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}

              {/* ADMIN ROLE ONLY */}
              {userDetail.role === 0 && (
                <div className="p-6 rounded-2xl bg-red-50/50 border border-red-200 text-xs text-red-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <Shield className="h-4 w-4 text-red-600" /> Tài khoản Quản Trị Viên Cấp Cao
                  </div>
                  <p>
                    Tài khoản này có toàn quyền quản trị hệ thống, phê duyệt cửa hàng đối tác, kiểm duyệt đánh giá, và cấu hình thông số sàn.
                  </p>
                </div>
              )}

              <DialogFooter className="pt-2 border-t">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedUserId(null);
                    setUserDetail(null);
                  }}
                  className="text-xs rounded-xl"
                >
                  Đóng cửa sổ
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox Preview Modal */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl p-3 bg-black/90 border-0 rounded-2xl">
            <div className="relative flex items-center justify-center">
              <img src={previewImage} alt="Preview" className="max-h-[80vh] w-auto rounded-xl object-contain" />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL: XÁC NHẬN XÓA VĨNH VIỄN TÀI KHOẢN BỊ KHÓA */}
      <Dialog open={!!deletingUser} onOpenChange={() => !isDeleting && setDeletingUser(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-3">
              <Trash2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Xóa Vĩnh Viễn Tài Khoản
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
              Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản{" "}
              <strong className="text-slate-900 font-bold">{deletingUser?.fullName}</strong> (#{deletingUser?.id})?
              Hành động này sẽ giải phóng toàn bộ dữ liệu liên quan và không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeletingUser(null)}
              className="text-xs rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white text-xs rounded-xl font-bold gap-1.5"
            >
              {isDeleting ? "Đang xóa..." : "Xác nhận xóa vĩnh viễn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
