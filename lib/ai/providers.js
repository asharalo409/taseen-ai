// Configurable AI providers with retry and optional fallback.
// AI_PROVIDER = gemini | groq | openrouter
// AI_FALLBACK_PROVIDER (optional) = used if the main provider keeps failing.

const TIMEOUT_MS = 20000;
const MAX_ATTEMPTS = 3;
const RETRY_DEADLINE_MS = 18000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class ProviderError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function isRetryable(err) {
  return [429, 500, 502, 503, 504].includes(err.status);
}

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
      throw new ProviderError(`AI provider error ${res.status}: ${text.slice(0, 300)}`, res.status);
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') throw new ProviderError('AI provider timed out', 0);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function withRetry(fn) {
  const started = Date.now();
  let lastErr;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const elapsed = Date.now() - started;
      if (!isRetryable(err) || attempt === MAX_ATTEMPTS || elapsed > RETRY_DEADLINE_MS) break;
      await sleep(1000 * attempt);
    }
  }
  throw lastErr;
}

async function gemini(system, messages) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ProviderError('GEMINI_API_KEY is missing', -1);
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const data = await postJson(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    { 'x-goog-api-key': key },
    {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }
  );
  const parts =
    data && data.candidates && data.candidates[0] && data.candidates[0].content
      ? data.candidates[0].content.parts
      : null;
  const text = parts ? parts.map((p) => p.text || '').join('') : '';
  if (!text) throw new ProviderError('Empty response from Gemini', -1);
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
      max_tokens: 2048,
    }
  );
  const text =
    data && data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : '';
  if (!text) throw new ProviderError('Empty response from AI provider', -1);
  return text;
}

async function runProvider(provider, system, messages) {
  if (provider === 'gemini') return gemini(system, messages);

  if (provider === 'groq') {
    const key = process.env.GROQ_API_KEY;
    if (!key) throw new ProviderError('GROQ_API_KEY is missing', -1);
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
    if (!key) throw new ProviderError('OPENROUTER_API_KEY is missing', -1);
    return openAiCompatible(
      'https://openrouter.ai/api/v1/chat/completions',
      key,
      process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
      system,
      messages
    );
  }

  throw new ProviderError(`Unknown provider: ${provider}`, -1);
}

export async function generateReply({ system, messages }) {
  const primary = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  const fallback = (process.env.AI_FALLBACK_PROVIDER || '').toLowerCase();

  try {
    return await withRetry(() => runProvider(primary, system, messages));
  } catch (primaryErr) {
    if (fallback && fallback !== primary) {
      try {
        return await withRetry(() => runProvider(fallback, system, messages));
      } catch (fallbackErr) {
        console.error('Fallback provider failed:', fallbackErr.message);
      }
    }
    throw primaryErr;
  }
}
