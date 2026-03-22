const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL = "gemini-2.0-flash";
const MODEL_STREAM = "gemini-2.0-flash";

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_gemini_api_key_here") throw new Error("GEMINI_API_KEY is not configured in backend/.env");
  return key;
}

// Convert OpenAI-style messages to Gemini format
function toGeminiContents(messages) {
  return messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      if (typeof m.content === "string") {
        return { role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] };
      }
      // multi-modal (array content)
      const parts = m.content.map((c) => {
        if (c.type === "text") return { text: c.text };
        if (c.type === "image_url") {
          const url = c.image_url?.url || "";
          const match = url.match(/^data:(.+);base64,(.+)$/);
          if (match) return { inlineData: { mimeType: match[1], data: match[2] } };
        }
        return { text: "" };
      });
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });
}

// Extract system instruction from messages
function getSystemInstruction(messages) {
  const sys = messages.find((m) => m.role === "system");
  return sys ? { parts: [{ text: sys.content }] } : undefined;
}

// Retry with backoff on 429
async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function callGemini(messages, { stream = false, tools = null, retries = 8 } = {}) {
  const key = getApiKey();
  const endpoint = stream
    ? `${GEMINI_BASE}/${MODEL_STREAM}:streamGenerateContent?alt=sse&key=${key}`
    : `${GEMINI_BASE}/${MODEL}:generateContent?key=${key}`;

  const body = {
    contents: toGeminiContents(messages),
    systemInstruction: getSystemInstruction(messages),
    generationConfig: { temperature: 0.7 },
  };

  if (tools) {
    body.tools = [{ functionDeclarations: tools.map((t) => t.function) }];
    body.toolConfig = { functionCallingConfig: { mode: "ANY", allowedFunctionNames: [tools[0].function.name] } };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("Gemini error:", response.status, text);

    if (response.status === 429) {
      if (retries > 0) {
        const retryAfterHeader = response.headers.get("Retry-After");
        const baseDelay = retryAfterHeader ? Math.max(1000, parseInt(retryAfterHeader, 10) * 1000) : Math.min(64000, Math.pow(2, 8 - retries) * 1000);
        const jitter = Math.floor(Math.random() * 500);
        const delayMs = baseDelay + jitter;
        console.log(`Rate limited, retrying in ${delayMs}ms... (${retries} retries left)`);
        await sleep(delayMs);
        return callGemini(messages, { stream, tools, retries: retries - 1 });
      }
      const finalErr = new Error("Rate limit exceeded. Please wait a moment and try again.");
      finalErr.status = 429;
      throw finalErr;
    }

    if (response.status === 400) {
      const err = new Error("Invalid request to AI service.");
      err.status = 400;
      throw err;
    }
    throw new Error("AI service error");
  }

  return response;
}

// Parse function call result from Gemini response
function parseFunctionCall(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const fc = parts.find((p) => p.functionCall);
  return fc ? fc.functionCall.args : null;
}

// Parse text content from Gemini response
function parseText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || "").join("");
}

// ─── POST /api/ai/chat  (streaming SSE) ───────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { messages } = req.body;

    const systemPrompt = `You are MedExplain AI, a helpful medical information assistant. You help users understand health topics in simple, clear language.

IMPORTANT RULES:
- Always explain medical concepts in plain, easy-to-understand language
- When appropriate, suggest which type of specialist to consult
- NEVER provide a definitive diagnosis
- ALWAYS remind users to consult their doctor for medical decisions
- Use markdown formatting for clarity (bold, lists, etc.)
- Be empathetic and reassuring but factually accurate
- If symptoms sound urgent (chest pain, difficulty breathing, stroke symptoms), advise seeking immediate emergency care
- When images are shared, analyze them carefully and provide helpful medical information
- Always clarify that image-based analysis is not a substitute for in-person examination`;

    // Build Gemini messages with image support
    const geminiMessages = [{ role: "system", content: systemPrompt }];
    for (const msg of messages) {
      if (msg.imageBase64) {
        geminiMessages.push({
          role: msg.role,
          content: [
            ...(msg.content ? [{ type: "text", text: msg.content }] : []),
            { type: "image_url", image_url: { url: `data:${msg.mimeType || "image/jpeg"};base64,${msg.imageBase64}` } },
          ],
        });
      } else {
        geminiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const aiResp = await callGemini(geminiMessages, { stream: true });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = aiResp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line || line.startsWith(":")) continue;
        if (line.startsWith("data: ")) {
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              // Re-emit as OpenAI-compatible SSE so frontend works unchanged
              res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
            }
          } catch { /* skip malformed */ }
        }
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("chat error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── POST /api/ai/symptom-chat (conversational symptom checker) ───────────────
exports.symptomChat = async (req, res) => {
  try {
    const { messages } = req.body; // array of { role, content, imageBase64?, mimeType? }

    const systemPrompt = `You are a compassionate AI symptom checker. Users will describe their symptoms or share medical images in a natural conversation.

Your job:
- Ask clarifying questions when needed (duration, severity, location, etc.)
- Analyze symptoms and suggest possible conditions with severity (low/medium/high)
- Recommend which specialist to see
- Give practical next steps and home care advice
- Analyze medical images (skin, rash, eye, wound, swelling) when shared
- Keep responses concise, warm, and easy to understand
- Use bullet points and bold text for clarity
- ALWAYS end with a disclaimer that this is not a medical diagnosis

NEVER diagnose definitively. ALWAYS recommend consulting a real doctor for serious symptoms.
If symptoms sound like an emergency (chest pain, difficulty breathing, stroke signs), immediately advise calling emergency services.`;

    const geminiMessages = [{ role: "system", content: systemPrompt }];

    for (const msg of messages) {
      if (msg.imageBase64) {
        geminiMessages.push({
          role: msg.role,
          content: [
            ...(msg.content ? [{ type: "text", text: msg.content }] : [{ type: "text", text: "Please analyze this image." }]),
            { type: "image_url", image_url: { url: `data:${msg.mimeType || "image/jpeg"};base64,${msg.imageBase64}` } },
          ],
        });
      } else {
        geminiMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const aiResp = await callGemini(geminiMessages, { stream: true });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = aiResp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line || line.startsWith(":")) continue;
        if (line.startsWith("data: ")) {
          const json = line.slice(6).trim();
          if (json === "[DONE]") continue;
          try {
            const parsed = JSON.parse(json);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
          } catch { /* skip */ }
        }
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("symptom-chat error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
exports.analyzeSymptoms = async (req, res) => {
  try {
    const { symptoms } = req.body;
    const messages = [
      { role: "system", content: "You are a medical symptom analysis AI. Analyze symptoms and return structured JSON results. Be thorough but remind users this is not a diagnosis. Return ONLY valid JSON, no markdown." },
      { role: "user", content: `Analyze these symptoms: ${symptoms.join(", ")}. Return a JSON object with this exact structure: { "results": [ { "condition": "string", "severity": "low|medium|high", "specialist": "string", "description": "string" } ] }` },
    ];
    const aiResp = await callGemini(messages);
    const data = await aiResp.json();
    const text = parseText(data);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse AI response");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("analyze-symptoms error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── POST /api/ai/analyze-image ──────────────────────────────────────────────
exports.analyzeImage = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    const messages = [
      { role: "system", content: `You are a medical image analysis assistant. Analyze the uploaded medical image and provide possible conditions. IMPORTANT: Always clarify this is NOT a diagnosis. Return ONLY a JSON object: { "results": [ { "condition": "", "severity": "low|medium|high", "specialist": "", "description": "" } ], "observations": "", "immediate_actions": [], "urgency": "low|medium|high" }` },
      {
        role: "user",
        content: [
          { type: "text", text: "Please analyze this medical image and suggest possible conditions." },
          { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
        ],
      },
    ];
    const aiResp = await callGemini(messages);
    const data = await aiResp.json();
    const text = parseText(data);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse image analysis");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("analyze-image error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── POST /api/ai/analyze-report ─────────────────────────────────────────────
exports.analyzeReport = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    const messages = [
      { role: "system", content: "You are a medical report analysis AI. Extract lab values from the report image, compare with normal reference ranges, and explain each result in simple language. Return ONLY valid JSON, no markdown." },
      {
        role: "user",
        content: imageBase64
          ? [
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
              { type: "text", text: `Analyze this medical report. Return a JSON object: { "report_type": "string", "results": [ { "name": "string", "value": "string", "unit": "string", "reference_range": "string", "status": "normal|low|high", "explanation": "string" } ], "summary": "string" }` },
            ]
          : "No image provided.",
      },
    ];
    const aiResp = await callGemini(messages);
    const data = await aiResp.json();
    const text = parseText(data);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse report analysis");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("analyze-report error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── POST /api/ai/analyze-prescription ───────────────────────────────────────
exports.analyzePrescription = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    const messages = [
      { role: "system", content: "You are a prescription reading AI. Analyze the prescription image and extract medicine names, dosages, and instructions. Return ONLY valid JSON, no markdown." },
      {
        role: "user",
        content: imageBase64
          ? [
              { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
              { type: "text", text: `Read this prescription. Return a JSON object: { "extracted_text": "string", "medicines": [ { "name": "string", "dosage": "string", "frequency": "string", "duration": "string", "purpose": "string" } ] }` },
            ]
          : "No image provided.",
      },
    ];
    const aiResp = await callGemini(messages);
    const data = await aiResp.json();
    const text = parseText(data);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse prescription");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("analyze-prescription error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── POST /api/ai/analyze-insurance ──────────────────────────────────────────
exports.analyzeInsurance = async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    const messages = [
      { role: "system", content: "You are an insurance document analyst. Analyze the uploaded insurance document and extract coverage details. Return ONLY valid JSON, no markdown." },
      {
        role: "user",
        content: [
          { type: "text", text: `Analyze this insurance document. Return a JSON object: { "plan_name": "string", "provider": "string", "coverage_items": [ { "item": "string", "covered": true, "coverage_percentage": 80, "max_amount": "string", "notes": "string" } ], "deductible": "string", "out_of_pocket_max": "string", "summary": "string", "exclusions": [], "recommendations": [] }` },
          { type: "image_url", image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` } },
        ],
      },
    ];
    const aiResp = await callGemini(messages);
    const data = await aiResp.json();
    const text = parseText(data);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse insurance analysis");
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("analyze-insurance error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── POST /api/ai/check-interactions ─────────────────────────────────────────
exports.checkInteractions = async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || medicines.length < 2) {
      return res.json({ interactions: [], summary: "Need at least 2 medicines to check interactions." });
    }
    const messages = [
      { role: "system", content: "You are a pharmaceutical interaction checker. Identify potential drug interactions. Be conservative — only flag well-documented interactions. Return ONLY valid JSON, no markdown." },
      { role: "user", content: `Check for interactions between: ${medicines.join(", ")}. Return a JSON object: { "interactions": [ { "drug1": "string", "drug2": "string", "severity": "low|moderate|severe", "description": "string", "recommendation": "string" } ], "summary": "string" }` },
    ];
    const aiResp = await callGemini(messages);
    const data = await aiResp.json();
    const text = parseText(data);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.json({ interactions: [], summary: "No interactions data returned." });
    res.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("check-interactions error:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};
