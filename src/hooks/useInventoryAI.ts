import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';
import { toast } from 'sonner';

interface InventoryAnalysis {
  urgentRestock: Array<{
    product: string;
    currentStock: number;
    recommendedOrder: number;
    urgency: 'critical' | 'high' | 'medium';
    reason: string;
  }>;
  overstockAlert: Array<{
    product: string;
    excessQuantity: number;
    recommendation: string;
  }>;
  demandForecast: Array<{
    product: string;
    expectedDemand: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  pricingRecommendations: Array<{
    product: string;
    currentPrice: number;
    suggestedPrice: number;
    reason: string;
  }>;
  seasonalAdvice: string;
  profitOptimization: string[];
  supplierSuggestions: Array<{
    category: string;
    action: string;
  }>;
  overallHealthScore: number;
  summary: string;
}

export function useInventoryAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<InventoryAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeInventory = async (
    inventory: Array<{
      name: string;
      category: string;
      currentStock: number;
      minStock: number;
      maxStock: number;
      costPrice: number;
      sellingPrice: number;
      trend: string;
    }>,
    salesHistory?: Array<{
      productName: string;
      quantity: number;
      date: string;
    }>,
    season?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('inventory-ai', { body: { inventory, salesHistory, season, language: getCurrentLangName() }, headers: langHeaders() });

      if (fnError) throw fnError;
      if (data.error) throw new Error(data.error);

      setAnalysis(data);
      toast.success('Inventory analysis complete');
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze inventory';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    analysis,
    error,
    analyzeInventory,
  };
}
