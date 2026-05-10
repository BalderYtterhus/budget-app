-- Update default category names to Norwegian
UPDATE public.categories 
SET name = CASE 
  WHEN name = 'Milk & Dairy' THEN 'Meieri'
  WHEN name = 'Vegetables & Fruit' THEN 'Frukt & Grønt'
  WHEN name = 'Meat & Fish' THEN 'Kjøtt & Fisk'
  WHEN name = 'Dry Goods' THEN 'Tørrvarer'
  WHEN name = 'Snacks & Sweets' THEN 'Snacks & Søtsaker'
  WHEN name = 'Other' THEN 'Annet'
  ELSE name
END
WHERE is_default = true;