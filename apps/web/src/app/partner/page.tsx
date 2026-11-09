"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { api, Store, VehicleModel, PartnerWallet, Booking, StoreUpdateRequest, WalletHistory } from "@/lib/api";
import { VIETNAMESE_BANKS } from "@/lib/constants";
import { ProvinceCombobox } from "@/components/common/province-combobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Bike,
  Wallet,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Store as StoreIcon,
  QrCode,
  ClipboardList,
  Shield,
  Layers,
  Plus,
  BarChart3,
  PieChart as PieChartIcon,
  Percent,
  Lock,
  Unlock,
  KeyRound,
  Building2,
  FileEdit,
  ArrowLeft,
  MapPin,
  Phone,
  CreditCard,
  Upload,
  Camera,
  Loader2,
  Check,
  XCircle,
  HelpCircle,
  AlertCircle,
  Send,
  Trash2,
  PauseCircle,
  Wrench,
  Activity,
  Power,
  Search,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
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
import { toast } from "sonner";

function PartnerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode"); // "owner" | "branch" | null
  const { user } = useAuth();

  // Mode: "selector" | "owner" | "branch"
  const [currentMode, setCurrentMode] = useState<"selector" | "owner" | "branch">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const m = params.get("mode");
      if (m === "branch") return "branch";
      if (m === "owner") return "owner";
    }
    return "selector";
  });

  // State: Data
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Store | null>(null);
  const [wallet, setWallet] = useState<PartnerWallet | null>(null);
  const [walletHistories, setWalletHistories] = useState<WalletHistory[]>([]);
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [updateRequests, setUpdateRequests] = useState<StoreUpdateRequest[]>([]);
  const [minDepositConfig, setMinDepositConfig] = useState<number>(15);
  const [isLoading, setIsLoading] = useState(true);

  // Phân hệ chi nhánh: Bộ lọc lịch sử giao dịch
  const [branchTxSearch, setBranchTxSearch] = useState("");
  const [branchTxFromDate, setBranchTxFromDate] = useState("");
  const [branchTxToDate, setBranchTxToDate] = useState("");
  const [branchTxType, setBranchTxType] = useState("ALL");

  // Security: Owner Password
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(false);
  const [hasOwnerPassword, setHasOwnerPassword] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  // Setup / Change Owner Password
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSettingInitialPassword, setIsSettingInitialPassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Modal: Add New Branch (Owner HQ)
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchProvince, setNewBranchProvince] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [newBranchPhone, setNewBranchPhone] = useState(user?.phone || "");
  const [newBranchDeposit, setNewBranchDeposit] = useState<number>(15);
  const [newBranchDesc, setNewBranchDesc] = useState("");
  const [newBranchBankAcc, setNewBranchBankAcc] = useState(user?.bankAccountNum || "");
  const [newBranchBankName, setNewBranchBankName] = useState(user?.bankName || "Vietcombank");
  const [newBranchImage, setNewBranchImage] = useState("");
  const [isUploadingBranchImage, setIsUploadingBranchImage] = useState(false);
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);
  const branchImageInputRef = useRef<HTMLInputElement>(null);

  // Modal: Request Store Update (Branch Operations)
  const [isUpdateRequestModalOpen, setIsUpdateRequestModalOpen] = useState(false);
  const [updateStoreName, setUpdateStoreName] = useState("");
  const [updateProvince, setUpdateProvince] = useState("");
  const [updateAddress, setUpdateAddress] = useState("");
  const [updatePhone, setUpdatePhone] = useState("");
  const [updateDeposit, setUpdateDeposit] = useState<number>(15);
  const [updateDesc, setUpdateDesc] = useState("");
  const [updateCancelRule, setUpdateCancelRule] = useState("");
  const [updateBankAcc, setUpdateBankAcc] = useState("");
  const [updateBankName, setUpdateBankName] = useState("");
  const [updateImage, setUpdateImage] = useState("");
  const [isUploadingUpdateImage, setIsUploadingUpdateImage] = useState(false);
  const [isSubmittingUpdateRequest, setIsSubmittingUpdateRequest] = useState(false);
  const updateImageInputRef = useRef<HTMLInputElement>(null);

  // Modal: Quick Deposit PayOS (Owner HQ)
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmountInput, setDepositAmountInput] = useState<number>(500000);
  const [depositQrInfo, setDepositQrInfo] = useState<any>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);

  // Modal: Quick Withdraw (Owner HQ)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmountInput, setWithdrawAmountInput] = useState<number>(500000);
  const [withdrawNoteInput, setWithdrawNoteInput] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Modal: Update Store Status (Owner HQ & Branch Ops)
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false);
  const [statusStoreTarget, setStatusStoreTarget] = useState<Store | null>(null);
  const [selectedStatusValue, setSelectedStatusValue] = useState<number>(1);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Modal: Operating Hours (Branch Ops)
  const [isOperatingHoursModalOpen, setIsOperatingHoursModalOpen] = useState(false);
  const [branchOpenTime, setBranchOpenTime] = useState("07:00");
  const [branchCloseTime, setBranchCloseTime] = useState("21:00");
  const [isSubmittingOperatingHours, setIsSubmittingOperatingHours] = useState(false);

  // New branch operating hours
  const [newBranchOpenTime, setNewBranchOpenTime] = useState("07:00");
  const [newBranchCloseTime, setNewBranchCloseTime] = useState("21:00");

  // Update request operating hours
  const [updateOpenTime, setUpdateOpenTime] = useState("07:00");
  const [updateCloseTime, setUpdateCloseTime] = useState("21:00");

  // Fetch initial data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [storesData, walletData, modelsData, bookingsData, passStatus, sysConfig, requestsData, historyData] =
        await Promise.all([
          api.partner.getStores().catch(() => []),
          api.partner.getWallet().catch(() => null),
          api.partner.getModels().catch(() => []),
          api.partner.getBookings().catch(() => []),
          api.partner.getOwnerPasswordStatus().catch(() => ({ hasOwnerPassword: false })),
          api.config.get().catch(() => ({ minDepositPercent: 15 })),
          api.partner.getStoreUpdateRequests().catch(() => []),
          api.partner.getWalletHistory(1, 100).catch(() => ({ histories: [] })),
        ]);

      setStores(storesData || []);
      const storeIdParam = searchParams.get("storeId");
      if (storeIdParam) {
        const found = (storesData || []).find((s) => s.id === Number(storeIdParam));
        if (found) setSelectedBranch(found);
      }

      setWallet(walletData);
      setWalletHistories(historyData?.histories || []);
      setModels(modelsData || []);
      setBookings(bookingsData || []);
      setHasOwnerPassword(!!passStatus?.hasOwnerPassword);
      setMinDepositConfig(Number(sysConfig?.minDepositPercent || 15));
      setNewBranchDeposit(Number(sysConfig?.minDepositPercent || 15));
      setUpdateRequests(requestsData || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const storeIdParam = searchParams.get("storeId");

  // Đồng bộ phân hệ theo URL query & phiên làm việc
  useEffect(() => {
    const sessionUnlocked = typeof window !== "undefined" && sessionStorage.getItem("partner_owner_unlocked") === "true";

    if (modeParam === "branch") {
      // Khi chọn/chuyển sang phân hệ chi nhánh -> Khóa bảo mật phân hệ chủ
      setIsOwnerUnlocked(false);
      sessionStorage.removeItem("partner_owner_unlocked");
      setCurrentMode("branch");

      if (storeIdParam) {
        const found = stores.find((s) => s.id === Number(storeIdParam));
        if (found) {
          setSelectedBranch(found);
        }
      } else {
        setSelectedBranch(null);
      }
    } else if (modeParam === "owner") {
      // Khi ở phân hệ chủ: Nếu đã mở khóa (từ session hoặc vừa nhập mật khẩu thành công) thì cho phép vào
      if (sessionUnlocked || isOwnerUnlocked) {
        setIsOwnerUnlocked(true);
        setCurrentMode("owner");
      } else {
        // Chưa mở khóa -> Buộc quay về màn hình chọn phân hệ để nhập mật khẩu
        setCurrentMode("selector");
        router.replace("/partner");
      }
    } else {
      // Ở màn hình chọn phân hệ ban đầu (không có mode param):
      // Tự động xóa trạng thái mở khóa, yêu cầu nhập mật khẩu 1 lần khi chọn vào phân hệ chủ
      setIsOwnerUnlocked(false);
      sessionStorage.removeItem("partner_owner_unlocked");
      setCurrentMode("selector");
      setSelectedBranch(null);
    }
  }, [modeParam, storeIdParam, stores, router]);

  // Khi ở phân hệ chi nhánh, tải lịch sử giao dịch chỉ riêng của chi nhánh đó (Requirement 2)
  useEffect(() => {
    if (currentMode === "branch" && selectedBranch?.id) {
      api.partner
        .getWalletHistory(1, 100, selectedBranch.id)
        .then((res) => {
          if (res?.histories) {
            setWalletHistories(res.histories);
          }
        })
        .catch(() => {});
    }
  }, [currentMode, selectedBranch?.id]);

  // ── Handlers: Security & Passwords ─────────────────────────────────────────

  const handleEnterOwnerPortal = () => {
    // "cứ vào là phải nhập mật khẩu"
    if (!hasOwnerPassword) {
      // First time setup
      setIsSettingInitialPassword(true);
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmPasswordInput("");
      setIsPasswordModalOpen(true);
    } else {
      // Always prompt for PIN / Password
      setUnlockPassword("");
      setIsUnlockModalOpen(true);
    }
  };

  const handleVerifyPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPassword.trim()) {
      toast.error("Vui lòng nhập mật khẩu chủ cửa hàng!");
      return;
    }

    setIsVerifyingPassword(true);
    try {
      const res = await api.partner.verifyOwnerPassword(unlockPassword.trim());
      if (res.verified) {
        setIsOwnerUnlocked(true);
        sessionStorage.setItem("partner_owner_unlocked", "true");
        setIsUnlockModalOpen(false);
        setCurrentMode("owner");
        router.push("/partner?mode=owner");
        toast.success("Xác thực chủ cửa hàng thành công!");
      }
    } catch (err: any) {
      toast.error(err.message || "Mật khẩu chủ cửa hàng không chính xác!");
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const handleSavePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasswordInput.length < 4) {
      toast.error("Mật khẩu mới phải có ít nhất 4 ký tự!");
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      toast.error("Xác nhận mật khẩu mới không khớp!");
      return;
    }
    if (!isSettingInitialPassword && hasOwnerPassword && !currentPasswordInput) {
      toast.error("Vui lòng nhập mật khẩu hiện tại!");
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await api.partner.setOwnerPassword({
        currentPassword: isSettingInitialPassword ? undefined : currentPasswordInput,
        newPassword: newPasswordInput,
      });

      setHasOwnerPassword(true);
      setIsOwnerUnlocked(true);
      sessionStorage.setItem("partner_owner_unlocked", "true");
      setIsPasswordModalOpen(false);
      toast.success(
        isSettingInitialPassword
          ? "Đã thiết lập mật khẩu chủ cửa hàng thành công!"
          : "Đã đổi mật khẩu chủ cửa hàng thành công!"
      );
      if (isSettingInitialPassword) {
        setCurrentMode("owner");
        router.push("/partner?mode=owner");
      }
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật mật khẩu.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Thoát phân hệ chủ: Tự động khóa lại và quay về menu chọn
  const handleExitOwnerPortal = () => {
    setIsOwnerUnlocked(false);
    sessionStorage.removeItem("partner_owner_unlocked");
    setCurrentMode("selector");
    router.push("/partner");
  };

  const handleEnterBranchPortal = (store?: Store) => {
    if (store) {
      setSelectedBranch(store);
      if (typeof window !== "undefined") {
        localStorage.setItem("active_partner_store_id", String(store.id));
        localStorage.setItem("active_partner_store_name", store.storeName);
      }
      setCurrentMode("branch");
      router.push(`/partner?mode=branch&storeId=${store.id}`);
    } else {
      setSelectedBranch(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("active_partner_store_id");
        localStorage.removeItem("active_partner_store_name");
      }
      setCurrentMode("branch");
      router.push("/partner?mode=branch");
    }
  };

  const handleExitBranchPortal = () => {
    setSelectedBranch(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("active_partner_store_id");
      localStorage.removeItem("active_partner_store_name");
    }
    setCurrentMode("selector");
    router.push("/partner");
  };

  const handleSelectBranch = (store: Store) => {
    setSelectedBranch(store);
    if (typeof window !== "undefined") {
      localStorage.setItem("active_partner_store_id", String(store.id));
      localStorage.setItem("active_partner_store_name", store.storeName);
    }
    router.push(`/partner?mode=branch&storeId=${store.id}`);
  };

  const handleResetSelectedBranch = () => {
    setSelectedBranch(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("active_partner_store_id");
      localStorage.removeItem("active_partner_store_name");
    }
    router.push("/partner?mode=branch");
  };

  const [deletingStoreId, setDeletingStoreId] = useState<number | null>(null);

  const handleDeleteStore = async (storeId: number, storeName: string) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa chi nhánh "${storeName}"?\nLưu ý: Toàn bộ danh sách dòng xe và dữ liệu thuộc chi nhánh này sẽ bị xóa vĩnh viễn. Thao tác không thể hoàn tác.`
      )
    ) {
      return;
    }

    setDeletingStoreId(storeId);
    try {
      await api.partner.deleteStore(storeId);
      setStores((prev) => prev.filter((s) => s.id !== storeId));
      setModels((prev) => prev.filter((m) => m.storeId !== storeId));
      if (selectedBranch?.id === storeId) {
        setSelectedBranch(null);
      }
      toast.success(`Đã xóa chi nhánh "${storeName}" thành công!`);
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa chi nhánh. Vui lòng kiểm tra lại đơn thuê.");
    } finally {
      setDeletingStoreId(null);
    }
  };

  // ── Handlers: Image Uploads ────────────────────────────────────────────────

  const uploadFile = async (file: File, folder: string = "img_store"): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Vui lòng chỉ tải lên tệp hình ảnh!");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");
    return data.url;
  };

  const handleBranchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBranchImage(true);
    try {
      const url = await uploadFile(file);
      setNewBranchImage(url);
      toast.success("Tải ảnh mặt tiền chi nhánh thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh!");
    } finally {
      setIsUploadingBranchImage(false);
      e.target.value = "";
    }
  };

  const handleUpdateImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingUpdateImage(true);
    try {
      const url = await uploadFile(file);
      setUpdateImage(url);
      toast.success("Tải ảnh mới thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh!");
    } finally {
      setIsUploadingUpdateImage(false);
      e.target.value = "";
    }
  };

  // ── Handlers: Add New Branch (Owner HQ) ────────────────────────────────────

  const handleCreateBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !newBranchAddress.trim() || !newBranchPhone.trim()) {
      toast.error("Vui lòng điền đầy đủ tên chi nhánh, địa chỉ và số điện thoại!");
      return;
    }
    if (newBranchDeposit < minDepositConfig) {
      toast.error(`Mức cọc tối thiểu theo quy định hệ thống là ${minDepositConfig}%`);
      return;
    }

    setIsSubmittingBranch(true);
    try {
      await api.partner.createStore({
        storeName: newBranchName.trim(),
        province: newBranchProvince.trim() || undefined,
        address: newBranchAddress.trim(),
        phoneContact: newBranchPhone.trim(),
        description: newBranchDesc.trim() || undefined,
        storeImage: newBranchImage || undefined,
        depositPercent: newBranchDeposit,
        bankAccountNum: newBranchBankAcc.trim(),
        bankName: newBranchBankName,
        openTime: newBranchOpenTime,
        closeTime: newBranchCloseTime,
        cancelRule: "Hủy trước 24h được hoàn 100% cọc.",
      });

      toast.success("Chi nhánh mới đã được tạo và gửi tới Quản trị viên sàn kiểm duyệt!");
      setIsAddBranchModalOpen(false);
      // Reset form
      setNewBranchName("");
      setNewBranchProvince("");
      setNewBranchAddress("");
      setNewBranchDesc("");
      setNewBranchImage("");
      setNewBranchOpenTime("07:00");
      setNewBranchCloseTime("21:00");
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi tạo chi nhánh mới.");
    } finally {
      setIsSubmittingBranch(false);
    }
  };

  // ── Handlers: Store Update Request (Branch Operations) ─────────────────────

  const handleOpenUpdateRequestModal = () => {
    if (!selectedBranch) return;
    setUpdateStoreName(selectedBranch.storeName);
    setUpdateProvince(selectedBranch.province || "");
    setUpdateAddress(selectedBranch.address);
    setUpdatePhone(selectedBranch.phoneContact);
    setUpdateDeposit(
      selectedBranch.rentalPolicy?.depositPercent
        ? Number(selectedBranch.rentalPolicy.depositPercent)
        : minDepositConfig
    );
    setUpdateDesc(selectedBranch.description || "");
    setUpdateCancelRule(selectedBranch.rentalPolicy?.cancelRule || "");
    setUpdateBankAcc(user?.bankAccountNum || selectedBranch.partner?.bankAccountNum || "");
    setUpdateBankName(user?.bankName || selectedBranch.partner?.bankName || "Vietcombank");
    setUpdateImage(selectedBranch.storeImage || "");
    setUpdateOpenTime(selectedBranch.openTime || "07:00");
    setUpdateCloseTime(selectedBranch.closeTime || "21:00");
    setIsUpdateRequestModalOpen(true);
  };

  const handleUpdateOperatingHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    setIsSubmittingOperatingHours(true);
    try {
      await api.partner.updateStore(selectedBranch.id, {
        openTime: branchOpenTime,
        closeTime: branchCloseTime,
      });
      toast.success("Đã cập nhật giờ hoạt động của chi nhánh thành công!");
      setIsOperatingHoursModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật giờ hoạt động");
    } finally {
      setIsSubmittingOperatingHours(false);
    }
  };

  const handleSendUpdateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    if (!updateStoreName.trim() || !updateAddress.trim() || !updatePhone.trim()) {
      toast.error("Vui lòng điền đủ tên cửa hàng, địa chỉ và số điện thoại!");
      return;
    }
    if (updateDeposit < minDepositConfig) {
      toast.error(`Mức cọc tối thiểu theo quy định hệ thống là ${minDepositConfig}%`);
      return;
    }

    // Kiểm tra xem có thông tin nào thay đổi so với hiện tại không
    const isStoreNameChanged = updateStoreName.trim() !== selectedBranch.storeName.trim();
    const isProvinceChanged = (updateProvince.trim() || "") !== (selectedBranch.province || "").trim();
    const isAddressChanged = updateAddress.trim() !== selectedBranch.address.trim();
    const isPhoneChanged = updatePhone.trim() !== selectedBranch.phoneContact.trim();
    const isDescChanged = (updateDesc.trim() || "") !== (selectedBranch.description || "").trim();
    const isImageChanged = (updateImage || "").trim() !== (selectedBranch.storeImage || "").trim();
    const isDepositChanged = Number(updateDeposit) !== Number(selectedBranch.rentalPolicy?.depositPercent || 0);
    const isCancelRuleChanged = (updateCancelRule.trim() || "") !== (selectedBranch.rentalPolicy?.cancelRule || "").trim();
    const isBankNumChanged = (updateBankAcc.trim() || "") !== (user?.bankAccountNum || "").trim();
    const isBankNameChanged = (updateBankName || "").trim() !== (user?.bankName || "").trim();
    const isOpenTimeChanged = (updateOpenTime || "").trim() !== (selectedBranch.openTime || "").trim();
    const isCloseTimeChanged = (updateCloseTime || "").trim() !== (selectedBranch.closeTime || "").trim();

    const hasAnyChange =
      isStoreNameChanged ||
      isProvinceChanged ||
      isAddressChanged ||
      isPhoneChanged ||
      isDescChanged ||
      isImageChanged ||
      isDepositChanged ||
      isCancelRuleChanged ||
      isBankNumChanged ||
      isBankNameChanged ||
      isOpenTimeChanged ||
      isCloseTimeChanged;

    if (!hasAnyChange) {
      toast.info("Thông tin chi nhánh không có gì thay đổi so với hiện tại, không cần gửi yêu cầu cập nhật!");
      return;
    }

    setIsSubmittingUpdateRequest(true);
    try {
      await api.partner.requestStoreUpdate(selectedBranch.id, {
        storeName: updateStoreName.trim(),
        province: updateProvince.trim() || undefined,
        address: updateAddress.trim(),
        phoneContact: updatePhone.trim(),
        depositPercent: updateDeposit,
        description: updateDesc.trim() || undefined,
        cancelRule: updateCancelRule.trim() || undefined,
        bankAccountNum: updateBankAcc.trim() || undefined,
        bankName: updateBankName || undefined,
        storeImage: updateImage || undefined,
        openTime: updateOpenTime,
        closeTime: updateCloseTime,
      });

      toast.success("Đã gửi yêu cầu thay đổi thông tin cửa hàng tới Ban Quản Trị Sàn!");
      setIsUpdateRequestModalOpen(false);
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi yêu cầu thay đổi.");
    } finally {
      setIsSubmittingUpdateRequest(false);
    }
  };

  // ── Handlers: Wallet Deposit & Withdraw (Owner HQ) ─────────────────────────

  const handleGenerateDepositQr = async () => {
    if (depositAmountInput < 10000) {
      toast.error("Số tiền nạp tối thiểu là 10.000 đ");
      return;
    }
    setIsGeneratingQr(true);
    try {
      const res = await api.partner.deposit({
        amount: depositAmountInput,
        description: `NAP_VI_PARTNER_${user?.id || 2}`,
      });
      setDepositQrInfo(res);
    } catch (err: any) {
      toast.error(err.message || "Không thể tạo mã VietQR nạp tiền.");
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmountInput < 50000) {
      toast.error("Số tiền rút tối thiểu là 50.000 đ");
      return;
    }
    const currentBal = wallet?.balance !== undefined ? Number(wallet.balance) : 0;
    if (withdrawAmountInput > currentBal) {
      toast.error("Số dư ví khả dụng không đủ để rút số tiền này!");
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      await api.partner.requestPayout({
        amount: withdrawAmountInput,
        note: withdrawNoteInput.trim() || undefined,
      });
      toast.success("Đã gửi yêu cầu rút tiền về tài khoản ngân hàng thành công!");
      setIsWithdrawModalOpen(false);
      setWithdrawNoteInput("");
      loadAllData();
    } catch (err: any) {
      toast.error(err.message || "Lỗi yêu cầu rút tiền.");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleOpenStatusModal = (store: Store) => {
    setStatusStoreTarget(store);
    setSelectedStatusValue([1, 3, 4].includes(store.status) ? store.status : 1);
    setIsUpdateStatusModalOpen(true);
  };

  const handleUpdateStoreStatusSubmit = async (customStatus?: number) => {
    const storeToUpdate = statusStoreTarget || selectedBranch;
    if (!storeToUpdate) return;
    const newStatus = customStatus !== undefined ? customStatus : selectedStatusValue;

    setIsSubmittingStatus(true);
    try {
      await api.partner.updateStoreStatus(storeToUpdate.id, newStatus);
      toast.success(
        newStatus === 1
          ? "Chi nhánh đã chuyển sang trạng thái: ĐANG HOẠT ĐỘNG!"
          : newStatus === 3
          ? "Chi nhánh đã chuyển sang trạng thái: TẠM NGỪNG HOẠT ĐỘNG!"
          : "Chi nhánh đã chuyển sang trạng thái: ĐANG SỬA CHỮA / BẢO TRÌ!"
      );

      // Cập nhật state danh sách stores
      setStores((prev) =>
        prev.map((s) => (s.id === storeToUpdate.id ? { ...s, status: newStatus } : s))
      );

      // Cập nhật selectedBranch nếu trùng id
      if (selectedBranch?.id === storeToUpdate.id) {
        setSelectedBranch((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      setIsUpdateStatusModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật trạng thái chi nhánh");
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Filter approved branches for branch operations (1=Active, 3=Paused, 4=Maintenance)
  const approvedBranches = stores.filter((s) => [1, 3, 4].includes(s.status));
  const activeBranches = stores.filter((s) => s.status === 1);
  const pendingBranches = stores.filter((s) => s.status === 0);

  const balance = wallet?.balance !== undefined ? Number(wallet.balance) : 0;
  const creditLimit = wallet?.creditLimit !== undefined ? Number(wallet.creditLimit) : 500000;

  // Real calculations (Không dùng số liệu ảo để người dùng tự do test hệ thống)
  const completedBookings = bookings.filter((b) => b.status === 4);
  const activeRentalsCount = bookings.filter((b) => b.status === 3).length; // Đang cho thuê
  const confirmedPickupCount = bookings.filter((b) => b.status === 1).length; // Chờ bàn giao xe
  const waitingQueueCount = bookings.filter((b) => b.status === 2).length; // Hàng chờ FIFO

  // Doanh thu thực tế từ các đơn hoàn thành
  const realGrossRevenue = completedBookings.reduce(
    (sum, b) => sum + Number(b.rentAmount || b.depositAmount || 0),
    0
  );
  const realNetRevenue = completedBookings.reduce((sum, b) => {
    const rent = Number(b.rentAmount || 0);
    const comm = Number(b.commissionAmount || 0);
    return sum + (rent - comm > 0 ? rent - comm : rent * 0.9);
  }, 0);

  // Đội xe thực tế hợp nhất từ tất cả dòng xe
  const allVehicleItems = models.flatMap((m) => m.vehicleItems || []);
  const totalVehiclesCount = allVehicleItems.length;
  const availableVehiclesCount = allVehicleItems.filter((v) => v.status === 0).length;
  const reservedVehiclesCount = allVehicleItems.filter((v) => v.status === 1).length;
  const rentedVehiclesCount = allVehicleItems.filter((v) => v.status === 2).length;
  const maintenanceVehiclesCount = allVehicleItems.filter((v) => v.status === 3).length;

  const occupancyRate =
    totalVehiclesCount > 0
      ? Math.round(
          ((rentedVehiclesCount + activeRentalsCount > totalVehiclesCount
            ? totalVehiclesCount
            : rentedVehiclesCount) /
            totalVehiclesCount) *
            100
        )
      : 0;

  // Biểu đồ doanh thu 7 ngày thực tế
  const realRevenueTrend = React.useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString("vi-VN", { weekday: "short" });
      const dayFormatted = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      const dateStr = d.toISOString().split("T")[0];

      const dayBookings = completedBookings.filter((b) => {
        const bDate = new Date(b.createdAt || b.startTime).toISOString().split("T")[0];
        return bDate === dateStr;
      });

      const gross = dayBookings.reduce((sum, b) => sum + Number(b.rentAmount || 0), 0);
      const net = dayBookings.reduce((sum, b) => {
        const rent = Number(b.rentAmount || 0);
        const comm = Number(b.commissionAmount || 0);
        return sum + (rent - comm > 0 ? rent - comm : rent * 0.9);
      }, 0);

      days.push({
        day: `${dayName} (${dayFormatted})`,
        grossRevenue: gross,
        netRevenue: Math.round(net),
        trips: dayBookings.length,
      });
    }
    return days;
  }, [completedBookings]);

  // Biểu đồ trạng thái đội xe thực tế
  const realFleetStatusData = React.useMemo(() => {
    return [
      { name: "Đang cho khách thuê", value: rentedVehiclesCount, color: "#3B82F6" },
      { name: "Xe rảnh tại cửa hàng", value: availableVehiclesCount, color: "#10B981" },
      { name: "Đã giữ chỗ / Chờ giao", value: reservedVehiclesCount, color: "#6366F1" },
      { name: "Bảo dưỡng / Kiểm định", value: maintenanceVehiclesCount, color: "#F59E0B" },
    ];
  }, [rentedVehiclesCount, availableVehiclesCount, reservedVehiclesCount, maintenanceVehiclesCount]);

  // Filter update requests for currently selected branch
  const branchUpdateRequests = updateRequests.filter(
    (r) => selectedBranch && r.storeId === selectedBranch.id
  );

  // Dashboard Analytics & Charts cho từng chi nhánh (Requirement 2)
  const branchAnalytics = React.useMemo(() => {
    if (!selectedBranch) return null;

    const bBookings = bookings.filter((b) => b.storeId === selectedBranch.id);
    const bModels = models.filter((m) => m.storeId === selectedBranch.id);
    const bItems = bModels.flatMap((m) => m.vehicleItems || []);

    const totalItems = bItems.length;
    const availableItems = bItems.filter((i) => i.status === 0).length;
    const rentedItems = bItems.filter((i) => i.status === 1).length;
    const maintenanceItems = bItems.filter((i) => i.status === 2).length;
    const occupancy = totalItems > 0 ? Math.round((rentedItems / totalItems) * 100) : 0;

    const bCompletedBookings = bBookings.filter((b) => b.status === 4);
    const bWaitingQueue = bBookings.filter((b) => b.status === 2).length;
    const bConfirmed = bBookings.filter((b) => b.status === 1).length;
    const bActive = bBookings.filter((b) => b.status === 3).length;

    const totalGross = bCompletedBookings.reduce((sum, b) => sum + Number(b.rentAmount || 0), 0);
    const totalNet = bCompletedBookings.reduce((sum, b) => {
      const rent = Number(b.rentAmount || 0);
      const comm = Number(b.commissionAmount || 0);
      return sum + (rent - comm > 0 ? rent - comm : rent * 0.9);
    }, 0);

    // 7-day revenue trend for this branch
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString("vi-VN", { weekday: "short" });
      const dayFormatted = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      const dateStr = d.toISOString().split("T")[0];

      const dayBookings = bCompletedBookings.filter((b) => {
        const bDate = new Date(b.createdAt || b.startTime).toISOString().split("T")[0];
        return bDate === dateStr;
      });

      const gross = dayBookings.reduce((sum, b) => sum + Number(b.rentAmount || 0), 0);
      const net = dayBookings.reduce((sum, b) => {
        const rent = Number(b.rentAmount || 0);
        const comm = Number(b.commissionAmount || 0);
        return sum + (rent - comm > 0 ? rent - comm : rent * 0.9);
      }, 0);

      days.push({
        day: `${dayName} (${dayFormatted})`,
        grossRevenue: gross,
        netRevenue: Math.round(net),
        trips: dayBookings.length,
      });
    }

    // Vehicle fleet status breakdown
    const fleetStatusData = [
      { name: "Sẵn sàng giao", value: availableItems, color: "#10B981" },
      { name: "Khách đang thuê", value: rentedItems, color: "#3B82F6" },
      { name: "Đang bảo dưỡng", value: maintenanceItems, color: "#F59E0B" },
    ];

    // Status breakdown bar data
    const bookingStatusData = [
      { name: "Chờ giao xe", count: bConfirmed, fill: "#3B82F6" },
      { name: "Đang chạy", count: bActive, fill: "#6366F1" },
      { name: "Hoàn tất", count: bCompletedBookings.length, fill: "#10B981" },
      { name: "Hàng chờ FIFO", count: bWaitingQueue, fill: "#EA580C" },
    ];

    // Model revenue breakdown
    const modelStats = bModels
      .map((m) => {
        const mBookings = bCompletedBookings.filter((b) =>
          b.bookingDetails?.some((d) => d.modelId === m.id)
        );
        const mRevenue = mBookings.reduce((sum, b) => sum + Number(b.rentAmount || 0), 0);
        return {
          id: m.id,
          name: m.name,
          revenue: mRevenue,
          bookingsCount: mBookings.length,
          itemsCount: (m.vehicleItems || []).length,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totalItems,
      availableItems,
      rentedItems,
      maintenanceItems,
      occupancy,
      totalGross,
      totalNet: Math.round(totalNet),
      bWaitingQueue,
      bConfirmed,
      bActive,
      bCompleted: bCompletedBookings.length,
      revenueTrend: days,
      fleetStatusData,
      bookingStatusData,
      modelStats,
    };
  }, [selectedBranch, bookings, models]);

  // Bộ lọc lịch sử giao dịch gắn liền với chi nhánh (Requirement 2)
  const filteredBranchHistories = React.useMemo(() => {
    if (!selectedBranch) return [];
    const storeBookingIds = new Set(
      bookings.filter((b) => b.storeId === selectedBranch.id).map((b) => b.id)
    );

    return walletHistories.filter((h) => {
      // Mỗi chi nhánh chỉ hiển thị các giao dịch mà khách hàng đặt ở chi nhánh đó không hiển thị chung (Requirement 2)
      const belongs = Boolean(
        (h.booking?.storeId && h.booking.storeId === selectedBranch.id) ||
        (h.bookingId && storeBookingIds.has(h.bookingId))
      );
      if (!belongs) return false;

      // Filter theo loại
      if (branchTxType !== "ALL") {
        if (branchTxType === "DEPOSIT" && h.type !== 0) return false;
        if (branchTxType === "COMMISSION" && h.type !== 1) return false;
        if (branchTxType === "REFUND" && h.type !== 2) return false;
        if (branchTxType === "WITHDRAW" && h.type !== 3) return false;
      }

      // Filter theo ngày
      if (branchTxFromDate) {
        const itemDate = new Date(h.createdAt).toISOString().split("T")[0];
        if (itemDate < branchTxFromDate) return false;
      }
      if (branchTxToDate) {
        const itemDate = new Date(h.createdAt).toISOString().split("T")[0];
        if (itemDate > branchTxToDate) return false;
      }

      // Filter theo từ khóa
      if (branchTxSearch.trim()) {
        const q = branchTxSearch.toLowerCase();
        const matchDesc = h.description.toLowerCase().includes(q);
        const matchCode = h.booking?.bookingCode?.toLowerCase().includes(q);
        const matchAmount = String(h.amount).includes(q);
        if (!matchDesc && !matchCode && !matchAmount) return false;
      }

      return true;
    });
  }, [walletHistories, selectedBranch, bookings, branchTxType, branchTxFromDate, branchTxToDate, branchTxSearch]);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-sm font-semibold text-slate-500">Đang đồng bộ dữ liệu đối tác...</p>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-10 bg-slate-50/60 min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* =================================================================== */}
        {/* VIEW 1: PORTAL SELECTOR (MÀN HÌNH CHỌN 2 PHÂN HỆ ĐỐI TÁC)          */}
        {/* =================================================================== */}
        {currentMode === "selector" && (
          <div className="max-w-4xl mx-auto space-y-8 py-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
                <StoreIcon className="h-3.5 w-3.5" /> Hệ Thống Đối Tác VehicleRent
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Chào mừng, {user?.fullName || "Chủ Nhà Xe Đối Tác"}!
              </h1>
              <p className="text-sm text-slate-500 max-w-xl mx-auto">
                Hệ thống chia làm 2 phân hệ độc lập nhằm tối ưu phân quyền giữa Chủ sở hữu doanh nghiệp và Nhân viên phụ trách vận hành chi nhánh.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Option 1: Master Owner HQ */}
              <div
                onClick={handleEnterOwnerPortal}
                className="group relative bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="absolute top-5 right-5">
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    <Lock className="h-3 w-3 text-amber-600" /> Cần Mật Khẩu Cấp 2
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                    <Shield className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                      1. Quản Lý Riêng Của Chủ Cửa Hàng
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Dành riêng cho Chủ sở hữu: Kiểm soát toàn diện doanh thu các cơ sở, quản trị ví, nạp/rút tiền và đăng ký chi nhánh mới.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Thống kê doanh thu, biểu đồ dòng tiền & báo cáo đơn toàn sàn</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Quản lý Ví đối tác, nạp VietQR, yêu cầu rút tiền về ngân hàng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Thêm chi nhánh mới để gửi Admin kiểm duyệt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>Bảo mật bằng Mật khẩu cấp 2 (đặt & đổi mật khẩu tùy chỉnh)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl h-11 text-xs gap-2 shadow-xs group-hover:shadow-md">
                    <span>Mở Khóa Khu Vực Chủ Cửa Hàng</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Option 2: Branch Operations */}
              <div
                onClick={() => {
                  if (approvedBranches.length === 0) {
                    toast.warning("Bạn chưa có chi nhánh nào được duyệt (ACTIVE). Hãy vào Khu vực Chủ để xem xét hoặc tạo chi nhánh mới!");
                  }
                  handleEnterBranchPortal();
                }}
                className="group relative bg-white rounded-3xl p-7 border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
              >
                <div className="absolute top-5 right-5">
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    <StoreIcon className="h-3 w-3 text-blue-600" /> Vận Hành Cơ Sở
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <StoreIcon className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                      2. Quản Lý Vận Hành Chi Nhánh
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Dành cho Quản lý chi nhánh hoặc Nhân viên trực quầy: Chọn cơ sở làm việc, bàn giao xe cho khách, quản lý biển số xe thực tế.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span>Chọn chi nhánh cụ thể từ danh sách các cơ sở đã được duyệt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bike className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Quản lý dòng xe & kho biển số xe (hỗ trợ nhập Excel/CSV)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Tiếp nhận đơn thuê, kiểm tra bằng lái & bàn giao xe thực tế</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileEdit className="h-4 w-4 text-purple-600 shrink-0" />
                      <span>Gửi yêu cầu thay đổi thông tin chi nhánh lên Ban Quản Trị</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 font-semibold">
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                      <span>Loại bỏ hoàn toàn thông tin Ví & Tài chính để bảo mật</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button
                    variant="outline"
                    className="w-full border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 font-bold rounded-2xl h-11 text-xs gap-2"
                  >
                    <span>Vào Quản Lý Chi Nhánh</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 2: MASTER OWNER HQ (QUẢN LÝ RIÊNG CỦA CHỦ CỬA HÀNG)           */}
        {/* =================================================================== */}
        {currentMode === "owner" && (
          <div className="space-y-8">
            {/* Top Bar with Lock & Settings */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-400 text-amber-950 font-black text-[10px] uppercase tracking-wider">
                    👑 Phân Hệ Chủ Sở Hữu (Master HQ)
                  </Badge>
                  <span className="text-xs text-amber-200">• Đang mở khóa bảo mật</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Khu Vực Quản Lý Của Chủ Cửa Hàng
                </h2>
                <p className="text-xs sm:text-sm text-amber-100/80">
                  Thống kê doanh thu hợp nhất, kiểm soát số dư ví hoa hồng và phê duyệt chi nhánh.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  onClick={() => setIsAddBranchModalOpen(true)}
                  size="sm"
                  className="bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs h-9 rounded-xl gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4 text-amber-600" />
                  <span>Thêm Chi Nhánh Mới</span>
                </Button>

                <Button
                  onClick={() => {
                    setIsSettingInitialPassword(false);
                    setCurrentPasswordInput("");
                    setNewPasswordInput("");
                    setConfirmPasswordInput("");
                    setIsPasswordModalOpen(true);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-amber-800/60 border-amber-500/60 text-white hover:bg-amber-800 font-bold text-xs h-9 rounded-xl gap-1.5"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Đổi Mật Khẩu</span>
                </Button>

                <Button
                  onClick={handleExitOwnerPortal}
                  variant="outline"
                  size="sm"
                  className="bg-amber-950/40 border-amber-500/40 text-amber-200 hover:bg-amber-950 hover:text-white font-bold text-xs h-9 rounded-xl gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Về Menu Chọn</span>
                </Button>
              </div>
            </div>

            {/* Wallet & Financial Management Section */}
            <Card className="rounded-3xl border-2 border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white shadow-sm overflow-hidden p-6 sm:p-7 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-amber-600" />
                    <h3 className="text-lg font-black text-slate-900">Ví Đối Tác & Khấu Trừ Hoa Hồng</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Doanh thu khách thanh toán cọc và phí thuê. Hoa hồng sàn chỉ bị khấu trừ sau khi khách nhận xe thành công.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setDepositAmountInput(500000);
                      setDepositQrInfo(null);
                      setIsDepositModalOpen(true);
                    }}
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 px-4 rounded-xl gap-1.5 shadow-xs"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Nạp Ví VietQR</span>
                  </Button>

                  <Button
                    onClick={() => {
                      setWithdrawAmountInput(500000);
                      setWithdrawNoteInput("");
                      setIsWithdrawModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs h-9 px-4 rounded-xl gap-1.5"
                  >
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    <span>Rút Tiền Về Ngân Hàng</span>
                  </Button>

                  <Link href="/partner/wallet">
                    <Button variant="ghost" size="sm" className="text-xs text-amber-700 font-bold h-9 rounded-xl">
                      Chi tiết ví →
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Wallet Numbers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Số dư ví hiện tại</span>
                  <div className={`text-2xl font-black ${balance < 0 ? "text-red-600" : "text-amber-700"}`}>
                    {balance.toLocaleString("vi-VN")} <span className="text-xs text-slate-500">đ</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Khả dụng để nhận đơn và khấu trừ hoa hồng</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Hạn mức âm cho phép</span>
                  <div className="text-2xl font-black text-slate-800">
                    -{creditLimit.toLocaleString("vi-VN")} <span className="text-xs text-slate-500">đ</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold">Ví âm trong hạn mức vẫn nhận đơn bình thường</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-slate-500">Tài khoản nhận doanh thu</span>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {user?.bankAccountNum || "9876543210"}
                  </div>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    {user?.bankName || "Vietcombank"} • {user?.fullName || "Chủ đối tác"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Consolidated Revenue Analytics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Tổng doanh thu ròng</span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {realNetRevenue.toLocaleString("vi-VN")} <span className="text-xs text-slate-500">đ</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Tổng thu khách: {realGrossRevenue.toLocaleString("vi-VN")} đ
                </div>
              </Card>

              <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Tổng chuyến hoàn thành</span>
                  <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {completedBookings.length} <span className="text-xs text-slate-500">chuyến</span>
                </div>
                <div className="text-[11px] text-slate-500 font-semibold">Toàn bộ {stores.length} chi nhánh</div>
              </Card>

              <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Xe đang lăn bánh</span>
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Bike className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {rentedVehiclesCount} <span className="text-xs text-slate-500">xe đang chạy</span>
                </div>
                <div className="text-[11px] text-blue-600 font-semibold">Tỷ lệ lấp đầy: {occupancyRate}%</div>
              </Card>

              <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Tổng số chi nhánh</span>
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Building2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900">
                  {stores.length} <span className="text-xs text-slate-500">cơ sở</span>
                </div>
                <div className="text-[11px] text-purple-700 font-semibold">
                  {activeBranches.length} hoạt động, {stores.filter((s) => s.status === 3).length} tạm ngừng, {pendingBranches.length} chờ duyệt
                </div>
              </Card>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-xs bg-white p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div>
                    <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-amber-600" />
                      Doanh Thu 7 Ngày Gần Nhất (Gross vs Net)
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                      Số liệu thực tế tính theo các đơn hàng hoàn tất của nhà xe.
                    </CardDescription>
                  </div>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={realRevenueTrend}>
                      <defs>
                        <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(value: any, name: any) => [
                          `${Number(value).toLocaleString("vi-VN")} đ`,
                          name === "grossRevenue" ? "Tổng thu khách (Gross)" : "Thực nhận nhà xe (Net)",
                        ]}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Area type="monotone" dataKey="grossRevenue" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorGross)" />
                      <Area type="monotone" dataKey="netRevenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNet)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Fleet Status PieChart */}
              <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-6 space-y-4">
                <div className="pb-2 border-b">
                  <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-blue-600" />
                    Tình Trạng Đội Xe Hợp Nhất
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    {totalVehiclesCount} xe vật lý trên toàn hệ thống.
                  </CardDescription>
                </div>

                {totalVehiclesCount === 0 ? (
                  <div className="h-52 w-full flex flex-col items-center justify-center text-center p-4">
                    <Bike className="h-10 w-10 text-slate-300 mb-2" />
                    <span className="text-xs font-bold text-slate-600">Chưa có xe nào trong hệ thống</span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Thêm dòng xe và biển số xe ở các chi nhánh để theo dõi trạng thái.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="h-52 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={realFleetStatusData.filter((d) => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {realFleetStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [`${value} xe`, "Số lượng"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 pt-2 border-t text-xs">
                      {realFleetStatusData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-slate-600">{item.name}</span>
                          </div>
                          <span className="font-bold text-slate-900">{item.value} xe</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Branch Management Table */}
            <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b">
                <div>
                  <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                    Danh Sách Chi Nhánh Của Bạn
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Quản lý tất cả cơ sở kinh doanh đã phê duyệt và các chi nhánh mới đang chờ Admin duyệt.
                  </CardDescription>
                </div>

                <Button
                  onClick={() => setIsAddBranchModalOpen(true)}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-9 rounded-xl gap-1.5 shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  <span>Thêm Chi Nhánh Mới</span>
                </Button>
              </div>

              {stores.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-500">
                  Bạn chưa có chi nhánh nào. Hãy nhấn nút "Thêm Chi Nhánh Mới" ở trên để gửi hồ sơ duyệt!
                </div>
              ) : (
                <div className="space-y-3">
                  {stores.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="h-12 w-12 rounded-xl overflow-hidden border bg-slate-100 shrink-0">
                          <img
                            src={s.storeImage || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&q=80"}
                            alt={s.storeName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">{s.storeName}</span>
                            {s.status === 1 && (
                              <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Đang Hoạt Động
                              </Badge>
                            )}
                            {s.status === 3 && (
                              <Badge className="bg-amber-600 text-white text-[10px] gap-1">
                                <PauseCircle className="h-3 w-3" /> Tạm Ngừng Hoạt Động
                              </Badge>
                            )}
                            {s.status === 4 && (
                              <Badge className="bg-indigo-600 text-white text-[10px] gap-1">
                                <Wrench className="h-3 w-3" /> Đang Sửa Chữa
                              </Badge>
                            )}
                            {s.status === 0 && (
                              <Badge className="bg-amber-500 text-white text-[10px] gap-1 animate-pulse">
                                <Clock className="h-3 w-3" /> Chờ Admin Duyệt
                              </Badge>
                            )}
                            {s.status === 2 && (
                              <Badge className="bg-red-600 text-white text-[10px] gap-1">
                                <XCircle className="h-3 w-3" /> Bị Từ Chối
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" /> {s.address} • SĐT: {s.phoneContact}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <div className="text-right hidden sm:block mr-2">
                          <span className="text-slate-500">Mức cọc: </span>
                          <strong className="text-slate-900">{s.rentalPolicy?.depositPercent || 15}%</strong>
                        </div>

                        {[1, 3, 4].includes(s.status) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/partner/onboarding?storeId=${s.id}`)}
                              className="text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 h-8 rounded-xl gap-1 shadow-2xs"
                              title="Xem và chỉnh sửa hồ sơ chi nhánh này"
                            >
                              <StoreIcon className="h-3.5 w-3.5 text-indigo-600" />
                              <span>Hồ Sơ Chi Nhánh</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenStatusModal(s)}
                              className="text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-100 h-8 rounded-xl gap-1"
                              title="Thay đổi trạng thái hoạt động của chi nhánh"
                            >
                              <Activity className="h-3.5 w-3.5 text-blue-600" />
                              <span className="hidden sm:inline">Đổi Trạng Thái</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleEnterBranchPortal(s);
                              }}
                              className="text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50 h-8 rounded-xl"
                            >
                              Vào Vận Hành Cơ Sở →
                            </Button>
                          </>
                        )}

                        {![1, 3, 4].includes(s.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/partner/onboarding?storeId=${s.id}`)}
                            className="text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 h-8 rounded-xl gap-1 shadow-2xs"
                            title="Xem và cập nhật hồ sơ chi nhánh này"
                          >
                            <StoreIcon className="h-3.5 w-3.5 text-indigo-600" />
                            <span>Hồ Sơ Chi Nhánh</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteStore(s.id, s.storeName)}
                          disabled={deletingStoreId === s.id}
                          className="text-xs font-bold text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 h-8 rounded-xl gap-1"
                          title="Xóa chi nhánh này"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Xóa Chi Nhánh</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* =================================================================== */}
        {/* VIEW 3: BRANCH OPERATIONS (QUẢN LÝ VẬN HÀNH CHI NHÁNH - NO WALLET)   */}
        {/* =================================================================== */}
        {currentMode === "branch" && (
          <div className="space-y-8">
            {!selectedBranch ? (
              /* SUB-VIEW 3A: DANH SÁCH TỪNG CHI NHÁNH ĐỂ CHỌN */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Button
                        onClick={handleExitBranchPortal}
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold text-slate-600 h-8 px-2 rounded-xl gap-1 hover:bg-slate-200/70 -ml-2"
                      >
                        <ArrowLeft className="h-4 w-4" /> Về Menu Chọn Phân Hệ
                      </Button>
                      <span className="text-slate-300">|</span>
                      <Badge className="bg-blue-600 text-white text-[10px] uppercase font-bold">
                        🏪 Phân Hệ Vận Hành Chi Nhánh
                      </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      Chọn Chi Nhánh Để Vận Hành
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Mỗi cơ sở hoạt động độc lập về kho xe và đơn đặt. Nhấn vào chi nhánh bạn muốn quản lý làm việc.
                    </p>
                  </div>
                </div>

                {stores.length === 0 ? (
                  <Card className="rounded-3xl border-2 border-amber-200 bg-amber-50/50 p-8 text-center space-y-4">
                    <StoreIcon className="h-12 w-12 text-amber-500 mx-auto" />
                    <h3 className="text-lg font-bold text-amber-950">Chưa có chi nhánh nào</h3>
                    <p className="text-xs text-amber-800 max-w-md mx-auto">
                      Bạn chưa đăng ký chi nhánh nào. Hãy vào Khu vực Chủ Cửa Hàng để thêm chi nhánh mới gửi Admin duyệt!
                    </p>
                    <Button
                      onClick={handleEnterOwnerPortal}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                    >
                      Vào Khu Vực Chủ Để Thêm Chi Nhánh
                    </Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {stores.map((s) => {
                      const branchModelList = models.filter((m) => m.storeId === s.id);
                      const branchBookingList = bookings.filter((b) => b.storeId === s.id);
                      const isOperable = [1, 3, 4].includes(s.status);

                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            if (isOperable) {
                              handleSelectBranch(s);
                            } else if (s.status === 0) {
                              toast.info("Chi nhánh này đang chờ Admin duyệt, chưa thể thao tác vận hành.");
                            } else {
                              toast.error(`Chi nhánh bị từ chối: ${s.rejectReason || "Vui lòng cập nhật hồ sơ"}`);
                            }
                          }}
                          className={`group bg-white rounded-3xl border-2 transition-all p-5 flex flex-col justify-between space-y-4 shadow-xs ${
                            isOperable
                              ? "border-slate-200 hover:border-blue-500 hover:shadow-xl cursor-pointer"
                              : "border-slate-200/80 bg-slate-50/60 opacity-90 cursor-not-allowed"
                          }`}
                        >
                          <div className="space-y-3.5">
                            <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-slate-100 border">
                              <img
                                src={s.storeImage || "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&q=80"}
                                alt={s.storeName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute top-3 right-3">
                                {s.status === 1 && (
                                  <Badge className="bg-emerald-600 text-white text-[10px] gap-1 shadow-xs">
                                    <CheckCircle2 className="h-3 w-3" /> Đang Hoạt Động
                                  </Badge>
                                )}
                                {s.status === 3 && (
                                  <Badge className="bg-amber-600 text-white text-[10px] gap-1 shadow-xs">
                                    <PauseCircle className="h-3 w-3" /> Tạm Ngừng
                                  </Badge>
                                )}
                                {s.status === 4 && (
                                  <Badge className="bg-indigo-600 text-white text-[10px] gap-1 shadow-xs">
                                    <Wrench className="h-3 w-3" /> Đang Sửa Chữa
                                  </Badge>
                                )}
                                {s.status === 0 && (
                                  <Badge className="bg-amber-500 text-white text-[10px] gap-1 shadow-xs animate-pulse">
                                    <Clock className="h-3 w-3" /> Chờ Admin Duyệt
                                  </Badge>
                                )}
                                {s.status === 2 && (
                                  <Badge className="bg-red-600 text-white text-[10px] gap-1 shadow-xs">
                                    <XCircle className="h-3 w-3" /> Bị Từ Chối
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div>
                              <h3 className="font-extrabold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {s.storeName}
                              </h3>
                              <p className="text-xs text-slate-500 flex items-start gap-1 mt-1.5 line-clamp-2">
                                <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                                <span>{s.address}</span>
                              </p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>{s.phoneContact}</span>
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                <span className="text-[11px] text-slate-400 block font-medium">Dòng xe</span>
                                <strong className="text-sm font-black text-slate-800">{branchModelList.length}</strong>
                              </div>
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                                <span className="text-[11px] text-slate-400 block font-medium">Đơn đặt</span>
                                <strong className="text-sm font-black text-slate-800">{branchBookingList.length}</strong>
                              </div>
                            </div>
                          </div>

                          <div>
                            {isOperable ? (
                              <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-2 shadow-xs group-hover:shadow-md"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectBranch(s);
                                }}
                              >
                                <span>Vào Quản Lý Cơ Sở Này</span>
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                disabled
                                className="w-full text-xs font-semibold h-10 rounded-xl text-slate-400 cursor-not-allowed"
                              >
                                {s.status === 0 ? "Chờ Admin Phê Duyệt" : "Bị Từ Chối - Cần Cập Nhật"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* SUB-VIEW 3B: BẢNG VẬN HÀNH CHI NHÁNH ĐÃ CHỌN */
              <div className="space-y-8">
                {/* Header with Back button and Branch Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleResetSelectedBranch}
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold text-blue-700 border-blue-200 hover:bg-blue-50 h-8 px-2.5 rounded-xl gap-1 shadow-xs"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" /> Đổi Chi Nhánh Khác
                      </Button>
                      <Button
                        onClick={handleExitBranchPortal}
                        variant="ghost"
                        size="sm"
                        className="text-xs font-bold text-slate-600 h-8 px-2 rounded-xl gap-1 hover:bg-slate-200/70"
                      >
                        Về Menu Chọn
                      </Button>
                      <span className="text-slate-300">|</span>
                      <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold">
                        🏪 Cơ Sở: {selectedBranch.storeName}
                      </Badge>
                      {selectedBranch.status === 1 && (
                        <Badge className="bg-emerald-600 text-white text-[10px] gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Đang Hoạt Động
                        </Badge>
                      )}
                      {selectedBranch.status === 3 && (
                        <Badge className="bg-amber-600 text-white text-[10px] gap-1">
                          <PauseCircle className="h-3 w-3" /> Tạm Ngừng
                        </Badge>
                      )}
                      {selectedBranch.status === 4 && (
                        <Badge className="bg-indigo-600 text-white text-[10px] gap-1">
                          <Wrench className="h-3 w-3" /> Đang Sửa Chữa
                        </Badge>
                      )}
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {selectedBranch.storeName}
                    </h1>
                    <p className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" /> {selectedBranch.address}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>SĐT: {selectedBranch.phoneContact}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-purple-600" /> Giờ đón khách: {selectedBranch.openTime || "07:00"} - {selectedBranch.closeTime || "21:00"}
                      </span>
                    </p>
                  </div>

                  {/* Quick Status Button & Branch Switcher Dropdown */}
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenStatusModal(selectedBranch)}
                      className="text-xs font-bold text-slate-700 border-slate-300 hover:bg-slate-100 h-9 rounded-xl gap-1.5 shadow-xs"
                    >
                      <Activity className="h-4 w-4 text-blue-600" />
                      <span>Đổi Trạng Thái</span>
                    </Button>

                    {approvedBranches.length > 1 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Đổi nhanh:</span>
                        <select
                          value={selectedBranch.id}
                          onChange={(e) => {
                            const found = approvedBranches.find((b) => b.id === Number(e.target.value));
                            if (found) handleSelectBranch(found);
                          }}
                          className="h-9 px-3 text-xs font-bold rounded-xl border border-slate-300 bg-white text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500/20"
                        >
                          {approvedBranches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.storeName} {b.status === 3 ? "(Tạm ngừng)" : b.status === 4 ? "(Sửa chữa)" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Warning Banners for Inactive Stores */}
                {selectedBranch.status === 3 && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <PauseCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm">Chi nhánh hiện đang TẠM NGỪNG HOẠT ĐỘNG</h4>
                        <p className="text-xs text-amber-800">
                          Khách hàng sẽ không tìm thấy chi nhánh này trên bản đồ và trang tìm kiếm, các dòng xe cũng bị ẩn.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUpdateStoreStatusSubmit(1)}
                      disabled={isSubmittingStatus}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0 gap-1.5 shadow-xs"
                    >
                      <Power className="h-3.5 w-3.5" />
                      <span>Mở Lại Hoạt Động (Active)</span>
                    </Button>
                  </div>
                )}

                {selectedBranch.status === 4 && (
                  <div className="bg-indigo-50 border-2 border-indigo-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-indigo-950 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm">Chi nhánh đang trong trạng thái SỬA CHỮA / BẢO TRÌ</h4>
                        <p className="text-xs text-indigo-800">
                          Chi nhánh và các dòng xe đang được ẩn khỏi người dùng trong thời gian nâng cấp cơ sở vật chất.
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleUpdateStoreStatusSubmit(1)}
                      disabled={isSubmittingStatus}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shrink-0 gap-1.5 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Hoàn Tất Sửa Chữa & Mở Lại</span>
                    </Button>
                  </div>
                )}

                {/* Branch Quick Stats (Real Data for this store) */}
                {(() => {
                  const bModels = models.filter((m) => m.storeId === selectedBranch.id);
                  const bItems = bModels.flatMap((m) => m.vehicleItems || []);
                  const bAvailable = bItems.filter((i) => i.status === 0).length;
                  const bWaitPickup = bookings.filter((b) => b.storeId === selectedBranch.id && b.status === 1).length;
                  const bActiveRentals = bookings.filter((b) => b.storeId === selectedBranch.id && b.status === 3).length;

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
                        <span className="text-xs font-bold text-slate-500">Dòng xe kinh doanh</span>
                        <div className="text-2xl font-black text-slate-900">
                          {bModels.length} <span className="text-xs text-slate-500">dòng xe</span>
                        </div>
                        <span className="text-[11px] text-blue-600 font-semibold">Đăng ký tại cơ sở này</span>
                      </Card>

                      <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
                        <span className="text-xs font-bold text-slate-500">Xe sẵn sàng giao khách</span>
                        <div className="text-2xl font-black text-emerald-600">
                          {bAvailable} <span className="text-xs text-slate-500">xe rảnh</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Sẵn sàng nhận khách mới</span>
                      </Card>

                      <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
                        <span className="text-xs font-bold text-slate-500">Đơn chờ bàn giao xe</span>
                        <div className="text-2xl font-black text-amber-600">
                          {bWaitPickup} <span className="text-xs text-slate-500">đơn</span>
                        </div>
                        <span className="text-[11px] text-amber-700 font-semibold">Cần gán biển số thực tế</span>
                      </Card>

                      <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-2">
                        <span className="text-xs font-bold text-slate-500">Khách đang thuê xe</span>
                        <div className="text-2xl font-black text-blue-600">
                          {bActiveRentals} <span className="text-xs text-slate-500">chuyến</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Đang lưu thông trên đường</span>
                      </Card>
                    </div>
                  );
                })()}

                {/* Operations Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Card className="rounded-3xl border-2 border-slate-200 hover:border-amber-500 bg-white p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                        <Bike className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Dòng Xe & Kho Biển Số</h3>
                        <p className="text-xs text-slate-500">Quản lý dòng xe và xe vật lý</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Thêm dòng xe mới, cập nhật bảng giá thuê ngày, quản lý biển số xe vật lý, bảo dưỡng và nhập Excel.
                    </p>
                    <div className="pt-2">
                      <Link href={`/partner/vehicles?storeId=${selectedBranch?.id}`}>
                        <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-10 rounded-xl gap-2">
                          <span>Quản Lý Xe & Biển Số</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>

                  <Card className="rounded-3xl border-2 border-slate-200 hover:border-blue-500 bg-white p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Đơn Thuê & Bàn Giao</h3>
                        <p className="text-xs text-slate-500">Xử lý đón khách và gán biển số</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Kiểm tra ảnh GPLX của khách, chọn biển số xe thực tế để bàn giao và hoàn tất nhận trả xe an toàn.
                    </p>
                    <div className="pt-2">
                      <Link href={`/partner/bookings?storeId=${selectedBranch?.id}`}>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 rounded-xl gap-2">
                          <span>Xem Đơn Thuê & Bàn Giao</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>

                  <Card className="rounded-3xl border-2 border-slate-200 hover:border-emerald-500 bg-white p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                    <div className="flex items-center gap-3.5">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-slate-900">Sổ Quỹ & Lịch Sử Giao Dịch</h3>
                        <p className="text-xs text-slate-500">Quan sát số dư & đối soát sổ cái</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Quan sát số dư bảo lãnh và đối soát biến động dòng tiền thu cọc, hoàn tiền, khấu trừ của chi nhánh.
                    </p>
                    <div className="pt-2">
                      <Link href={`/partner/wallet?storeId=${selectedBranch?.id}`}>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl gap-2">
                          <span>Xem Sổ Cái Giao Dịch</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </div>

                {/* ── Financial & Wallet Balance for Branch Staff (Chỉ quan sát - KHÔNG nạp/rút tiền) ── */}
                <Card className="rounded-3xl border-2 border-emerald-200 bg-linear-to-r from-emerald-50/70 via-teal-50/30 to-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                        <Wallet className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                            Số Dư Ví Đối Tác (Chế Độ Quan Sát - Dành Cho Nhân Viên)
                          </span>
                          {Number(wallet?.balance || 0) < 0 && (
                            <Badge className="bg-orange-600 text-white text-[10px] animate-pulse">
                              Đang Dùng Hạn Mức Nợ
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-baseline gap-3 mt-1">
                          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                            {Number(wallet?.balance || 0).toLocaleString("vi-VN")}{" "}
                            <span className="text-sm font-bold text-slate-500">VNĐ</span>
                          </div>
                          <span className="text-xs text-slate-500">
                            Hạn mức tín dụng bảo lãnh: -{Number(wallet?.creditLimit || 500000).toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 max-w-xl">
                          {Number(wallet?.balance || 0) > 0
                            ? "✅ Số dư ví đang an toàn! Các đơn đặt xe mới của khách sẽ tự động được hệ thống phê duyệt ngay."
                            : Number(wallet?.balance || 0) > -(Number(wallet?.creditLimit || 500000))
                            ? "⚠️ Số dư ví đang âm nhưng vẫn trong hạn mức bảo lãnh. Hãy báo Chủ cửa hàng nạp thêm để tránh đơn bị hoãn."
                            : "🚨 Cảnh báo: Ví đã chạm trần nợ tối đa! Các đơn mới sẽ bị chuyển vào Hàng chờ FIFO đến khi Chủ cửa hàng nạp bù ví."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <Link href={`/partner/wallet?storeId=${selectedBranch?.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-bold text-xs h-10 px-4 rounded-xl gap-2 shadow-xs cursor-pointer"
                        >
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                          <span>Xem Sổ Cái Giao Dịch Chi Nhánh</span>
                          <ExternalLink className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>

                {/* ── Branch Analytics Dashboard & Charts (Requirement 2) ── */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Dashboard Thống Kê Hoạt Động Cơ Sở: {selectedBranch.storeName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Số liệu doanh thu, tỷ lệ khai thác đội xe và phân tích đơn thuê tính riêng cho chi nhánh này.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                        7 Ngày Gần Nhất
                      </Badge>
                    </div>
                  </div>

                  {/* Branch Financial Stat Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Tổng thu khách (Gross)</span>
                        <TrendingUp className="h-4 w-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-black text-amber-600 font-mono">
                        {branchAnalytics?.totalGross.toLocaleString("vi-VN")}{" "}
                        <span className="text-xs text-slate-500">đ</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">Doanh thu từ các đơn hoàn tất</span>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Thực nhận cơ sở (Net)</span>
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-black text-emerald-600 font-mono">
                        {branchAnalytics?.totalNet.toLocaleString("vi-VN")}{" "}
                        <span className="text-xs text-slate-500">đ</span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-semibold block">Sau khi trừ phí sàn</span>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Tỷ lệ lấp đầy xe</span>
                        <Activity className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-black text-blue-600">
                        {branchAnalytics?.occupancy}%
                      </div>
                      <span className="text-[11px] text-slate-400 block">
                        {branchAnalytics?.rentedItems}/{branchAnalytics?.totalItems} xe đang chạy trên đường
                      </span>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>Tổng đơn hoàn tất</span>
                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-2xl font-black text-purple-700">
                        {branchAnalytics?.bCompleted} <span className="text-xs text-slate-500">chuyến</span>
                      </div>
                      <span className="text-[11px] text-purple-600 font-semibold block">Khách đã trả xe an toàn</span>
                    </Card>
                  </div>

                  {/* Charts Row: Revenue AreaChart & Fleet Status PieChart */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 rounded-3xl border-slate-200 shadow-xs bg-white p-6 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div>
                          <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-amber-600" />
                            Biểu Đồ Doanh Thu 7 Ngày Qua Tại Cơ Sở
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500 mt-0.5">
                            So sánh Tổng tiền khách thanh toán (Gross) và Thực nhận chi nhánh (Net).
                          </CardDescription>
                        </div>
                      </div>

                      <div className="h-72 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={branchAnalytics?.revenueTrend || []}>
                            <defs>
                              <linearGradient id="branchGross" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                              </linearGradient>
                              <linearGradient id="branchNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                            <Tooltip
                              formatter={(value: any, name: any) => [
                                `${Number(value).toLocaleString("vi-VN")} đ`,
                                name === "grossRevenue" ? "Tổng thu khách (Gross)" : "Thực nhận cơ sở (Net)",
                              ]}
                            />
                            <Legend verticalAlign="top" height={36} />
                            <Area type="monotone" dataKey="grossRevenue" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#branchGross)" />
                            <Area type="monotone" dataKey="netRevenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#branchNet)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    {/* Fleet Status PieChart */}
                    <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-6 space-y-4">
                      <div className="pb-2 border-b">
                        <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <PieChartIcon className="h-5 w-5 text-blue-600" />
                          Tình Trạng Kho Xe Chi Nhánh
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                          {branchAnalytics?.totalItems || 0} xe vật lý thuộc chi nhánh này.
                        </CardDescription>
                      </div>

                      {(branchAnalytics?.totalItems || 0) === 0 ? (
                        <div className="h-52 w-full flex flex-col items-center justify-center text-center p-4">
                          <Bike className="h-10 w-10 text-slate-300 mb-2" />
                          <span className="text-xs font-bold text-slate-600">Chưa có xe nào ở cơ sở này</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            Hãy thêm dòng xe và biển số xe để theo dõi tình trạng kho.
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className="h-52 w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={(branchAnalytics?.fleetStatusData || []).filter((d) => d.value > 0)}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={75}
                                  paddingAngle={4}
                                  dataKey="value"
                                >
                                  {(branchAnalytics?.fleetStatusData || []).map((entry, index) => (
                                    <Cell key={`branch-cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => [`${value} xe`, "Số lượng"]} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="space-y-2 pt-2 border-t text-xs">
                            {(branchAnalytics?.fleetStatusData || []).map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-slate-600">{item.name}</span>
                                </div>
                                <span className="font-bold text-slate-900">{item.value} xe</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </Card>
                  </div>

                  {/* Second Row: Booking status breakdown & Top Performing Vehicle Models */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-6 space-y-4">
                      <div className="pb-2 border-b">
                        <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-indigo-600" />
                          Cơ Cấu Trạng Thái Đơn Thuê Chi Nhánh
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                          Phân bố các đơn đặt xe theo từng giai đoạn vận hành
                        </CardDescription>
                      </div>

                      <div className="h-60 w-full pt-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={branchAnalytics?.bookingStatusData || []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip formatter={(val: any) => [`${val} đơn`, "Số lượng"]} />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                              {(branchAnalytics?.bookingStatusData || []).map((entry, index) => (
                                <Cell key={`bar-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>

                    <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-6 space-y-4">
                      <div className="pb-2 border-b">
                        <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <Bike className="h-5 w-5 text-amber-600" />
                          Top Dòng Xe Doanh Thu Cao Nhất Tại Cơ Sở
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                          Xếp hạng các dòng xe có doanh thu cao nhất của chi nhánh này
                        </CardDescription>
                      </div>

                      {(branchAnalytics?.modelStats || []).length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                          Chưa có dòng xe nào phát sinh doanh thu tại cơ sở này
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {(branchAnalytics?.modelStats || []).slice(0, 4).map((m, idx) => (
                            <div
                              key={m.id}
                              className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100"
                            >
                              <div className="flex items-center gap-3">
                                <span className="h-6 w-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <div>
                                  <div className="font-bold text-xs text-slate-900">{m.name}</div>
                                  <div className="text-[11px] text-slate-500">
                                    {m.bookingsCount} chuyến hoàn tất • {m.itemsCount} xe sẵn có
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-black text-xs text-emerald-700">
                                  {m.revenue.toLocaleString("vi-VN")} đ
                                </div>
                                <div className="text-[10px] text-slate-400">Tổng thu</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                </div>

                {/* ── Branch Transaction Ledger for Staff (Requirement 2) ── */}
                <Card className="rounded-3xl border-slate-200 shadow-xs bg-white p-6 sm:p-7 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-emerald-600" />
                        Sổ Cái & Lịch Sử Giao Dịch Phát Sinh Tại Chi Nhánh
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Nhân viên có thể tra cứu các giao dịch đặt cọc, hoàn tiền, khấu trừ hoa hồng sàn và nạp ví đối tác.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link href={`/partner/wallet?storeId=${selectedBranch?.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 h-9 rounded-xl gap-1.5 shadow-xs cursor-pointer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>Mở Chi Tiết Sổ Quỹ Ví</span>
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Search & Date Filters */}
                  <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                    <div className="lg:col-span-5 relative">
                      <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        placeholder="Tìm theo mã đơn BK-..., nội dung chuyển tiền..."
                        value={branchTxSearch}
                        onChange={(e) => setBranchTxSearch(e.target.value)}
                        className="pl-9.5 text-xs h-9.5 rounded-xl bg-white"
                      />
                    </div>

                    <div className="lg:col-span-3">
                      <select
                        value={branchTxType}
                        onChange={(e) => setBranchTxType(e.target.value)}
                        className="w-full text-xs h-9.5 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
                      >
                        <option value="ALL">Tất cả loại giao dịch</option>
                        <option value="DEPOSIT">Nạp tiền vào ví (+)</option>
                        <option value="COMMISSION">Khấu trừ hoa hồng (-)</option>
                        <option value="REFUND">Hoàn tiền (+/-)</option>
                      </select>
                    </div>

                    <div className="lg:col-span-3 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <Input
                        type="date"
                        value={branchTxFromDate}
                        onChange={(e) => setBranchTxFromDate(e.target.value)}
                        className="text-xs h-9.5 rounded-xl bg-white"
                        title="Từ ngày"
                      />
                      <span className="text-xs text-slate-400">→</span>
                      <Input
                        type="date"
                        value={branchTxToDate}
                        onChange={(e) => setBranchTxToDate(e.target.value)}
                        className="text-xs h-9.5 rounded-xl bg-white"
                        title="Đến ngày"
                      />
                    </div>

                    <div className="lg:col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setBranchTxSearch("");
                          setBranchTxFromDate("");
                          setBranchTxToDate("");
                          setBranchTxType("ALL");
                        }}
                        className="w-full h-9.5 rounded-xl text-xs text-slate-600 hover:text-slate-900 bg-white"
                        title="Đặt lại bộ lọc"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Transactions Table */}
                  {filteredBranchHistories.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed">
                      Không tìm thấy giao dịch nào phù hợp với bộ lọc tại chi nhánh này.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/80">
                            <TableHead className="text-xs font-bold text-slate-700">Loại giao dịch</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700">Nội dung / Mã đơn</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700 text-right">Biến động</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700 text-right">Số dư ví sau GD</TableHead>
                            <TableHead className="text-xs font-bold text-slate-700 text-right">Thời gian</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredBranchHistories.slice(0, 15).map((h) => {
                            const isDeposit = h.type === 0;
                            const isCommission = h.type === 1;
                            const isRefund = h.type === 2;

                            return (
                              <TableRow key={h.id} className="hover:bg-slate-50/50">
                                <TableCell>
                                  {isDeposit && (
                                    <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[11px]">
                                      Nạp tiền ví
                                    </Badge>
                                  )}
                                  {isCommission && (
                                    <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[11px]">
                                      Hoa hồng sàn
                                    </Badge>
                                  )}
                                  {isRefund && (
                                    <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-[11px]">
                                      Hoàn cọc
                                    </Badge>
                                  )}
                                </TableCell>

                                <TableCell className="text-xs">
                                  <div className="font-semibold text-slate-800">{h.description}</div>
                                  {h.booking && (
                                    <div className="text-[11px] font-mono text-blue-600 mt-0.5">
                                      Mã đơn: {h.booking.bookingCode}
                                    </div>
                                  )}
                                </TableCell>

                                <TableCell className="text-xs text-right font-bold">
                                  {isDeposit || isRefund ? (
                                    <span className="text-emerald-600 font-mono">
                                      +{Number(h.amount).toLocaleString("vi-VN")} đ
                                    </span>
                                  ) : (
                                    <span className="text-red-600 font-mono">
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
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: NHẬP MẬT KHẨU MỞ KHÓA CHỦ CỬA HÀNG (UNLOCK)                 */}
      {/* ===================================================================== */}
      <Dialog open={isUnlockModalOpen} onOpenChange={setIsUnlockModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
          <DialogHeader className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Lock className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Xác Thực Mật Khẩu Chủ Cửa Hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Vui lòng nhập mật khẩu bảo vệ cấp 2 để mở khóa phân hệ quản trị doanh thu, ví và chi nhánh.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyPasswordSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mật khẩu Chủ Cửa Hàng *</Label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu..."
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                className="text-xs h-10 rounded-xl"
                autoFocus
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUnlockModalOpen(false)}
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
                {isVerifyingPassword ? "Đang xác thực..." : "Mở Khóa Phân Hệ"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 2: THIẾT LẬP HOẶC ĐỔI MẬT KHẨU CHỦ CỬA HÀNG                     */}
      {/* ===================================================================== */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
          <DialogHeader className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
              <KeyRound className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              {isSettingInitialPassword
                ? "Thiết Lập Mật Khẩu Chủ Cửa Hàng Lần Đầu"
                : "Đổi Mật Khẩu Chủ Cửa Hàng"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {isSettingInitialPassword
                ? "Mật khẩu này bảo vệ số dư ví, tài chính doanh thu và quyền đăng ký chi nhánh mới của bạn."
                : "Thay đổi mật khẩu cấp 2 bảo vệ khu vực Chủ Cửa Hàng."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePasswordSubmit} className="space-y-4 pt-2">
            {!isSettingInitialPassword && hasOwnerPassword && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mật khẩu hiện tại *</Label>
                <Input
                  type="password"
                  placeholder="Nhập mật khẩu hiện tại..."
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mật khẩu mới (ít nhất 4 ký tự) *</Label>
              <Input
                type="password"
                placeholder="Nhập mật khẩu mới..."
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                className="text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Xác nhận mật khẩu mới *</Label>
              <Input
                type="password"
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmPasswordInput}
                onChange={(e) => setConfirmPasswordInput(e.target.value)}
                className="text-xs h-10 rounded-xl"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingPassword}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
              >
                {isSubmittingPassword ? "Đang lưu..." : "Lưu Mật Khẩu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 3: THÊM CHI NHÁNH MỚI (GỬI ADMIN DUYỆT)                         */}
      {/* ===================================================================== */}
      <Dialog open={isAddBranchModalOpen} onOpenChange={setIsAddBranchModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-amber-600" />
              <DialogTitle className="text-lg font-black text-slate-900">
                Đăng Ký Chi Nhánh Mới
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Chi nhánh mới sẽ được tạo với trạng thái Chờ Duyệt (PENDING) và chuyển tới Ban Quản Trị Sàn kiểm duyệt trước khi hoạt động.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBranchSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên chi nhánh / cơ sở *</Label>
              <Input
                placeholder="VD: Nhà Xe Thành Đạt - Chi nhánh Cầu Giấy"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                className="text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tỉnh / Thành phố *</Label>
              <div className="border border-slate-200 rounded-xl px-3 py-1 bg-white">
                <ProvinceCombobox
                  value={newBranchProvince}
                  onChange={(val) => setNewBranchProvince(val === "all" ? "" : val)}
                  placeholder="Chọn tỉnh / thành phố..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Địa chỉ chi nhánh *</Label>
              <Input
                placeholder="VD: 123 Xuân Thủy, Phường Dịch Vọng Hậu, Cầu Giấy..."
                value={newBranchAddress}
                onChange={(e) => setNewBranchAddress(e.target.value)}
                className="text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hotline liên hệ cơ sở *</Label>
                <Input
                  placeholder="VD: 0902000002"
                  value={newBranchPhone}
                  onChange={(e) => setNewBranchPhone(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Tỷ lệ tiền cọc (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={minDepositConfig}
                  max="100"
                  value={newBranchDeposit}
                  onChange={(e) => setNewBranchDeposit(Number(e.target.value))}
                  className="text-xs h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Giờ mở cửa đón khách (HH:mm)</Label>
                <Input
                  type="time"
                  value={newBranchOpenTime}
                  onChange={(e) => setNewBranchOpenTime(e.target.value)}
                  className="text-xs h-10 rounded-xl font-bold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Giờ đóng cửa (HH:mm)</Label>
                <Input
                  type="time"
                  value={newBranchCloseTime}
                  onChange={(e) => setNewBranchCloseTime(e.target.value)}
                  className="text-xs h-10 rounded-xl font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Số tài khoản ngân hàng *</Label>
                <Input
                  placeholder="Số tài khoản..."
                  value={newBranchBankAcc}
                  onChange={(e) => setNewBranchBankAcc(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ngân hàng thụ hưởng *</Label>
                <select
                  value={newBranchBankName}
                  onChange={(e) => setNewBranchBankName(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  required
                >
                  {VIETNAMESE_BANKS.map((b) => (
                    <option key={b.code} value={b.shortName}>
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ảnh mặt tiền cửa hàng / cơ sở</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={branchImageInputRef}
                  onChange={handleBranchImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => branchImageInputRef.current?.click()}
                  disabled={isUploadingBranchImage}
                  className="text-xs rounded-xl gap-1.5"
                >
                  {isUploadingBranchImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Tải ảnh lên từ máy</span>
                </Button>
                {newBranchImage && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Đã chọn ảnh
                  </span>
                )}
              </div>
              {newBranchImage && (
                <div className="h-24 w-40 rounded-xl overflow-hidden border mt-2">
                  <img src={newBranchImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mô tả cơ sở</Label>
              <Textarea
                placeholder="Giới thiệu về vị trí thuận tiện, các dịch vụ hỗ trợ..."
                value={newBranchDesc}
                onChange={(e) => setNewBranchDesc(e.target.value)}
                className="text-xs min-h-[70px] rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddBranchModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingBranch}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
              >
                {isSubmittingBranch ? "Đang gửi hồ sơ..." : "Gửi Hồ Sơ Phê Duyệt"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 4: YÊU CẦU THAY ĐỔI THÔNG TIN CHI NHÁNH (REQUIREMENT 3)         */}
      {/* ===================================================================== */}
      <Dialog open={isUpdateRequestModalOpen} onOpenChange={setIsUpdateRequestModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-purple-600" />
              <DialogTitle className="text-lg font-black text-slate-900">
                Yêu Cầu Thay Đổi Thông Tin Chi Nhánh
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Thông tin hiện tại của cơ sở được giữ nguyên cho tới khi Ban Quản Trị Sàn kiểm duyệt và phê duyệt đề xuất này.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendUpdateRequestSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên chi nhánh mới *</Label>
              <Input
                value={updateStoreName}
                onChange={(e) => setUpdateStoreName(e.target.value)}
                className="text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tỉnh / Thành phố mới *</Label>
              <div className="border border-slate-200 rounded-xl px-3 py-1 bg-white">
                <ProvinceCombobox
                  value={updateProvince}
                  onChange={(val) => setUpdateProvince(val === "all" ? "" : val)}
                  placeholder="Chọn tỉnh / thành phố..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Địa chỉ mới *</Label>
              <Input
                value={updateAddress}
                onChange={(e) => setUpdateAddress(e.target.value)}
                className="text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hotline liên hệ mới *</Label>
                <Input
                  value={updatePhone}
                  onChange={(e) => setUpdatePhone(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">
                  Tỷ lệ tiền cọc (%) <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={minDepositConfig}
                  max="100"
                  value={updateDeposit}
                  onChange={(e) => setUpdateDeposit(Number(e.target.value))}
                  className="text-xs h-10 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Giờ mở cửa mới (HH:mm)</Label>
                <Input
                  type="time"
                  value={updateOpenTime}
                  onChange={(e) => setUpdateOpenTime(e.target.value)}
                  className="text-xs h-10 rounded-xl font-bold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Giờ đóng cửa mới (HH:mm)</Label>
                <Input
                  type="time"
                  value={updateCloseTime}
                  onChange={(e) => setUpdateCloseTime(e.target.value)}
                  className="text-xs h-10 rounded-xl font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Số tài khoản ngân hàng</Label>
                <Input
                  value={updateBankAcc}
                  onChange={(e) => setUpdateBankAcc(e.target.value)}
                  className="text-xs h-10 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ngân hàng thụ hưởng</Label>
                <select
                  value={updateBankName}
                  onChange={(e) => setUpdateBankName(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  {VIETNAMESE_BANKS.map((b) => (
                    <option key={b.code} value={b.shortName}>
                      {b.shortName} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ảnh mặt tiền mới</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  ref={updateImageInputRef}
                  onChange={handleUpdateImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateImageInputRef.current?.click()}
                  disabled={isUploadingUpdateImage}
                  className="text-xs rounded-xl gap-1.5"
                >
                  {isUploadingUpdateImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Tải ảnh mới</span>
                </Button>
                {updateImage && (
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Đã cập nhật ảnh
                  </span>
                )}
              </div>
              {updateImage && (
                <div className="h-24 w-40 rounded-xl overflow-hidden border mt-2">
                  <img src={updateImage} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quy định hoàn hủy đơn</Label>
              <Input
                value={updateCancelRule}
                onChange={(e) => setUpdateCancelRule(e.target.value)}
                placeholder="VD: Hủy trước 24h hoàn 100%..."
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mô tả cập nhật</Label>
              <Textarea
                value={updateDesc}
                onChange={(e) => setUpdateDesc(e.target.value)}
                className="text-xs min-h-[70px] rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsUpdateRequestModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingUpdateRequest}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl"
              >
                {isSubmittingUpdateRequest ? "Đang gửi đề xuất..." : "Gửi Đề Xuất Cập Nhật"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 5: NẠP VÍ VIETQR PAYOS (OWNER HQ)                              */}
      {/* ===================================================================== */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
          <DialogHeader className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <QrCode className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Nạp Tiền Vào Ví Đối Tác
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tạo mã VietQR chuyển khoản tự động để kích hoạt tài khoản và nhận đơn liên tục.
            </DialogDescription>
          </DialogHeader>

          {!depositQrInfo ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Số tiền muốn nạp (VNĐ) *</Label>
                <Input
                  type="number"
                  step="10000"
                  min="10000"
                  value={depositAmountInput}
                  onChange={(e) => setDepositAmountInput(Number(e.target.value))}
                  className="text-xs h-10 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[200000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmountInput(amt)}
                    className="p-2 text-xs font-bold rounded-xl border border-slate-200 hover:bg-amber-50 hover:border-amber-400"
                  >
                    {amt.toLocaleString("vi-VN")} đ
                  </button>
                ))}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="text-xs rounded-xl"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleGenerateDepositQr}
                  disabled={isGeneratingQr}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                >
                  {isGeneratingQr ? "Đang tạo mã..." : "Tạo Mã VietQR"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 pt-2 text-center">
              <div className="bg-slate-50 p-4 rounded-2xl border flex flex-col items-center">
                <img
                  src={depositQrInfo.qrCode}
                  alt="VietQR"
                  className="w-52 h-52 object-contain rounded-xl shadow-xs"
                />
                <p className="text-xs font-bold text-slate-800 mt-2">
                  Quét mã qua app ngân hàng bất kỳ
                </p>
                <p className="text-[11px] text-slate-500">
                  Số tiền: <strong>{depositQrInfo.depositAmount.toLocaleString("vi-VN")} đ</strong>
                </p>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    setIsDepositModalOpen(false);
                    loadAllData();
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                >
                  Đã Chuyển Khoản Xong
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================================================================== */}
      {/* MODAL 6: RÚT TIỀN VỀ NGÂN HÀNG (OWNER HQ)                            */}
      {/* ===================================================================== */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
          <DialogHeader className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <DollarSign className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-slate-900">
              Yêu Cầu Rút Tiền Về Ngân Hàng
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chuyển số dư doanh thu từ Ví đối tác về tài khoản ngân hàng chính chủ của bạn.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Số dư khả dụng:</span>
                <strong className="text-emerald-700 font-black">{balance.toLocaleString("vi-VN")} đ</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tài khoản nhận:</span>
                <span className="font-mono font-bold text-slate-800">
                  {user?.bankAccountNum || "9876543210"} ({user?.bankName || "Vietcombank"})
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Số tiền muốn rút (VNĐ) *</Label>
              <Input
                type="number"
                step="50000"
                min="50000"
                max={Math.max(50000, balance)}
                value={withdrawAmountInput}
                onChange={(e) => setWithdrawAmountInput(Number(e.target.value))}
                className="text-xs h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ghi chú rút tiền</Label>
              <Input
                placeholder="VD: Rút doanh thu tuần 1 tháng 11..."
                value={withdrawNoteInput}
                onChange={(e) => setWithdrawNoteInput(e.target.value)}
                className="text-xs h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingWithdraw}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
              >
                {isSubmittingWithdraw ? "Đang gửi yêu cầu..." : "Gửi Yêu Cầu Rút Tiền"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* MODAL: UPDATE STORE STATUS (OWNER HQ & BRANCH OPS)                  */}
      {/* =================================================================== */}
      <Dialog open={isUpdateStatusModalOpen} onOpenChange={setIsUpdateStatusModalOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Cập Nhật Trạng Thái Chi Nhánh
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Quản lý trạng thái mở cửa kinh doanh của chi nhánh{" "}
              <strong>{statusStoreTarget?.storeName || selectedBranch?.storeName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            {/* Option 1: ACTIVE */}
            <div
              onClick={() => setSelectedStatusValue(1)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                selectedStatusValue === 1
                  ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedStatusValue === 1 ? "border-emerald-600 bg-emerald-600" : "border-slate-300"
                }`}
              >
                {selectedStatusValue === 1 && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">🟢 Đang Hoạt Động (Active)</span>
                  <Badge className="bg-emerald-600 text-white text-[10px]">Hiển thị</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Chi nhánh mở cửa đón khách. Xe của chi nhánh được hiển thị công khai trên website để khách hàng tìm kiếm và đặt thuê.
                </p>
              </div>
            </div>

            {/* Option 2: PAUSED */}
            <div
              onClick={() => setSelectedStatusValue(3)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                selectedStatusValue === 3
                  ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedStatusValue === 3 ? "border-amber-600 bg-amber-600" : "border-slate-300"
                }`}
              >
                {selectedStatusValue === 3 && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">⏸️ Tạm Ngừng Hoạt Động (Paused)</span>
                  <Badge className="bg-amber-500 text-white text-[10px]">Tạm ẩn</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Tạm dừng nhận khách mới (nghỉ phép, nghỉ lễ, đóng cửa tạm thời). Khách hàng sẽ không tìm thấy chi nhánh và các dòng xe này.
                </p>
              </div>
            </div>

            {/* Option 3: MAINTENANCE */}
            <div
              onClick={() => setSelectedStatusValue(4)}
              className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                selectedStatusValue === 4
                  ? "border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                  selectedStatusValue === 4 ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                }`}
              >
                {selectedStatusValue === 4 && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-slate-900">🔧 Đang Sửa Chữa / Bảo Trì (Maintenance)</span>
                  <Badge className="bg-indigo-600 text-white text-[10px]">Bảo trì</Badge>
                </div>
                <p className="text-xs text-slate-500">
                  Cơ sở đang sửa chữa mặt bằng, bảo dưỡng thiết bị hoặc kiểm kê lại kho xe. Khách hàng sẽ không thể đặt xe trong thời gian này.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUpdateStatusModalOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={() => handleUpdateStoreStatusSubmit()}
              disabled={isSubmittingStatus}
              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-1.5"
            >
              {isSubmittingStatus ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Xác Nhận Đổi Trạng Thái</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =================================================================== */}
      {/* MODAL: CUSTOMIZE OPERATING HOURS (BRANCH OPS)                       */}
      {/* =================================================================== */}
      <Dialog open={isOperatingHoursModalOpen} onOpenChange={setIsOperatingHoursModalOpen}>
        <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-3xl p-6 bg-white space-y-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Cài Đặt Giờ Hoạt Động Chi Nhánh
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Khung giờ nhân viên trực tại cơ sở <strong>{selectedBranch?.storeName}</strong> để bàn giao xe và nhận xe hoàn trả từ khách hàng.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateOperatingHoursSubmit} className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Giờ mở cửa (Nhận xe)</Label>
                <Input
                  type="time"
                  value={branchOpenTime}
                  onChange={(e) => setBranchOpenTime(e.target.value)}
                  className="text-xs h-10 rounded-xl font-bold"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Giờ đóng cửa (Trả xe)</Label>
                <Input
                  type="time"
                  value={branchCloseTime}
                  onChange={(e) => setBranchCloseTime(e.target.value)}
                  className="text-xs h-10 rounded-xl font-bold"
                  required
                />
              </div>
            </div>

            {/* Quick presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-500">Mẫu giờ phổ biến:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "06:00 - 22:00", open: "06:00", close: "22:00" },
                  { label: "07:00 - 21:00", open: "07:00", close: "21:00" },
                  { label: "08:00 - 20:00", open: "08:00", close: "20:00" },
                  { label: "00:00 - 23:59 (24/24)", open: "00:00", close: "23:59" },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setBranchOpenTime(preset.open);
                      setBranchCloseTime(preset.close);
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                      branchOpenTime === preset.open && branchCloseTime === preset.close
                        ? "bg-purple-100 border-purple-300 text-purple-800 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOperatingHoursModalOpen(false)}
                className="text-xs font-semibold rounded-xl"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingOperatingHours}
                className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl gap-1.5 cursor-pointer"
              >
                {isSubmittingOperatingHours ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Lưu Giờ Hoạt Động</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PartnerDashboardPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen py-16 text-center text-xs text-slate-500">Đang tải bảng điều khiển đối tác...</div>}>
      <PartnerDashboardContent />
    </React.Suspense>
  );
}
