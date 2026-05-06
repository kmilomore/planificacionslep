import { Activity, CheckCircle2, Clock3, FileText, ListTodo } from 'lucide-react';

const ICONS = {
  total: ListTodo,
  planificada: Clock3,
  en_progreso: Activity,
  reportada: FileText,
  completada: CheckCircle2,
};

export default function ResumenAcciones({ cards }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = ICONS[card.key] || ListTodo;

        return (
          <article key={card.key} className="bg-white rounded-card shadow-card p-5 border border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold font-body">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-display font-bold text-navy">{card.value}</p>
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: card.tint }}>
                <Icon size={20} color={card.iconColor} />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs font-body">
              <span className="text-slate-500">{card.helper}</span>
              <span className="font-semibold" style={{ color: card.iconColor }}>{card.percent}%</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}