import { BadRequestException, Controller, Delete, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import type { SeatLockResponseDto } from '@gatekeep/shared';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard.js';
import type { AuthenticatedUser } from '../auth/auth.types.js';
import { ID_PATTERN } from './lock-keys.js';
import { SeatLocksService } from './seat-locks.service.js';

function assertId(name: string, value: string): void {
  if (!ID_PATTERN.test(value)) throw new BadRequestException(`Invalid ${name}`);
}

@Controller('events/:eventId/seats/:seatId/lock')
@UseGuards(FirebaseAuthGuard)
export class SeatLocksController {
  constructor(private readonly locks: SeatLocksService) {}

  @Post()
  @HttpCode(200)
  acquire(
    @Param('eventId') eventId: string,
    @Param('seatId') seatId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<SeatLockResponseDto> {
    assertId('eventId', eventId);
    assertId('seatId', seatId);
    return this.locks.acquire(eventId, seatId, user.uid);
  }

  @Delete()
  @HttpCode(204)
  async release(
    @Param('eventId') eventId: string,
    @Param('seatId') seatId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    assertId('eventId', eventId);
    assertId('seatId', seatId);
    await this.locks.release(eventId, seatId, user.uid);
  }
}
