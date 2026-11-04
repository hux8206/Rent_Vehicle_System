import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectStoreDto {
  @ApiProperty({ example: 'Thông tin cửa hàng chưa đầy đủ, thiếu ảnh đại diện' })
  @IsString()
  @IsNotEmpty()
  rejectReason: string;
}

