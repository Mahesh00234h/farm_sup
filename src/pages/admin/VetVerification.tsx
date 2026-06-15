import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileText, 
  MapPin,
  Star,
  Clock,
  User,
  Award,
  ExternalLink,
  Filter,
  Search
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VetProfile {
  id: string;
  user_id: string;
  license_number: string;
  specialization: string | null;
  experience_years: number | null;
  consultation_fee: number | null;
  is_verified: boolean | null;
  is_available: boolean | null;
  location_address: string | null;
  certificate_url: string | null;
  rating: number | null;
  total_consultations: number | null;
  created_at: string;
}

type FilterType = 'all' | 'pending' | 'verified';

export default function VetVerification() {
  const [vets, setVets] = useState<VetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchVets = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('vet_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('is_verified', false);
      } else if (filter === 'verified') {
        query = query.eq('is_verified', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVets(data || []);
    } catch (err) {
      console.error('Error fetching vets:', err);
      toast.error('Failed to load veterinary profiles');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchVets();
  }, [fetchVets]);

  const handleVerify = async (vetId: string, approve: boolean) => {
    setProcessingId(vetId);
    try {
      const { error } = await supabase
        .from('vet_profiles')
        .update({ is_verified: approve })
        .eq('id', vetId);

      if (error) throw error;

      toast.success(approve ? 'Veterinarian verified successfully' : 'Verification rejected');
      await fetchVets();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update verification';
      toast.error(message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredVets = vets.filter(vet => 
    vet.license_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.specialization?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.location_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = vets.filter(v => !v.is_verified).length;

  return (
    <DashboardLayout 
      title="Vet Verification" 
      subtitle="Review and approve veterinary profiles"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl p-5 border border-border"
          >
            <p className="text-2xl font-bold text-warning">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl p-5 border border-border"
          >
            <p className="text-2xl font-bold text-success">
              {vets.filter(v => v.is_verified).length}
            </p>
            <p className="text-sm text-muted-foreground">Verified</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl p-5 border border-border"
          >
            <p className="text-2xl font-bold">{vets.length}</p>
            <p className="text-sm text-muted-foreground">Total Profiles</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by license, specialization, or location..."
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'pending', 'verified'] as FilterType[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'pending' && pendingCount > 0 && (
                  <span className="mr-1 px-1.5 py-0.5 text-xs bg-warning text-warning-foreground rounded-full">
                    {pendingCount}
                  </span>
                )}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Vet List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredVets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No veterinary profiles found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVets.map((vet, index) => (
              <motion.div
                key={vet.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-2xl p-6 border border-border"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Profile Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">License: {vet.license_number}</h3>
                          <span className={cn(
                            "px-2 py-0.5 text-xs rounded-full",
                            vet.is_verified 
                              ? "bg-success/10 text-success" 
                              : "bg-warning/10 text-warning"
                          )}>
                            {vet.is_verified ? 'Verified' : 'Pending'}
                          </span>
                        </div>
                        <p className="text-muted-foreground">
                          {vet.specialization || 'General Veterinary'}
                        </p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{vet.experience_years || 0} years</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Star className="h-4 w-4 text-warning" />
                            <span>{vet.rating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span>{vet.total_consultations || 0} consultations</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">₹</span>
                            <span>{vet.consultation_fee || 0} fee</span>
                          </div>
                        </div>

                        {vet.location_address && (
                          <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{vet.location_address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 lg:w-48">
                    {vet.certificate_url && (
                      <a
                        href={vet.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm"
                      >
                        <FileText className="h-4 w-4" />
                        View Certificate
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {!vet.is_verified && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleVerify(vet.id, true)}
                          disabled={processingId === vet.id}
                        >
                          {processingId === vet.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          onClick={() => handleVerify(vet.id, false)}
                          disabled={processingId === vet.id}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {vet.is_verified && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={() => handleVerify(vet.id, false)}
                        disabled={processingId === vet.id}
                      >
                        <XCircle className="h-4 w-4" />
                        Revoke Verification
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                  <span>Registered: {new Date(vet.created_at).toLocaleDateString()}</span>
                  <span>ID: {vet.user_id.slice(0, 8)}...</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
