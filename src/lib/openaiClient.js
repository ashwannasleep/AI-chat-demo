import OpenAI from 'openai';

// Server-side API approach (recommended for production)
export async function chat(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

// Client-side approach (for demo purposes)
export function getClient() {
  const key = sessionStorage.getItem('OPENAI_API_KEY');
  if (!key) throw new Error('Missing API key');
  return new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
}
