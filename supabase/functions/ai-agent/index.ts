import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-language, x-language-name, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const tools = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Get current weather for a location. Use when user asks about weather, rain, temperature, or farming conditions.",
      parameters: {
        type: "object",
        properties: {
          lat: { type: "number", description: "Latitude" },
          lng: { type: "number", description: "Longitude" },
          location_name: { type: "string", description: "Human-readable location name" },
        },
        required: ["lat", "lng"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_market_prices",
      description: "Get current market prices for agricultural products. Use when user asks about prices, selling, mandis, or market trends.",
      parameters: {
        type: "object",
        properties: {
          crop: { type: "string", description: "Crop or product name (e.g., wheat, tomato, rice)" },
        },
        required: ["crop"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_crop_recommendation",
      description: "Get AI-powered crop recommendations based on weather, soil, and location. Use when user asks what to grow, crop advice, or farming recommendations.",
      parameters: {
        type: "object",
        properties: {
          season: { type: "string", description: "Current growing season (Rabi, Kharif, Zaid)" },
          soil_type: { type: "string", description: "Soil type if known" },
          area_acres: { type: "number", description: "Farm area in acres" },
        },
        required: ["season"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_gov_schemes",
      description: "Search for government agricultural schemes and subsidies. Use when user asks about schemes, subsidies, loans, or government help.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query for schemes" },
          state: { type: "string", description: "Indian state name for state-specific schemes" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_disease_info",
      description: "Get information about plant or animal diseases, symptoms, and treatments. Use when user asks about disease, pest, symptoms, or treatment.",
      parameters: {
        type: "object",
        properties: {
          disease_query: { type: "string", description: "Disease name, symptoms, or description" },
          plant_or_animal: { type: "string", description: "The affected plant or animal type" },
        },
        required: ["disease_query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_farm_stats",
      description: "Get the farmer's farm statistics like area, products listed, and recent activity. Use when user asks about their farm, stats, or dashboard info.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_product",
      description: "List a new product for sale on the marketplace. Use when a farmer wants to sell, list, or add a product.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Product name (e.g., Organic Tomatoes)" },
          category: { type: "string", description: "Category: Vegetables, Fruits, Grains, Dairy, Spices, or Other" },
          price: { type: "number", description: "Price per unit in rupees" },
          quantity: { type: "number", description: "Available quantity" },
          unit: { type: "string", description: "Unit of measurement: kg, quintal, piece, litre, dozen" },
          description: { type: "string", description: "Product description" },
        },
        required: ["name", "category", "price", "quantity", "unit"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_my_orders",
      description: "Check the user's orders - either as a buyer or seller. Use when user asks about their orders, deliveries, or sales status.",
      parameters: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["buyer", "seller", "delivery"], description: "Check orders as buyer, seller, or delivery partner" },
          status_filter: { type: "string", description: "Filter by status: pending, confirmed, processing, shipped, delivered, cancelled" },
        },
        required: ["role"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_vet_consultation",
      description: "Book a veterinary consultation. Use when user wants to consult a vet, get animal/plant health advice from a professional, or book an appointment.",
      parameters: {
        type: "object",
        properties: {
          consultation_type: { type: "string", enum: ["chat", "video"], description: "Type of consultation" },
          notes: { type: "string", description: "Description of the problem or reason for consultation" },
        },
        required: ["consultation_type", "notes"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_order_status",
      description: "Update the status of an order. Use for sellers to confirm/process orders, or delivery partners to update delivery status.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string", description: "The order ID to update" },
          new_status: { type: "string", enum: ["confirmed", "processing", "shipped", "delivered", "cancelled"], description: "New order status" },
        },
        required: ["order_id", "new_status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_products",
      description: "Search for products on the marketplace. Use when user wants to find, buy, or browse products.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query for products" },
          category: { type: "string", description: "Category filter" },
          max_price: { type: "number", description: "Maximum price filter" },
        },
        required: ["query"],
      },
    },
  },
];

// Tool execution functions
async function executeGetWeather(args: any): Promise<string> {
  const apiKey = Deno.env.get("OPENWEATHERMAP_API_KEY");
  if (!apiKey) return JSON.stringify({ error: "Weather service not configured" });
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${args.lat}&lon=${args.lng}&units=metric&appid=${apiKey}`
    );
    const data = await res.json();
    return JSON.stringify({
      location: data.name || args.location_name || "Your location",
      temperature: data.main?.temp,
      feels_like: data.main?.feels_like,
      humidity: data.main?.humidity,
      condition: data.weather?.[0]?.description,
      wind_speed: data.wind?.speed,
      rain: data.rain?.["1h"] || 0,
    });
  } catch {
    return JSON.stringify({ error: "Could not fetch weather data" });
  }
}

async function executeGetMarketPrices(args: any): Promise<string> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: products } = await supabase
    .from("products")
    .select("name, price, unit, category, quantity")
    .eq("is_available", true)
    .ilike("name", `%${args.crop}%`)
    .limit(10);

  if (!products || products.length === 0) {
    const { data: catProducts } = await supabase
      .from("products")
      .select("name, price, unit, category, quantity")
      .eq("is_available", true)
      .ilike("category", `%${args.crop}%`)
      .limit(10);
    if (!catProducts || catProducts.length === 0) {
      return JSON.stringify({ message: `No listings found for "${args.crop}".`, suggestion: "Check back later or list your own products!" });
    }
    const avgPrice = catProducts.reduce((s, p) => s + Number(p.price), 0) / catProducts.length;
    return JSON.stringify({
      crop: args.crop, listings: catProducts.length, avg_price: avgPrice.toFixed(2),
      price_range: { min: Math.min(...catProducts.map(p => Number(p.price))), max: Math.max(...catProducts.map(p => Number(p.price))) },
      products: catProducts.map(p => ({ name: p.name, price: p.price, unit: p.unit, qty: p.quantity })),
    });
  }
  const avgPrice = products.reduce((s, p) => s + Number(p.price), 0) / products.length;
  return JSON.stringify({
    crop: args.crop, listings: products.length, avg_price: avgPrice.toFixed(2),
    price_range: { min: Math.min(...products.map(p => Number(p.price))), max: Math.max(...products.map(p => Number(p.price))) },
    products: products.map(p => ({ name: p.name, price: p.price, unit: p.unit, qty: p.quantity })),
  });
}

async function executeGetCropRecommendation(args: any): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "You are an agricultural expert. Return JSON with top 3 crop recommendations." },
        { role: "user", content: `Recommend crops for: season=${args.season}, soil=${args.soil_type || "unknown"}, area=${args.area_acres || "unknown"} acres. Return JSON: { "crops": [{ "name", "confidence", "yield_per_acre", "water_need", "risk_level", "reason" }] }` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || JSON.stringify({ error: "Could not get recommendations" });
}

async function executeGetGovSchemes(args: any): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "You are an expert on Indian agricultural government schemes. Return JSON with relevant schemes." },
        { role: "user", content: `Find schemes for: "${args.query}"${args.state ? ` in ${args.state}` : ""}. Return JSON: { "schemes": [{ "name", "benefit", "eligibility", "how_to_apply" }] } (max 3 schemes)` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || JSON.stringify({ error: "Could not fetch schemes" });
}

async function executeGetDiseaseInfo(args: any): Promise<string> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")!}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "You are a plant pathology and veterinary expert. Return JSON with disease info." },
        { role: "user", content: `Disease info for: "${args.disease_query}" affecting ${args.plant_or_animal || "crop/plant"}. Return JSON: { "disease_name", "symptoms", "cause", "treatment", "prevention", "severity", "consult_vet": boolean }` },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content || JSON.stringify({ error: "Could not fetch disease info" });
}

async function executeGetFarmStats(userId: string): Promise<string> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const [farms, products, orders, detections] = await Promise.all([
    supabase.from("farms").select("name, area_acres, soil_type").eq("user_id", userId),
    supabase.from("products").select("name, price, quantity, category").eq("farmer_id", userId),
    supabase.from("orders").select("total_price, status").eq("seller_id", userId),
    supabase.from("disease_detections").select("disease_name, severity, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(3),
  ]);
  const totalArea = farms.data?.reduce((s, f) => s + Number(f.area_acres), 0) || 0;
  const revenue = orders.data?.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0) || 0;
  return JSON.stringify({
    farms: farms.data?.length || 0, total_area_acres: totalArea, farm_details: farms.data || [],
    products_listed: products.data?.length || 0, total_revenue: revenue,
    pending_orders: orders.data?.filter(o => o.status === "pending").length || 0,
    recent_detections: detections.data || [],
  });
}

async function executeAddProduct(args: any, userId: string): Promise<string> {
  if (!userId) return JSON.stringify({ error: "You need to be logged in to list a product." });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data, error } = await supabase.from("products").insert({
    farmer_id: userId,
    name: args.name,
    category: args.category,
    price: args.price,
    quantity: args.quantity,
    unit: args.unit || "kg",
    description: args.description || null,
    is_available: true,
  }).select("id, name, price, unit, quantity").single();

  if (error) return JSON.stringify({ error: `Failed to list product: ${error.message}` });
  return JSON.stringify({ success: true, message: `Product "${data.name}" listed successfully!`, product: data });
}

async function executeCheckMyOrders(args: any, userId: string): Promise<string> {
  if (!userId) return JSON.stringify({ error: "You need to be logged in." });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let query;
  if (args.role === "seller") {
    query = supabase.from("orders").select("id, status, total_price, quantity, created_at, delivery_address").eq("seller_id", userId);
  } else if (args.role === "delivery") {
    query = supabase.from("orders").select("id, status, total_price, delivery_address, created_at").eq("delivery_partner_id", userId);
  } else {
    query = supabase.from("orders").select("id, status, total_price, quantity, created_at, delivery_address").eq("buyer_id", userId);
  }

  if (args.status_filter) query = query.eq("status", args.status_filter);
  query = query.order("created_at", { ascending: false }).limit(10);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: `Could not fetch orders: ${error.message}` });
  if (!data || data.length === 0) return JSON.stringify({ message: "No orders found.", role: args.role });

  const summary = {
    total_orders: data.length,
    by_status: data.reduce((acc: Record<string, number>, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {}),
    total_value: data.reduce((s, o) => s + Number(o.total_price), 0),
    orders: data.map(o => ({ id: o.id.slice(0, 8), status: o.status, amount: o.total_price, date: o.created_at, address: o.delivery_address })),
  };
  return JSON.stringify(summary);
}

async function executeBookVetConsultation(args: any, userId: string): Promise<string> {
  if (!userId) return JSON.stringify({ error: "You need to be logged in to book a consultation." });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Find an available verified vet
  const { data: vets } = await supabase.from("vet_profiles")
    .select("user_id, specialization, consultation_fee, rating")
    .eq("is_verified", true).eq("is_available", true)
    .order("rating", { ascending: false }).limit(1);

  if (!vets || vets.length === 0) return JSON.stringify({ error: "No vets available right now. Please try again later." });

  const vet = vets[0];
  const { data, error } = await supabase.from("consultations").insert({
    farmer_id: userId,
    vet_id: vet.user_id,
    consultation_type: args.consultation_type || "chat",
    notes: args.notes,
    status: "pending",
  }).select("id, consultation_type, status").single();

  if (error) return JSON.stringify({ error: `Failed to book consultation: ${error.message}` });
  return JSON.stringify({
    success: true,
    message: `Consultation booked! A vet will respond shortly.`,
    consultation: data,
    vet_info: { specialization: vet.specialization, fee: vet.consultation_fee, rating: vet.rating },
  });
}

async function executeUpdateOrderStatus(args: any, userId: string): Promise<string> {
  if (!userId) return JSON.stringify({ error: "You need to be logged in." });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Verify the user owns this order as seller or delivery partner
  const { data: order } = await supabase.from("orders").select("id, seller_id, delivery_partner_id, status")
    .eq("id", args.order_id).single();

  if (!order) return JSON.stringify({ error: "Order not found." });
  if (order.seller_id !== userId && order.delivery_partner_id !== userId) {
    return JSON.stringify({ error: "You don't have permission to update this order." });
  }

  const { error } = await supabase.from("orders").update({ status: args.new_status }).eq("id", args.order_id);
  if (error) return JSON.stringify({ error: `Failed to update order: ${error.message}` });
  return JSON.stringify({ success: true, message: `Order ${args.order_id.slice(0, 8)} updated to "${args.new_status}".`, previous_status: order.status, new_status: args.new_status });
}

async function executeSearchProducts(args: any): Promise<string> {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let query = supabase.from("products")
    .select("id, name, price, unit, category, quantity, quality_score, description")
    .eq("is_available", true)
    .ilike("name", `%${args.query}%`);

  if (args.category) query = query.eq("category", args.category);
  if (args.max_price) query = query.lte("price", args.max_price);
  query = query.order("quality_score", { ascending: false, nullsFirst: false }).limit(8);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: `Search failed: ${error.message}` });
  if (!data || data.length === 0) {
    // Fallback: search by category
    const { data: catData } = await supabase.from("products")
      .select("id, name, price, unit, category, quantity, quality_score, description")
      .eq("is_available", true)
      .ilike("category", `%${args.query}%`)
      .limit(8);
    if (!catData || catData.length === 0) return JSON.stringify({ message: `No products found for "${args.query}".` });
    return JSON.stringify({ results: catData.length, products: catData });
  }
  return JSON.stringify({ results: data.length, products: data });
}

async function executeTool(name: string, args: any, userId: string): Promise<string> {
  switch (name) {
    case "get_weather": return executeGetWeather(args);
    case "get_market_prices": return executeGetMarketPrices(args);
    case "get_crop_recommendation": return executeGetCropRecommendation(args);
    case "get_gov_schemes": return executeGetGovSchemes(args);
    case "get_disease_info": return executeGetDiseaseInfo(args);
    case "get_farm_stats": return executeGetFarmStats(userId);
    case "add_product": return executeAddProduct(args, userId);
    case "check_my_orders": return executeCheckMyOrders(args, userId);
    case "book_vet_consultation": return executeBookVetConsultation(args, userId);
    case "update_order_status": return executeUpdateOrderStatus(args, userId);
    case "search_products": return executeSearchProducts(args);
    default: return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // __LANG_INJECTED__
    const __lang = req.headers.get('x-language-name') || req.headers.get('x-language') || 'English';
    const __langInstruction = `\n\nLANGUAGE RULE (highest priority): Detect the language of the user's most recent message and respond ENTIRELY in that same language (script + vocabulary). If the user mixes languages, mirror their dominant language. If the user's language is unclear, default to ${__lang}. All text values, descriptions, names, advice, and JSON string fields MUST be written in ${__lang}. Keep JSON keys and enum values (like 'high','low','open','closed') in English. Numbers, units (₹, kg, °C), and proper nouns can stay as-is.`;
    // Validate JWT and derive userId server-side
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { message, context, conversationHistory } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const rolePersonas: Record<string, { persona: string; focus: string; preferredTools: string; suggestPattern: string }> = {
      farmer: {
        persona: "FarmAssist — a trusted farm advisor for an Indian smallholder farmer. Speak like a knowledgeable krishi mitra.",
        focus: "crop planning, disease detection, weather-based advisories, government schemes, mandi prices, and listing produce on the marketplace",
        preferredTools: "get_weather, get_market_prices, get_crop_recommendation, get_gov_schemes, get_disease_info, get_farm_stats, add_product, check_my_orders (role=seller), book_vet_consultation",
        suggestPattern: "After answering, suggest 2-3 next actions like 'List your harvest', 'Check today's mandi rates', 'Apply for PM-KISAN', 'Book a vet for sick livestock'.",
      },
      consumer: {
        persona: "ShopAssist — a friendly shopping companion helping a buyer find fresh farm produce.",
        focus: "discovering fresh produce, comparing prices, tracking deliveries, finding deals, and reordering favorites",
        preferredTools: "search_products, check_my_orders (role=buyer), get_market_prices",
        suggestPattern: "After answering, suggest 2-3 next actions like 'Reorder your last purchase', 'Track your active order', 'Browse seasonal vegetables', 'See deals near you'. Never suggest farmer/seller tools.",
      },
      veterinary: {
        persona: "VetAssist — a clinical co-pilot for a licensed veterinarian.",
        focus: "managing consultations, triaging cases, suggesting differential diagnoses, treatment protocols, and follow-ups",
        preferredTools: "get_disease_info, check_my_orders (role=seller for consultations), update_order_status",
        suggestPattern: "After answering, suggest 2-3 next actions like 'Review pending consultations', 'Look up a disease', 'Update consultation status', 'Schedule a follow-up'. Never suggest add_product or marketplace selling.",
      },
      retailer: {
        persona: "RetailAssist — a B2B sourcing and inventory advisor for a retailer / agri-input shop.",
        focus: "stocking up bulk produce, negotiating with farmers, inventory turns, demand forecasting, and partnership management",
        preferredTools: "search_products, get_market_prices, check_my_orders (role=buyer), add_product (for resale listings)",
        suggestPattern: "After answering, suggest 2-3 next actions like 'Place a bulk order', 'Check today's wholesale prices', 'Review low-stock items', 'Find new farmer partners'.",
      },
      delivery: {
        persona: "RouteAssist — a delivery operations helper for a logistics/delivery partner.",
        focus: "active pickups & drops, optimal routes, proof of delivery, and earnings",
        preferredTools: "check_my_orders (role=delivery), update_order_status, get_weather",
        suggestPattern: "After answering, suggest 2-3 next actions like 'See active deliveries', 'Mark order as picked up', 'Check today's earnings', 'Plan route for pending drops'. Never suggest crop/marketplace listing tools.",
      },
      admin: {
        persona: "AdminAssist — a platform operations co-pilot for an administrator.",
        focus: "user verification, platform analytics, escalations, and system health",
        preferredTools: "get_farm_stats, check_my_orders, get_market_prices",
        suggestPattern: "After answering, suggest 2-3 next actions like 'Review pending vet verifications', 'Check today's signups', 'Investigate flagged orders'.",
      },
    };

    const persona = rolePersonas[context.userRole] || rolePersonas.farmer;

    const systemPrompt = `You are ${persona.persona}

ROLE: ${context.userRole}
FOCUS: Help with ${persona.focus}.

You have real-time tools to QUERY data and TAKE ACTIONS on the user's behalf.

ROLE-AWARE TOOL USAGE:
- Prefer these tools for this role: ${persona.preferredTools}.
- Do NOT recommend or invoke tools that are irrelevant to a ${context.userRole} (e.g. don't push 'add_product' to a consumer or 'book_vet' to a delivery partner).
- When calling check_my_orders, automatically pass the correct role argument matching the user's role.

PROACTIVE SUGGESTIONS (Flipkart-style "what's next"):
- ${persona.suggestPattern}
- Format suggestions at the END of every response inside this exact block so the UI can render them as tappable chips:

\`\`\`suggestions
- {short label} :: {full prompt the user could send}
- {short label} :: {full prompt the user could send}
- {short label} :: {full prompt the user could send}
\`\`\`

- Tailor labels to what the user just asked + their role + their recent activity (orders, listings, consultations) when known via tools.
- Keep labels under 5 words. Use emojis sparingly.

GENERAL GUIDELINES:
- Use tools proactively whenever the user's question relates to live data or an action.
- For ACTION tools (add_product, book_vet, update_order): confirm what you're about to do BEFORE executing, unless the user was very specific.
- For weather, default to lat=20.5937, lng=78.9629 (central India) if no location given.
- Season: Jun-Sep=Kharif, Oct-Feb=Rabi, Mar-May=Zaid.
- Use **markdown**: bold, lists, tables.
- Mix Hindi/English (Hinglish) naturally when it fits.
- For medical/veterinary emergencies, recommend a professional.

Current context: role=${context.userRole}, page=${context.currentPage || "unknown"}` + __langInstruction;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(conversationHistory || []).slice(-10),
      { role: "user", content: message },
    ];

    // First call: let the model decide if it needs tools
    const firstResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, tools, tool_choice: "auto" }),
    });

    if (!firstResponse.ok) {
      if (firstResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (firstResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${firstResponse.status}`);
    }

    const firstData = await firstResponse.json();
    const firstChoice = firstData.choices?.[0];

    if (!firstChoice?.message?.tool_calls || firstChoice.message.tool_calls.length === 0) {
      const content = firstChoice?.message?.content || "I'm sorry, I couldn't process that request.";
      return new Response(JSON.stringify({ response: content, tools_used: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Execute tool calls
    const toolCalls = firstChoice.message.tool_calls;
    const toolResults: string[] = [];
    const toolsUsed: string[] = [];

    for (const tc of toolCalls) {
      const args = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments) : tc.function.arguments;
      toolsUsed.push(tc.function.name);
      const result = await executeTool(tc.function.name, args, userId || "");
      toolResults.push(result);
    }

    const messagesWithTools = [
      ...messages,
      firstChoice.message,
      ...toolCalls.map((tc: any, i: number) => ({
        role: "tool",
        tool_call_id: tc.id,
        content: toolResults[i],
      })),
    ];

    const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: messagesWithTools, stream: true }),
    });

    if (!finalResponse.ok) throw new Error(`Final AI call failed: ${finalResponse.status}`);

    const encoder = new TextEncoder();
    const toolInfoEvent = `data: ${JSON.stringify({ tools_used: toolsUsed })}\n\n`;

    const readable = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(toolInfoEvent));
        const reader = finalResponse.body!.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI agent error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
