import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-language, x-language-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SearchRequest {
  query: string;
  products: Array<{
    id: string;
    name: string;
    description: string | null;
    category: string;
    price: number;
    quality_score: number | null;
  }>;
  userPreferences?: {
    preferredCategories?: string[];
    maxPrice?: number;
    location?: { lat: number; lng: number };
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // __LANG_INJECTED__
    const __lang = req.headers.get('x-language-name') || req.headers.get('x-language') || 'English';
    const __langInstruction = `\n\nIMPORTANT: Respond entirely in ${__lang}. All text values, descriptions, names, advice, and JSON string fields MUST be written in ${__lang}. Keep JSON keys and enum values (like 'high','low','open','closed') in English. Numbers, units (₹, kg, °C), and proper nouns can stay as-is.`;
    const { query, products, userPreferences } = await req.json() as SearchRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an intelligent search assistant for an agricultural marketplace. Your job is to understand natural language queries and find the most relevant products. Consider context, synonyms, and user intent. You can understand queries in Hindi, Hinglish, and English.` + __langInstruction;

    const userPrompt = `User searched for: "${query}"

Available products:
${products.map(p => `- ID: ${p.id}, Name: ${p.name}, Category: ${p.category}, Price: ₹${p.price}, Quality: ${p.quality_score || 'N/A'}, Description: ${p.description || 'No description'}`).join('\n')}

${userPreferences ? `
User preferences:
- Preferred categories: ${userPreferences.preferredCategories?.join(', ') || 'None'}
- Max price: ${userPreferences.maxPrice ? `₹${userPreferences.maxPrice}` : 'No limit'}
` : ''}

Return the most relevant product IDs in order of relevance as JSON:
{
  "matchedProductIds": ["id1", "id2", ...],
  "searchIntent": "Brief explanation of what user is looking for",
  "suggestions": ["Alternative search suggestion 1", "Alternative search suggestion 2"],
  "relatedCategories": ["category1", "category2"]
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
      throw new Error("Failed to process search");
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
    console.error("AI search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
