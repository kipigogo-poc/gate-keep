import { BRAND } from '@/constants/brand';
import { Container } from './Container';

export function Footer() {
  return (
    <footer className="border-t border-border-subtle py-10 pb-28 text-sm text-muted sm:pb-10">
      <Container className="flex flex-col justify-between gap-2 sm:flex-row">
        <span>
          {BRAND.name} by {BRAND.owner}
        </span>
        <span className="tabular">© {new Date().getFullYear()}</span>
      </Container>
    </footer>
  );
}
