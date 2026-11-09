import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehicleItemDto {
  @ApiProperty({ example: '43B1-999.88', description: 'Biển số xe' })
  @IsString()
  @IsNotEmpty()
  licensePlate: string;

  @ApiPropertyOptional({ example: 'Đỏ' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: 'ABC123XYZ' })
  @IsOptional()
  @IsString()
  chassisNumber?: string;
}

export class BulkCreateVehicleItemDto {
  @ApiProperty({ type: [CreateVehicleItemDto], description: 'Danh sách các xe vật lý cần thêm hàng loạt' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVehicleItemDto)
  items: CreateVehicleItemDto[];
}

