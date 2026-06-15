-- Server-side order price validation and inventory reservation
CREATE OR REPLACE FUNCTION public.prepare_marketplace_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product public.products%ROWTYPE;
  v_delivery_fee numeric;
  v_subtotal numeric;
  v_platform_fee numeric;
BEGIN
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  IF NOT FOUND OR COALESCE(v_product.is_available, false) = false THEN
    RAISE EXCEPTION 'Product is not available';
  END IF;

  IF NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be greater than zero';
  END IF;

  IF v_product.quantity < NEW.quantity THEN
    RAISE EXCEPTION 'Only % % available', v_product.quantity, v_product.unit;
  END IF;

  IF NEW.seller_id IS DISTINCT FROM v_product.farmer_id THEN
    RAISE EXCEPTION 'Seller does not match product owner';
  END IF;

  IF NEW.buyer_id IS NULL OR NEW.buyer_id = v_product.farmer_id THEN
    RAISE EXCEPTION 'Invalid buyer';
  END IF;

  v_delivery_fee := GREATEST(COALESCE(NEW.delivery_fee, 0), 0);
  v_subtotal := ROUND((v_product.price * NEW.quantity)::numeric, 2);
  v_platform_fee := ROUND((v_subtotal * 0.11)::numeric, 2);

  NEW.subtotal := v_subtotal;
  NEW.platform_fee := v_platform_fee;
  NEW.seller_payout := v_subtotal - v_platform_fee;
  NEW.total_price := v_subtotal + v_delivery_fee;
  NEW.status := COALESCE(NULLIF(NEW.status, ''), 'pending');
  NEW.updated_at := now();

  UPDATE public.products
  SET quantity = quantity - NEW.quantity,
      is_available = (quantity - NEW.quantity) > 0,
      updated_at = now()
  WHERE id = NEW.product_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prepare_marketplace_order ON public.orders;
CREATE TRIGGER trg_prepare_marketplace_order
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.prepare_marketplace_order();

REVOKE ALL ON FUNCTION public.prepare_marketplace_order() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prepare_marketplace_order() FROM anon;
REVOKE ALL ON FUNCTION public.prepare_marketplace_order() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.prepare_marketplace_order() TO service_role;

-- Internal helpers should not be callable by anonymous visitors.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;