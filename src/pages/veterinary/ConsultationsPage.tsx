import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Video,
  Filter,
  Search
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useConsultations } from '@/hooks/useVeterinary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-info/10 text-info', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: 'bg-primary/10 text-primary', icon: MessageSquare },
  completed: { label: 'Completed', color: 'bg-success/10 text-success', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-muted text-muted-foreground', icon: XCircle },
};

const typeIcons = {
  chat: MessageSquare,
  video: Video,
  in_person: MessageSquare,
};

export default function ConsultationsPage() {
  const { consultations, isLoading, updateConsultation } = useConsultations();
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConsultations = consultations.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    return true;
  });

  const handleAccept = async (id: string) => {
    await updateConsultation(id, { status: 'accepted' });
  };

  const handleStart = async (id: string) => {
    await updateConsultation(id, { 
      status: 'in_progress',
      started_at: new Date().toISOString()
    });
  };

  const handleComplete = async (id: string) => {
    await updateConsultation(id, { 
      status: 'completed',
      ended_at: new Date().toISOString()
    });
  };

  return (
    <DashboardLayout 
      title="Consultations" 
      subtitle="Manage your consultation requests"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search consultations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'pending', 'in_progress', 'completed'].map((status) => (
              <Button
                key={status}
                variant={filter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(status)}
                className="whitespace-nowrap"
              >
                {status === 'all' ? 'All' : statusConfig[status as keyof typeof statusConfig]?.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Consultations List */}
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="mt-3 text-muted-foreground">Loading consultations...</p>
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No consultations found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'You don\'t have any consultations yet.' 
                : `No ${statusConfig[filter as keyof typeof statusConfig]?.label.toLowerCase()} consultations.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConsultations.map((consultation, index) => {
              const status = statusConfig[consultation.status];
              const TypeIcon = typeIcons[consultation.consultation_type];

              return (
                <motion.div
                  key={consultation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl p-5 border border-border"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <TypeIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">
                            {consultation.consultation_type.charAt(0).toUpperCase() + 
                             consultation.consultation_type.slice(1)} Consultation
                          </h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            status.color
                          )}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Created: {format(new Date(consultation.created_at), 'PPp')}
                        </p>
                        {consultation.scheduled_at && (
                          <p className="text-sm text-muted-foreground">
                            Scheduled: {format(new Date(consultation.scheduled_at), 'PPp')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-auto sm:ml-0">
                      {consultation.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateConsultation(consultation.id, { status: 'cancelled' })}
                          >
                            Decline
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleAccept(consultation.id)}
                          >
                            Accept
                          </Button>
                        </>
                      )}
                      {consultation.status === 'accepted' && (
                        <Button 
                          size="sm"
                          onClick={() => handleStart(consultation.id)}
                        >
                          Start Consultation
                        </Button>
                      )}
                      {consultation.status === 'in_progress' && (
                        <>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Chat
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleComplete(consultation.id)}
                          >
                            Complete
                          </Button>
                        </>
                      )}
                      {consultation.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>

                  {consultation.notes && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {consultation.notes}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
