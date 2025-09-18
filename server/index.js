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
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('✅ OpenAI client initialized');
} else {
  console.log('⚠️  No OpenAI API key found - server will run in demo mode');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages[] required' });

    // If no OpenAI client, return a demo response
    if (!openai) {
      const demoResponses = [
        "Hello! I'm running in demo mode. Please add your OpenAI API key to enable live AI responses.",
        "This is a demo response. The server is running but needs an API key for real AI responses.",
        "Demo mode active! Add your OpenAI API key to the environment variables to enable AI chat.",
        "I'm here in demo mode. To get real AI responses, please configure your OpenAI API key."
      ];
      const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)];
      return res.json({ reply: randomResponse });
    }

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
app.use(express.static(distPath));
app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')));

const PORT = process.env.PORT || 5174;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
