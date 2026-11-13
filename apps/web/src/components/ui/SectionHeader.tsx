export interface SectionHeaderProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly callout?: string;
}

export function SectionHeader({ eyebrow, title, callout }: SectionHeaderProps) {
  return (
    <header className="max-w-2xl">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-muted">{eyebrow}</p>}
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {callout && <p className="mt-1 font-cursive text-3xl text-accent-primary">{callout}</p>}
    </header>
  );
}
