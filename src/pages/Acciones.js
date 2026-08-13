import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import AccionesFilters from '../components/acciones/AccionesFilters';
import AccionesTable from '../components/acciones/AccionesTable';
import ResumenAcciones from '../components/acciones/ResumenAcciones';
import { useAcciones } from '../hooks/useApi';
import Alert from '../components/ui/Alert';
import Skeleton from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { APP_BRANDING } from '../config/branding';

function AccionesSkeleton() {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-white shadow-card border border-slate-100 p-6 lg:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-sky-50 via-cyan-50 to-transparent pointer-events-none" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-full max-w-2xl" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-5/6 max-w-lg" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-12 w-40" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" rounded="rounded-full" />
            </div>
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-2 w-full rounded-full" rounded="rounded-full" />
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-28 rounded-full" rounded="rounded-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-slate-100 p-4 lg:grid-cols-[1.6fr_1fr_160px_140px]">
              <div className="space-y-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-10 w-full rounded-full" rounded="rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-24 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Acciones() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    search: '',
    estado: 'todos',
    instrumento: 'todos',
    responsable: 'todos',
  });

  const apiFilters = useMemo(() => ({
    search: filters.search || '',
    estado: filters.estado === 'todos' ? '' : filters.estado,
    instrumento_id: '',
    responsable: filters.responsable === 'todos' ? '' : filters.responsable,
  }), [filters]);

  const { data, isLoading, error } = useAcciones(apiFilters);
  const acciones = useMemo(() => data?.items || [], [data]);
  const resumen = useMemo(() => data?.resumen || ({
    total: 0,
    planificadas: 0,
    en_progreso: 0,
    reportadas: 0,
    completadas: 0,
  }), [data]);

  const instrumentos = useMemo(
    () => [...new Set(acciones.map((accion) => accion.instrumento_codigo).filter(Boolean))],
    [acciones]
  );
  const responsables = useMemo(
    () => [...new Set(acciones.map((accion) => accion.responsable_display || accion.responsable).filter(Boolean))],
    [acciones]
  );

  const accionesFiltradas = useMemo(() => {
    return acciones
      .filter((accion) => filters.instrumento === 'todos' || accion.instrumento_codigo === filters.instrumento)
      .map((accion) => ({
        id: accion.id,
        nombre: accion.nombre,
        descripcion: accion.descripcion || 'Sin descripción registrada.',
        indicador: accion.indicador_nombre || accion.indicador_codigo || 'Indicador sin nombre',
        instrumento: accion.instrumento_codigo || 'Sin instrumento',
        responsable: accion.responsable_display || accion.responsable || 'Sin responsable',
        fechaCompromiso: formatDateTime(accion.fecha_compromiso),
        estado: accion.estado,
        avance: Number(accion.avance || 0),
        medios: accion.medios_count || 0,
        actualizado: formatDateTime(accion.updated_at || accion.created_at),
      }));
  }, [acciones, filters.instrumento]);

  const resumenCards = useMemo(() => {
    const total = resumen.total || 1;

    return [
      { key: 'total', label: 'Total acciones', value: resumen.total, helper: 'Dato real desde backend', percent: 100, tint: '#EEF2FF', iconColor: '#25306B' },
      { key: 'planificada', label: 'Planificadas', value: resumen.planificadas, helper: 'Pendientes por activar', percent: Math.round((resumen.planificadas / total) * 100), tint: '#F1F5F9', iconColor: '#475569' },
      { key: 'en_progreso', label: 'En progreso', value: resumen.en_progreso, helper: 'Seguimiento operativo', percent: Math.round((resumen.en_progreso / total) * 100), tint: '#E0F2FE', iconColor: '#0369A1' },
      { key: 'reportada', label: 'Reportadas', value: resumen.reportadas, helper: 'Con evidencia parcial', percent: Math.round((resumen.reportadas / total) * 100), tint: '#FEF3C7', iconColor: '#B45309' },
      { key: 'completada', label: 'Completadas', value: resumen.completadas, helper: 'Cierre validado', percent: Math.round((resumen.completadas / total) * 100), tint: '#DCFCE7', iconColor: '#15803D' },
    ];
  }, [resumen]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const firstAccionId = accionesFiltradas[0]?.id;
  const canEditActions = user?.rol === 'admin';

  return (
    <div className="p-6 space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-white shadow-card border border-slate-100 p-6 lg:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-sky-50 via-cyan-50 to-transparent pointer-events-none" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Módulo Acciones</p>
            <h1 className="mt-3 text-3xl lg:text-4xl font-display font-bold text-navy">
              Gestión operativa vinculada a indicadores institucionales
            </h1>
            <p className="mt-3 text-sm lg:text-base text-slate-500 font-body max-w-2xl">
              {APP_BRANDING.organizationName}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/acciones/nueva"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-5 py-3 text-white font-semibold font-body hover:bg-navy transition-colors"
            >
              <Plus size={18} />
              Nueva acción
            </Link>
            {firstAccionId ? (
              <Link
                to={`/acciones/${firstAccionId}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-slate-700 font-semibold font-body hover:border-blue hover:text-blue transition-colors"
              >
                Ver primera acción
                <ArrowRight size={18} />
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {error ? <Alert type="error" message={error.message} /> : null}

      {isLoading ? (
        <AccionesSkeleton />
      ) : (
        <>
          <ResumenAcciones cards={resumenCards} />

          <AccionesFilters
            filters={filters}
            onChange={updateFilter}
            instrumentos={instrumentos}
            responsables={responsables}
          />

          {accionesFiltradas.length ? (
            <AccionesTable acciones={accionesFiltradas} canEditActions={canEditActions} />
          ) : (
            <section className="bg-white rounded-card shadow-card border border-slate-100 p-8 text-center">
              <h2 className="text-xl font-display font-bold text-navy">No hay acciones registradas</h2>
              <p className="mt-2 text-sm text-slate-500 font-body">
                Este ambiente está listo para trabajar con datos mock. Si esperabas ver registros, carga ejemplos en la hoja de acciones o crea la primera acción desde esta vista.
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return 'Sin fecha';
  const normalized = normalizeDateTimeValue(value);
  if (normalized) return normalized;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

function normalizeDateTimeValue(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!match) return '';

  const [, year, month, day, hours, minutes] = match;
  if (!hours || !minutes) return `${day}/${month}/${year}`;
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
