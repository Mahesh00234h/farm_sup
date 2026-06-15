import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';

interface ConsultationSummary {
  patientSummary: string;
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  possibleConditions: Array<{
    condition: string;
    likelihood: 'high' | 'medium' | 'low';
    indicators: string[];
  }>;
  suggestedQuestions: string[];
  recommendedExaminations: string[];
  preliminaryGuidance: string[];
  relatedCases: string;
  urgencyLevel: 'routine' | 'priority' | 'urgent' | 'emergency';
  preparationNotes: string;
}

export function useVetConsultationAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<ConsultationSummary | null>(null);

  const prepareConsultation = async (
    consultationType: string,
    diseaseHistory?: Array<{
      diseaseName: string;
      severity: string;
      confidence: number;
      plantType: string;
      date: string;
    }>,
    farmerNotes?: string,
    animalType?: string,
    symptoms?: string[]
  ) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('vet-consultation-ai', { body: {
          consultationType,
          diseaseHistory,
          farmerNotes,
          animalType,
          symptoms, language: getCurrentLangName() }, headers: langHeaders() });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setSummary(data);
      return data;
    } catch (err) {
      console.error('Vet AI error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    summary,
    prepareConsultation,
  };
}
