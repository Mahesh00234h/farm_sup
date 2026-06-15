
-- Create retailer_inventory table
CREATE TABLE public.retailer_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retailer_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Vegetables',
  current_stock NUMERIC NOT NULL DEFAULT 0,
  min_stock NUMERIC NOT NULL DEFAULT 0,
  max_stock NUMERIC NOT NULL DEFAULT 100,
  unit TEXT NOT NULL DEFAULT 'kg',
  cost_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable',
  last_restocked TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create partnerships table
CREATE TABLE public.partnerships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  retailer_id UUID NOT NULL,
  farmer_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(retailer_id, farmer_id)
);

-- Enable RLS
ALTER TABLE public.retailer_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnerships ENABLE ROW LEVEL SECURITY;

-- RLS policies for retailer_inventory
CREATE POLICY "Retailers can manage their own inventory"
  ON public.retailer_inventory FOR ALL
  USING (auth.uid() = retailer_id)
  WITH CHECK (auth.uid() = retailer_id);

-- RLS policies for partnerships
CREATE POLICY "Retailers can manage their partnerships"
  ON public.partnerships FOR ALL
  USING (auth.uid() = retailer_id)
  WITH CHECK (auth.uid() = retailer_id);

CREATE POLICY "Farmers can view their partnerships"
  ON public.partnerships FOR SELECT
  USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can update partnership status"
  ON public.partnerships FOR UPDATE
  USING (auth.uid() = farmer_id);
