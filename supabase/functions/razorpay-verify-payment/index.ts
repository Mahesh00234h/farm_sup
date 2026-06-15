import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.1';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function genInvoiceNumber() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `FL-${ymd}-${rand}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Require authenticated buyer
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const callerId = userData.user.id;

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
      return new Response(JSON.stringify({ error: 'missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Confirm the caller owns the primary internal order AND the razorpay_order_id matches what we stored
    const { data: orderPre } = await supabase
      .from('orders')
      .select('id, buyer_id, razorpay_order_id')
      .eq('id', order_id)
      .maybeSingle();
    if (!orderPre || orderPre.buyer_id !== callerId) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (orderPre.razorpay_order_id && orderPre.razorpay_order_id !== razorpay_order_id) {
      return new Response(JSON.stringify({ error: 'order/razorpay mismatch' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify HMAC signature
    const expected = createHmac('sha256', KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      console.warn('signature mismatch');
      await supabase.from('payments')
        .update({ status: 'failed' })
        .eq('razorpay_order_id', razorpay_order_id);
      return new Response(JSON.stringify({ error: 'invalid signature' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // All internal orders attached to this Razorpay order must belong to the same buyer.
    const { data: payableOrders, error: payableErr } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, total_price, delivery_fee, platform_fee, seller_payout, payment_method, quantity, product_id')
      .eq('razorpay_order_id', razorpay_order_id)
      .eq('buyer_id', callerId);
    if (payableErr) throw payableErr;
    if (!payableOrders?.length || !payableOrders.some((o) => o.id === order_id)) {
      return new Response(JSON.stringify({ error: 'no payable orders found' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark payment success
    const { data: payment } = await supabase.from('payments')
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: 'captured',
      })
      .eq('razorpay_order_id', razorpay_order_id)
      .select('*')
      .maybeSingle();

    // Update every order included in this payment
    const orderIds = payableOrders.map((o) => o.id);
    await supabase.from('orders')
      .update({
        razorpay_payment_id,
        payment_status: 'paid',
        status: 'confirmed',
      })
      .in('id', orderIds);

    // Generate invoice + dispatch delivery for every paid order
    for (const order of payableOrders) {
      const subtotal = Number(order.total_price) - Number(order.delivery_fee || 0);
      await supabase.from('invoices').upsert({
        order_id: order.id,
        invoice_number: genInvoiceNumber(),
        buyer_id: order.buyer_id,
        seller_id: order.seller_id,
        subtotal,
        delivery_fee: Number(order.delivery_fee || 0),
        platform_fee: Number(order.platform_fee || 0),
        total: Number(order.total_price),
        seller_payout: Number(order.seller_payout || 0),
        payment_method: order.payment_method || 'razorpay',
        breakdown: {
          razorpay_order_id,
          razorpay_payment_id,
          commission_pct: 11,
        },
      }, { onConflict: 'order_id' });

      // Trigger delivery dispatch
      supabase.functions.invoke('dispatch-delivery', { body: { order_id: order.id } }).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true, payment }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('razorpay-verify-payment error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});