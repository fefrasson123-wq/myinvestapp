import type { InvestmentCategory } from "@/types/investment";

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeTicker(ticker?: string | null): string | null {
  if (!ticker) return null;
  const t = normalizeText(ticker);
  return t.length ? t : null;
}

/**
 * Key used to identify the “same asset”.
 * - If ticker exists: category + ticker
 * - Else: category + name
 */
export function investmentIdentityKey(input: {
  category: InvestmentCategory;
  name: string;
  ticker?: string | null;
}): string {
  const t = normalizeTicker(input.ticker);
  if (t) return `${input.category}:t:${t}`;
  return `${input.category}:n:${normalizeText(input.name)}`;
}
