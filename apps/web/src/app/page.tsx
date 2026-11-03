import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Bike,
  ShieldCheck,
  Zap,
  Clock,
  QrCode,
  MapPin,
  CheckCircle2,
  Users,
  Store,
  Wallet,
  ArrowRight
} from "lucide-react";

const SEED_VEHICLES = [
  {
    id: 1,
    name: "Honda Air Blade 125cc 2024",
    brand: "Honda",
    type: "Tay ga",
    typeCode: 1,
    price: "150.000 đ/ngày",
    store: "Nhà Xe Thành Đạt (Hà Nội)",
    itemsCount: 3,
    plates: ["29E2-888.12", "29E2-888.34", "29E2-888.56"],
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80",
    specs: "Động cơ eSP+ 4 van 125cc, khóa Smartkey, cốp rộng 23.2L.",
  },
  {
    id: 2,
    name: "Honda Wave Alpha 110cc",
    brand: "Honda",
    type: "Xe số",
    typeCode: 0,
    price: "90.000 đ/ngày",
    store: "Nhà Xe Thành Đạt (Hà Nội)",
    itemsCount: 3,
    plates: ["29B1-654.32", "29B1-654.78", "29B1-654.90"],
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80",
    specs: "Động cơ 110cc tiết kiệm xăng 1.72L/100km, bền bỉ và cơ động.",
  },
  {
    id: 3,
    name: "Yamaha Exciter 155 VVA",
    brand: "Yamaha",
    type: "Côn tay",
    typeCode: 2,
    price: "180.000 đ/ngày",
    store: "Dịch Vụ Thuê Xe Sài Gòn Phố (TP.HCM)",
    itemsCount: 3,
    plates: ["59F1-923.45", "59F1-923.88", "59F1-923.99"],
    image: "https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?auto=format&fit=crop&w=800&q=80",
    specs: "Động cơ 155cc van biến thiên VVA, hộp số 6 cấp, ly hợp Assist & Slipper.",
  },
  {
    id: 4,
    name: "VinFast Feliz S (Xe điện)",
    brand: "VinFast",
    type: "Xe điện",
    typeCode: 3,
    price: "130.000 đ/ngày",
    store: "Dịch Vụ Thuê Xe Sài Gòn Phố (TP.HCM)",
    itemsCount: 3,
    plates: ["59E1-711.22", "59E1-711.33", "59E1-711.44"],
    image: "https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80",
    specs: "Động cơ 3000W, pin LFP 3.5kWh đi 198km/sạc, chuẩn chống nước IP67.",
  },
];

const SEED_ACCOUNTS = [
  {
    role: "Admin",
    badge: "Quản trị sàn",
    email: "admin@vehiclerent.vn",
    password: "Password@123",
    name: "Hệ Thống Quản Trị Viên",
    extra: "Quyền duyệt đối tác, quản trị ví và cấu hình sàn.",
  },
  {
    role: "Partner 1",
    badge: "Đối tác Hà Nội",
    email: "partner1@vehiclerent.vn",
    password: "Password@123",
    name: "Trần Văn Thành",
    extra: "Cửa hàng: Nhà Xe Thành Đạt (Cầu Giấy) | Ví: 2.000.000 đ",
  },
  {
    role: "Partner 2",
    badge: "Đối tác TP.HCM",
    email: "partner2@vehiclerent.vn",
    password: "Password@123",
    name: "Lê Hoàng Long",
    extra: "Cửa hàng: Sài Gòn Phố (Quận 3) | Ví: 1.500.000 đ",
  },
  {
    role: "Customer 1",
    badge: "Khách hàng B2",
    email: "customer1@gmail.com",
    password: "Password@123",
    name: "Nguyễn Hoàng Long",
    extra: "Bằng lái: B2-079198002134 | SĐT: 0911222333",
  },
  {
    role: "Customer 2",
    badge: "Khách hàng A1",
    email: "customer2@gmail.com",
    password: "Password@123",
    name: "Phạm Thu Thảo",
    extra: "Bằng lái: A1-001199004567 | SĐT: 0988777666",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900">VehicleRent</span>
              <span className="ml-1 text-xs font-semibold text-blue-600">PLATFORM</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground border rounded-full px-3 py-1 bg-slate-50">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              API: <code className="text-slate-800 font-mono">http://localhost:4000</code>
            </div>
            <Button size="sm" variant="outline">Đăng nhập</Button>
            <Button size="sm">Đăng ký</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 via-white to-slate-50 py-16 md:py-24 border-b">
        <div className="container relative z-10 flex flex-col items-center text-center">
          <Badge variant="outline" className="mb-4 border-blue-200 bg-blue-50/80 text-blue-700 py-1 px-3">
            ✨ Monorepo NestJS + Next.js + Prisma MySQL đã khởi tạo thành công
          </Badge>
          <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Nền tảng Cho thuê xe trực tuyến <span className="text-blue-600">Đa đối tác</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Hệ sinh thái kết nối đối tác chủ xe và khách hàng: Giữ chỗ 10 phút chống trùng lịch,
            thanh toán VietQR đối soát tự động, trừ hoa hồng ví theo thứ tự FIFO.
          </p>

          {/* Quick Stats / Highlights */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl w-full">
            <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col items-center">
              <Clock className="h-6 w-6 text-blue-600 mb-2" />
              <div className="font-semibold text-slate-800">10 Phút Giữ Xe</div>
              <div className="text-xs text-muted-foreground">Chống double-booking</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col items-center">
              <QrCode className="h-6 w-6 text-emerald-600 mb-2" />
              <div className="font-semibold text-slate-800">VietQR Tự Động</div>
              <div className="text-xs text-muted-foreground">Webhook tức thì</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col items-center">
              <Wallet className="h-6 w-6 text-amber-600 mb-2" />
              <div className="font-semibold text-slate-800">Ví Đối Tác FIFO</div>
              <div className="text-xs text-muted-foreground">Tự động trừ hoa hồng</div>
            </div>
            <div className="rounded-xl border bg-white p-4 shadow-sm flex flex-col items-center">
              <ShieldCheck className="h-6 w-6 text-indigo-600 mb-2" />
              <div className="font-semibold text-slate-800">Biển Số Thực Tế</div>
              <div className="text-xs text-muted-foreground">Quản lý kho 2 tầng</div>
            </div>
          </div>
        </div>
      </section>

      {/* Seeded Vehicle Models Showcase */}
      <section className="py-14 bg-slate-50">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Dữ liệu mẫu đã tạo</div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                4 Dòng Xe Mẫu (VehicleModel) & 12 Xe Vật Lý (VehicleItem)
              </h2>
            </div>
            <div className="text-sm text-slate-500 mt-2 md:mt-0">
              Mỗi dòng xe gồm 3 biển số xe thực tế sẵn sàng cho thuê
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SEED_VEHICLES.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="relative h-44 w-full bg-slate-200 overflow-hidden">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-white/90 text-slate-800 shadow-sm">
                        {vehicle.type}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="p-4 pb-2">
                    <div className="text-xs text-blue-600 font-medium">{vehicle.brand}</div>
                    <CardTitle className="text-lg">{vehicle.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2 mt-1">
                      {vehicle.specs}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-0">
                    <div className="mt-2 text-xs font-semibold text-slate-700">Biển số thực tế (3 xe):</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {vehicle.plates.map((plate) => (
                        <span key={plate} className="inline-block text-[11px] font-mono font-medium px-2 py-0.5 bg-slate-100 border rounded text-slate-700">
                          {plate}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-4 border-t bg-slate-50/50 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Giá thuê</div>
                    <div className="text-sm font-bold text-blue-600">{vehicle.price}</div>
                  </div>
                  <Button size="sm" variant="default" className="text-xs">
                    Đặt xe
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testing Accounts Section */}
      <section className="py-14 bg-white border-t">
        <div className="container">
          <div className="max-w-2xl mb-8">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-600">Tài khoản thử nghiệm</div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Danh sách Tài khoản Test Seeded Sẵn
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Mật khẩu mặc định cho tất cả tài khoản bên dưới là: <code className="bg-slate-100 text-blue-600 px-2 py-0.5 rounded font-mono font-semibold">Password@123</code>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SEED_ACCOUNTS.map((acc, idx) => (
              <div key={idx} className="rounded-lg border p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800 text-sm">{acc.name}</span>
                  <Badge variant="outline" className="text-xs">{acc.badge}</Badge>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Email:</span>
                    <span className="font-mono text-slate-800 select-all font-medium">{acc.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Mật khẩu:</span>
                    <span className="font-mono text-slate-800 select-all font-medium">{acc.password}</span>
                  </div>
                  <div className="pt-2 border-t mt-2 text-[11px] text-slate-600">
                    {acc.extra}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-slate-900 py-6 text-slate-400">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            © 2026 VehicleRent Platform. NestJS + Next.js App Router Monorepo.
          </div>
          <div className="flex gap-4">
            <span>MySQL 8.0 / Docker-Compose</span>
            <span>•</span>
            <span>Prisma ORM</span>
            <span>•</span>
            <span>Tailwind & Shadcn UI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

