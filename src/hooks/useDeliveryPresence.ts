import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PresenceRow {
  is_online: boolean;
  latitude: number | null;
  longitude: number | null;
  radius_km: number;
  vehicle_type: string;
}

const DEFAULT: PresenceRow = {
  is_online: false,
  latitude: null,
  longitude: null,
  radius_km: 10,
  vehicle_type: 'bike',
};

export function useDeliveryPresence() {
  const { user } = useAuth();
  const [presence, setPresence] = useState<PresenceRow>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('delivery_partner_presence')
        .select('is_online, latitude, longitude, radius_km, vehicle_type')
        .eq('partner_id', user.id)
        .maybeSingle();
      if (data) setPresence(data as PresenceRow);
      setLoading(false);
    })();
  }, [user]);

  const upsert = useCallback(async (patch: Partial<PresenceRow>) => {
    if (!user) return;
    setSaving(true);
    const next = { ...presence, ...patch };
    setPresence(next);
    const { error } = await supabase
      .from('delivery_partner_presence')
      .upsert(
        { partner_id: user.id, ...next },
        { onConflict: 'partner_id' }
      );
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    return true;
  }, [user, presence]);

  const goOnline = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported on this device');
      return;
    }
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          await upsert({
            is_online: true,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          toast.success('You are now online');
          resolve();
        },
        () => {
          toast.error('Unable to get your location — enable GPS and retry');
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, [upsert]);

  const goOffline = useCallback(async () => {
    await upsert({ is_online: false });
    toast.success('You are now offline');
  }, [upsert]);

  return { presence, loading, saving, upsert, goOnline, goOffline };
}