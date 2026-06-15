import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  type: number;
  name: string;
  way_points: number[];
}

export interface RouteData {
  geometry: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

interface UseRouteDirectionsReturn {
  route: RouteData | null;
  isLoading: boolean;
  error: string | null;
  fetchRoute: (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    profile?: 'driving-car' | 'cycling-regular' | 'foot-walking'
  ) => Promise<void>;
  clearRoute: () => void;
}

// Map OpenRouteService instruction types to icons
export const getInstructionIcon = (type: number): string => {
  const iconMap: Record<number, string> = {
    0: '🚗', // Leave waypoint
    1: '➡️', // Turn right
    2: '⬅️', // Turn left
    3: '↗️', // Turn sharp right
    4: '↖️', // Turn sharp left
    5: '↗️', // Turn slight right
    6: '↖️', // Turn slight left
    7: '⬆️', // Continue straight
    8: '🔄', // Enter roundabout
    9: '🔄', // Exit roundabout
    10: '↩️', // U-turn
    11: '🏁', // Finish
    12: '📍', // Depart
    13: '⬅️', // Keep left
    14: '➡️', // Keep right
  };
  return iconMap[type] || '📍';
};

// Format distance for display
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

// Format duration for display
export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)} sec`;
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

export function useRouteDirections(): UseRouteDirectionsReturn {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(async (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    profile: 'driving-car' | 'cycling-regular' | 'foot-walking' = 'driving-car'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-route-directions', {
        body: { start, end, profile },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get route');
      }

      setRoute(data.route);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch route';
      setError(errorMessage);
      console.error('Route fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearRoute = useCallback(() => {
    setRoute(null);
    setError(null);
  }, []);

  return {
    route,
    isLoading,
    error,
    fetchRoute,
    clearRoute,
  };
}
