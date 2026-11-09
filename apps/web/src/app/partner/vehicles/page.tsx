"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, VehicleModel, VehicleItem, Store, INITIAL_VEHICLE_MODELS } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Bike,
  Plus,
  Edit,
  Trash2,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Car,
  Tag,
  Camera,
  Loader2,
  RefreshCw,
  Upload,
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileText,
  X,
  Store as StoreIcon,
  ArrowLeft,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

function PartnerVehiclesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryStoreId = searchParams.get("storeId");

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  const [models, setModels] = useState<VehicleModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<VehicleModel | null>(null);
  const [items, setItems] = useState<VehicleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Modal Create Model ───────────────────────────────────────────────────────
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [modelName, setModelName] = useState("");
  const [modelBrand, setModelBrand] = useState("Honda");
  const [modelType, setModelType] = useState<number>(1);
  const [modelPrice, setModelPrice] = useState<number>(150000);
  const [modelSpecs, setModelSpecs] = useState("");
  const [modelImage, setModelImage] = useState("");
  const [isUploadingModelImage, setIsUploadingModelImage] = useState(false);
  const modelImageInputRef = useRef<HTMLInputElement>(null);

  // ── Modal Edit Model ─────────────────────────────────────────────────────────
  const [isEditModelModalOpen, setIsEditModelModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null);
  const [editModelName, setEditModelName] = useState("");
  const [editModelBrand, setEditModelBrand] = useState("Honda");
  const [editModelType, setEditModelType] = useState<number>(1);
  const [editModelPrice, setEditModelPrice] = useState<number>(150000);
  const [editModelSpecs, setEditModelSpecs] = useState("");
  const [editModelImage, setEditModelImage] = useState("");
  const [isUploadingEditModelImage, setIsUploadingEditModelImage] = useState(false);
  const editModelImageInputRef = useRef<HTMLInputElement>(null);

  // ── Modal Add Item (Biển số) ─────────────────────────────────────────────────
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [licensePlate, setLicensePlate] = useState("");
  const [itemColor, setItemColor] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");

  // ── Modal Edit Item (Biển số) ────────────────────────────────────────────────
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VehicleItem | null>(null);
  const [editLicensePlate, setEditLicensePlate] = useState("");
  const [editItemColor, setEditItemColor] = useState("");
  const [editChassisNumber, setEditChassisNumber] = useState("");
  const [editItemStatus, setEditItemStatus] = useState<number>(0);

  // ── Bulk import from CSV/Excel ───────────────────────────────────────────────
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [parsedVehicles, setParsedVehicles] = useState<
    Array<{
      licensePlate: string;
      color: string;
      chassisNumber: string;
      isValid: boolean;
      error?: string;
    }>
  >([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load Initial Stores & Models ───────────────────────────────────────────
  const loadData = async () => {
    setIsLoading(true);
    try {
      const storesData = await api.partner.getStores();
      setStores(storesData || []);

      const approved = (storesData || []).filter((s) => s.status === 1);
      if (approved.length === 0) {
        toast.warning("Hồ sơ cửa hàng chưa được duyệt hoặc chưa đăng ký cơ sở nào.");
      }

      // Pick selected store from query param or localStorage or first approved
      let currentStore: Store | null = null;
      const targetStoreId = queryStoreId
        ? Number(queryStoreId)
        : typeof window !== "undefined" && localStorage.getItem("active_partner_store_id")
        ? Number(localStorage.getItem("active_partner_store_id"))
        : null;

      if (targetStoreId) {
        currentStore = (storesData || []).find((s) => s.id === targetStoreId) || null;
      }
      if (!currentStore && approved.length > 0) {
        currentStore = approved[0];
      } else if (!currentStore && storesData && storesData.length > 0) {
        currentStore = storesData[0];
      }
      setSelectedStore(currentStore);
      if (currentStore && typeof window !== "undefined") {
        localStorage.setItem("active_partner_store_id", String(currentStore.id));
        localStorage.setItem("active_partner_store_name", currentStore.storeName);
      }

      // Load models strictly of currentStore
      if (currentStore) {
        await fetchModelsForStore(currentStore.id);
      } else {
        setModels([]);
        setSelectedModel(null);
        setItems([]);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchModelsForStore = async (storeId: number) => {
    try {
      const storeModels = await api.partner.getModels(storeId);
      setModels(storeModels || []);
      if (storeModels && storeModels.length > 0) {
        handleSelectModel(storeModels[0]);
      } else {
        setSelectedModel(null);
        setItems([]);
      }
    } catch {
      setModels([]);
      setSelectedModel(null);
      setItems([]);
    }
  };

  useEffect(() => {
    loadData();
  }, [queryStoreId]);

  const handleSelectStore = async (store: Store) => {
    setSelectedStore(store);
    if (typeof window !== "undefined") {
      localStorage.setItem("active_partner_store_id", String(store.id));
      localStorage.setItem("active_partner_store_name", store.storeName);
    }
    router.replace(`/partner/vehicles?storeId=${store.id}`);
    await fetchModelsForStore(store.id);
  };

  const handleSelectModel = async (m: VehicleModel) => {
    setSelectedModel(m);
    try {
      const modelItems = await api.partner.getItems(m.id);
      setItems(modelItems.length > 0 ? modelItems : m.vehicleItems || []);
    } catch {
      setItems(m.vehicleItems || []);
    }
  };

  // ── Image Upload Helper ────────────────────────────────────────────────────
  const uploadImageFile = async (file: File): Promise<string> => {
    if (!file.type.startsWith("image/")) {
      throw new Error("Vui lòng chỉ tải lên tệp định dạng hình ảnh!");
    }
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "model_vehicle");
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Tải ảnh thất bại");
    return data.url;
  };

  const handleModelImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingModelImage(true);
    try {
      const url = await uploadImageFile(file);
      setModelImage(url);
      toast.success("Tải ảnh dòng xe thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh!");
    } finally {
      setIsUploadingModelImage(false);
      e.target.value = "";
    }
  };

  const handleEditModelImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingEditModelImage(true);
    try {
      const url = await uploadImageFile(file);
      setEditModelImage(url);
      toast.success("Tải ảnh mới dòng xe thành công!");
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh!");
    } finally {
      setIsUploadingEditModelImage(false);
      e.target.value = "";
    }
  };

  // ── VehicleModel CRUD Handlers ─────────────────────────────────────────────
  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName || !modelBrand) return;

    if (!selectedStore) {
      toast.error("Vui lòng chọn cơ sở chi nhánh trước khi thêm dòng xe!");
      return;
    }
    const storeId = selectedStore.id;

    try {
      const created = await api.partner.createModel({
        storeId,
        name: modelName,
        brand: modelBrand,
        type: modelType,
        rentPrice: modelPrice,
        specifications: modelSpecs,
        images: modelImage ? [modelImage] : undefined,
      });

      const updatedModels = [
        ...models,
        {
          ...created,
          storeId,
          vehicleItems: [],
          availableCount: 0,
        },
      ];
      setModels(updatedModels);
      setSelectedModel(updatedModels[updatedModels.length - 1]);
      setItems([]);
      setIsModelModalOpen(false);

      // Reset form
      setModelName("");
      setModelBrand("Honda");
      setModelPrice(150000);
      setModelSpecs("");
      setModelImage("");

      toast.success("Đã thêm dòng xe mới thành công!");
    } catch {
      toast.error("Không thể thêm dòng xe.");
    }
  };

  const handleOpenEditModel = (m: VehicleModel) => {
    setEditingModel(m);
    setEditModelName(m.name);
    setEditModelBrand(m.brand);
    setEditModelType(m.type);
    setEditModelPrice(Number(m.rentPrice));
    setEditModelSpecs(m.specifications || "");
    setEditModelImage(m.images?.[0] || "");
    setIsEditModelModalOpen(true);
  };

  const handleUpdateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModel || !editModelName || !editModelBrand) return;

    try {
      const updated = await api.partner.updateModel(editingModel.id, {
        name: editModelName,
        brand: editModelBrand,
        type: editModelType,
        rentPrice: editModelPrice,
        specifications: editModelSpecs,
        images: editModelImage ? [editModelImage] : undefined,
      });

      setModels((prev) =>
        prev.map((m) =>
          m.id === editingModel.id
            ? { ...m, ...updated, images: editModelImage ? [editModelImage] : m.images }
            : m
        )
      );

      if (selectedModel?.id === editingModel.id) {
        setSelectedModel((prev) =>
          prev ? { ...prev, ...updated, images: editModelImage ? [editModelImage] : prev.images } : null
        );
      }

      setIsEditModelModalOpen(false);
      toast.success(`Đã cập nhật dòng xe "${editModelName}" thành công!`);
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật dòng xe.");
    }
  };

  const handleDeleteModel = async (m: VehicleModel) => {
    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa dòng xe "${m.name}"?\nToàn bộ danh sách biển số xe thuộc dòng xe này sẽ bị xóa. Thao tác này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await api.partner.deleteModel(m.id);
      const remaining = models.filter((item) => item.id !== m.id);
      setModels(remaining);

      if (selectedModel?.id === m.id) {
        if (remaining.length > 0) {
          handleSelectModel(remaining[0]);
        } else {
          setSelectedModel(null);
          setItems([]);
        }
      }
      toast.success(`Đã xóa dòng xe "${m.name}" thành công!`);
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa dòng xe. Vui lòng kiểm tra lại đơn thuê.");
    }
  };

  // ── VehicleItem CRUD Handlers ──────────────────────────────────────────────
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licensePlate || !selectedModel) return;

    try {
      const added = await api.partner.addItem(selectedModel.id, {
        licensePlate: licensePlate.toUpperCase().trim(),
        color: itemColor.trim(),
        chassisNumber: chassisNumber.trim(),
      });

      const updated = [...items, added];
      setItems(updated);
      setIsItemModalOpen(false);
      setLicensePlate("");
      setItemColor("");
      setChassisNumber("");
      toast.success(`Đã thêm xe biển số ${added.licensePlate} vào kho!`);
    } catch {
      toast.error("Không thể thêm biển số xe. Có thể biển số đã tồn tại.");
    }
  };

  const handleOpenEditItem = (it: VehicleItem) => {
    setEditingItem(it);
    setEditLicensePlate(it.licensePlate);
    setEditItemColor(it.color || "");
    setEditChassisNumber(it.chassisNumber || "");
    setEditItemStatus(it.status);
    setIsEditItemModalOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editLicensePlate) return;

    try {
      const updated = await api.partner.updateItem(editingItem.id, {
        licensePlate: editLicensePlate.toUpperCase().trim(),
        color: editItemColor.trim(),
        chassisNumber: editChassisNumber.trim(),
        status: editItemStatus,
      });

      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i))
      );
      setIsEditItemModalOpen(false);
      toast.success(`Đã cập nhật xe biển số ${editLicensePlate.toUpperCase()} thành công!`);
    } catch (err: any) {
      toast.error(err.message || "Không thể cập nhật xe.");
    }
  };

  const handleUpdateItemStatus = async (itemId: number, newStatus: number) => {
    try {
      await api.partner.updateItemStatus(itemId, newStatus);
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, status: newStatus } : i))
      );
      toast.success("Đã cập nhật trạng thái xe.");
    } catch {
      toast.error("Không thể cập nhật trạng thái.");
    }
  };

  const handleDeleteItem = async (itemId: number, plate: string) => {
    if (!confirm(`Bạn có chắc muốn xóa xe biển số "${plate}" khỏi kho?`)) return;
    try {
      await api.partner.deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success(`Đã xóa xe biển số ${plate} khỏi danh sách.`);
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa xe.");
    }
  };

  // ── Bulk Import Handlers ───────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!rawRows || rawRows.length === 0) {
        toast.error("File tải lên không có dữ liệu!");
        return;
      }

      let startIndex = 0;
      let plateCol = 0;
      let colorCol = 1;
      let chassisCol = 2;

      const headerRow = rawRows[0];
      if (Array.isArray(headerRow)) {
        headerRow.forEach((cell: any, idx: number) => {
          if (!cell) return;
          const str = String(cell).toLowerCase().trim();
          if (str.includes("biển") || str.includes("bien") || str.includes("plate")) {
            plateCol = idx;
            startIndex = 1;
          } else if (str.includes("màu") || str.includes("mau") || str.includes("color")) {
            colorCol = idx;
            startIndex = 1;
          } else if (str.includes("khung") || str.includes("chassis")) {
            chassisCol = idx;
            startIndex = 1;
          }
        });
      }

      const results: Array<{
        licensePlate: string;
        color: string;
        chassisNumber: string;
        isValid: boolean;
        error?: string;
      }> = [];

      for (let i = startIndex; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (!row || !Array.isArray(row) || row.every((c) => !c)) continue;

        const plate = row[plateCol] ? String(row[plateCol]).trim().toUpperCase() : "";
        const color = row[colorCol] ? String(row[colorCol]).trim() : "Tiêu chuẩn";
        const chassis = row[chassisCol] ? String(row[chassisCol]).trim() : "";

        if (!plate) {
          results.push({
            licensePlate: "Trống",
            color,
            chassisNumber: chassis,
            isValid: false,
            error: "Thiếu biển số xe",
          });
        } else {
          results.push({
            licensePlate: plate,
            color,
            chassisNumber: chassis,
            isValid: true,
          });
        }
      }

      if (results.length === 0) {
        toast.error("Không tìm thấy dòng xe nào trong file.");
        return;
      }

      setParsedVehicles(results);
      setImportFileName(file.name);
      setIsImportModalOpen(true);
      toast.success(`Đã đọc ${file.name}: tìm thấy ${results.filter((r) => r.isValid).length} xe hợp lệ!`);
    } catch {
      toast.error("Không thể đọc file. Vui lòng chọn tệp định dạng .csv hoặc .xlsx / .xls!");
    } finally {
      e.target.value = "";
    }
  };

  const handleConfirmBulkImport = async () => {
    if (!selectedModel) return;
    const validItems = parsedVehicles.filter((v) => v.isValid);
    if (validItems.length === 0) {
      toast.error("Không có xe hợp lệ để nhập vào kho!");
      return;
    }

    setIsImporting(true);
    try {
      const res = await api.partner.addBulkItems(
        selectedModel.id,
        validItems.map((v) => ({
          licensePlate: v.licensePlate,
          color: v.color,
          chassisNumber: v.chassisNumber || undefined,
        }))
      );

      const newItems = res.items || [];
      const updated = [...items, ...newItems];
      setItems(updated);

      setModels((prev) =>
        prev.map((m) =>
          m.id === selectedModel.id
            ? {
                ...m,
                vehicleItems: updated,
                availableCount: (m.availableCount || 0) + newItems.length,
                totalActiveItems: (m.totalActiveItems || 0) + newItems.length,
              }
            : m
        )
      );

      toast.success(
        res.message || `Đã nhập thành công ${newItems.length} xe vào dòng ${selectedModel.name}!`
      );
      setIsImportModalOpen(false);
      setParsedVehicles([]);
      setImportFileName("");
    } catch (err: any) {
      toast.error(err.message || "Lỗi khi nhập xe vào kho.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSampleFile = () => {
    const wsData = [
      ["Biển số xe", "Màu sắc", "Số khung"],
      ["29B1-123.45", "Đỏ Đen", "HONDA-AF68-001234"],
      ["29B1-123.46", "Xanh Dương", "HONDA-AF68-001235"],
      ["29B1-123.47", "Trắng Bạc", "HONDA-AF68-001236"],
      ["29B1-123.48", "Đen Nhám", "HONDA-AF68-001237"],
      ["29B1-123.49", "Xám Xi Măng", "HONDA-AF68-001238"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachXe");
    XLSX.writeFile(
      wb,
      `Mau_Danh_Sach_Xe_${selectedModel?.name?.replace(/\s+/g, "_") || "Vehicle"}.xlsx`
    );
    toast.success("Đã tải xuống file mẫu Excel!");
  };

  const statusMap: Record<number, { label: string; color: string; icon: any }> = {
    0: { label: "Sẵn sàng (Available)", color: "bg-emerald-50 text-emerald-800 border-emerald-200", icon: CheckCircle2 },
    1: { label: "Đã giữ chỗ (Reserved)", color: "bg-blue-50 text-blue-800 border-blue-200", icon: Tag },
    2: { label: "Đang cho thuê (Rented)", color: "bg-amber-50 text-amber-800 border-amber-200", icon: Car },
    3: { label: "Bảo dưỡng (Maintenance)", color: "bg-rose-50 text-rose-800 border-rose-200", icon: Wrench },
  };

  return (
    <div className="py-8 bg-slate-50/60 min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation Breadcrumb & Branch Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Link href="/partner?mode=branch">
                <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-600 h-8 px-2 rounded-xl gap-1 hover:bg-slate-200/70 -ml-2">
                  <ArrowLeft className="h-4 w-4" /> Về Quản Lý Chi Nhánh
                </Button>
              </Link>
              <span className="text-slate-300">|</span>
              <Badge className="bg-blue-600 text-white text-[10px] uppercase font-bold">
                🛵 Quản Trị Kho Xe & Biển Số
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Dòng Xe & Biển Số Vật Lý
            </h1>
            <p className="text-xs text-slate-500">
              Chủ cửa hàng có thể thêm, chỉnh sửa thông tin hoặc xóa dòng xe và từng biển số xe cụ thể.
            </p>
          </div>

          {/* Branch Selector Dropdown */}
          {stores.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-xs">
              <StoreIcon className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 block text-[10px] font-medium">Chi nhánh đang quản lý:</span>
                <select
                  value={selectedStore?.id || ""}
                  onChange={(e) => {
                    const found = stores.find((s) => s.id === Number(e.target.value));
                    if (found) handleSelectStore(found);
                  }}
                  className="font-bold text-slate-900 bg-transparent outline-none cursor-pointer pr-2"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.storeName} {s.status === 1 ? "(Đã duyệt)" : "(Chờ duyệt)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Danh sách dòng xe tại {selectedStore?.storeName || "Chi Nhánh"}
            </h2>
            <p className="text-xs text-slate-500">
              Hiện có {models.length} dòng xe đang hoạt động tại cơ sở này.
            </p>
          </div>

          <Button
            onClick={() => setIsModelModalOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" /> Thêm Dòng Xe Mới
          </Button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Col 1: Models Selection List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" /> Dòng xe ({models.length})
              </span>
            </h3>

            {models.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-2 p-6 text-center text-xs text-slate-500">
                Chưa có dòng xe nào tại chi nhánh này. Hãy nhấn &quot;Thêm Dòng Xe Mới&quot; ở trên để bắt đầu!
              </Card>
            ) : (
              <div className="space-y-2.5">
                {models.map((m) => {
                  const isSelected = selectedModel?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectModel(m)}
                      className={`group p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-600 bg-white shadow-md ring-2 ring-blue-600/10"
                          : "border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border">
                            <img
                              src={m.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=300&q=80"}
                              alt={m.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{m.name}</div>
                            <div className="text-[11px] text-blue-600 font-semibold">
                              {Number(m.rentPrice).toLocaleString("vi-VN")} đ/ngày
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {m.vehicleItems?.length || 0} biển số xe
                            </div>
                          </div>
                        </div>

                        {/* Quick action buttons for model */}
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModel(m);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa thông tin dòng xe"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModel(m);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa dòng xe này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Col 2 & 3: Physical Vehicle Items (License Plates) of Selected Model */}
          <div className="lg:col-span-2 space-y-4">
            {selectedModel ? (
              <Card className="rounded-3xl border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="p-6 pb-4 border-b bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs bg-white text-blue-700">
                        {selectedModel.brand} • {selectedModel.type === 1 ? "Tay ga" : selectedModel.type === 0 ? "Xe số" : selectedModel.type === 2 ? "Côn tay" : "Điện/Ô tô"}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModel(selectedModel)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                      >
                        <Edit className="h-3 w-3" /> Chỉnh sửa dòng xe
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteModel(selectedModel)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer ml-1"
                      >
                        <Trash2 className="h-3 w-3" /> Xóa dòng xe
                      </button>
                    </div>

                    <CardTitle className="text-lg font-black text-slate-900">
                      Kho biển số của {selectedModel.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tổng số xe thực tế trong kho: <strong>{items.length} xe</strong> (Dùng để giao nhận cho khách)
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-bold rounded-xl gap-1.5"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Nhập từ Excel/CSV
                    </Button>

                    <Button
                      onClick={() => setIsItemModalOpen(true)}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm 1 Biển Số
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {items.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Bike className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold">Chưa có biển số nào thuộc dòng xe này</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bấm &quot;Thêm 1 Biển Số&quot; hoặc &quot;Nhập từ Excel/CSV&quot; để khai báo từng chiếc xe thực tế.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map((item) => {
                        const st = statusMap[item.status] || statusMap[0];

                        return (
                          <div
                            key={item.id}
                            className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold font-mono text-xs">
                                VN
                              </div>
                              <div>
                                <div className="font-mono font-black text-sm text-slate-900">
                                  {item.licensePlate}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Màu: <strong className="text-slate-700">{item.color || "Tiêu chuẩn"}</strong>
                                  {item.chassisNumber && ` • Khung: ${item.chassisNumber}`}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Status Selector Dropdown */}
                              <select
                                value={item.status}
                                onChange={(e) =>
                                  handleUpdateItemStatus(item.id, Number(e.target.value))
                                }
                                className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border ${st.color} outline-none cursor-pointer`}
                              >
                                <option value={0}>0: Sẵn sàng (Available)</option>
                                <option value={1}>1: Đang giữ (Reserved)</option>
                                <option value={2}>2: Đang cho thuê (Rented)</option>
                                <option value={3}>3: Bảo dưỡng (Maintenance)</option>
                              </select>

                              {/* Edit Item Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                                title="Sửa thông tin xe này"
                              >
                                <Edit className="h-4 w-4" />
                              </button>

                              {/* Delete Item Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.id, item.licensePlate)}
                                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                                title="Xóa biển số này"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-3xl border-slate-200 p-12 text-center text-xs text-slate-500">
                Vui lòng chọn hoặc thêm một dòng xe để quản lý kho biển số.
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal Add Model ─────────────────────────────────────────────────── */}
      <Dialog open={isModelModalOpen} onOpenChange={setIsModelModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Thêm Dòng Xe Mới (VehicleModel)</DialogTitle>
            <DialogDescription className="text-xs">
              Khai báo thông tin chung để khách hàng tìm kiếm và đặt chỗ tại {selectedStore?.storeName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateModel} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên dòng xe *</Label>
              <Input
                placeholder="VD: Honda SH Mode 125cc..."
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hãng xe *</Label>
                <Input
                  placeholder="Honda, Yamaha..."
                  value={modelBrand}
                  onChange={(e) => setModelBrand(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phân loại xe *</Label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(Number(e.target.value))}
                  className="w-full h-10 px-3 text-xs rounded-lg border bg-background"
                >
                  <option value={1}>1: Xe tay ga</option>
                  <option value={0}>0: Xe số phổ thông</option>
                  <option value={2}>2: Xe côn tay / Phượt</option>
                  <option value={3}>3: Xe điện / Ô tô</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Giá thuê theo ngày (VNĐ) *</Label>
              <Input
                type="number"
                step="10000"
                value={modelPrice}
                onChange={(e) => setModelPrice(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hình ảnh dòng xe (Chụp hoặc Tải lên)</Label>
              <input
                type="file"
                accept="image/*"
                ref={modelImageInputRef}
                onChange={handleModelImageUpload}
                className="hidden"
              />

              {isUploadingModelImage ? (
                <div className="h-32 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col items-center justify-center gap-2 text-blue-700">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs font-semibold">Đang tải ảnh...</span>
                </div>
              ) : modelImage ? (
                <div className="relative h-32 w-full rounded-xl overflow-hidden border bg-slate-100 group shadow-xs">
                  <img src={modelImage} alt="Vehicle model" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => modelImageInputRef.current?.click()}
                      className="bg-white text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelImage("")}
                      className="bg-red-600 text-white p-1 rounded-lg text-xs shadow-xs cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => modelImageInputRef.current?.click()}
                  className="h-28 w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Chụp ảnh hoặc Chọn tệp ảnh</span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WEBP (Tối đa 10MB)</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Thông số kỹ thuật</Label>
              <Textarea
                placeholder="Động cơ, phanh, khóa thông minh..."
                value={modelSpecs}
                onChange={(e) => setModelSpecs(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModelModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700">
                Lưu Dòng Xe
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Edit Model ─────────────────────────────────────────────────── */}
      <Dialog open={isEditModelModalOpen} onOpenChange={setIsEditModelModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Chỉnh Sửa Dòng Xe (VehicleModel)</DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật thông tin dòng xe, giá thuê hoặc hình ảnh đại diện.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateModel} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tên dòng xe *</Label>
              <Input
                placeholder="VD: Honda SH Mode 125cc..."
                value={editModelName}
                onChange={(e) => setEditModelName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Hãng xe *</Label>
                <Input
                  placeholder="Honda, Yamaha..."
                  value={editModelBrand}
                  onChange={(e) => setEditModelBrand(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phân loại xe *</Label>
                <select
                  value={editModelType}
                  onChange={(e) => setEditModelType(Number(e.target.value))}
                  className="w-full h-10 px-3 text-xs rounded-lg border bg-background"
                >
                  <option value={1}>1: Xe tay ga</option>
                  <option value={0}>0: Xe số phổ thông</option>
                  <option value={2}>2: Xe côn tay / Phượt</option>
                  <option value={3}>3: Xe điện / Ô tô</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Giá thuê theo ngày (VNĐ) *</Label>
              <Input
                type="number"
                step="10000"
                value={editModelPrice}
                onChange={(e) => setEditModelPrice(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hình ảnh dòng xe</Label>
              <input
                type="file"
                accept="image/*"
                ref={editModelImageInputRef}
                onChange={handleEditModelImageUpload}
                className="hidden"
              />

              {isUploadingEditModelImage ? (
                <div className="h-32 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 flex flex-col items-center justify-center gap-2 text-blue-700">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs font-semibold">Đang tải ảnh...</span>
                </div>
              ) : editModelImage ? (
                <div className="relative h-32 w-full rounded-xl overflow-hidden border bg-slate-100 group shadow-xs">
                  <img src={editModelImage} alt="Vehicle model" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => editModelImageInputRef.current?.click()}
                      className="bg-white text-slate-800 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <RefreshCw className="h-3 w-3" /> Đổi ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditModelImage("")}
                      className="bg-red-600 text-white p-1 rounded-lg text-xs shadow-xs cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => editModelImageInputRef.current?.click()}
                  className="h-28 w-full rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/60 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Chụp ảnh hoặc Chọn tệp ảnh mới</span>
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Thông số kỹ thuật</Label>
              <Textarea
                placeholder="Động cơ, phanh, khóa thông minh..."
                value={editModelSpecs}
                onChange={(e) => setEditModelSpecs(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModelModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold text-xs rounded-xl">
                Cập Nhật Dòng Xe
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Add Vehicle Item (Plate) ──────────────────────────────────── */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Thêm Biển Số Xe Thực Tế</DialogTitle>
            <DialogDescription className="text-xs">
              Thêm 1 chiếc xe ngoài đời thực vào dòng <strong>{selectedModel?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddItem} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Biển số xe (VD: 29E2-999.88) *</Label>
              <Input
                placeholder="43B1-123.45..."
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required
                className="font-mono uppercase font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Màu sắc thực tế</Label>
              <Input
                placeholder="Đỏ Đen, Trắng Ngọc Trai, Xanh GP..."
                value={itemColor}
                onChange={(e) => setItemColor(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Số khung / Số máy (tùy chọn)</Label>
              <Input
                placeholder="Khung xe..."
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsItemModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl">
                Thêm Vào Kho
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal Edit Vehicle Item (Plate & Status) ─────────────────────────── */}
      <Dialog open={isEditItemModalOpen} onOpenChange={setIsEditItemModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Chỉnh Sửa Xe (Biển Số Vật Lý)</DialogTitle>
            <DialogDescription className="text-xs">
              Cập nhật biển số, màu sơn, số khung và trạng thái vận hành của xe.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateItem} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Biển số xe *</Label>
              <Input
                placeholder="43B1-123.45..."
                value={editLicensePlate}
                onChange={(e) => setEditLicensePlate(e.target.value)}
                required
                className="font-mono uppercase font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Màu sắc</Label>
                <Input
                  placeholder="Đỏ, Trắng, Đen..."
                  value={editItemColor}
                  onChange={(e) => setEditItemColor(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Trạng thái xe *</Label>
                <select
                  value={editItemStatus}
                  onChange={(e) => setEditItemStatus(Number(e.target.value))}
                  className="w-full h-10 px-3 text-xs rounded-lg border bg-background font-semibold"
                >
                  <option value={0}>0: Sẵn sàng (Available)</option>
                  <option value={1}>1: Đã giữ chỗ (Reserved)</option>
                  <option value={2}>2: Đang cho thuê (Rented)</option>
                  <option value={3}>3: Bảo dưỡng (Maintenance)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Số khung / Số máy</Label>
              <Input
                placeholder="Số khung..."
                value={editChassisNumber}
                onChange={(e) => setEditChassisNumber(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditItemModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl">
                Lưu Thay Đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Import Preview Modal ─────────────────────────────────────────── */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-8 space-y-5">
          <DialogHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900">
                    Nhập Hàng Loạt Xe Từ File (CSV / Excel)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-0.5">
                    Thêm nhiều xe vào dòng <strong>{selectedModel?.name}</strong> từ file bảng tính.
                  </DialogDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadSampleFile}
                className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50 gap-1.5 h-8 rounded-xl font-bold shrink-0"
              >
                <Download className="h-3.5 w-3.5" /> Tải File Mẫu Excel
              </Button>
            </div>
          </DialogHeader>

          {/* Stats Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-700">{importFileName || "Tệp đã chọn"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                {parsedVehicles.filter((v) => v.isValid).length} xe hợp lệ
              </Badge>
              {parsedVehicles.some((v) => !v.isValid) && (
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-xs font-bold">
                  {parsedVehicles.filter((v) => !v.isValid).length} lỗi
                </Badge>
              )}
            </div>
          </div>

          {/* Preview Table */}
          <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/80 text-slate-700 font-bold sticky top-0 border-b">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Biển số xe</th>
                  <th className="p-3">Màu sắc</th>
                  <th className="p-3">Số khung</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedVehicles.map((row, idx) => (
                  <tr key={idx} className={row.isValid ? "hover:bg-slate-50" : "bg-rose-50/50"}>
                    <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-slate-900">{row.licensePlate}</td>
                    <td className="p-3 text-slate-700">{row.color}</td>
                    <td className="p-3 font-mono text-slate-500">{row.chassisNumber || "—"}</td>
                    <td className="p-3 text-center">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" /> Hợp lệ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          <AlertCircle className="h-3 w-3" /> {row.error || "Không hợp lệ"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* File Upload Trigger in Modal */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Muốn chọn file khác?{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 font-bold hover:underline"
              >
                Tải lên file khác
              </button>
            </span>
            <span className="text-[11px]">Hỗ trợ định dạng: .xlsx, .xls, .csv</span>
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isImporting || parsedVehicles.filter((v) => v.isValid).length === 0}
              onClick={handleConfirmBulkImport}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 px-5"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Đang thêm xe...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Xác Nhận Thêm{" "}
                  {parsedVehicles.filter((v) => v.isValid).length} Xe Vào Kho
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PartnerVehiclesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen py-16 text-center text-xs text-slate-500">Đang tải quản lý xe...</div>}>
      <PartnerVehiclesContent />
    </Suspense>
  );
}
