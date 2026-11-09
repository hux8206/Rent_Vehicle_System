import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateStoreUpdateRequestDto {
  @ApiProperty({ example: 'Nhà xe ABC Chi nhánh 1' })
  @IsString()
  @IsNotEmpty({ message: 'Tên cửa hàng không được để trống' })
  storeName: string;

  @ApiPropertyOptional({ example: 'Đà Nẵng' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiProperty({ example: '123 Nguyễn Văn Linh, Đà Nẵng' })
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty({ message: 'Số điện thoại không được để trống' })
  phoneContact: string;

  @ApiPropertyOptional({ example: 'Cửa hàng chuyên cho thuê xe máy, ô tô tự lái' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
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

  @ApiProperty({ example: 20, description: 'Tỷ lệ cọc mong muốn thay đổi (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  depositPercent: number;

  @ApiPropertyOptional({ example: 'Hủy trước 24h hoàn cọc 100%' })
  @IsOptional()
  @IsString()
  cancelRule?: string;

  @ApiPropertyOptional({ example: '0123456789' })
  @IsOptional()
  @IsString()
  bankAccountNum?: string;

  @ApiPropertyOptional({ example: 'Vietcombank' })
  @IsOptional()
  @IsString()
  bankName?: string;
}

export class RejectStoreUpdateRequestDto {
  @ApiProperty({ example: 'Thông tin tài khoản không khớp với người đại diện' })
  @IsString()
  @IsNotEmpty({ message: 'Lý do từ chối không được để trống' })
  rejectReason: string;
}

