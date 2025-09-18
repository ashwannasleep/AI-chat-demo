const EXAMPLES = [
  "Why do React hooks matter?",
  "What are the UX states for a search form?",
  "Write a developer bio for me",
  "Explain JavaScript closures",
  "How do I improve my UI design?",
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
