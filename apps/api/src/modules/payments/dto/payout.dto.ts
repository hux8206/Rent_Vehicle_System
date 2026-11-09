import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePayoutRequestDto {
  @ApiProperty({ description: 'Số tiền muốn rút về tài khoản ngân hàng (VNĐ)', example: 500000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(50000, { message: 'Số tiền rút tối thiểu là 50.000 VNĐ' })
  amount: number;

  @ApiPropertyOptional({ description: 'Ghi chú rút tiền', example: 'Rút doanh thu tuần 1 tháng 11' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReviewPayoutDto {
  @ApiProperty({ description: 'Trạng thái duyệt: 1 (APPROVED - Đã chuyển khoản), 2 (REJECTED - Từ chối & hoàn tiền ví)', example: 1 })
  @IsNotEmpty()
  @IsInt()
  status: number; // 1: Approved, 2: Rejected

  @ApiPropertyOptional({ description: 'Ghi chú/Lý do từ chối hoặc mã giao dịch ngân hàng', example: 'Đã chuyển khoản thành công' })
  @IsOptional()
  @IsString()
  note?: string;
}

