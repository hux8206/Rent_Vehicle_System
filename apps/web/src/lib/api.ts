// API Client & Data Provider for VehicleRent Platform

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const API_BASE_URL = RAW_BASE_URL.endsWith("/api")
  ? RAW_BASE_URL
  : `${RAW_BASE_URL.replace(/\/+$/, "")}/api`;

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: number; // 0: Admin, 1: Partner, 2: Customer
  status: boolean;
  bankAccountNum?: string;
  bankName?: string;
  createdAt?: string;
  partnerWallet?: {
    balance: number | string;
    creditLimit?: number | string;
  };
  _count?: {
    stores?: number;
    bookings?: number;
    reviews?: number;
  };
}

export interface UserDetail extends User {
  hasOwnerPassword?: boolean;
  stores?: Array<
    Store & {
      _count?: { vehicleModels: number; bookings: number };
      vehicleModels?: VehicleModel[];
      bookings?: Booking[];
    }
  >;
  partnerWallet?: PartnerWallet & {
    histories?: WalletHistory[];
  };
  bookings?: Array<
    Booking & {
      payments?: any[];
    }
  >;
  reviews?: Array<
    Review & {
      booking?: { id: number; bookingCode: string };
    }
  >;
  storeUpdateRequests?: StoreUpdateRequest[];
}

export interface Store {
  id: number;
  partnerId: number;
  storeName: string;
  province?: string;
  address: string;
  phoneContact: string;
  description?: string;
  storeImage?: string;
  openTime?: string;
  closeTime?: string;
  status: number; // 0: PENDING, 1: ACTIVE, 2: REJECTED
  rejectReason?: string;
  rentalPolicy?: RentalPolicy;
  partner?: Partial<User>;
  vehicleModels?: VehicleModel[];
  avgRating?: number;
  reviewCount?: number;
  reviews?: Review[];
  _count?: {
    vehicleModels: number;
  };
}

export interface RentalPolicy {
  id: number;
  storeId: number;
  depositPercent: number | string;
  cancelRule?: string;
  refundCondition?: string;
}

export interface StoreUpdateRequest {
  id: number;
  storeId: number;
  partnerId: number;
  storeName: string;
  province?: string;
  address: string;
  phoneContact: string;
  description?: string;
  storeImage?: string;
  depositPercent: number | string;
  cancelRule?: string;
  bankAccountNum?: string;
  bankName?: string;
  openTime?: string;
  closeTime?: string;
  status: number; // 0: PENDING, 1: APPROVED, 2: REJECTED
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  store?: Partial<Store>;
  partner?: Partial<User>;
}

export interface VehicleModel {
  id: number;
  storeId: number;
  name: string;
  brand: string;
  type: number; // 0: Xe so, 1: Tay ga, 2: Con tay, 3: O to/Xe dien
  rentPrice: number | string;
  specifications?: string;
  images?: string[];
  store?: Partial<Store>;
  totalActiveItems?: number;
  busyCount?: number;
  availableCount?: number;
  vehicleItems?: VehicleItem[];
  avgRating?: number;
  reviewCount?: number;
  reviews?: Review[];
}

export interface VehicleItem {
  id: number;
  modelId: number;
  licensePlate: string;
  color?: string;
  chassisNumber?: string;
  status: number; // 0: Available, 1: Reserved, 2: Rented, 3: Maintenance
}

export interface Booking {
  id: number;
  bookingCode: string;
  customerId: number;
  storeId: number;
  startTime: string;
  endTime: string;
  pickupType: number; // 0: AtStore, 1: Delivery
  deliveryAddress?: string;
  dayRent: number | string;
  rentAmount: number | string;
  depositAmount: number | string;
  commissionAmount: number | string;
  holdExpiresAt?: string;
  status: number; // 0: PendingPayment, 1: Confirmed, 2: WaitingQueue, 3: ActiveRental, 4: Completed, 5: Cancelled
  createdAt: string;
  store?: Partial<Store>;
  customer?: Partial<User>;
  bookingDetails?: Array<{
    id: number;
    modelId: number;
    vehicleItemId?: number;
    quantity: number;
    pricePerUnit: number | string;
    subTotal: number | string;
    model?: Partial<VehicleModel>;
    vehicleItem?: Partial<VehicleItem>;
  }>;
  payments?: Array<{
    id: number;
    transactionRef: string;
    amount: number | string;
    paymentStatus: number;
  }>;
  review?: Review;
}

export interface PaymentRecord {
  id: number;
  bookingId: number;
  transactionRef: string;
  paymentMethod: number; // 0: Cash, 1: BankTransfer/VietQR
  paymentType: number; // 0: FullPayment, 1: DepositOnly
  amount: number | string;
  paymentStatus: number; // 0: Pending, 1: Success, 2: Failed
  paymentTime?: string;
  createdAt: string;
  booking?: Booking;
}

export interface PartnerWallet {
  id: number;
  partnerId: number;
  balance: number | string;
  creditLimit: number | string;
  status: number;
  histories?: WalletHistory[];
}

export interface WalletHistory {
  id: number;
  walletId: number;
  bookingId?: number;
  type: number; // 0: Deposit/Credit, 1: Commission_Deduction, 2: Refund, 3: Withdrawal
  amount: number | string;
  balanceBefore: number | string;
  balanceAfter: number | string;
  description: string;
  createdAt: string;
  booking?: {
    bookingCode: string;
    startTime: string;
    endTime: string;
    storeId?: number;
    store?: {
      id: number;
      storeName: string;
    };
  };
}

export interface SystemConfig {
  id?: number;
  commissionRate: number; // % hoa hồng sàn (VD: 10 = 10%)
  creditLimit: number; // Tiền âm cho phép (VD: 500.000 VNĐ)
  minDepositPercent: number; // % cọc tối thiểu (VD: 15 = 15%)
  updatedAt?: string;
}

export interface PayoutRequest {
  id: number;
  partnerId: number;
  amount: number | string;
  bankAccountNum: string;
  bankName: string;
  accountHolder: string;
  status: number; // 0: PENDING, 1: APPROVED, 2: REJECTED
  note?: string;
  createdAt: string;
  updatedAt?: string;
  partner?: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    bankAccountNum?: string;
    bankName?: string;
    stores?: { storeName: string }[];
  };
}

export interface Review {
  id: number;
  bookingId: number;
  customerId: number;
  storeId: number;
  rateStar: number;
  comment: string;
  isHidden?: boolean;
  hiddenReason?: string;
  createdAt?: string;
  customerName?: string;
  customer?: { fullName: string; phone?: string; avatarUrl?: string };
  user?: { fullName: string; email?: string; avatarUrl?: string };
  booking?: any;
  store?: { storeName: string };
}

export interface PlatformStats {
  totalRevenue: number;
  totalCommission: number;
  totalBookings: number;
  totalStores: number;
  approvedStores: number;
  pendingStores: number;
  rejectedStores: number;
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  reservedVehicles: number;
  maintenanceVehicles: number;
  occupancyRate: number;
  revenueTrend: Array<{
    month: string;
    revenue: number;
    commission: number;
    bookings: number;
  }>;
  bookingStatusBreakdown: Array<{
    name: string;
    status: number;
    value: number;
    count: number;
    color: string;
  }>;
  vehicleCategoryDistribution: Array<{
    category: string;
    type: number;
    total: number;
    rented: number;
  }>;
}

// ── Auth Token Helper ─────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setAuthToken(token: string | null, role?: number | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("accessToken", token);
    document.cookie = `accessToken=${token}; path=/; max-age=604800; SameSite=Lax`;
    if (role !== undefined && role !== null) {
      localStorage.setItem("userRole", String(role));
      document.cookie = `userRole=${role}; path=/; max-age=604800; SameSite=Lax`;
    }
  } else {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    document.cookie = "accessToken=; path=/; max-age=0";
    document.cookie = "userRole=; path=/; max-age=0";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    let msg = `Yêu cầu thất bại (${res.status} ${res.statusText})`;
    if (errorBody) {
      if (Array.isArray(errorBody.message)) {
        msg = errorBody.message.join(", ");
      } else if (typeof errorBody.message === "string") {
        msg = errorBody.message;
      } else if (typeof errorBody.error === "string") {
        msg = errorBody.error;
      }
    }
    throw new Error(msg);
  }

  return res.json();
}

// ── Local Mock Fallback Data (Seed) ──────────────────────────────────────────

export const INITIAL_VEHICLE_MODELS: VehicleModel[] = [
  {
    id: 1,
    storeId: 1,
    name: "Honda Air Blade 125cc 2024",
    brand: "Honda",
    type: 1,
    rentPrice: 150000,
    specifications: "Động cơ eSP+ 4 van 125cc, khóa Smartkey thông minh, cốp rộng 23.2L, phanh đĩa CBS.",
    images: [
      "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
    ],
    availableCount: 3,
    totalActiveItems: 3,
    busyCount: 0,
    store: {
      id: 1,
      storeName: "Nhà Xe Thành Đạt (Hà Nội)",
      address: "123 Xuân Thủy, Cầu Giấy, Hà Nội",
      phoneContact: "0902000002",
      status: 1,
    },
    vehicleItems: [
      { id: 1, modelId: 1, licensePlate: "29E2-888.12", color: "Đỏ Đen", status: 0 },
      { id: 2, modelId: 1, licensePlate: "29E2-888.34", color: "Xanh Đen", status: 0 },
      { id: 3, modelId: 1, licensePlate: "29E2-888.56", color: "Xám Bạc", status: 0 },
    ],
  },
  {
    id: 2,
    storeId: 1,
    name: "Honda Wave Alpha 110cc",
    brand: "Honda",
    type: 0,
    rentPrice: 90000,
    specifications: "Động cơ 110cc siêu tiết kiệm xăng (1.72L/100km), bền bỉ, dễ lái, thích hợp phượt nội thành.",
    images: [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
    ],
    availableCount: 3,
    totalActiveItems: 3,
    busyCount: 0,
    store: {
      id: 1,
      storeName: "Nhà Xe Thành Đạt (Hà Nội)",
      address: "123 Xuân Thủy, Cầu Giấy, Hà Nội",
      phoneContact: "0902000002",
      status: 1,
    },
    vehicleItems: [
      { id: 4, modelId: 2, licensePlate: "29B1-654.32", color: "Trắng", status: 0 },
      { id: 5, modelId: 2, licensePlate: "29B1-654.78", color: "Đỏ", status: 0 },
      { id: 6, modelId: 2, licensePlate: "29B1-654.90", color: "Xanh", status: 0 },
    ],
  },
  {
    id: 3,
    storeId: 2,
    name: "Yamaha Exciter 155 VVA",
    brand: "Yamaha",
    type: 2,
    rentPrice: 180000,
    specifications: "Động cơ 155cc van biến thiên VVA, hộp số 6 cấp, bộ ly hợp chống trượt Assist & Slipper.",
    images: [
      "https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?auto=format&fit=crop&w=800&q=80",
    ],
    availableCount: 2,
    totalActiveItems: 3,
    busyCount: 1,
    store: {
      id: 2,
      storeName: "Dịch Vụ Thuê Xe Sài Gòn Phố",
      address: "456 Nguyễn Thị Minh Khai, Phường 5, Quận 3, TP.HCM",
      phoneContact: "0903000003",
      status: 1,
    },
    vehicleItems: [
      { id: 7, modelId: 3, licensePlate: "59F1-923.45", color: "Xanh GP", status: 0 },
      { id: 8, modelId: 3, licensePlate: "59F1-923.88", color: "Đen Nhám", status: 0 },
      { id: 9, modelId: 3, licensePlate: "59F1-923.99", color: "Cam Bạc", status: 2 },
    ],
  },
  {
    id: 4,
    storeId: 2,
    name: "VinFast Feliz S (Xe Điện)",
    brand: "VinFast",
    type: 3,
    rentPrice: 130000,
    specifications: "Động cơ 3000W êm ái, pin LFP 3.5kWh đi được 198km/sạc, chuẩn chống nước IP67 toàn diện.",
    images: [
      "https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80",
    ],
    availableCount: 3,
    totalActiveItems: 3,
    busyCount: 0,
    store: {
      id: 2,
      storeName: "Dịch Vụ Thuê Xe Sài Gòn Phố",
      address: "456 Nguyễn Thị Minh Khai, Phường 5, Quận 3, TP.HCM",
      phoneContact: "0903000003",
      status: 1,
    },
    vehicleItems: [
      { id: 10, modelId: 4, licensePlate: "59E1-711.22", color: "Trắng Ngọc Trai", status: 0 },
      { id: 11, modelId: 4, licensePlate: "59E1-711.33", color: "Đỏ Rượu", status: 0 },
      { id: 12, modelId: 4, licensePlate: "59E1-711.44", color: "Xanh Rêu", status: 0 },
    ],
  },
];

// ── Exported API Methods ──────────────────────────────────────────────────────

export const api = {
  auth: {
    login: async (dto: { email: string; password: string }) => {
      const data = await request<{ accessToken: string; user: User }>(
        "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(dto),
        }
      );
      setAuthToken(data.accessToken, data.user.role);
      return data;
    },

    registerCustomer: async (dto: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
    }) => {
      return await request<User>("/auth/register/customer", {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },

    registerPartner: async (dto: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
    }) => {
      return await request<User>("/auth/register/partner", {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },

    getProfile: async () => {
      try {
        return await request<User>("/auth/me");
      } catch {
        return null;
      }
    },

    updateProfile: async (data: {
      fullName?: string;
      phone?: string;
      bankAccountNum?: string;
      bankName?: string;
    }) => {
      return await request<User>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
  },

  customer: {
    searchVehicles: async (params: {
      startTime: string;
      endTime: string;
      type?: number;
      brand?: string;
      province?: string;
      storeId?: number;
    }) => {
      try {
        const q = new URLSearchParams();
        q.set("startTime", params.startTime);
        q.set("endTime", params.endTime);
        if (params.type !== undefined) q.set("type", String(params.type));
        if (params.brand) q.set("brand", params.brand);
        if (params.province) q.set("province", params.province);
        if (params.storeId) q.set("storeId", String(params.storeId));

        return await request<{
          data: VehicleModel[];
          meta: { total: number; page: number; limit: number; totalPages: number };
        }>(`/customer/vehicles/search?${q.toString()}`);
      } catch {
        return {
          data: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
        };
      }
    },

    getVehicleDetail: async (id: number, startTime?: string, endTime?: string) => {
      const now = new Date();
      const start = startTime || now.toISOString();
      const end =
        endTime ||
        new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
      return await request<VehicleModel>(
        `/customer/vehicles/${id}?startTime=${encodeURIComponent(
          start
        )}&endTime=${encodeURIComponent(end)}`
      );
    },

    createBooking: async (dto: {
      modelId: number;
      storeId: number;
      startTime: string;
      endTime: string;
      pickupType: number;
      deliveryAddress?: string;
      paymentType: number;
    }) => {
      try {
        return await request<{
          booking: Booking;
          payment: {
            transactionRef: string;
            amount: number;
            paymentMethod: string;
          };
          holdExpiresAt: string;
          message: string;
        }>("/customer/bookings", {
          method: "POST",
          body: JSON.stringify(dto),
        });
      } catch (err: any) {
        // Mock creation when API offline
        const now = new Date();
        const start = new Date(dto.startTime);
        const end = new Date(dto.endTime);
        const hours = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
        const dayRent = Math.ceil(hours / 24);
        const rentAmount = dayRent * 150000;
        const depositAmount = dto.paymentType === 1 ? rentAmount * 0.3 : rentAmount;
        const commissionAmount = rentAmount * 0.1;
        const txRef = `TX_DEMO_${Math.floor(1000 + Math.random() * 9000)}`;

        return {
          booking: {
            id: Math.floor(100 + Math.random() * 900),
            bookingCode: `BK-202611-${Math.floor(1000 + Math.random() * 9000)}`,
            customerId: 4,
            storeId: dto.storeId,
            startTime: dto.startTime,
            endTime: dto.endTime,
            pickupType: dto.pickupType,
            deliveryAddress: dto.deliveryAddress,
            dayRent,
            rentAmount,
            depositAmount,
            commissionAmount,
            holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            status: 0, // PendingPayment
            createdAt: new Date().toISOString(),
          },
          payment: {
            transactionRef: txRef,
            amount: depositAmount,
            paymentMethod: "VietQR / Bank Transfer",
          },
          holdExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          message: `Giữ chỗ thành công! Vui lòng quét mã VietQR trong 10 phút.`,
        };
      }
    },

    getMyBookings: async () => {
      try {
        return await request<Booking[]>("/customer/bookings");
      } catch {
        return [
          {
            id: 101,
            bookingCode: "BK-202611-1001",
            customerId: 4,
            storeId: 1,
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            pickupType: 0,
            dayRent: 2,
            rentAmount: 300000,
            depositAmount: 90000,
            commissionAmount: 30000,
            holdExpiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
            status: 0, // PendingPayment
            createdAt: new Date().toISOString(),
            store: { storeName: "Nhà Xe Thành Đạt (Hà Nội)", address: "123 Xuân Thủy, Cầu Giấy" },
            bookingDetails: [
              {
                id: 1,
                modelId: 1,
                quantity: 1,
                pricePerUnit: 150000,
                subTotal: 300000,
                model: { name: "Honda Air Blade 125cc 2024", brand: "Honda" },
              },
            ],
            payments: [{ id: 1, transactionRef: "TX_DEMO_1001", amount: 90000, paymentStatus: 0 }],
          },
          {
            id: 102,
            bookingCode: "BK-202611-0945",
            customerId: 4,
            storeId: 2,
            startTime: "2026-11-01T08:00:00.000Z",
            endTime: "2026-11-03T18:00:00.000Z",
            pickupType: 1,
            deliveryAddress: "Khách sạn Liberty Central, Quận 1, TP.HCM",
            dayRent: 3,
            rentAmount: 540000,
            depositAmount: 162000,
            commissionAmount: 54000,
            status: 4, // Completed
            createdAt: "2026-11-01T07:30:00.000Z",
            store: { storeName: "Dịch Vụ Thuê Xe Sài Gòn Phố", address: "456 Nguyễn Thị Minh Khai, Quận 3" },
            bookingDetails: [
              {
                id: 2,
                modelId: 3,
                quantity: 1,
                pricePerUnit: 180000,
                subTotal: 540000,
                model: { name: "Yamaha Exciter 155 VVA", brand: "Yamaha" },
                vehicleItem: { licensePlate: "59F1-923.45", color: "Xanh GP" },
              },
            ],
            payments: [{ id: 2, transactionRef: "TX_DEMO_0945", amount: 162000, paymentStatus: 1 }],
          },
        ];
      }
    },

    getPaymentQr: async (bookingId: number) => {
      return await request<{
        bookingId: number;
        transactionRef: string;
        amount: number;
        checkoutUrl: string;
        qrCode: string;
        accountNumber?: string;
        accountName?: string;
        bin?: string;
        expiredAt: string;
      }>(`/customer/payments/booking/${bookingId}/qr`);
    },

    cancelBooking: async (bookingId: number) => {
      try {
        return await request<{ status: number }>(
          `/customer/bookings/${bookingId}/cancel`,
          {
            method: "POST",
          }
        );
      } catch {
        return { status: 5 };
      }
    },

    getStores: async () => {
      try {
        return await request<Store[]>("/customer/stores");
      } catch {
        return [];
      }
    },

    getStoreDetail: async (id: number) => {
      return await request<Store>(`/customer/stores/${id}`);
    },

    submitReview: async (bookingId: number, dto: { rateStar: number; comment?: string }) => {
      return await request<Review>(`/customer/bookings/${bookingId}/review`, {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },
  },

  partner: {
    getStores: async () => {
      try {
        return await request<Store[]>("/partner/stores");
      } catch {
        return [
          {
            id: 1,
            partnerId: 2,
            storeName: "Nhà Xe Thành Đạt (Hà Nội)",
            address: "123 Xuân Thủy, Cầu Giấy, Hà Nội",
            phoneContact: "0902000002",
            description: "Chuyên cho thuê xe tay ga đời mới, giao xe tận nơi Cầu Giấy & Nam Từ Liêm.",
            storeImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
            status: 1, // ACTIVE
            rentalPolicy: {
              id: 1,
              storeId: 1,
              depositPercent: 30,
              cancelRule: "Hủy trước 24h được hoàn 100% cọc.",
              refundCondition: "Hoàn cọc trong vòng 24h qua STK ngân hàng.",
            },
            _count: { vehicleModels: 2 },
          },
        ];
      }
    },

    createStore: async (dto: {
      storeName: string;
      province?: string;
      address: string;
      phoneContact: string;
      description?: string;
      storeImage?: string;
      depositPercent: number;
      cancelRule?: string;
      refundCondition?: string;
      bankAccountNum: string;
      bankName: string;
      openTime?: string;
      closeTime?: string;
    }) => {
      try {
        return await request<Store>("/partner/stores", {
          method: "POST",
          body: JSON.stringify(dto),
        });
      } catch {
        return {
          id: 3,
          partnerId: 2,
          storeName: dto.storeName,
          province: dto.province,
          address: dto.address,
          phoneContact: dto.phoneContact,
          description: dto.description,
          storeImage: dto.storeImage,
          status: 0, // PENDING (chờ duyệt)
          rentalPolicy: {
            id: 3,
            storeId: 3,
            depositPercent: dto.depositPercent,
            cancelRule: dto.cancelRule,
            refundCondition: dto.refundCondition,
          },
        };
      }
    },

    deleteStore: async (storeId: number) => {
      return await request<{ success: boolean; message?: string }>(`/partner/stores/${storeId}`, {
        method: "DELETE",
      });
    },

    updateStore: async (storeId: number, dto: any) => {
      return await request<Store>(`/partner/stores/${storeId}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      });
    },

    updateStoreStatus: async (storeId: number, status: number) => {
      return await request<Store>(`/partner/stores/${storeId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    upsertRentalPolicy: async (
      storeId: number,
      dto: { depositPercent: number; cancelRule?: string; refundCondition?: string }
    ) => {
      return await request<RentalPolicy>(`/partner/stores/${storeId}/rental-policy`, {
        method: "PUT",
        body: JSON.stringify(dto),
      });
    },

    getModels: async (storeId?: number) => {
      try {
        const query = storeId ? `?storeId=${storeId}` : "";
        return await request<VehicleModel[]>(
          `/partner/vehicles/models${query}`
        );
      } catch {
        return INITIAL_VEHICLE_MODELS.filter((m) => !storeId || m.storeId === storeId);
      }
    },

    createModel: async (dto: any) => {
      try {
        return await request<VehicleModel>("/partner/vehicles/models", {
          method: "POST",
          body: JSON.stringify(dto),
        });
      } catch {
        return {
          id: Math.floor(10 + Math.random() * 90),
          ...dto,
        };
      }
    },

    updateModel: async (modelId: number, dto: any) => {
      return await request<VehicleModel>(`/partner/vehicles/models/${modelId}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      });
    },

    deleteModel: async (modelId: number) => {
      return await request<{ success: boolean; message?: string }>(`/partner/vehicles/models/${modelId}`, {
        method: "DELETE",
      });
    },

    getItems: async (modelId: number) => {
      try {
        return await request<VehicleItem[]>(
          `/partner/vehicles/models/${modelId}/items`
        );
      } catch {
        const model = INITIAL_VEHICLE_MODELS.find((m) => m.id === modelId);
        return model?.vehicleItems || [];
      }
    },

    addItem: async (modelId: number, dto: { licensePlate: string; color?: string; chassisNumber?: string }) => {
      try {
        return await request<VehicleItem>(
          `/partner/vehicles/models/${modelId}/items`,
          {
            method: "POST",
            body: JSON.stringify(dto),
          }
        );
      } catch {
        return {
          id: Math.floor(100 + Math.random() * 900),
          modelId,
          ...dto,
          status: 0,
        };
      }
    },

    addBulkItems: async (
      modelId: number,
      items: { licensePlate: string; color?: string; chassisNumber?: string }[]
    ) => {
      try {
        return await request<{
          success: boolean;
          totalAdded: number;
          items: VehicleItem[];
          duplicates: string[];
          message: string;
        }>(`/partner/vehicles/models/${modelId}/items/bulk`, {
          method: "POST",
          body: JSON.stringify({ items }),
        });
      } catch {
        const mockAdded: VehicleItem[] = items.map((it, idx) => ({
          id: Date.now() + idx,
          modelId,
          licensePlate: it.licensePlate.toUpperCase(),
          color: it.color || "Tiêu chuẩn",
          chassisNumber: it.chassisNumber,
          status: 0,
        }));
        return {
          success: true,
          totalAdded: mockAdded.length,
          items: mockAdded,
          duplicates: [],
          message: `Đã thêm thành công ${mockAdded.length} xe vào kho!`,
        };
      }
    },

    updateItemStatus: async (itemId: number, status: number) => {
      try {
        return await request<VehicleItem>(
          `/partner/vehicles/items/${itemId}/status`,
          {
            method: "PUT",
            body: JSON.stringify({ status }),
          }
        );
      } catch {
        return { id: itemId, status };
      }
    },

    updateItem: async (
      itemId: number,
      dto: { licensePlate?: string; color?: string; chassisNumber?: string; status?: number }
    ) => {
      return await request<VehicleItem>(`/partner/vehicles/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(dto),
      });
    },

    deleteItem: async (itemId: number) => {
      try {
        return await request(`/partner/vehicles/items/${itemId}`, {
          method: "DELETE",
        });
      } catch {
        return { success: true };
      }
    },

    getBookings: async (status?: number, storeId?: number) => {
      try {
        const params = new URLSearchParams();
        if (status !== undefined) params.append("status", String(status));
        if (storeId !== undefined) params.append("storeId", String(storeId));
        const query = params.toString() ? `?${params.toString()}` : "";
        return await request<Booking[]>(`/partner/bookings${query}`);
      } catch {
        const allMock: Booking[] = [
          {
            id: 201,
            bookingCode: "BK-202611-0988",
            customerId: 4,
            storeId: 1,
            startTime: "2026-11-04T10:00:00.000Z",
            endTime: "2026-11-06T18:00:00.000Z",
            pickupType: 0,
            dayRent: 3,
            rentAmount: 450000,
            depositAmount: 135000,
            commissionAmount: 45000,
            status: 1, // Confirmed (Chờ bàn giao xe)
            createdAt: "2026-11-04T08:00:00.000Z",
            customer: { fullName: "Nguyễn Hoàng Long", phone: "0911222333" },
            bookingDetails: [
              {
                id: 11,
                modelId: 1,
                quantity: 1,
                pricePerUnit: 150000,
                subTotal: 450000,
                model: { name: "Honda Air Blade 125cc 2024" },
              },
            ],
          },
          {
            id: 202,
            bookingCode: "BK-202611-0972",
            customerId: 5,
            storeId: 1,
            startTime: "2026-11-05T08:00:00.000Z",
            endTime: "2026-11-07T12:00:00.000Z",
            pickupType: 1,
            deliveryAddress: "Sân bay Nội Bài, Tầng 1 Ga Quốc Nội",
            dayRent: 3,
            rentAmount: 270000,
            depositAmount: 81000,
            commissionAmount: 27000,
            status: 2, // WaitingQueue (Do ví thiếu số dư)
            createdAt: "2026-11-04T08:30:00.000Z",
            customer: { fullName: "Phạm Thu Thảo", phone: "0988777666" },
            bookingDetails: [
              {
                id: 12,
                modelId: 2,
                quantity: 1,
                pricePerUnit: 90000,
                subTotal: 270000,
                model: { name: "Honda Wave Alpha 110cc" },
              },
            ],
          },
          {
            id: 203,
            bookingCode: "BK-202611-0911",
            customerId: 6,
            storeId: 1,
            startTime: "2026-11-03T09:00:00.000Z",
            endTime: "2026-11-05T09:00:00.000Z",
            pickupType: 0,
            dayRent: 2,
            rentAmount: 300000,
            depositAmount: 90000,
            commissionAmount: 30000,
            status: 3, // ActiveRental (Đang đi xe)
            createdAt: "2026-11-03T08:45:00.000Z",
            customer: { fullName: "Đặng Quang Huy", phone: "0977888999" },
            bookingDetails: [
              {
                id: 13,
                modelId: 1,
                vehicleItemId: 1,
                quantity: 1,
                pricePerUnit: 150000,
                subTotal: 300000,
                model: { name: "Honda Air Blade 125cc 2024" },
                vehicleItem: { licensePlate: "29E2-888.12", color: "Đỏ Đen" },
              },
            ],
          },
        ];
        let filtered = allMock;
        if (status !== undefined) {
          filtered = filtered.filter((b) => b.status === status);
        }
        if (storeId !== undefined) {
          filtered = filtered.filter((b) => b.storeId === storeId);
        }
        return filtered;
      }
    },

    handover: async (bookingId: number, vehicleItemId: number) => {
      try {
        return await request(`/partner/bookings/${bookingId}/handover`, {
          method: "POST",
          body: JSON.stringify({ vehicleItemId }),
        });
      } catch {
        return { status: 3, vehicleItemId };
      }
    },

    complete: async (bookingId: number) => {
      try {
        return await request(`/partner/bookings/${bookingId}/complete`, {
          method: "POST",
        });
      } catch {
        return { status: 4 };
      }
    },

    getWallet: async () => {
      try {
        return await request<PartnerWallet>("/partner/wallet");
      } catch {
        return {
          id: 1,
          partnerId: 2,
          balance: 0,
          creditLimit: 500000, // Hạn mức âm 500.000 VNĐ
          status: 1,
        };
      }
    },

    getWalletHistory: async (page = 1, limit = 10, storeId?: number) => {
      try {
        const storeParam = storeId ? `&storeId=${storeId}` : '';
        return await request<{
          wallet: { balance: number; creditLimit: number; status: number };
          histories: WalletHistory[];
          meta: { total: number; page: number; limit: number; totalPages: number };
        }>(`/partner/wallet/history?page=${page}&limit=${limit}${storeParam}`);
      } catch {
        return {
          wallet: { balance: 0, creditLimit: 500000, status: 1 },
          histories: [],
          meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
        };
      }
    },

    deposit: async (dto: { amount: number; description: string }) => {
      return await request<{
        checkoutUrl: string;
        qrCode: string;
        orderCode: number;
        depositAmount: number;
        accountNumber?: string;
        accountName?: string;
        bin?: string;
      }>("/partner/wallet/deposit", {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },

    requestPayout: async (dto: { amount: number; note?: string }) => {
      try {
        return await request<{ message: string; payoutRequest: PayoutRequest; remainingBalance: number }>(
          "/partner/wallet/payout",
          {
            method: "POST",
            body: JSON.stringify(dto),
          }
        );
      } catch {
        return {
          message: "Đã gửi yêu cầu rút tiền thành công (Demo)",
          payoutRequest: {
            id: Date.now(),
            partnerId: 2,
            amount: dto.amount,
            bankAccountNum: "9876543210",
            bankName: "Vietcombank",
            accountHolder: "Đối tác Nhà xe",
            status: 0,
            note: dto.note,
            createdAt: new Date().toISOString(),
          },
          remainingBalance: 0,
        };
      }
    },

    getPayouts: async () => {
      try {
        return await request<PayoutRequest[]>("/partner/wallet/payouts");
      } catch {
        return [];
      }
    },

    getOwnerPasswordStatus: async () => {
      try {
        return await request<{ hasOwnerPassword: boolean }>("/partner/stores/security/owner-password-status");
      } catch {
        return { hasOwnerPassword: false };
      }
    },

    setOwnerPassword: async (dto: { currentPassword?: string; newPassword: string }) => {
      return await request<{ success: boolean; message: string }>("/partner/stores/security/set-owner-password", {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },

    verifyOwnerPassword: async (password: string) => {
      return await request<{ verified: boolean; requiresSetup?: boolean }>("/partner/stores/security/verify-owner-password", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
    },

    requestStoreUpdate: async (
      storeId: number,
      dto: {
        storeName: string;
        province?: string;
        address: string;
        phoneContact: string;
        description?: string;
        storeImage?: string;
        depositPercent: number;
        cancelRule?: string;
        bankAccountNum?: string;
        bankName?: string;
        openTime?: string;
        closeTime?: string;
      }
    ) => {
      return await request<StoreUpdateRequest>(`/partner/stores/${storeId}/request-update`, {
        method: "POST",
        body: JSON.stringify(dto),
      });
    },

    getStoreUpdateRequests: async (storeId?: number) => {
      try {
        const url = storeId ? `/partner/stores/${storeId}/update-requests` : "/partner/stores/update-requests";
        return await request<StoreUpdateRequest[]>(url);
      } catch {
        return [];
      }
    },
  },

  config: {
    get: async (): Promise<SystemConfig> => {
      try {
        return await request<SystemConfig>("/system-config");
      } catch {
        return {
          commissionRate: 10,
          creditLimit: 500000,
          minDepositPercent: 15,
        };
      }
    },
  },

  admin: {
    getPlatformStats: async (): Promise<PlatformStats> => {
      try {
        return await request<PlatformStats>("/admin/stats");
      } catch {
        return {
          totalRevenue: 0,
          totalCommission: 0,
          totalBookings: 0,
          totalStores: 0,
          approvedStores: 0,
          pendingStores: 0,
          rejectedStores: 0,
          totalVehicles: 0,
          availableVehicles: 0,
          rentedVehicles: 0,
          reservedVehicles: 0,
          maintenanceVehicles: 0,
          occupancyRate: 0,
          revenueTrend: [],
          bookingStatusBreakdown: [],
          vehicleCategoryDistribution: [],
        };
      }
    },

    getBookings: async (): Promise<Booking[]> => {
      try {
        return await request<Booking[]>("/admin/bookings");
      } catch {
        return [];
      }
    },

    getStores: async (status?: number) => {
      try {
        const q = status !== undefined ? `?status=${status}` : "";
        return await request<Store[]>(`/admin/stores${q}`);
      } catch {
        return [
          {
            id: 1,
            partnerId: 2,
            storeName: "Nhà Xe Thành Đạt (Hà Nội)",
            address: "123 Xuân Thủy, Cầu Giấy, Hà Nội",
            phoneContact: "0902000002",
            description: "Chuyên cho thuê xe máy đời mới, giao xe tận nơi Cầu Giấy.",
            storeImage: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80",
            status: 1, // ACTIVE
            rentalPolicy: { id: 1, storeId: 1, depositPercent: 30 },
            partner: { fullName: "Trần Văn Thành", email: "partner1@vehiclerent.vn", phone: "0902000002", bankAccountNum: "9876543210", bankName: "Vietcombank" },
          },
          {
            id: 2,
            partnerId: 3,
            storeName: "Dịch Vụ Thuê Xe Sài Gòn Phố",
            address: "456 Nguyễn Thị Minh Khai, Phường 5, Quận 3, TP.HCM",
            phoneContact: "0903000003",
            description: "Đa dạng các dòng xe tay ga cao cấp, xe côn tay phượt thể thao.",
            storeImage: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80",
            status: 0, // PENDING (Chờ duyệt)
            rentalPolicy: { id: 2, storeId: 2, depositPercent: 35 },
            partner: { fullName: "Lê Hoàng Long", email: "partner2@vehiclerent.vn", phone: "0903000003", bankAccountNum: "1234567890", bankName: "Techcombank" },
          },
          {
            id: 3,
            partnerId: 4,
            storeName: "Thuê Xe Đà Nẵng Biển Xanh",
            address: "78 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng",
            phoneContact: "0904000004",
            description: "Cho thuê xe máy, xe điện ven biển Mỹ Khê.",
            storeImage: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=800&q=80",
            status: 2, // REJECTED
            rejectReason: "Ảnh chụp mặt tiền mờ, chưa xác thực số điện thoại kinh doanh.",
            rentalPolicy: { id: 3, storeId: 3, depositPercent: 30 },
            partner: { fullName: "Võ Thị Mai", email: "partner3@vehiclerent.vn", phone: "0904000004", bankAccountNum: "5555666677", bankName: "MBBank" },
          },
        ];
      }
    },

    approveStore: async (storeId: number) => {
      try {
        return await request<Store>(`/admin/stores/${storeId}/approve`, {
          method: "PATCH",
        });
      } catch {
        return { id: storeId, status: 1 };
      }
    },

    rejectStore: async (storeId: number, rejectReason: string) => {
      try {
        return await request<Store>(`/admin/stores/${storeId}/reject`, {
          method: "PATCH",
          body: JSON.stringify({ rejectReason }),
        });
      } catch {
        return { id: storeId, status: 2, rejectReason };
      }
    },

    getStoreUpdateRequests: async (status?: number) => {
      try {
        const q = status !== undefined ? `?status=${status}` : "";
        return await request<StoreUpdateRequest[]>(`/admin/stores/update-requests${q}`);
      } catch {
        return [];
      }
    },

    approveStoreUpdateRequest: async (requestId: number) => {
      return await request<StoreUpdateRequest>(`/admin/stores/update-requests/${requestId}/approve`, {
        method: "PATCH",
      });
    },

    rejectStoreUpdateRequest: async (requestId: number, rejectReason: string) => {
      return await request<StoreUpdateRequest>(`/admin/stores/update-requests/${requestId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ rejectReason }),
      });
    },

    getUsers: async () => {
      try {
        return await request<User[]>("/admin/users");
      } catch {
        return [
          { id: 1, email: "admin@vehiclerent.vn", fullName: "Quản Trị Viên Sàn", phone: "0900000001", role: 0, status: true, createdAt: "2026-11-01" },
          { id: 2, email: "partner1@vehiclerent.vn", fullName: "Trần Văn Thành", phone: "0902000002", role: 1, status: true, bankAccountNum: "9876543210", bankName: "Vietcombank", createdAt: "2026-11-01" },
          { id: 3, email: "partner2@vehiclerent.vn", fullName: "Lê Hoàng Long", phone: "0903000003", role: 1, status: true, bankAccountNum: "1234567890", bankName: "Techcombank", createdAt: "2026-11-02" },
          { id: 4, email: "customer1@gmail.com", fullName: "Nguyễn Hoàng Long", phone: "0911222333", role: 2, status: true, createdAt: "2026-11-02" },
          { id: 5, email: "customer2@gmail.com", fullName: "Phạm Thu Thảo", phone: "0988777666", role: 2, status: true, createdAt: "2026-11-03" },
        ];
      }
    },

    getUserDetail: async (userId: number): Promise<UserDetail> => {
      try {
        return await request<UserDetail>(`/admin/users/${userId}`);
      } catch {
        return {
          id: userId,
          email: "user@example.com",
          fullName: "Người dùng hệ thống",
          phone: "0900000000",
          role: 2,
          status: true,
          bookings: [],
          reviews: [],
          stores: [],
        } as UserDetail;
      }
    },

    toggleUserStatus: async (userId: number) => {
      try {
        return await request<{ id: number; status: boolean }>(`/admin/users/${userId}/toggle-status`, {
          method: "PATCH",
        });
      } catch {
        return { id: userId, status: false };
      }
    },

    deleteUser: async (userId: number) => {
      return await request<{ success: boolean; message: string }>(`/admin/users/${userId}`, {
        method: "DELETE",
      });
    },

    getReviews: async (): Promise<Review[]> => {
      try {
        return await request<Review[]>("/admin/reviews");
      } catch {
        return [
          {
            id: 1,
            bookingId: 102,
            customerId: 4,
            storeId: 2,
            rateStar: 5,
            comment: "Xe Exciter 155 chạy cực kỳ êm và bốc, chủ nhà xe nhiệt tình giao xe đúng giờ tại khách sạn!",
            isHidden: false,
            createdAt: "2026-11-03T20:00:00Z",
            customer: { fullName: "Nguyễn Hoàng Long", phone: "0911222333" },
            store: { storeName: "Dịch Vụ Thuê Xe Sài Gòn Phố" },
          },
          {
            id: 2,
            bookingId: 99,
            customerId: 5,
            storeId: 1,
            rateStar: 1,
            comment: "Nội dung quảng cáo spam liên kết ngoài vi phạm chính sách cộng đồng sàn.",
            isHidden: true,
            hiddenReason: "Chứa link spam vi phạm điều khoản",
            createdAt: "2026-11-02T14:20:00Z",
            customer: { fullName: "Tài Khoản Rác", phone: "0999000111" },
            store: { storeName: "Nhà Xe Thành Đạt" },
          },
        ];
      }
    },

    hideReview: async (reviewId: number, hiddenReason: string) => {
      try {
        return await request<Review>(`/admin/reviews/${reviewId}/hide`, {
          method: "POST",
          body: JSON.stringify({ hiddenReason }),
        });
      } catch {
        return { id: reviewId, isHidden: true, hiddenReason } as Review;
      }
    },

    unhideReview: async (reviewId: number) => {
      try {
        return await request<Review>(`/admin/reviews/${reviewId}/unhide`, {
          method: "POST",
        });
      } catch {
        return { id: reviewId, isHidden: false } as Review;
      }
    },

    getConfig: async (): Promise<SystemConfig> => {
      try {
        return await request<SystemConfig>("/admin/config");
      } catch {
        return {
          commissionRate: 10,
          creditLimit: 500000,
          minDepositPercent: 15,
        };
      }
    },

    updateConfig: async (dto: Partial<SystemConfig>): Promise<SystemConfig> => {
      try {
        return await request<SystemConfig>("/admin/config", {
          method: "PUT",
          body: JSON.stringify(dto),
        });
      } catch {
        return {
          commissionRate: dto.commissionRate ?? 10,
          creditLimit: dto.creditLimit ?? 500000,
          minDepositPercent: dto.minDepositPercent ?? 15,
        };
      }
    },

    getPayouts: async (
      filters?: number | { status?: number; search?: string; fromDate?: string; toDate?: string }
    ): Promise<PayoutRequest[]> => {
      try {
        const params = new URLSearchParams();
        if (typeof filters === "number") {
          params.append("status", String(filters));
        } else if (filters) {
          if (filters.status !== undefined) params.append("status", String(filters.status));
          if (filters.search) params.append("search", filters.search);
          if (filters.fromDate) params.append("fromDate", filters.fromDate);
          if (filters.toDate) params.append("toDate", filters.toDate);
        }
        const qs = params.toString() ? `?${params.toString()}` : "";
        return await request<PayoutRequest[]>(`/admin/payouts${qs}`);
      } catch {
        return [];
      }
    },

    getPayments: async (
      filters?: { search?: string; status?: number; fromDate?: string; toDate?: string }
    ): Promise<PaymentRecord[]> => {
      try {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.search) params.append("search", filters.search);
          if (filters.status !== undefined) params.append("status", String(filters.status));
          if (filters.fromDate) params.append("fromDate", filters.fromDate);
          if (filters.toDate) params.append("toDate", filters.toDate);
        }
        const qs = params.toString() ? `?${params.toString()}` : "";
        return await request<PaymentRecord[]>(`/admin/transactions/payments${qs}`);
      } catch {
        return [];
      }
    },

    getWalletHistories: async (
      filters?: { search?: string; type?: number; fromDate?: string; toDate?: string }
    ): Promise<any[]> => {
      try {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.search) params.append("search", filters.search);
          if (filters.type !== undefined) params.append("type", String(filters.type));
          if (filters.fromDate) params.append("fromDate", filters.fromDate);
          if (filters.toDate) params.append("toDate", filters.toDate);
        }
        const qs = params.toString() ? `?${params.toString()}` : "";
        return await request<any[]>(`/admin/transactions/wallet-histories${qs}`);
      } catch {
        return [];
      }
    },

    reviewPayout: async (id: number, dto: { status: number; note?: string }) => {
      try {
        return await request<{ message: string; payoutRequest: PayoutRequest }>(`/admin/payouts/${id}`, {
          method: "PATCH",
          body: JSON.stringify(dto),
        });
      } catch {
        return {
          message: dto.status === 1 ? "Phê duyệt thành công (Demo)" : "Đã từ chối (Demo)",
          payoutRequest: { id, status: dto.status, note: dto.note } as PayoutRequest,
        };
      }
    },
  },
};

