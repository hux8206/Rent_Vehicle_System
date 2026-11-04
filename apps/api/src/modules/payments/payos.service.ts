import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PayOS from '@payos/node';

/**
 * Wrapper service để khởi tạo PayOS SDK một lần duy nhất (Singleton).
 * Dùng chung cho cả thanh toán đơn thuê và nạp ví Partner.
 */
@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);
  public readonly client: PayOS;

  constructor(private readonly config: ConfigService) {
    this.client = new PayOS(
      config.getOrThrow<string>('PAYOS_CLIENT_ID'),
      config.getOrThrow<string>('PAYOS_API_KEY'),
      config.getOrThrow<string>('PAYOS_CHECKSUM_KEY'),
    );
    this.logger.log('PayOS SDK initialized');
  }
}

