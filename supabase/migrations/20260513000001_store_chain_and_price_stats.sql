-- 1. Add store_chain to receipts
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS store_chain TEXT;

-- 2. SQL normalization helper (mirrors edge function logic, used for backfill)
CREATE OR REPLACE FUNCTION normalize_item_name(raw text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(raw),
          '^\d+\s*[x×]\s*', ''         -- strip leading quantity prefix "2x "
        ),
        '\d+([.,]\d+)?\s*(g|kg|ml|l|cl|dl|pk|stk|liter)\s*', '', 'gi'  -- strip weights/measures
      ),
      '\s+', ' ', 'g'                   -- collapse whitespace
    )
  );
$$;

-- 3. Backfill normalized_name on existing rows
UPDATE receipt_items
SET normalized_name = normalize_item_name(raw_text)
WHERE normalized_name IS NULL
  AND raw_text IS NOT NULL
  AND raw_text != '';

-- 4. Server-side price aggregation view
--    Aggregates median unit price per household × store_chain × normalized_name.
--    security_invoker ensures the caller's RLS policies apply on the base tables.
CREATE OR REPLACE VIEW item_price_stats WITH (security_invoker = on) AS
SELECT
  household_id,
  store_chain,
  normalized_name,
  percentile_cont(0.5) WITHIN GROUP (
    ORDER BY unit_price_effective
  )                     AS median_unit_price,
  count(*)              AS sample_count,
  max(receipt_date)     AS last_seen
FROM (
  SELECT
    r.household_id,
    COALESCE(r.store_chain, lower(split_part(trim(r.store_name), ' ', 1))) AS store_chain,
    ri.normalized_name,
    COALESCE(ri.unit_price, ri.price / NULLIF(ri.quantity::numeric, 0))    AS unit_price_effective,
    r.receipt_date
  FROM receipts r
  JOIN receipt_items ri ON ri.receipt_id = r.id
  WHERE ri.normalized_name IS NOT NULL
    AND ri.normalized_name <> ''
    AND ri.included_in_totals IS NOT FALSE
    AND ri.price > 0
) base
GROUP BY household_id, store_chain, normalized_name;
