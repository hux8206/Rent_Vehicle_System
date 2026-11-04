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
   * Lưu driverLicenseFront/Back vào User, kiểm tra availability, tạo Booking + BookingDetail + Payment
   */
  async create(customerId: number, dto: CreateBookingDto) {
    const { modelId, storeId, startTime, endTime, pickupType, deliveryAddress, paymentType } = dto;

    if (pickupType === 1 && !deliveryAddress) {
      throw new BadRequestException('Địa chỉ giao xe (deliveryAddress) là bắt buộc khi chọn Giao tận nơi');
    }

    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);

    if (requestStart >= requestEnd) {
      throw new BadRequestException('startTime phải nhỏ hơn endTime');
    }

    return this.prisma.$transaction(async (tx) => {
      // ── 1. Lưu ảnh GPLX vào User (cập nhật profile) ──────────────────────
      await tx.user.update({
        where: { id: customerId },
        data: {
          driverLicenseFront: dto.driverLicenseFront,
          driverLicenseBack: dto.driverLicenseBack,
        },
      });

      // ── 2. Lấy thông tin dòng xe và cửa hàng ─────────────────────────────
      const model = await tx.vehicleModel.findUnique({
        where: { id: modelId },
        include: { store: { include: { rentalPolicy: true } } },
      });
      if (!model) throw new NotFoundException('Dòng xe không tồn tại');
      if (model.storeId !== storeId) throw new BadRequestException('Dòng xe không thuộc cửa hàng này');
      if (model.store.status !== 1) throw new BadRequestException('Cửa hàng tạm ngưng hoạt động');

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

      const depositPercent = model.store.rentalPolicy
        ? Number(model.store.rentalPolicy.depositPercent)
        : 30;
      const depositAmount =
        paymentType === 1 ? (rentAmount * depositPercent) / 100 : rentAmount;
      const commissionAmount = rentAmount * COMMISSION_RATE;

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

      // ── 7. Tạo BookingDetail ──────────────────────────────────────────────
      await tx.bookingDetail.create({
        data: {
          bookingId: booking.id,
          modelId,
          quantity: 1,
          pricePerUnit: rentPrice,
          subTotal: rentAmount,
        },
      });

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
        bookingDetails: { include: { model: { select: { name: true, brand: true } } } },
        payments: { select: { transactionRef: true, amount: true, paymentStatus: true } },
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
      },
    });
    if (!booking) throw new NotFoundException('Đơn thuê không tồn tại');
    if (booking.customerId !== customerId)
      throw new ForbiddenException('Bạn không có quyền xem đơn thuê này');
    return booking;
  }

  /** Customer hủy đơn (chỉ khi đang PendingPayment) */
  async cancelBooking(customerId: number, bookingId: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Đơn thuê không tồn tại');
    if (booking.customerId !== customerId)
      throw new ForbiddenException('Bạn không có quyền hủy đơn thuê này');
    if (booking.status !== 0)
      throw new BadRequestException('Chỉ có thể hủy đơn đang ở trạng thái PendingPayment');

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 5 }, // Cancelled
    });
  }

  // ─── PARTNER APIs ─────────────────────────────────────────────────────────

  /** Partner xem tất cả đơn thuê thuộc stores của mình */
  async findPartnerBookings(partnerId: number, status?: number) {
    return this.prisma.booking.findMany({
      where: {
        store: { partnerId },
        ...(status !== undefined && { status }),
      },
      include: {
        customer: { select: { fullName: true, phone: true, driverLicenseFront: true, driverLicenseBack: true } },
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
    if (vehicleItem.status !== 0)
      throw new BadRequestException('Xe này không ở trạng thái Available');

    return this.prisma.$transaction(async (tx) => {
      await tx.bookingDetail.update({
        where: { id: detail.id },
        data: { vehicleItemId },
      });
      await tx.vehicleItem.update({
        where: { id: vehicleItemId },
        data: { status: 2 }, // Rented
      });
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
}

