-- Allow delivery partners to view unassigned orders so they can accept them
CREATE POLICY "Delivery partners can view unassigned orders"
ON public.orders
FOR SELECT
USING (
  delivery_partner_id IS NULL 
  AND status IN ('pending', 'confirmed', 'processing')
  AND has_role(auth.uid(), 'delivery'::app_role)
);