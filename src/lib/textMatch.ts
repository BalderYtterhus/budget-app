// Shared fuzzy text matching — used for both receipt-item categorization
// and shopping-list-to-receipt matching.

export function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/\d+([.,]\d+)?\s*(g|kg|ml|l|cl|dl|pk|stk|liter)\s*/gi, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Word-overlap similarity, 0–1.
export function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeForMatch(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalizeForMatch(b).split(" ").filter(Boolean));
  let matches = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) matches++;
  }
  const maxLen = Math.max(wordsA.size, wordsB.size);
  return maxLen > 0 ? matches / maxLen : 0;
}
