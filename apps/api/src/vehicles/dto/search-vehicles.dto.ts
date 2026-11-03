import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SearchVehiclesDto {
  @ApiProperty({ example: '2026-11-10T08:00:00.000Z', description: 'Thời điểm bắt đầu thuê (ISO8601)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-11-12T08:00:00.000Z', description: 'Thời điểm kết thúc thuê (ISO8601)' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ example: 1, description: '0: Xe số, 1: Tay ga, 2: Côn tay, 3: Ô tô/Xe điện' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  type?: number;

  @ApiPropertyOptional({ example: 'Honda' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filter theo storeId' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  storeId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Trang (pagination)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
}
