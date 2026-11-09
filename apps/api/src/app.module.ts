import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { JobsModule } from './jobs/jobs.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1000,
      },
    ]),
    PrismaModule,
    AuthModule,
    StoresModule,
    VehiclesModule,
    BookingsModule,
    PaymentsModule,
    SystemConfigModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
