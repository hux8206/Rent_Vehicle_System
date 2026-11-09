import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';

/**
 * Wrapper service để khởi tạo PayOS SDK một lần duy nhất (Singleton).
 * Dùng chung cho cả thanh toán đơn thuê và nạp ví Partner.
 */
@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);
  public readonly client: any;

  constructor(private readonly config: ConfigService) {
    this.client = new PayOS({
      clientId: config.get<string>('PAYOS_CLIENT_ID') || 'demo_client_id',
      apiKey: config.get<string>('PAYOS_API_KEY') || 'demo_api_key',
      checksumKey: config.get<string>('PAYOS_CHECKSUM_KEY') || 'demo_checksum_key',
    });
    this.logger.log('PayOS SDK initialized');
  }

  async createPaymentLink(data: {
    orderCode: number;
    amount: number;
    description: string;
    returnUrl: string;
    cancelUrl: string;
  }) {
    if (this.client.paymentRequests?.create) {
      return await this.client.paymentRequests.create(data);
    }
    return await this.client.createPaymentLink(data);
  }

  async verifyWebhook(body: any) {
    if (this.client.webhooks?.verify) {
      return await this.client.webhooks.verify(body);
    }
    return this.client.verifyPaymentWebhookData(body);
  }
}
