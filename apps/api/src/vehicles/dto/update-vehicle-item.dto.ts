import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateVehicleItemDto {
  @ApiPropertyOptional({ example: '29A1-99999' })
  @IsOptional()
  @IsString()
  licensePlate?: string;

  @ApiPropertyOptional({ example: 'Đen nhám' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'RLH123456789' })
  @IsOptional()
  @IsString()
  chassisNumber?: string;

  @ApiPropertyOptional({
    example: 0,
    description: '0: Available, 1: Reserved, 2: Rented, 3: Maintenance',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  @Type(() => Number)
  status?: number;
}

