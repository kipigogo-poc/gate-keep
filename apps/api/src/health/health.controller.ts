import { Controller, Get } from '@nestjs/common';

export interface HealthDto {
  readonly status: 'ok';
  readonly serverTime: string;
}

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthDto {
    return { status: 'ok', serverTime: new Date().toISOString() };
  }
}
