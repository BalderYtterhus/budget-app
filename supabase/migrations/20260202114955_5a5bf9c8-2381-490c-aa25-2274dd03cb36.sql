-- Add needs_review flag to receipt_items for uncertain categorizations
ALTER TABLE public.receipt_items ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;

-- Create unique constraint for item_category_mappings to enable proper upsert
-- First check if the constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'item_category_mappings_pattern_household_unique'
  ) THEN
    ALTER TABLE public.item_category_mappings 
    ADD CONSTRAINT item_category_mappings_pattern_household_unique 
    UNIQUE (item_pattern, household_id);
  END IF;
END $$;