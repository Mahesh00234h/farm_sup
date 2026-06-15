import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MessageSquare, Video, MapPin, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VetProfile {
  id: string;
  user_id: string;
  specialization?: string;
  consultation_fee: number;
  location_address?: string;
  rating: number;
  experience_years: number;
}

interface BookConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vet: VetProfile;
}

type ConsultationType = 'chat' | 'video' | 'in_person';

export default function BookConsultationModal({ isOpen, onClose, vet }: BookConsultationModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [consultationType, setConsultationType] = useState<ConsultationType>('chat');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const consultationTypes = [
    { type: 'chat' as const, icon: MessageSquare, label: 'Chat', description: 'Text-based consultation' },
    { type: 'video' as const, icon: Video, label: 'Video Call', description: 'Face-to-face video call' },
    { type: 'in_person' as const, icon: MapPin, label: 'In Person', description: 'Visit the clinic' },
  ];

  const handleBookConsultation = async () => {
    if (!user) {
      toast.error('Please login to book a consultation');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('consultations')
        .insert({
          farmer_id: user.id,
          vet_id: vet.user_id,
          consultation_type: consultationType,
          notes: notes.trim() || null,
          fee_paid: vet.consultation_fee,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Consultation request sent!');
      onClose();

      // Navigate to chat if chat type selected
      if (consultationType === 'chat' && data) {
        navigate(`/veterinary/chat/${data.id}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to book consultation';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Consultation</DialogTitle>
          <DialogDescription>
            Connect with {vet.specialization || 'Veterinary Doctor'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Vet Info Summary */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
              🩺
            </div>
            <div className="flex-1">
              <p className="font-semibold">{vet.specialization || 'General Veterinary'}</p>
              <p className="text-sm text-muted-foreground">{vet.experience_years} years experience</p>
              <p className="text-sm font-medium text-primary">₹{vet.consultation_fee} per consultation</p>
            </div>
          </div>

          {/* Consultation Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Consultation Type</label>
            <div className="grid grid-cols-3 gap-3">
              {consultationTypes.map(({ type, icon: Icon, label, description }) => (
                <button
                  key={type}
                  onClick={() => setConsultationType(type)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    consultationType === type
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <Icon className={cn(
                    "h-6 w-6",
                    consultationType === type ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Describe your concern (optional)</label>
            <Textarea
              placeholder="e.g., My cow is not eating properly since yesterday..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleBookConsultation} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
