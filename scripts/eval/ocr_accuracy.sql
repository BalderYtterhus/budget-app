-- OCR / categorization accuracy metrics.
--
-- Run these in the Supabase SQL editor. They read only your own household's
-- data via normal RLS, so no service-role key is needed.
--
-- The denominator everywhere is `reviewed_at IS NOT NULL` — items a human
-- actually looked at. Items nobody reviewed are excluded, because for those
-- "prediction == final" only means nobody corrected it, not that it was right.
--
-- All of these return no rows until you have saved receipts with the
-- prediction-log columns in place. Give it a few shopping trips.


-- ============================================================
-- 1. Headline category accuracy
-- ============================================================
-- Of the items a human reviewed where the AI committed to a category,
-- how often did the AI agree with the human's final answer?
SELECT
  COUNT(*)                                                          AS reviewed_with_prediction,
  COUNT(*) FILTER (WHERE ai_predicted_category_id = category_id)     AS correct,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ai_predicted_category_id = category_id)
    / NULLIF(COUNT(*), 0)
  , 1)                                                              AS accuracy_pct
FROM receipt_items
WHERE reviewed_at IS NOT NULL
  AND ai_predicted_category_id IS NOT NULL;


-- ============================================================
-- 2. Confidence calibration
-- ============================================================
-- Does the model's self-reported confidence actually predict correctness?
-- If accuracy doesn't climb across these buckets, the confidence score is
-- noise and the 0.7 needs_review threshold in parse-receipt is arbitrary.
SELECT
  CASE
    WHEN confidence IS NULL  THEN 'none'
    WHEN confidence < 0.6    THEN '1. <0.60'
    WHEN confidence < 0.7    THEN '2. 0.60-0.69'
    WHEN confidence < 0.85   THEN '3. 0.70-0.84'
    ELSE                          '4. >=0.85'
  END                                                               AS confidence_bucket,
  COUNT(*)                                                          AS n,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ai_predicted_category_id = category_id)
    / NULLIF(COUNT(*), 0)
  , 1)                                                              AS accuracy_pct
FROM receipt_items
WHERE reviewed_at IS NOT NULL
  AND ai_predicted_category_id IS NOT NULL
GROUP BY 1
ORDER BY 1;


-- ============================================================
-- 3. Abstention and fallback quality
-- ============================================================
-- How often does the AI decline to categorize, and when the client-side
-- fuzzy mapping fallback steps in, does it get it right?
SELECT
  CASE
    WHEN ai_predicted_category_id IS NOT NULL THEN 'ai_predicted'
    WHEN category_id IS NOT NULL              THEN 'fallback_supplied'
    ELSE                                           'uncategorized'
  END                                                               AS source,
  COUNT(*)                                                          AS n,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)                AS pct_of_reviewed
FROM receipt_items
WHERE reviewed_at IS NOT NULL
GROUP BY 1
ORDER BY n DESC;


-- ============================================================
-- 4. Where it goes wrong — confusion pairs
-- ============================================================
-- The specific mistakes, most frequent first. This is what to feed back into
-- the prompt's category descriptions or the learned-mapping seed data.
SELECT
  predicted.name                                                    AS ai_said,
  final.name                                                        AS human_said,
  COUNT(*)                                                          AS times,
  ROUND(AVG(ri.confidence)::numeric, 2)                             AS avg_confidence
FROM receipt_items ri
JOIN categories predicted ON predicted.id = ri.ai_predicted_category_id
JOIN categories final     ON final.id     = ri.category_id
WHERE ri.reviewed_at IS NOT NULL
  AND ri.ai_predicted_category_id <> ri.category_id
GROUP BY 1, 2
ORDER BY times DESC, avg_confidence DESC
LIMIT 25;


-- ============================================================
-- 5. Worst offenders by item text
-- ============================================================
-- Individual products the model keeps getting wrong. Good candidates for
-- seeding item_category_mappings directly.
SELECT
  ri.normalized_name,
  COUNT(*)                                                          AS corrections,
  MAX(final.name)                                                   AS usually_corrected_to
FROM receipt_items ri
JOIN categories final ON final.id = ri.category_id
WHERE ri.reviewed_at IS NOT NULL
  AND ri.ai_predicted_category_id IS DISTINCT FROM ri.category_id
  AND ri.normalized_name IS NOT NULL
GROUP BY ri.normalized_name
HAVING COUNT(*) > 1
ORDER BY corrections DESC
LIMIT 25;


-- ============================================================
-- 6. Review coverage (sanity check)
-- ============================================================
-- How much of your data is actually usable as eval signal. If reviewed_pct is
-- very low, the metrics above are computed on a small, self-selected sample
-- (people review what looks wrong), so treat accuracy as a lower bound.
SELECT
  COUNT(*)                                                          AS total_items,
  COUNT(*) FILTER (WHERE reviewed_at IS NOT NULL)                   AS reviewed,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE reviewed_at IS NOT NULL)
    / NULLIF(COUNT(*), 0)
  , 1)                                                              AS reviewed_pct
FROM receipt_items;


-- ============================================================
-- 7. Does system confidence beat the model's own? (Phase 2)
-- ============================================================
-- The question this whole signal exists to answer. Compares how well each
-- score separates correct from incorrect assignments on reviewed items.
--
-- Read it as: within each band, what fraction were actually right? A useful
-- signal shows accuracy climbing steeply across its own bands. If
-- system_confidence separates more sharply than confidence does, it is the
-- better gate; if it doesn't, this signal isn't earning its complexity.
WITH reviewed AS (
  SELECT
    (ai_predicted_category_id = category_id)                        AS was_correct,
    confidence,
    system_confidence
  FROM receipt_items
  WHERE reviewed_at IS NOT NULL
    AND ai_predicted_category_id IS NOT NULL
)
SELECT
  'ai_confidence'                                                   AS signal,
  CASE WHEN confidence >= 0.7 THEN 'high' ELSE 'low' END            AS band,
  COUNT(*)                                                          AS n,
  ROUND(100.0 * COUNT(*) FILTER (WHERE was_correct) / NULLIF(COUNT(*), 0), 1) AS accuracy_pct
FROM reviewed
WHERE confidence IS NOT NULL
GROUP BY 2

UNION ALL

SELECT
  'system_confidence',
  CASE
    WHEN system_confidence > 0.65 THEN 'supports'
    WHEN system_confidence < 0.35 THEN 'contradicts'
    ELSE 'no_evidence'
  END,
  COUNT(*),
  ROUND(100.0 * COUNT(*) FILTER (WHERE was_correct) / NULLIF(COUNT(*), 0), 1)
FROM reviewed
WHERE system_confidence IS NOT NULL
GROUP BY 2
ORDER BY signal, band;


-- ============================================================
-- 8. The confidently-wrong case (Phase 2's whole point)
-- ============================================================
-- Items the model was sure about but correction history contradicted. A
-- confidence threshold alone can never surface these — if this returns rows
-- that were in fact wrong, the cross-check is earning its keep.
SELECT
  ri.normalized_name,
  ri.confidence                                                     AS ai_said,
  ri.system_confidence                                              AS history_said,
  predicted.name                                                    AS ai_category,
  final.name                                                        AS final_category,
  (ri.ai_predicted_category_id = ri.category_id)                    AS ai_was_right
FROM receipt_items ri
LEFT JOIN categories predicted ON predicted.id = ri.ai_predicted_category_id
LEFT JOIN categories final     ON final.id     = ri.category_id
WHERE ri.reviewed_at IS NOT NULL
  AND ri.confidence >= 0.7
  AND ri.system_confidence < 0.35
ORDER BY ri.confidence DESC
LIMIT 25;
