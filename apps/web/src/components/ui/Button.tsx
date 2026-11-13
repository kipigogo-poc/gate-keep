import type { ButtonHTMLAttributes } from 'react';
import type { ButtonSize, ButtonVariant } from '@/types';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly block?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-contrast text-surface hover:bg-contrast/90',
  secondary: 'bg-surface text-ink border border-border-subtle hover:bg-canvas',
  ghost: 'bg-transparent text-ink hover:bg-surface/60',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'h-11 px-5 text-sm',
  lg: 'h-14 px-7 text-base', // thumb-friendly
};

export function Button({ variant = 'primary', size = 'md', block = false, className, type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    />
  );
}
