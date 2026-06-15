import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';
import { toast } from 'sonner';

interface MarketInsights {
  currentMarketPrice: {
    minPrice: number;
    maxPrice: number;
    averagePrice: number;
    unit: string;
  };
  priceAnalysis: {
    trend: 'rising' | 'falling' | 'stable';
    percentChange: number;
    period: string;
  };
  bestTimeToSell: {
    recommendation: 'now' | 'wait' | 'partial';
    reason: string;
    optimalMonth: string;
  };
  nearbyMandis: Array<{
    name: string;
    distance: string;
    currentPrice: number;
    demand: 'high' | 'medium' | 'low';
  }>;
  priceForcast: {
    nextWeek: { min: number; max: number };
    nextMonth: { min: number; max: number };
  };
  sellingTips: string[];
  demandFactors: string[];
  storageAdvice: string;
  governmentMSP: number | null;
}

export function useMarketInsights() {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getMarketInsights = async (
    cropType: string,
    location: { lat: number; lng: number; state?: string },
    currentPrice?: number,
    quantity?: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('market-insights', { body: { cropType, location, currentPrice, quantity, language: getCurrentLangName() }, headers: langHeaders() });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setInsights(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get market insights';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearInsights = () => {
    setInsights(null);
    setError(null);
  };

  return {
    isLoading,
    insights,
    error,
    getMarketInsights,
    clearInsights,
  };
}
