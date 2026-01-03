import { useEffect, useRef, useState } from 'react';
import { chat, chatWithAPI } from './lib/openaiClient';
import MessageBubble from './components/MessageBubble';
import TypingDots from './components/TypingDots';
import ExampleChips from './components/ExampleChips';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';

const SYSTEM_INTRO =
  "I’m a UX States Reviewer. Describe a screen or flow (e.g., checkout, search, onboarding), and I’ll identify missing empty/loading/error/recovery states and suggest improvements.";

export default function App() {
  const makeMessage = (role, content, status = 'done') => ({
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
    role,
    content,
    status
  });

  const [messages, setMessages] = useState([
    makeMessage('assistant', SYSTEM_INTRO),
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState({ phase: 'idle', message: 'Ready' });
  const [smartMode, setSmartMode] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const buildPrompt = (userText) => {
    // This makes your demo feel intentional without needing backend changes.
    // It also keeps the "UX States" theme consistent.
    return [
      {
        role: 'system',
        content:
          "You are a UX reviewer focused on state design for real-world apps. Be concise, opinionated, and structured. Prefer bullets. Avoid generic tutoring. Keep replies under 120 words. Always include: Missing states, UX recommendation, and a short copy suggestion if relevant.",
      },
      ...messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userText },
    ];
  };

  const send = async (overrideUserText) => {
    const text = (overrideUserText ?? input).trim();
    if (!text || busy) return;

    const user = makeMessage('user', text);

    setMessages(prev => [...prev, user]);
    setInput('');
    setBusy(true);
    setToast(null);
    setStatus({ phase: 'thinking', message: 'Thinking…' });

    try {
      const transport = smartMode ? chatWithAPI : chat;
      const { reply } = await transport(buildPrompt(text));
      setMessages(prev => [...prev, makeMessage('assistant', reply)]);
      setStatus({ phase: 'idle', message: 'Ready' });
    } catch (e) {
      const msg = e?.message || 'Request failed.';
      setToast({ kind: 'error', message: msg });
      setStatus({ phase: 'error', message: msg });

      // Better fallback than "(generation failed)" — still looks like a designed tool.
      const isMissingKey = msg.toLowerCase().includes('openai api key not configured');
      const fallback = isMissingKey
        ? "Smart mode requires an OpenAI API key. Switch to Demo mode or set OPENAI_API_KEY and restart."
        : "I couldn’t reach the model just now. Here’s a quick UX-states checklist you can apply:\n\n• Empty: what users see before first action\n• Loading: spinner/skeleton + “what’s happening” copy\n• Error: inline error + retry + preserve input\n• Timeout: guidance + safe recovery path\n• Partial success: what completed vs what failed\n\nTry again, or paste your UI flow and I’ll review it.";

      setMessages(prev => [...prev, makeMessage('assistant', fallback, 'error')]);
    } finally {
      setBusy(false);
    }
  };

  const retryLast = () => {
    const lastErrorAssistant = [...messages].reverse().find(m => m.role === 'assistant' && m.status === 'error');
    if (lastErrorAssistant) {
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      if (lastUser) send(lastUser.content);
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ kind: 'info', message: 'Copied to clipboard' });
      setTimeout(() => setToast(null), 1200);
    } catch {
      setToast({ kind: 'error', message: 'Copy failed' });
      setTimeout(() => setToast(null), 1200);
    }
  };

  // Key change: examples should either prefill OR send immediately.
  // For demos, "send immediately" feels much less lame.
  const onPickExample = (t) => {
    // Option A: send immediately (recommended for demo feel)
    send(t);

    // Option B (if you prefer): prefill only
    // setInput(t);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      {/* Header */}
      <header className="w-full max-w-3xl mb-4">
        <h1 className="text-2xl font-bold">AI Chat Demo — UX States</h1>
        <p className="text-gray-600 text-sm">
          UX state critique • structured feedback • streaming-friendly chat UI
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Demo runs locally by default—no keys needed. Smart mode calls /api/chat if configured.
        </p>
      </header>

      <main className="w-full max-w-3xl flex-1 flex flex-col bg-white border rounded-2xl shadow">
        <StatusBar status={status} smart={smartMode} onToggleSmart={setSmartMode} />

        {/* Messages */}
        <div
          ref={listRef}
          className="flex-1 p-4 space-y-6 overflow-auto"
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
        >
          {/* Empty/onboarding state */}
          {messages.length === 1 && (
            <div className="space-y-3 mb-2">
              <div className="text-gray-500 text-sm">
                Try one of these UX reviews:
              </div>
              <ExampleChips onPick={onPickExample} />
            </div>
          )}

          {messages.map((m, i) => (
            <div key={m.id} className="flex w-full">
              <MessageBubble
                id={m.id}
                role={m.role}
                onRetry={
                  !busy &&
                  i === messages.length - 1 &&
                  m.role === 'assistant' &&
                  m.status === 'error'
                    ? retryLast
                    : undefined
                }
                status={m.status}
                onCopy={() => copyText(m.content)}
              >
                {m.content}
              </MessageBubble>
            </div>
          ))}

          {busy && (
            <div className="flex w-full">
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 text-gray-900 self-start">
                <TypingDots />
              </div>
            </div>
          )}
        </div>

        {/* Quick prompts (always visible to reduce typing) */}
        {messages.length > 0 && (
          <div className="px-3 pb-3 text-xs text-gray-600">
            <div className="mb-2 font-medium text-gray-700">Quick actions:</div>
            <div className="flex flex-wrap gap-2">
              {[
                'Summarize in 60 words',
                'Focus on error-state UX only',
                'Give copy tweaks for the UI',
                'List recovery paths users get stuck on',
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => send(t)}
                  className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 border transition"
                  aria-label={`Use quick action: ${t}`}
                  type="button"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keep examples available near composer */}
        {messages.length > 1 && (
          <div className="px-3 pb-3 text-xs text-gray-600">
            <div className="mb-2 font-medium text-gray-700">Try a quick review:</div>
            <ExampleChips onPick={onPickExample} />
          </div>
        )}

        {/* Composer */}
        <form className="p-3 flex gap-2 border-t" onSubmit={(e) => (e.preventDefault(), send())}>
          <textarea
            className="flex-1 resize-none rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            rows={2}
            placeholder="Describe a UI screen/flow (e.g., “checkout loading + failure states”)…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Message input"
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </main>

      <Toast message={toast?.message} kind={toast?.kind || 'info'} />
    </div>
  );
}
