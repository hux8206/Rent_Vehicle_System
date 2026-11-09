import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Nhà xe XYZ' })
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional({ example: 'Đà Nẵng' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phoneContact?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/stores/xyz_cover.jpg' })
  @IsOptional()
  @IsString()
  storeImage?: string;

  @ApiPropertyOptional({ example: '07:00' })
  @IsOptional()
  @IsString()
  openTime?: string;

  @ApiPropertyOptional({ example: '21:00' })
  @IsOptional()
  @IsString()
  closeTime?: string;
}

