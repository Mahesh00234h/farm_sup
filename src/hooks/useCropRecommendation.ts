import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';
import { toast } from 'sonner';

interface CropRecommendation {
  crop: string;
  confidence: number;
  expectedYield: string;
  waterRequirement: string;
  riskScore: string;
  reasonsToGrow: string[];
  bestPractices: string[];
  estimatedCost: string;
  marketPrice: string;
}

interface RecommendationResponse {
  recommendations: CropRecommendation[];
  generalAdvice: string;
  weatherWarning?: string;
}

interface CropRecommendationParams {
  farmLocation: { lat: number; lng: number };
  areaAcres: number;
  season: string;
  weatherData: {
    temperature: number;
    humidity: number;
    rainfall: number;
    condition: string;
  };
  soilType?: string;
}

export function useCropRecommendation() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = async (params: CropRecommendationParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('crop-recommendation', {
        body: params,
      });

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setRecommendations(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearRecommendations = () => {
    setRecommendations(null);
    setError(null);
  };

  return {
    isLoading,
    recommendations,
    error,
    getRecommendations,
    clearRecommendations,
  };
}
