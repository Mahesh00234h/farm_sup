import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-language, x-language-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface RecommendationRequest {
  userId: string;
  viewedProducts?: string[];
  purchaseHistory?: Array<{
    productId: string;
    category: string;
    quantity: number;
  }>;
  availableProducts: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    quality_score: number | null;
    farmer_id: string;
  }>;
  userLocation?: { lat: number; lng: number };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // __LANG_INJECTED__
    const __lang = req.headers.get('x-language-name') || req.headers.get('x-language') || 'English';
    const __langInstruction = `\n\nIMPORTANT: Respond entirely in ${__lang}. All text values, descriptions, names, advice, and JSON string fields MUST be written in ${__lang}. Keep JSON keys and enum values (like 'high','low','open','closed') in English. Numbers, units (₹, kg, °C), and proper nouns can stay as-is.`;
    const { viewedProducts, purchaseHistory, availableProducts, userLocation } = await req.json() as RecommendationRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a personalized recommendation engine for an agricultural marketplace. Analyze user behavior and recommend products that match their preferences. Prioritize quality, freshness (newer products), and value for money.` + __langInstruction;

    const userPrompt = `Based on the user's activity, recommend the best products:

Recently viewed products: ${viewedProducts?.join(', ') || 'None'}

Purchase history:
${purchaseHistory?.map(p => `- Category: ${p.category}, Quantity: ${p.quantity}`).join('\n') || 'No purchase history'}

Available products:
${availableProducts.slice(0, 30).map(p => `- ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Price: ₹${p.price}, Quality: ${p.quality_score || 'N/A'}`).join('\n')}

${userLocation ? `User location: ${userLocation.lat}, ${userLocation.lng}` : ''}

Return recommendations as JSON:
{
  "recommendations": [
    {
      "productId": "product_id",
      "reason": "Why this is recommended",
      "matchScore": 85
    }
  ],
  "personalizedCategories": ["category1", "category2"],
  "seasonalPicks": ["product_id1", "product_id2"],
  "budgetFriendly": ["product_id1", "product_id2"],
  "premiumPicks": ["product_id1", "product_id2"]
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
      throw new Error("Failed to get recommendations");
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
    console.error("Recommendation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
