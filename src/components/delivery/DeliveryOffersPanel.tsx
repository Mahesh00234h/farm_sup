import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Wifi, WifiOff, MapPin, Coins, Clock, Loader2, Bike } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useDeliveryPresence } from '@/hooks/useDeliveryPresence';
import { useDeliveryOffers } from '@/hooks/useDeliveryOffers';

function formatCountdown(expiresAt: string, now: number): string {
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'expired';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function DeliveryOffersPanel() {
  const navigate = useNavigate();
  const { presence, loading: presenceLoading, saving, upsert, goOnline, goOffline } = useDeliveryPresence();
  const { offers, loading: offersLoading, responding, accept, decline } = useDeliveryOffers();
  const [now, setNow] = useState(Date.now());

  // Tick every second for countdowns
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      {/* Availability card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {presence.is_online ? (
              <Wifi className="h-5 w-5 text-success" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            Availability
            {presence.is_online && (
              <Badge variant="default" className="ml-auto bg-success">Online</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Accept delivery requests</Label>
              <p className="text-xs text-muted-foreground">
                {presence.is_online
                  ? 'You will be notified of nearby orders'
                  : 'Turn on to start receiving offers'}
              </p>
            </div>
            <Switch
              checked={presence.is_online}
              disabled={presenceLoading || saving}
              onCheckedChange={(v) => (v ? goOnline() : goOffline())}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Notification radius</Label>
              <span className="text-sm font-semibold">{presence.radius_km} km</span>
            </div>
            <Slider
              value={[presence.radius_km]}
              min={1}
              max={10}
              step={1}
              onValueChange={(v) => upsert({ radius_km: v[0] })}
              disabled={presenceLoading}
            />
            <p className="text-xs text-muted-foreground">
              Only orders within this distance will alert you
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pending offers */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bike className="h-5 w-5" /> Delivery requests
            {offers.length > 0 && (
              <Badge variant="secondary" className="ml-auto animate-pulse">
                {offers.length} new
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!presence.is_online ? (
            <div className="text-center py-8">
              <WifiOff className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Go online to receive delivery requests</p>
            </div>
          ) : offersLoading ? (
            <div className="h-24 bg-muted/30 rounded-xl animate-pulse" />
          ) : offers.length === 0 ? (
            <div className="text-center py-8">
              <Bike className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Waiting for new requests…</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {offers.map((o) => (
                  <motion.div
                    key={o.id}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40 }}
                    className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 text-primary font-bold text-lg">
                        <Coins className="h-5 w-5" />
                        ₹{o.estimated_earnings}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          est. earnings
                        </span>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {formatCountdown(o.expires_at, now)}
                      </Badge>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="flex-1">{o.order?.delivery_address || 'Delivery address'}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>📍 {o.distance_km} km away</span>
                      <span>•</span>
                      <span>Order ₹{o.order?.total_price?.toFixed(0) || '-'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => decline(o)}
                        disabled={responding === o.id}
                      >
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          await accept(o);
                          navigate('/delivery/orders');
                        }}
                        disabled={responding === o.id}
                      >
                        {responding === o.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          `Accept · ₹${o.estimated_earnings}`
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}