import OpenAI from 'openai';

// Mock responses for demo mode (no API key needed)
const mockResponses = [
  "Hello! I'm a demo AI assistant. How can I help you today?",
  "That's an interesting question! Let me think about that...",
  "I'd be happy to help you with that!",
  "Great question! Here's what I think...",
  "I understand what you're asking. Let me provide some insights.",
  "Thanks for sharing that with me!",
  "I'm here to help! What else would you like to know?",
  "That's a fascinating topic! Let me elaborate on that.",
  "I see what you mean. Here's my perspective on that...",
  "That's a great point! Let me add some thoughts to that."
];

// Demo mode chat function (no API key required)
export async function chat(messages) {
  // Simulate API delay for realistic UX
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  // Get a random mock response
  const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  return { reply: randomResponse };
}

// Server-side API approach (for production with API key)
export async function chatWithAPI(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

// Client-side approach (for demo purposes with API key)
export function getClient() {
  const key = sessionStorage.getItem('OPENAI_API_KEY');
  if (!key) throw new Error('Missing API key');
  return new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
}
