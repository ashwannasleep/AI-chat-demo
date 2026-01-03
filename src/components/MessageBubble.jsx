export default function MessageBubble({ id, role, status = 'done', children, onRetry, onCopy }) {
  const mine = role === 'user';
  return (
    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed shadow relative
      ${mine ? 'bg-blue-600 text-white self-end' : 'bg-gray-100 text-gray-900 self-start'}`}
      id={id}
      role="group"
      aria-label={mine ? 'User message' : `Assistant message${status === 'error' ? ', failed' : ''}`}>
      {children}
      {!mine && (
        <div className="absolute -right-2 -bottom-7 flex gap-2">
          {onRetry && <button className="text-xs px-2 py-1 rounded bg-white border hover:bg-gray-50" onClick={onRetry}>Retry</button>}
          <button className="text-xs px-2 py-1 rounded bg-white border hover:bg-gray-50" onClick={onCopy}>Copy</button>
        </div>
      )}
    </div>
  );
}
