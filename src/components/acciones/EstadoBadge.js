import clsx from 'clsx';

const ESTADO_STYLES = {
  planificada: 'bg-slate-100 text-slate-700',
  en_progreso: 'bg-sky-100 text-sky-700',
  reportada: 'bg-amber-100 text-amber-700',
  completada: 'bg-emerald-100 text-emerald-700',
};

const ESTADO_LABELS = {
  planificada: 'Planificada',
  en_progreso: 'En progreso',
  reportada: 'Reportada',
  completada: 'Completada',
};

export default function EstadoBadge({ estado }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold font-body',
        ESTADO_STYLES[estado] || 'bg-slate-100 text-slate-700'
      )}
    >
      {ESTADO_LABELS[estado] || estado}
    </span>
  );
}