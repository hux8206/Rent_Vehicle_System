import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class HandoverDto {
  @ApiProperty({
    example: 5,
    description: 'ID của VehicleItem (biển số xe) đã chọn để bàn giao cho khách',
  })
  @IsInt()
  @Type(() => Number)
  vehicleItemId: number;
}

