-- Equipment Rentals table
CREATE TABLE public.equipment_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  daily_rate NUMERIC NOT NULL DEFAULT 0,
  images JSONB DEFAULT '[]'::jsonb,
  location_address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available equipment" ON public.equipment_rentals
  FOR SELECT USING (is_available = true);

CREATE POLICY "Owners can manage their equipment" ON public.equipment_rentals
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_equipment_rentals_updated_at
  BEFORE UPDATE ON public.equipment_rentals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Equipment Bookings table
CREATE TABLE public.equipment_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rental_id UUID NOT NULL REFERENCES public.equipment_rentals(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.equipment_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Renters can create bookings" ON public.equipment_bookings
  FOR INSERT WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Renters can view their bookings" ON public.equipment_bookings
  FOR SELECT USING (auth.uid() = renter_id);

CREATE POLICY "Equipment owners can view bookings" ON public.equipment_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.equipment_rentals
      WHERE id = equipment_bookings.rental_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Equipment owners can update booking status" ON public.equipment_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.equipment_rentals
      WHERE id = equipment_bookings.rental_id AND owner_id = auth.uid()
    )
  );

CREATE TRIGGER update_equipment_bookings_updated_at
  BEFORE UPDATE ON public.equipment_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Farmer Trades table
CREATE TABLE public.farmer_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  buyer_id UUID,
  product_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Vegetables',
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  price_per_unit NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.farmer_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open trades" ON public.farmer_trades
  FOR SELECT USING (status = 'open');

CREATE POLICY "Sellers can manage their trades" ON public.farmer_trades
  FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Buyers can view their trades" ON public.farmer_trades
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Authenticated farmers can accept trades" ON public.farmer_trades
  FOR UPDATE USING (status = 'open' AND has_role(auth.uid(), 'farmer'))
  WITH CHECK (buyer_id = auth.uid());

CREATE TRIGGER update_farmer_trades_updated_at
  BEFORE UPDATE ON public.farmer_trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for trades
ALTER PUBLICATION supabase_realtime ADD TABLE public.farmer_trades;