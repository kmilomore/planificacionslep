import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, Save } from 'lucide-react';
import Alert from '../components/ui/Alert';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useCreateAccion, useIndicadores, useInstrumentos } from '../hooks/useApi';

const ROLES_GESTION = ['admin', 'director_ejecutivo', 'subdirector'];

const ESTADOS = [
  { value: 'planificada', label: 'Planificada' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'reportada', label: 'Reportada' },
  { value: 'completada', label: 'Completada' },
];

const INITIAL_FORM = {
  instrumento_id: '',
  indicador_id: '',
  nombre: '',
  descripcion: '',
  responsable: '',
  fecha_inicio: '',
  fecha_compromiso: '',
  estado: 'planificada',
  avance: '0',
};

function Field({ label, hint, required = false, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-navy font-body">
        {label}
        {required ? <span className="text-red"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="block text-xs text-slate-500 font-body">{hint}</span> : null}
    </label>
  );
}

function FormSkeleton() {
  return (
    <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 lg:p-8 space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-36 w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </section>
  );
}

function validateForm(form) {
  if (!form.instrumento_id) return 'Selecciona un instrumento.';
  if (!form.indicador_id) return 'Selecciona un indicador activo.';
  if (!form.nombre.trim()) return 'Ingresa el nombre de la acción.';
  if (!form.responsable.trim()) return 'Ingresa el responsable.';
  if (!form.fecha_compromiso) return 'Selecciona la fecha compromiso.';

  const avance = Number(form.avance);
  if (Number.isNaN(avance) || avance < 0 || avance > 100) {
    return 'El avance debe estar entre 0 y 100.';
  }

  if (form.fecha_inicio && form.fecha_compromiso < form.fecha_inicio) {
    return 'La fecha compromiso no puede ser anterior a la fecha de inicio.';
  }

  if (form.estado === 'planificada' && avance > 0) {
    return 'Una acción planificada debe iniciar con avance 0.';
  }

  if (form.estado === 'completada' && avance !== 100) {
    return 'Una acción completada debe registrar avance 100.';
  }

  return null;
}

export default function NuevaAccion() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(INITIAL_FORM);
  const [feedback, setFeedback] = useState(null);

  const { data: instrumentos = [], isLoading: loadingInstrumentos } = useInstrumentos();
  const { data: indicadores = [], isLoading: loadingIndicadores } = useIndicadores(form.instrumento_id);
  const createAccion = useCreateAccion();

  const canManage = ROLES_GESTION.includes(user?.rol);

  const instrumentoSeleccionado = useMemo(
    () => instrumentos.find((instrumento) => instrumento.id === form.instrumento_id) || null,
    [instrumentos, form.instrumento_id]
  );

  const indicadorSeleccionado = useMemo(
    () => indicadores.find((indicador) => indicador.id === form.indicador_id) || null,
    [indicadores, form.indicador_id]
  );

  const indicadoresActivos = useMemo(
    () => indicadores.filter((indicador) => indicador.activo === true || indicador.activo === 'TRUE' || indicador.activo === 'true'),
    [indicadores]
  );

  const updateField = (key, value) => {
    setForm((current) => {
      if (key === 'instrumento_id') {
        return { ...current, instrumento_id: value, indicador_id: '' };
      }

      if (key === 'estado') {
        if (value === 'planificada') return { ...current, estado: value, avance: '0' };
        if (value === 'completada') return { ...current, estado: value, avance: '100' };
      }

      return { ...current, [key]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    const error = validateForm(form);
    if (error) {
      setFeedback({ type: 'error', message: error });
      return;
    }

    try {
      const accion = await createAccion.mutateAsync({
        data: {
          indicador_id: form.indicador_id,
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim(),
          responsable: form.responsable.trim(),
          fecha_inicio: form.fecha_inicio || '',
          fecha_compromiso: form.fecha_compromiso,
          estado: form.estado,
          avance: Number(form.avance || 0),
        },
      });

      navigate(`/acciones/${accion.id}`, {
        replace: true,
        state: { created: true },
      });
    } catch (submitError) {
      setFeedback({ type: 'error', message: submitError.message });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Acciones</p>
            <h1 className="mt-3 text-3xl font-display font-bold text-navy">Nueva acción</h1>
            <p className="mt-3 text-sm text-slate-500 font-body max-w-2xl">
              El formulario ya opera con instrumentos, indicadores activos y creación real sobre Apps Script. Las validaciones locales cubren consistencia básica antes de enviar al backend.
            </p>
          </div>

          <Link
            to="/acciones"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors"
          >
            <ArrowLeft size={16} />
            Volver a acciones
          </Link>
        </div>
      </section>

      {!canManage ? (
        <Alert
          type="warning"
          message="Tu rol no tiene permisos para crear acciones. Puedes volver al listado y revisar las acciones asignadas."
        />
      ) : null}

      {feedback ? <Alert type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} /> : null}

      {loadingInstrumentos ? (
        <FormSkeleton />
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 lg:p-8 space-y-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <Field label="Instrumento" required hint="Primero selecciona el instrumento para cargar solo indicadores activos.">
                <select
                  value={form.instrumento_id}
                  onChange={(event) => updateField('instrumento_id', event.target.value)}
                  disabled={!canManage || createAccion.isPending}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">Selecciona un instrumento</option>
                  {instrumentos.map((instrumento) => (
                    <option key={instrumento.id} value={instrumento.id}>
                      {instrumento.codigo} - {instrumento.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Indicador activo" required hint={form.instrumento_id ? 'Solo se muestran indicadores activos del instrumento seleccionado.' : 'Selecciona un instrumento para habilitar esta lista.'}>
                {form.instrumento_id && loadingIndicadores ? (
                  <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  <select
                    value={form.indicador_id}
                    onChange={(event) => updateField('indicador_id', event.target.value)}
                    disabled={!canManage || !form.instrumento_id || createAccion.isPending || !indicadoresActivos.length}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Selecciona un indicador</option>
                    {indicadoresActivos.map((indicador) => (
                      <option key={indicador.id} value={indicador.id}>
                        {(indicador.codigo_indicador || 'Sin código')} - {indicador.nombre}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              <Field label="Nombre de la acción" required>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(event) => updateField('nombre', event.target.value)}
                  disabled={!canManage || createAccion.isPending}
                  placeholder="Ej. Levantar evidencia documental del hito"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </Field>

              <Field label="Responsable" required hint="Puede registrarse con nombre, correo o identificador institucional.">
                <input
                  type="text"
                  value={form.responsable}
                  onChange={(event) => updateField('responsable', event.target.value)}
                  disabled={!canManage || createAccion.isPending}
                  placeholder="Ej. juan.perez@slepc.cl"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </Field>

              <Field label="Fecha de inicio" hint="Opcional. Se usa para validar la secuencia temporal de la acción.">
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(event) => updateField('fecha_inicio', event.target.value)}
                  disabled={!canManage || createAccion.isPending}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </Field>

              <Field label="Fecha compromiso" required>
                <input
                  type="date"
                  value={form.fecha_compromiso}
                  onChange={(event) => updateField('fecha_compromiso', event.target.value)}
                  disabled={!canManage || createAccion.isPending}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </Field>

              <Field label="Estado inicial" required>
                <select
                  value={form.estado}
                  onChange={(event) => updateField('estado', event.target.value)}
                  disabled={!canManage || createAccion.isPending}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {ESTADOS.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Avance inicial (%)" required hint="Planificada fuerza 0 y completada fuerza 100 para evitar incoherencias tempranas.">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.avance}
                  onChange={(event) => updateField('avance', event.target.value)}
                  disabled={!canManage || createAccion.isPending || form.estado === 'planificada' || form.estado === 'completada'}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </Field>
            </div>

            <Field label="Descripción" hint="Opcional. Resume alcance, entregable o criterio operativo de la acción.">
              <textarea
                rows="5"
                value={form.descripcion}
                onChange={(event) => updateField('descripcion', event.target.value)}
                disabled={!canManage || createAccion.isPending}
                placeholder="Describe el objetivo operativo, dependencias y resultado esperado."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-body text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </Field>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500 font-body">
                La creación usa el endpoint real <span className="font-semibold text-navy">createAccion</span> y refresca automáticamente el listado de acciones.
              </p>
              <button
                type="submit"
                disabled={!canManage || createAccion.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-5 py-3 text-sm font-semibold text-white hover:bg-navy transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save size={16} />
                {createAccion.isPending ? 'Guardando acción...' : 'Crear acción'}
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue">
                <ClipboardCheck size={20} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Contexto</p>
                <h2 className="mt-2 text-xl font-display font-bold text-navy">Vinculación operativa</h2>
              </div>
              <dl className="space-y-3 text-sm font-body">
                <div>
                  <dt className="text-slate-500">Instrumento</dt>
                  <dd className="mt-1 font-semibold text-navy">
                    {instrumentoSeleccionado ? `${instrumentoSeleccionado.codigo} - ${instrumentoSeleccionado.nombre}` : 'Sin seleccionar'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Indicador</dt>
                  <dd className="mt-1 font-semibold text-navy">
                    {indicadorSeleccionado ? indicadorSeleccionado.nombre : 'Pendiente de seleccionar'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Indicadores activos disponibles</dt>
                  <dd className="mt-1 font-semibold text-navy">
                    {form.instrumento_id ? indicadoresActivos.length : 'Selecciona un instrumento'}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="bg-slate-900 rounded-card p-5 text-white space-y-3">
              <p className="text-xs uppercase tracking-[0.24em] text-sky-200 font-semibold font-body">Validación</p>
              <ul className="space-y-2 text-sm text-slate-200 font-body">
                <li>La acción debe quedar asociada a un indicador activo.</li>
                <li>La fecha compromiso no puede quedar antes de la fecha de inicio.</li>
                <li>El avance debe ser coherente con el estado inicial declarado.</li>
              </ul>
            </section>
          </aside>
        </form>
      )}
    </div>
  );
}