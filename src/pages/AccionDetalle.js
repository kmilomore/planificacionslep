import { useParams } from 'react-router-dom';
import { useAccion } from '../hooks/useApi';
import EstadoBadge from '../components/acciones/EstadoBadge';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

export default function AccionDetalle() {
  const { id } = useParams();
  const { data: accion, isLoading, error } = useAccion(id);

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" message={error.message} />
      </div>
    );
  }

  if (!accion) {
    return (
      <div className="p-6">
        <Alert type="warning" message="La acción solicitada no existe o no está disponible para tu perfil." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 lg:p-8 max-w-5xl space-y-6">
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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Metric label="Equipo responsable" value={accion.responsable_display || accion.responsable} />
          <Metric label="Instrumento" value={accion.instrumento_nombre || accion.instrumento_codigo || 'Sin instrumento'} />
          <Metric label="Avance" value={`${accion.avance}%`} />
          <Metric label="Estado actual" value={accion.estado.replace('_', ' ')} />
        </div>

        <div className="rounded-2xl border border-dashed border-slate-200 p-5 bg-slate-50">
          <h2 className="text-lg font-display font-bold text-navy">Bitácora y medios</h2>
          <p className="mt-2 text-sm text-slate-500 font-body">
            Medios registrados: {accion.medios?.length || 0}. Timeline disponible: {accion.timeline?.length || 0} eventos.
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