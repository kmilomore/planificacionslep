import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Filter, Search } from 'lucide-react';
import { useInstrumentos, useTodosLosIndicadores } from '../hooks/useApi';
import Alert from '../components/ui/Alert';
import Skeleton from '../components/ui/Skeleton';

function IndicadoresSkeleton() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] bg-white shadow-card border border-slate-100 p-6 lg:p-8 space-y-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-full max-w-2xl" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-card shadow-card border border-slate-100 p-5 space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </section>
      <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-4">
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-3 rounded-2xl border border-slate-100 p-4 lg:grid-cols-[120px_1.7fr_1fr_140px_120px]">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function Indicadores() {
  const [filters, setFilters] = useState({
    search: '',
    instrumento: 'todos',
    tipo: 'todos',
    responsable: 'todos',
  });

  const { data: indicadores = [], isLoading, error } = useTodosLosIndicadores();
  const { data: instrumentos = [] } = useInstrumentos();

  const enrichedIndicadores = useMemo(() => {
    const instrumentById = new Map(instrumentos.map((instrumento) => [instrumento.id, instrumento]));

    return indicadores.map((indicador) => ({
      ...indicador,
      instrumento: instrumentById.get(indicador.instrumento_id) || null,
      responsable_operativo: String(indicador.subdimension || '').trim() || 'Sin responsable',
    }));
  }, [indicadores, instrumentos]);

  const tipoOptions = useMemo(
    () => [...new Set(enrichedIndicadores.map((indicador) => indicador.tipo_meta).filter(Boolean))],
    [enrichedIndicadores]
  );
  const responsableOptions = useMemo(
    () => [...new Set(enrichedIndicadores.map((indicador) => indicador.responsable_operativo).filter(Boolean))],
    [enrichedIndicadores]
  );

  const indicadoresFiltrados = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return enrichedIndicadores.filter((indicador) => {
      if (filters.instrumento !== 'todos' && indicador.instrumento_id !== filters.instrumento) return false;
      if (filters.tipo !== 'todos' && indicador.tipo_meta !== filters.tipo) return false;
      if (filters.responsable !== 'todos' && indicador.responsable_operativo !== filters.responsable) return false;

      if (!search) return true;

      return [
        indicador.codigo_indicador,
        indicador.nombre,
        indicador.dimension,
        indicador.subdimension,
        indicador.instrumento?.codigo,
        indicador.instrumento?.nombre,
      ].some((value) => String(value || '').toLowerCase().includes(search));
    });
  }, [enrichedIndicadores, filters]);

  const stats = useMemo(() => {
    const total = indicadoresFiltrados.length;
    const activos = indicadoresFiltrados.filter((indicador) => indicador.activo === true || indicador.activo === 'TRUE' || indicador.activo === 'true').length;
    const sinMeta = indicadoresFiltrados.filter((indicador) => !String(indicador.meta_valor || '').trim()).length;
    const responsables = new Set(indicadoresFiltrados.map((indicador) => indicador.responsable_operativo).filter(Boolean)).size;

    return { total, activos, sinMeta, responsables };
  }, [indicadoresFiltrados]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="p-6 space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-white shadow-card border border-slate-100 p-6 lg:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-emerald-50 via-sky-50 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Módulo Indicadores</p>
          <h1 className="mt-3 text-3xl lg:text-4xl font-display font-bold text-navy">
            Vista central de indicadores con filtros operativos
          </h1>
          <p className="mt-3 text-sm lg:text-base text-slate-500 font-body max-w-2xl">
            Revisa todos los indicadores institucionales en una sola pantalla y filtra por tipo de indicador, responsable o instrumento.
          </p>
        </div>
      </section>

      {error ? <Alert type="error" message={error.message} /> : null}

      {isLoading ? (
        <IndicadoresSkeleton />
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Indicadores visibles" value={stats.total} helper="Después de filtros" />
            <StatCard label="Indicadores activos" value={stats.activos} helper="Con estado activo" tone="emerald" />
            <StatCard label="Sin meta" value={stats.sinMeta} helper="Requieren completar base" tone="amber" />
            <StatCard label="Responsables" value={stats.responsables} helper="Según subdimensión" tone="slate" />
          </section>

          <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-5">
            <div className="flex items-center gap-2 text-slate-500">
              <Filter size={16} />
              <p className="text-sm font-semibold font-body">Filtros</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              <div className="relative lg:col-span-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Buscar por código, nombre, dimensión o instrumento"
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <select
                value={filters.tipo}
                onChange={(e) => updateFilter('tipo', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                <option value="todos">Todos los tipos</option>
                {tipoOptions.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>

              <select
                value={filters.responsable}
                onChange={(e) => updateFilter('responsable', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                <option value="todos">Todos los responsables</option>
                {responsableOptions.map((responsable) => (
                  <option key={responsable} value={responsable}>{responsable}</option>
                ))}
              </select>

              <select
                value={filters.instrumento}
                onChange={(e) => updateFilter('instrumento', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                <option value="todos">Todos los instrumentos</option>
                {instrumentos.map((instrumento) => (
                  <option key={instrumento.id} value={instrumento.id}>{instrumento.codigo} · {instrumento.nombre}</option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-500 font-body">
              {indicadoresFiltrados.length} de {enrichedIndicadores.length} indicadores visibles.
            </p>

            {indicadoresFiltrados.length ? (
              <div className="space-y-3">
                {indicadoresFiltrados.map((indicador) => (
                  <article key={indicador.id} className="grid gap-4 rounded-2xl border border-slate-100 p-4 lg:grid-cols-[130px_1.7fr_1fr_140px_150px_110px] lg:items-center">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Código</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-navy">{indicador.codigo_indicador}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-navy">{indicador.nombre}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {indicador.dimension || 'Sin dimensión'} · {indicador.subdimension || 'Sin responsable'}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {indicador.instrumento?.codigo || 'Sin instrumento'} · {indicador.instrumento?.nombre || 'Sin nombre de instrumento'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Tipo de indicador</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{indicador.tipo_meta || '—'}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Responsable</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">{indicador.responsable_operativo}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Meta</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {String(indicador.meta_valor || '').trim() ? `${indicador.meta_valor} ${indicador.unidad || ''}`.trim() : 'Sin meta'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 lg:justify-end">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${(indicador.activo === true || indicador.activo === 'TRUE' || indicador.activo === 'true') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {(indicador.activo === true || indicador.activo === 'TRUE' || indicador.activo === 'true') ? 'Activo' : 'Inactivo'}
                      </span>
                      <Link to={`/instrumento/${indicador.instrumento_id}?indicador=${indicador.id}`} className="text-xs font-medium text-blue hover:underline">
                        Ver indicador
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <h2 className="text-xl font-display font-bold text-navy">No hay indicadores para esos filtros</h2>
                <p className="mt-2 text-sm text-slate-500 font-body">
                  Ajusta tipo de indicador, responsable o texto de búsqueda para volver a ver resultados.
                </p>
              </section>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, helper, tone = 'blue' }) {
  const tones = {
    blue: 'bg-blue-50 border-blue-100 text-blue',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border p-5 ${tones[tone] || tones.blue}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{helper}</p>
    </div>
  );
}