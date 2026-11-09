import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { DepositWalletDto, PayosWebhookDto } from './dto/payment.dto';
import { CreatePayoutRequestDto, ReviewPayoutDto } from './dto/payout.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

// ─── CUSTOMER: Lấy link thanh toán VietQR ─────────────────────────────────────

@ApiTags('Customer - Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(2)
@Controller('customer/payments')
export class CustomerPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('booking/:bookingId/qr')
  @ApiOperation({
    summary: 'Lấy link thanh toán VietQR động cho đơn thuê xe',
    description:
      'Sinh PayOS payment link. Trả về `checkoutUrl` (trang thanh toán) và `qrCode` (ảnh QR để hiển thị inline).',
  })
  @ApiResponse({ status: 200, description: 'Trả về checkoutUrl và qrCode' })
  @ApiResponse({ status: 400, description: 'Đơn đã thanh toán rồi' })
  getPaymentLink(
    @Request() req: any,
    @Param('bookingId', ParseIntPipe) bookingId: number,
  ) {
    return this.paymentsService.getBookingPaymentLink(bookingId, req.user.id);
  }
}

// ─── PARTNER: Ví & Nạp tiền ───────────────────────────────────────────────────

@ApiTags('Partner - Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
@Controller('partner/wallet')
export class PartnerWalletController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem thông tin ví và 20 giao dịch gần nhất' })
  getWallet(@Request() req: any) {
    return this.paymentsService.getWallet(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Xem lịch sử giao dịch ví (phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'storeId', required: false, type: Number, description: 'Lọc lịch sử giao dịch theo chi nhánh' })
  getHistory(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.paymentsService.getWalletHistory(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      storeId ? parseInt(storeId, 10) : undefined,
    );
  }

  @Post('deposit')
  @ApiOperation({
    summary: 'Tạo link nạp tiền ví Partner qua PayOS (Flow 5)',
    description:
      'Sinh PayOS payment link để Partner nạp tiền. Sau khi thanh toán, webhook sẽ tự động cộng tiền ví và xử lý FIFO WaitingQueue.',
  })
  @ApiResponse({ status: 201, description: 'Trả về checkoutUrl và qrCode để Partner quét QR nạp tiền' })
  createDepositLink(@Request() req: any, @Body() dto: DepositWalletDto) {
    return this.paymentsService.createDepositLink(req.user.id, dto);
  }

  @Post('payout')
  @ApiOperation({
    summary: 'Yêu cầu rút tiền về tài khoản ngân hàng (Partner)',
    description: 'Đối tác tạo yêu cầu rút số dư khả dụng về số tài khoản ngân hàng đã đăng ký.',
  })
  @ApiResponse({ status: 201, description: 'Tạo yêu cầu rút tiền thành công, chờ Admin duyệt' })
  requestPayout(@Request() req: any, @Body() dto: CreatePayoutRequestDto) {
    return this.paymentsService.requestPayout(req.user.id, dto);
  }

  @Get('payouts')
  @ApiOperation({ summary: 'Xem danh sách yêu cầu rút tiền của Partner' })
  getMyPayouts(@Request() req: any) {
    return this.paymentsService.getPayoutRequestsForPartner(req.user.id);
  }
}

// ─── ADMIN: Quản lý Yêu cầu rút tiền của các Partner ──────────────────────────

@ApiTags('Admin - Payouts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(0) // Admin only
@Controller('admin/payouts')
export class AdminPayoutsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem tất cả yêu cầu rút tiền từ đối tác' })
  @ApiQuery({ name: 'status', required: false, type: Number, description: '0: PENDING, 1: APPROVED, 2: REJECTED' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getAllPayouts(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const statusNum = status !== undefined && status !== '' ? parseInt(status, 10) : undefined;
    return this.paymentsService.getPayoutRequestsForAdmin({
      status: statusNum,
      search,
      fromDate,
      toDate,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Phê duyệt hoặc từ chối yêu cầu rút tiền' })
  reviewPayout(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewPayoutDto,
  ) {
    return this.paymentsService.reviewPayout(req.user.id, id, dto);
  }
}

// ─── ADMIN: Quản lý Tất cả Giao dịch trên Sàn (PayOS & Ví) ───────────────────

@ApiTags('Admin - Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(0) // Admin only
@Controller('admin/transactions')
export class AdminTransactionsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('payments')
  @ApiOperation({ summary: 'Xem tất cả giao dịch thanh toán PayOS / Cọc đơn' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: Number })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getPayments(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const statusNum = status !== undefined && status !== '' ? parseInt(status, 10) : undefined;
    return this.paymentsService.getAllPaymentsForAdmin({
      search,
      status: statusNum,
      fromDate,
      toDate,
    });
  }

  @Get('wallet-histories')
  @ApiOperation({ summary: 'Xem tất cả biến động số dư ví đối tác toàn sàn' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: Number })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  getWalletHistories(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const typeNum = type !== undefined && type !== '' ? parseInt(type, 10) : undefined;
    return this.paymentsService.getAllWalletHistoriesForAdmin({
      search,
      type: typeNum,
      fromDate,
      toDate,
    });
  }
}

// ─── PUBLIC: PayOS Webhook receiver ───────────────────────────────────────────

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PayOS Webhook — nhận callback thanh toán (Flow 3 & Flow 5)',
    description: `
**Endpoint này do PayOS gọi tự động**, không phải frontend.

**Bảo mật:** Chữ ký \`signature\` được xác thực bằng \`PAYOS_CHECKSUM_KEY\` trước khi xử lý.

**Flow 3 (đơn thuê):** Nếu thanh toán thành công:
- Kiểm tra \`balance - commissionAmount >= -creditLimit\`
- Đủ → Booking → **Confirmed** + trừ hoa hồng ví Partner
- Thiếu → Booking → **WaitingQueue**

**Flow 5 (nạp ví):** Cộng tiền vào ví, sau đó quét FIFO WaitingQueue để duyệt đơn.
    `,
  })
  @ApiResponse({ status: 200, description: '{ success: true }' })
  handlePaymentWebhook(@Body() body: any) {
    return this.paymentsService.handleWebhook(body);
  }
}

