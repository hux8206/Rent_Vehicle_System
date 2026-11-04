import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
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
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

// ─── CUSTOMER BOOKING ROUTES ─────────────────────────────────────────────────

@ApiTags('Customer - Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(2) // Customer only
@Controller('customer/bookings')
export class CustomerBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo đơn đặt xe & giữ chỗ 10 phút (Flow 2)',
    description: `
**Yêu cầu bắt buộc:**
- \`driverLicenseFront\` và \`driverLicenseBack\`: URL ảnh 2 mặt GPLX để xác minh danh tính.

**Quy trình xử lý (Flow 2):**
1. Kiểm tra xe khả dụng theo [startTime, endTime] theo công thức Flow 1.
2. Tính dayRent = CEIL(giờ / 24), rentAmount, depositAmount, commissionAmount.
3. Tạo Booking (status=0, holdExpiresAt=NOW+10min) + BookingDetail + Payment (Pending).
4. Lưu ảnh GPLX vào profile Customer.
5. Trả về transactionRef để Customer thanh toán VietQR.
    `,
  })
  @ApiResponse({ status: 201, description: 'Đặt xe & giữ chỗ thành công, trả về transactionRef' })
  @ApiResponse({ status: 400, description: 'XE_KHONG_KHA_DUNG hoặc dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Chỉ Customer mới được đặt xe' })
  createBooking(@Request() req: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn thuê của Customer (lịch sử đặt xe)' })
  getMyBookings(@Request() req: any) {
    return this.bookingsService.findMyBookings(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết 1 đơn thuê của Customer' })
  @ApiResponse({ status: 403, description: 'Không có quyền xem đơn của người khác' })
  getBookingDetail(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(req.user.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn (chỉ khi trạng thái là PendingPayment)' })
  @ApiResponse({ status: 400, description: 'Chỉ hủy được đơn đang PendingPayment' })
  cancelBooking(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.cancelBooking(req.user.id, id);
  }
}

// ─── PARTNER BOOKING ROUTES ───────────────────────────────────────────────────

@ApiTags('Partner - Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1) // Partner only
@Controller('partner/bookings')
export class PartnerBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @ApiOperation({ summary: 'Xem danh sách đơn thuê thuộc stores của Partner' })
  @ApiQuery({ name: 'status', required: false, type: Number, description: '0-5, bỏ trống để lấy tất cả' })
  getPartnerBookings(@Request() req: any, @Query('status') status?: string) {
    const statusNum = status !== undefined ? parseInt(status, 10) : undefined;
    return this.bookingsService.findPartnerBookings(req.user.id, statusNum);
  }

  @Post(':id/handover')
  @ApiOperation({
    summary: 'Bàn giao xe (Flow 6a) — chọn biển số xe để giao cho khách',
    description: 'Đơn phải ở trạng thái **Confirmed (1)**. Chuyển xe sang Rented, đơn sang ActiveRental.',
  })
  @ApiResponse({ status: 400, description: 'Đơn không ở trạng thái Confirmed hoặc xe không Available' })
  handover(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('vehicleItemId', ParseIntPipe) vehicleItemId: number,
  ) {
    return this.bookingsService.handoverVehicle(req.user.id, id, vehicleItemId);
  }

  @Post(':id/complete')
  @ApiOperation({
    summary: 'Xác nhận khách trả xe (Flow 6b) — hoàn tất đơn thuê',
    description: 'Đơn phải ở trạng thái **ActiveRental (3)**. Xe trở về Available, đơn sang Completed.',
  })
  @ApiResponse({ status: 400, description: 'Đơn không ở trạng thái ActiveRental' })
  complete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.completeBooking(req.user.id, id);
  }
}

