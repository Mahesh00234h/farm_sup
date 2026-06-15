import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, IndianRupee, Package, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface EarningData {
  label: string;
  earnings: number;
  deliveries: number;
}

export default function EarningsChart() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [chartData, setChartData] = useState<EarningData[]>([]);
  const [totals, setTotals] = useState({ earnings: 0, deliveries: 0, avgPerDelivery: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) fetchEarnings();
  }, [user, period]);

  const fetchEarnings = async () => {
    setIsLoading(true);
    try {
      const days = period === 'week' ? 7 : 30;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('orders')
        .select('total_price, created_at, status')
        .eq('delivery_partner_id', user!.id)
        .eq('status', 'delivered')
        .gte('created_at', since);

      if (error) throw error;

      // Group by day
      const dayMap: Record<string, { earnings: number; deliveries: number }> = {};
      (data || []).forEach(order => {
        const date = new Date(order.created_at);
        const key = period === 'week'
          ? date.toLocaleDateString('en-US', { weekday: 'short' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dayMap[key]) dayMap[key] = { earnings: 0, deliveries: 0 };
        dayMap[key].earnings += Number(order.total_price) * 0.1; // 10% commission
        dayMap[key].deliveries++;
      });

      let chartEntries: EarningData[];
      if (period === 'week') {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        chartEntries = dayNames.map(d => ({
          label: d,
          earnings: Math.round(dayMap[d]?.earnings || 0),
          deliveries: dayMap[d]?.deliveries || 0,
        }));
      } else {
        chartEntries = Object.entries(dayMap).map(([label, v]) => ({
          label,
          earnings: Math.round(v.earnings),
          deliveries: v.deliveries,
        }));
      }

      const totalEarnings = (data || []).reduce((s, o) => s + Number(o.total_price) * 0.1, 0);
      const totalDeliveries = data?.length || 0;

      setChartData(chartEntries);
      setTotals({
        earnings: Math.round(totalEarnings),
        deliveries: totalDeliveries,
        avgPerDelivery: totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0,
      });
    } catch (err) {
      console.error('Earnings error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Earnings Analytics
        </CardTitle>
        <div className="flex gap-1">
          {(['week', 'month'] as const).map(p => (
            <Button key={p} variant={period === p ? 'default' : 'outline'} size="sm" onClick={() => setPeriod(p)}>
              {p === 'week' ? 'This Week' : 'This Month'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-primary/10 rounded-xl">
            <IndianRupee className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">₹{totals.earnings}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
          <div className="text-center p-3 bg-success/10 rounded-xl">
            <Package className="h-5 w-5 text-success mx-auto mb-1" />
            <p className="text-xl font-bold">{totals.deliveries}</p>
            <p className="text-xs text-muted-foreground">Deliveries</p>
          </div>
          <div className="text-center p-3 bg-warning/10 rounded-xl">
            <Calendar className="h-5 w-5 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold">₹{totals.avgPerDelivery}</p>
            <p className="text-xs text-muted-foreground">Avg/Delivery</p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-52">
          {isLoading ? (
            <div className="h-full bg-muted/30 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`₹${value}`, 'Earnings']}
                />
                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
