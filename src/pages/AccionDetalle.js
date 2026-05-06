import { useParams } from 'react-router-dom';
import EstadoBadge from '../components/acciones/EstadoBadge';

const DETAIL_MOCK = {
  'acc-001': {
    nombre: 'Jornada territorial abril',
    indicador: 'Participación efectiva de consejos escolares',
    instrumento: 'CDC',
    responsable: 'María González',
    estado: 'reportada',
    avance: 75,
  },
};

export default function AccionDetalle() {
  const { id } = useParams();
  const accion = DETAIL_MOCK[id] || {
    nombre: 'Acción en preparación',
    indicador: 'Sin indicador cargado aún',
    instrumento: 'Pendiente',
    responsable: 'Pendiente',
    estado: 'planificada',
    avance: 0,
  };

  return (
    <div className="p-6">
      <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 lg:p-8 max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Detalle de acción</p>
            <h1 className="mt-3 text-3xl font-display font-bold text-navy">{accion.nombre}</h1>
            <p className="mt-2 text-sm text-slate-500 font-body">
              {accion.instrumento} · {accion.indicador}
            </p>
          </div>
          <EstadoBadge estado={accion.estado} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric label="Responsable" value={accion.responsable} />
          <Metric label="Instrumento" value={accion.instrumento} />
          <Metric label="Avance" value={`${accion.avance}%`} />
          <Metric label="Estado actual" value={accion.estado.replace('_', ' ')} />
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 p-5 bg-slate-50">
          <h2 className="text-lg font-display font-bold text-navy">Siguiente corte</h2>
          <p className="mt-2 text-sm text-slate-500 font-body">
            Aquí irán el timeline operativo, los medios de verificación y la bitácora de cambios cuando el backend de acciones quede conectado a Apps Script y Google Drive.
          </p>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">{label}</p>
      <p className="mt-2 text-base font-semibold text-navy font-body">{value}</p>
    </div>
  );
}