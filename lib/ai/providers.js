// Configurable AI providers. Choose with AI_PROVIDER env var.
const TIMEOUT_MS = 25000;

async function postJson(url, headers, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI provider error ${res.status}: ${text.slice(0, 300)}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function gemini(system, messages) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is missing');
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const data = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    { 'x-goog-api-key': key },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }
  );
  const parts = data && data.candidates && data.candidates[0] && data.candidates[0].content
    ? data.candidates[0].content.parts
    : null;
  const text = parts ? parts.map((p) => p.text || '').join('') : '';
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

async function openAiCompatible(url, key, model, system, messages) {
  const data = await postJson(
    url,
    { Authorization: `Bearer ${key}` },
    {
      model,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.7,
      max_tokens: 1024,
    }
  );
  const text = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';
  if (!text) throw new Error('Empty response from AI provider');
  return text;
}

export async function generateReply({ system, messages }) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

  if (provider === 'gemini') return gemini(system, messages);

  if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY is missing');
    return openAiCompatible(
      'https://api.groq.com/openai/v1/chat/completions',
      key,
      process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      system,
      messages
    );
  }

  if (provider === 'openrouter') {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) throw new Error('OPENROUTER_API_KEY is missing');
    return openAiCompatible(
      'https://openrouter.ai/api/v1/chat/completions',
      key,
      process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      system,
      messages
    );
  }

  throw new Error(`Unknown AI_PROVIDER: ${provider}`);
}
