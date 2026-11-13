import type { ScanRequestDto, ScanResponseDto } from '@gatekeep/shared';
import { postJson } from './apiClient';

export function submitScan(payload: string, signal?: AbortSignal): Promise<ScanResponseDto> {
  return postJson<ScanRequestDto, ScanResponseDto>('/scan', { payload }, signal);
}
