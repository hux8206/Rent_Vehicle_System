import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Flow 4: Background Job quét hết hạn giữ chỗ
 * Chạy mỗi 1 phút: Tự động hủy các đơn PendingPayment đã quá holdExpiresAt
 * → Giải phóng xe về kho khả dụng cho khách khác
 */
@Injectable()
export class HoldExpiryJob {
  private readonly logger = new Logger(HoldExpiryJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredHolds() {
    const now = new Date();

    // Tìm tất cả đơn PendingPayment đã quá hạn giữ chỗ
    const expiredBookings = await this.prisma.booking.findMany({
      where: {
        status: 0,              // PendingPayment
        holdExpiresAt: { lte: now }, // Đã hết hạn 10 phút
      },
      select: {
        id: true,
        bookingCode: true,
        holdExpiresAt: true,
        bookingDetails: {
          select: { vehicleItemId: true },
        },
      },
    });

    if (expiredBookings.length === 0) return;

    this.logger.log(
      `[Flow 4] Tìm thấy ${expiredBookings.length} đơn hết hạn giữ chỗ. Đang hủy...`,
    );

    // Lấy danh sách ID các xe vật lý cần trả về Sẵn sàng (status = 0)
    const vehicleItemIdsToFree = expiredBookings
      .flatMap((b) => b.bookingDetails.map((d) => d.vehicleItemId))
      .filter((id): id is number => typeof id === 'number');

    await this.prisma.$transaction(async (tx) => {
      if (vehicleItemIdsToFree.length > 0) {
        await tx.vehicleItem.updateMany({
          where: {
            id: { in: vehicleItemIdsToFree },
            status: 1, // Chỉ trả về 0 nếu đang ở trạng thái 1 (Reserved)
          },
          data: { status: 0 }, // Sẵn sàng
        });
      }

      // Batch update: Chuyển tất cả sang Cancelled (status = 5)
      await tx.booking.updateMany({
        where: {
          id: { in: expiredBookings.map((b) => b.id) },
        },
        data: { status: 5 }, // Cancelled
      });
    });

    this.logger.log(
      `[Flow 4] Đã hủy ${expiredBookings.length} đơn hết hạn. Xe tự động trả về kho khả dụng (Available). ` +
        `Mã đơn: [${expiredBookings.map((b) => b.bookingCode).join(', ')}]`,
    );
  }
}

