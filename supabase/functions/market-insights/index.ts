import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-language, x-language-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface MarketInsightRequest {
  cropType: string;
  location: { lat: number; lng: number; state?: string };
  currentPrice?: number;
  quantity?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // __LANG_INJECTED__
    const __lang = req.headers.get('x-language-name') || req.headers.get('x-language') || 'English';
    const __langInstruction = `\n\nIMPORTANT: Respond entirely in ${__lang}. All text values, descriptions, names, advice, and JSON string fields MUST be written in ${__lang}. Keep JSON keys and enum values (like 'high','low','open','closed') in English. Numbers, units (₹, kg, °C), and proper nouns can stay as-is.`;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { cropType, location, currentPrice, quantity } = await req.json() as MarketInsightRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert agricultural market analyst for Indian farmers. Provide practical, actionable market insights in simple language (Hinglish when appropriate). Focus on helping farmers maximize their profits through smart selling strategies.` + __langInstruction;

    const userPrompt = `Provide market insights for the following:

Crop: ${cropType}
Location: ${location.state || 'India'} (Lat: ${location.lat}, Lng: ${location.lng})
${currentPrice ? `Current selling price: ₹${currentPrice}/quintal` : ''}
${quantity ? `Available quantity: ${quantity} quintals` : ''}

Provide insights in JSON format:
{
  "currentMarketPrice": {
    "minPrice": number,
    "maxPrice": number,
    "averagePrice": number,
    "unit": "per quintal"
  },
  "priceAnalysis": {
    "trend": "rising/falling/stable",
    "percentChange": number,
    "period": "last 30 days"
  },
  "bestTimeToSell": {
    "recommendation": "now/wait/partial",
    "reason": "Explanation",
    "optimalMonth": "Month name"
  },
  "nearbyMandis": [
    {
      "name": "Mandi name",
      "distance": "approximate distance",
      "currentPrice": number,
      "demand": "high/medium/low"
    }
  ],
  "priceForcast": {
    "nextWeek": { "min": number, "max": number },
    "nextMonth": { "min": number, "max": number }
  },
  "sellingTips": [
    "Tip 1",
    "Tip 2"
  ],
  "demandFactors": [
    "Factor affecting demand 1",
    "Factor affecting demand 2"
  ],
  "storageAdvice": "Advice on storage if waiting to sell",
  "governmentMSP": number or null
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to get market insights");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from AI");
    }

    const result = JSON.parse(content);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Market insights error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
