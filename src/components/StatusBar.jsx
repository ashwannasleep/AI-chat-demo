export default function StatusBar({
  status = { phase: 'idle', message: 'Ready' },
  smart = false,
  onToggleSmart,
}) {
  const color =
    status.phase === 'error'
      ? 'text-red-600'
      : status.phase === 'thinking'
      ? 'text-blue-600'
      : 'text-gray-500';

  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs border-b bg-white rounded-t-2xl">
      <div className="flex items-center gap-3">
        <div className={`font-medium ${color}`} aria-live="polite">
          {status.message}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full border text-[11px] ${
            smart ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-100 text-gray-700 border-gray-200'
          }`}
        >
          {smart ? 'Smart (API)' : 'Demo (local)'}
        </span>
      </div>

      <button
        type="button"
        aria-pressed={smart}
        onClick={() => onToggleSmart?.(!smart)}
        className="inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-50 text-gray-700 border"
      >
        {smart ? 'Switch to Demo' : 'Switch to Smart'}
      </button>
    </div>
  );
}
