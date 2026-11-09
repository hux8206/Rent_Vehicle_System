import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UpsertRentalPolicyDto } from './dto/rental-policy.dto';
import { CreateStoreUpdateRequestDto } from './dto/store-update-request.dto';
import { SetOwnerPasswordDto, VerifyOwnerPasswordDto } from './dto/owner-security.dto';
import * as bcrypt from 'bcryptjs';

// Hằng số trạng thái cửa hàng
export const STORE_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  REJECTED: 2,
  PAUSED: 3,
  MAINTENANCE: 4,
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
          province: dto.province,
          address: dto.address,
          phoneContact: dto.phoneContact,
          description: dto.description,
          storeImage: dto.storeImage,
          openTime: dto.openTime || '07:00',
          closeTime: dto.closeTime || '21:00',
          status: STORE_STATUS.PENDING,
        },
      });

      // 3. Kiểm tra mức cọc tối thiểu toàn sàn (mặc định 15%)
      const sysConfig = await tx.systemConfig.findFirst();
      const minDeposit = sysConfig ? Number(sysConfig.minDepositPercent) : 15;
      if (dto.depositPercent < minDeposit) {
        throw new BadRequestException(`Mức cọc tối thiểu của hệ thống hiện tại là ${minDeposit}%`);
      }

      // 4. Tạo RentalPolicy luôn khi onboarding
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

  async updateStoreStatus(partnerId: number, storeId: number, status: number) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('Chi nhánh không tồn tại');
    if (store.partnerId !== partnerId) {
      throw new ForbiddenException('Bạn không có quyền thay đổi trạng thái chi nhánh này');
    }
    if (store.status === STORE_STATUS.PENDING) {
      throw new BadRequestException('Chi nhánh đang chờ Admin duyệt, chưa thể đổi trạng thái hoạt động.');
    }
    if (store.status === STORE_STATUS.REJECTED) {
      throw new BadRequestException('Chi nhánh đã bị từ chối duyệt, vui lòng cập nhật lại hồ sơ.');
    }

    return this.prisma.store.update({
      where: { id: storeId },
      data: { status },
      include: { rentalPolicy: true },
    });
  }

  async upsertRentalPolicy(partnerId: number, storeId: number, dto: UpsertRentalPolicyDto) {
    await this.assertOwnership(partnerId, storeId);

    const sysConfig = await this.prisma.systemConfig.findFirst();
    const minDeposit = sysConfig ? Number(sysConfig.minDepositPercent) : 15;
    if (dto.depositPercent < minDeposit) {
      throw new BadRequestException(`Mức cọc tối thiểu của hệ thống hiện tại là ${minDeposit}%`);
    }

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

  async findAllActive() {
    const stores = await this.prisma.store.findMany({
      where: {
        status: STORE_STATUS.ACTIVE,
        partner: { status: true },
      },
      include: {
        rentalPolicy: true,
        _count: { select: { vehicleModels: true } },
        reviews: {
          where: { isHidden: false },
          select: { rateStar: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    return stores.map((s) => {
      const reviewCount = s.reviews.length;
      const totalStars = s.reviews.reduce((acc, r) => acc + r.rateStar, 0);
      const avgRating = reviewCount > 0 ? Number((totalStars / reviewCount).toFixed(1)) : 5.0;
      const { reviews, ...rest } = s;
      return {
        ...rest,
        avgRating,
        reviewCount,
      };
    });
  }

  async findActiveStoreDetail(storeId: number) {
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        status: STORE_STATUS.ACTIVE,
        partner: { status: true },
      },
      include: {
        rentalPolicy: true,
        vehicleModels: {
          include: {
            vehicleItems: true,
          },
        },
        reviews: {
          where: { isHidden: false },
          include: {
            customer: { select: { id: true, fullName: true } },
          },
          orderBy: { id: 'desc' },
          take: 20,
        },
      },
    });
    if (!store) throw new NotFoundException('Cửa hàng không tồn tại, đã ngưng hoạt động hoặc đối tác bị khóa');

    const allStoreReviews = await this.prisma.review.findMany({
      where: { storeId, isHidden: false },
      select: { rateStar: true },
    });

    const reviewCount = allStoreReviews.length;
    const totalStars = allStoreReviews.reduce((acc, r) => acc + r.rateStar, 0);
    const avgRating = reviewCount > 0 ? Number((totalStars / reviewCount).toFixed(1)) : 5.0;

    return {
      ...store,
      avgRating,
      reviewCount,
    };
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

  // ─── Store Update Requests ────────────────────────────────────────────────

  async requestStoreUpdate(partnerId: number, storeId: number, dto: CreateStoreUpdateRequestDto) {
    const store = await this.prisma.store.findFirst({
      where: { id: storeId, partnerId },
      include: {
        rentalPolicy: true,
        partner: { select: { bankAccountNum: true, bankName: true } },
      },
    });
    if (!store) throw new ForbiddenException('Bạn không có quyền thao tác cửa hàng này');
    if (![STORE_STATUS.ACTIVE, STORE_STATUS.PAUSED, STORE_STATUS.MAINTENANCE].includes(store.status as any)) {
      throw new BadRequestException('Chỉ cửa hàng đã được phê duyệt mới có thể gửi yêu cầu cập nhật thông tin');
    }

    // Check min deposit percent
    const sysConfig = await this.prisma.systemConfig.findFirst();
    const minDeposit = sysConfig ? Number(sysConfig.minDepositPercent) : 15;
    if (dto.depositPercent < minDeposit) {
      throw new BadRequestException(`Mức cọc tối thiểu theo quy định hệ thống hiện tại là ${minDeposit}%`);
    }

    // Kiểm tra xem có thông tin nào thực sự thay đổi so với hiện tại hay không
    const isStoreNameChanged = dto.storeName && dto.storeName.trim() !== store.storeName.trim();
    const isProvinceChanged = (dto.province || '').trim() !== (store.province || '').trim();
    const isAddressChanged = dto.address && dto.address.trim() !== store.address.trim();
    const isPhoneChanged = dto.phoneContact && dto.phoneContact.trim() !== store.phoneContact.trim();
    const isDescChanged = (dto.description || '').trim() !== (store.description || '').trim();
    const isImageChanged = dto.storeImage && dto.storeImage.trim() !== (store.storeImage || '').trim();
    const isDepositChanged = dto.depositPercent !== undefined && Number(dto.depositPercent) !== Number(store.rentalPolicy?.depositPercent || 0);
    const isCancelRuleChanged = (dto.cancelRule || '').trim() !== (store.rentalPolicy?.cancelRule || '').trim();
    const isBankNumChanged = dto.bankAccountNum && dto.bankAccountNum.trim() !== (store.partner?.bankAccountNum || '').trim();
    const isBankNameChanged = dto.bankName && dto.bankName.trim() !== (store.partner?.bankName || '').trim();
    const isOpenTimeChanged = dto.openTime && dto.openTime.trim() !== (store.openTime || '').trim();
    const isCloseTimeChanged = dto.closeTime && dto.closeTime.trim() !== (store.closeTime || '').trim();

    const hasAnyChange =
      isStoreNameChanged ||
      isProvinceChanged ||
      isAddressChanged ||
      isPhoneChanged ||
      isDescChanged ||
      isImageChanged ||
      isDepositChanged ||
      isCancelRuleChanged ||
      isBankNumChanged ||
      isBankNameChanged ||
      isOpenTimeChanged ||
      isCloseTimeChanged;

    if (!hasAnyChange) {
      throw new BadRequestException('Thông tin không có gì thay đổi so với hiện tại, không cần gửi yêu cầu cập nhật.');
    }

    // Check if there is already a pending request
    const existingPending = await this.prisma.storeUpdateRequest.findFirst({
      where: { storeId, status: 0 },
    });
    if (existingPending) {
      return this.prisma.storeUpdateRequest.update({
        where: { id: existingPending.id },
        data: {
          storeName: dto.storeName,
          province: dto.province,
          address: dto.address,
          phoneContact: dto.phoneContact,
          description: dto.description,
          storeImage: dto.storeImage,
          depositPercent: dto.depositPercent,
          cancelRule: dto.cancelRule,
          bankAccountNum: dto.bankAccountNum,
          bankName: dto.bankName,
          openTime: dto.openTime,
          closeTime: dto.closeTime,
          status: 0,
          rejectReason: null,
        },
      });
    }

    return this.prisma.storeUpdateRequest.create({
      data: {
        storeId,
        partnerId,
        storeName: dto.storeName,
        province: dto.province,
        address: dto.address,
        phoneContact: dto.phoneContact,
        description: dto.description,
        storeImage: dto.storeImage,
        depositPercent: dto.depositPercent,
        cancelRule: dto.cancelRule,
        bankAccountNum: dto.bankAccountNum,
        bankName: dto.bankName,
        openTime: dto.openTime,
        closeTime: dto.closeTime,
        status: 0,
      },
    });
  }

  async getStoreUpdateRequestsForPartner(partnerId: number, storeId?: number) {
    return this.prisma.storeUpdateRequest.findMany({
      where: {
        partnerId,
        ...(storeId ? { storeId } : {}),
      },
      include: {
        store: true,
      },
      orderBy: { id: 'desc' },
    });
  }

  async getStoreUpdateRequestsForAdmin(status?: number) {
    return this.prisma.storeUpdateRequest.findMany({
      where: status !== undefined ? { status } : undefined,
      include: {
        store: {
          include: { rentalPolicy: true },
        },
        partner: {
          select: { id: true, fullName: true, email: true, phone: true, bankAccountNum: true, bankName: true },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async approveStoreUpdate(requestId: number) {
    const req = await this.prisma.storeUpdateRequest.findUnique({
      where: { id: requestId },
      include: { store: true },
    });
    if (!req) throw new NotFoundException('Yêu cầu cập nhật không tồn tại');
    if (req.status !== 0) throw new BadRequestException('Yêu cầu này đã được xử lý trước đó');

    return this.prisma.$transaction(async (tx) => {
      // 1. Update store
      await tx.store.update({
        where: { id: req.storeId },
        data: {
          storeName: req.storeName,
          province: req.province,
          address: req.address,
          phoneContact: req.phoneContact,
          description: req.description,
          storeImage: req.storeImage,
          ...(req.openTime && { openTime: req.openTime }),
          ...(req.closeTime && { closeTime: req.closeTime }),
        },
      });

      // 2. Update rental policy
      await tx.rentalPolicy.upsert({
        where: { storeId: req.storeId },
        create: {
          storeId: req.storeId,
          depositPercent: req.depositPercent,
          cancelRule: req.cancelRule,
        },
        update: {
          depositPercent: req.depositPercent,
          cancelRule: req.cancelRule,
        },
      });

      // 3. Update bank account if provided
      if (req.bankAccountNum && req.bankName) {
        await tx.user.update({
          where: { id: req.partnerId },
          data: {
            bankAccountNum: req.bankAccountNum,
            bankName: req.bankName,
          },
        });
      }

      // 4. Mark request as approved
      return tx.storeUpdateRequest.update({
        where: { id: requestId },
        data: { status: 1, rejectReason: null },
      });
    });
  }

  async rejectStoreUpdate(requestId: number, rejectReason: string) {
    const req = await this.prisma.storeUpdateRequest.findUnique({
      where: { id: requestId },
    });
    if (!req) throw new NotFoundException('Yêu cầu cập nhật không tồn tại');
    if (req.status !== 0) throw new BadRequestException('Yêu cầu này đã được xử lý trước đó');

    return this.prisma.storeUpdateRequest.update({
      where: { id: requestId },
      data: { status: 2, rejectReason },
    });
  }

  // ─── Owner Password Security ──────────────────────────────────────────────

  async getOwnerPasswordStatus(partnerId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
      select: { ownerPasswordHash: true },
    });
    return { hasOwnerPassword: !!user?.ownerPasswordHash };
  }

  async setOwnerPassword(partnerId: number, dto: SetOwnerPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (user.ownerPasswordHash) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại');
      }
      const isMatch = await bcrypt.compare(dto.currentPassword, user.ownerPasswordHash);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác');
      }
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: partnerId },
      data: { ownerPasswordHash: hashed },
    });

    return { success: true, message: 'Thiết lập mật khẩu chủ cửa hàng thành công' };
  }

  async verifyOwnerPassword(partnerId: number, dto: VerifyOwnerPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    if (!user.ownerPasswordHash) {
      return { verified: false, requiresSetup: true };
    }

    const isMatch = await bcrypt.compare(dto.password, user.ownerPasswordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu chủ cửa hàng không chính xác');
    }

    return { verified: true };
  }

  async deleteStore(partnerId: number, storeId: number) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        bookings: {
          where: {
            status: { in: [0, 1, 2, 4] }, // Pending, WaitingQueue, Confirmed, InRental
          },
        },
      },
    });
    if (!store) throw new NotFoundException('Chi nhánh không tồn tại');
    if (store.partnerId !== partnerId) {
      throw new ForbiddenException('Bạn không có quyền xóa chi nhánh này');
    }

    if (store.bookings && store.bookings.length > 0) {
      throw new BadRequestException('Không thể xóa chi nhánh khi đang có đơn thuê đang hoạt động hoặc chờ nhận xe!');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Delete reviews
      await tx.review.deleteMany({ where: { storeId } });

      // 2. Handle past bookings (completed/cancelled)
      const pastBookings = await tx.booking.findMany({
        where: { storeId },
        select: { id: true },
      });
      const pastBookingIds = pastBookings.map((b) => b.id);

      if (pastBookingIds.length > 0) {
        await tx.walletHistory.updateMany({
          where: { bookingId: { in: pastBookingIds } },
          data: { bookingId: null },
        });
        await tx.payment.deleteMany({
          where: { bookingId: { in: pastBookingIds } },
        });
        await tx.bookingDetail.deleteMany({
          where: { bookingId: { in: pastBookingIds } },
        });
        await tx.booking.deleteMany({
          where: { storeId },
        });
      }

      // 3. Delete vehicle items and models
      const models = await tx.vehicleModel.findMany({
        where: { storeId },
        select: { id: true },
      });
      const modelIds = models.map((m) => m.id);

      if (modelIds.length > 0) {
        await tx.vehicleItem.deleteMany({
          where: { modelId: { in: modelIds } },
        });
        await tx.bookingDetail.deleteMany({
          where: { modelId: { in: modelIds } },
        });
        await tx.vehicleModel.deleteMany({
          where: { storeId },
        });
      }

      // 4. Delete rental policies
      await tx.rentalPolicy.deleteMany({ where: { storeId } });

      // 5. Delete store update requests
      await tx.storeUpdateRequest.deleteMany({ where: { storeId } });

      // 6. Delete the store itself
      return tx.store.delete({ where: { id: storeId } });
    });
  }

  // ─── Helper ───────────────────────────────────────────────────────────────

  private async assertOwnership(partnerId: number, storeId: number) {
    const store = await this.prisma.store.findFirst({ where: { id: storeId, partnerId } });
    if (!store) throw new ForbiddenException('Bạn không có quyền thao tác cửa hàng này');
    return store;
  }
}

