import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PayosService } from './payos.service';
import { DepositWalletDto } from './dto/payment.dto';

/** Hoa hồng sàn 10% */
const COMMISSION_RATE = 0.1;

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payos: PayosService,
    private readonly config: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Sinh link thanh toán VietQR cho đơn thuê xe (Customer)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lấy Payment của booking và sinh PayOS payment link động.
   * Trả về checkoutUrl để frontend hiển thị QR cho khách.
   */
  async getBookingPaymentLink(bookingId: number, customerId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy thông tin thanh toán');
    if (payment.booking.customerId !== customerId)
      throw new BadRequestException('Bạn không có quyền xem thanh toán này');
    if (payment.paymentStatus === 1)
      throw new BadRequestException('Đơn này đã được thanh toán');

    // orderCode phải là số nguyên — dùng payment.id
    const orderCode = payment.id;
    const amount = Math.round(Number(payment.amount));

    const paymentData = await this.payos.client.createPaymentLink({
      orderCode,
      amount,
      description: payment.transactionRef, // tối đa 25 ký tự, dùng làm nội dung CK
      returnUrl: this.config.get('PAYOS_RETURN_URL', 'http://localhost:3000/payment/success'),
      cancelUrl: this.config.get('PAYOS_CANCEL_URL', 'http://localhost:3000/payment/cancel'),
    });

    return {
      bookingId,
      transactionRef: payment.transactionRef,
      amount: payment.amount,
      checkoutUrl: paymentData.checkoutUrl,
      qrCode: paymentData.qrCode,
      expiredAt: payment.booking.holdExpiresAt,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Webhook PayOS — Nhận callback thanh toán (Flow 3 & Flow 5)
  // ─────────────────────────────────────────────────────────────────────────────

  async handleWebhook(body: any): Promise<{ success: boolean }> {
    // ── Xác thực chữ ký checksum từ PayOS ────────────────────────────────────
    let webhookData: any;
    try {
      webhookData = this.payos.client.verifyPaymentWebhookData(body);
    } catch {
      this.logger.warn('[Webhook] Chữ ký không hợp lệ — bỏ qua');
      return { success: false };
    }

    const { orderCode, code } = webhookData;

    // Chỉ xử lý giao dịch PAID (code = '00')
    if (code !== '00') {
      this.logger.log(`[Webhook] orderCode=${orderCode} — trạng thái: ${code} (bỏ qua)`);
      return { success: true };
    }

    // ── Phân loại orderCode: đơn thuê (Payment.id) hay nạp ví (WalletDeposit) ─
    // Quy ước: orderCode > 1_000_000 → nạp ví, còn lại → đơn thuê
    if (orderCode >= 1_000_000) {
      return this.processDepositWebhook(orderCode);
    }
    return this.processBookingPaymentWebhook(orderCode);
  }

  /**
   * Flow 3: Xử lý thanh toán đơn thuê thành công
   * orderCode = Payment.id
   */
  private async processBookingPaymentWebhook(
    orderCode: number,
  ): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      // Idempotency: Nếu payment đã Success thì bỏ qua
      const payment = await tx.payment.findUnique({ where: { id: orderCode } });
      if (!payment) {
        this.logger.warn(`[Flow3] Payment id=${orderCode} không tồn tại`);
        return { success: true };
      }
      if (payment.paymentStatus === 1) {
        this.logger.log(`[Flow3] Payment id=${orderCode} đã xử lý (idempotency)`);
        return { success: true };
      }

      // ── Cập nhật Payment → Success ────────────────────────────────────────
      await tx.payment.update({
        where: { id: orderCode },
        data: { paymentStatus: 1, paymentTime: new Date() },
      });

      // ── Lấy Booking kèm store ──────────────────────────────────────────────
      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId },
        include: { store: true },
      });
      if (!booking) return { success: true };

      // ── Kiểm tra hạn mức ví đối tác (BR4 / Flow 3) ───────────────────────
      const wallet = await tx.partnerWallet.findUnique({
        where: { partnerId: booking.store.partnerId },
      });
      if (!wallet) {
        this.logger.error(`[Flow3] Không tìm thấy ví Partner ${booking.store.partnerId}`);
        return { success: true };
      }

      const commission = Number(booking.commissionAmount);
      const balance = Number(wallet.balance);
      const creditLimit = Number(wallet.creditLimit);

      // Điều kiện: balance - commission >= -creditLimit
      if (balance - commission >= -creditLimit) {
        // ── ĐỦ HẠN MỨC → Confirmed + Trừ hoa hồng ────────────────────────
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 1 }, // Confirmed
        });

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
            description: `Trừ hoa hồng đơn ${booking.bookingCode}`,
          },
        });

        this.logger.log(
          `[Flow3] ✅ Booking #${booking.id} → Confirmed. Trừ hoa hồng ${commission}đ. Ví: ${balance} → ${newBalance}`,
        );
      } else {
        // ── THIẾU HẠN MỨC → WaitingQueue ─────────────────────────────────
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: 2 }, // WaitingQueue
        });

        this.logger.warn(
          `[Flow3] ⚠️  Booking #${booking.id} → WaitingQueue. Ví Partner không đủ hạn mức.`,
        );
      }

      return { success: true };
    });
  }

  /**
   * Flow 5: Xử lý nạp tiền ví Partner thành công
   * orderCode >= 1_000_000: encode partnerId + amount trong description
   */
  private async processDepositWebhook(
    orderCode: number,
  ): Promise<{ success: boolean }> {
    // Giải mã orderCode: 1_000_000 * partnerId + amount (đơn vị nghìn đồng)
    const partnerId = Math.floor(orderCode / 1_000_000);
    const depositAmount = (orderCode % 1_000_000) * 1000;

    this.logger.log(
      `[Flow5] Nạp ví — partnerId=${partnerId}, amount=${depositAmount}đ`,
    );

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.partnerWallet.findUnique({ where: { partnerId } });
      if (!wallet) {
        this.logger.error(`[Flow5] Không tìm thấy ví partnerId=${partnerId}`);
        return { success: true };
      }

      const oldBalance = Number(wallet.balance);
      const newBalance = oldBalance + depositAmount;

      // ── Cộng tiền vào ví ──────────────────────────────────────────────────
      await tx.partnerWallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.walletHistory.create({
        data: {
          walletId: wallet.id,
          type: 0, // Deposit
          amount: depositAmount,
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          description: `Nạp tiền vào ví qua PayOS (orderCode: ${orderCode})`,
        },
      });

      this.logger.log(`[Flow5] Ví Partner #${partnerId}: ${oldBalance} → ${newBalance}`);

      // ── Kích hoạt xử lý FIFO WaitingQueue ────────────────────────────────
      await this.processWaitingQueueFifo(tx, wallet.id, partnerId, newBalance, Number(wallet.creditLimit));

      return { success: true };
    });
  }

  /**
   * Flow 5 — FIFO: Duyệt danh sách đơn WaitingQueue của Partner theo createdAt ASC
   * Trừ hoa hồng và chuyển sang Confirmed lần lượt cho đến khi hết tiền
   */
  private async processWaitingQueueFifo(
    tx: any,
    walletId: number,
    partnerId: number,
    currentBalance: number,
    creditLimit: number,
  ): Promise<void> {
    // Lấy tất cả đơn WaitingQueue của Partner, sắp xếp FIFO (createdAt ASC)
    const waitingBookings = await tx.booking.findMany({
      where: {
        store: { partnerId },
        status: 2, // WaitingQueue
      },
      orderBy: { createdAt: 'asc' },
    });

    if (waitingBookings.length === 0) return;

    this.logger.log(
      `[Flow5-FIFO] Có ${waitingBookings.length} đơn WaitingQueue của Partner #${partnerId}`,
    );

    let runningBalance = currentBalance;

    for (const booking of waitingBookings) {
      const commission = Number(booking.commissionAmount);

      // Kiểm tra còn đủ hạn mức không
      if (runningBalance - commission < -creditLimit) {
        this.logger.log(
          `[Flow5-FIFO] Dừng tại Booking #${booking.id}: không đủ hạn mức. Break.`,
        );
        break; // Hết tiền — dừng vòng lặp theo đúng spec
      }

      const balanceBefore = runningBalance;
      runningBalance -= commission;

      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 1 }, // Confirmed
      });

      await tx.partnerWallet.update({
        where: { id: walletId },
        data: { balance: runningBalance },
      });

      await tx.walletHistory.create({
        data: {
          walletId,
          bookingId: booking.id,
          type: 1, // Commission_Deduction
          amount: commission,
          balanceBefore,
          balanceAfter: runningBalance,
          description: `[FIFO] Trừ hoa hồng đơn ${booking.bookingCode}`,
        },
      });

      this.logger.log(
        `[Flow5-FIFO] Booking #${booking.id} (${booking.bookingCode}) → Confirmed. Ví: ${balanceBefore} → ${runningBalance}`,
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Partner: Tạo link nạp tiền ví (Flow 5 — Deposit)
  // ─────────────────────────────────────────────────────────────────────────────

  async createDepositLink(partnerId: number, dto: DepositWalletDto) {
    const wallet = await this.prisma.partnerWallet.findUnique({ where: { partnerId } });
    if (!wallet) throw new NotFoundException('Không tìm thấy ví đối tác');
    if (wallet.status === 0) throw new BadRequestException('Ví đang bị đóng băng');

    // Quy ước orderCode: partnerId * 1_000_000 + amount/1000
    // (amount phải là bội số 1000, tối đa ~999 triệu)
    const amountInK = Math.floor(dto.amount / 1000);
    const orderCode = partnerId * 1_000_000 + amountInK;

    const paymentData = await this.payos.client.createPaymentLink({
      orderCode,
      amount: dto.amount,
      description: `NAP VI P${partnerId}`.substring(0, 25),
      returnUrl: this.config.get('PAYOS_RETURN_URL', 'http://localhost:3000/wallet/success'),
      cancelUrl: this.config.get('PAYOS_CANCEL_URL', 'http://localhost:3000/wallet/cancel'),
    });

    return {
      partnerId,
      currentBalance: wallet.balance,
      depositAmount: dto.amount,
      orderCode,
      checkoutUrl: paymentData.checkoutUrl,
      qrCode: paymentData.qrCode,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Partner: Xem ví và lịch sử giao dịch
  // ─────────────────────────────────────────────────────────────────────────────

  async getWallet(partnerId: number) {
    const wallet = await this.prisma.partnerWallet.findUnique({
      where: { partnerId },
      include: {
        histories: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!wallet) throw new NotFoundException('Không tìm thấy ví đối tác');
    return wallet;
  }

  async getWalletHistory(partnerId: number, page = 1, limit = 20) {
    const wallet = await this.prisma.partnerWallet.findUnique({ where: { partnerId } });
    if (!wallet) throw new NotFoundException('Không tìm thấy ví đối tác');

    const skip = (page - 1) * limit;
    const [histories, total] = await Promise.all([
      this.prisma.walletHistory.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          booking: { select: { bookingCode: true, startTime: true, endTime: true } },
        },
      }),
      this.prisma.walletHistory.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      wallet: {
        balance: wallet.balance,
        creditLimit: wallet.creditLimit,
        status: wallet.status,
      },
      histories,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}

