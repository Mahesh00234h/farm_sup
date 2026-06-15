import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-language, x-language-name',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface WeatherRequest {
  lat: number;
  lng: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('OPENWEATHERMAP_API_KEY');
    
    if (!apiKey) {
      console.error('OPENWEATHERMAP_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Weather API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { lat, lng } = body as WeatherRequest;
    // Map our app language codes to OpenWeatherMap's supported `lang` codes
    const reqLang = (req.headers.get('x-language') || body.language || 'en').toString().toLowerCase().slice(0, 2);
    const owmLang = ['en','hi','mr','te'].includes(reqLang) ? reqLang : 'en';
    
    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current weather
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=${owmLang}&appid=${apiKey}`;
    const currentResponse = await fetch(currentWeatherUrl);
    
    if (!currentResponse.ok) {
      const errorText = await currentResponse.text();
      console.error('OpenWeatherMap current weather error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch current weather' }),
        { status: currentResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const currentData = await currentResponse.json();

    // Fetch 5-day forecast
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&units=metric&lang=${owmLang}&appid=${apiKey}`;
    const forecastResponse = await fetch(forecastUrl);
    
    if (!forecastResponse.ok) {
      const errorText = await forecastResponse.text();
      console.error('OpenWeatherMap forecast error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch forecast' }),
        { status: forecastResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const forecastData = await forecastResponse.json();

    // Map weather condition to simple category
    const mapCondition = (weatherId: number): string => {
      if (weatherId >= 200 && weatherId < 300) return 'Thunderstorm';
      if (weatherId >= 300 && weatherId < 400) return 'Drizzle';
      if (weatherId >= 500 && weatherId < 600) return 'Rain';
      if (weatherId >= 600 && weatherId < 700) return 'Snow';
      if (weatherId >= 700 && weatherId < 800) return 'Fog';
      if (weatherId === 800) return 'Sunny';
      if (weatherId > 800 && weatherId < 804) return 'Partly Cloudy';
      return 'Cloudy';
    };

    // Get day name from date
    const getDayName = (timestamp: number): string => {
      const date = new Date(timestamp * 1000);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
      
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    // Process forecast - get daily highs (one entry per day, at noon if possible)
    const dailyForecasts = new Map<string, { temp: number; condition: string; day: string }>();
    
    for (const item of forecastData.list) {
      const dateKey = new Date(item.dt * 1000).toDateString();
      const hour = new Date(item.dt * 1000).getHours();
      
      // Skip today's entries, prefer noon entries for other days
      const today = new Date().toDateString();
      if (dateKey === today) continue;
      
      const existing = dailyForecasts.get(dateKey);
      // Prefer entries around noon (12:00)
      if (!existing || (hour >= 11 && hour <= 14)) {
        dailyForecasts.set(dateKey, {
          day: getDayName(item.dt),
          temp: Math.round(item.main.temp),
          condition: mapCondition(item.weather[0].id),
        });
      }
    }

    // Convert to array and take first 4 days
    const forecast = Array.from(dailyForecasts.values()).slice(0, 4);

    // Calculate approximate monthly rainfall (from forecast rain data)
    // OpenWeatherMap provides rain.3h in mm for 3 hours
    let totalRainfall = 0;
    for (const item of forecastData.list) {
      if (item.rain?.['3h']) {
        totalRainfall += item.rain['3h'];
      }
    }
    // Approximate monthly from 5-day data
    const monthlyRainfall = Math.round((totalRainfall / 5) * 30);

    // Build response
    const weatherData = {
      temperature: Math.round(currentData.main.temp),
      feelsLike: Math.round(currentData.main.feels_like),
      humidity: currentData.main.humidity,
      windSpeed: Math.round(currentData.wind.speed * 3.6), // m/s to km/h
      rainfall: monthlyRainfall,
      condition: mapCondition(currentData.weather[0].id),
      description: currentData.weather[0].description,
      location: currentData.name ? `${currentData.name}, ${currentData.sys.country}` : 'Unknown Location',
      pressure: currentData.main.pressure,
      visibility: Math.round((currentData.visibility || 10000) / 1000), // m to km
      sunrise: currentData.sys.sunrise,
      sunset: currentData.sys.sunset,
      forecast,
    };

    return new Response(
      JSON.stringify(weatherData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Weather function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
