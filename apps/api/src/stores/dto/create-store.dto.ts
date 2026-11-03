import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStoreDto {
  @ApiProperty({ example: 'Nhà xe ABC' })
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @ApiProperty({ example: '123 Nguyễn Văn Linh, Đà Nẵng' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  phoneContact: string;

  @ApiPropertyOptional({ example: 'Cửa hàng cho thuê xe uy tín' })
  @IsOptional()
  @IsString()
  description?: string;
}
