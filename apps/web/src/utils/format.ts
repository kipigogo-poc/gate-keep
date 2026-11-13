const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });

/** Prices travel as integer centavos to avoid float drift. */
export function formatPeso(centavos: number): string {
  if (!Number.isInteger(centavos)) throw new RangeError('centavos must be an integer');
  return peso.format(centavos / 100);
}
