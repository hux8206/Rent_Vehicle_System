import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

/** Body nhận từ PayOS webhook callback */
export class PayosWebhookDto {
  @ApiProperty({ description: 'Dữ liệu giao dịch từ PayOS' })
  data: {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId: string;
    counterAccountBankName: string;
    counterAccountName: string;
    counterAccountNumber: string;
    virtualAccountName: string;
    virtualAccountNumber: string;
  };

  @ApiProperty({ description: 'Chữ ký checksum từ PayOS' })
  signature: string;
}

/** Body nạp tiền ví Partner */
export class DepositWalletDto {
  @ApiProperty({ example: 500000, description: 'Số tiền nạp vào ví (VNĐ)' })
  @IsInt()
  @Type(() => Number)
  amount: number;

  @ApiProperty({ example: 'Nạp tiền vào ví đối tác', description: 'Mô tả giao dịch' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

