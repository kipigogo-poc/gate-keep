import { BRAND } from '@/constants/brand';
import { NAV_LINKS } from '@/constants/navigation';
import { Container } from './Container';

/** No hamburger: links collapse away on mobile; the hero CTA carries the conversion path. */
export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b border-border-subtle/60 bg-canvas/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <a href="/" className="text-lg font-bold tracking-tight">
          {BRAND.name}
        </a>
        <ul className="hidden gap-8 text-sm font-medium text-muted sm:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="hover:text-ink">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </nav>
  );
}
