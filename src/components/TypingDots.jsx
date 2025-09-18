export default function TypingDots({ label = "Assistant is typing" }) {
  return (
    <div className="inline-flex items-center gap-1 text-gray-500 text-sm" aria-live="polite" aria-label={label}>
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]"></span>
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0s]"></span>
      <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:0.2s]"></span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
