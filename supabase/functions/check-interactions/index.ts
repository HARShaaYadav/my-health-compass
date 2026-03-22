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
    const { medicines } = await req.json();
    if (!medicines || medicines.length < 2) {
      return new Response(JSON.stringify({ interactions: [], summary: "Need at least 2 medicines to check interactions." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetchWithRetries("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a pharmaceutical interaction checker. Given a list of medicines, identify potential drug interactions.
For each interaction found, provide:
- The two drugs involved
- Severity: "low", "moderate", or "severe"
- A brief plain-language description of the interaction
- What the patient should do

IMPORTANT: Always remind that this is AI-generated guidance and patients should consult their pharmacist or doctor.
Be conservative — only flag well-documented interactions.`
          },
          {
            role: "user",
            content: `Check for interactions between these medicines: ${medicines.join(", ")}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "report_interactions",
            description: "Report drug interactions found",
            parameters: {
              type: "object",
              properties: {
                interactions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      drug1: { type: "string" },
                      drug2: { type: "string" },
                      severity: { type: "string", enum: ["low", "moderate", "severe"] },
                      description: { type: "string" },
                      recommendation: { type: "string" }
                    },
                    required: ["drug1", "drug2", "severity", "description", "recommendation"]
                  }
                },
                summary: { type: "string" }
              },
              required: ["interactions", "summary"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "report_interactions" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ interactions: [], summary: "No interactions data returned." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interaction check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
