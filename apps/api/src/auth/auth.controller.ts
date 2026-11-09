import { Body, Controller, Delete, Get, Patch, Post, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/customer')
  @ApiOperation({
    summary: 'Đăng ký tài khoản Khách hàng (Customer)',
    description: 'Tự động gán role = 2 (Customer). Chỉ cần thông tin cơ bản.',
  })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  registerCustomer(@Body() dto: RegisterCustomerDto) {
    return this.authService.registerCustomer(dto);
  }

  @Post('register/partner')
  @ApiOperation({
    summary: 'Đăng ký tài khoản Đối tác (Partner)',
    description:
      'Tự động gán role = 1 (Partner) và khởi tạo PartnerWallet với balance = 0, creditLimit = 500.000đ.',
  })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, PartnerWallet đã được khởi tạo' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  registerPartner(@Body() dto: RegisterPartnerDto) {
    return this.authService.registerPartner(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập và nhận JWT token' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về accessToken' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu / Tài khoản bị khóa' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thông tin profile' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin tài khoản' })
  @ApiResponse({ status: 200, description: 'Cập nhật profile thành công' })
  updateProfile(
    @Request() req: any,
    @Body()
    dto: {
      fullName?: string;
      phone?: string;
      bankAccountNum?: string;
      bankName?: string;
    },
  ) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}

// ─── ADMIN USER MANAGEMENT ROUTES ─────────────────────────────────────────────

@ApiTags('Admin - Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(0) // Admin only
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng hệ thống' })
  findAll() {
    return this.authService.findAllUsers();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết thông tin người dùng (kèm chi nhánh/đơn đặt/đánh giá/ví)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.authService.findUserDetailsForAdmin(id);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Khóa hoặc mở khóa tài khoản người dùng' })
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.authService.toggleUserStatus(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa vĩnh viễn tài khoản người dùng đã bị khóa' })
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.authService.deleteUserForAdmin(id);
  }
}


