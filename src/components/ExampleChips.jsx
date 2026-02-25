const EXAMPLES = [
  "Why do React hooks matter?",
  "What are the UX states for a search form?",
  "Write a developer bio for me",
  "Explain JavaScript closures",
  "How do I improve my UI design?",
];

export default function ExampleChips({ onPick }) {
  return (
    <div className="example-chips">
      {EXAMPLES.map((t) => (
        <button
          key={t}
          onClick={() => onPick(t)}
          type="button"
          className="example-chip"
          aria-label={`Use example: ${t}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
