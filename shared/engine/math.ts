/**
 * Internal numeric helpers for the deterministic engine.
 *
 * The engine never rounds: presentation rounding is the UI's responsibility.
 * These helpers only defend the math against non-finite input and zero
 * denominators, both of which must never produce a misleading finite number.
 */

/** Coerces non-finite, zero, and negative values to 0. */
export function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Division that returns `fallback` instead of Infinity/NaN. */
export function safeDivide(
  numerator: number,
  denominator: number,
  fallback = 0,
): number {
  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return fallback;
  }
  return numerator / denominator;
}

/** Rounds half away from zero at the requested number of decimals. */
export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor + Number.EPSILON) / factor;
}

/** Floating-point comparison used by mix-ratio and schedule assertions. */
export function nearlyEqual(a: number, b: number, epsilon = 1e-9): boolean {
  return Math.abs(a - b) <= epsilon;
}
