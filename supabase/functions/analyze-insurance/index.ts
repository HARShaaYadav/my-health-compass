import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchWithRetries(url: string, init: RequestInit, maxRetries = 4) {
  let attempt = 0;
  while (true) {
    const resp = await fetch(url, init);
    if (resp.status !== 429 || attempt >= maxRetries) return resp;
    const retryAfter = resp.headers.get("Retry-After");
    const sleepMs = retryAfter ? Math.max(1000, Number(retryAfter) * 1000) : Math.min(64000, Math.pow(2, attempt) * 1000);
    console.warn(`Rate limited by provider, retrying in ${sleepMs}ms (attempt ${attempt + 1})`);
    await new Promise((r) => setTimeout(r, sleepMs));
    attempt += 1;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetchWithRetries("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an insurance document analyst. Analyze the uploaded insurance document and extract coverage details.

Return a JSON object with this exact structure:
{
  "plan_name": "Name of the insurance plan",
  "provider": "Insurance provider name",
  "coverage_items": [
    {
      "item": "Description of covered item/service",
      "covered": true/false,
      "coverage_percentage": 80,
      "max_amount": "$5000",
      "notes": "Any important notes or exclusions"
    }
  ],
  "deductible": "$500",
  "out_of_pocket_max": "$5000",
  "summary": "Plain language summary of the insurance coverage",
  "exclusions": ["list of major exclusions"],
  "recommendations": ["actionable recommendations for the policyholder"]
}

Be thorough but explain everything in simple, plain language. If you cannot read the document clearly, still provide what you can extract.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Please analyze this insurance document and explain the coverage in simple terms." },
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse insurance analysis");

    const result = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("insurance analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
