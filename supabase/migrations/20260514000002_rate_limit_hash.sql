-- Add a non-identifying hash for per-user rate limiting in submit-price-data
-- This is a short truncated SHA-256 of (user_id + SUPABASE_URL), not reversible to user identity
ALTER TABLE public.public_price_data
  ADD COLUMN IF NOT EXISTS submitted_by_user_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_public_price_data_rate_limit
  ON public.public_price_data (submitted_by_user_hash, submitted_at)
  WHERE submitted_by_user_hash IS NOT NULL;
