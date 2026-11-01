// Sends a plain-text Telegram message to the owner. Never throws.
export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, reason: 'not configured' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: String(text).slice(0, 3500),
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false, reason: `telegram ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: 'network error' };
  } finally {
    clearTimeout(timer);
  }
}
