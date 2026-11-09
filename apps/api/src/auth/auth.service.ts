import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registerCustomer(dto: RegisterCustomerDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email đã được đăng ký');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone,
        role: 2, // Customer
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async registerPartner(dto: RegisterPartnerDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email đã được đăng ký');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Tạo User và PartnerWallet trong cùng 1 transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          phone: dto.phone,
          role: 1, // Partner
        },
      });

      await tx.partnerWallet.create({
        data: {
          partnerId: newUser.id,
          balance: 0,
          creditLimit: 500000,
          status: 1,
        },
      });

      return newUser;
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Email hoặc mật khẩu không đúng');

    if (!user.status) {
      throw new UnauthorizedException(
        'Tài khoản của bạn đã bị khóa bởi Quản trị viên sàn. Vui lòng liên hệ ban quản trị để được hỗ trợ.',
      );
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwt.sign(payload);

    const { passwordHash: _, ...userResult } = user;
    return { accessToken, user: userResult };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async updateProfile(
    userId: number,
    dto: {
      fullName?: string;
      phone?: string;
      bankAccountNum?: string;
      bankName?: string;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAllUsers() {
    return this.prisma.user.findMany({
      where: {
        role: { in: [1, 2] }, // Không hiển thị Admin (0), chỉ quản lý Partner (1) và Customer (2)
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        bankAccountNum: true,
        bankName: true,
        createdAt: true,
        partnerWallet: {
          select: {
            balance: true,
            creditLimit: true,
          },
        },
        _count: {
          select: {
            stores: true,
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  async findUserDetailsForAdmin(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        status: true,
        bankAccountNum: true,
        bankName: true,
        ownerPasswordHash: true,
        createdAt: true,
        partnerWallet: {
          include: {
            histories: {
              take: 20,
              orderBy: { id: 'desc' },
            },
          },
        },
        stores: {
          include: {
            rentalPolicy: true,
            _count: { select: { vehicleModels: true, bookings: true } },
            vehicleModels: {
              include: {
                _count: { select: { vehicleItems: true } },
                vehicleItems: true,
              },
              orderBy: { id: 'desc' },
            },
            bookings: {
              include: {
                customer: { select: { id: true, fullName: true, phone: true, email: true } },
                bookingDetails: {
                  include: {
                    model: true,
                    vehicleItem: true,
                  },
                },
                payments: true,
                review: true,
              },
              orderBy: { id: 'desc' },
            },
          },
          orderBy: { id: 'desc' },
        },
        bookings: {
          include: {
            store: { select: { id: true, storeName: true, address: true, phoneContact: true } },
            bookingDetails: {
              include: {
                model: true,
                vehicleItem: true,
              },
            },
            payments: true,
            review: true,
          },
          orderBy: { id: 'desc' },
        },
        reviews: {
          include: {
            store: { select: { id: true, storeName: true } },
            booking: { select: { id: true, bookingCode: true } },
          },
          orderBy: { id: 'desc' },
        },
        storeUpdateRequests: {
          include: {
            store: { select: { id: true, storeName: true } },
          },
          orderBy: { id: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const { ownerPasswordHash, ...rest } = user;
    return {
      ...rest,
      hasOwnerPassword: !!ownerPasswordHash,
    };
  }

  async toggleUserStatus(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Người dùng không tồn tại');
    if (user.role === 0) {
      throw new BadRequestException('Không thể khóa tài khoản Quản trị viên (Admin)!');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { status: !user.status },
      select: { id: true, status: true },
    });
  }

  async deleteUserForAdmin(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        stores: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (user.role === 0) {
      throw new BadRequestException('Không thể xóa tài khoản Quản trị viên (Admin)!');
    }

    if (user.status) {
      throw new BadRequestException('Chỉ có thể xóa tài khoản đang ở trạng thái bị khóa!');
    }

    // Check if Customer has active bookings
    if (user.role === 2) {
      const activeBooking = await this.prisma.booking.findFirst({
        where: {
          customerId: userId,
          status: { in: [0, 1, 2, 4] }, // Pending, WaitingQueue, Confirmed, InRental
        },
      });
      if (activeBooking) {
        throw new BadRequestException('Không thể xóa tài khoản khách hàng đang có đơn thuê xe hoạt động hoặc chờ nhận xe!');
      }
    }

    // Check if Partner has active bookings in their stores
    if (user.role === 1 && user.stores.length > 0) {
      const storeIds = user.stores.map((s) => s.id);
      const activeStoreBooking = await this.prisma.booking.findFirst({
        where: {
          storeId: { in: storeIds },
          status: { in: [0, 1, 2, 4] },
        },
      });
      if (activeStoreBooking) {
        throw new BadRequestException('Không thể xóa tài khoản đối tác có chi nhánh đang trong đơn thuê xe hoạt động hoặc chờ nhận xe!');
      }
    }

    // Proceed to safely delete user and all related records in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. If Customer:
      if (user.role === 2) {
        // Delete reviews written by this customer
        await tx.review.deleteMany({ where: { customerId: userId } });

        // Past bookings cleanup
        const pastBookings = await tx.booking.findMany({
          where: { customerId: userId },
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
            where: { customerId: userId },
          });
        }
      }

      // 3. If Partner:
      if (user.role === 1) {
        // Payout requests
        await tx.payoutRequest.deleteMany({ where: { partnerId: userId } });

        // Store update requests
        await tx.storeUpdateRequest.deleteMany({ where: { partnerId: userId } });

        // Partner wallet & histories
        const wallet = await tx.partnerWallet.findUnique({ where: { partnerId: userId } });
        if (wallet) {
          await tx.walletHistory.deleteMany({ where: { walletId: wallet.id } });
          await tx.partnerWallet.delete({ where: { id: wallet.id } });
        }

        // Stores cleanup
        const storeIds = user.stores.map((s) => s.id);
        if (storeIds.length > 0) {
          // Reviews for these stores
          await tx.review.deleteMany({ where: { storeId: { in: storeIds } } });

          // Past bookings for these stores
          const pastStoreBookings = await tx.booking.findMany({
            where: { storeId: { in: storeIds } },
            select: { id: true },
          });
          const pastStoreBookingIds = pastStoreBookings.map((b) => b.id);
          if (pastStoreBookingIds.length > 0) {
            await tx.walletHistory.updateMany({
              where: { bookingId: { in: pastStoreBookingIds } },
              data: { bookingId: null },
            });
            await tx.payment.deleteMany({
              where: { bookingId: { in: pastStoreBookingIds } },
            });
            await tx.bookingDetail.deleteMany({
              where: { bookingId: { in: pastStoreBookingIds } },
            });
            await tx.booking.deleteMany({
              where: { storeId: { in: storeIds } },
            });
          }

          // Vehicle items and models
          const models = await tx.vehicleModel.findMany({
            where: { storeId: { in: storeIds } },
            select: { id: true },
          });
          const modelIds = models.map((m) => m.id);
          if (modelIds.length > 0) {
            await tx.vehicleItem.deleteMany({ where: { modelId: { in: modelIds } } });
            await tx.bookingDetail.deleteMany({ where: { modelId: { in: modelIds } } });
            await tx.vehicleModel.deleteMany({ where: { storeId: { in: storeIds } } });
          }

          // Rental policies
          await tx.rentalPolicy.deleteMany({ where: { storeId: { in: storeIds } } });

          // Delete stores
          await tx.store.deleteMany({ where: { id: { in: storeIds } } });
        }
      }

      // 4. Delete the user
      await tx.user.delete({ where: { id: userId } });

      return { success: true, message: 'Đã xóa vĩnh viễn tài khoản người dùng thành công' };
    });
  }
}
