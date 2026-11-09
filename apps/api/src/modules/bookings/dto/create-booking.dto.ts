import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 1, description: 'ID dòng xe muốn thuê' })
  @IsInt()
  @Type(() => Number)
  modelId: number;

  @ApiProperty({ example: 1, description: 'ID cửa hàng' })
  @IsInt()
  @Type(() => Number)
  storeId: number;

  @ApiProperty({
    example: '2026-11-10T08:00:00.000Z',
    description: 'Thời điểm bắt đầu thuê (ISO8601)',
  })
  @IsDateString()
  startTime: string;

  @ApiProperty({
    example: '2026-11-12T08:00:00.000Z',
    description: 'Thời điểm kết thúc thuê (ISO8601)',
  })
  @IsDateString()
  endTime: string;

  @ApiProperty({
    example: 0,
    description: '0: Tự đến lấy xe (AtStore), 1: Giao xe tận nơi (Delivery)',
  })
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  pickupType: number;

  @ApiPropertyOptional({
    example: '123 Lê Duẩn, Đà Nẵng',
    description: 'Bắt buộc nếu pickupType = 1 (Delivery)',
  })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiProperty({
    example: 1,
    description: '0: Thanh toán toàn bộ, 1: Chỉ đặt cọc theo chính sách cửa hàng',
  })
  @IsInt()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  paymentType: number;
}

