import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-language, x-language-name",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ConsultationAIRequest {
  diseaseHistory?: Array<{
    diseaseName: string;
    severity: string;
    confidence: number;
    plantType: string;
    date: string;
  }>;
  consultationType: string;
  farmerNotes?: string;
  animalType?: string;
  symptoms?: string[];
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

    const { diseaseHistory, consultationType, farmerNotes, animalType, symptoms } = await req.json() as ConsultationAIRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a veterinary AI assistant helping veterinarians prepare for consultations. Analyze patient history, disease patterns, and symptoms to provide a comprehensive pre-consultation summary. Be thorough but concise.` + __langInstruction;

    const userPrompt = `Prepare a pre-consultation summary:

Consultation Type: ${consultationType}
${animalType ? `Animal/Plant Type: ${animalType}` : ''}
${farmerNotes ? `Farmer's Notes: ${farmerNotes}` : ''}
${symptoms?.length ? `Reported Symptoms: ${symptoms.join(', ')}` : ''}

${diseaseHistory?.length ? `
Disease Detection History:
${diseaseHistory.map(d => `- ${d.date}: ${d.diseaseName} on ${d.plantType} (${d.severity} severity, ${d.confidence}% confidence)`).join('\n')}
` : 'No previous disease history available'}

Provide a consultation preparation summary as JSON:
{
  "patientSummary": "Brief overview of the case",
  "riskAssessment": {
    "level": "low/medium/high",
    "factors": ["Risk factor 1", "Risk factor 2"]
  },
  "possibleConditions": [
    {
      "condition": "Condition name",
      "likelihood": "high/medium/low",
      "indicators": ["Why this is suspected"]
    }
  ],
  "suggestedQuestions": [
    "Question to ask the farmer 1",
    "Question to ask the farmer 2"
  ],
  "recommendedExaminations": [
    "Examination or test 1",
    "Examination or test 2"
  ],
  "preliminaryGuidance": [
    "Initial guidance point 1",
    "Initial guidance point 2"
  ],
  "relatedCases": "Any patterns or related issues to be aware of",
  "urgencyLevel": "routine/priority/urgent/emergency",
  "preparationNotes": "What the vet should prepare before consultation"
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
      throw new Error("Failed to prepare consultation summary");
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
    console.error("Vet consultation AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
