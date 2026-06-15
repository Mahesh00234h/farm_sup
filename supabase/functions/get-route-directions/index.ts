import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-language, x-language-name',
};

interface RouteRequest {
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  profile?: 'driving-car' | 'cycling-regular' | 'foot-walking';
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
  type: number;
  name: string;
  way_points: number[];
}

interface RouteResponse {
  success: boolean;
  route?: {
    geometry: [number, number][];
    distance: number;
    duration: number;
    steps: RouteStep[];
  };
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENROUTESERVICE_API_KEY');
    if (!apiKey) {
      throw new Error('OpenRouteService API key not configured');
    }

    const { start, end, profile = 'driving-car' }: RouteRequest = await req.json();

    if (!start || !end || !start.lat || !start.lng || !end.lat || !end.lng) {
      throw new Error('Invalid coordinates provided');
    }

    // OpenRouteService uses [lng, lat] format
    const coordinates = [
      [start.lng, start.lat],
      [end.lng, end.lat]
    ];

    const response = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates,
          instructions: true,
          instructions_format: 'text',
          language: 'en',
          units: 'km',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouteService error:', errorText);
      throw new Error(`Routing API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      throw new Error('No route found');
    }

    const feature = data.features[0];
    const properties = feature.properties;
    const segments = properties.segments[0];

    // Convert GeoJSON coordinates to [lat, lng] for Leaflet
    const geometry: [number, number][] = feature.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    // Extract turn-by-turn steps
    const steps: RouteStep[] = segments.steps.map((step: any) => ({
      instruction: step.instruction,
      distance: step.distance,
      duration: step.duration,
      type: step.type,
      name: step.name || '',
      way_points: step.way_points,
    }));

    const routeResponse: RouteResponse = {
      success: true,
      route: {
        geometry,
        distance: properties.summary.distance,
        duration: properties.summary.duration,
        steps,
      },
    };

    return new Response(JSON.stringify(routeResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Route directions error:', error);
    
    const errorResponse: RouteResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
