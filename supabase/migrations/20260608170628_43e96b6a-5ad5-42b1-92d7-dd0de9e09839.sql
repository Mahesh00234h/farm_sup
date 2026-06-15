-- Production hardening for verified commerce and delivery offer claiming

-- Prevent duplicate invoices for the same order
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_order_unique ON public.invoices(order_id);

-- Orders: replace broad policies with verified, role-aware policies
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can claim unassigned orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can update assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can view unassigned orders" ON public.orders;
DROP POLICY IF EXISTS "Delivery partners can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can update their orders" ON public.orders;
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders as buyer" ON public.orders;

CREATE POLICY "Verified buyers can create their own orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = buyer_id
  AND public.has_role(auth.uid(), 'consumer'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
  AND seller_id IS NOT NULL
  AND seller_id <> auth.uid()
  AND quantity > 0
  AND total_price > 0
  AND status = 'pending'
);

CREATE POLICY "Buyers can view their own orders"
ON public.orders
FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id);

CREATE POLICY "Verified sellers can view their orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = seller_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
);

CREATE POLICY "Verified sellers can update their orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = seller_id
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Verified delivery partners can view assigned orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  auth.uid() = delivery_partner_id
  AND public.has_role(auth.uid(), 'delivery'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
);

CREATE POLICY "Verified delivery partners can update assigned orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  auth.uid() = delivery_partner_id
  AND public.has_role(auth.uid(), 'delivery'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
)
WITH CHECK (auth.uid() = delivery_partner_id);

-- Products: only verified farmers can sell/list/manage their own products
DROP POLICY IF EXISTS "Farmers can manage their own products" ON public.products;

CREATE POLICY "Verified farmers can manage their own products"
ON public.products
FOR ALL
TO authenticated
USING (
  auth.uid() = farmer_id
  AND public.has_role(auth.uid(), 'farmer'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
)
WITH CHECK (
  auth.uid() = farmer_id
  AND public.has_role(auth.uid(), 'farmer'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
  AND price > 0
  AND quantity >= 0
);

-- Delivery presence: only verified delivery partners can go online/update location
DROP POLICY IF EXISTS "Partner manages own presence" ON public.delivery_partner_presence;

CREATE POLICY "Verified delivery partners manage own presence"
ON public.delivery_partner_presence
FOR ALL
TO authenticated
USING (
  auth.uid() = partner_id
  AND public.has_role(auth.uid(), 'delivery'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
)
WITH CHECK (
  auth.uid() = partner_id
  AND public.has_role(auth.uid(), 'delivery'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
  AND radius_km BETWEEN 1 AND 20
);

-- Delivery offer acceptance RPC: claim only a pending, unexpired offer assigned to the caller
CREATE OR REPLACE FUNCTION public.accept_delivery_offer(_offer_id uuid)
RETURNS TABLE(order_id uuid, estimated_earnings numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.delivery_offers%ROWTYPE;
  v_claimed uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'delivery'::app_role) THEN
    RAISE EXCEPTION 'delivery role required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  ) THEN
    RAISE EXCEPTION 'email verification required';
  END IF;

  SELECT * INTO v_offer
  FROM public.delivery_offers
  WHERE id = _offer_id
    AND partner_id = auth.uid()
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'offer not available';
  END IF;

  UPDATE public.orders
  SET delivery_partner_id = auth.uid(), status = 'assigned', updated_at = now()
  WHERE id = v_offer.order_id
    AND delivery_partner_id IS NULL
    AND status = ANY (ARRAY['pending','confirmed','processing'])
  RETURNING id INTO v_claimed;

  IF v_claimed IS NULL THEN
    UPDATE public.delivery_offers
    SET status = 'superseded', responded_at = now()
    WHERE id = _offer_id;
    RAISE EXCEPTION 'order already assigned';
  END IF;

  UPDATE public.delivery_offers
  SET status = 'accepted', responded_at = now()
  WHERE id = _offer_id;

  UPDATE public.delivery_offers
  SET status = 'superseded', responded_at = now()
  WHERE order_id = v_offer.order_id
    AND id <> _offer_id
    AND status = 'pending';

  RETURN QUERY SELECT v_offer.order_id, v_offer.estimated_earnings;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_delivery_offer(uuid) TO authenticated;

-- Payments/invoices are written by backend service functions and read by involved users only.
REVOKE INSERT, UPDATE ON public.payments FROM authenticated;
REVOKE INSERT ON public.invoices FROM authenticated;