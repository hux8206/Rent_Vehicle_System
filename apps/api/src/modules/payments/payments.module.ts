import { Module } from '@nestjs/common';
import {
  CustomerPaymentsController,
  PartnerWalletController,
  WebhookController,
} from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayosService } from './payos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    CustomerPaymentsController,
    PartnerWalletController,
    WebhookController,
  ],
  providers: [PaymentsService, PayosService],
  exports: [PaymentsService, PayosService],
})
export class PaymentsModule {}

