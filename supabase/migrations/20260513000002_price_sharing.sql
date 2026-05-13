-- 1. Consent flag on profiles (null = not yet answered)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS price_sharing_enabled BOOLEAN DEFAULT NULL;

-- 2. Anonymous public price table
--    No user_id, no household_id — only price facts.
--    Designed for time-series analysis: one row per line item per receipt.
CREATE TABLE IF NOT EXISTS public_price_data (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Store
  store_chain       TEXT        NOT NULL,           -- e.g. "rema 1000"

  -- Product (self-describing — no foreign keys, IDs are household-scoped)
  normalized_name   TEXT        NOT NULL,           -- e.g. "helmelk"
  category_name     TEXT,                           -- e.g. "Meieri"

  -- Price facts
  price             NUMERIC(10,2) NOT NULL,         -- line total
  unit_price        NUMERIC(10,2),                  -- price per single unit
  quantity          INTEGER     NOT NULL DEFAULT 1,

  -- Time dimension — critical for inflation analysis
  receipt_date      DATE        NOT NULL,
  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Data quality
  confidence        NUMERIC(3,2),                   -- AI certainty 0.0–1.0
  country_code      TEXT        NOT NULL DEFAULT 'NO'
);

-- Indexes for common analytical query patterns
CREATE INDEX IF NOT EXISTS idx_ppd_chain_name_date
  ON public_price_data (store_chain, normalized_name, receipt_date);

CREATE INDEX IF NOT EXISTS idx_ppd_name_date
  ON public_price_data (normalized_name, receipt_date);

CREATE INDEX IF NOT EXISTS idx_ppd_date
  ON public_price_data (receipt_date);

CREATE INDEX IF NOT EXISTS idx_ppd_submitted
  ON public_price_data (submitted_at);

-- RLS
ALTER TABLE public_price_data ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can insert (app logic checks consent before calling)
CREATE POLICY "Authenticated users can submit price data"
  ON public_price_data FOR INSERT TO authenticated WITH CHECK (true);

-- Anyone authenticated can read (data is anonymous — no PII)
CREATE POLICY "Authenticated users can read price data"
  ON public_price_data FOR SELECT TO authenticated USING (true);
