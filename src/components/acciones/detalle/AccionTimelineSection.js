import { CheckCircle2, FileText, History, MessageSquareMore, PencilLine } from 'lucide-react';

const TIMELINE_STYLES = {
  medio_subido: {
    label: 'Medio subido',
    icon: FileText,
    dotClassName: 'bg-blue',
    tagClassName: 'bg-blue-50 text-blue',
  },
  cambio_estado: {
    label: 'Cambio de estado',
    icon: CheckCircle2,
    dotClassName: 'bg-emerald-500',
    tagClassName: 'bg-emerald-50 text-emerald-700',
  },
  comentario: {
    label: 'Comentario operativo',
    icon: MessageSquareMore,
    dotClassName: 'bg-amber-500',
    tagClassName: 'bg-amber-50 text-amber-700',
  },
  actualizacion: {
    label: 'Actualización',
    icon: PencilLine,
    dotClassName: 'bg-sky-500',
    tagClassName: 'bg-sky-50 text-sky-700',
  },
  default: {
    label: 'Evento',
    icon: History,
    dotClassName: 'bg-slate-400',
    tagClassName: 'bg-slate-100 text-slate-700',
  },
};

export default function AccionTimelineSection({ timeline, formatDateTime }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-center gap-3">
        <History size={18} className="text-blue" />
        <h2 className="text-lg font-display font-bold text-navy">Bitácora operativa</h2>
      </div>
      <div className="mt-5 space-y-4">
        {timeline.length ? timeline.map((entry, index) => {
          const appearance = getTimelineAppearance(entry.tipo);
          const Icon = appearance.icon;

          return (
            <div key={`${entry.tipo}-${entry.fecha}-${index}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-white ${appearance.dotClassName}`}>
                  <Icon size={14} />
                </div>
                {index < timeline.length - 1 ? <div className="mt-2 w-px flex-1 bg-slate-200" /> : null}
              </div>
              <div className="pb-4 min-w-0">
                <p className="text-sm font-semibold text-navy">{entry.texto}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold font-body ${appearance.tagClassName}`}>
                    {appearance.label}
                  </span>
                  <span className="text-sm text-slate-500 font-body">{formatDateTime(entry.fecha)}</span>
                </div>
              </div>
            </div>
          );
        }) : (
          <p className="text-sm text-slate-500 font-body">No hay eventos registrados todavía.</p>
        )}
      </div>
    </section>
  );
}

export function extractOperationalComments(timeline) {
  return timeline.filter((entry) => isCommentType(entry.tipo));
}

function getTimelineAppearance(tipo) {
  const normalizedType = normalizeTimelineType(tipo);
  return TIMELINE_STYLES[normalizedType] || TIMELINE_STYLES.default;
}

function normalizeTimelineType(tipo) {
  const value = String(tipo || '').toLowerCase();
  if (value.includes('medio') || value.includes('archivo')) return 'medio_subido';
  if (value.includes('estado')) return 'cambio_estado';
  if (value.includes('coment') || value.includes('observ')) return 'comentario';
  if (value.includes('actual')) return 'actualizacion';
  return 'default';
}

function isCommentType(tipo) {
  return normalizeTimelineType(tipo) === 'comentario';
}