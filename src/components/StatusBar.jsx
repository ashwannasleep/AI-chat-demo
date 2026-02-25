export default function StatusBar({ status = "Ready", smart = true, onToggleSmart }) {
  const tone = status.includes("Error")
    ? "status-pill--error"
    : status.includes("Thinking")
      ? "status-pill--thinking"
      : "status-pill--ready";

  return (
    <div className="status-bar">
      <div className={`status-pill ${tone}`} aria-live="polite">{status}</div>
      <label className="status-toggle">
        <input
          className="status-toggle__input"
          type="checkbox"
          checked={smart}
          onChange={(e) => onToggleSmart?.(e.target.checked)}
        />
        <span className="status-toggle__label">Smart mode</span>
      </label>
    </div>
  );
}
