import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpsertRentalPolicyDto } from './dto/rental-policy.dto';
import { RejectStoreDto } from './dto/reject-store.dto';
import { CreateStoreUpdateRequestDto, RejectStoreUpdateRequestDto } from './dto/store-update-request.dto';
import { SetOwnerPasswordDto, VerifyOwnerPasswordDto } from './dto/owner-security.dto';
import { UpdateStoreStatusDto } from './dto/update-store-status.dto';
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

  @Get('security/owner-password-status')
  @ApiOperation({ summary: 'Kiểm tra trạng thái mật khẩu chủ cửa hàng (cấp 2)' })
  getOwnerPasswordStatus(@Request() req: any) {
    return this.storesService.getOwnerPasswordStatus(req.user.id);
  }

  @Post('security/set-owner-password')
  @ApiOperation({ summary: 'Thiết lập hoặc đổi mật khẩu chủ cửa hàng' })
  setOwnerPassword(@Request() req: any, @Body() dto: SetOwnerPasswordDto) {
    return this.storesService.setOwnerPassword(req.user.id, dto);
  }

  @Post('security/verify-owner-password')
  @ApiOperation({ summary: 'Xác thực mật khẩu chủ cửa hàng để mở khóa Owner Portal' })
  verifyOwnerPassword(@Request() req: any, @Body() dto: VerifyOwnerPasswordDto) {
    return this.storesService.verifyOwnerPassword(req.user.id, dto);
  }

  @Get('update-requests')
  @ApiOperation({ summary: 'Xem tất cả yêu cầu cập nhật thông tin cửa hàng của Partner' })
  getUpdateRequests(@Request() req: any) {
    return this.storesService.getStoreUpdateRequestsForPartner(req.user.id);
  }

  @Post(':id/request-update')
  @ApiOperation({ summary: 'Gửi yêu cầu thay đổi thông tin cửa hàng đã duyệt' })
  requestUpdate(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateStoreUpdateRequestDto,
  ) {
    return this.storesService.requestStoreUpdate(req.user.id, id, dto);
  }

  @Get(':id/update-requests')
  @ApiOperation({ summary: 'Xem các yêu cầu cập nhật của 1 cửa hàng cụ thể' })
  getStoreUpdateRequests(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.storesService.getStoreUpdateRequestsForPartner(req.user.id, id);
  }

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

  @Patch(':id/status')
  @ApiOperation({ summary: 'Chủ cửa hàng đổi trạng thái chi nhánh (1=ACTIVE, 3=PAUSED, 4=MAINTENANCE)' })
  updateStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStoreStatusDto,
  ) {
    return this.storesService.updateStoreStatus(req.user.id, id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa chi nhánh (chỉ khi không có đơn thuê đang hoạt động)' })
  deleteStore(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.storesService.deleteStore(req.user.id, id);
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

  @Get('update-requests')
  @ApiOperation({ summary: 'Xem danh sách các yêu cầu cập nhật thông tin cửa hàng từ Partner' })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Number,
    description: '0: PENDING, 1: APPROVED, 2: REJECTED',
  })
  getUpdateRequests(@Query('status') status?: string) {
    const statusNum = status !== undefined ? parseInt(status, 10) : undefined;
    return this.storesService.getStoreUpdateRequestsForAdmin(statusNum);
  }

  @Patch('update-requests/:id/approve')
  @ApiOperation({ summary: 'Admin phê duyệt yêu cầu thay đổi thông tin cửa hàng' })
  approveUpdateRequest(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.approveStoreUpdate(id);
  }

  @Patch('update-requests/:id/reject')
  @ApiOperation({ summary: 'Admin từ chối yêu cầu thay đổi thông tin cửa hàng' })
  rejectUpdateRequest(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectStoreUpdateRequestDto,
  ) {
    return this.storesService.rejectStoreUpdate(id, dto.rejectReason);
  }

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

// ─── PUBLIC CUSTOMER STORES ROUTES ───────────────────────────────────────────

@ApiTags('Customer - Stores (Public)')
@Controller('customer/stores')
export class CustomerStoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách các cửa hàng đối tác đang hoạt động (ACTIVE)' })
  findAll() {
    return this.storesService.findAllActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết cửa hàng đối tác, chính sách cọc & dòng xe' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.storesService.findActiveStoreDetail(id);
  }
}



