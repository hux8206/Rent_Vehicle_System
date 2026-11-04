import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateStoreDto {
  // ── Thông tin cửa hàng ────────────────────────────────────────────────────

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

  @ApiPropertyOptional({ example: 'Cửa hàng cho thuê xe uy tín tại Đà Nẵng' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/stores/abc_cover.jpg',
    description: 'URL ảnh đại diện / ảnh bìa cửa hàng',
  })
  @IsOptional()
  @IsString()
  storeImage?: string;

  // ── Chính sách thuê (tạo RentalPolicy đồng thời) ─────────────────────────

  @ApiProperty({
    example: 30,
    description: 'Phần trăm tiền cọc (VD: 30 = 30%). Tạo RentalPolicy luôn khi onboarding.',
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  depositPercent: number;

  @ApiPropertyOptional({ example: 'Hủy trước 24h được hoàn cọc 100%' })
  @IsOptional()
  @IsString()
  cancelRule?: string;

  @ApiPropertyOptional({ example: 'Hoàn 100% nếu hủy trước 24h, 50% nếu hủy trong ngày' })
  @IsOptional()
  @IsString()
  refundCondition?: string;

  // ── Thông tin ngân hàng nhận tiền (lưu vào User.partner) ─────────────────

  @ApiProperty({ example: '9876543210', description: 'Số tài khoản ngân hàng nhận doanh thu' })
  @IsString()
  @IsNotEmpty()
  bankAccountNum: string;

  @ApiProperty({ example: 'Vietcombank' })
  @IsString()
  @IsNotEmpty()
  bankName: string;
}

