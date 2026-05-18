const TG_MAX = 4000;

function stripHtml(text: string): string {
  return text
    .replace(/<\/?(b|i|u|s|strong|em|code|pre)[^>]*>/gi, '')
    .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
}

function splitPlain(text: string): string[] {
  if (text.length <= TG_MAX) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > TG_MAX) {
    let cut = remaining.lastIndexOf('\n', TG_MAX);
    if (cut < TG_MAX * 0.5) cut = TG_MAX;
    parts.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut).trimStart();
  }
  if (remaining.length) parts.push(remaining);
  return parts;
}

export interface TelegramSendResult {
  ok: boolean;
  status?: number;
  errorBody?: string;
}

async function callApi(token: string, payload: any) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function sendTelegramHtml(
  chatId: string | number,
  text: string,
  opts?: { label?: string }
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const label = opts?.label || 'send';
  if (!token) {
    console.error(`[Telegram] BOT_TOKEN не задан (${label})`);
    return { ok: false, errorBody: 'no token' };
  }

  // Короткое сообщение — отправляем как HTML одним куском.
  if (text.length <= TG_MAX) {
    try {
      const resp = await callApi(token, { chat_id: chatId, text, parse_mode: 'HTML' });
      if (resp.ok) return { ok: true };
      const errBody = await resp.text().catch(() => '');
      // Если Telegram отверг разметку — пробуем без HTML.
      if (resp.status === 400 && /parse|entit/i.test(errBody)) {
        console.warn(`[Telegram] ${label}: HTML отвергнут (${errBody}), пробуем plain text`);
        const plain = stripHtml(text);
        const resp2 = await callApi(token, { chat_id: chatId, text: plain });
        if (resp2.ok) return { ok: true };
        const errBody2 = await resp2.text().catch(() => '');
        console.error(`[Telegram] ${label} → chat ${chatId} plain fallback failed: ${resp2.status} ${errBody2}`);
        return { ok: false, status: resp2.status, errorBody: errBody2 };
      }
      console.error(`[Telegram] ${label} → chat ${chatId} failed: ${resp.status} ${errBody}`);
      return { ok: false, status: resp.status, errorBody: errBody };
    } catch (err: any) {
      console.error(`[Telegram] ${label} → chat ${chatId} threw:`, err?.message || err);
      return { ok: false, errorBody: err?.message || String(err) };
    }
  }

  // Длинное сообщение: разрезать безопасно нельзя (можно порвать HTML-теги),
  // поэтому переходим на plain text и режем по строкам.
  console.warn(`[Telegram] ${label}: длина ${text.length} > ${TG_MAX}, отправляем без HTML с разбивкой`);
  const plain = stripHtml(text);
  const chunks = splitPlain(plain);
  for (let i = 0; i < chunks.length; i++) {
    const body = i === 0 ? chunks[i] : `(продолжение ${i + 1}/${chunks.length})\n\n${chunks[i]}`;
    try {
      const resp = await callApi(token, { chat_id: chatId, text: body });
      if (!resp.ok) {
        const errBody = await resp.text().catch(() => '');
        console.error(`[Telegram] ${label} → chat ${chatId} part ${i + 1}/${chunks.length}: ${resp.status} ${errBody}`);
        return { ok: false, status: resp.status, errorBody: errBody };
      }
    } catch (err: any) {
      console.error(`[Telegram] ${label} → chat ${chatId} part ${i + 1} threw:`, err?.message || err);
      return { ok: false, errorBody: err?.message || String(err) };
    }
  }
  return { ok: true };
}
