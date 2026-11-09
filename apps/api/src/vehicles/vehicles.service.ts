import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';
import { CreateVehicleItemDto } from './dto/create-vehicle-item.dto';
import { UpdateVehicleItemDto } from './dto/update-vehicle-item.dto';
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

  async findAllModels(partnerId: number, storeId?: number) {
    if (storeId) {
      await this.assertStoreOwnership(partnerId, storeId);
      return this.prisma.vehicleModel.findMany({
        where: { storeId },
        include: {
          store: true,
          vehicleItems: true,
          _count: { select: { vehicleItems: true } },
        },
      });
    }

    const partnerStores = await this.prisma.store.findMany({
      where: { partnerId },
      select: { id: true },
    });
    const storeIds = partnerStores.map((s) => s.id);

    return this.prisma.vehicleModel.findMany({
      where: { storeId: { in: storeIds } },
      include: {
        store: true,
        vehicleItems: true,
        _count: { select: { vehicleItems: true } },
      },
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
      include: {
        vehicleItems: true,
        bookingDetails: {
          include: { booking: true },
        },
      },
    });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');
    await this.assertStoreOwnership(partnerId, model.storeId);

    // Kiểm tra xem có đơn thuê đang hoạt động với dòng xe này không
    const activeBookingDetail = model.bookingDetails?.find((bd) =>
      [0, 1, 2, 4].includes(bd.booking?.status),
    );
    if (activeBookingDetail) {
      throw new BadRequestException('Không thể xóa dòng xe đang có đơn thuê đang hoạt động hoặc chờ nhận xe!');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Xóa các booking detail lịch sử liên quan đến dòng xe này
      await tx.bookingDetail.deleteMany({ where: { modelId } });

      // 2. Xóa các xe / biển số thuộc dòng xe này
      await tx.vehicleItem.deleteMany({ where: { modelId } });

      // 3. Xóa dòng xe
      return tx.vehicleModel.delete({ where: { id: modelId } });
    });
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

  async addBulkVehicleItems(partnerId: number, modelId: number, items: CreateVehicleItemDto[]) {
    const model = await this.prisma.vehicleModel.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');
    await this.assertStoreOwnership(partnerId, model.storeId);

    const createdItems: any[] = [];
    const duplicates: string[] = [];

    for (const item of items) {
      if (!item.licensePlate || !item.licensePlate.trim()) continue;
      const plate = item.licensePlate.trim().toUpperCase();

      const existing = await this.prisma.vehicleItem.findUnique({
        where: { licensePlate: plate },
      });
      if (existing) {
        duplicates.push(plate);
        continue;
      }

      const created = await this.prisma.vehicleItem.create({
        data: {
          modelId,
          licensePlate: plate,
          color: item.color ? item.color.trim() : 'Tiêu chuẩn',
          chassisNumber: item.chassisNumber ? item.chassisNumber.trim() : null,
          status: 0,
        },
      });
      createdItems.push(created);
    }

    return {
      success: true,
      totalAdded: createdItems.length,
      items: createdItems,
      duplicates,
      message:
        `Đã thêm thành công ${createdItems.length} xe vào kho.` +
        (duplicates.length > 0 ? ` Bỏ qua ${duplicates.length} biển số bị trùng: ${duplicates.join(', ')}` : ''),
    };
  }

  async getVehicleItems(partnerId: number, modelId: number) {
    const model = await this.prisma.vehicleModel.findUnique({ where: { id: modelId } });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại');
    await this.assertStoreOwnership(partnerId, model.storeId);

    return this.prisma.vehicleItem.findMany({ where: { modelId } });
  }

  async updateVehicleItem(
    partnerId: number,
    itemId: number,
    dto: UpdateVehicleItemDto,
  ) {
    const item = await this.prisma.vehicleItem.findUnique({
      where: { id: itemId },
      include: { model: true },
    });
    if (!item) throw new NotFoundException('Xe không tồn tại');
    await this.assertStoreOwnership(partnerId, item.model.storeId);

    if (dto.licensePlate && dto.licensePlate.trim() !== item.licensePlate) {
      const existing = await this.prisma.vehicleItem.findUnique({
        where: { licensePlate: dto.licensePlate.trim() },
      });
      if (existing) {
        throw new ConflictException(`Biển số xe ${dto.licensePlate} đã tồn tại trong hệ thống!`);
      }
    }

    return this.prisma.vehicleItem.update({
      where: { id: itemId },
      data: {
        licensePlate: dto.licensePlate !== undefined ? dto.licensePlate.trim() : undefined,
        color: dto.color !== undefined ? dto.color.trim() : undefined,
        chassisNumber: dto.chassisNumber !== undefined ? dto.chassisNumber.trim() : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
      },
    });
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
      include: {
        model: true,
        bookingDetails: {
          include: { booking: true },
        },
      },
    });
    if (!item) throw new NotFoundException('Xe không tồn tại');
    await this.assertStoreOwnership(partnerId, item.model.storeId);

    // Kiểm tra xem xe có đang trong đơn thuê hoạt động không
    const activeBookingDetail = item.bookingDetails?.find((bd) =>
      [0, 1, 2, 4].includes(bd.booking?.status),
    );
    if (activeBookingDetail) {
      throw new BadRequestException('Không thể xóa xe đang trong đơn thuê hoạt động hoặc chờ nhận xe!');
    }

    // Set null cho past booking details để không vi phạm ràng buộc khóa ngoại
    await this.prisma.bookingDetail.updateMany({
      where: { vehicleItemId: itemId },
      data: { vehicleItemId: null },
    });

    return this.prisma.vehicleItem.delete({ where: { id: itemId } });
  }

  // ─── PUBLIC: Search VehicleModels with availability (Flow 1) ────────────────

  async searchPublic(dto: SearchVehiclesDto) {
    const { startTime, endTime, type, brand, storeId, province, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const where: Prisma.VehicleModelWhereInput = {
      store: {
        status: 1, // 1 = ACTIVE
        partner: { status: true }, // Đối tác phải đang hoạt động (không bị khóa)
        ...(province && province.trim() && province !== 'all' && {
          OR: [
            { province: { contains: province.trim() } },
            { province: { contains: province.replace(/^TP\.\s*/i, '').trim() } },
            { address: { contains: province.trim() } },
            { address: { contains: province.replace(/^TP\.\s*/i, '').trim() } },
          ],
        }),
      },
      ...(type !== undefined && { type }),
      ...(brand && { brand: { contains: brand } }),
      ...(storeId && { storeId }),
    };

    const models = await this.prisma.vehicleModel.findMany({
      where,
      include: {
        store: { select: { id: true, storeName: true, address: true, phoneContact: true, province: true } },
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

        // Thống kê đánh giá thực tế của dòng xe
        const reviewsAgg = await this.prisma.review.aggregate({
          where: {
            isHidden: false,
            booking: { bookingDetails: { some: { modelId: model.id } } },
          },
          _avg: { rateStar: true },
          _count: { id: true },
        });

        const reviewCount = reviewsAgg._count.id;
        const avgRating =
          reviewCount > 0 && reviewsAgg._avg.rateStar
            ? Number(reviewsAgg._avg.rateStar.toFixed(1))
            : 5.0;

        // Thống kê đánh giá trung bình của cửa hàng
        const storeReviewsAgg = await this.prisma.review.aggregate({
          where: {
            isHidden: false,
            storeId: model.storeId,
          },
          _avg: { rateStar: true },
          _count: { id: true },
        });
        const storeReviewCount = storeReviewsAgg._count.id;
        const storeAvgRating =
          storeReviewCount > 0 && storeReviewsAgg._avg.rateStar
            ? Number(storeReviewsAgg._avg.rateStar.toFixed(1))
            : 5.0;

        const { vehicleItems: _, ...modelData } = model;
        return {
          ...modelData,
          store: {
            ...model.store,
            avgRating: storeAvgRating,
            reviewCount: storeReviewCount,
          },
          totalActiveItems,
          busyCount,
          availableCount,
          avgRating,
          reviewCount,
        };
      }),
    );

    return {
      data: result,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getModelDetail(modelId: number, startTime: string, endTime: string) {
    const model = await this.prisma.vehicleModel.findFirst({
      where: {
        id: modelId,
        store: {
          status: 1, // ACTIVE
          partner: { status: true }, // Partner không bị khóa
        },
      },
      include: {
        store: {
          include: { rentalPolicy: true },
        },
        vehicleItems: { select: { id: true, status: true, color: true } },
      },
    });
    if (!model) throw new NotFoundException('Dòng xe không tồn tại hoặc đối tác đã ngưng hoạt động');

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

    // Lấy danh sách đánh giá thực tế của dòng xe này
    const reviews = await this.prisma.review.findMany({
      where: {
        isHidden: false,
        booking: {
          bookingDetails: {
            some: { modelId },
          },
        },
      },
      include: {
        customer: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number((reviews.reduce((acc, r) => acc + r.rateStar, 0) / reviewCount).toFixed(1))
        : 5.0;

    const storeReviews = await this.prisma.review.findMany({
      where: { storeId: model.storeId, isHidden: false },
      select: { rateStar: true },
    });
    const storeReviewCount = storeReviews.length;
    const storeAvgRating =
      storeReviewCount > 0
        ? Number((storeReviews.reduce((acc, r) => acc + r.rateStar, 0) / storeReviewCount).toFixed(1))
        : 5.0;

    const { vehicleItems: _, ...modelData } = model;
    return {
      ...modelData,
      store: {
        ...model.store,
        avgRating: storeAvgRating,
        reviewCount: storeReviewCount,
      },
      totalActiveItems,
      busyCount,
      availableCount,
      reviews,
      avgRating,
      reviewCount,
    };
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private async assertStoreOwnership(partnerId: number, storeId: number) {
    const store = await this.prisma.store.findFirst({ where: { id: storeId, partnerId } });
    if (!store) throw new ForbiddenException('Bạn không có quyền thao tác cửa hàng này');
    return store;
  }
}
