import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Video, Search, User } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ChatWindow from '@/components/veterinary/ChatWindow';
import VideoCall from '@/components/veterinary/VideoCall';
import { useConsultations } from '@/hooks/useVeterinary';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function ChatPage() {
  const { consultations } = useConsultations();
  const [selectedConsultation, setSelectedConsultation] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter to only show active consultations
  const activeConsultations = consultations.filter(
    c => c.status === 'accepted' || c.status === 'in_progress'
  );

  const selected = consultations.find(c => c.id === selectedConsultation);

  return (
    <DashboardLayout 
      title="Chat" 
      subtitle="Communicate with your patients"
    >
      <div className="h-[calc(100vh-200px)] flex gap-4">
        {/* Conversations List */}
        <div className={cn(
          "w-full lg:w-80 flex-shrink-0 bg-card rounded-2xl border border-border overflow-hidden flex flex-col",
          selectedConsultation && "hidden lg:flex"
        )}>
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {activeConsultations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="font-medium">No active chats</p>
                <p className="text-sm text-muted-foreground">
                  Accept a consultation to start chatting
                </p>
              </div>
            ) : (
              activeConsultations.map((consultation, index) => (
                <motion.button
                  key={consultation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedConsultation(consultation.id)}
                  className={cn(
                    "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border",
                    selectedConsultation === consultation.id && "bg-muted"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">Farmer Consultation</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(consultation.updated_at), 'HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {consultation.consultation_type === 'video' ? '📹 Video call' : '💬 Chat'}
                    </p>
                    <span className={cn(
                      "inline-block mt-1 px-2 py-0.5 rounded-full text-xs",
                      consultation.status === 'in_progress' 
                        ? "bg-success/10 text-success" 
                        : "bg-info/10 text-info"
                    )}>
                      {consultation.status === 'in_progress' ? 'Active' : 'Accepted'}
                    </span>
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className={cn(
          "flex-1 bg-card rounded-2xl border border-border overflow-hidden",
          !selectedConsultation && "hidden lg:flex"
        )}>
          {selectedConsultation ? (
            showVideo ? (
              <VideoCall
                consultationId={selectedConsultation}
                otherPartyName="Farmer"
                onEnd={() => setShowVideo(false)}
                onOpenChat={() => setShowVideo(false)}
              />
            ) : (
              <ChatWindow
                consultationId={selectedConsultation}
                otherPartyName="Farmer"
                onBack={() => setSelectedConsultation(null)}
                onStartVideo={() => setShowVideo(true)}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="p-6 rounded-full bg-muted mb-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground max-w-sm">
                Choose a consultation from the list to start or continue the conversation
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
