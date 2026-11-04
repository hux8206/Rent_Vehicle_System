import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterPartnerDto {
  @ApiProperty({ example: 'partner@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Tran Thi B' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: '0907654321' })
  @IsString()
  @IsNotEmpty()
  phone: string;
}


