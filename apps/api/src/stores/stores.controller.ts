import { Body, Controller, Get, Param, ParseIntPipe, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpsertRentalPolicyDto } from './dto/rental-policy.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Partner - Stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(1) // Partner only
@Controller('partner/stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cửa hàng mới (Partner)' })
  @ApiResponse({ status: 201, description: 'Tạo cửa hàng thành công' })
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
  @ApiResponse({ status: 200, description: 'Upsert thành công' })
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
