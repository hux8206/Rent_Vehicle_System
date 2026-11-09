import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';

// ─── PUBLIC ENDPOINT: Để Khách hàng và Đối tác xem chính sách cọc & hoa hồng ────
@ApiTags('System Config (Public)')
@Controller('system-config')
export class PublicSystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy cấu hình hệ thống (mức cọc tối thiểu, tỷ lệ hoa hồng, hạn mức ví)',
  })
  getConfig() {
    return this.configService.getConfig();
  }
}

// ─── ADMIN ENDPOINT: Quản trị viên cấu hình sàn ──────────────────────────────
@ApiTags('Admin - System Config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(0) // Admin only
@Controller('admin/config')
export class AdminSystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Admin xem cấu hình hệ thống hiện tại' })
  getConfig() {
    return this.configService.getConfig();
  }

  @Put()
  @ApiOperation({
    summary: 'Admin tùy chỉnh cấu hình: tỷ lệ hoa hồng, hạn mức âm và mức cọc tối thiểu',
    description: `
Cho phép Admin:
- **Tùy chỉnh tỷ lệ hoa hồng sàn**: 0% - 100% (đặt về 0% trong giai đoạn đầu để miễn phí cho đối tác/khách hàng).
- **Tùy chỉnh hạn mức âm cho phép (Credit Limit)**: đặt về 0 hoặc số tiền cho phép đối tác âm.
- **Tùy chỉnh mức cọc tối thiểu**: đặt 15% (mặc định) hoặc 0% nếu tắt yêu cầu cọc.
    `,
  })
  @ApiResponse({ status: 200, description: 'Cập nhật cấu hình hệ thống thành công' })
  updateConfig(@Body() dto: UpdateSystemConfigDto) {
    return this.configService.updateConfig(dto);
  }
}

