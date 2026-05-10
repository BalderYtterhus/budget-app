-- Categories table with default categories
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'other',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default categories
INSERT INTO public.categories (name, color, is_default) VALUES
  ('Milk & Dairy', 'dairy', true),
  ('Vegetables & Fruit', 'produce', true),
  ('Meat & Fish', 'meat', true),
  ('Dry Goods', 'dry', true),
  ('Snacks & Sweets', 'snacks', true),
  ('Other', 'other', true);

-- Enable RLS on categories (public read, no write for now - system managed)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

-- Budgets table for monthly budgets
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  total_budget DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(month, year)
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Budgets are viewable by everyone" 
ON public.budgets 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert budgets" 
ON public.budgets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update budgets" 
ON public.budgets 
FOR UPDATE 
USING (true);

-- Category budgets for per-category limits
CREATE TABLE public.category_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  UNIQUE(budget_id, category_id)
);

ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Category budgets are viewable by everyone" 
ON public.category_budgets 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert category budgets" 
ON public.category_budgets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update category budgets" 
ON public.category_budgets 
FOR UPDATE 
USING (true);

-- Receipts table
CREATE TABLE public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT,
  total_amount DECIMAL(10, 2) NOT NULL,
  receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
  image_url TEXT,
  raw_ocr_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Receipts are viewable by everyone" 
ON public.receipts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert receipts" 
ON public.receipts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update receipts" 
ON public.receipts 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete receipts" 
ON public.receipts 
FOR DELETE 
USING (true);

-- Receipt items table
CREATE TABLE public.receipt_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  receipt_id UUID NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Receipt items are viewable by everyone" 
ON public.receipt_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert receipt items" 
ON public.receipt_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update receipt items" 
ON public.receipt_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete receipt items" 
ON public.receipt_items 
FOR DELETE 
USING (true);

-- Item category mappings for learning user preferences
CREATE TABLE public.item_category_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_pattern TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  frequency INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_pattern, category_id)
);

ALTER TABLE public.item_category_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Item mappings are viewable by everyone" 
ON public.item_category_mappings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert item mappings" 
ON public.item_category_mappings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update item mappings" 
ON public.item_category_mappings 
FOR UPDATE 
USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_item_mappings_updated_at
BEFORE UPDATE ON public.item_category_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for receipt images
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

-- Storage policies for receipt images
CREATE POLICY "Receipt images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'receipts');

CREATE POLICY "Anyone can upload receipt images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'receipts');

CREATE POLICY "Anyone can delete receipt images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'receipts');