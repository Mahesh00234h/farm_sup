import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Stethoscope, 
  ShoppingBag,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Eye,
  MessageSquare,
  Sprout
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface AnalyticsData {
  userGrowth: { date: string; users: number }[];
  consultationsByType: { name: string; value: number }[];
  roleDistribution: { name: string; value: number; color: string }[];
  weeklyActivity: { day: string; consultations: number; detections: number }[];
  revenueData: { date: string; revenue: number; orders: number }[];
  totalUsers: number;
  totalConsultations: number;
  totalDetections: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    userGrowth: [], consultationsByType: [], roleDistribution: [], weeklyActivity: [], revenueData: [],
    totalUsers: 0, totalConsultations: 0, totalDetections: 0, totalOrders: 0, totalRevenue: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [
        { data: roles },
        { data: consultations },
        { data: profiles },
        { data: detections },
        { data: orders },
        { data: recentProfiles },
        { data: revenueOrders },
      ] = await Promise.all([
        supabase.from('user_roles').select('role'),
        supabase.from('consultations').select('consultation_type, created_at'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('disease_detections').select('created_at').gte('created_at', sinceDate),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('created_at').gte('created_at', sinceDate).order('created_at', { ascending: true }),
        supabase.from('orders').select('total_price, created_at, status').eq('status', 'delivered').gte('created_at', sinceDate),
      ]);

      // Role distribution
      const roleCounts: Record<string, number> = {};
      roles?.forEach(r => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1; });

      const roleColors: Record<string, string> = {
        farmer: 'hsl(var(--success))', veterinary: 'hsl(var(--info))', consumer: 'hsl(var(--warning))',
        retailer: 'hsl(var(--primary))', delivery: 'hsl(var(--accent))', admin: 'hsl(var(--destructive))',
      };

      // Consultation types
      const typeCounts: Record<string, number> = {};
      consultations?.forEach(c => { typeCounts[c.consultation_type] = (typeCounts[c.consultation_type] || 0) + 1; });

      // User growth from actual profile creation dates
      const dateMap: Record<string, number> = {};
      recentProfiles?.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dateMap[date] = (dateMap[date] || 0) + 1;
      });

      // Build cumulative user growth
      let cumulative = (roles?.length || 0) - (recentProfiles?.length || 0);
      const userGrowth = Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = new Date(Date.now() - (Math.min(days, 30) - i - 1) * 24 * 60 * 60 * 1000);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        cumulative += dateMap[dateStr] || 0;
        return { date: dateStr, users: cumulative };
      });

      // Weekly activity from real data
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const activityByDay: Record<string, { consultations: number; detections: number }> = {};
      dayNames.forEach(d => { activityByDay[d] = { consultations: 0, detections: 0 }; });
      
      consultations?.filter(c => c.created_at >= sinceDate).forEach(c => {
        const day = dayNames[new Date(c.created_at).getDay()];
        activityByDay[day].consultations++;
      });
      detections?.forEach(d => {
        const day = dayNames[new Date(d.created_at).getDay()];
        activityByDay[day].detections++;
      });

      const weeklyActivity = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        day, ...activityByDay[day],
      }));

      // Revenue data
      const revMap: Record<string, { revenue: number; orders: number }> = {};
      (revenueOrders || []).forEach(o => {
        const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!revMap[date]) revMap[date] = { revenue: 0, orders: 0 };
        revMap[date].revenue += Number(o.total_price);
        revMap[date].orders++;
      });
      const revenueData = Object.entries(revMap).map(([date, v]) => ({ date, ...v }));
      const totalRevenue = (revenueOrders || []).reduce((s, o) => s + Number(o.total_price), 0);

      setData({
        userGrowth,
        consultationsByType: Object.entries(typeCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })),
        roleDistribution: Object.entries(roleCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, color: roleColors[name] || 'hsl(var(--muted))' })),
        weeklyActivity,
        revenueData,
        totalUsers: roles?.length || 0,
        totalConsultations: consultations?.length || 0,
        totalDetections: detections?.length || 0,
        totalOrders: orders?.length || 0,
        totalRevenue,
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const kpiCards = [
    { label: 'Total Users', value: data.totalUsers.toLocaleString(), change: `${data.roleDistribution.length} roles`, positive: true, icon: Users },
    { label: 'Consultations', value: data.totalConsultations.toLocaleString(), change: `${data.consultationsByType.length} types`, positive: true, icon: MessageSquare },
    { label: 'Disease Scans', value: data.totalDetections.toLocaleString(), change: `in ${timeRange}`, positive: true, icon: Activity },
    { label: 'Total Orders', value: data.totalOrders.toLocaleString(), change: 'all time', positive: true, icon: ShoppingBag },
    { label: 'Revenue', value: `₹${(data.totalRevenue / 1000).toFixed(1)}K`, change: `in ${timeRange}`, positive: true, icon: TrendingUp },
  ];

  return (
    <DashboardLayout title="Analytics" subtitle="Platform insights and statistics">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Overview</h3>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <Button key={range} variant={timeRange === range ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange(range)}>
                {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, index) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10"><kpi.icon className="h-5 w-5 text-primary" /></div>
                <span className="text-xs flex items-center gap-1 font-medium text-success">
                  <ArrowUpRight className="h-3 w-3" />{kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold">{isLoading ? '...' : kpi.value}</p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />User Growth</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.userGrowth}>
                  <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" />User Distribution by Role</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.roleDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {data.roleDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Revenue Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-success" />Revenue Tracking</h3>
          {data.revenueData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueData}>
                  <defs><linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number) => [`₹${value}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">No revenue data in this period</div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />Weekly Activity</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="consultations" name="Consultations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="detections" name="Disease Scans" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" />Consultations by Type</h3>
            {data.consultationsByType.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.consultationsByType} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="value" fill="hsl(var(--info))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">No consultation data available</div>
            )}
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="grid sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-2xl p-6 border border-success/20">
            <Sprout className="h-8 w-8 text-success mb-3" /><h4 className="font-bold text-lg">Platform Growth</h4>
            <p className="text-sm text-muted-foreground">{data.totalUsers} registered users across {data.roleDistribution.length} roles.</p>
          </div>
          <div className="bg-gradient-to-br from-info/10 to-info/5 rounded-2xl p-6 border border-info/20">
            <Stethoscope className="h-8 w-8 text-info mb-3" /><h4 className="font-bold text-lg">Active Consultations</h4>
            <p className="text-sm text-muted-foreground">{data.totalConsultations} consultations across {data.consultationsByType.length} types.</p>
          </div>
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
            <ShoppingBag className="h-8 w-8 text-primary mb-3" /><h4 className="font-bold text-lg">Marketplace</h4>
            <p className="text-sm text-muted-foreground">{data.totalOrders} orders processed on the platform.</p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
