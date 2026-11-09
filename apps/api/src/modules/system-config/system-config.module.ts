import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { SystemConfigService } from './system-config.service';
import {
  PublicSystemConfigController,
  AdminSystemConfigController,
} from './system-config.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PublicSystemConfigController, AdminSystemConfigController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}

