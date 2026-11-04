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
      select: { id: true, bookingCode: true, holdExpiresAt: true },
    });

    if (expiredBookings.length === 0) return;

    this.logger.log(
      `[Flow 4] Tìm thấy ${expiredBookings.length} đơn hết hạn giữ chỗ. Đang hủy...`,
    );

    // Batch update: Chuyển tất cả sang Cancelled (status = 5)
    const result = await this.prisma.booking.updateMany({
      where: {
        status: 0,
        holdExpiresAt: { lte: now },
      },
      data: { status: 5 }, // Cancelled
    });

    this.logger.log(
      `[Flow 4] Đã hủy ${result.count} đơn hết hạn. Xe tự động trả về kho khả dụng. ` +
        `Mã đơn: [${expiredBookings.map((b) => b.bookingCode).join(', ')}]`,
    );
  }
}

