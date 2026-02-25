import OpenAI from 'openai';

const SMART_DELAY_MIN = 550;
const SMART_DELAY_RANGE = 800;
const LITE_DELAY_MIN = 240;
const LITE_DELAY_RANGE = 260;
const STREAM_DELAY_MIN = 18;
const STREAM_DELAY_RANGE = 66;
const SERVER_JSON_TIMEOUT_MS = 2200;
const SERVER_STREAM_TIMEOUT_MS = 12000;

const SERVER_DEMO_MARKERS = [
  'demo mode',
  'demo response',
  'needs an api key',
  'running in demo mode',
];

const TOPIC_GUIDES = [
  {
    id: 'react-hooks',
    triggers: ['react hooks', 'react hook', 'hooks', 'usestate', 'useeffect', 'usememo', 'usecallback', 'useref'],
    summary: 'React hooks make stateful logic reusable in function components with less boilerplate.',
    why: [
      'They keep UI and behavior close together, so components are easier to read.',
      'Custom hooks let you share logic across features without wrapper hell.',
      'They make side effects explicit, which helps reasoning and testing.',
    ],
    steps: [
      'Use `useState` for local UI state and keep it minimal.',
      'Use `useEffect` only for real side effects, not pure calculations.',
      'Extract repeating logic into custom hooks with clear input and output.',
      'Add `useMemo` and `useCallback` only after profiling, not preemptively.',
    ],
    mistakes: [
      'Putting derived values in state instead of computing from source state.',
      'Missing dependencies in effects and then fighting stale closures.',
      'Using hooks conditionally, which breaks hook order.',
    ],
    snippetLang: 'jsx',
    snippet: [
      'function useDebouncedValue(value, delay = 250) {',
      '  const [debounced, setDebounced] = useState(value);',
      '',
      '  useEffect(() => {',
      '    const id = setTimeout(() => setDebounced(value), delay);',
      '    return () => clearTimeout(id);',
      '  }, [value, delay]);',
      '',
      '  return debounced;',
      '}',
    ].join('\n'),
    followUps: [
      'Share one component and I can suggest a cleaner hook split.',
      'If you want, I can explain `useEffect` dependency rules with a concrete bug example.',
      'I can also review when `useMemo` is worth it and when it is noise.',
    ],
  },
  {
    id: 'react-architecture',
    triggers: ['react', 'component', 'jsx', 'frontend', 'state management'],
    summary: 'Strong React architecture is mostly about state boundaries, composition, and predictable data flow.',
    why: [
      'Good boundaries reduce accidental coupling and re-render chains.',
      'Composition keeps features flexible without huge monolithic components.',
      'Predictable flow makes debugging and onboarding much faster.',
    ],
    steps: [
      'Split UI into small presentational pieces and container logic.',
      'Keep state as close as possible to where it is used.',
      'Promote shared state only when two siblings truly need it.',
      'Create focused hooks per concern: data, view model, and side effects.',
    ],
    mistakes: [
      'Global state for everything before local state has been exhausted.',
      'Huge components mixing API calls, UI layout, and business rules.',
      'Passing many props down multiple levels instead of regrouping structure.',
    ],
    snippetLang: 'jsx',
    snippet: [
      'function ProductPage() {',
      '  const vm = useProductViewModel();',
      '  return (',
      '    <>',
      '      <ProductHeader product={vm.product} />',
      '      <ProductFilters value={vm.filters} onChange={vm.setFilters} />',
      '      <ProductGrid items={vm.filteredItems} />',
      '    </>',
      '  );',
      '}',
    ].join('\n'),
    followUps: [
      'Drop your current component tree and I can suggest a refactor plan.',
      'I can propose a file structure for this feature in 5 minutes.',
      'Want a state placement checklist you can use on every screen?',
    ],
  },
  {
    id: 'javascript',
    triggers: ['javascript', 'js', 'closure', 'promise', 'async', 'await', 'event loop'],
    summary: 'Modern JavaScript is easiest when you reason about scope, async flow, and data immutability.',
    why: [
      'Closures are the foundation behind callbacks, hooks, and modules.',
      'Async control flow affects reliability, user experience, and error handling.',
      'Immutable updates make behavior easier to reason about over time.',
    ],
    steps: [
      'Model async work as explicit states: idle, loading, success, error.',
      'Use `async/await` with `try/catch` around network boundaries.',
      'Keep functions pure where possible and isolate side effects.',
      'Write small utilities for repeated transforms instead of inline chains.',
    ],
    mistakes: [
      'Mixing callbacks, promises, and async style in one flow.',
      'Ignoring rejection paths and assuming happy path execution.',
      'Mutating shared objects and then chasing weird UI behavior.',
    ],
    snippetLang: 'js',
    snippet: [
      'async function loadProfile(id) {',
      '  try {',
      '    const res = await fetch(`/api/users/${id}`);',
      '    if (!res.ok) throw new Error(`HTTP ${res.status}`);',
      '    return await res.json();',
      '  } catch (err) {',
      '    throw new Error(`Failed to load profile: ${err.message}`);',
      '  }',
      '}',
    ].join('\n'),
    followUps: [
      'If you paste your code, I can point out closure and async pitfalls directly.',
      'Want a quick visual model of the event loop for interviews?',
      'I can also turn a callback-style function into clean async/await.',
    ],
  },
  {
    id: 'ux-ui',
    triggers: ['ux', 'ui', 'design', 'user experience', 'search form', 'states', 'onboarding'],
    summary: 'Great UX comes from clear states, fast feedback, and reducing user decisions.',
    why: [
      'Users feel in control when the system always shows what is happening.',
      'State clarity reduces confusion and support requests.',
      'Consistent patterns make complex tasks feel simple.',
    ],
    steps: [
      'Define explicit empty, loading, success, no-result, and error states.',
      'Make each state actionable: show next step, not just status.',
      'Prioritize readability and hierarchy before decorative details.',
      'Validate flows on mobile first to catch friction early.',
    ],
    mistakes: [
      'Designing only happy path and ignoring edge cases.',
      'Error messages that explain the problem but not recovery.',
      'Overusing animation where contrast and spacing should do the work.',
    ],
    snippetLang: 'txt',
    snippet: [
      'Search states checklist:',
      '- Empty: examples + popular searches',
      '- Loading: skeleton + cancel option',
      '- Results: sort, filter, and scan-friendly cards',
      '- No results: suggestions + reset filters',
      '- Error: clear reason + retry action',
    ].join('\n'),
    followUps: [
      'I can critique one of your screens and give concrete UX fixes.',
      'Want a UX acceptance checklist for QA and design handoff?',
      'I can help you rewrite microcopy for loading/no-result/error states.',
    ],
  },
  {
    id: 'accessibility',
    triggers: ['a11y', 'accessibility', 'wcag', 'screen reader', 'aria', 'keyboard'],
    summary: 'Accessibility is mostly robust semantics, keyboard support, and predictable focus behavior.',
    why: [
      'Accessible interactions improve usability for everyone, not only assistive users.',
      'Semantic markup reduces custom code and long-term maintenance cost.',
      'It protects product quality by catching interaction edge cases early.',
    ],
    steps: [
      'Use semantic HTML first, then add ARIA only when needed.',
      'Ensure full keyboard flow for all interactive actions.',
      'Make focus visible and keep focus order consistent with visual order.',
      'Test with a screen reader for key journeys, not only automated scans.',
    ],
    mistakes: [
      'Clickable divs without keyboard and role semantics.',
      'Color-only status indicators without text or icon cues.',
      'Focus trap issues in modals and overlays.',
    ],
    snippetLang: 'jsx',
    snippet: [
      '<button',
      '  type="button"',
      '  aria-expanded={open}',
      '  aria-controls="faq-panel"',
      '  onClick={() => setOpen(!open)}',
      '>',
      '  Toggle details',
      '</button>',
    ].join('\n'),
    followUps: [
      'I can review one component for a11y gaps line by line.',
      'Want a lightweight accessibility checklist for pull requests?',
      'I can help you fix keyboard navigation on your current page.',
    ],
  },
  {
    id: 'testing',
    triggers: ['test', 'testing', 'unit test', 'integration', 'vitest', 'jest', 'coverage'],
    summary: 'Good tests protect behavior, not implementation details.',
    why: [
      'Behavior-based tests survive refactors while keeping confidence high.',
      'Integration tests catch wiring issues unit tests miss.',
      'Fast feedback loops reduce fear when changing code.',
    ],
    steps: [
      'Start with user-visible behavior and critical flows.',
      'Write unit tests for pure logic and edge-case transforms.',
      'Add integration tests where state and network interactions meet.',
      'Use mocks sparingly and keep assertions outcome-focused.',
    ],
    mistakes: [
      'Testing component internals that users never interact with.',
      'Snapshot-heavy suites with low signal and high churn.',
      'Ignoring failure-path coverage for network and parsing logic.',
    ],
    snippetLang: 'jsx',
    snippet: [
      "test('submits message on Enter', async () => {",
      '  render(<App />);',
      "  await user.type(screen.getByLabelText(/message input/i), 'hello{enter}');",
      "  expect(await screen.findByRole('group', { name: /user message/i })).toBeInTheDocument();",
      '});',
    ].join('\n'),
    followUps: [
      'I can suggest a balanced test pyramid for your project.',
      'If you share a flaky test, I can help stabilize it.',
      'Want a practical list of high-value tests for chat apps?',
    ],
  },
  {
    id: 'performance',
    triggers: ['performance', 'slow', 'optimize', 'lag', 'bundle', 'render'],
    summary: 'Performance work should start with measurement, then target the biggest bottleneck.',
    why: [
      'Guessing causes premature optimization and complexity.',
      'Measured fixes improve both speed and maintainability.',
      'A few targeted changes usually beat broad rewrites.',
    ],
    steps: [
      'Measure first: browser profiler, network waterfall, and Web Vitals.',
      'Reduce unnecessary renders by fixing state ownership.',
      'Split heavy bundles and lazy-load low-priority features.',
      'Optimize expensive loops and avoid repeated parsing work.',
    ],
    mistakes: [
      'Adding memoization everywhere without profiling evidence.',
      'Overfetching data and then filtering huge arrays client-side.',
      'Loading full libraries for one small utility use case.',
    ],
    snippetLang: 'jsx',
    snippet: [
      'const FilteredList = memo(function FilteredList({ items, query }) {',
      '  const visible = useMemo(() => {',
      '    const q = query.toLowerCase();',
      '    return items.filter((item) => item.name.toLowerCase().includes(q));',
      '  }, [items, query]);',
      '',
      '  return <List items={visible} />;',
      '});',
    ].join('\n'),
    followUps: [
      'Share a profiler screenshot and I can suggest high-impact fixes.',
      'I can help trim your bundle and identify biggest chunks.',
      'Want a step-by-step plan for faster initial load?',
    ],
  },
  {
    id: 'backend-api',
    triggers: ['api', 'backend', 'server', 'endpoint', 'node', 'express', 'auth', 'database'],
    summary: 'Reliable APIs focus on clear contracts, validation, and predictable error handling.',
    why: [
      'Contracts reduce ambiguity between frontend and backend teams.',
      'Validation keeps bad input from becoming production incidents.',
      'Consistent errors make retries and debugging much easier.',
    ],
    steps: [
      'Define request and response schemas before implementation.',
      'Validate input at the edge and return meaningful error codes.',
      'Use structured logs with request IDs for traceability.',
      'Handle retries and timeouts explicitly for external dependencies.',
    ],
    mistakes: [
      'Returning different error shapes across endpoints.',
      'Leaking internal stack traces in API responses.',
      'Skipping idempotency for retried write operations.',
    ],
    snippetLang: 'js',
    snippet: [
      "app.post('/api/messages', async (req, res) => {",
      '  const { text } = req.body ?? {};',
      "  if (typeof text !== 'string' || !text.trim()) {",
      "    return res.status(400).json({ error: 'text is required' });",
      '  }',
      '',
      '  const item = await storeMessage(text.trim());',
      '  return res.status(201).json({ id: item.id, text: item.text });',
      '});',
    ].join('\n'),
    followUps: [
      'If you share your endpoint spec, I can review it for edge cases.',
      'I can help you design consistent error contracts.',
      'Want a practical API checklist for production readiness?',
    ],
  },
  {
    id: 'career-writing',
    triggers: ['bio', 'about me', 'introduction', 'resume', 'portfolio', 'linkedin'],
    summary: 'Strong developer bios are concrete, specific, and outcome-driven.',
    why: [
      'Specific outcomes make your profile memorable and credible.',
      'Clear role focus helps recruiters quickly match you to positions.',
      'A compact narrative is easier to reuse across portfolio and LinkedIn.',
    ],
    steps: [
      'Lead with role, years, and domain in one sentence.',
      'Add 2-3 concrete results with metrics where possible.',
      'Mention stack only after impact and business context.',
      'Close with what roles or projects you are targeting next.',
    ],
    mistakes: [
      'Listing tools without outcomes or product context.',
      'Writing a generic statement that could fit anyone.',
      'Using very broad claims without evidence.',
    ],
    snippetLang: 'txt',
    snippet: [
      'Template:',
      'I am a [role] with [years] years building [product/domain].',
      'Recently I [result 1 with metric] and [result 2 with metric].',
      'My core stack is [tech], and I focus on [strength].',
      'I am currently looking for [target role/project].',
    ].join('\n'),
    followUps: [
      'Share your current bio and I will rewrite it in your voice.',
      'I can tailor one version for recruiters and one for engineers.',
      'Want a short and long version you can reuse everywhere?',
    ],
  },
];

function normalize(text = '') {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hashString(input = '') {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pick(options, seed) {
  if (!Array.isArray(options) || options.length === 0) return '';
  return options[hashString(String(seed)) % options.length];
}

function extractUserMessages(messages) {
  return messages.filter((item) => item.role === 'user').map((item) => item.content ?? '');
}

function isGreeting(message) {
  return /^(hi|hello|hey|yo|sup)\b/.test(message);
}

function isTimeQuestion(message) {
  return /\b(time|what time|current time)\b/.test(message);
}

function isWeatherQuestion(message) {
  return /\b(weather|temperature|rain|forecast)\b/.test(message);
}

function isFollowUpPrompt(message) {
  return (
    message.length < 80 ||
    /\b(more|deeper|detail|example|snippet|continue|elaborate|expand|that one)\b/.test(message)
  );
}

function detectIntent(message) {
  if (/\b(vs|versus|difference|compare|tradeoff|pros and cons)\b/.test(message)) return 'compare';
  if (/\b(why|matter|benefit|reason)\b/.test(message)) return 'why';
  if (/\b(debug|fix|broken|error|issue|bug)\b/.test(message)) return 'debug';
  if (/\b(example|sample|snippet|code)\b/.test(message)) return 'example';
  if (/\b(how|steps|implement|build|create|setup)\b/.test(message)) return 'how';
  return 'general';
}

function detectTopic(message) {
  let bestGuide = null;
  let bestScore = 0;

  TOPIC_GUIDES.forEach((guide) => {
    const score = guide.triggers.reduce((acc, trigger) => {
      if (!message.includes(trigger)) return acc;
      return acc + (trigger.includes(' ') ? 2 : 1);
    }, 0);

    if (score > bestScore) {
      bestGuide = guide;
      bestScore = score;
    }
  });

  return bestGuide;
}

function resolveTopic(message, messages) {
  const directTopic = detectTopic(message);
  if (directTopic) return directTopic;

  if (!isFollowUpPrompt(message)) return null;

  const history = extractUserMessages(messages).slice(-6, -1).join(' ');
  if (!history) return null;
  return detectTopic(normalize(history));
}

function formatBulletList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function formatOrderedList(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function buildCodeBlock(language, content) {
  return [`\`\`\`${language ?? ''}`.trim(), content, '```'].join('\n');
}

function extractComparePair(message) {
  const match = message.match(/(.+?)\s+(?:vs|versus)\s+(.+)/i);
  if (!match) return null;

  const left = match[1].replace(/^(which|what|should i use|compare)\s+/i, '').trim();
  const right = match[2].replace(/\?+$/, '').trim();
  if (!left || !right) return null;
  return [left, right];
}

function buildTimeReply() {
  const now = new Date();
  const time = now.toLocaleTimeString();
  const date = now.toLocaleDateString();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return [
    `Current time: **${time}**`,
    `Date: **${date} (${weekday})**`,
    `Timezone: **${timezone}**`,
  ].join('\n\n');
}

function buildWeatherReply() {
  return [
    'I cannot fetch live weather in local demo mode.',
    'For a real forecast use one of these:',
    '- Weather app (Weather.com, AccuWeather, Apple Weather)',
    '- Voice assistant query for your city',
    '- Web search for `weather + your city`',
  ].join('\n\n');
}

function buildGreetingReply(seed) {
  const opener = pick(
    [
      'Ready when you are.',
      'Session online.',
      'Good to go.',
    ],
    seed,
  );

  return [
    `${opener} Ask me technical, product, or career questions and I will answer with concrete steps.`,
    '### I can help with',
    '- React and JavaScript architecture',
    '- UX/UI decisions and state design',
    '- Testing, debugging, and performance',
    '- API/backend design basics',
    '- Portfolio and developer bio writing',
    'Try: `How should I structure state for this component?`',
  ].join('\n\n');
}

function buildBioReply(seed) {
  const starter = pick(
    [
      'Use this structure for a strong developer bio:',
      'Here is a practical bio framework:',
      'A reliable bio template looks like this:',
    ],
    seed,
  );

  return [
    starter,
    '1. Role + years + domain in one line.',
    '2. Two concrete outcomes with metrics.',
    '3. Core stack and strengths.',
    '4. What roles or projects you are targeting.',
    '### Example',
    buildCodeBlock(
      'txt',
      [
        'I am a frontend engineer with 3 years building SaaS products.',
        'Recently I reduced checkout drop-off by 18% and improved Lighthouse performance from 62 to 91.',
        'My core stack is React, TypeScript, and Node.js, with a focus on UX quality and maintainable UI architecture.',
        'I am currently looking for product-focused frontend roles where I can own user-facing features end to end.',
      ].join('\n'),
    ),
    'If you share your current draft, I can rewrite it in your voice.',
  ].join('\n\n');
}

function buildCompareReply(left, right, seed) {
  const header = pick(
    [
      `Quick compare: **${left}** vs **${right}**`,
      `Short breakdown: **${left}** vs **${right}**`,
      `Decision frame for **${left}** vs **${right}**`,
    ],
    seed,
  );

  return [
    header,
    '### Evaluate on',
    '- Team familiarity and hiring market',
    '- Ecosystem maturity and required libraries',
    '- Runtime and performance constraints',
    '- Deployment model and infrastructure fit',
    '- Long-term maintenance cost',
    '### Decision shortcut',
    `Pick **${left}** if it gives faster delivery with your current team.`,
    `Pick **${right}** if it better matches your product constraints over 12+ months.`,
    'If you share your exact project context, I can give a direct recommendation.',
  ].join('\n\n');
}

function buildGuideReply(guide, intent, rawMessage) {
  const intro = pick(
    [
      `Great topic. ${guide.summary}`,
      `Solid question. ${guide.summary}`,
      `Useful direction. ${guide.summary}`,
    ],
    `${guide.id}:${rawMessage}`,
  );

  const wantsExample = intent === 'example' || /\b(example|snippet|code|sample)\b/.test(normalize(rawMessage));

  const blocks = [intro];

  if (intent === 'why') {
    blocks.push('### Why it matters');
    blocks.push(formatBulletList(guide.why));
  } else if (intent === 'debug') {
    blocks.push('### Debug checklist');
    blocks.push(formatOrderedList(guide.steps));
  } else {
    blocks.push('### Practical approach');
    blocks.push(formatOrderedList(guide.steps));
  }

  blocks.push('### Common mistakes');
  blocks.push(formatBulletList(guide.mistakes));

  if (wantsExample && guide.snippet) {
    blocks.push('### Example');
    blocks.push(buildCodeBlock(guide.snippetLang, guide.snippet));
  }

  blocks.push('### Next step');
  blocks.push(pick(guide.followUps, `${rawMessage}:${guide.id}`));

  return blocks.join('\n\n');
}

function buildIntentFallback(rawMessage, intent) {
  const cleanMessage = rawMessage.trim().replace(/\s+/g, ' ');

  if (intent === 'how') {
    return [
      `Here is a practical way to approach: **${cleanMessage}**`,
      '1. Define the success criteria first.',
      '2. Break the task into smallest working milestones.',
      '3. Implement one milestone and validate quickly.',
      '4. Add error handling and edge cases.',
      '5. Refactor only after behavior is correct.',
      'If you share your stack and constraints, I can turn this into a specific plan.',
    ].join('\n\n');
  }

  if (intent === 'why') {
    return [
      `Why this matters for **${cleanMessage}**:`,
      '- It affects delivery speed and bug rate.',
      '- It influences maintainability over time.',
      '- It impacts user trust and product quality.',
      'If you want, I can map this to your current project decisions.',
    ].join('\n\n');
  }

  if (intent === 'debug') {
    return [
      `Debug path for **${cleanMessage}**:`,
      '1. Reproduce reliably with minimal steps.',
      '2. Isolate the failing layer (UI, state, API, data).',
      '3. Add targeted logging around input and output.',
      '4. Patch with a test that catches the regression.',
      'Paste the error and related code and I can troubleshoot line by line.',
    ].join('\n\n');
  }

  return [
    `I got your question: **${cleanMessage}**`,
    'Give me one of these and I can give a sharper answer:',
    '- Your goal and deadline',
    '- Tech stack and constraints',
    '- Current code or error message',
    '- What you already tried',
  ].join('\n\n');
}

function generateSmartResponse(userMessage, messages) {
  const raw = userMessage.trim();
  const message = normalize(raw);

  if (!message) {
    return 'Send a question and I will give you a concrete answer.';
  }

  if (isGreeting(message)) return buildGreetingReply(raw);
  if (isTimeQuestion(message)) return buildTimeReply();
  if (isWeatherQuestion(message)) return buildWeatherReply();

  const comparePair = extractComparePair(raw);
  if (comparePair) return buildCompareReply(comparePair[0], comparePair[1], raw);

  if (/\b(bio|about me|introduction|linkedin|portfolio)\b/.test(message)) {
    return buildBioReply(raw);
  }

  const intent = detectIntent(message);
  const guide = resolveTopic(message, messages);
  if (guide) return buildGuideReply(guide, intent, raw);

  return buildIntentFallback(raw, intent);
}

function generateLiteResponse(userMessage, messages) {
  const message = normalize(userMessage);
  const guide = resolveTopic(message, messages);

  if (guide) {
    return `${guide.summary}\n\nTurn on Smart mode and ask "how", "why", or "show code" for a deeper answer.`;
  }

  return [
    `I heard: "${userMessage.trim()}".`,
    'Ask a specific how/why question for a stronger answer.',
  ].join('\n\n');
}

function makeAbortError() {
  const error = new Error('Generation stopped by user.');
  error.name = 'AbortError';
  return error;
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw makeAbortError();
}

function waitWithAbort(ms, signal) {
  if (!signal) return new Promise((resolve) => setTimeout(resolve, ms));

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener('abort', onAbort);
      reject(makeAbortError());
    };

    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function createTimeoutSignal(timeoutMs, externalSignal) {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) externalSignal.addEventListener('abort', onExternalAbort, { once: true });

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      clearTimeout(timeoutId);
      if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
    },
  };
}

function isDemoReplyText(reply) {
  const normalizedReply = normalize(reply);
  return SERVER_DEMO_MARKERS.some((marker) => normalizedReply.includes(marker));
}

function buildStreamChunks(text) {
  if (!text) return [];

  const tokens = text.split(/(\s+)/).filter(Boolean);
  const chunks = [];
  let current = '';
  let wordCount = 0;
  let nextWordLimit = 2 + Math.floor(Math.random() * 4);

  tokens.forEach((token) => {
    current += token;
    if (/\S/.test(token)) wordCount += 1;

    const trimmed = token.trim();
    const hardBoundary = token.includes('\n') || /[.!?:]$/.test(trimmed);
    if (hardBoundary || wordCount >= nextWordLimit) {
      chunks.push(current);
      current = '';
      wordCount = 0;
      nextWordLimit = 2 + Math.floor(Math.random() * 4);
    }
  });

  if (current) chunks.push(current);
  return chunks;
}

async function streamTextLocally(text, onChunk, smartMode, signal) {
  if (typeof onChunk !== 'function') return;
  throwIfAborted(signal);

  const chunks = buildStreamChunks(text);
  const leadDelay = smartMode ? 130 : 75;

  await waitWithAbort(leadDelay, signal);

  for (const chunk of chunks) {
    throwIfAborted(signal);
    await waitWithAbort(STREAM_DELAY_MIN + Math.random() * STREAM_DELAY_RANGE, signal);
    onChunk(chunk);
  }
}

function toServerMessages(messages) {
  return messages
    .filter((item) => item && typeof item.content === 'string')
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content,
    }));
}

async function tryServerChat(messages, smartMode, signal) {
  const timeoutSignal = createTimeoutSignal(SERVER_JSON_TIMEOUT_MS, signal);

  try {
    throwIfAborted(signal);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: toServerMessages(messages),
        smartMode,
        qualityMode: smartMode,
      }),
      signal: timeoutSignal.signal,
    });

    if (!res.ok) {
      return { reply: null, reason: `Live API error (${res.status}).` };
    }

    const data = await res.json();
    const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
    if (!reply) return { reply: null, reason: 'Live API returned an empty response.' };
    if (isDemoReplyText(reply)) {
      return { reply: null, reason: 'Server is in demo mode (missing API key).' };
    }

    return { reply };
  } catch (error) {
    if (signal?.aborted) throw makeAbortError();
    if (error?.name === 'AbortError' && timeoutSignal.didTimeout()) {
      return { reply: null, reason: 'Live API timeout. Using local fallback.' };
    }
    return { reply: null, reason: 'Live API unavailable. Using local fallback.' };
  } finally {
    timeoutSignal.cleanup();
  }
}

async function tryServerChatStream(messages, smartMode, onChunk, signal) {
  const timeoutSignal = createTimeoutSignal(SERVER_STREAM_TIMEOUT_MS, signal);
  let reply = '';

  try {
    throwIfAborted(signal);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        messages: toServerMessages(messages),
        stream: true,
        smartMode,
        qualityMode: smartMode,
      }),
      signal: timeoutSignal.signal,
    });

    if (!res.ok) {
      return { reply: null, reason: `Live API stream error (${res.status}).` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream') || !res.body) {
      const data = await res.json();
      const fallbackReply = typeof data?.reply === 'string' ? data.reply.trim() : '';
      if (!fallbackReply) return { reply: null, reason: 'Live API returned no content.' };
      if (isDemoReplyText(fallbackReply)) {
        return { reply: null, reason: 'Server is in demo mode (missing API key).' };
      }
      await streamTextLocally(fallbackReply, onChunk, true, signal);
      return { reply: fallbackReply };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let done = false;

    while (!done) {
      throwIfAborted(signal);
      const { value, done: readerDone } = await reader.read();
      if (readerDone) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r/g, '');

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const packet = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        let event = 'message';
        let data = '';
        packet.split('\n').forEach((line) => {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          if (line.startsWith('data:')) data += line.slice(5).trim();
        });

        let payload = data;
        try {
          payload = JSON.parse(data);
        } catch {
          // keep plain text payload for compatibility
        }

        if (event === 'chunk') {
          const chunk = typeof payload === 'string' ? payload : payload?.chunk;
          if (chunk) {
            reply += chunk;
            onChunk?.(chunk);
          }
        }

        if (event === 'error') {
          if (!reply) throw new Error(typeof payload === 'string' ? payload : payload?.message);
          done = true;
          break;
        }

        if (event === 'done') {
          done = true;
          break;
        }

        boundary = buffer.indexOf('\n\n');
      }
    }

    if (!reply.trim()) return { reply: null, reason: 'Live API stream ended with empty output.' };
    if (isDemoReplyText(reply)) return { reply: null, reason: 'Server is in demo mode (missing API key).' };
    return { reply };
  } catch (error) {
    if (signal?.aborted) throw makeAbortError();
    if (error?.name === 'AbortError' && timeoutSignal.didTimeout()) {
      return { reply: reply.trim() || null, reason: 'Live API stream timeout. Using local fallback.' };
    }
    if (reply.trim()) return { reply };
    return { reply: null, reason: 'Live API stream unavailable. Using local fallback.' };
  } finally {
    timeoutSignal.cleanup();
  }
}

export async function chat(messages, options = {}) {
  const { smartMode = true, onChunk, signal } = options;
  const userMessages = extractUserMessages(messages);
  const userText = userMessages[userMessages.length - 1] ?? '';
  const streaming = typeof onChunk === 'function';
  let fallbackReason = '';

  throwIfAborted(signal);

  if (smartMode) {
    if (streaming) {
      const streamedReply = await tryServerChatStream(messages, smartMode, onChunk, signal);
      if (streamedReply?.reply) {
        return {
          reply: streamedReply.reply,
          meta: {
            source: 'live_api',
            streamed: true,
            qualityMode: true,
            fallbackReason: '',
          },
        };
      }
      fallbackReason = streamedReply?.reason || fallbackReason;
    } else {
      const serverReply = await tryServerChat(messages, smartMode, signal);
      if (serverReply?.reply) {
        return {
          reply: serverReply.reply,
          meta: {
            source: 'live_api',
            streamed: false,
            qualityMode: true,
            fallbackReason: '',
          },
        };
      }
      fallbackReason = serverReply?.reason || fallbackReason;
    }
  }

  const reply = smartMode
    ? generateSmartResponse(userText, messages)
    : generateLiteResponse(userText, messages);

  if (streaming) {
    await streamTextLocally(reply, onChunk, smartMode, signal);
    return {
      reply,
      meta: {
        source: smartMode ? 'mock_local' : 'lite_local',
        streamed: true,
        qualityMode: smartMode,
        fallbackReason: smartMode
          ? (fallbackReason || 'Live API unavailable. Using local smart fallback.')
          : 'Smart mode disabled. Using local lite mode.',
      },
    };
  }

  const delay = smartMode
    ? SMART_DELAY_MIN + Math.random() * SMART_DELAY_RANGE
    : LITE_DELAY_MIN + Math.random() * LITE_DELAY_RANGE;

  await waitWithAbort(delay, signal);

  return {
    reply,
    meta: {
      source: smartMode ? 'mock_local' : 'lite_local',
      streamed: false,
      qualityMode: smartMode,
      fallbackReason: smartMode
        ? (fallbackReason || 'Live API unavailable. Using local smart fallback.')
        : 'Smart mode disabled. Using local lite mode.',
    },
  };
}

// Server-side API approach (for production with API key)
export async function chatWithAPI(messages, options = {}) {
  const { smartMode = true, stream = false, signal } = options;
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages: toServerMessages(messages),
      smartMode,
      qualityMode: smartMode,
      stream,
    }),
    signal,
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
