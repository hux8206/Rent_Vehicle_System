import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

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
}

