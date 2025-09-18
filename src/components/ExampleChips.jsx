const EXAMPLES = [
  "Summarize: Why React hooks matter?",
  "Give me 3 UX states for a search form.",
  "Draft a one-paragraph bio for a student developer.",
];

export default function ExampleChips({ onPick }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLES.map((t) => (
        <button
          key={t}
          onClick={() => onPick(t)}
          className="px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm border"
          aria-label={`Use example: ${t}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
