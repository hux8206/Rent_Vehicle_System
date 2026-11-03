import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  const defaultPassword = await bcrypt.hash('Password@123', 10);

  // 1. Seed Admin
  console.log('👤 Seeding Admin...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vehiclerent.vn' },
    update: {},
    create: {
      email: 'admin@vehiclerent.vn',
      passwordHash: defaultPassword,
      fullName: 'Hệ Thống Quản Trị Viên',
      phone: '0901000001',
      role: 0, // 0: Admin
      status: true,
    },
  });
  console.log(`✅ Admin created/verified: ${admin.email}`);

  // 2. Seed Partner 1 (Cầu Giấy, Hà Nội)
  console.log('🏢 Seeding Partner 1 & Store 1...');
  const partner1 = await prisma.user.upsert({
    where: { email: 'partner1@vehiclerent.vn' },
    update: {},
    create: {
      email: 'partner1@vehiclerent.vn',
      passwordHash: defaultPassword,
      fullName: 'Trần Văn Thành',
      phone: '0902000002',
      role: 1, // 1: Partner
      status: true,
      bankAccountNum: '19036789999',
      bankName: 'Techcombank',
    },
  });

  await prisma.partnerWallet.upsert({
    where: { partnerId: partner1.id },
    update: {},
    create: {
      partnerId: partner1.id,
      balance: 2000000.0,
      creditLimit: 500000.0,
      status: 1,
    },
  });

  let store1 = await prisma.store.findFirst({
    where: { partnerId: partner1.id, storeName: 'Nhà Xe Thành Đạt - Chi Nhánh Cầu Giấy' },
  });
  if (!store1) {
    store1 = await prisma.store.create({
      data: {
        partnerId: partner1.id,
        storeName: 'Nhà Xe Thành Đạt - Chi Nhánh Cầu Giấy',
        address: '123 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
        phoneContact: '0902000002',
        description: 'Chuyên cho thuê xe máy đời mới, giao xe tận nơi khu vực Cầu Giấy, Nam Từ Liêm.',
        status: 'ACTIVE',
      },
    });
  }

  await prisma.rentalPolicy.upsert({
    where: { storeId: store1.id },
    update: {},
    create: {
      storeId: store1.id,
      depositPercent: 30.0,
      cancelRule: 'Hủy trước 24h hoàn cọc 100%. Hủy trong vòng 12-24h hoàn cọc 50%. Sau 12h không hoàn cọc.',
      refundCondition: 'Xe trả đúng hẹn, còn nguyên vẹn, đầy đủ giấy tờ và 2 mũ bảo hiểm.',
    },
  });

  // 3. Seed Partner 2 (Quận 3, TP.HCM)
  console.log('🏢 Seeding Partner 2 & Store 2...');
  const partner2 = await prisma.user.upsert({
    where: { email: 'partner2@vehiclerent.vn' },
    update: {},
    create: {
      email: 'partner2@vehiclerent.vn',
      passwordHash: defaultPassword,
      fullName: 'Lê Hoàng Long',
      phone: '0903000003',
      role: 1, // 1: Partner
      status: true,
      bankAccountNum: '0071001234567',
      bankName: 'Vietcombank',
    },
  });

  await prisma.partnerWallet.upsert({
    where: { partnerId: partner2.id },
    update: {},
    create: {
      partnerId: partner2.id,
      balance: 1500000.0,
      creditLimit: 500000.0,
      status: 1,
    },
  });

  let store2 = await prisma.store.findFirst({
    where: { partnerId: partner2.id, storeName: 'Dịch Vụ Thuê Xe Sài Gòn Phố' },
  });
  if (!store2) {
    store2 = await prisma.store.create({
      data: {
        partnerId: partner2.id,
        storeName: 'Dịch Vụ Thuê Xe Sài Gòn Phố',
        address: '456 Nguyễn Thị Minh Khai, Phường 5, Quận 3, TP. Hồ Chí Minh',
        phoneContact: '0903000003',
        description: 'Đa dạng các dòng xe tay ga cao cấp, xe côn tay phượt thể thao, thủ tục nhanh gọn.',
        status: 'ACTIVE',
      },
    });
  }

  await prisma.rentalPolicy.upsert({
    where: { storeId: store2.id },
    update: {},
    create: {
      storeId: store2.id,
      depositPercent: 25.0,
      cancelRule: 'Hủy trước 48h hoàn cọc 100%. Hủy trong vòng 24-48h phí hủy là 30% tiền cọc. Sau 24h không hoàn cọc.',
      refundCondition: 'Khách hàng hoàn trả xe đúng hạn, xe không vi phạm luật giao thông hoặc phạt nguội.',
    },
  });

  // 4. Seed 4 VehicleModels (2 for Store 1, 2 for Store 2) with 3 VehicleItems each
  console.log('🏍️ Seeding 4 Vehicle Models & 12 Vehicle Items...');

  // Model 1: Honda Air Blade (Store 1)
  let model1 = await prisma.vehicleModel.findFirst({
    where: { storeId: store1.id, name: 'Honda Air Blade 125cc 2024' },
  });
  if (!model1) {
    model1 = await prisma.vehicleModel.create({
      data: {
        storeId: store1.id,
        name: 'Honda Air Blade 125cc 2024',
        brand: 'Honda',
        type: 1, // 1: Tay ga
        rentPrice: 150000.0,
        specifications: 'Động cơ eSP+ 4 van 125cc, phanh CBS, khóa Smartkey, cốp rộng 23.2L, tiết kiệm xăng 2.14L/100km.',
        images: [
          'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80',
        ],
      },
    });
  }

  const model1Items = [
    { licensePlate: '29E2-888.12', color: 'Đỏ Đen', chassisNumber: 'RLHJK8801K001001' },
    { licensePlate: '29E2-888.34', color: 'Xanh Đen', chassisNumber: 'RLHJK8801K001002' },
    { licensePlate: '29E2-888.56', color: 'Bạc Xám', chassisNumber: 'RLHJK8801K001003' },
  ];
  for (const item of model1Items) {
    await prisma.vehicleItem.upsert({
      where: { licensePlate: item.licensePlate },
      update: {},
      create: {
        modelId: model1.id,
        licensePlate: item.licensePlate,
        color: item.color,
        chassisNumber: item.chassisNumber,
        status: 0, // Available
      },
    });
  }

  // Model 2: Honda Wave Alpha (Store 1)
  let model2 = await prisma.vehicleModel.findFirst({
    where: { storeId: store1.id, name: 'Honda Wave Alpha 110cc' },
  });
  if (!model2) {
    model2 = await prisma.vehicleModel.create({
      data: {
        storeId: store1.id,
        name: 'Honda Wave Alpha 110cc',
        brand: 'Honda',
        type: 0, // 0: Xe so
        rentPrice: 90000.0,
        specifications: 'Động cơ 110cc bền bỉ, tiết kiệm nhiên liệu tối đa 1.72L/100km, phù hợp sinh viên và đi làm.',
        images: [
          'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80',
        ],
      },
    });
  }

  const model2Items = [
    { licensePlate: '29B1-654.32', color: 'Trắng', chassisNumber: 'RLHJA0401L002001' },
    { licensePlate: '29B1-654.78', color: 'Xanh Đậm', chassisNumber: 'RLHJA0401L002002' },
    { licensePlate: '29B1-654.90', color: 'Đỏ', chassisNumber: 'RLHJA0401L002003' },
  ];
  for (const item of model2Items) {
    await prisma.vehicleItem.upsert({
      where: { licensePlate: item.licensePlate },
      update: {},
      create: {
        modelId: model2.id,
        licensePlate: item.licensePlate,
        color: item.color,
        chassisNumber: item.chassisNumber,
        status: 0, // Available
      },
    });
  }

  // Model 3: Yamaha Exciter 155 VVA (Store 2)
  let model3 = await prisma.vehicleModel.findFirst({
    where: { storeId: store2.id, name: 'Yamaha Exciter 155 VVA' },
  });
  if (!model3) {
    model3 = await prisma.vehicleModel.create({
      data: {
        storeId: store2.id,
        name: 'Yamaha Exciter 155 VVA',
        brand: 'Yamaha',
        type: 2, // 2: Con tay
        rentPrice: 180000.0,
        specifications: 'Động cơ 155cc van biến thiên VVA, côn tay 6 cấp số, bộ ly hợp chống trượt Assist & Slipper clutch.',
        images: [
          'https://images.unsplash.com/photo-1558981408-db0ecd8a1ee4?auto=format&fit=crop&w=800&q=80',
        ],
      },
    });
  }

  const model3Items = [
    { licensePlate: '59F1-923.45', color: 'Xanh GP', chassisNumber: 'RLC3C3011M003001' },
    { licensePlate: '59F1-923.88', color: 'Đen Nhám', chassisNumber: 'RLC3C3011M003002' },
    { licensePlate: '59F1-923.99', color: 'Đỏ Trắng', chassisNumber: 'RLC3C3011M003003' },
  ];
  for (const item of model3Items) {
    await prisma.vehicleItem.upsert({
      where: { licensePlate: item.licensePlate },
      update: {},
      create: {
        modelId: model3.id,
        licensePlate: item.licensePlate,
        color: item.color,
        chassisNumber: item.chassisNumber,
        status: 0, // Available
      },
    });
  }

  // Model 4: VinFast Feliz S (Store 2)
  let model4 = await prisma.vehicleModel.findFirst({
    where: { storeId: store2.id, name: 'VinFast Feliz S' },
  });
  if (!model4) {
    model4 = await prisma.vehicleModel.create({
      data: {
        storeId: store2.id,
        name: 'VinFast Feliz S',
        brand: 'VinFast',
        type: 3, // 3: Xe dien
        rentPrice: 130000.0,
        specifications: 'Động cơ Inhub 3000W, pin LFP 3.5kWh đi được 198km/lần sạc, chuẩn chống nước IP67.',
        images: [
          'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80',
        ],
      },
    });
  }

  const model4Items = [
    { licensePlate: '59E1-711.22', color: 'Trắng Ngọc Trai', chassisNumber: 'VNFELIZ2024001' },
    { licensePlate: '59E1-711.33', color: 'Đen Bóng', chassisNumber: 'VNFELIZ2024002' },
    { licensePlate: '59E1-711.44', color: 'Xám Xi Măng', chassisNumber: 'VNFELIZ2024003' },
  ];
  for (const item of model4Items) {
    await prisma.vehicleItem.upsert({
      where: { licensePlate: item.licensePlate },
      update: {},
      create: {
        modelId: model4.id,
        licensePlate: item.licensePlate,
        color: item.color,
        chassisNumber: item.chassisNumber,
        status: 0, // Available
      },
    });
  }

  // 5. Seed 2 Customer Accounts
  console.log('👥 Seeding 2 Customers...');
  const customer1 = await prisma.user.upsert({
    where: { email: 'customer1@gmail.com' },
    update: {},
    create: {
      email: 'customer1@gmail.com',
      passwordHash: defaultPassword,
      fullName: 'Nguyễn Hoàng Long',
      phone: '0911222333',
      role: 2, // 2: Customer
      status: true,
      driverLicense: 'B2-079198002134',
    },
  });

  const customer2 = await prisma.user.upsert({
    where: { email: 'customer2@gmail.com' },
    update: {},
    create: {
      email: 'customer2@gmail.com',
      passwordHash: defaultPassword,
      fullName: 'Phạm Thu Thảo',
      phone: '0988777666',
      role: 2, // 2: Customer
      status: true,
      driverLicense: 'A1-001199004567',
    },
  });

  console.log(`✅ Customer 1 created/verified: ${customer1.email} (${customer1.fullName})`);
  console.log(`✅ Customer 2 created/verified: ${customer2.email} (${customer2.fullName})`);

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

