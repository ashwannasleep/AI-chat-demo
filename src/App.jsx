import { useEffect, useRef, useState } from 'react';
import { getClient } from './lib/openaiClient';
import MessageBubble from './components/MessageBubble';
import TypingDots from './components/TypingDots';
import ExampleChips from './components/ExampleChips';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';

const SYSTEM = [
  "You are a senior engineer & UX writer.",
  "Answer with clear structure and concrete steps.",
  "If the request is ambiguous, ask exactly ONE short clarifying question then propose a best-effort answer.",
  "Default style: concise, bullet-first, no filler.",
].join(" ");

const FEWSHOT = [
  { role: "user", content: "Give UX states for a search screen." },
  { role: "assistant", content: "States: • Empty (tips, examples) • Loading (skeleton) • Results • No results (suggest fixes) • Error (retry)" }
];

export default function App() {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(!!sessionStorage.getItem('OPENAI_API_KEY'));
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome! Paste your OpenAI API key to try live. Or click an example below.' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('Ready');
  const [smartMode, setSmartMode] = useState(true);
  const [controller, setController] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const saveKey = () => {
    if (!apiKeyInput.trim().startsWith('sk-')) return setErr('That does not look like a valid OpenAI API key.');
    sessionStorage.setItem('OPENAI_API_KEY', apiKeyInput.trim());
    setHasKey(true); setErr('');
  };
  const clearKey = () => { sessionStorage.removeItem('OPENAI_API_KEY'); setHasKey(false); };

  const sendCore = async (allMsgs, signal) => {
    const client = getClient();
    const r = await client.chat.completions.create({
      model: smartMode ? 'gpt-4o' : 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 800,
      messages: allMsgs,
      signal
    });
    return r?.choices?.[0]?.message?.content ?? '(no response)';
  };

  const send = async (overrideUserText) => {
    const text = (overrideUserText ?? input).trim();
    if (!text || busy) return;
    if (!hasKey) return setErr('Please paste your API key first.');

    const user = { role: 'user', content: text };
    const all = [{ role:'system', content: SYSTEM }, ...FEWSHOT, ...messages, user];

    setMessages(prev => [...prev, user]);
    setInput('');
    setBusy(true);
    setErr('');
    setStatus('Thinking…');
    const aborter = new AbortController(); setController(aborter);

    try {
      // pass 1 draft
      const draft = await sendCore(all, aborter.signal);
      // pass 2 tighten
      const improved = await sendCore([
        { role:'system', content: "Revise the answer: be concrete, bullet-first, ≤180 words unless code is necessary." },
        { role:'user', content: "Draft:\n" + draft }
      ], aborter.signal);

      // show reply
      setMessages(prev => [...prev, { role:'assistant', content: improved }]);
      setStatus('Ready');
    } catch (e) {
      if (e?.name === 'AbortError') {
        setStatus('Canceled');
      } else {
        const msg = e?.status === 429 ? 'Rate limited. Wait and retry.' : (e?.message || 'Request failed.');
        setErr(msg); setStatus('Error');
        // render a failed assistant bubble with Retry
        setMessages(prev => [...prev, { role:'assistant', content: '(generation failed)' }]);
      }
    } finally {
      setBusy(false); setController(null);
    }
  };

  const stop = () => { controller?.abort(); };

  const retryLast = () => {
    // find last user message to retry
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) send(lastUser.content);
  };

  const copyText = async (text) => {
    try { await navigator.clipboard.writeText(text); setErr('Copied to clipboard'); setTimeout(()=>setErr(''),1200); }
    catch { setErr('Copy failed'); setTimeout(()=>setErr(''),1200); }
  };

  const onPickExample = (t) => setInput(t);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center px-4 py-8">
      {/* Header + BYOK */}
      <header className="w-full max-w-3xl mb-4">
        <h1 className="text-2xl font-bold">AI Chat Demo — UX States</h1>
        <p className="text-gray-600 text-sm">Static GitHub Pages • BYOK • Smart mode toggle • Stop / Retry / Copy</p>
        <div className="mt-3 flex items-center gap-2">
          {!hasKey ? (
            <>
              <input
                type="password"
                placeholder="Paste OpenAI API key (sk-...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-72"
                aria-label="OpenAI API key"
              />
              <button onClick={saveKey} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Save</button>
            </>
          ) : (
            <button onClick={clearKey} className="px-3 py-2 rounded-lg bg-gray-200 text-sm">Clear key</button>
          )}
        </div>
      </header>

      <main className="w-full max-w-3xl flex-1 flex flex-col bg-white border rounded-2xl shadow">
        <StatusBar status={status} smart={smartMode} onToggleSmart={setSmartMode} />

        {/* Messages */}
        <div ref={listRef} className="flex-1 p-4 space-y-6 overflow-auto" role="log" aria-live="polite" aria-label="Chat messages">
          {/* Empty/onboarding state */}
          {messages.length === 1 && (
            <div className="space-y-3 mb-2">
              <div className="text-gray-500 text-sm">Try one:</div>
              <ExampleChips onPick={(t)=>setInput(t)} />
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
          {!busy ? (
            <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white">Send</button>
          ) : (
            <button type="button" onClick={stop} className="px-4 py-2 rounded-xl bg-gray-200">Stop</button>
          )}
        </form>
      </main>

      <footer className="mt-4 text-xs text-gray-500">
        Demo mode: keys are kept in <code>sessionStorage</code>, requests go directly from your browser to OpenAI.
      </footer>

      <Toast message={err} kind={status === 'Error' ? 'error' : 'info'} />
    </div>
  );
}