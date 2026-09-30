export const periods = ["day", "week", "month", "year"] as const;
export type Period = (typeof periods)[number];
export type Prices = Record<Period, string>;
export const termDays: Record<Period, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};
const perYear: Record<Period, bigint> = {
  day: 365n,
  week: 52n,
  month: 12n,
  year: 1n,
};
export function toAtomic(value: string, decimals: number): string {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18)
    throw new Error("Token decimals must be between 0 and 18.");
  if (!/^\d+(\.\d+)?$/.test(value.trim()))
    throw new Error("Enter a positive price without a currency symbol.");
  const [whole, fraction = ""] = value.trim().split(".");
  if (fraction.length > decimals)
    throw new Error(`This token supports ${decimals} decimal places.`);
  return (
    BigInt(whole) * 10n ** BigInt(decimals) +
    BigInt(fraction.padEnd(decimals, "0") || "0")
  ).toString();
}
export function fromAtomic(amount: string, decimals: number): string {
  const digits = BigInt(amount)
    .toString()
    .padStart(decimals + 1, "0");
  if (!decimals) return digits;
  const fraction = digits.slice(-decimals).replace(/0+$/, "");
  return digits.slice(0, -decimals) + (fraction ? "." + fraction : "");
}
/** Annual equivalents use 365 days, 52 weeks, or 12 months; round to cents. */
export function automaticPrices(value: string, basis: Period): Prices {
  const cents = BigInt(toAtomic(value, 2));
  return Object.fromEntries(
    periods.map((period) => {
      const divisor = perYear[period];
      const price = (cents * perYear[basis] + divisor / 2n) / divisor;
      return [period, fromAtomic((price > 0n ? price : 1n).toString(), 2)];
    }),
  ) as Prices;
}
export const defaultPrices = automaticPrices("5", "month");
