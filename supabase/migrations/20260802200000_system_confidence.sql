-- An independent confidence score for the category assignment, computed from
-- the household's own correction history (item_category_mappings frequency)
-- rather than self-reported by the model.
--
-- Stored alongside receipt_items.confidence so the two can be compared: the
-- open question this is meant to answer is whether history-based evidence
-- predicts miscategorization better than the model's own certainty, especially
-- in the confidently-wrong case that a confidence threshold cannot catch.
--
-- 0.5 means "no mapping evidence" — deliberately neutral, not low. Above 0.5
-- the history supports the assignment; below, it contradicts it.
--
-- Only the raw score is stored, not the derived verdict. The verdict depends on
-- thresholds that are still being tuned, and freezing them into the data would
-- prevent re-deriving verdicts at other cutoffs during calibration.
ALTER TABLE public.receipt_items
  ADD COLUMN IF NOT EXISTS system_confidence NUMERIC(3,2)
    CHECK (system_confidence IS NULL OR (system_confidence >= 0 AND system_confidence <= 1));
