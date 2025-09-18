import { useEffect, useRef, useState } from 'react';
import { chat } from './lib/openaiClient';
import MessageBubble from './components/MessageBubble';
import TypingDots from './components/TypingDots';
import ExampleChips from './components/ExampleChips';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI assistant. Ask me anything or try one of the examples below!' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('Ready');
  const [smartMode, setSmartMode] = useState(true);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (overrideUserText) => {
    const text = (overrideUserText ?? input).trim();
    if (!text || busy) return;

    const user = { role: 'user', content: text };
    const all = [...messages, user];

    setMessages(prev => [...prev, user]);
    setInput('');
    setBusy(true);
    setErr('');
    setStatus('Thinking…');

    try {
      const { reply } = await chat(all);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      setStatus('Ready');
    } catch (e) {
      const msg = e?.message || 'Request failed.';
      setErr(msg);
      setStatus('Error');
      setMessages(prev => [...prev, { role: 'assistant', content: '(generation failed)' }]);
    } finally {
      setBusy(false);
    }
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) send(lastUser.content);
  };

  const copyText = async (text) => {
    try { 
      await navigator.clipboard.writeText(text); 
      setErr('Copied to clipboard'); 
      setTimeout(() => setErr(''), 1200); 
    } catch { 
      setErr('Copy failed'); 
      setTimeout(() => setErr(''), 1200); 
    }
  };

  const onPickExample = (t) => setInput(t);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      {/* Header */}
      <header className="w-full max-w-3xl mb-4">
        <h1 className="text-2xl font-bold">AI Chat Demo — UX States</h1>
        <p className="text-gray-600 text-sm">Demo mode • Mock AI responses • Ready to chat!</p>
      </header>

      <main className="w-full max-w-3xl flex-1 flex flex-col bg-white border rounded-2xl shadow">
        <StatusBar status={status} smart={smartMode} onToggleSmart={setSmartMode} />

        {/* Messages */}
        <div ref={listRef} className="flex-1 p-4 space-y-6 overflow-auto" role="log" aria-live="polite" aria-label="Chat messages">
          {/* Empty/onboarding state */}
          {messages.length === 1 && (
            <div className="space-y-3 mb-2">
              <div className="text-gray-500 text-sm">Try one of these examples:</div>
              <ExampleChips onPick={onPickExample} />
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className="flex w-full">
              <MessageBubble
                role={m.role}
                onRetry={!busy && i === messages.length - 1 && m.role === 'assistant' && m.content.includes('failed') ? retryLast : undefined}
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

        {/* Composer */}
        <form className="p-3 flex gap-2 border-t" onSubmit={(e) => (e.preventDefault(), send())}>
          <textarea
            className="flex-1 resize-none rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-400"
            rows={2}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
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


      <Toast message={err} kind={status === 'Error' ? 'error' : 'info'} />
    </div>
  );
}