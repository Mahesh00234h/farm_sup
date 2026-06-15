import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DeliveryOffer {
  id: string;
  order_id: string;
  distance_km: number;
  estimated_earnings: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'superseded';
  expires_at: string;
  created_at: string;
  order?: {
    delivery_address: string;
    total_price: number;
    quantity: number;
    buyer_id: string | null;
  };
}

export function useDeliveryOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState<DeliveryOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('delivery_offers')
      .select('id, order_id, distance_km, estimated_earnings, status, expires_at, created_at')
      .eq('partner_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }
    // Enrich with order info
    const ids = (data || []).map((o) => o.order_id);
    let orderMap = new Map<string, DeliveryOffer['order']>();
    if (ids.length > 0) {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, delivery_address, total_price, quantity, buyer_id, delivery_partner_id')
        .in('id', ids);
      for (const o of ordersData || []) {
        // Skip offers for orders already assigned
        if (!o.delivery_partner_id) {
          orderMap.set(o.id, {
            delivery_address: o.delivery_address,
            total_price: Number(o.total_price),
            quantity: Number(o.quantity),
            buyer_id: o.buyer_id,
          });
        }
      }
    }
    const enriched = (data || [])
      .filter((o) => orderMap.has(o.order_id))
      .map((o) => ({ ...o, order: orderMap.get(o.order_id) } as DeliveryOffer));
    setOffers(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Realtime subscription: refetch on any change to this partner's offers
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`offers-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_offers', filter: `partner_id=eq.${user.id}` },
        () => fetchOffers()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchOffers]);

  const accept = useCallback(async (offer: DeliveryOffer) => {
    if (!user) return;
    setResponding(offer.id);
    try {
      // 1. Try to claim the order atomically (only if not already assigned)
      const { data: claimed, error: claimErr } = await supabase
        .from('orders')
        .update({ delivery_partner_id: user.id, status: 'assigned' })
        .eq('id', offer.order_id)
        .is('delivery_partner_id', null)
        .select('id')
        .maybeSingle();

      if (claimErr) throw claimErr;
      if (!claimed) {
        toast.error('Another partner already took this order');
        await supabase.from('delivery_offers').update({ status: 'superseded', responded_at: new Date().toISOString() }).eq('id', offer.id);
        fetchOffers();
        return;
      }

      // 2. Mark this offer accepted
      await supabase
        .from('delivery_offers')
        .update({ status: 'accepted', responded_at: new Date().toISOString() })
        .eq('id', offer.id);

      toast.success(`Delivery accepted — earn ₹${offer.estimated_earnings}`);
      fetchOffers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to accept');
    } finally {
      setResponding(null);
    }
  }, [user, fetchOffers]);

  const decline = useCallback(async (offer: DeliveryOffer) => {
    setResponding(offer.id);
    await supabase
      .from('delivery_offers')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', offer.id);
    setResponding(null);
    fetchOffers();
  }, [fetchOffers]);

  return { offers, loading, responding, accept, decline, refresh: fetchOffers };
}