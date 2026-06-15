-- Create table for live delivery locations
CREATE TABLE public.delivery_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  delivery_partner_id UUID NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  heading NUMERIC,
  speed NUMERIC,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

-- Enable RLS
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

-- Delivery partners can insert/update their own locations
CREATE POLICY "Delivery partners can manage their locations"
ON public.delivery_locations
FOR ALL
USING (auth.uid() = delivery_partner_id)
WITH CHECK (auth.uid() = delivery_partner_id);

-- Buyers can view locations for their orders
CREATE POLICY "Buyers can view delivery locations for their orders"
ON public.delivery_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = delivery_locations.order_id 
    AND orders.buyer_id = auth.uid()
  )
);

-- Sellers can view locations for orders of their products
CREATE POLICY "Sellers can view delivery locations for their orders"
ON public.delivery_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = delivery_locations.order_id 
    AND orders.seller_id = auth.uid()
  )
);

-- Enable realtime for delivery_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_locations;