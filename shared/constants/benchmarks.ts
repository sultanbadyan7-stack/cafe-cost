/**
 * Simple commercial benchmark bands.
 *
 * Bands are advisory only. They never override the deterministic engine; the
 * validation layer reads them to colour-code results.
 */
export const BENCHMARKS = {
  materialsAndLabor: {
    safeMaxPercent: 60.0,
    warningMaxPercent: 65.0,
  },
  rentToRevenue: {
    safeMinPercent: 8.0,
    safeMaxPercent: 12.0,
    warningMaxPercent: 15.0,
  },
  menuMargin: {
    /** Green above this contribution-margin percentage. */
    safeMinPercent: 65.0,
    /** Yellow at or above this percentage; red below it. */
    warningMinPercent: 50.0,
  },
  retailBeanMargin: {
    /** Retail resale carries packaging and a lower typical gross margin. */
    safeMinPercent: 45.0,
    warningMinPercent: 30.0,
  },
} as const;
