import { BRAND } from '@/constants/brand';
import { HERO_COPY } from '@/constants/content';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/layout/Container';

export function Hero() {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Badge tone="live">{HERO_COPY.eyebrow}</Badge>
        <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">{HERO_COPY.heading}</h1>
        <p className="mt-2 font-cursive text-3xl text-accent-primary">{BRAND.callout}</p>
        <p className="mt-6 max-w-xl text-lg text-muted">{HERO_COPY.body}</p>

        <div className="mt-10 hidden gap-3 sm:flex">
          <Button size="lg">{HERO_COPY.primaryCta}</Button>
          <Button size="lg" variant="secondary">
            {HERO_COPY.secondaryCta}
          </Button>
        </div>
      </Container>

      {/* Mobile: sticky, thumb-reach primary action. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-canvas/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
        <Button size="lg" block>
          {HERO_COPY.primaryCta}
        </Button>
      </div>
    </section>
  );
}
