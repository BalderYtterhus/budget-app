-- Record the AI's own category prediction separately from the working category.
--
-- category_id is mutable: the client's mapping fallback may fill it in when the
-- AI abstained, and a user correction overwrites it. That made the original
-- prediction unrecoverable, so there was no way to measure OCR accuracy.
--
-- ai_predicted_category_id is written once at save time and never updated.
-- Comparing it against the final category_id (for items a human has reviewed)
-- gives per-category accuracy and confidence calibration.
--
-- NULL here while category_id is set means the AI abstained and the client-side
-- mapping fallback supplied the category — a distinct case worth measuring.
ALTER TABLE public.receipt_items
  ADD COLUMN IF NOT EXISTS ai_predicted_category_id UUID
    REFERENCES public.categories(id) ON DELETE SET NULL;

-- Marks that a human actually looked at this item's category.
--
-- needs_review = false is not the same thing: it is false both when a person
-- confirmed the category and when the AI was simply confident and nobody
-- checked. Without separating those, accuracy can only be measured as an
-- observed correction rate (a lower bound on error), because agreement is
-- indistinguishable from "unreviewed". reviewed_at gives a real denominator.
ALTER TABLE public.receipt_items
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- Supports the eval query: reviewed items where prediction and final disagree.
CREATE INDEX IF NOT EXISTS idx_receipt_items_ai_prediction
  ON public.receipt_items (ai_predicted_category_id, category_id)
  WHERE ai_predicted_category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receipt_items_reviewed
  ON public.receipt_items (reviewed_at)
  WHERE reviewed_at IS NOT NULL;
