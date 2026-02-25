import { useEffect, useMemo, useRef, useState } from 'react';
import { chat } from './lib/openaiClient';
import MessageBubble from './components/MessageBubble';
import TypingDots from './components/TypingDots';
import ExampleChips from './components/ExampleChips';
import StatusBar from './components/StatusBar';
import Toast from './components/Toast';

const STORAGE_KEY = 'ai-chat-demo.session.v1';
const MAX_STORED_MESSAGES = 80;
const TELEMETRY_LIMIT = 24;
const SCROLL_NEAR_BOTTOM_PX = 140;
const DEFAULT_WELCOME_MESSAGE = 'Hi! I can answer with concrete steps, examples, and tradeoffs. Ask me anything or try one of the examples below.';

const ASSISTANT_QUICK_ACTIONS = [
  { id: 'deeper', label: 'Explain deeper' },
  { id: 'code', label: 'Show code' },
  { id: 'tldr', label: 'TL;DR' },
  { id: 'compare', label: 'Compare options' },
];

const SOURCE_LABELS = {
  live_api: 'Mode: Live API',
  mock_local: 'Mode: Local Smart Fallback',
  lite_local: 'Mode: Local Lite',
};

const SOURCE_TONES = {
  live_api: 'live',
  mock_local: 'fallback',
  lite_local: 'lite',
};

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createMessage(role, content) {
  return { id: createMessageId(), role, content };
}

function createWelcomeMessage() {
  return createMessage('assistant', DEFAULT_WELCOME_MESSAGE);
}

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function estimateTokens(charCount) {
  return Math.max(1, Math.round(charCount / 4));
}

function average(values) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function normalizeStoredMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .filter((item) => item && typeof item.content === 'string')
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : createMessageId(),
      role: item.role === 'user' ? 'user' : 'assistant',
      content: item.content,
    }))
    .slice(-MAX_STORED_MESSAGES);
}

function loadSession() {
  if (typeof window === 'undefined') {
    return { messages: [], smartMode: true };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { messages: [], smartMode: true };

    const parsed = JSON.parse(raw);
    return {
      messages: normalizeStoredMessages(parsed?.messages),
      smartMode: parsed?.smartMode !== false,
    };
  } catch {
    return { messages: [], smartMode: true };
  }
}

function toApiMessages(messages) {
  return messages.map((item) => ({
    role: item.role,
    content: item.content,
  }));
}

function isNearBottom(element) {
  const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
  return distance <= SCROLL_NEAR_BOTTOM_PX;
}

function buildActionPrompt(actionId, assistantContent) {
  const condensed = assistantContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6)
    .join(' ')
    .slice(0, 360);

  const contextBlock = condensed ? `\n\nContext:\n${condensed}` : '';

  if (actionId === 'deeper') {
    return `Go deeper on your previous answer with technical detail, tradeoffs, and edge cases.${contextBlock}`;
  }

  if (actionId === 'code') {
    return `Turn your previous answer into practical implementation steps and include an example code snippet.${contextBlock}`;
  }

  if (actionId === 'tldr') {
    return `Summarize your previous answer as a concise TL;DR with 3 bullet points and one action step.${contextBlock}`;
  }

  return `Compare 2-3 viable options for your previous answer, with pros/cons and when to use each.${contextBlock}`;
}

function findPreviousUser(messages, fromIndex) {
  for (let index = fromIndex - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'user') return messages[index];
  }
  return null;
}

function buildMarkdownExport(messages) {
  const lines = [
    '# AI Chat Demo Export',
    '',
    `Exported: ${new Date().toISOString()}`,
    '',
  ];

  messages.forEach((message, index) => {
    lines.push(`## ${index + 1}. ${message.role === 'user' ? 'User' : 'Assistant'}`);
    lines.push('');
    lines.push(message.content);
    lines.push('');
  });

  return lines.join('\n');
}

function downloadTextFile(filename, content, mimeType) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (typeof window.URL?.createObjectURL !== 'function') return false;

  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
}

export default function App() {
  const initialSessionRef = useRef(null);
  if (!initialSessionRef.current) {
    initialSessionRef.current = loadSession();
  }
  const initialSession = initialSessionRef.current;

  const [messages, setMessages] = useState(() => {
    return initialSession.messages.length > 0
      ? initialSession.messages
      : [createWelcomeMessage()];
  });
  const [smartMode, setSmartMode] = useState(() => initialSession.smartMode);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [streamDraft, setStreamDraft] = useState('');
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('Ready');
  const [runtimeMode, setRuntimeMode] = useState('mock_local');
  const [runtimeReason, setRuntimeReason] = useState('Local smart mode active until live API is available.');
  const [editingFromHistory, setEditingFromHistory] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const listRef = useRef(null);
  const composerRef = useRef(null);
  const autoScrollRef = useRef(true);
  const activeAbortRef = useRef(null);

  const telemetrySummary = useMemo(() => {
    if (!telemetryHistory.length) return null;

    const last = telemetryHistory[telemetryHistory.length - 1];
    return {
      count: telemetryHistory.length,
      last,
      avgLatency: average(telemetryHistory.map((item) => item.latencyMs)),
      avgStream: average(telemetryHistory.map((item) => item.streamMs)),
      avgChars: average(telemetryHistory.map((item) => item.chars)),
      avgTokens: average(telemetryHistory.map((item) => item.tokens)),
    };
  }, [telemetryHistory]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const handleScroll = () => {
      autoScrollRef.current = isNearBottom(list);
    };

    handleScroll();
    list.addEventListener('scroll', handleScroll, { passive: true });
    return () => list.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !autoScrollRef.current) return;

    const frame = requestAnimationFrame(() => {
      list.scrollTo({
        top: list.scrollHeight,
        behavior: streamDraft ? 'auto' : 'smooth',
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [messages, busy, streamDraft]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const payload = {
        smartMode,
        messages: messages.slice(-MAX_STORED_MESSAGES).map((item) => ({
          id: item.id,
          role: item.role,
          content: item.content,
        })),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage write errors
    }
  }, [messages, smartMode]);

  const stopGenerating = () => {
    activeAbortRef.current?.abort();
  };

  const requestAssistant = async ({
    text,
    appendUser = true,
    baseMessages = messages,
    statusLabel = 'Thinking...',
  } = {}) => {
    if (busy) return;

    const trimmedText = (text ?? input).trim();
    if (appendUser && !trimmedText) return;

    let requestMessages = baseMessages;

    if (appendUser) {
      const userMessage = createMessage('user', trimmedText);
      requestMessages = [...baseMessages, userMessage];
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setEditingFromHistory(false);
    } else {
      if (!requestMessages.length || requestMessages[requestMessages.length - 1].role !== 'user') return;
      setMessages(requestMessages);
    }

    autoScrollRef.current = true;
    setBusy(true);
    setStreamDraft('');
    setErr('');
    setStatus(statusLabel);

    const requestController = new AbortController();
    activeAbortRef.current = requestController;

    let draft = '';
    let chunkCount = 0;
    let firstChunkAt = 0;
    const startedAt = nowMs();

    try {
      const { reply, meta } = await chat(toApiMessages(requestMessages), {
        smartMode,
        signal: requestController.signal,
        onChunk: (chunk) => {
          if (requestController.signal.aborted) return;
          if (!firstChunkAt) firstChunkAt = nowMs();
          chunkCount += 1;
          draft += chunk;
          setStreamDraft(draft);
        },
      });

      const finalReply = (draft || reply || '').trim() || '(no response)';
      setMessages((prev) => [...prev, createMessage('assistant', finalReply)]);
      setStatus('Ready');

      const source = meta?.source || (smartMode ? 'mock_local' : 'lite_local');
      setRuntimeMode(source);
      setRuntimeReason(
        meta?.fallbackReason || (source === 'live_api'
          ? 'Live API response active.'
          : 'Local response mode active.'),
      );

      const finishedAt = nowMs();
      const latencyMs = Math.max(0, Math.round(finishedAt - startedAt));
      const streamMs = firstChunkAt ? Math.max(0, Math.round(finishedAt - firstChunkAt)) : 0;
      const chars = finalReply.length;

      setTelemetryHistory((prev) => ([
        ...prev.slice(-(TELEMETRY_LIMIT - 1)),
        {
          id: createMessageId(),
          timestamp: Date.now(),
          source,
          latencyMs,
          streamMs,
          chars,
          tokens: estimateTokens(chars),
          chunks: chunkCount,
          streamed: chunkCount > 0,
        },
      ]));
    } catch (error) {
      if (error?.name === 'AbortError') {
        const partialReply = draft.trim();
        if (partialReply) {
          setMessages((prev) => [...prev, createMessage('assistant', `${partialReply}\n\n_(stopped)_`)]);
        }
        setStatus('Stopped');
        setRuntimeReason('Generation stopped by user.');
      } else {
        const message = error?.message || 'Request failed.';
        setErr(message);
        setStatus('Error');
        setMessages((prev) => [...prev, createMessage('assistant', '(generation failed)')]);
        setRuntimeMode('mock_local');
        setRuntimeReason('Request failed. Local fallback mode active.');
      }
    } finally {
      if (activeAbortRef.current === requestController) {
        activeAbortRef.current = null;
      }
      setBusy(false);
      setStreamDraft('');
    }
  };

  const send = (overrideUserText) => {
    requestAssistant({
      text: overrideUserText ?? input,
      appendUser: true,
      baseMessages: messages,
      statusLabel: 'Thinking...',
    });
  };

  const retryLast = () => {
    const lastIndex = messages.length - 1;
    if (lastIndex < 0) return;

    const lastAssistant = messages[lastIndex];
    if (lastAssistant.role !== 'assistant') return;

    const previousUser = findPreviousUser(messages, lastIndex);
    if (!previousUser) return;

    requestAssistant({
      text: previousUser.content,
      appendUser: false,
      baseMessages: messages.slice(0, lastIndex),
      statusLabel: 'Retrying...',
    });
  };

  const regenerateAssistant = (assistantIndex) => {
    const previousUser = findPreviousUser(messages, assistantIndex);
    if (!previousUser) return;

    requestAssistant({
      text: previousUser.content,
      appendUser: false,
      baseMessages: messages.slice(0, assistantIndex),
      statusLabel: 'Regenerating...',
    });
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

  const editAndResend = (text) => {
    if (busy) return;

    setInput(text);
    setEditingFromHistory(true);
    requestAnimationFrame(() => {
      if (!composerRef.current) return;
      composerRef.current.focus();
      const pos = composerRef.current.value.length;
      composerRef.current.setSelectionRange(pos, pos);
    });
  };

  const resetSession = ({ clearStorage = false, reason }) => {
    if (busy) return;

    if (clearStorage && typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      setTelemetryHistory([]);
      setShowTelemetry(false);
    }

    setMessages([createWelcomeMessage()]);
    setInput('');
    setEditingFromHistory(false);
    setBusy(false);
    setStreamDraft('');
    setErr('');
    setStatus('Ready');
    setRuntimeMode('mock_local');
    setRuntimeReason(reason);
  };

  const onNewChat = () => {
    resetSession({
      clearStorage: false,
      reason: 'Started a new chat session.',
    });
  };

  const onClearHistory = () => {
    resetSession({
      clearStorage: true,
      reason: 'Local history cleared.',
    });
  };

  const exportJson = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      smartMode,
      runtimeMode,
      messages,
    };

    const ok = downloadTextFile(
      `ai-chat-export-${Date.now()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json',
    );

    setErr(ok ? 'Exported JSON' : 'Export unavailable in this environment');
    setTimeout(() => setErr(''), 1400);
  };

  const exportMarkdown = () => {
    const ok = downloadTextFile(
      `ai-chat-export-${Date.now()}.md`,
      buildMarkdownExport(messages),
      'text/markdown',
    );

    setErr(ok ? 'Exported Markdown' : 'Export unavailable in this environment');
    setTimeout(() => setErr(''), 1400);
  };

  const onPickExample = (text) => {
    setInput(text);
    setEditingFromHistory(false);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const runQuickAction = (actionId, assistantContent) => {
    requestAssistant({
      text: buildActionPrompt(actionId, assistantContent),
      appendUser: true,
      baseMessages: messages,
      statusLabel: 'Thinking...',
    });
  };

  const runtimeLabel = SOURCE_LABELS[runtimeMode] || 'Mode: Unknown';
  const runtimeTone = SOURCE_TONES[runtimeMode] || 'fallback';

  return (
    <div className="console-page">
      <div className="console-frame">
        <header className="console-hud" aria-label="Session metadata">
          <div className="hud-label">UX CASE STUDY / 001</div>
          <div className="hud-actions">
            <span className="hud-version">v2.4.0</span>
            <span className="hud-build">STABLE BUILD</span>
          </div>
        </header>

        <main className="console-card">
          <section className="console-title">
            <h1>AI Chat <span>Demo</span></h1>
            <p>Designer / Engineer channel - Demo mode with mock AI responses</p>
          </section>

          <StatusBar status={status} smart={smartMode} onToggleSmart={setSmartMode} />

          <section className="console-controls" aria-label="Session controls">
            <div className="console-controls__actions">
              <button type="button" className="console-control-btn" onClick={onNewChat} disabled={busy}>New chat</button>
              <button type="button" className="console-control-btn" onClick={onClearHistory} disabled={busy}>Clear history</button>
              <button type="button" className="console-control-btn" onClick={exportMarkdown} disabled={busy || messages.length <= 1}>Export .md</button>
              <button type="button" className="console-control-btn" onClick={exportJson} disabled={busy || messages.length <= 1}>Export .json</button>
              <button type="button" className="console-control-btn" onClick={() => setShowTelemetry((prev) => !prev)}>
                {showTelemetry ? 'Hide telemetry' : 'Telemetry'}
              </button>
            </div>
            <div className="console-controls__status">
              <span className={`runtime-badge runtime-badge--${runtimeTone}`}>{runtimeLabel}</span>
              <p className="runtime-reason">{runtimeReason}</p>
            </div>
          </section>

          {showTelemetry && telemetrySummary && (
            <section className="telemetry-panel" aria-live="polite" aria-label="Quality telemetry">
              <div className="telemetry-item"><span>Last source</span><strong>{SOURCE_LABELS[telemetrySummary.last.source] || telemetrySummary.last.source}</strong></div>
              <div className="telemetry-item"><span>Last latency</span><strong>{telemetrySummary.last.latencyMs}ms</strong></div>
              <div className="telemetry-item"><span>Last stream</span><strong>{telemetrySummary.last.streamMs}ms</strong></div>
              <div className="telemetry-item"><span>Last chars</span><strong>{telemetrySummary.last.chars}</strong></div>
              <div className="telemetry-item"><span>Last est. tokens</span><strong>{telemetrySummary.last.tokens}</strong></div>
              <div className="telemetry-item"><span>Avg latency</span><strong>{telemetrySummary.avgLatency}ms</strong></div>
              <div className="telemetry-item"><span>Avg chars</span><strong>{telemetrySummary.avgChars}</strong></div>
              <div className="telemetry-item"><span>Samples</span><strong>{telemetrySummary.count}</strong></div>
            </section>
          )}

          <div ref={listRef} className="console-feed" role="log" aria-live="polite" aria-label="Chat messages">
            {messages.length === 1 && (
              <section className="onboarding-panel" aria-label="Starter prompts">
                <p className="onboarding-kicker">Quick launch prompts</p>
                <p className="onboarding-copy">Pick one to start the session.</p>
                <ExampleChips onPick={onPickExample} />
              </section>
            )}

            {messages.map((message, index) => {
              const isAssistant = message.role === 'assistant';
              const previousUser = isAssistant ? findPreviousUser(messages, index) : null;
              const isLatestAssistant = isAssistant && index === messages.length - 1;
              const failedMessage = message.content.includes('failed');

              return (
                <div key={message.id} className={`message-row ${isAssistant ? 'message-row--assistant' : 'message-row--user'}`}>
                  <MessageBubble
                    role={message.role}
                    onRetry={!busy && isLatestAssistant && failedMessage ? retryLast : undefined}
                    onCopy={() => copyText(message.content)}
                    assistantActions={!busy && isLatestAssistant && previousUser && !failedMessage
                      ? [{ id: 'regenerate', label: 'Regenerate', onClick: () => regenerateAssistant(index) }]
                      : []}
                    userActions={[{ id: 'edit-resend', label: 'Edit & Resend', onClick: () => editAndResend(message.content), disabled: busy }]}
                    quickActions={!busy && isLatestAssistant && !failedMessage
                      ? ASSISTANT_QUICK_ACTIONS.map((action) => ({
                        ...action,
                        onClick: () => runQuickAction(action.id, message.content),
                      }))
                      : []}
                    quickActionsDisabled={busy}
                  >
                    {message.content}
                  </MessageBubble>
                </div>
              );
            })}

            {busy && (
              <div className="message-row message-row--assistant">
                {streamDraft ? (
                  <MessageBubble role="assistant" onCopy={() => copyText(streamDraft)}>
                    {streamDraft}
                  </MessageBubble>
                ) : (
                  <div className="typing-shell">
                    <TypingDots />
                  </div>
                )}
              </div>
            )}
          </div>

          <form className="console-composer" onSubmit={(event) => (event.preventDefault(), send())}>
            {editingFromHistory && (
              <p className="composer-hint">Editing previous message. Update text then transmit.</p>
            )}
            <textarea
              ref={composerRef}
              className="console-input"
              rows={2}
              placeholder="Transmit a message... (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Message input"
            />
            <button type="submit" disabled={!input.trim() || busy} className="console-send">
              Transmit
            </button>
            <button type="button" disabled={!busy} className="console-stop" onClick={stopGenerating}>
              Stop
            </button>
          </form>
        </main>

        <footer className="console-footer">
          <div className="footer-block">
            <span className="footer-label">Status</span>
            <span>Encrypted // AES-256</span>
          </div>
          <div className="footer-block">
            <span className="footer-label">Network</span>
            <span>TCP / IP</span>
          </div>
        </footer>
      </div>

      <Toast message={err} kind={status === 'Error' ? 'error' : 'info'} />
    </div>
  );
}
