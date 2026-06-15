import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  Phone, 
  Navigation, 
  Camera, 
  CheckCircle,
  Clock,
  User,
  ChevronRight,
  Timer,
  ExternalLink,
  Route
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProofOfDeliveryModal from '@/components/delivery/ProofOfDeliveryModal';
import { useLocationBroadcast } from '@/hooks/useOrderTracking';
import { useRouteDirections, formatDistance, formatDuration } from '@/hooks/useRouteDirections';
import TurnByTurnDirections from '@/components/navigation/TurnByTurnDirections';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifications } from '@/lib/notifications';
import { getDeliveryETA } from '@/lib/geoUtils';
import 'leaflet/dist/leaflet.css';

interface DeliveryCoordinates {
  lat: number;
  lng: number;
}

interface Order {
  id: string;
  delivery_address: string;
  delivery_coordinates: DeliveryCoordinates | null;
  status: string;
  total_price: number;
  quantity: number;
  created_at: string;
  buyer_id: string | null;
}

interface RoutePoint {
  lat: number;
  lng: number;
  orderId: string;
  address: string;
  status: string;
}

// Custom marker icons
const createOrderMarkerIcon = (index: number, status: string) => {
  const isCompleted = status === 'delivered';
  const isActive = status === 'in_transit';
  const bgColor = isCompleted 
    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
    : isActive 
      ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background: ${bgColor};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
      border: 3px solid white;
    ">${isCompleted ? '✓' : index + 1}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

const driverMarkerIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="
    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 22px;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
    border: 3px solid white;
  ">🚚</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

function LocationFinder({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) {
  const map = useMap();
  
  useEffect(() => {
    map.locate();
    map.on('locationfound', (e) => {
      onLocationFound(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, 13);
    });
  }, [map, onLocationFound]);
  
  return null;
}

export default function ActiveOrdersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isTracking, startBroadcasting, stopBroadcasting } = useLocationBroadcast();
  const { route, isLoading: routeLoading, fetchRoute, clearRoute } = useRouteDirections();
  const [orders, setOrders] = useState<Order[]>([]);
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeDeliveryOrderId, setActiveDeliveryOrderId] = useState<string | null>(null);
  const [navigatingToOrder, setNavigatingToOrder] = useState<Order | null>(null);

  const defaultCenter: [number, number] = [20.5937, 78.9629];

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Start broadcasting for in_transit orders automatically
  useEffect(() => {
    const inTransitOrder = orders.find(o => o.status === 'in_transit');
    if (inTransitOrder && !isTracking) {
      setActiveDeliveryOrderId(inTransitOrder.id);
      startBroadcasting(inTransitOrder.id);
    } else if (!inTransitOrder && isTracking) {
      stopBroadcasting();
      setActiveDeliveryOrderId(null);
    }
  }, [orders, isTracking, startBroadcasting, stopBroadcasting]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_partner_id', user?.id)
        .in('status', ['assigned', 'picked_up', 'in_transit', 'delivered'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Map data to properly typed Order objects
      const typedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        delivery_address: order.delivery_address,
        delivery_coordinates: order.delivery_coordinates as unknown as DeliveryCoordinates | null,
        status: order.status,
        total_price: order.total_price,
        quantity: order.quantity,
        created_at: order.created_at,
        buyer_id: order.buyer_id,
      }));
      
      setOrders(typedOrders);
      
      // Generate route points from active orders with coordinates (exclude delivered)
      const points: RoutePoint[] = (data || [])
        .filter(order => order.delivery_coordinates && order.status !== 'delivered')
        .map(order => {
          const coords = order.delivery_coordinates as { lat: number; lng: number };
          return {
            lat: coords.lat,
            lng: coords.lng,
            orderId: order.id,
            address: order.delivery_address,
            status: order.status
          };
        });
      
      setRoutePoints(points);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch road route when driver location and a navigating order are set
  useEffect(() => {
    if (driverLocation && navigatingToOrder?.delivery_coordinates) {
      fetchRoute(
        { lat: driverLocation.lat, lng: driverLocation.lng },
        { lat: navigatingToOrder.delivery_coordinates.lat, lng: navigatingToOrder.delivery_coordinates.lng }
      );
    }
  }, [driverLocation, navigatingToOrder, fetchRoute]);

  // Auto-navigate to the first active order (prioritize in_transit, then picked_up, then assigned)
  useEffect(() => {
    if (!navigatingToOrder && driverLocation) {
      const priorityOrder = 
        orders.find(o => o.status === 'in_transit' && o.delivery_coordinates) ||
        orders.find(o => o.status === 'picked_up' && o.delivery_coordinates) ||
        orders.find(o => o.status === 'assigned' && o.delivery_coordinates);
      if (priorityOrder) {
        setNavigatingToOrder(priorityOrder);
      }
    }
  }, [orders, navigatingToOrder, driverLocation]);

  const handleNavigateToOrder = (order: Order) => {
    if (!order.delivery_coordinates) {
      toast({ title: 'No Coordinates', description: 'This order has no delivery coordinates set.', variant: 'destructive' });
      return;
    }
    setNavigatingToOrder(order);
    if (driverLocation) {
      fetchRoute(
        { lat: driverLocation.lat, lng: driverLocation.lng },
        { lat: order.delivery_coordinates.lat, lng: order.delivery_coordinates.lng }
      );
    }
  };

  const handleLocationFound = useCallback((lat: number, lng: number) => {
    setDriverLocation({ lat, lng });
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string, buyerId?: string | null) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Send notifications based on status change
      if (buyerId) {
        if (newStatus === 'in_transit') {
          await notifications.orderOutForDelivery(buyerId, orderId);
        } else if (newStatus === 'delivered') {
          await notifications.orderDelivered(buyerId, orderId);
        }
      }

      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus.replace('_', ' ')}`,
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const handleStartDelivery = (order: Order) => {
    updateOrderStatus(order.id, 'in_transit', order.buyer_id);
  };

  const handleCompleteDelivery = (order: Order) => {
    setSelectedOrder(order);
    setShowProofModal(true);
  };

  const handleProofSubmitted = () => {
    if (selectedOrder) {
      updateOrderStatus(selectedOrder.id, 'delivered', selectedOrder.buyer_id);
      // Clear navigation if this was the navigating order
      if (navigatingToOrder?.id === selectedOrder.id) {
        setNavigatingToOrder(null);
        clearRoute();
      }
    }
    setShowProofModal(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      assigned: { variant: 'secondary', label: 'Pickup Pending' },
      picked_up: { variant: 'default', label: 'Picked Up' },
      in_transit: { variant: 'default', label: 'In Transit' },
      delivered: { variant: 'outline', label: 'Delivered' },
    };
    const config = statusConfig[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered');
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const [isOptimized, setIsOptimized] = useState(false);

  // Nearest-neighbor route optimization
  const optimizeRoute = useCallback(() => {
    if (!driverLocation || routePoints.length < 2) return;
    const unvisited = [...routePoints.filter(p => p.status !== 'delivered')];
    const optimized: RoutePoint[] = [];
    let current = { lat: driverLocation.lat, lng: driverLocation.lng };

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const d = Math.sqrt(Math.pow(current.lat - unvisited[i].lat, 2) + Math.pow(current.lng - unvisited[i].lng, 2));
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      }
      optimized.push(unvisited[nearestIdx]);
      current = { lat: unvisited[nearestIdx].lat, lng: unvisited[nearestIdx].lng };
      unvisited.splice(nearestIdx, 1);
    }
    setRoutePoints(optimized);
    setIsOptimized(true);
    toast({ title: '🗺️ Route Optimized', description: `${optimized.length} stops reordered for shortest distance` });
  }, [driverLocation, routePoints, toast]);

  // Generate polyline path
  const routePath: [number, number][] = driverLocation 
    ? [[driverLocation.lat, driverLocation.lng], ...routePoints.filter(p => p.status !== 'delivered').map(p => [p.lat, p.lng] as [number, number])]
    : routePoints.filter(p => p.status !== 'delivered').map(p => [p.lat, p.lng] as [number, number]);

  // Calculate ETA for the next delivery
  const nextDeliveryETA = useMemo(() => {
    if (!driverLocation) return null;
    const nextOrder = activeOrders.find(o => o.status === 'in_transit' && o.delivery_coordinates);
    if (!nextOrder?.delivery_coordinates) return null;
    
    return getDeliveryETA(
      driverLocation.lat,
      driverLocation.lng,
      nextOrder.delivery_coordinates.lat,
      nextOrder.delivery_coordinates.lng
    );
  }, [driverLocation, activeOrders]);

  return (
    <DashboardLayout 
      title="Active Deliveries" 
      subtitle="Manage your delivery route and complete orders"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Delivery Route
                </CardTitle>
                {activeOrders.length >= 2 && driverLocation && (
                  <Button size="sm" variant="outline" onClick={optimizeRoute}>
                    <Route className="h-4 w-4 mr-1" />Optimize Route
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px]">
                <MapContainer
                  center={defaultCenter}
                  zoom={5}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationFinder onLocationFound={handleLocationFound} />

                  {/* Driver location marker */}
                  {driverLocation && (
                    <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverMarkerIcon}>
                      <Popup>
                        <div className="p-2 text-center">
                          <p className="font-semibold">Your Location</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Order markers - only show non-delivered */}
                  {routePoints.filter(p => p.status !== 'delivered').map((point, index) => (
                    <Marker
                      key={point.orderId}
                      position={[point.lat, point.lng]}
                      icon={createOrderMarkerIcon(index, point.status)}
                    >
                      <Popup>
                        <div className="p-2 min-w-[200px]">
                          <p className="font-semibold">Stop #{index + 1}</p>
                          <p className="text-sm text-gray-600 mt-1">{point.address}</p>
                          <Badge className="mt-2" variant={point.status === 'delivered' ? 'outline' : 'default'}>
                            {point.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Road route (from API) */}
                  {route?.geometry && route.geometry.length > 1 && (
                    <Polyline
                      positions={route.geometry}
                      pathOptions={{
                        color: '#3b82f6',
                        weight: 5,
                        opacity: 0.8,
                      }}
                    />
                  )}

                  {/* Fallback straight-line route when no road route */}
                  {!route?.geometry && routePath.length > 1 && (
                    <Polyline
                      positions={routePath}
                      pathOptions={{
                        color: '#3b82f6',
                        weight: 4,
                        opacity: 0.5,
                        dashArray: '10, 10',
                      }}
                    />
                  )}
                </MapContainer>
              </div>
            </CardContent>
          </Card>

          {/* Route Summary */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{activeOrders.length}</p>
                    <p className="text-xs text-muted-foreground">Remaining</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">{completedOrders.length}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{routePoints.length}</p>
                    <p className="text-xs text-muted-foreground">Total Stops</p>
                  </div>
                  {nextDeliveryETA && (
                    <div className="text-center border-l pl-6">
                      <div className="flex items-center gap-1 text-primary">
                        <Timer className="h-4 w-4" />
                        <p className="text-2xl font-bold">{nextDeliveryETA.eta.formattedTime}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{nextDeliveryETA.distanceFormatted} away</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Navigation className="h-4 w-4" />
                  Optimize Route
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Turn-by-Turn Directions */}
          {(route || routeLoading) && navigatingToOrder && (
            <div className="mt-4">
              <TurnByTurnDirections
                steps={route?.steps || []}
                totalDistance={route?.distance || 0}
                totalDuration={route?.duration || 0}
                isLoading={routeLoading}
              />
              <div className="flex items-center justify-between mt-2 px-1">
                <p className="text-xs text-muted-foreground">
                  Navigating to Order #{navigatingToOrder.id.slice(0, 8)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setNavigatingToOrder(null); clearRoute(); }}
                >
                  Clear Route
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Deliveries ({activeOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : activeOrders.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-10 w-10 mx-auto text-success mb-2" />
                  <p className="text-sm text-muted-foreground">All deliveries completed!</p>
                </div>
              ) : (
                activeOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">₹{order.total_price}</p>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'assigned' && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => updateOrderStatus(order.id, 'picked_up', order.buyer_id)}
                        >
                          <Package className="h-4 w-4 mr-1" />
                          Mark Picked Up
                        </Button>
                      )}
                      {order.status === 'picked_up' && (
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleStartDelivery(order)}
                        >
                          <Navigation className="h-4 w-4 mr-1" />
                          Start Delivery
                        </Button>
                      )}
                      {order.status === 'in_transit' && (
                        <Button 
                          size="sm" 
                          variant="success"
                          className="flex-1"
                          onClick={() => handleCompleteDelivery(order)}
                        >
                          <Camera className="h-4 w-4 mr-1" />
                          Complete & Capture
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant={navigatingToOrder?.id === order.id ? 'secondary' : 'outline'}
                        onClick={() => handleNavigateToOrder(order)}
                        title="Show route on map"
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (order.delivery_coordinates) {
                            window.open(
                              `https://www.google.com/maps/dir/?api=1&destination=${order.delivery_coordinates.lat},${order.delivery_coordinates.lng}`,
                              '_blank'
                            );
                          } else {
                            window.open(
                              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`,
                              '_blank'
                            );
                          }
                        }}
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  Completed ({completedOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
                {completedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-success/5 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">#{order.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">₹{order.total_price}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Proof of Delivery Modal */}
      <ProofOfDeliveryModal
        open={showProofModal}
        onClose={() => setShowProofModal(false)}
        onSubmit={handleProofSubmitted}
        order={selectedOrder}
      />
    </DashboardLayout>
  );
}
