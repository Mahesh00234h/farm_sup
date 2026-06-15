import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';
import { toast } from 'sonner';
import { useOfflineDiseaseDetection, OfflineAnalysis } from './useOfflineDiseaseDetection';

interface DiseaseAnalysis {
  plantIdentified: string;
  isHealthy: boolean;
  disease: {
    name: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    description: string;
  };
  symptoms: string[];
  cure: string[];
  prevention: string[];
  organicRemedies: string[];
  chemicalTreatment: {
    product: string;
    dosage: string;
    frequency: string;
  };
  recommendedMedicines?: Array<{
    name: string;
    activeIngredient: string;
    type: string;
    dosage: string;
    applicationMethod: string;
    frequency: string;
    estimatedPriceINR: string;
    safety: {
      preHarvestInterval: string;
      protectiveGear: string;
      warnings: string;
    };
    organicAlternative?: {
      name: string;
      dosage: string;
      notes: string;
    };
  }>;
  searchKeywords?: string[];
  escalateToVet: boolean;
  escalationReason?: string;
  additionalNotes?: string;
}

export function useDiseaseDetection() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DiseaseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineResult, setIsOfflineResult] = useState(false);
  const offline = useOfflineDiseaseDetection();

  const analyzeImage = async (imageBase64: string, plantType?: string) => {
    setIsLoading(true);
    setError(null);
    setIsOfflineResult(false);

    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

    if (!online) {
      try {
        toast.info('Offline mode — using on-device AI', {
          description: 'Will re-analyze with full AI when you reconnect.',
        });
        const result = await offline.analyze(imageBase64);
        setAnalysis(result as unknown as DiseaseAnalysis);
        setIsOfflineResult(true);
        // Queue image for re-analysis when back online
        try {
          const queue = JSON.parse(localStorage.getItem('disease_reanalyze_queue') || '[]');
          queue.push({ imageBase64, plantType, queuedAt: Date.now() });
          localStorage.setItem('disease_reanalyze_queue', JSON.stringify(queue.slice(-5)));
        } catch { /* ignore */ }
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Offline analysis failed';
        setError(msg);
        toast.error(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('disease-detection', { body: { imageBase64, plantType, language: getCurrentLangName() }, headers: langHeaders() });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      
      // Show warning if escalation is recommended
      if (data.escalateToVet) {
        toast.warning('Expert consultation recommended', {
          description: data.escalationReason || 'Low confidence score. Please consult an expert.',
        });
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze image';
      // Online call failed — try offline fallback
      try {
        toast.warning('Network failed — using on-device AI');
        const result = await offline.analyze(imageBase64);
        setAnalysis(result as unknown as DiseaseAnalysis);
        setIsOfflineResult(true);
        return result;
      } catch {
        setError(message);
        toast.error(message);
        return null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setError(null);
    setIsOfflineResult(false);
  };

  return {
    isLoading,
    analysis,
    error,
    analyzeImage,
    clearAnalysis,
    isOfflineResult,
    offlineModelReady: offline.isReady,
    preloadOfflineModel: offline.preload,
  };
}
