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

    const messages: any[] = [
      {
        role: "system",
        content: `You are a prescription reading AI. Analyze the prescription image and extract medicine names, dosages, and instructions. If the image is unclear, do your best and note any uncertainties.`
      },
    ];

    if (imageBase64) {
      messages.push({
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` }
          },
          {
            type: "text",
            text: "Read this prescription and extract all medicines with their dosages and instructions."
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: "No image was provided. Please upload a prescription image."
      });
    }

    const response = await fetchWithRetries("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [{
          type: "function",
          function: {
            name: "return_prescription",
            description: "Return structured prescription data",
            parameters: {
              type: "object",
              properties: {
                extracted_text: { type: "string", description: "Full extracted text from the prescription" },
                medicines: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      dosage: { type: "string" },
                      frequency: { type: "string" },
                      duration: { type: "string" },
                      purpose: { type: "string" }
                    },
                    required: ["name", "dosage", "frequency"],
                    additionalProperties: false
                  }
                }
              },
              required: ["extracted_text", "medicines"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_prescription" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("No structured response");
  } catch (e) {
    console.error("analyze-prescription error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
