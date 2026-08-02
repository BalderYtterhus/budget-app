// An independent confidence signal for a category assignment, computed from
// the household's own correction history rather than from the model.
//
// The model self-reports a `confidence` per item, but a self-reported score
// can't catch the case that matters most: being confidently wrong. This scores
// the same assignment from evidence the model largely doesn't have — the
// frequency counts behind item_category_mappings, which record how many times
// a human has actually confirmed a given item belongs in a given category.
//
// Comparing the two is the point. Agreement is reassuring; disagreement is a
// review signal that the `confidence < 0.7` threshold alone cannot produce.

import { ItemCategoryMapping } from "@/types/budget";
import { normalizeForMatch, calculateSimilarity } from "@/lib/textMatch";

// Below this, a mapping isn't considered to describe the same product.
// Matches the categorization fallback threshold in ReceiptUpload.
const MATCH_THRESHOLD = 0.6;

// Confirmations needed before mapping evidence counts as fully established.
// Chosen so a single stray confirmation can't outweigh the model, while a
// genuinely habitual purchase reaches full strength within a few shops.
const FREQUENCY_SATURATION = 5;

export type ConfidenceVerdict =
  /** Model and history agree, both strong. Safe to accept. */
  | "agree"
  /** Model is confident but contradicts established history. Highest-value review case. */
  | "ai_overconfident"
  /** Model is unsure but history is clear. Safe to accept despite low AI confidence. */
  | "history_rescues"
  /** Neither signal is strong. Needs a human. */
  | "both_uncertain"
  /** No mapping evidence for this item — nothing to cross-check against. */
  | "no_signal";

export interface SystemConfidence {
  /**
   * 0–1, centred on 0.5. Above 0.5 means the household's history supports the
   * assignment; below means it contradicts it. Exactly 0.5 means no evidence —
   * deliberately neutral rather than low, since "unknown" is not "wrong".
   */
  score: number;
  verdict: ConfidenceVerdict;
  /** The learned pattern that drove the score, for explaining the flag to the user. */
  matchedPattern: string | null;
  /** How many times that pattern has been confirmed. */
  matchedFrequency: number;
  /** Category the history points to, which may differ from the assigned one. */
  historyCategoryId: string | null;
}

const NO_EVIDENCE: SystemConfidence = {
  score: 0.5,
  verdict: "no_signal",
  matchedPattern: null,
  matchedFrequency: 0,
  historyCategoryId: null,
};

/** Best fuzzy match for `itemText` among learned mappings, or null. */
function bestMapping(
  itemText: string,
  mappings: ItemCategoryMapping[],
): { mapping: ItemCategoryMapping; similarity: number } | null {
  const normText = normalizeForMatch(itemText);
  if (!normText) return null;

  let best: { mapping: ItemCategoryMapping; similarity: number } | null = null;
  for (const m of mappings) {
    const normPattern = normalizeForMatch(m.item_pattern);
    if (!normPattern) continue;

    let similarity: number;
    if (normText === normPattern) similarity = 1;
    else if (normText.includes(normPattern) || normPattern.includes(normText)) similarity = 0.9;
    else similarity = calculateSimilarity(normText, normPattern);

    if (similarity < MATCH_THRESHOLD) continue;

    // Ties break toward the more frequently confirmed mapping.
    if (
      !best ||
      similarity > best.similarity ||
      (similarity === best.similarity && m.frequency > best.mapping.frequency)
    ) {
      best = { mapping: m, similarity };
    }
  }
  return best;
}

export function computeSystemConfidence(
  itemText: string,
  assignedCategoryId: string | null,
  mappings: ItemCategoryMapping[] | undefined,
): SystemConfidence {
  if (!mappings || mappings.length === 0 || !itemText.trim()) return NO_EVIDENCE;

  const best = bestMapping(itemText, mappings);
  if (!best) return NO_EVIDENCE;

  const { mapping, similarity } = best;

  // How much this evidence is worth: a weak textual match or a barely-confirmed
  // mapping should move the score less than a strong, repeatedly-confirmed one.
  const strength = similarity * Math.min(1, mapping.frequency / FREQUENCY_SATURATION);

  const agrees = assignedCategoryId !== null && mapping.category_id === assignedCategoryId;
  const score = agrees ? 0.5 + 0.5 * strength : 0.5 - 0.5 * strength;

  return {
    score: Math.round(score * 100) / 100,
    // Verdict needs the AI's own confidence, so it's resolved separately.
    verdict: "no_signal",
    matchedPattern: mapping.item_pattern,
    matchedFrequency: mapping.frequency,
    historyCategoryId: mapping.category_id,
  };
}

// Thresholds for reading each signal as "confident". The AI side matches the
// existing needs_review cutoff in parse-receipt so the two stay consistent.
const AI_CONFIDENT = 0.7;
const SYSTEM_SUPPORTS = 0.65;
const SYSTEM_CONTRADICTS = 0.35;

/**
 * Cross-reference the model's self-reported confidence against the independent
 * score. Returns the verdict plus whether a human should look at this item.
 */
export function reconcileConfidence(
  aiConfidence: number,
  system: SystemConfidence,
): { verdict: ConfidenceVerdict; needsReview: boolean } {
  const aiSure = aiConfidence >= AI_CONFIDENT;

  // No history for this item — fall back to trusting the model alone.
  if (system.verdict === "no_signal" && system.score === 0.5) {
    return { verdict: "no_signal", needsReview: !aiSure };
  }

  if (system.score <= SYSTEM_CONTRADICTS) {
    // History disagrees. When the model is also confident, this is precisely
    // the failure the confidence threshold alone cannot catch — always review.
    return {
      verdict: aiSure ? "ai_overconfident" : "both_uncertain",
      needsReview: true,
    };
  }

  if (system.score >= SYSTEM_SUPPORTS) {
    // History backs the assignment. If the model was unsure, that corroboration
    // is enough to spare the user a review.
    return {
      verdict: aiSure ? "agree" : "history_rescues",
      needsReview: false,
    };
  }

  // Evidence exists but is too weak to settle it either way.
  return {
    verdict: aiSure ? "no_signal" : "both_uncertain",
    needsReview: !aiSure,
  };
}
