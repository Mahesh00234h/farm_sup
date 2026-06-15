import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  Navigation,
  Truck,
  Star,
  Plus,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifications } from '@/lib/notifications';
import EarningsChart from '@/components/delivery/EarningsChart';
import DeliveryOffersPanel from '@/components/delivery/DeliveryOffersPanel';

interface OrderStats {
  pending: number;
  inTransit: number;
  delivered: number;
  totalEarnings: number;
}

interface ActiveOrder {
  id: string;
  delivery_address: string;
  status: string;
  total_price: number;
  created_at: string;
  product_name?: string;
}

interface AvailableOrder {
  id: string;
  delivery_address: string;
  total_price: number;
  created_at: string;
  seller_id: string | null;
}

export default function DeliveryDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<OrderStats>({
    pending: 0,
    inTransit: 0,
    delivered: 0,
    totalEarnings: 0
  });
  const [activeOrders, setActiveOrders] = useState<ActiveOrder[]>([]);
  const [availableOrders, setAvailableOrders] = useState<AvailableOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDeliveryData();
    }
  }, [user]);

  const fetchDeliveryData = async () => {
    try {
      // Fetch my assigned orders
      const { data: myOrders, error: myError } = await supabase
        .from('orders')
        .select('*')
        .eq('delivery_partner_id', user?.id);

      if (myError) throw myError;

      const pending = myOrders?.filter(o => o.status === 'assigned').length || 0;
      const inTransit = myOrders?.filter(o => o.status === 'in_transit').length || 0;
      const delivered = myOrders?.filter(o => o.status === 'delivered').length || 0;
      const totalEarnings = myOrders?.filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.total_price * 0.1), 0) || 0;

      setStats({ pending, inTransit, delivered, totalEarnings });

      const active = myOrders?.filter(o => ['assigned', 'in_transit', 'picked_up'].includes(o.status)) || [];
      setActiveOrders(active.slice(0, 5));

      // Fetch available (unassigned) orders that delivery partners can accept
      const { data: unassignedOrders, error: unassignedError } = await supabase
        .from('orders')
        .select('*')
        .is('delivery_partner_id', null)
        .in('status', ['pending', 'confirmed', 'processing'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (unassignedError) throw unassignedError;
      setAvailableOrders(unassignedOrders || []);
    } catch (error) {
      console.error('Error fetching delivery data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    
    setAccepting(orderId);
    try {
      // Get order details first to find buyer_id
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('buyer_id, seller_id')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      const { error } = await supabase
        .from('orders')
        .update({ 
          delivery_partner_id: user.id,
          status: 'assigned'
        })
        .eq('id', orderId)
        .is('delivery_partner_id', null);

      if (error) throw error;

      // Send notification to buyer that delivery partner has been assigned
      if (orderData?.buyer_id) {
        await notifications.orderAccepted(orderData.buyer_id, orderId);
      }

      toast({
        title: 'Order Accepted! 🎉',
        description: 'Redirecting to delivery route...',
      });

      // Navigate to active orders page with the map
      navigate('/delivery/orders');
    } catch (error) {
      console.error('Error accepting order:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept order. It may have been taken by another driver.',
        variant: 'destructive',
      });
    } finally {
      setAccepting(null);
    }
  };

  const statCards = [
    { 
      title: 'Pending Pickup', 
      value: stats.pending, 
      icon: Package, 
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
    { 
      title: 'In Transit', 
      value: stats.inTransit, 
      icon: Truck, 
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    { 
      title: 'Delivered Today', 
      value: stats.delivered, 
      icon: CheckCircle, 
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    { 
      title: 'Total Earnings', 
      value: `₹${stats.totalEarnings.toFixed(0)}`, 
      icon: TrendingUp, 
      color: 'text-accent',
      bgColor: 'bg-accent/10'
    },
  ];

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

  return (
    <DashboardLayout 
      title="Delivery Dashboard" 
      subtitle="Manage your deliveries and track earnings"
    >
      <div className="space-y-6">
        {/* Live delivery requests + availability toggle */}
        <DeliveryOffersPanel />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/delivery/orders')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-primary/10">
                  <Navigation className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Active Deliveries</h3>
                  <p className="text-sm text-muted-foreground">View route map & manage orders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-success/10">
                  <Star className="h-8 w-8 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Performance</h3>
                  <p className="text-sm text-muted-foreground">4.8 rating • 98% on-time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Orders - Orders delivery partners can accept */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Available Orders
              {availableOrders.length > 0 && (
                <Badge variant="secondary" className="ml-2">{availableOrders.length} new</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">No Available Orders</h3>
                <p className="text-sm text-muted-foreground">Check back soon for new delivery opportunities</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-accent/10 border border-accent/20 rounded-xl"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-accent/20 rounded-lg shrink-0">
                          <Package className="h-5 w-5 text-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{order.delivery_address}</span>
                          </div>
                          <p className="text-sm font-semibold text-primary mt-1">₹{order.total_price.toFixed(0)}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full sm:w-auto shrink-0"
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={accepting === order.id}
                      >
                        {accepting === order.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-1" />
                            Accept Delivery
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Orders
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/delivery/orders')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No Active Orders</h3>
                <p className="text-sm text-muted-foreground">New orders will appear here when assigned</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{order.delivery_address}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      <Button size="sm" onClick={() => navigate('/delivery/orders')}>
                        View
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Earnings Analytics */}
        <EarningsChart />

        {/* Today's Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Deliveries Completed</span>
                  <span className="font-medium">{stats.delivered} / {stats.pending + stats.inTransit + stats.delivered}</span>
                </div>
                <Progress 
                  value={stats.delivered > 0 ? (stats.delivered / (stats.pending + stats.inTransit + stats.delivered)) * 100 : 0} 
                  className="h-3"
                />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold text-success">{stats.delivered}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold text-primary">{stats.inTransit}</p>
                  <p className="text-xs text-muted-foreground">In Transit</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <p className="text-2xl font-bold text-warning">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
