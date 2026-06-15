import { motion } from 'framer-motion';
import { 
  Stethoscope, 
  ClipboardList, 
  MessageSquare, 
  MapPin, 
  Star,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useVetProfile, useConsultations } from '@/hooks/useVeterinary';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function VetDashboard() {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useVetProfile();
  const { consultations, isLoading: consultationsLoading } = useConsultations();

  const pendingConsultations = consultations.filter(c => c.status === 'pending');
  const activeConsultations = consultations.filter(c => c.status === 'in_progress');
  const completedToday = consultations.filter(c => {
    const today = new Date().toDateString();
    return c.status === 'completed' && new Date(c.ended_at || c.updated_at).toDateString() === today;
  });

  const stats = [
    {
      label: 'Pending',
      value: pendingConsultations.length,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Active',
      value: activeConsultations.length,
      icon: MessageSquare,
      color: 'text-info',
      bg: 'bg-info/10',
    },
    {
      label: 'Completed Today',
      value: completedToday.length,
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      label: 'Total Consultations',
      value: profile?.total_consultations || 0,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <DashboardLayout 
      title="Veterinary Dashboard" 
      subtitle="Manage your consultations and patients"
    >
      <div className="space-y-6">
        {/* Profile Card */}
        {!profileLoading && !profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-warning/10 border border-warning/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-warning flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-warning">Complete Your Profile</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up your veterinary profile to start accepting consultations.
                </p>
                <Link to="/veterinary/settings">
                  <Button className="mt-4" size="sm">
                    Complete Profile
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-5 border border-border"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("p-2 rounded-lg", stat.bg)}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Profile Overview */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Dr. {user?.name}</h2>
                  <p className="text-muted-foreground">{profile.specialization || 'General Veterinary'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-4 w-4 text-warning fill-warning" />
                    <span className="font-medium">{profile.rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">• {profile.experience_years} years exp.</span>
                  </div>
                </div>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                profile.is_verified ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
              )}>
                {profile.is_verified ? 'Verified' : 'Pending Verification'}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">License</p>
                <p className="font-medium">{profile.license_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Consultation Fee</p>
                <p className="font-medium">₹{profile.consultation_fee}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={cn("font-medium", profile.is_available ? "text-success" : "text-muted-foreground")}>
                  {profile.is_available ? 'Available' : 'Offline'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="font-medium truncate">{profile.location_address || 'Not set'}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/veterinary/consultations">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20 cursor-pointer"
            >
              <ClipboardList className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold">View Consultations</h3>
              <p className="text-sm text-muted-foreground">Manage your consultation requests</p>
            </motion.div>
          </Link>

          <Link to="/veterinary/chat">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-info/10 to-info/5 rounded-2xl p-6 border border-info/20 cursor-pointer"
            >
              <MessageSquare className="h-8 w-8 text-info mb-3" />
              <h3 className="font-semibold">Active Chats</h3>
              <p className="text-sm text-muted-foreground">Continue ongoing consultations</p>
            </motion.div>
          </Link>

          <Link to="/veterinary/map">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-2xl p-6 border border-accent/20 cursor-pointer"
            >
              <MapPin className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-semibold">Nearby Doctors</h3>
              <p className="text-sm text-muted-foreground">Find colleagues in your area</p>
            </motion.div>
          </Link>
        </div>

        {/* Pending Consultations */}
        {pendingConsultations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-warning" />
              Pending Requests
            </h3>
            <div className="space-y-3">
              {pendingConsultations.slice(0, 5).map((consultation) => (
                <div
                  key={consultation.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl"
                >
                  <div>
                    <p className="font-medium">Consultation Request</p>
                    <p className="text-sm text-muted-foreground">
                      {consultation.consultation_type} • {new Date(consultation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Link to={`/veterinary/consultations/${consultation.id}`}>
                    <Button size="sm">View</Button>
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
