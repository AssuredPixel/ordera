import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  health() {
    return { status: 'ok', version: '3.0.0', timestamp: new Date().toISOString() };
  }
}
