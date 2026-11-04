import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HoldExpiryJob } from './hold-expiry.job';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule],
  providers: [HoldExpiryJob],
})
export class JobsModule {}

