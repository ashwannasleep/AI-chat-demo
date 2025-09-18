export default function Toast({ kind="error", message }) {
  if (!message) return null;
  const base = "fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow";
  const color = kind==="error" ? "bg-red-600 text-white" : "bg-gray-800 text-white";
  return <div className={`${base} ${color}`} role="status" aria-live="polite">{message}</div>;
}
