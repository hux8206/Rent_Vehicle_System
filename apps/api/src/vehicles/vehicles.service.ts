import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';
import { CreateVehicleItemDto } from './dto/create-vehicle-item.dto';
import { UpdateVehicleItemStatusDto } from './dto/update-vehicle-item-status.dto';
import { SearchVehiclesDto } from './dto/search-vehicles.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PARTNER: VehicleModel CRUD ─────────────────────────────────────────────

  async createModel(partnerId: number, dto: CreateVehicleModelDto) {
    await this.assertStoreOwnership(partnerId, dto.storeId);
    return this.prisma.vehicleModel.create({
      data: {
        storeId: dto.storeId,
        name: dto.name,
        brand: dto.brand,
        type: dto.type,
        rentPrice: dto.rentPrice,
        specifications: dto.specifications,
        images: dto.images ? dto.images : undefined,
      },
    });
  }

  async findAllModels(partnerId: number, storeId: number) {
    await this.assertStoreOwnership(partnerId, storeId);
    return this.prisma.vehicleModel.findMany({
      where: { storeId },
      include: { _count: { select: { vehicleItems: true } } },
    });
  }

  async findOneModel(partnerId: number, modelId: number) {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id: modelId },
      include: { store: true, vehicleItems: true },
    });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');
    await this.assertStoreOwnership(partnerId, model.storeId);
    return model;
  }

  async updateModel(partnerId: number, modelId: number, dto: UpdateVehicleModelDto) {
    const model = await this.prisma.vehicleModel.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');
    await this.assertStoreOwnership(partnerId, model.storeId);

    return this.prisma.vehicleModel.update({
      where: { id: modelId },
      data: {
        ...dto,
        images: dto.images !== undefined ? dto.images : undefined,
      },
    });
  }

  async deleteModel(partnerId: number, modelId: number) {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id: modelId },
      include: { vehicleItems: true },
    });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');
    await this.assertStoreOwnership(partnerId, model.storeId);

    return this.prisma.vehicleModel.delete({ where: { id: modelId } });
  }

  // ─── PARTNER: VehicleItem CRUD ───────────────────────────────────────────────

  async addVehicleItem(partnerId: number, modelId: number, dto: CreateVehicleItemDto) {
    const model = await this.prisma.vehicleModel.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');
    await this.assertStoreOwnership(partnerId, model.storeId);

    const existing = await this.prisma.vehicleItem.findUnique({
      where: { licensePlate: dto.licensePlate },
    });
    if (existing) throw new ConflictException('Biển số xe đã tồn tại trong hệ thống');

    return this.prisma.vehicleItem.create({
      data: { modelId, ...dto },
    });
  }

  async getVehicleItems(partnerId: number, modelId: number) {
    const model = await this.prisma.vehicleModel.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');
    await this.assertStoreOwnership(partnerId, model.storeId);

    return this.prisma.vehicleItem.findMany({ where: { modelId } });
  }

  async updateVehicleItemStatus(
    partnerId: number,
    itemId: number,
    dto: UpdateVehicleItemStatusDto,
  ) {
    const item = await this.prisma.vehicleItem.findUnique({
      where: { id: itemId },
      include: { model: true },
    });
    if (!item) throw new NotFoundException('Xe không tồn tại');
    await this.assertStoreOwnership(partnerId, item.model.storeId);

    return this.prisma.vehicleItem.update({
      where: { id: itemId },
      data: { status: dto.status },
    });
  }

  async deleteVehicleItem(partnerId: number, itemId: number) {
    const item = await this.prisma.vehicleItem.findUnique({
      where: { id: itemId },
      include: { model: true },
    });
    if (!item) throw new NotFoundException('Xe không tồn tại');
    await this.assertStoreOwnership(partnerId, item.model.storeId);

    return this.prisma.vehicleItem.delete({ where: { id: itemId } });
  }

  // ─── PUBLIC: Search VehicleModels with availability (Flow 1) ────────────────

  async searchPublic(dto: SearchVehiclesDto) {
    const { startTime, endTime, type, brand, storeId, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleModelWhereInput = {
      store: { status: 1 }, // 1 = ACTIVE
      ...(type !== undefined && { type }),
      ...(brand && { brand: { contains: brand } }),
      ...(storeId && { storeId }),
    };

    const models = await this.prisma.vehicleModel.findMany({
      where,
      include: {
        store: { select: { id: true, storeName: true, address: true, phoneContact: true } },
        vehicleItems: {
          select: { id: true, status: true },
        },
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.vehicleModel.count({ where });

    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);

    // For each model, apply Flow 1 availability formula
    const result = await Promise.all(
      models.map(async (model) => {
        // TotalActiveVehicleItems = xe không bị bảo dưỡng (status != 3)
        const totalActiveItems = model.vehicleItems.filter((vi) => vi.status !== 3).length;

        // BusyVehicleCount: đếm booking_details có đơn trùng khoảng thời gian
        const busyCount = await this.prisma.bookingDetail.count({
          where: {
            modelId: model.id,
            booking: {
              AND: [
                {
                  OR: [
                    { status: { in: [1, 3] } },
                    {
                      status: 0,
                      holdExpiresAt: { gt: new Date() },
                    },
                  ],
                },
                { startTime: { lt: requestEnd } },
                { endTime: { gt: requestStart } },
              ],
            },
          },
        });

        const availableCount = Math.max(0, totalActiveItems - busyCount);

        const { vehicleItems: _, ...modelData } = model;
        return {
          ...modelData,
          totalActiveItems,
          busyCount,
          availableCount,
        };
      }),
    );

    return {
      data: result,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getModelDetail(modelId: number, startTime: string, endTime: string) {
    const model = await this.prisma.vehicleModel.findUnique({
      where: { id: modelId },
      include: {
        store: {
          include: { rentalPolicy: true },
        },
        vehicleItems: { select: { id: true, status: true, color: true } },
      },
    });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');

    const requestStart = new Date(startTime);
    const requestEnd = new Date(endTime);

    const totalActiveItems = model.vehicleItems.filter((vi) => vi.status !== 3).length;

    const busyCount = await this.prisma.bookingDetail.count({
      where: {
        modelId,
        booking: {
          AND: [
            {
              OR: [
                { status: { in: [1, 3] } },
                { status: 0, holdExpiresAt: { gt: new Date() } },
              ],
            },
            { startTime: { lt: requestEnd } },
            { endTime: { gt: requestStart } },
          ],
        },
      },
    });

    const availableCount = Math.max(0, totalActiveItems - busyCount);

    const { vehicleItems: _, ...modelData } = model;
    return { ...modelData, totalActiveItems, busyCount, availableCount };
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async assertStoreOwnership(partnerId: number, storeId: number) {
    const store = await this.prisma.store.findFirst({ where: { id: storeId, partnerId } });
    if (!store) throw new ForbiddenException('Bạn không có quyền thao tác cửa hàng này');
    return store;
  }
}
