import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI client only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) { // eslint-disable-line no-undef
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // eslint-disable-line no-undef
  console.log('✅ OpenAI client initialized');
} else {
  console.log('⚠️  No OpenAI API key found - API requests will fail');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages[] required' });

    if (!openai) return res.status(401).json({ error: 'OpenAI API key not configured' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages
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
const isProd = process.env.NODE_ENV === 'production'; // eslint-disable-line no-undef

if (isProd) {
  // Serve static files from dist directory
  app.use(express.static(distPath));
  // Catch-all handler: send back React's index.html file for any non-API routes
  app.get(/.*/, (_, res) => res.sendFile(path.join(distPath, 'index.html')));
}

const PORT = process.env.PORT || 5174; // eslint-disable-line no-undef
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
