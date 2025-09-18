export default function StatusBar({ status = "Ready", smart = true, onToggleSmart }) {
  const color = status.includes("Error") ? "text-red-600" : status.includes("Thinking") ? "text-blue-600" : "text-gray-500";
  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs border-b bg-white rounded-t-2xl">
      <div className={`font-medium ${color}`} aria-live="polite">{status}</div>
      <label className="inline-flex items-center gap-2 text-gray-600">
        <input type="checkbox" checked={smart} onChange={(e)=>onToggleSmart?.(e.target.checked)} />
        Smart mode
      </label>
    </div>
  );
}
