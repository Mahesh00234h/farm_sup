import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalInventory: number;
  lowStockItems: number;
  pendingOrders: number;
  activePartners: number;
  monthlySpend: number;
}

interface RecentOrder {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  created_at: string;
}

interface LowStockItem {
  id: string;
  name: string;
  current_stock: number;
  min_stock: number;
  unit: string;
}

export default function RetailerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalInventory: 0, lowStockItems: 0, pendingOrders: 0, activePartners: 0, monthlySpend: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [
        { data: orders },
        { data: inventory },
        { data: partnerships },
      ] = await Promise.all([
        supabase.from('orders').select('*').eq('buyer_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('retailer_inventory').select('*').eq('retailer_id', user?.id),
        supabase.from('partnerships').select('id').eq('retailer_id', user?.id).eq('status', 'accepted'),
      ]);

      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
      const monthlySpend = orders?.reduce((sum, o) => sum + o.total_price, 0) || 0;

      const lowStock = (inventory || [])
        .filter((i: any) => i.current_stock < i.min_stock)
        .map((i: any) => ({
          id: i.id, name: i.name, current_stock: i.current_stock, min_stock: i.min_stock, unit: i.unit
        }));

      setStats({
        totalInventory: inventory?.length || 0,
        lowStockItems: lowStock.length,
        pendingOrders,
        activePartners: partnerships?.length || 0,
        monthlySpend,
      });

      setRecentOrders(orders?.slice(0, 5).map(o => ({
        id: o.id, quantity: o.quantity, total_price: o.total_price, status: o.status, created_at: o.created_at
      })) || []);

      setLowStockItems(lowStock.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Inventory', value: `${stats.totalInventory} items`, icon: Package, color: 'text-primary', bgColor: 'bg-primary/10' },
    { title: 'Low Stock Alerts', value: stats.lowStockItems, icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10' },
    { title: 'Pending Orders', value: stats.pendingOrders, icon: ShoppingCart, color: 'text-accent', bgColor: 'bg-accent/10' },
    { title: 'Active Partners', value: stats.activePartners, icon: Users, color: 'text-success', bgColor: 'bg-success/10' },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      delivered: { variant: 'outline', label: 'Delivered' },
    };
    const c = config[status] || { variant: 'secondary' as const, label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  return (
    <DashboardLayout title="Retailer Dashboard" subtitle="Manage your inventory, orders, and farmer partnerships">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-3xl font-bold mt-1">₹{stats.monthlySpend.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-success/20">
                <TrendingUp className="h-10 w-10 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20 hover:border-primary/40" onClick={() => navigate('/retailer/orders')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-primary/10"><ShoppingCart className="h-8 w-8 text-primary" /></div>
                <div><h3 className="font-semibold text-lg">Bulk Orders</h3><p className="text-sm text-muted-foreground">Place orders from farmers</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-accent/20 hover:border-accent/40" onClick={() => navigate('/retailer/inventory')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-accent/10"><Package className="h-8 w-8 text-accent" /></div>
                <div><h3 className="font-semibold text-lg">Inventory</h3><p className="text-sm text-muted-foreground">Manage your stock levels</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-success/20 hover:border-success/40" onClick={() => navigate('/retailer/partnerships')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-success/10"><Users className="h-8 w-8 text-success" /></div>
                <div><h3 className="font-semibold text-lg">Partnerships</h3><p className="text-sm text-muted-foreground">Connect with farmers</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-warning" />Low Stock Alerts</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/retailer/inventory')}>View All</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">All items are well stocked!</p>
                </div>
              ) : lowStockItems.map((item) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{item.name}</span>
                    <span className="text-sm text-muted-foreground">{item.current_stock}/{item.min_stock} {item.unit}</span>
                  </div>
                  <Progress value={(item.current_stock / item.min_stock) * 100} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5" />Recent Orders</CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/retailer/orders')}>View All</Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}</div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                  <Button size="sm" className="mt-3" onClick={() => navigate('/retailer/orders')}>Place First Order</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div>
                        <p className="font-medium text-sm">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{order.quantity} items • ₹{order.total_price}</p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
