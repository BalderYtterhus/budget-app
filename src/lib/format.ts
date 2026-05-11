/**
 * Format a number as Norwegian Krone (NOK)
 * Uses Norwegian locale for formatting (e.g., 1 234,50 kr)
 */
export function formatNOK(amount: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with Norwegian number formatting (spaces as thousands separator, comma as decimal)
 */
export function formatNumber(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("nb-NO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Parse a Norwegian-formatted number string back to a number
 */
export function parseNorwegianNumber(value: string): number {
  // Replace spaces and convert comma to period for parsing
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}
