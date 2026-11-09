import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSystemConfigDto } from './dto/update-system-config.dto';

@Injectable()
export class SystemConfigService {
  private readonly logger = new Logger(SystemConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình hệ thống hiện tại. Nếu chưa có thì khởi tạo cấu hình mặc định:
   * - commissionRate: 10%
   * - creditLimit: 500.000 VNĐ
   * - minDepositPercent: 15%
   */
  async getConfig() {
    let config = await this.prisma.systemConfig.findFirst();
    if (!config) {
      config = await this.prisma.systemConfig.create({
        data: {
          commissionRate: 10.0,
          creditLimit: 500000.0,
          minDepositPercent: 15.0,
        },
      });
      this.logger.log('Khởi tạo SystemConfig mặc định thành công');
    }

    return {
      id: config.id,
      commissionRate: Number(config.commissionRate),
      creditLimit: Number(config.creditLimit),
      minDepositPercent: Number(config.minDepositPercent),
      updatedAt: config.updatedAt,
    };
  }

  /**
   * Admin cập nhật cấu hình hệ thống:
   * - commissionRate: 0% - 100% (0 = tắt hoa hồng để kích cầu)
   * - creditLimit: >= 0
   * - minDepositPercent: 0% - 100% (15% mặc định, 0 = không bắt buộc cọc)
   */
  async updateConfig(dto: UpdateSystemConfigDto) {
    const current = await this.getConfig();

    const updateData: any = {};
    if (dto.commissionRate !== undefined) {
      updateData.commissionRate = dto.commissionRate;
    }
    if (dto.creditLimit !== undefined) {
      updateData.creditLimit = dto.creditLimit;
    }
    if (dto.minDepositPercent !== undefined) {
      updateData.minDepositPercent = dto.minDepositPercent;
    }

    const updated = await this.prisma.systemConfig.update({
      where: { id: current.id },
      data: updateData,
    });

    // Nếu thay đổi hạn mức nợ creditLimit, tự động cập nhật hạn mức cho các ví đối tác
    if (dto.creditLimit !== undefined) {
      await this.prisma.partnerWallet.updateMany({
        data: { creditLimit: dto.creditLimit },
      });
      this.logger.log(`Đồng bộ creditLimit = ${dto.creditLimit}đ cho toàn bộ PartnerWallet`);
    }

    this.logger.log(
      `Cập nhật SystemConfig thành công: Hoa hồng=${Number(updated.commissionRate)}%, Hạn mức nợ=${Number(updated.creditLimit)}đ, Cọc tối thiểu=${Number(updated.minDepositPercent)}%`,
    );

    return {
      id: updated.id,
      commissionRate: Number(updated.commissionRate),
      creditLimit: Number(updated.creditLimit),
      minDepositPercent: Number(updated.minDepositPercent),
      updatedAt: updated.updatedAt,
    };
  }
}

