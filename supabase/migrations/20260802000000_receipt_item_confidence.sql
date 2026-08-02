-- Persist the AI's per-item confidence score on receipt_items.
-- Previously this only existed transiently in review-step client state and on
-- public_price_data — CategoryReview.tsx was selecting receipt_items.confidence
-- for its bulk review Sheet even though the column never existed, breaking that query.
ALTER TABLE public.receipt_items
  ADD COLUMN IF NOT EXISTS confidence NUMERIC(3,2) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1));
