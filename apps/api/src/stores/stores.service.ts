import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpsertRentalPolicyDto } from './dto/rental-policy.dto';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(partnerId: number, dto: CreateStoreDto) {
    return this.prisma.store.create({
      data: { ...dto, partnerId },
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

  private async assertOwnership(partnerId: number, storeId: number) {
    const store = await this.prisma.store.findFirst({ where: { id: storeId, partnerId } });
    if (!store) throw new ForbiddenException('Bạn không có quyền thao tác cửa hàng này');
    return store;
  }
}
