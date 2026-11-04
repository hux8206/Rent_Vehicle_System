import { Module } from '@nestjs/common';
import { AdminStoresController, StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StoresController, AdminStoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
