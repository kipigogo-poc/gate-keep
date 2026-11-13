import { describe, expect, it } from 'vitest';
import { formatPeso } from './format';

describe('formatPeso', () => {
  it('formats centavos as PHP', () => {
    expect(formatPeso(150_000)).toBe('₱1,500.00');
  });
  it('rejects fractional centavos', () => {
    expect(() => formatPeso(1.5)).toThrow(RangeError);
  });
});
