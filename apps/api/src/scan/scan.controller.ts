import { BadRequestException, Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { ScanResponseDto } from '@gatekeep/shared';
import { z } from 'zod';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';
import { RequireRole, RolesGuard } from '../auth/roles.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { ScanService } from './scan.service.js';

const scanRequestSchema = z.object({ payload: z.string().min(1).max(200) });

@Controller('scan')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@RequireRole('door_staff')
export class ScanController {
  constructor(private readonly scans: ScanService) {}

  /** Always 200 with a verdict: the gate UI renders it, it is not an API error. */
  @Post()
  @HttpCode(200)
  scan(@Body() body: unknown, @CurrentUser() user: AuthenticatedUser): Promise<ScanResponseDto> {
    const parsed = scanRequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('payload required');
    return this.scans.scan(parsed.data.payload, user.uid);
  }
}
