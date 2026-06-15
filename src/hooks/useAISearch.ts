import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';
import { toast } from 'sonner';

interface SearchResult {
  matchedProductIds: string[];
  searchIntent: string;
  suggestions: string[];
  relatedCategories: string[];
}

export function useAISearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  const aiSearch = async (
    query: string,
    products: Array<{
      id: string;
      name: string;
      description: string | null;
      category: string;
      price: number;
      quality_score: number | null;
    }>,
    userPreferences?: {
      preferredCategories?: string[];
      maxPrice?: number;
    }
  ) => {
    if (!query.trim()) return null;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-search', { body: { query, products, userPreferences, language: getCurrentLangName() }, headers: langHeaders() });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSearchResult(data);
      return data;
    } catch (err) {
      console.error('AI search error:', err);
      // Fallback to regular search on error
      return null;
    } finally {
      setIsSearching(false);
    }
  };

  return { isSearching, searchResult, aiSearch };
}
