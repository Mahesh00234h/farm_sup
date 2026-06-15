import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';
import { toast } from 'sonner';

interface Recommendation {
  productId: string;
  reason: string;
  matchScore: number;
}

interface RecommendationResult {
  recommendations: Recommendation[];
  personalizedCategories: string[];
  seasonalPicks: string[];
  budgetFriendly: string[];
  premiumPicks: string[];
}

export function useProductRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);

  const getRecommendations = async (
    products: Array<{
      id: string;
      name: string;
      category: string;
      price: number;
      quality_score: number | null;
      farmer_id: string;
    }>,
    viewedProducts?: string[],
    purchaseHistory?: Array<{
      productId: string;
      category: string;
      quantity: number;
    }>
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('product-recommendations', { body: {
          availableProducts: products,
          viewedProducts,
          purchaseHistory, language: getCurrentLangName() }, headers: langHeaders() });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setRecommendations(data);
      return data;
    } catch (err) {
      console.error('Recommendations error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, recommendations, getRecommendations };
}
