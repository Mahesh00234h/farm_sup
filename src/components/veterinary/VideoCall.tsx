import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MessageSquare,
  Maximize2,
  Minimize2,
  Camera,
  ScreenShare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  consultationId: string;
  otherPartyName: string;
  onEnd: () => void;
  onOpenChat?: () => void;
}

export default function VideoCall({ 
  consultationId, 
  otherPartyName, 
  onEnd,
  onOpenChat 
}: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // In production, integrate with WebRTC (e.g., Daily.co, Twilio, Agora)
  // This is a UI mockup for the video call interface

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "bg-gray-900 flex flex-col",
        isFullscreen ? "fixed inset-0 z-50" : "rounded-2xl overflow-hidden h-[600px]"
      )}
    >
      {/* Main Video Area */}
      <div className="flex-1 relative bg-gray-800">
        {/* Remote Video (Full screen) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isVideoOff ? (
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-400">
                {otherPartyName.charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
              <div className="text-center">
                <Video className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Waiting for {otherPartyName} to connect...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-picture) */}
        <motion.div
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          className="absolute bottom-4 right-4 w-40 h-28 bg-gray-700 rounded-xl overflow-hidden shadow-lg cursor-move"
        >
          {isVideoOff ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <VideoOff className="h-8 w-8 text-gray-500" />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <Camera className="h-8 w-8 text-primary/50" />
            </div>
          )}
        </motion.div>

        {/* Call Info Overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white font-medium">{otherPartyName}</p>
          </div>
          <div className="bg-black/50 backdrop-blur-sm rounded-full px-4 py-2">
            <p className="text-white text-sm">{formatDuration(callDuration)}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setIsMuted(!isMuted)}
            className={cn(
              "rounded-full w-14 h-14",
              isMuted ? "bg-red-500/20 hover:bg-red-500/30" : "bg-gray-700 hover:bg-gray-600"
            )}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-red-500" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </Button>

          {/* Video Toggle */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={cn(
              "rounded-full w-14 h-14",
              isVideoOff ? "bg-red-500/20 hover:bg-red-500/30" : "bg-gray-700 hover:bg-gray-600"
            )}
          >
            {isVideoOff ? (
              <VideoOff className="h-6 w-6 text-red-500" />
            ) : (
              <Video className="h-6 w-6 text-white" />
            )}
          </Button>

          {/* Screen Share */}
          <Button
            variant="ghost"
            size="lg"
            className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600"
          >
            <ScreenShare className="h-6 w-6 text-white" />
          </Button>

          {/* Chat */}
          <Button
            variant="ghost"
            size="lg"
            onClick={onOpenChat}
            className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-full w-14 h-14 bg-gray-700 hover:bg-gray-600"
          >
            {isFullscreen ? (
              <Minimize2 className="h-6 w-6 text-white" />
            ) : (
              <Maximize2 className="h-6 w-6 text-white" />
            )}
          </Button>

          {/* End Call */}
          <Button
            variant="ghost"
            size="lg"
            onClick={onEnd}
            className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </Button>
        </div>

        {/* Status indicators */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
          {isMuted && <span className="flex items-center gap-1"><MicOff className="h-3 w-3" /> Muted</span>}
          {isVideoOff && <span className="flex items-center gap-1"><VideoOff className="h-3 w-3" /> Video off</span>}
        </div>
      </div>
    </motion.div>
  );
}
