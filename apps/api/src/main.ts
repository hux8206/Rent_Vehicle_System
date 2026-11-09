import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Vehicle Rental Platform API')
    .setDescription(`
## Hệ thống Nền tảng Cho thuê xe trực tuyến Đa đối tác

### Phân quyền (Role-based Access)
- **Role 0 - Admin:** Toàn quyền quản trị
- **Role 1 - Partner:** Quản lý cửa hàng, dòng xe, biển số của mình
- **Role 2 - Customer:** Tìm kiếm xe, đặt xe, xem đơn của mình

### Hướng dẫn xác thực
1. Đăng ký tài khoản qua \`POST /api/auth/register\`
2. Đăng nhập qua \`POST /api/auth/login\` để nhận **accessToken**
3. Click **Authorize** 🔒 và nhập \`Bearer <accessToken>\`
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Đăng ký, Đăng nhập, Xem profile')
    .addTag('Partner - Stores', 'Partner quản lý cửa hàng và chính sách thuê')
    .addTag('Partner - Vehicles', 'Partner quản lý dòng xe (VehicleModel) và biển số (VehicleItem)')
    .addTag('Public - Vehicles (Customer)', 'API public: tìm kiếm xe + tính số lượng khả dụng')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 API is running on: http://localhost:${port}/api`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
