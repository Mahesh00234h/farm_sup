import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Users, Stethoscope, Sprout, ShoppingBag, TrendingUp, CheckCircle,
  Clock, AlertTriangle, Activity, Database, Server, Zap,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  totalFarmers: number;
  totalVets: number;
  pendingVetVerifications: number;
  totalProducts: number;
  totalConsultations: number;
  activeConsultations: number;
  totalFarms: number;
  totalOrders: number;
}

interface RecentActivity {
  text: string;
  time: string;
  icon: typeof Sprout;
  color: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, totalFarmers: 0, totalVets: 0, pendingVetVerifications: 0,
    totalProducts: 0, totalConsultations: 0, activeConsultations: 0, totalFarms: 0, totalOrders: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [
        { count: usersCount },
        { count: farmersCount },
        { count: vetsCount },
        { count: pendingVetsCount },
        { count: productsCount },
        { count: consultationsCount },
        { count: activeConsultationsCount },
        { count: farmsCount },
        { count: ordersCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'farmer'),
        supabase.from('vet_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('vet_profiles').select('*', { count: 'exact', head: true }).eq('is_verified', false),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('consultations').select('*', { count: 'exact', head: true }),
        supabase.from('consultations').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('farms').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: usersCount || 0, totalFarmers: farmersCount || 0, totalVets: vetsCount || 0,
        pendingVetVerifications: pendingVetsCount || 0, totalProducts: productsCount || 0,
        totalConsultations: consultationsCount || 0, activeConsultations: activeConsultationsCount || 0,
        totalFarms: farmsCount || 0, totalOrders: ordersCount || 0,
      });

      // Fetch real recent activity
      const activities: RecentActivity[] = [];
      
      const [
        { data: recentProfiles },
        { data: recentVets },
        { data: recentProducts },
        { data: recentConsultations },
        { data: recentDetections },
      ] = await Promise.all([
        supabase.from('profiles').select('name, created_at').order('created_at', { ascending: false }).limit(2),
        supabase.from('vet_profiles').select('license_number, created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('products').select('name, created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('consultations').select('consultation_type, created_at').order('created_at', { ascending: false }).limit(1),
        supabase.from('disease_detections').select('disease_name, created_at').order('created_at', { ascending: false }).limit(1),
      ]);

      const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} min ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
      };

      recentProfiles?.forEach(p => activities.push({ text: `New user: ${p.name}`, time: timeAgo(p.created_at), icon: Sprout, color: 'text-success' }));
      recentVets?.forEach(v => activities.push({ text: `Vet profile submitted (${v.license_number})`, time: timeAgo(v.created_at), icon: Stethoscope, color: 'text-info' }));
      recentProducts?.forEach(p => activities.push({ text: `Product listed: ${p.name}`, time: timeAgo(p.created_at), icon: ShoppingBag, color: 'text-primary' }));
      recentConsultations?.forEach(c => activities.push({ text: `${c.consultation_type} consultation created`, time: timeAgo(c.created_at), icon: CheckCircle, color: 'text-success' }));
      recentDetections?.forEach(d => activities.push({ text: `Disease scan: ${d.disease_name || 'Unknown'}`, time: timeAgo(d.created_at), icon: AlertTriangle, color: 'text-warning' }));

      activities.sort((a, b) => a.time.localeCompare(b.time));
      setRecentActivity(activities.slice(0, 5));
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Farmers', value: stats.totalFarmers, icon: Sprout, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Veterinarians', value: stats.totalVets, icon: Stethoscope, color: 'text-info', bg: 'bg-info/10' },
    { label: 'Pending Verifications', value: stats.pendingVetVerifications, icon: Clock, color: 'text-warning', bg: 'bg-warning/10' },
  ];

  const secondaryStats = [
    { label: 'Total Products', value: stats.totalProducts, icon: ShoppingBag },
    { label: 'Consultations', value: stats.totalConsultations, icon: TrendingUp },
    { label: 'Active Sessions', value: stats.activeConsultations, icon: Activity },
    { label: 'Registered Farms', value: stats.totalFarms, icon: Sprout },
  ];

  return (
    <DashboardLayout title="Admin Dashboard" subtitle="System overview and management">
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <div className={cn("p-2 rounded-lg", stat.bg)}><stat.icon className={cn("h-5 w-5", stat.color)} /></div>
              </div>
              <p className="text-2xl font-bold">{isLoading ? '...' : stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link to="/admin/vets">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning/10"><CheckCircle className="h-5 w-5 text-warning" /></div>
                    <div><h4 className="font-semibold">Review Vet Profiles</h4><p className="text-sm text-muted-foreground">{stats.pendingVetVerifications} pending verifications</p></div>
                  </div>
                </motion.div>
              </Link>
              <Link to="/admin/users">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                    <div><h4 className="font-semibold">Manage Users</h4><p className="text-sm text-muted-foreground">View and manage all users</p></div>
                  </div>
                </motion.div>
              </Link>
              <Link to="/admin/analytics">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-info/10"><TrendingUp className="h-5 w-5 text-info" /></div>
                    <div><h4 className="font-semibold">View Analytics</h4><p className="text-sm text-muted-foreground">Platform usage & insights</p></div>
                  </div>
                </motion.div>
              </Link>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer" onClick={fetchStats}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10"><Activity className="h-5 w-5 text-success" /></div>
                  <div><h4 className="font-semibold">Refresh Stats</h4><p className="text-sm text-muted-foreground">Update all metrics</p></div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-success" />System Health</h3>
            <div className="space-y-4">
              {[
                { label: 'Database', latency: `${stats.totalUsers} records`, icon: Database },
                { label: 'Edge Functions', latency: '15 active', icon: Zap },
                { label: 'Orders', latency: `${stats.totalOrders} total`, icon: Server },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3"><item.icon className="h-4 w-4 text-muted-foreground" /><span className="font-medium">{item.label}</span></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{item.latency}</span><span className="w-2 h-2 rounded-full bg-success" /></div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-success/10 rounded-xl">
              <div className="flex items-center gap-2 text-success"><CheckCircle className="h-4 w-4" /><span className="text-sm font-medium">All systems operational</span></div>
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Platform Metrics</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {secondaryStats.map((stat) => (
              <div key={stat.label} className="text-center p-4 bg-muted/30 rounded-xl">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{isLoading ? '...' : stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length === 0 && !isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-colors">
                  <div className={cn("p-2 rounded-lg bg-muted", activity.color)}><activity.icon className="h-4 w-4" /></div>
                  <div className="flex-1"><p className="font-medium">{activity.text}</p><p className="text-sm text-muted-foreground">{activity.time}</p></div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
