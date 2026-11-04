import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpsertRentalPolicyDto } from './dto/rental-policy.dto';
import { RejectStoreDto } from './dto/reject-store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// ─── PARTNER ROUTES ───────────────────────────────────────────────────────────

@ApiTags('Partner - Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1) // Partner only
@Controller('partner/stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @ApiOperation({
    summary: 'Onboarding cửa hàng mới (Partner)',
    description: `
Gửi đầy đủ thông tin để đăng ký cửa hàng. Hệ thống sẽ:
- Tạo **Store** với \`status = 0 (PENDING)\` — chờ Admin kiểm duyệt.
- Tạo **RentalPolicy** đồng thời theo \`depositPercent\` được cung cấp.
- Lưu \`bankAccountNum\` và \`bankName\` vào profile Partner.
    `,
  })
  @ApiResponse({ status: 201, description: 'Cửa hàng đã được tạo, đang chờ Admin duyệt (status=0)' })
  create(@Request() req: any, @Body() dto: CreateStoreDto) {
    return this.storesService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách cửa hàng của Partner' })
  findAll(@Request() req: any) {
    return this.storesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết cửa hàng (gồm dòng xe và biển số)' })
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.storesService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin cửa hàng' })
  update(@Request() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateStoreDto) {
    return this.storesService.update(req.user.id, id, dto);
  }

  @Put(':id/rental-policy')
  @ApiOperation({ summary: 'Tạo hoặc cập nhật RentalPolicy của cửa hàng' })
  upsertPolicy(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertRentalPolicyDto,
  ) {
    return this.storesService.upsertRentalPolicy(req.user.id, id, dto);
  }

  @Get(':id/rental-policy')
  @ApiOperation({ summary: 'Xem RentalPolicy của cửa hàng' })
  getPolicy(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.storesService.getRentalPolicy(req.user.id, id);
  }
}

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

@ApiTags('Admin - Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(0) // Admin only
@Controller('admin/stores')
export class AdminStoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Xem tất cả cửa hàng (có thể lọc theo status)' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Number,
    description: '0: PENDING, 1: ACTIVE, 2: REJECTED — bỏ trống để lấy tất cả',
  })
  findAll(@Query('status') status?: string) {
    const statusNum = status !== undefined ? parseInt(status, 10) : undefined;
    return this.storesService.findAllForAdmin(statusNum);
  }

  @Patch(':id/approve')
  @ApiOperation({
    summary: 'Duyệt cửa hàng → status = 1 (ACTIVE)',
    description: 'Admin phê duyệt cửa hàng. Sau khi duyệt, Partner có thể thêm xe và nhận đơn.',
  })
  @ApiResponse({ status: 200, description: 'Cửa hàng đã được duyệt (ACTIVE)' })
  @ApiResponse({ status: 404, description: 'Cửa hàng không tồn tại' })
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.approveStore(id);
  }

  @Patch(':id/reject')
  @ApiOperation({
    summary: 'Từ chối cửa hàng → status = 2 (REJECTED)',
    description: 'Admin từ chối với lý do cụ thể. Lý do sẽ được lưu và hiển thị cho Partner.',
  })
  @ApiResponse({ status: 200, description: 'Cửa hàng đã bị từ chối (REJECTED)' })
  @ApiResponse({ status: 404, description: 'Cửa hàng không tồn tại' })
  reject(@Param('id', ParseIntPipe) id: number, @Body() dto: RejectStoreDto) {
    return this.storesService.rejectStore(id, dto.rejectReason);
  }
}

