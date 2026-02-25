export default function Toast({ kind="error", message }) {
  if (!message) return null;
  const color = kind==="error" ? "toast--error" : "toast--info";
  return <div className={`toast ${color}`} role="status" aria-live="polite">{message}</div>;
}
