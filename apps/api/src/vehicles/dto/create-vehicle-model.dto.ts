import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateVehicleModelDto {
  @ApiProperty({ example: 1, description: 'ID của cửa hàng' })
  @IsInt()
  @Type(() => Number)
  storeId: number;

  @ApiProperty({ example: 'Honda Air Blade 125cc' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Honda' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 1, description: '0: Xe số, 1: Tay ga, 2: Côn tay/PKL, 3: Xe điện/Ô tô' })
  @IsInt()
  @Type(() => Number)
  type: number;

  @ApiProperty({ example: 150000, description: 'Giá thuê theo ngày (VNĐ)' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rentPrice: number;

  @ApiPropertyOptional({ example: 'Xe ga tiết kiệm nhiên liệu' })
  @IsOptional()
  @IsString()
  specifications?: string;

  @ApiPropertyOptional({ example: ['https://img.example.com/airblade.jpg'], type: [String] })
  @IsOptional()
  @IsArray()
  images?: string[];
}
