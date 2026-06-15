-- Replace elevated delivery acceptance helper with RLS-only offer-based access
REVOKE ALL ON FUNCTION public.accept_delivery_offer(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_delivery_offer(uuid) FROM authenticated;
DROP FUNCTION IF EXISTS public.accept_delivery_offer(uuid);

CREATE POLICY "Verified delivery partners can view offered orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'delivery'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
  AND EXISTS (
    SELECT 1 FROM public.delivery_offers offer
    WHERE offer.order_id = orders.id
      AND offer.partner_id = auth.uid()
      AND offer.status IN ('pending', 'accepted')
      AND offer.expires_at > now()
  )
);

CREATE POLICY "Verified delivery partners can claim offered orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  delivery_partner_id IS NULL
  AND status = ANY (ARRAY['pending','confirmed','processing'])
  AND public.has_role(auth.uid(), 'delivery'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.is_verified = true
  )
  AND EXISTS (
    SELECT 1 FROM public.delivery_offers offer
    WHERE offer.order_id = orders.id
      AND offer.partner_id = auth.uid()
      AND offer.status = 'pending'
      AND offer.expires_at > now()
  )
)
WITH CHECK (
  delivery_partner_id = auth.uid()
  AND public.has_role(auth.uid(), 'delivery'::app_role)
);