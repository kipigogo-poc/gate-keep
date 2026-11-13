import type { ReactNode } from 'react';
import type { BadgeTone } from '@/types';
import { cn } from '@/utils/cn';

export interface BadgeProps {
  readonly tone?: BadgeTone;
  readonly children: ReactNode;
}

const TONES: Record<BadgeTone, string> = {
  live: 'bg-status-live/15 text-status-live',
  neutral: 'bg-surface text-muted border border-border-subtle',
  accent: 'bg-accent-primary/15 text-accent-primary',
};

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', TONES[tone])}>
      {tone === 'live' && <span aria-hidden className="size-1.5 rounded-full bg-status-live" />}
      {children}
    </span>
  );
}
