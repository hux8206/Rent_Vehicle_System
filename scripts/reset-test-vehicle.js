const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  // 1. Ensure test vehicle model exists with exactly 1 item
  let model = await prisma.vehicleModel.findFirst({
    where: { name: 'Honda SH 150i ABS (K6 Single-Slot Test)' },
    include: { vehicleItems: true },
  });

  if (!model) {
    model = await prisma.vehicleModel.create({
      data: {
        storeId: 1,
        name: 'Honda SH 150i ABS (K6 Single-Slot Test)',
        brand: 'Honda',
        type: 1,
        rentPrice: 200000,
        specifications: JSON.stringify({ engine: '150cc', fuel: 'Xăng' }),
        vehicleItems: {
          create: [{ licensePlate: '29-K6-88888', color: 'Đen Nhám', status: 0 }],
        },
      },
      include: { vehicleItems: true },
    });
  } else {
    // Ensure item status is 0 (Available)
    await prisma.vehicleItem.updateMany({
      where: { modelId: model.id },
      data: { status: 0 },
    });
  }

  // 2. Clear any existing bookings for this model
  const details = await prisma.bookingDetail.findMany({ where: { modelId: model.id } });
  if (details.length > 0) {
    const bookingIds = details.map((d) => d.bookingId);
    await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.bookingDetail.deleteMany({ where: { modelId: model.id } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
  }

  console.log(`[RESET] Vehicle Model ID: ${model.id} is clean and ready. Single vehicle item: ${model.vehicleItems.length}`);
  await prisma.$disconnect();
}

reset().catch((e) => {
  console.error(e);
  process.exit(1);
});

