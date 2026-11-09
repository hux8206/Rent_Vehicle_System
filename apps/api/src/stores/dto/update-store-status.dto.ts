import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt } from 'class-validator';

export class UpdateStoreStatusDto {
  @ApiProperty({
    description: 'Trạng thái chi nhánh: 1=ACTIVE (Hoạt động), 3=PAUSED (Tạm ngưng), 4=MAINTENANCE (Sửa chữa)',
    enum: [1, 3, 4],
    example: 1,
  })
  @IsInt()
  @IsIn([1, 3, 4], {
    message: 'Trạng thái không hợp lệ. Chỉ có thể chọn: 1 (Đang hoạt động), 3 (Tạm ngừng hoạt động), hoặc 4 (Đang sửa chữa)',
  })
  status: number;
}

