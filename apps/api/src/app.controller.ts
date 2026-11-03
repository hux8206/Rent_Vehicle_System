import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth() {
    return this.appService.getHealthStatus();
  }

  @Get()
  getRoot() {
    return {
      name: 'Vehicle Rental System API',
      version: '1.0.0',
      description: 'Multi-vendor Vehicle Rental Platform REST API',
      endpoints: {
        health: '/health',
      },
    };
  }
}

