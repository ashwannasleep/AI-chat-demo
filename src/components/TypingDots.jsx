export default function TypingDots({ label = "Assistant is typing" }) {
  return (
    <div className="typing-dots" aria-live="polite" aria-label={label}>
      <span className="typing-dot typing-dot--one"></span>
      <span className="typing-dot typing-dot--two"></span>
      <span className="typing-dot typing-dot--three"></span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
