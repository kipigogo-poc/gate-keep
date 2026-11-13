import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface BentoCardProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly className?: string;
}

export function BentoCard({ title, children, className }: BentoCardProps) {
  return (
    <article className={cn('rounded-3xl border border-border-subtle bg-surface p-6', className)}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
    </article>
  );
}
