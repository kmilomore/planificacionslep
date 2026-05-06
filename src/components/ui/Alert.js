import clsx from 'clsx';

const VARIANTS = {
  success: { bar: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-800',  icon: '✓' },
  error:   { bar: 'bg-red-500',    bg: 'bg-red-50',    text: 'text-red-800',    icon: '✕' },
  warning: { bar: 'bg-yellow-500', bg: 'bg-yellow-50', text: 'text-yellow-800', icon: '⚠' },
  info:    { bar: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-800',   icon: 'i' },
};

export default function Alert({ type = 'info', message, onClose, className }) {
  if (!message) return null;
  const v = VARIANTS[type] || VARIANTS.info;

  return (
    <div className={clsx('flex items-start gap-3 rounded-lg px-4 py-3 border-l-4 font-body text-sm', v.bg, v.text, className)}
      style={{ borderLeftColor: v.bar.replace('bg-', '') }}
    >
      <span className="font-bold mt-0.5 flex-shrink-0">{v.icon}</span>
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">✕</button>
      )}
    </div>
  );
}
