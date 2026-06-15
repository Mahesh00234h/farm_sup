-- 1. Delivery partner presence (one row per partner)
CREATE TABLE public.delivery_partner_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL UNIQUE,
  is_online boolean NOT NULL DEFAULT false,
  latitude numeric,
  longitude numeric,
  radius_km integer NOT NULL DEFAULT 7 CHECK (radius_km BETWEEN 1 AND 50),
  vehicle_type text NOT NULL DEFAULT 'bike',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.delivery_partner_presence TO authenticated;
GRANT ALL ON public.delivery_partner_presence TO service_role;

ALTER TABLE public.delivery_partner_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner manages own presence"
ON public.delivery_partner_presence
FOR ALL TO authenticated
USING (auth.uid() = partner_id)
WITH CHECK (auth.uid() = partner_id);

CREATE TRIGGER update_delivery_partner_presence_updated_at
BEFORE UPDATE ON public.delivery_partner_presence
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Delivery offers (one per nearby partner per order)
CREATE TABLE public.delivery_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  partner_id uuid NOT NULL,
  distance_km numeric NOT NULL,
  estimated_earnings numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired','superseded')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id, partner_id)
);

CREATE INDEX idx_delivery_offers_partner_pending
  ON public.delivery_offers(partner_id, status)
  WHERE status = 'pending';
CREATE INDEX idx_delivery_offers_order ON public.delivery_offers(order_id);

GRANT SELECT, UPDATE ON public.delivery_offers TO authenticated;
GRANT ALL ON public.delivery_offers TO service_role;

ALTER TABLE public.delivery_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partner views own offers"
ON public.delivery_offers
FOR SELECT TO authenticated
USING (auth.uid() = partner_id);

CREATE POLICY "Seller views offers for their order"
ON public.delivery_offers
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = delivery_offers.order_id AND o.seller_id = auth.uid()
));

CREATE POLICY "Partner responds to own pending offer"
ON public.delivery_offers
FOR UPDATE TO authenticated
USING (auth.uid() = partner_id AND status = 'pending')
WITH CHECK (auth.uid() = partner_id);

-- 3. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_partner_presence;