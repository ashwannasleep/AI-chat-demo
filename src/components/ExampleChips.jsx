const EXAMPLES = [
  "Audit UX states for a checkout flow (empty, loading, error, retry)",
  "What UX states are missing in a search results page?",
  "Critique onboarding UX for a habit tracker app",
  "Review this chat UI: what states are missing for streaming + retry?",
  "Design failure and recovery states for a payment form",
];

export default function ExampleChips({ onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLES.map((t) => (
        <button
          key={t}
          onClick={() => onPick(t)}
          className="
            px-3 py-1
            rounded-full
            bg-gray-100
            hover:bg-gray-200
            text-gray-800
            text-sm
            border
            transition
          "
          aria-label={`Use example: ${t}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
