/** Display-only preview. Mirrors the server formula; the server's numbers are what the loan stores. */
export const RATE_BPS = 1200;

export const LOAN_LIMITS = {
  minPrincipalRupees: 50_000,
  maxPrincipalRupees: 5_00_000,
  stepRupees: 1_000,
  minTenureDays: 30,
  maxTenureDays: 365,
} as const;

/** SI = P × R × T / (365 × 100), in integer paise, rounded half-up. */
export function simpleInterestPaise(
  principalPaise: number,
  tenureDays: number,
  rateBps = RATE_BPS,
) {
  const numerator = principalPaise * rateBps * tenureDays;
  const denominator = 365 * 10_000;
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}
