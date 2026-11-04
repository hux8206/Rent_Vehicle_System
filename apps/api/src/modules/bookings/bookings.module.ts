import { Module } from '@nestjs/common';
import { CustomerBookingsController, PartnerBookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerBookingsController, PartnerBookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

