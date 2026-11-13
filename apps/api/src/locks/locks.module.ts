import { Module } from '@nestjs/common';
import { SeatLocksController } from './seat-locks.controller.js';
import { SeatLocksService } from './seat-locks.service.js';

@Module({ controllers: [SeatLocksController], providers: [SeatLocksService] })
export class LocksModule {}
