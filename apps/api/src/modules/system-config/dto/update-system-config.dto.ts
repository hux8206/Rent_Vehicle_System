import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class UpdateSystemConfigDto {
  @ApiPropertyOptional({
    description: 'Tỷ lệ hoa hồng sàn (%) (VD: 10 = 10%, 0 = Miễn phí hoa hồng giai đoạn đầu)',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Tỷ lệ hoa hồng không được nhỏ hơn 0%' })
  @Max(100, { message: 'Tỷ lệ hoa hồng không được vượt quá 100%' })
  commissionRate?: number;

  @ApiPropertyOptional({
    description: 'Hạn mức tiền âm cho phép của ví đối tác (VNĐ) (VD: 500000)',
    example: 500000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Hạn mức tiền âm không được nhỏ hơn 0' })
  creditLimit?: number;

  @ApiPropertyOptional({
    description: 'Mức cọc tối thiểu toàn hệ thống (%) (VD: 15 = 15%, 0 = Tắt yêu cầu cọc bắt buộc)',
    example: 15,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Mức cọc tối thiểu không được nhỏ hơn 0%' })
  @Max(100, { message: 'Mức cọc tối thiểu không được vượt quá 100%' })
  minDepositPercent?: number;
}

