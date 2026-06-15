import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';
import { toast } from 'sonner';

interface QualityAnalysis {
  qualityScore: number;
  grade: string;
  freshness: {
    level: string;
    estimatedShelfLife: string;
  };
  appearance: {
    color: string;
    uniformity: string;
    cleanliness: string;
  };
  defects: Array<{
    type: string;
    severity: string;
    percentage: string;
  }>;
  strengths: string[];
  improvements: string[];
  marketability: {
    score: number;
    targetMarket: string;
    pricingAdvice: string;
  };
  verificationBadge: {
    eligible: boolean;
    reason: string;
  };
  summary: string;
}

export function useQualityAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<QualityAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeQuality = async (
    imageBase64: string,
    productType: string,
    productName?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('quality-analysis', { body: { imageBase64, productType, productName, language: getCurrentLangName() }, headers: langHeaders() });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setAnalysis(data);
      
      if (data.verificationBadge?.eligible) {
        toast.success('Quality verified! Eligible for verification badge.');
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze quality';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearAnalysis = () => {
    setAnalysis(null);
    setError(null);
  };

  return {
    isLoading,
    analysis,
    error,
    analyzeQuality,
    clearAnalysis,
  };
}
