import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock,
  MapPin,
  Calendar,
  Loader2,
  ShoppingBag,
  XCircle,
  Navigation,
  Star
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import DeliveryRatingModal from '@/components/delivery/DeliveryRatingModal';

interface Order {
  id: string;
  product_id: string | null;
  quantity: number;
  total_price: number;
  status: string;
  delivery_address: string;
  delivery_partner_id: string | null;
  created_at: string;
  product?: {
    name: string;
    images: string[] | null;
    unit: string;
  };
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-warning', label: 'Pending' },
  confirmed: { icon: Package, color: 'text-info', label: 'Confirmed' },
  assigned: { icon: Package, color: 'text-info', label: 'Assigned' },
  picked_up: { icon: Package, color: 'text-primary', label: 'Picked Up' },
  in_transit: { icon: Truck, color: 'text-primary', label: 'Out for Delivery' },
  shipped: { icon: Truck, color: 'text-primary', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-success', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-destructive', label: 'Cancelled' },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(name, images, unit)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedOrders = (data || []).map(order => ({
        ...order,
        product: order.product ? {
          ...order.product,
          images: order.product.images 
            ? (Array.isArray(order.product.images) 
              ? order.product.images 
              : JSON.parse(order.product.images as string))
            : null,
        } : undefined,
      }));

      setOrders(parsedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Subscribe to real-time order status updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('consumer-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedOrder = payload.new as { id: string; status: string };
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id 
                ? { ...order, ...updatedOrder } 
                : order
            )
          );
          
          // Show toast for status changes
          const statusLabel = statusConfig[updatedOrder.status]?.label || updatedOrder.status;
          toast({
            title: 'Order Updated',
            description: `Your order is now: ${statusLabel}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const filteredOrders = orders.filter(order => {
    if (filter === 'active') return ['pending', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'shipped'].includes(order.status);
    if (filter === 'completed') return ['delivered', 'cancelled'].includes(order.status);
    return true;
  });

  const activeCount = orders.filter(o => ['pending', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'shipped'].includes(o.status)).length;
  const completedCount = orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length;

  return (
    <DashboardLayout title="My Orders" subtitle="Track your purchases">
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            { id: 'active', label: 'Active', count: activeCount },
            { id: 'completed', label: 'Completed', count: completedCount },
          ].map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f.id as typeof filter)}
            >
              {f.label}
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-background/20 rounded">
                {f.count}
              </span>
            </Button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all' 
                ? "You haven't placed any orders yet"
                : `No ${filter} orders`}
            </p>
            <Link to="/marketplace">
              <Button>Start Shopping</Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl border border-border p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <div className="w-full sm:w-24 h-32 sm:h-24 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                      {order.product?.images?.[0] ? (
                        <img 
                          src={order.product.images[0]} 
                          alt={order.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {order.product?.name || 'Product'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Qty: {order.quantity} {order.product?.unit || 'units'}
                          </p>
                        </div>
                        <p className="text-xl font-bold text-primary">
                          ₹{order.total_price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate max-w-[200px]">{order.delivery_address}</span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between mt-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                          status.color,
                          `bg-${status.color.replace('text-', '')}/10`
                        )}>
                          <StatusIcon className="h-4 w-4" />
                          {status.label}
                        </span>

                        <p className="text-xs text-muted-foreground">
                          Order ID: {order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      {['pending', 'confirmed', 'shipped', 'in_transit', 'assigned', 'picked_up'].includes(order.status) && (
                        <div className="mt-4">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Ordered</span>
                            <span>Confirmed</span>
                            <span>Shipped</span>
                            <span>Delivered</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ 
                                width: order.status === 'pending' ? '25%' 
                                  : order.status === 'confirmed' ? '50%' 
                                  : ['shipped', 'in_transit', 'assigned', 'picked_up'].includes(order.status) ? '75%' 
                                  : '100%' 
                              }}
                            />
                          </div>
                          {/* Track Order Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 gap-2"
                            onClick={() => navigate(`/track/${order.id}`)}
                          >
                            <Navigation className="h-4 w-4" />
                            Track Order Live
                          </Button>
                        </div>
                        )}

                        {/* Rate Delivery Button */}
                        {order.status === 'delivered' && order.delivery_partner_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 ml-3 gap-2"
                            onClick={() => setRatingOrder(order)}
                          >
                            <Star className="h-4 w-4" />
                            Rate Delivery
                          </Button>
                        )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivery Rating Modal */}
      {ratingOrder && ratingOrder.delivery_partner_id && (
        <DeliveryRatingModal
          isOpen={!!ratingOrder}
          onClose={() => setRatingOrder(null)}
          orderId={ratingOrder.id}
          deliveryPartnerId={ratingOrder.delivery_partner_id}
        />
      )}
    </DashboardLayout>
  );
}
