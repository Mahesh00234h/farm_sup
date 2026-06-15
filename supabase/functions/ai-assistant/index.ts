import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-language, x-language-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface AssistantRequest {
  message: string;
  context: {
    userRole: string;
    currentPage?: string;
    language?: string;
  };
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // __LANG_INJECTED__
    const __lang = req.headers.get('x-language-name') || req.headers.get('x-language') || 'English';
    const __langInstruction = `\n\nLANGUAGE RULE (highest priority): Detect the language of the user's most recent message and respond ENTIRELY in that same language (script + vocabulary). If the user mixes languages, mirror their dominant language. If the user's language is unclear, default to ${__lang}. All text values, descriptions, names, advice, and JSON string fields MUST be written in ${__lang}. Keep JSON keys and enum values (like 'high','low','open','closed') in English. Numbers, units (₹, kg, °C), and proper nouns can stay as-is.`;

    // Require an authenticated user — validate the JWT against Supabase auth.
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.91.1");
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { persistSession: false } }
    );
    const { data: userData, error: userErr } = await sb.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, context, conversationHistory } = await req.json() as AssistantRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const roleSpecificContext = {
      farmer: "farming practices, crop management, disease detection, government schemes, weather advisories, and selling products",
      consumer: "finding fresh produce, ordering products, tracking deliveries, and getting the best deals",
      veterinary: "managing consultations, diagnosing plant/animal diseases, and providing treatment advice",
      retailer: "inventory management, bulk ordering, pricing strategies, and supplier partnerships",
      delivery: "order pickups, delivery routes, proof of delivery, and earnings tracking",
      admin: "platform management, user verification, analytics, and system administration",
    };

    const systemPrompt = `You are Farmaline AI, a helpful assistant for Farmaline - an agricultural ecosystem platform. You help ${context.userRole}s with ${roleSpecificContext[context.userRole as keyof typeof roleSpecificContext] || "using the platform"}.

Key capabilities:
- Answer questions about the platform features
- Provide agricultural advice and tips
- Help with troubleshooting common issues
- Guide users through platform features
- Explain government schemes and subsidies
- Provide market insights when asked

Guidelines:
- Use simple language suitable for rural users
- Mix Hindi and English (Hinglish) when appropriate
- Be helpful, patient, and encouraging
- For complex issues, suggest contacting support
- Never provide medical/veterinary advice for emergencies - always recommend consulting a professional

Current context:
- User role: ${context.userRole}
- Current page: ${context.currentPage || 'Unknown'}
- Preferred language: ${context.language || 'English/Hindi'}` + __langInstruction;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).slice(-10), // Keep last 10 messages for context
      { role: "user", content: message },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        stream: true,
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
      throw new Error("Failed to get response");
    }

    // Stream the response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
