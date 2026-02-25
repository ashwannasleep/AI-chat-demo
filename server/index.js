import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

const BASE_SYSTEM_PROMPT = [
  'You are a pragmatic senior software and UX assistant.',
  'Prioritize correctness, actionable guidance, and clear tradeoffs.',
  'Avoid vague filler and avoid repeating the user request.',
].join(' ');

const QUALITY_RESPONSE_SCHEMA = [
  'Response schema (Markdown):',
  '### Direct answer',
  '1-3 concise sentences.',
  '### Practical steps',
  'Numbered implementation steps.',
  '### Example',
  'Provide a short concrete example or code block when relevant.',
  '### Pitfalls',
  'List likely mistakes or edge cases.',
  '### Next move',
  'One specific next action the user can take.',
  'Keep the response specific and grounded in the user context.',
].join('\n');

const DEMO_RESPONSES = [
  "Hello! I'm running in demo mode. Please add your OpenAI API key to enable live AI responses.",
  'This is a demo response. The server is running but needs an API key for real AI responses.',
  'Demo mode active! Add your OpenAI API key to the environment variables to enable AI chat.',
  "I'm here in demo mode. To get real AI responses, please configure your OpenAI API key.",
];

function sanitizeMessages(messages) {
  return messages
    .filter((item) => item && typeof item.content === 'string')
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.slice(0, 8000),
    }))
    .slice(-24);
}

function buildModelMessages(messages, qualityMode) {
  const systemPrompt = qualityMode
    ? `${BASE_SYSTEM_PROMPT}\n\n${QUALITY_RESPONSE_SCHEMA}`
    : BASE_SYSTEM_PROMPT;

  return [
    { role: 'system', content: systemPrompt },
    ...sanitizeMessages(messages),
  ];
}

function pickDemoResponse() {
  return DEMO_RESPONSES[Math.floor(Math.random() * DEMO_RESPONSES.length)];
}

function initSse(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
}

function sendSse(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

async function streamChatResponse(res, messages, qualityMode) {
  initSse(res);

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: qualityMode ? 0.45 : 0.7,
      max_tokens: 900,
      stream: true,
    });

    for await (const part of stream) {
      const chunk = part?.choices?.[0]?.delta?.content;
      if (chunk) sendSse(res, 'chunk', { chunk });
    }

    sendSse(res, 'done', { ok: true });
  } catch (err) {
    console.error(err);
    sendSse(res, 'error', { message: 'Chat stream failed' });
  } finally {
    res.end();
  }
}

// Initialize OpenAI client only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) { // eslint-disable-line no-undef
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // eslint-disable-line no-undef
  console.log('✅ OpenAI client initialized');
} else {
  console.log('⚠️  No OpenAI API key found - server will run in demo mode');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, stream = false, smartMode = true, qualityMode = true } = req.body ?? {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages[] required' });

    const useQualityMode = Boolean(smartMode && qualityMode);
    const modelMessages = buildModelMessages(messages, useQualityMode);

    // If no OpenAI client, return a demo response
    if (!openai) {
      const demoReply = pickDemoResponse();

      if (stream) {
        initSse(res);
        sendSse(res, 'chunk', { chunk: demoReply });
        sendSse(res, 'done', { ok: true });
        return res.end();
      }

      return res.json({ reply: demoReply });
    }

    if (stream) {
      await streamChatResponse(res, modelMessages, useQualityMode);
      return;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: modelMessages,
      temperature: useQualityMode ? 0.45 : 0.7,
      max_tokens: 900,
    });

    res.json({ reply: completion.choices[0]?.message?.content ?? '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat API failed' });
  }
});

/** Static (for production preview) */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

// Serve static files from dist directory
app.use(express.static(distPath));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 5174; // eslint-disable-line no-undef
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
