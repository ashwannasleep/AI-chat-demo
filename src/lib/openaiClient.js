const templates = {
  checkout: `Summary: tighten payment flow; keep users informed and safe.
• Missing states: empty cart helpers, payment skeletons, address lookup loading, 3DS/auth step
• UX recs: inline field errors with focus, persist cart/promo, show totals while loading, receipt with retry for partial fails
• Copy tweak: “We’re processing your payment—stay on this page” near the button
• Next step: paste your payment form fields and error copy; I’ll rewrite them`,
  search: `Summary: keep users oriented while searching and failing gracefully.
• Missing states: empty guidance (filters/examples), loading skeleton + active filters, no-results with refine hints, rate-limit/timeout
• UX recs: keep query in input, debounce w/ visual feedback, “clear filters” affordance, sticky sort/filter chips
• Copy tweak: “No results for X. Try fewer filters or a broader term.”
• Next step: share your current empty/no-results UI; I’ll draft improved copy/layout`,
  onboarding: `Summary: smooth first run with progress and recovery.
• Missing states: empty dashboard placeholder, progressive loading for stats, offline/slow-state, skip/“do later” for steps
• UX recs: checklist with completion %, save-as-draft, prefill defaults, celebrate completion with next best action
• Copy tweak: “Almost there—finish profile to unlock reminders. You can save and finish later.”
• Next step: list your onboarding steps; I’ll map the states and copy per step`,
  chat: `Summary: streaming UX with resilient error handling.
• Missing states: first-time tips, slow/streaming indicator, model error w/ retry, rate-limit/backoff notice
• UX recs: keep input on errors, allow resending last message, show citations/ids near responses, copy button per message
• Copy tweak: “We hit a snag. Your last message is saved—try again or switch to Demo mode.”
• Next step: tell me which states you show today; I’ll add missing ones with copy`,
  form: `Summary: preserve work and guide fixes.
• Missing states: empty defaults/hints, per-field loading (lookups), offline draft, partial save vs submit
• UX recs: inline errors on blur, summary at top after submit, preserve input on retry, autosave each section
• Copy tweak: “We saved your progress. Fix the highlighted fields and submit again.”
• Next step: share a sample field with its errors; I’ll rewrite the UX/copy`,
};

function pickTemplate(text) {
  const t = (text || '').toLowerCase();
  if (/(checkout|cart|payment|order)/.test(t)) return templates.checkout;
  if (/(search|results|filters)/.test(t)) return templates.search;
  if (/(onboarding|signup|sign[- ]up|profile)/.test(t)) return templates.onboarding;
  if (/(chat|conversation|assistant|stream)/.test(t)) return templates.chat;
  if (/(form|input|fields)/.test(t)) return templates.form;
  return `UX state review:
• Missing states: onboarding/empty guidance, loading skeletons, retries with preserved input, no-results/helpful defaults
• UX recs: show what’s happening, keep user input on errors, add clear recovery (retry/cancel/save), log states for debugging
• Copy tweak: “We saved your progress. You can retry now or edit and submit again.”
• Next step: tell me the screen and target audience; I’ll tailor states + copy for it`;
}

// Local demo transport
export async function chat(messages) {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();
  const text = lastUserMessage?.content || '';
  const reply = pickTemplate(text);
  return { reply };
}

// API transport
export async function chatWithAPI(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error || `API error (${res.status})`;
    throw new Error(msg);
  }
  return body;
}
