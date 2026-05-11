-- Settlements table
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('household', 'custom')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settlements are viewable by everyone"
ON public.settlements FOR SELECT USING (true);

CREATE POLICY "Anyone can insert settlements"
ON public.settlements FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update settlements"
ON public.settlements FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete settlements"
ON public.settlements FOR DELETE USING (true);

-- Settlement members table
CREATE TABLE public.settlement_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratio DECIMAL(5, 2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(settlement_id, user_id)
);

ALTER TABLE public.settlement_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settlement members are viewable by everyone"
ON public.settlement_members FOR SELECT USING (true);

CREATE POLICY "Anyone can insert settlement members"
ON public.settlement_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update settlement members"
ON public.settlement_members FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete settlement members"
ON public.settlement_members FOR DELETE USING (true);

-- Add settlement_id and label to receipts
ALTER TABLE public.receipts
  ADD COLUMN settlement_id UUID REFERENCES public.settlements(id) ON DELETE SET NULL,
  ADD COLUMN label TEXT;

-- Trigger for updated_at on settlements
CREATE TRIGGER update_settlements_updated_at
BEFORE UPDATE ON public.settlements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
