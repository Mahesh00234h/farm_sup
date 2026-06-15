
CREATE POLICY "Delivery partners can claim unassigned orders"
  ON public.orders FOR UPDATE
  USING (
    delivery_partner_id IS NULL 
    AND status IN ('pending', 'confirmed', 'processing')
    AND has_role(auth.uid(), 'delivery'::app_role)
  )
  WITH CHECK (
    delivery_partner_id = auth.uid()
  );
