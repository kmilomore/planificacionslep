import { CalendarDays, CheckCircle2, Clock3, Target } from 'lucide-react';
import EstadoBadge from '../EstadoBadge';

export default function AccionOverviewSection({ accion, formatDate, formatDateTime, avancePorMedios }) {
  const avance = Number.isFinite(Number(avancePorMedios)) ? Number(avancePorMedios) : Number(accion.avance || 0);
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Detalle de acción</p>
          <h1 className="mt-3 text-3xl font-display font-bold text-navy">{accion.nombre}</h1>
          <p className="mt-2 text-sm text-slate-500 font-body">
            {accion.instrumento_codigo || 'Sin instrumento'} · {accion.indicador_nombre || 'Sin indicador'}
          </p>
        </div>
        <EstadoBadge estado={accion.estado} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Equipo responsable" value={accion.responsable_display || accion.responsable} />
        <Metric label="Instrumento" value={accion.instrumento_nombre || accion.instrumento_codigo || 'Sin instrumento'} />
        <Metric label="Avance" value={`${avance}%`} />
        <Metric label="Estado actual" value={String(accion.estado || '').replace('_', ' ')} />
      </div>

      <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
        <h2 className="text-lg font-display font-bold text-navy">Descripción operativa</h2>
        <p className="mt-3 text-sm text-slate-600 font-body leading-6">
          {accion.descripcion || 'La acción aún no registra una descripción detallada.'}
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoItem icon={Target} label="Indicador asociado" value={accion.indicador_nombre || accion.indicador_codigo || 'Sin indicador'} />
          <InfoItem icon={CalendarDays} label="Fecha compromiso" value={formatDate(accion.fecha_compromiso)} />
          <InfoItem icon={Clock3} label="Fecha inicio" value={formatDate(accion.fecha_inicio)} />
          <InfoItem icon={CheckCircle2} label="Última actualización" value={formatDateTime(accion.updated_at || accion.created_at)} />
        </div>
      </section>
    </>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">{label}</p>
      <p className="mt-2 text-base font-semibold text-navy font-body">{value || '—'}</p>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 flex items-start gap-3">
      <div className="rounded-xl bg-blue-50 p-2 text-blue">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">{label}</p>
        <p className="mt-2 text-sm font-semibold text-navy font-body">{value || 'Sin información'}</p>
      </div>
    </div>
  );
}