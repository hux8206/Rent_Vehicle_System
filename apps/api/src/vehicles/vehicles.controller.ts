import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';
import { CreateVehicleItemDto, BulkCreateVehicleItemDto } from './dto/create-vehicle-item.dto';
import { UpdateVehicleItemDto } from './dto/update-vehicle-item.dto';
import { UpdateVehicleItemStatusDto } from './dto/update-vehicle-item-status.dto';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// ─── PARTNER ROUTES ───────────────────────────────────────────────────────────

@ApiTags('Partner - Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1)
@Controller('partner/vehicles')
export class PartnerVehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // VehicleModel CRUD
  @Post('models')
  @ApiOperation({ summary: 'Tạo dòng xe mới' })
  @ApiResponse({ status: 201, description: 'Tạo dòng xe thành công' })
  createModel(@Request() req: any, @Body() dto: CreateVehicleModelDto) {
    return this.vehiclesService.createModel(req.user.id, dto);
  }

  @Get('models')
  @ApiOperation({ summary: 'Lấy danh sách dòng xe (có thể lọc theo storeId hoặc lấy tất cả dòng xe của Partner)' })
  @ApiQuery({ name: 'storeId', required: false, type: Number })
  findAllModels(
    @Request() req: any,
    @Query('storeId') storeId?: string,
  ) {
    const storeIdNum = storeId ? parseInt(storeId, 10) : undefined;
    return this.vehiclesService.findAllModels(req.user.id, storeIdNum);
  }

  @Get('models/:id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 dòng xe (gồm danh sách biển số)' })
  findOneModel(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOneModel(req.user.id, id);
  }

  @Put('models/:id')
  @ApiOperation({ summary: 'Cập nhật thông tin dòng xe' })
  updateModel(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleModelDto,
  ) {
    return this.vehiclesService.updateModel(req.user.id, id, dto);
  }

  @Delete('models/:id')
  @ApiOperation({ summary: 'Xóa dòng xe' })
  deleteModel(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.deleteModel(req.user.id, id);
  }

  // VehicleItem (Biển số xe)
  @Post('models/:modelId/items')
  @ApiOperation({ summary: 'Thêm biển số xe vào dòng xe' })
  @ApiResponse({ status: 201, description: 'Thêm biển số thành công' })
  addItem(
    @Request() req: any,
    @Param('modelId', ParseIntPipe) modelId: number,
    @Body() dto: CreateVehicleItemDto,
  ) {
    return this.vehiclesService.addVehicleItem(req.user.id, modelId, dto);
  }

  @Post('models/:modelId/items/bulk')
  @ApiOperation({ summary: 'Thêm nhiều xe vào dòng xe từ file (CSV/Excel)' })
  @ApiResponse({ status: 201, description: 'Thêm danh sách xe thành công' })
  addBulkItems(
    @Request() req: any,
    @Param('modelId', ParseIntPipe) modelId: number,
    @Body() dto: BulkCreateVehicleItemDto,
  ) {
    return this.vehiclesService.addBulkVehicleItems(req.user.id, modelId, dto.items);
  }

  @Get('models/:modelId/items')
  @ApiOperation({ summary: 'Xem danh sách biển số xe của 1 dòng xe' })
  getItems(@Request() req: any, @Param('modelId', ParseIntPipe) modelId: number) {
    return this.vehiclesService.getVehicleItems(req.user.id, modelId);
  }

  @Put('items/:itemId')
  @ApiOperation({ summary: 'Cập nhật thông tin chi tiết xe (biển số, màu sơn, số khung, trạng thái)' })
  updateItem(
    @Request() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateVehicleItemDto,
  ) {
    return this.vehiclesService.updateVehicleItem(req.user.id, itemId, dto);
  }

  @Put('items/:itemId/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái xe (0: Available, 1: Reserved, 2: Rented, 3: Maintenance)' })
  updateItemStatus(
    @Request() req: any,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateVehicleItemStatusDto,
  ) {
    return this.vehiclesService.updateVehicleItemStatus(req.user.id, itemId, dto);
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Xóa biển số xe' })
  deleteItem(@Request() req: any, @Param('itemId', ParseIntPipe) itemId: number) {
    return this.vehiclesService.deleteVehicleItem(req.user.id, itemId);
  }
}

// ─── PUBLIC ROUTES (Customer) ────────────────────────────────────────────────

@ApiTags('Public - Vehicles (Customer)')
@Controller('customer/vehicles')
export class PublicVehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Tìm kiếm dòng xe + tính số lượng xe khả dụng theo [startTime, endTime]',
    description: `
**Công thức tính xe khả dụng (Flow 1):**

AvailableCount = TotalActiveVehicleItems - BusyVehicleCount

**BusyVehicleCount** = số BookingDetail có booking trùng khoảng [startTime, endTime] với:
- booking.status IN (1=Confirmed, 3=ActiveRental)
- HOẶC booking.status = 0 (PendingPayment) AND holdExpiresAt > NOW() (đang giữ chỗ hợp lệ)
- AND (booking.startTime < requestEndTime AND booking.endTime > requestStartTime)

**TotalActiveVehicleItems** = tổng VehicleItem của dòng xe có status != 3 (không bảo dưỡng)
    `,
  })
  @ApiResponse({ status: 200, description: 'Danh sách dòng xe kèm availableCount' })
  searchVehicles(@Query() dto: SearchVehiclesDto) {
    return this.vehiclesService.searchPublic(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết dòng xe + số xe khả dụng theo khoảng thời gian' })
  @ApiQuery({ name: 'startTime', required: true, type: String, example: '2026-11-10T08:00:00.000Z' })
  @ApiQuery({ name: 'endTime', required: true, type: String, example: '2026-11-12T08:00:00.000Z' })
  getDetail(
    @Param('id', ParseIntPipe) id: number,
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    return this.vehiclesService.getModelDetail(id, startTime, endTime);
  }
}
