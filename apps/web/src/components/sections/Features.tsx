import { FEATURES } from '@/constants/content';
import { BentoCard } from '@/components/ui/BentoCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Container } from '@/components/layout/Container';

export function Features() {
  return (
    <section id="how" className="py-16">
      <Container>
        <SectionHeader eyebrow="How it works" title="Built so the ticket stays with the fan." callout="from tap to gate" />
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <BentoCard key={f.title} title={f.title}>
              {f.body}
            </BentoCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
