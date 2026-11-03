import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertRentalPolicyDto {
  @ApiProperty({ example: 30, description: 'Phần trăm tiền cọc (VD: 30 = 30%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  depositPercent: number;

  @ApiPropertyOptional({ example: 'Hủy trước 24h được hoàn cọc' })
  @IsOptional()
  @IsString()
  cancelRule?: string;

  @ApiPropertyOptional({ example: 'Hoàn 100% nếu hủy trước 24h' })
  @IsOptional()
  @IsString()
  refundCondition?: string;
}
