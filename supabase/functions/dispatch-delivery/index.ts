import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Haversine — distance between two lat/lng in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Earnings = ₹30 base + ₹10 per km, rounded to nearest ₹5
function estimateEarnings(distanceKm: number): number {
  const raw = 30 + distanceKm * 10;
  return Math.round(raw / 5) * 5;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { order_id } = await req.json();
    if (!order_id || typeof order_id !== 'string') {
      return new Response(JSON.stringify({ error: 'order_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Authorization: allow either an internal service-role call (e.g. from payment verification)
    // or the authenticated buyer/seller for this order.
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const isServiceCall = !!token && token === serviceKey;

    let callerId: string | null = null;
    if (!isServiceCall) {
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
      callerId = userData.user.id;
    }

    // Fetch the order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id, buyer_id, seller_id, delivery_address, delivery_coordinates, total_price, delivery_partner_id')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: 'order not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!isServiceCall && callerId !== order.seller_id && callerId !== order.buyer_id) {
      return new Response(JSON.stringify({ error: 'forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (order.delivery_partner_id) {
      return new Response(JSON.stringify({ ok: true, skipped: 'already_assigned' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const coords = order.delivery_coordinates as { lat?: number; lng?: number } | null;
    const dropLat = coords?.lat;
    const dropLng = coords?.lng;
    if (dropLat == null || dropLng == null) {
      return new Response(JSON.stringify({ ok: true, notified: 0, reason: 'delivery_location_required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch online partners
    const { data: partners, error: partnersErr } = await supabase
      .from('delivery_partner_presence')
      .select('partner_id, latitude, longitude, radius_km')
      .eq('is_online', true);

    if (partnersErr) throw partnersErr;

    type Candidate = { partner_id: string; distance_km: number; earnings: number };
    const candidates: Candidate[] = [];

    for (const p of partners || []) {
      // If we have drop coords and partner coords, filter by radius
      if (dropLat != null && dropLng != null && p.latitude != null && p.longitude != null) {
        const d = haversineKm(Number(p.latitude), Number(p.longitude), dropLat, dropLng);
        const notifyRadiusKm = Math.min(Number(p.radius_km || 10), 10);
        if (d <= notifyRadiusKm) {
          candidates.push({
            partner_id: p.partner_id,
            distance_km: Number(d.toFixed(2)),
            earnings: estimateEarnings(d),
          });
        }
      }
    }

    if (candidates.length === 0) {
      return new Response(JSON.stringify({ ok: true, notified: 0, reason: 'no_online_partners_in_radius' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert offers (ignore duplicates per unique constraint)
    const offerRows = candidates.map((c) => ({
      order_id,
      partner_id: c.partner_id,
      distance_km: c.distance_km,
      estimated_earnings: c.earnings,
    }));

    const { error: insertErr } = await supabase
      .from('delivery_offers')
      .upsert(offerRows, { onConflict: 'order_id,partner_id', ignoreDuplicates: true });
    if (insertErr) throw insertErr;

    // Notify each partner
    await Promise.allSettled(
      candidates.map((c) =>
        supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: c.partner_id,
            title: `New delivery — earn ₹${c.earnings} 🛵`,
            body: `${c.distance_km} km away • ${order.delivery_address.slice(0, 60)}`,
            notification_type: 'delivery',
            data: { order_id, url: '/delivery', offer: true, distance_km: c.distance_km, earnings: c.earnings },
          },
        })
      )
    );

    return new Response(
      JSON.stringify({ ok: true, notified: candidates.length, candidates }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('dispatch-delivery error', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});