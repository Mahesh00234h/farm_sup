import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-language, x-language-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InventoryAIRequest {
  inventory: Array<{
    name: string;
    category: string;
    currentStock: number;
    minStock: number;
    maxStock: number;
    costPrice: number;
    sellingPrice: number;
    trend: string;
  }>;
  salesHistory?: Array<{
    productName: string;
    quantity: number;
    date: string;
  }>;
  season?: string;
  location?: string;
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

    const { inventory, salesHistory, season, location } = await req.json() as InventoryAIRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an AI inventory management assistant for agricultural retailers. Analyze inventory levels, sales patterns, and market trends to provide actionable recommendations for optimal stock management.` + __langInstruction;

    const userPrompt = `Analyze this inventory and provide recommendations:

Current Inventory:
${inventory.map(item => `- ${item.name} (${item.category}): Stock ${item.currentStock}/${item.maxStock}, Min: ${item.minStock}, Trend: ${item.trend}, Margin: ₹${item.sellingPrice - item.costPrice}`).join('\n')}

${salesHistory ? `
Recent Sales:
${salesHistory.slice(0, 20).map(s => `- ${s.productName}: ${s.quantity} units on ${s.date}`).join('\n')}
` : ''}

Season: ${season || 'Not specified'}
Location: ${location || 'India'}

Provide analysis as JSON:
{
  "urgentRestock": [
    {
      "product": "Product name",
      "currentStock": number,
      "recommendedOrder": number,
      "urgency": "critical/high/medium",
      "reason": "Why restock is needed"
    }
  ],
  "overstockAlert": [
    {
      "product": "Product name",
      "excessQuantity": number,
      "recommendation": "What to do with excess"
    }
  ],
  "demandForecast": [
    {
      "product": "Product name",
      "expectedDemand": "high/medium/low",
      "reason": "Why this demand is expected"
    }
  ],
  "pricingRecommendations": [
    {
      "product": "Product name",
      "currentPrice": number,
      "suggestedPrice": number,
      "reason": "Why change price"
    }
  ],
  "seasonalAdvice": "Advice based on upcoming season",
  "profitOptimization": [
    "Tip 1 to improve profits",
    "Tip 2 to improve profits"
  ],
  "supplierSuggestions": [
    {
      "category": "Category name",
      "action": "What to negotiate or change"
    }
  ],
  "overallHealthScore": number,
  "summary": "Brief overall inventory health summary"
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
      throw new Error("Failed to analyze inventory");
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
    console.error("Inventory AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
