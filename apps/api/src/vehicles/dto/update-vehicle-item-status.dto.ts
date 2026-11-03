import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateVehicleItemStatusDto {
  @ApiProperty({
    example: 3,
    description: '0: Available, 1: Reserved, 2: Rented, 3: Maintenance',
  })
  @IsInt()
  @Min(0)
  @Max(3)
  @Type(() => Number)
  status: number;
}
