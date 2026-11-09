import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

const COMMISSION_RATE = 0.1; // 10% hoa hồng sàn

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Flow 2: Đặt xe & Giữ chỗ 10 phút
   * Kiểm tra availability, tạo Booking + BookingDetail + Payment
   */
  async create(customerId: number, dto: CreateBookingDto) {
    const { modelId, storeId, startTime, endTime, pickupType, deliveryAddress, paymentType } = dto;

    if (pickupType === 1 && !deliveryAddress) {
      throw new BadRequestException('Địa chỉ giao xe (deliveryAddress) là bắt buộc khi chọn Giao tận nơi');
    }

    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);

    if (isNaN(requestStart.getTime()) || isNaN(requestEnd.getTime())) {
      throw new BadRequestException('Thời gian nhận hoặc trả xe không hợp lệ');
    }

    if (requestStart >= requestEnd) {
      throw new BadRequestException('Thời gian trả xe phải sau thời gian nhận xe. Vui lòng chọn lại ngày trả xe.');
    }

    return this.prisma.$transaction(async (tx) => {
      // ── 1. Lấy thông tin dòng xe và cửa hàng ─────────────────────────────
      const model = await tx.vehicleModel.findUnique({
        where: { id: modelId },
        include: {
          store: {
            include: {
              rentalPolicy: true,
              partner: { select: { id: true, status: true } },
            },
          },
        },
      });
      if (!model) throw new NotFoundException('Dòng xe không tồn tại');
      if (model.storeId !== storeId) throw new BadRequestException('Dòng xe không thuộc cửa hàng này');
      if (model.store.status !== 1) {
        if (model.store.status === 3) {
          throw new BadRequestException('Chi nhánh này đang tạm ngưng hoạt động, không thể đặt xe vào lúc này');
        } else if (model.store.status === 4) {
          throw new BadRequestException('Chi nhánh này đang sửa chữa / bảo trì cơ sở vật chất, tạm dừng nhận đơn');
        } else {
          throw new BadRequestException('Cửa hàng hiện chưa được kích hoạt hoặc tạm ngưng hoạt động');
        }
      }

      // ── 2.1 Kiểm tra giờ hoạt động của cửa hàng (Requirement 1) ──────────
      const openTime = model.store.openTime || '07:00';
      const closeTime = model.store.closeTime || '21:00';

      const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
      };

      const extractMinutes = (dateStr: string, dateObj: Date) => {
        if (dateStr.includes('T') && !dateStr.endsWith('Z')) {
          const timePart = dateStr.split('T')[1].substring(0, 5);
          const [h, m] = timePart.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
        }
        const vnDate = new Date(dateObj.getTime() + 7 * 60 * 60 * 1000);
        return vnDate.getUTCHours() * 60 + vnDate.getUTCMinutes();
      };

      const startMinutes = extractMinutes(startTime, requestStart);
      const endMinutes = extractMinutes(endTime, requestEnd);
      const openMinutes = parseTime(openTime);
      const closeMinutes = parseTime(closeTime);

      const formatMinutes = (mins: number) => {
        const h = String(Math.floor(mins / 60)).padStart(2, '0');
        const m = String(mins % 60).padStart(2, '0');
        return `${h}:${m}`;
      };

      if (startMinutes < openMinutes || startMinutes > closeMinutes) {
        throw new BadRequestException(
          `Giờ nhận xe (${formatMinutes(startMinutes)}) ngoài khung giờ hoạt động của cửa hàng (${openTime} - ${closeTime}). Vui lòng chọn trong giờ hoạt động!`,
        );
      }

      if (endMinutes < openMinutes || endMinutes > closeMinutes) {
        throw new BadRequestException(
          `Giờ trả xe (${formatMinutes(endMinutes)}) ngoài khung giờ hoạt động của cửa hàng (${openTime} - ${closeTime}). Vui lòng chọn trong giờ hoạt động!`,
        );
      }
      if (model.store.partner && !model.store.partner.status) {
        throw new BadRequestException('Tài khoản đối tác của chi nhánh này đang bị khóa bởi hệ thống');
      }

      // ── 3. Tính xe khả dụng (Flow 1) — dùng raw query để tránh race-condition ──
      const totalActiveItems = await tx.vehicleItem.count({
        where: { modelId, status: { not: 3 } },
      });

      const busyCount = await tx.bookingDetail.count({
        where: {
          modelId,
          booking: {
            AND: [
              {
                OR: [
                  { status: { in: [1, 3] } },
                  { status: 0, holdExpiresAt: { gt: new Date() } },
                ],
              },
              { startTime: { lt: requestEnd } },
              { endTime: { gt: requestStart } },
            ],
          },
        },
      });

      const availableCount = totalActiveItems - busyCount;
      if (availableCount < 1) {
        throw new BadRequestException('XE_KHONG_KHA_DUNG: Không còn xe trống trong khoảng thời gian này');
      }

      // ── 4. Tính tiền ──────────────────────────────────────────────────────
      const diffHours = (requestEnd.getTime() - requestStart.getTime()) / (1000 * 60 * 60);
      const dayRent = Math.ceil(diffHours / 24);
      const rentPrice = Number(model.rentPrice);
      const rentAmount = dayRent * rentPrice;

      // Đọc cấu hình sàn: Mức cọc tối thiểu (mặc định 15%) & Tỷ lệ hoa hồng sàn (mặc định 10%)
      const sysConfig = await tx.systemConfig.findFirst();
      const minDepositPercent = sysConfig ? Number(sysConfig.minDepositPercent) : 15;
      const commissionRate = sysConfig ? Number(sysConfig.commissionRate) / 100 : COMMISSION_RATE;

      const storeDepositPercent = model.store.rentalPolicy
        ? Number(model.store.rentalPolicy.depositPercent)
        : minDepositPercent;
      // Đảm bảo mức cọc của đơn luôn >= mức cọc tối thiểu do Admin quy định
      const effectiveDepositPercent = Math.max(minDepositPercent, storeDepositPercent);

      const depositAmount =
        paymentType === 1 ? (rentAmount * effectiveDepositPercent) / 100 : rentAmount;
      const commissionAmount = rentAmount * commissionRate;

      // ── 5. Sinh bookingCode ───────────────────────────────────────────────
      const now = new Date();
      const yyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const rand = Math.floor(Math.random() * 9000) + 1000;
      const bookingCode = `BK-${yyymm}-${rand}`;

      // ── 6. Tạo Booking với holdExpiresAt = NOW() + 10 phút ───────────────
      const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          customerId,
          storeId,
          startTime: requestStart,
          endTime: requestEnd,
          pickupType,
          deliveryAddress,
          dayRent,
          rentAmount,
          depositAmount,
          commissionAmount,
          holdExpiresAt,
          status: 0, // PendingPayment
        },
      });

      // ── 7. Tìm 1 xe vật lý khả dụng (status = 0) để tạm giữ chỗ ──────────
      const availableItem = await tx.vehicleItem.findFirst({
        where: {
          modelId,
          status: 0, // Sẵn sàng (Available)
        },
      });

      // ── Tạo BookingDetail ────────────────────────────────────────────────
      await tx.bookingDetail.create({
        data: {
          bookingId: booking.id,
          modelId,
          vehicleItemId: availableItem ? availableItem.id : null,
          quantity: 1,
          pricePerUnit: rentPrice,
          subTotal: rentAmount,
        },
      });

      // Cập nhật trạng thái xe vật lý: Sẵn sàng (0) → Đang giữ (1: Reserved)
      if (availableItem) {
        await tx.vehicleItem.update({
          where: { id: availableItem.id },
          data: { status: 1 }, // Reserved
        });
      }

      // ── 8. Sinh transactionRef và tạo Payment ────────────────────────────
      const hex = Math.floor(Math.random() * 0xffff)
        .toString(16)
        .toUpperCase()
        .padStart(4, '0');
      const transactionRef = `TX${booking.id}_${hex}`;

      const payment = await tx.payment.create({
        data: {
          bookingId: booking.id,
          transactionRef,
          paymentMethod: 1, // BankTransfer / VietQR
          paymentType,
          amount: depositAmount,
          paymentStatus: 0, // Pending
        },
      });

      return {
        booking,
        payment: {
          transactionRef: payment.transactionRef,
          amount: payment.amount,
          paymentMethod: 'VietQR / Bank Transfer',
        },
        holdExpiresAt,
        message: `Giữ chỗ thành công! Vui lòng thanh toán trong 10 phút. Mã GD: ${transactionRef}`,
      };
    });
  }

  /** Lấy danh sách đơn thuê của Customer */
  async findMyBookings(customerId: number) {
    return this.prisma.booking.findMany({
      where: { customerId },
      include: {
        store: { select: { storeName: true, address: true } },
        bookingDetails: { include: { model: { select: { id: true, name: true, brand: true } } } },
        payments: { select: { transactionRef: true, amount: true, paymentStatus: true } },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Xem chi tiết 1 đơn thuê (Customer chỉ xem đơn của mình) */
  async findOne(customerId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        store: { include: { rentalPolicy: true } },
        bookingDetails: {
          include: {
            model: true,
            vehicleItem: { select: { licensePlate: true, color: true } },
          },
        },
        payments: true,
        review: true,
      },
    });
    if (!booking) throw new NotFoundException('Đơn thuê không tồn tại');
    if (booking.customerId !== customerId)
      throw new ForbiddenException('Bạn không có quyền xem đơn thuê này');
    return booking;
  }

  /** Customer hủy đơn (chỉ khi đang PendingPayment) */
  async cancelBooking(customerId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { bookingDetails: true },
    });
    if (!booking) throw new NotFoundException('Đơn thuê không tồn tại');
    if (booking.customerId !== customerId)
      throw new ForbiddenException('Bạn không có quyền hủy đơn thuê này');
    if (booking.status !== 0)
      throw new BadRequestException('Chỉ có thể hủy đơn đang ở trạng thái PendingPayment');

    return this.prisma.$transaction(async (tx) => {
      // Hoàn trả xe vật lý đã giữ về trạng thái Sẵn sàng (status = 0)
      const detail = booking.bookingDetails?.[0];
      if (detail?.vehicleItemId) {
        await tx.vehicleItem.updateMany({
          where: { id: detail.vehicleItemId, status: 1 },
          data: { status: 0 },
        });
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: { status: 5 }, // Cancelled
      });
    });
  }

  // ─── PARTNER APIs ─────────────────────────────────────────────────────────

  /** Partner xem tất cả đơn thuê thuộc stores của mình (có thể lọc theo chi nhánh) */
  async findPartnerBookings(partnerId: number, status?: number, storeId?: number) {
    return this.prisma.booking.findMany({
      where: {
        store: { partnerId },
        ...(storeId !== undefined && { storeId }),
        ...(status !== undefined && { status }),
      },
      include: {
        customer: { select: { fullName: true, phone: true } },
        store: { select: { storeName: true } },
        bookingDetails: { include: { model: { select: { name: true } }, vehicleItem: true } },
        payments: { select: { transactionRef: true, paymentStatus: true, amount: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Flow 6a: Partner bàn giao xe — gán biển số + chuyển sang ActiveRental */
  async handoverVehicle(partnerId: number, bookingId: number, vehicleItemId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { store: true, bookingDetails: true },
    });
    if (!booking) throw new NotFoundException('Đơn thuê không tồn tại');
    if (booking.store.partnerId !== partnerId)
      throw new ForbiddenException('Đơn thuê không thuộc cửa hàng của bạn');
    if (booking.status !== 1)
      throw new BadRequestException('Đơn phải ở trạng thái Confirmed (1) mới có thể bàn giao xe');

    const detail = booking.bookingDetails[0];
    const vehicleItem = await this.prisma.vehicleItem.findUnique({ where: { id: vehicleItemId } });
    if (!vehicleItem) throw new NotFoundException('Xe (biển số) không tồn tại');
    if (vehicleItem.modelId !== detail.modelId)
      throw new BadRequestException('Biển số xe không thuộc dòng xe trong đơn');

    // Cho phép xe đang ở trạng thái Available (0) HOẶC xe đang được giữ riêng cho đơn này (1)
    const isPreAssigned = vehicleItem.status === 1 && detail.vehicleItemId === vehicleItem.id;
    if (vehicleItem.status !== 0 && !isPreAssigned) {
      throw new BadRequestException('Xe này không ở trạng thái sẵn sàng hoặc đang giữ cho đơn này');
    }

    return this.prisma.$transaction(async (tx) => {
      // Nếu nhân viên chọn bàn giao xe khác xe đã giữ ban đầu, hoàn trả xe cũ về Sẵn sàng (0)
      if (detail.vehicleItemId && detail.vehicleItemId !== vehicleItemId) {
        await tx.vehicleItem.update({
          where: { id: detail.vehicleItemId },
          data: { status: 0 },
        });
      }

      await tx.bookingDetail.update({
        where: { id: detail.id },
        data: { vehicleItemId },
      });
      await tx.vehicleItem.update({
        where: { id: vehicleItemId },
        data: { status: 2 }, // Rented
      });

      // ── Khấu trừ hoa hồng sàn khi XÁC NHẬN KHÁCH ĐÃ NHẬN XE ───────────────
      // Chỉ khi đối tác bàn giao xe thành công thì sàn mới trừ hoa hồng.
      // Nếu khách không nhận xe thì tiền cọc vẫn thuộc về đối tác mà không bị trừ hoa hồng.
      const commission = Number(booking.commissionAmount);
      if (commission > 0) {
        const wallet = await tx.partnerWallet.findUnique({
          where: { partnerId: booking.store.partnerId },
        });
        if (wallet) {
          const balance = Number(wallet.balance);
          const newBalance = balance - commission;
          await tx.partnerWallet.update({
            where: { id: wallet.id },
            data: { balance: newBalance },
          });
          await tx.walletHistory.create({
            data: {
              walletId: wallet.id,
              bookingId: booking.id,
              type: 1, // Commission_Deduction
              amount: commission,
              balanceBefore: balance,
              balanceAfter: newBalance,
              description: `Khấu trừ hoa hồng sàn đơn ${booking.bookingCode} (${commission.toLocaleString('vi-VN')} đ) sau khi bàn giao xe`,
            },
          });
        }
      }

      return tx.booking.update({
        where: { id: bookingId },
        data: { status: 3 }, // ActiveRental
      });
    });
  }

  /** Flow 6b: Partner xác nhận khách trả xe — hoàn thành đơn */
  async completeBooking(partnerId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { store: true, bookingDetails: { include: { vehicleItem: true } } },
    });
    if (!booking) throw new NotFoundException('Đơn thuê không tồn tại');
    if (booking.store.partnerId !== partnerId)
      throw new ForbiddenException('Đơn thuê không thuộc cửa hàng của bạn');
    if (booking.status !== 3)
      throw new BadRequestException('Đơn phải ở trạng thái ActiveRental (3) mới có thể hoàn thành');

    const detail = booking.bookingDetails[0];

    return this.prisma.$transaction(async (tx) => {
      if (detail?.vehicleItemId) {
        await tx.vehicleItem.update({
          where: { id: detail.vehicleItemId },
          data: { status: 0 }, // Available
        });
      }
      return tx.booking.update({
        where: { id: bookingId },
        data: { status: 4 }, // Completed
      });
    });
  }

  /** Viết đánh giá chuyến đi (Customer) */
  async createReview(
    customerId: number,
    bookingId: number,
    dto: { rateStar: number; comment?: string },
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });
    if (!booking) throw new NotFoundException('Đơn thuê không tồn tại');
    if (booking.customerId !== customerId)
      throw new ForbiddenException('Bạn không có quyền đánh giá đơn này');
    if (booking.status !== 4)
      throw new BadRequestException('Chỉ có thể đánh giá chuyến đi sau khi đã hoàn thành trả xe');
    if (booking.review)
      throw new BadRequestException('Đơn thuê này đã được gửi đánh giá');

    return this.prisma.review.create({
      data: {
        bookingId,
        customerId,
        storeId: booking.storeId,
        rateStar: Math.min(5, Math.max(1, dto.rateStar)),
        comment: dto.comment,
      },
    });
  }

  /** Lấy danh sách đánh giá toàn sàn (Admin) */
  async findAllReviews() {
    return this.prisma.review.findMany({
      include: {
        customer: { select: { fullName: true, phone: true } },
        store: { select: { storeName: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  /** Ẩn đánh giá vi phạm (Admin) */
  async hideReview(reviewId: number, hiddenReason: string) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: true, hiddenReason },
    });
  }

  /** Mở lại đánh giá (Admin) */
  async unhideReview(reviewId: number) {
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: false, hiddenReason: null },
    });
  }

  /** Thống kê toàn sàn thực tế 100% từ cơ sở dữ liệu (Admin) */
  async getPlatformStats() {
    const [allBookings, allModels, allStores] = await Promise.all([
      this.prisma.booking.findMany({
        include: {
          bookingDetails: {
            include: {
              model: true,
              vehicleItem: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicleModel.findMany({
        include: {
          vehicleItems: true,
        },
      }),
      this.prisma.store.findMany(),
    ]);

    // 1. Doanh thu (GMV) & Hoa hồng thực tế sàn
    // GMV: Tổng rentAmount từ các đơn Confirmed (1), ActiveRental (3), Completed (4)
    const validBookings = allBookings.filter((b) => [1, 3, 4].includes(b.status));
    const totalRevenue = validBookings.reduce(
      (sum, b) => sum + Number(b.rentAmount || 0),
      0
    );

    // Hoa hồng sàn: Khấu trừ khi xe đã được bàn giao cho khách (status 3 hoặc 4)
    const handedOverBookings = allBookings.filter((b) => [3, 4].includes(b.status));
    const totalCommission = handedOverBookings.reduce(
      (sum, b) => sum + Number(b.commissionAmount || 0),
      0
    );

    // 2. Cửa hàng đối tác
    const totalStores = allStores.length;
    const approvedStores = allStores.filter((s) => s.status === 1).length;
    const pendingStores = allStores.filter((s) => s.status === 0).length;
    const rejectedStores = allStores.filter((s) => s.status === 2).length;

    // 3. Đội xe vật lý toàn hệ thống
    const allVehicleItems = allModels.flatMap((m) => m.vehicleItems || []);
    const totalVehicles = allVehicleItems.length;
    const availableVehicles = allVehicleItems.filter((v) => v.status === 0).length;
    const reservedVehicles = allVehicleItems.filter((v) => v.status === 1).length;
    const rentedVehicles = allVehicleItems.filter((v) => v.status === 2).length;
    const maintenanceVehicles = allVehicleItems.filter((v) => v.status === 3).length;
    const occupancyRate =
      totalVehicles > 0 ? Math.round((rentedVehicles / totalVehicles) * 100) : 0;

    // 4. Phân bổ trạng thái đơn đặt
    // 0: PendingPayment, 1: Confirmed, 2: WaitingQueue, 3: ActiveRental, 4: Completed, 5: Cancelled
    const statusCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const b of allBookings) {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status]++;
      }
    }
    const totalB = allBookings.length;
    const bookingStatusBreakdown = [
      {
        name: 'Đã hoàn tất',
        status: 4,
        count: statusCounts[4],
        value: totalB > 0 ? Math.round((statusCounts[4] / totalB) * 100) : 0,
        color: '#10B981', // emerald
      },
      {
        name: 'Đang cho thuê',
        status: 3,
        count: statusCounts[3],
        value: totalB > 0 ? Math.round((statusCounts[3] / totalB) * 100) : 0,
        color: '#3B82F6', // blue
      },
      {
        name: 'Chờ bàn giao',
        status: 1,
        count: statusCounts[1],
        value: totalB > 0 ? Math.round((statusCounts[1] / totalB) * 100) : 0,
        color: '#06B6D4', // cyan
      },
      {
        name: 'Hàng chờ FIFO',
        status: 2,
        count: statusCounts[2],
        value: totalB > 0 ? Math.round((statusCounts[2] / totalB) * 100) : 0,
        color: '#8B5CF6', // purple
      },
      {
        name: 'Chờ thanh toán',
        status: 0,
        count: statusCounts[0],
        value: totalB > 0 ? Math.round((statusCounts[0] / totalB) * 100) : 0,
        color: '#F59E0B', // amber
      },
      {
        name: 'Đã hủy',
        status: 5,
        count: statusCounts[5],
        value: totalB > 0 ? Math.round((statusCounts[5] / totalB) * 100) : 0,
        color: '#EF4444', // rose
      },
    ];

    // 5. Phân bổ theo loại phương tiện
    // 0: Xe số, 1: Tay ga, 2: Côn tay, 3: Xe điện/Khác
    const typeNames: Record<number, string> = {
      0: 'Xe số',
      1: 'Xe tay ga',
      2: 'Côn tay',
      3: 'Xe điện',
    };
    const vehicleCategoryDistribution = [0, 1, 2, 3].map((type) => {
      const modelsOfType = allModels.filter((m) => m.type === type);
      const items = modelsOfType.flatMap((m) => m.vehicleItems || []);
      const total = items.length;
      const rented = items.filter((i) => i.status === 2).length;
      return {
        category: typeNames[type] || `Loại ${type}`,
        type,
        total,
        rented,
      };
    });

    // 6. Doanh thu & hoa hồng 6 tháng gần nhất thực tế
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const monthLabel = `T${m}/${y}`;

      const monthBookings = allBookings.filter((b) => {
        const bDate = new Date(b.createdAt);
        return bDate.getFullYear() === y && bDate.getMonth() + 1 === m;
      });

      const monthValidBookings = monthBookings.filter((b) => [1, 3, 4].includes(b.status));
      const monthHandedOver = monthBookings.filter((b) => [3, 4].includes(b.status));

      const rev = monthValidBookings.reduce((sum, b) => sum + Number(b.rentAmount || 0), 0);
      const comm = monthHandedOver.reduce((sum, b) => sum + Number(b.commissionAmount || 0), 0);

      months.push({
        month: monthLabel,
        revenue: rev,
        commission: comm,
        bookings: monthBookings.length,
      });
    }

    return {
      totalRevenue,
      totalCommission,
      totalBookings: allBookings.length,
      totalStores,
      approvedStores,
      pendingStores,
      rejectedStores,
      totalVehicles,
      availableVehicles,
      rentedVehicles,
      reservedVehicles,
      maintenanceVehicles,
      occupancyRate,
      revenueTrend: months,
      bookingStatusBreakdown,
      vehicleCategoryDistribution,
    };
  }

  /** Lấy toàn bộ đơn thuê toàn hệ thống (Admin) */
  async findAllBookingsForAdmin() {
    return this.prisma.booking.findMany({
      include: {
        customer: { select: { id: true, fullName: true, email: true, phone: true } },
        store: { select: { id: true, storeName: true, address: true, phoneContact: true } },
        bookingDetails: {
          include: {
            model: { select: { id: true, name: true, brand: true, type: true, rentPrice: true } },
            vehicleItem: { select: { id: true, licensePlate: true, color: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

