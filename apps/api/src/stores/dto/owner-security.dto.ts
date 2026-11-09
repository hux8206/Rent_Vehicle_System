import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class SetOwnerPasswordDto {
  @ApiPropertyOptional({ example: '123456', description: 'Mật khẩu hiện tại (nếu đã từng đặt)' })
  @IsOptional()
  @IsString()
  currentPassword?: string;

  @ApiProperty({ example: '888888', description: 'Mật khẩu mới của chủ cửa hàng (ít nhất 4 ký tự)' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @MinLength(4, { message: 'Mật khẩu phải có ít nhất 4 ký tự' })
  newPassword: string;
}

export class VerifyOwnerPasswordDto {
  @ApiProperty({ example: '888888', description: 'Mật khẩu chủ cửa hàng cần xác thực' })
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu chủ cửa hàng' })
  password: string;
}

