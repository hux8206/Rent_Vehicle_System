import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { PayosService } from './payos.service';
import { DepositWalletDto } from './dto/payment.dto';

/** Hoa hồng sàn 10% */
const COMMISSION_RATE = 0.1;

import { CreatePayoutRequestDto, ReviewPayoutDto } from './dto/payout.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly bookingPaymentCache = new Map<number, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly payos: PayosService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Chuyển đổi mã VietQR thô (chuỗi EMVCo 00020101...) thành ảnh Base64 Data URL (data:image/png;base64,...),
   * giúp thẻ <img> của trình duyệt hiển thị lập tức và app ngân hàng quét được 100%.
   */
  private async formatQrCode(
    rawQr: string,
    bin?: string,
    accountNumber?: string,
    amount?: number,
    description?: string,
    accountName?: string,
  ): Promise<string> {
    if (!rawQr) {
      if (bin && accountNumber) {
        return `https://img.vietqr.io/image/${bin}-${accountNumber}-compact2.png?amount=${amount || 0}&addInfo=${encodeURIComponent(description || '')}&accountName=${encodeURIComponent(accountName || '')}`;
      }
      return '';
    }
    if (rawQr.startsWith('data:') || rawQr.startsWith('http://') || rawQr.startsWith('https://')) {
      return rawQr;
    }
    try {
      return await QRCode.toDataURL(rawQr, {
        margin: 1,
        width: 360,
        errorCorrectionLevel: 'M',
      });
    } catch (err) {
      this.logger.warn(`Could not convert raw VietQR to DataURL: ${err}`);
      if (bin && accountNumber) {
        return `https://img.vietqr.io/image/${bin}-${accountNumber}-compact2.png?amount=${amount || 0}&addInfo=${encodeURIComponent(description || '')}&accountName=${encodeURIComponent(accountName || '')}`;
      }
      return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(rawQr)}`;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Sinh link thanh toán VietQR cho đơn thuê xe (Customer)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Lấy Payment của booking và sinh PayOS payment link động.
   * Trả về checkoutUrl và qrCode ảnh base64 để frontend hiển thị QR cho khách.
   */
  async getBookingPaymentLink(bookingId: number, customerId: number) {
    const payment = await this.prisma.payment.findFirst({
      where: { bookingId },
      include: { booking: true },
    });
    if (!payment) throw new NotFoundException('Không tìm thấy thông tin thanh toán');
    if (payment.booking.customerId !== customerId)
      throw new ForbiddenException('Bạn không có quyền xem thông tin thanh toán này');
    if (payment.paymentStatus === 1)
      throw new BadRequestException('Đơn này đã được thanh toán');

    // Kiểm tra cache để tránh gọi lặp lại PayOS bị lỗi "Đơn thanh toán đã tồn tại"
    const cached = this.bookingPaymentCache.get(payment.id);
    if (cached) {
      return cached;
    }

    const amount = Math.round(Number(payment.amount));
    let orderCode = payment.id;
    let paymentData: any;

    try {
      paymentData = await this.payos.createPaymentLink({
        orderCode,
        amount,
        description: payment.transactionRef.substring(0, 25),
        returnUrl: this.config.get('PAYOS_RETURN_URL', 'http://localhost:3000/payment/success'),
        cancelUrl: this.config.get('PAYOS_CANCEL_URL', 'http://localhost:3000/payment/cancel'),
      });
    } catch (err: any) {
      this.logger.warn(`createPaymentLink with orderCode=${orderCode} failed (${err.message}). Retrying with unique orderCode...`);
      // PayOS mã lỗi 231: Đơn thanh toán đã tồn tại. Tạo orderCode duy nhất bằng suffix
      orderCode = payment.id * 1000 + (Math.floor(Date.now() / 1000) % 900 + 100);
      paymentData = await this.payos.createPaymentLink({
        orderCode,
        amount,
        description: payment.transactionRef.substring(0, 25),
        returnUrl: this.config.get('PAYOS_RETURN_URL', 'http://localhost:3000/payment/success'),
        cancelUrl: this.config.get('PAYOS_CANCEL_URL', 'http://localhost:3000/payment/cancel'),
      });
    }

    // Render mã QR sang ảnh Base64
    const qrImage = await this.formatQrCode(
      paymentData.qrCode,
      paymentData.bin,
      paymentData.accountNumber,
      amount,
      payment.transactionRef,
      paymentData.accountName,
    );

    const result = {
      bookingId,
      transactionRef: payment.transactionRef,
      amount: payment.amount,
      checkoutUrl: paymentData.checkoutUrl,
      qrCode: qrImage,
      accountNumber: paymentData.accountNumber,
      accountName: paymentData.accountName,
      bin: paymentData.bin,
      orderCode,
      expiredAt: payment.booking.holdExpiresAt,
    };

    this.bookingPaymentCache.set(payment.id, result);
    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Webhook PayOS — Nhận callback thanh toán (Flow 3 & Flow 5)
  // ─────────────────────────────────────────────────────────────────────────────

  async handleWebhook(body: any): Promise<{ success: boolean }> {
    // ── Xác thực chữ ký checksum từ PayOS ────────────────────────────────────
    let webhookData: any;
    try {
      webhookData = await this.payos.verifyWebhook(body);
    } catch {
      this.logger.warn('[Webhook] Chữ ký không hợp lệ — từ chối');
      throw new BadRequestException('Chữ ký webhook không hợp lệ');
    }

    const { orderCode, code } = webhookData;

    // Chỉ xử lý giao dịch PAID (code = '00')
    if (code !== '00') {
      this.logger.log(`[Webhook] orderCode=${orderCode} — trạng thái: ${code} (bỏ qua)`);
      return { success: true };
    }

    // ── Phân loại orderCode: đơn thuê hay nạp ví ───────────────────────────
    if (orderCode >= 1_000_000) {
      return this.processDepositWebhook(orderCode, webhookData);
    }
    return this.processBookingPaymentWebhook(orderCode, webhookData);
  }

  /**
   * Flow 3: Xử lý thanh toán đơn thuê thành công
   */
  private async processBookingPaymentWebhook(
    orderCode: number,
    webhookData?: any,
  ): Promise<{ success: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      // Tìm payment: theo id gốc hoặc orderCode phân rã hoặc transactionRef
      let payment = await tx.payment.findUnique({ where: { id: orderCode } });
      if (!payment && orderCode >= 1000) {
        const derivedId = Math.floor(orderCode / 1000);
        payment = await tx.payment.findUnique({ where: { id: derivedId } });
      }
      if (!payment && webhookData?.description) {
        payment = await tx.payment.findUnique({ where: { transactionRef: webhookData.description } });
      }

      if (!payment) {
        this.logger.warn(`[Flow3] Payment id=${orderCode} không tồn tại`);
        return { success: true };
      }
      if (payment.paymentStatus === 1) {
        this.logger.log(`[Flow3] Payment id=${payment.id} đã xử lý (idempotency)`);
        return { success: true };
      }

      // Xóa cache khi thanh toán xong
      this.bookingPaymentCache.delete(payment.id);

      // ── Cập nhật Payment → Success ────────────────────────────────────────
      await tx.payment.update({
        where: { id: payment.id },
        data: { paymentStatus: 1, paymentTime: new Date() },
      });

      // ── Lấy Booking kèm store ──────────────────────────────────────────────
      const booking = await tx.booking.findUnique({
        where: { id: payment.bookingId },
        include: { store: true },
      });
      if (!booking) return { success: true };

      // ── Lấy ví đối tác ───────────────────────────────────────────────────
      const wallet = await tx.partnerWallet.findUnique({
        where: { partnerId: booking.store.partnerId },
      });
      if (!wallet) {
        this.logger.error(`[Flow3] Không tìm thấy ví Partner ${booking.store.partnerId}`);
        return { success: true };
      }

      // ── Cập nhật Booking → Confirmed ──────────────────────────────────────
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: 1 }, // Confirmed
      });

      // ── Đảm bảo xe vật lý được gán & ở trạng thái Đang giữ (1: Reserved) ──
      const bookingDetail = await tx.bookingDetail.findFirst({
        where: { bookingId: booking.id },
      });
      if (bookingDetail) {
        if (bookingDetail.vehicleItemId) {
          await tx.vehicleItem.updateMany({
            where: { id: bookingDetail.vehicleItemId, status: 0 },
            data: { status: 1 }, // Reserved
          });
        } else {
          const availableItem = await tx.vehicleItem.findFirst({
            where: { modelId: bookingDetail.modelId, status: 0 },
          });
          if (availableItem) {
            await tx.bookingDetail.update({
              where: { id: bookingDetail.id },
              data: { vehicleItemId: availableItem.id },
            });
            await tx.vehicleItem.update({
              where: { id: availableItem.id },
              data: { status: 1 }, // Reserved
            });
          }
        }
      }

      // ── Cộng toàn bộ số tiền khách đã thanh toán vào Ví Đối Tác ───────────
      const paidAmount = Number(payment.amount);
      const balance = Number(wallet.balance);
      const newBalance = balance + paidAmount;

      await tx.partnerWallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.walletHistory.create({
        data: {
          walletId: wallet.id,
          bookingId: booking.id,
          type: 0, // Deposit / Revenue_Credit
          amount: paidAmount,
          balanceBefore: balance,
          balanceAfter: newBalance,
          description: `Cộng tiền thanh toán đơn ${booking.bookingCode} (+${paidAmount.toLocaleString('vi-VN')} đ)`,
        },
      });

      this.logger.log(
        `[Flow3] ✅ Booking #${booking.id} → Confirmed. Đã cộng ${paidAmount}đ vào ví Partner ${booking.store.partnerId}. Ví: ${balance} → ${newBalance}`,
      );

      return { success: true };
    });
  }

  /**
   * Flow 5: Xử lý nạp tiền ví Partner thành công
   * orderCode >= 1_000_000: encode partnerId + amount trong description
   */
  private async processDepositWebhook(
    orderCode: number,
    webhookData?: any,
  ): Promise<{ success: boolean }> {
    let partnerId: number;
    let depositAmount: number;

    if (orderCode >= 100_000_000) {
      // Chuẩn orderCode mới: 100_000_000 + partnerId * 100_000 + suffix
      partnerId = Math.floor((orderCode - 100_000_000) / 100_000);
      depositAmount = webhookData?.amount || 0;
    } else {
      // Legacy format: 1_000_000 * partnerId + amount/1000
      partnerId = Math.floor(orderCode / 1_000_000);
      depositAmount = webhookData?.amount || (orderCode % 1_000_000) * 1000;
    }

    this.logger.log(
      `[Flow5] Nạp ví — partnerId=${partnerId}, amount=${depositAmount}đ, orderCode=${orderCode}`,
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

      // ── Đảm bảo xe vật lý được gán & ở trạng thái Đang giữ (1: Reserved) ──
      const queueDetail = await tx.bookingDetail.findFirst({
        where: { bookingId: booking.id },
      });
      if (queueDetail) {
        if (queueDetail.vehicleItemId) {
          await tx.vehicleItem.updateMany({
            where: { id: queueDetail.vehicleItemId, status: 0 },
            data: { status: 1 },
          });
        } else {
          const availableItem = await tx.vehicleItem.findFirst({
            where: { modelId: queueDetail.modelId, status: 0 },
          });
          if (availableItem) {
            await tx.bookingDetail.update({
              where: { id: queueDetail.id },
              data: { vehicleItemId: availableItem.id },
            });
            await tx.vehicleItem.update({
              where: { id: availableItem.id },
              data: { status: 1 },
            });
          }
        }
      }

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

    // Sinh orderCode duy nhất: 100_000_000 + partnerId * 100_000 + (epochSeconds % 100_000)
    // Giúp không bao giờ trùng orderCode trên PayOS dù nạp cùng số tiền nhiều lần
    const suffix = Math.floor(Date.now() / 1000) % 100_000;
    const orderCode = 100_000_000 + partnerId * 100_000 + suffix;
    const description = `NAP VI P${partnerId}`.substring(0, 25);

    const paymentData = await this.payos.createPaymentLink({
      orderCode,
      amount: dto.amount,
      description,
      returnUrl: this.config.get('PAYOS_RETURN_URL', 'http://localhost:3000/wallet/success'),
      cancelUrl: this.config.get('PAYOS_CANCEL_URL', 'http://localhost:3000/wallet/cancel'),
    });

    const qrImage = await this.formatQrCode(
      paymentData.qrCode,
      paymentData.bin,
      paymentData.accountNumber,
      dto.amount,
      description,
      paymentData.accountName,
    );

    return {
      partnerId,
      currentBalance: wallet.balance,
      depositAmount: dto.amount,
      orderCode,
      checkoutUrl: paymentData.checkoutUrl,
      qrCode: qrImage,
      accountNumber: paymentData.accountNumber,
      accountName: paymentData.accountName,
      bin: paymentData.bin,
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

  async getWalletHistory(partnerId: number, page = 1, limit = 20, storeId?: number) {
    const wallet = await this.prisma.partnerWallet.findUnique({ where: { partnerId } });
    if (!wallet) throw new NotFoundException('Không tìm thấy ví đối tác');

    const skip = (page - 1) * limit;
    const whereClause: any = { walletId: wallet.id };
    if (storeId) {
      whereClause.booking = {
        storeId: storeId,
      };
    }

    const [histories, total] = await Promise.all([
      this.prisma.walletHistory.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          booking: {
            select: {
              bookingCode: true,
              startTime: true,
              endTime: true,
              storeId: true,
              store: {
                select: {
                  id: true,
                  storeName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.walletHistory.count({ where: whereClause }),
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Payout / Withdrawal: Đối tác rút tiền & Admin duyệt chi
  // ─────────────────────────────────────────────────────────────────────────────

  async requestPayout(partnerId: number, dto: CreatePayoutRequestDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
      include: { partnerWallet: true },
    });
    if (!user) throw new NotFoundException('Không tìm thấy đối tác');
    if (!user.bankAccountNum || !user.bankName) {
      throw new BadRequestException(
        'Vui lòng cập nhật Số tài khoản và Tên ngân hàng trong hồ sơ trước khi yêu cầu rút tiền',
      );
    }
    const wallet = user.partnerWallet;
    if (!wallet) throw new NotFoundException('Không tìm thấy ví đối tác');
    if (wallet.status === 0) throw new BadRequestException('Ví đang bị đóng băng');

    const amount = Number(dto.amount);
    const balance = Number(wallet.balance);

    if (balance < amount) {
      throw new BadRequestException(
        `Số dư khả dụng (${balance.toLocaleString('vi-VN')} đ) không đủ để rút ${amount.toLocaleString('vi-VN')} đ`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Tạm trừ số dư ví
      const newBalance = balance - amount;
      await tx.partnerWallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      // Tạo lịch sử ví (type 3: Withdrawal)
      await tx.walletHistory.create({
        data: {
          walletId: wallet.id,
          type: 3, // Withdrawal
          amount: amount,
          balanceBefore: balance,
          balanceAfter: newBalance,
          description: `Yêu cầu rút tiền về ${user.bankName} - STK: ${user.bankAccountNum}`,
        },
      });

      // Tạo PayoutRequest
      const request = await tx.payoutRequest.create({
        data: {
          partnerId,
          amount,
          bankAccountNum: user.bankAccountNum!,
          bankName: user.bankName!,
          accountHolder: user.fullName,
          status: 0, // Pending
          note: dto.note,
        },
      });

      return {
        message: 'Tạo yêu cầu rút tiền thành công. Admin sẽ kiểm tra và giải ngân về tài khoản ngân hàng của bạn.',
        payoutRequest: request,
        remainingBalance: newBalance,
      };
    });
  }

  async getPayoutRequestsForPartner(partnerId: number) {
    return this.prisma.payoutRequest.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayoutRequestsForAdmin(
    filter?: number | { status?: number; search?: string; fromDate?: string; toDate?: string },
  ) {
    const where: any = {};
    let status: number | undefined;
    let search: string | undefined;
    let fromDate: string | undefined;
    let toDate: string | undefined;

    if (typeof filter === 'number') {
      status = filter;
    } else if (filter) {
      status = filter.status;
      search = filter.search;
      fromDate = filter.fromDate;
      toDate = filter.toDate;
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    if (search) {
      const s = search.trim();
      where.OR = [
        { bankAccountNum: { contains: s, mode: 'insensitive' } },
        { accountHolder: { contains: s, mode: 'insensitive' } },
        { bankName: { contains: s, mode: 'insensitive' } },
        { partner: { fullName: { contains: s, mode: 'insensitive' } } },
        { partner: { phone: { contains: s, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.payoutRequest.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            bankAccountNum: true,
            bankName: true,
            stores: { select: { id: true, storeName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPaymentsForAdmin(query?: {
    search?: string;
    status?: number;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};
    if (query?.status !== undefined) {
      where.paymentStatus = query.status;
    }
    if (query?.fromDate || query?.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate) {
        const to = new Date(query.toDate);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }
    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { transactionRef: { contains: s, mode: 'insensitive' } },
        { booking: { bookingCode: { contains: s, mode: 'insensitive' } } },
        { booking: { customer: { fullName: { contains: s, mode: 'insensitive' } } } },
        { booking: { customer: { phone: { contains: s, mode: 'insensitive' } } } },
        { booking: { store: { storeName: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            customer: { select: { id: true, fullName: true, phone: true, email: true } },
            store: { select: { id: true, storeName: true, address: true, phoneContact: true } },
            bookingDetails: {
              include: {
                model: { select: { id: true, name: true, brand: true, type: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getAllWalletHistoriesForAdmin(query?: {
    search?: string;
    type?: number;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};
    if (query?.type !== undefined) {
      where.type = query.type;
    }
    if (query?.fromDate || query?.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate) {
        const to = new Date(query.toDate);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }
    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { description: { contains: s, mode: 'insensitive' } },
        { wallet: { partner: { fullName: { contains: s, mode: 'insensitive' } } } },
        { wallet: { partner: { phone: { contains: s, mode: 'insensitive' } } } },
      ];
    }

    return this.prisma.walletHistory.findMany({
      where,
      include: {
        wallet: {
          include: {
            partner: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true,
                bankName: true,
                bankAccountNum: true,
                stores: { select: { id: true, storeName: true } },
              },
            },
          },
        },
        booking: {
          select: {
            id: true,
            bookingCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async reviewPayout(adminId: number, payoutId: number, dto: ReviewPayoutDto) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { partner: { include: { partnerWallet: true } } },
    });
    if (!payout) throw new NotFoundException('Yêu cầu rút tiền không tồn tại');
    if (payout.status !== 0) throw new BadRequestException('Yêu cầu rút tiền này đã được xử lý trước đó');

    return this.prisma.$transaction(async (tx) => {
      // Nếu REJECTED (2): hoàn tiền lại vào ví đối tác
      if (dto.status === 2) {
        const wallet = payout.partner.partnerWallet;
        if (wallet) {
          const currentBal = Number(wallet.balance);
          const refundAmount = Number(payout.amount);
          const newBal = currentBal + refundAmount;

          await tx.partnerWallet.update({
            where: { id: wallet.id },
            data: { balance: newBal },
          });

          await tx.walletHistory.create({
            data: {
              walletId: wallet.id,
              type: 2, // Refund
              amount: refundAmount,
              balanceBefore: currentBal,
              balanceAfter: newBal,
              description: `Hoàn tiền yêu cầu rút #${payout.id}: ${dto.note || 'Admin từ chối lệnh rút'}`,
            },
          });
        }
      }

      const updated = await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: dto.status,
          note: dto.note || (dto.status === 1 ? 'Đã chuyển khoản thành công' : 'Đã từ chối và hoàn tiền vào ví'),
        },
      });

      return {
        message: dto.status === 1 ? 'Phê duyệt rút tiền thành công' : 'Đã từ chối và hoàn tiền lại ví đối tác',
        payoutRequest: updated,
      };
    });
  }
}

