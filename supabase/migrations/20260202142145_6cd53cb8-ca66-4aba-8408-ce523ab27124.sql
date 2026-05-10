-- Add new columns to receipt_items for editing and exclusion
ALTER TABLE public.receipt_items
ADD COLUMN quantity integer NOT NULL DEFAULT 1,
ADD COLUMN unit_price numeric NULL,
ADD COLUMN included_in_totals boolean NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.receipt_items.quantity IS 'Quantity of items (default 1)';
COMMENT ON COLUMN public.receipt_items.unit_price IS 'Price per unit, if known';
COMMENT ON COLUMN public.receipt_items.included_in_totals IS 'Whether to include in budget/settlement calculations';