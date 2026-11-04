import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpsertRentalPolicyDto } from './dto/rental-policy.dto';

// Hằng số trạng thái cửa hàng
export const STORE_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  REJECTED: 2,
} as const;

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Onboarding cửa hàng:
   * - Tạo Store với status = 0 (PENDING)
   * - Tạo RentalPolicy đồng thời
   * - Cập nhật thông tin ngân hàng vào User (Partner)
   */
  async create(partnerId: number, dto: CreateStoreDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật thông tin ngân hàng vào profile Partner
      await tx.user.update({
        where: { id: partnerId },
        data: {
          bankAccountNum: dto.bankAccountNum,
          bankName: dto.bankName,
        },
      });

      // 2. Tạo Store — status = 0 (PENDING, chờ Admin duyệt)
      const store = await tx.store.create({
        data: {
          partnerId,
          storeName: dto.storeName,
          address: dto.address,
          phoneContact: dto.phoneContact,
          description: dto.description,
          storeImage: dto.storeImage,
          status: STORE_STATUS.PENDING,
        },
      });

      // 3. Tạo RentalPolicy luôn khi onboarding
      const policy = await tx.rentalPolicy.create({
        data: {
          storeId: store.id,
          depositPercent: dto.depositPercent,
          cancelRule: dto.cancelRule,
          refundCondition: dto.refundCondition,
        },
      });

      return { ...store, rentalPolicy: policy };
    });
  }

  async findAll(partnerId: number) {
    return this.prisma.store.findMany({
      where: { partnerId },
      include: { rentalPolicy: true, _count: { select: { vehicleModels: true } } },
    });
  }

  async findOne(partnerId: number, storeId: number) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, partnerId },
      include: { rentalPolicy: true, vehicleModels: { include: { vehicleItems: true } } },
    });
    if (!store) throw new NotFoundException('Cửa hàng không tồn tại');
    return store;
  }

  async update(partnerId: number, storeId: number, dto: UpdateStoreDto) {
    await this.assertOwnership(partnerId, storeId);
    return this.prisma.store.update({ where: { id: storeId }, data: dto });
  }

  async upsertRentalPolicy(partnerId: number, storeId: number, dto: UpsertRentalPolicyDto) {
    await this.assertOwnership(partnerId, storeId);
    return this.prisma.rentalPolicy.upsert({
      where: { storeId },
      create: { storeId, ...dto },
      update: { ...dto },
    });
  }

  async getRentalPolicy(partnerId: number, storeId: number) {
    await this.assertOwnership(partnerId, storeId);
    const policy = await this.prisma.rentalPolicy.findUnique({ where: { storeId } });
    if (!policy) throw new NotFoundException('Chính sách thuê chưa được thiết lập');
    return policy;
  }

  // ─── Admin actions ────────────────────────────────────────────────────────

  async findAllForAdmin(status?: number) {
    return this.prisma.store.findMany({
      where: status !== undefined ? { status } : undefined,
      include: {
        partner: { select: { id: true, fullName: true, email: true, phone: true, bankAccountNum: true, bankName: true } },
        rentalPolicy: true,
        _count: { select: { vehicleModels: true } },
      },
      orderBy: { id: 'desc' },
    });
  }

  async approveStore(storeId: number) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Cửa hàng không tồn tại');
    return this.prisma.store.update({
      where: { id: storeId },
      data: { status: STORE_STATUS.ACTIVE, rejectReason: null },
    });
  }

  async rejectStore(storeId: number, rejectReason: string) {
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Cửa hàng không tồn tại');
    return this.prisma.store.update({
      where: { id: storeId },
      data: { status: STORE_STATUS.REJECTED, rejectReason },
    });
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private async assertOwnership(partnerId: number, storeId: number) {
    const store = await this.prisma.store.findFirst({ where: { id: storeId, partnerId } });
    if (!store) throw new ForbiddenException('Bạn không có quyền thao tác cửa hàng này');
    return store;
  }
}

