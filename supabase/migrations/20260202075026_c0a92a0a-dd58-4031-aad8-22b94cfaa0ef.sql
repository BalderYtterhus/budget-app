-- Add unique constraint on budgets for upsert with household_id
ALTER TABLE public.budgets 
ADD CONSTRAINT budgets_month_year_household_unique UNIQUE (month, year, household_id);

-- Add unique constraint on item_category_mappings for household-specific patterns
ALTER TABLE public.item_category_mappings
DROP CONSTRAINT IF EXISTS item_category_mappings_item_pattern_category_id_key;

ALTER TABLE public.item_category_mappings
ADD CONSTRAINT item_category_mappings_pattern_category_household_unique 
UNIQUE (item_pattern, category_id, household_id);