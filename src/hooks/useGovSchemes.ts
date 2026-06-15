import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';
import { toast } from 'sonner';

export interface GovScheme {
  id: string;
  name: string;
  ministry: string;
  benefit: string;
  deadline: string;
  eligibility: string[];
  status: 'open' | 'closing-soon' | 'closed';
  category: string;
  applicationUrl?: string;
  description?: string;
}

interface UseGovSchemesOptions {
  query?: string;
  state?: string;
  category?: string;
}

export function useGovSchemes() {
  const [schemes, setSchemes] = useState<GovScheme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemes = useCallback(async (options: UseGovSchemesOptions = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('gov-schemes', { body: {
          query: options.query || '',
          state: options.state || '',
          category: options.category || '',
          language: getCurrentLangName(),
        },
        headers: langHeaders(),
      });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const fetchedSchemes = data.schemes || [];
      setSchemes(fetchedSchemes);
      return fetchedSchemes;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schemes';
      setError(message);
      toast.error(message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchSchemes = useCallback(async (query: string) => {
    return fetchSchemes({ query });
  }, [fetchSchemes]);

  return {
    schemes,
    isLoading,
    error,
    fetchSchemes,
    searchSchemes,
  };
}
