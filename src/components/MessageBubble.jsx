import RichText from './RichText';

export default function MessageBubble({
  role,
  children,
  onRetry,
  onCopy,
  assistantActions = [],
  userActions = [],
  quickActions = [],
  quickActionsDisabled = false,
}) {
  const mine = role === 'user';
  const content = typeof children === 'string' ? <RichText text={children} /> : children;

  return (
    <div
      className={`message-bubble ${mine ? 'message-bubble--user' : 'message-bubble--assistant'}`}
      role="group"
      aria-label={mine ? 'User message' : 'Assistant message'}
    >
      <div className="message-bubble__content">{content}</div>
      {!mine && (
        <div className="message-bubble__actions">
          {onRetry && (
            <button type="button" className="message-action" onClick={onRetry}>
              Retry
            </button>
          )}
          <button type="button" className="message-action" onClick={onCopy}>
            Copy
          </button>
          {assistantActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="message-action"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {mine && userActions.length > 0 && (
        <div className="message-bubble__actions">
          {userActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="message-action"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
      {!mine && quickActions.length > 0 && (
        <div className="message-bubble__quick-actions">
          {quickActions.map((action) => (
            <button
              key={action.id}
              type="button"
              className="message-quick-action"
              onClick={action.onClick}
              disabled={quickActionsDisabled || action.disabled}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
