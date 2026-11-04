import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
  getHistory(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getWalletHistory(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
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
}

// ─── PUBLIC: PayOS Webhook receiver ───────────────────────────────────────────

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payment')
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

