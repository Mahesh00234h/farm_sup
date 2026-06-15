import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PLATFORM_COMMISSION = 0.11; // 11%

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!KEY_ID || !KEY_SECRET) {
      return new Response(JSON.stringify({ error: 'Razorpay keys not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: 'invalid auth' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = userData.user;

    const body = await req.json();
    const { order_id, order_ids, currency = 'INR' } = body;
    const requestedIds = Array.from(new Set(
      (Array.isArray(order_ids) ? order_ids : order_id ? [order_id] : [])
        .filter((id) => typeof id === 'string' && id.length > 0)
    )) as string[];

    if (requestedIds.length === 0 || requestedIds.length > 25) {
      return new Response(JSON.stringify({ error: 'valid order_id/order_ids required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify every order belongs to the buyer, then compute the amount from DB values only.
    const { data: orders, error: orderErr } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, total_price, delivery_fee, payment_status, status')
      .in('id', requestedIds);
    if (orderErr || !orders || orders.length !== requestedIds.length || orders.some((o) => o.buyer_id !== user.id)) {
      return new Response(JSON.stringify({ error: 'order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (orders.some((o) => o.payment_status === 'paid' || o.status === 'cancelled')) {
      return new Response(JSON.stringify({ error: 'order is not payable' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amount = +orders.reduce((sum, o) => sum + Number(o.total_price || 0), 0).toFixed(2);
    if (amount <= 0) {
      return new Response(JSON.stringify({ error: 'invalid order amount' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Razorpay order (amount in paise)
    const amountPaise = Math.round(amount * 100);
    const auth = btoa(`${KEY_ID}:${KEY_SECRET}`);
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: amountPaise,
        currency,
        receipt: requestedIds[0].slice(0, 40),
        notes: { internal_order_ids: requestedIds.join(','), buyer_id: user.id },
      }),
    });
    const rzpOrder = await rzpRes.json();
    if (!rzpRes.ok) {
      console.error('razorpay order error', rzpOrder);
      return new Response(JSON.stringify({ error: rzpOrder.error?.description || 'Razorpay error' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const paymentRows = orders.map((order) => {
      const subtotal = Number(order.total_price) - Number(order.delivery_fee || 0);
      const platform_fee = +(subtotal * PLATFORM_COMMISSION).toFixed(2);
      const seller_payout = +(subtotal - platform_fee).toFixed(2);
      return {
        order_id: order.id,
        buyer_id: user.id,
        seller_id: order.seller_id,
        razorpay_order_id: rzpOrder.id,
        amount: Number(order.total_price),
        currency,
        platform_fee,
        seller_payout,
        delivery_fee: Number(order.delivery_fee || 0),
        status: 'created',
      };
    });

    const { error: paymentErr } = await supabase.from('payments').insert(paymentRows);
    if (paymentErr) throw paymentErr;

    const { error: updateErr } = await supabase.from('orders').update({
      razorpay_order_id: rzpOrder.id,
      payment_method: 'razorpay',
      payment_status: 'awaiting_payment',
    }).in('id', requestedIds);
    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({
      razorpay_order_id: rzpOrder.id,
      amount: amountPaise,
      currency,
      key_id: KEY_ID,
      order_ids: requestedIds,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('razorpay-create-order error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});