import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const messages: any[] = [
      {
        role: "system",
        content: `You are a medical report analysis AI. Extract lab values from the report image, compare with normal reference ranges, and explain each result in simple language. Flag abnormal values clearly.`
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
            text: "Analyze this medical report. Extract all lab values, compare with normal ranges, and explain each in simple terms."
          }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: "No image was provided. Please upload a medical report image."
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            name: "return_report_analysis",
            description: "Return structured medical report analysis",
            parameters: {
              type: "object",
              properties: {
                report_type: { type: "string", description: "Type of medical report (e.g., Blood Test, Urine Test, X-Ray)" },
                results: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      value: { type: "string" },
                      unit: { type: "string" },
                      reference_range: { type: "string" },
                      status: { type: "string", enum: ["normal", "low", "high"] },
                      explanation: { type: "string" }
                    },
                    required: ["name", "value", "status", "explanation"],
                    additionalProperties: false
                  }
                },
                summary: { type: "string", description: "Overall summary and recommendations" }
              },
              required: ["report_type", "results", "summary"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_report_analysis" } }
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
    console.error("analyze-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
