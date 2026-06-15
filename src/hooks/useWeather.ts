import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { langHeaders, getCurrentLangName } from '@/lib/language';

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainfall: number;
  condition: string;
  description: string;
  location: string;
  pressure: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  forecast: {
    day: string;
    temp: number;
    condition: string;
  }[];
}

interface UseWeatherResult {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  fetchWeather: (lat: number, lng: number) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useWeather(): UseWeatherResult {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchWeather = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    setLastCoords({ lat, lng });

    try {
      const { data, error: fnError } = await supabase.functions.invoke('weather', { body: { lat, lng, language: getCurrentLangName() }, headers: langHeaders() });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to fetch weather data');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setWeather(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(message);
      console.error('Weather fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    if (lastCoords) {
      await fetchWeather(lastCoords.lat, lastCoords.lng);
    }
  }, [lastCoords, fetchWeather]);

  return {
    weather,
    isLoading,
    error,
    fetchWeather,
    refetch,
  };
}
