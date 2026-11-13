/** Injected wall clock (unix ms) so time-sensitive rules are testable without sleeping. */
export type Clock = () => number;
export const CLOCK = Symbol('CLOCK');
