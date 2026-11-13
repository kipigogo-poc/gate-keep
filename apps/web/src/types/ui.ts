import type { ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';
export type BadgeTone = 'live' | 'neutral' | 'accent';

export interface NavLink {
  readonly label: string;
  readonly href: string;
}

export interface FeatureItem {
  readonly title: string;
  readonly body: string;
  readonly icon: ReactNode;
}
