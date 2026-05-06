import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDownUp,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleOff,
  Download,
  ExternalLink,
  Filter,
  Search,
  X,
} from 'lucide-react';
import { useInstrumentos, useTodosLosIndicadores } from '../hooks/useApi';
import Alert from '../components/ui/Alert';
import Skeleton from '../components/ui/Skeleton';

const DEFAULT_FILTERS = {
  search: '',
  instrumento: 'todos',
  tipo: 'todos',
  responsable: 'todos',
  estado: 'todos',
};

const DEFAULT_SORT = {
  key: 'codigo',
  direction: 'asc',
};

const SORT_OPTIONS = [
  { key: 'codigo', label: 'Codigo' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'instrumento', label: 'Instrumento' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'responsable', label: 'Responsable' },
  { key: 'meta', label: 'Meta' },
  { key: 'estado', label: 'Estado' },
];

const TABLE_HEADERS = [
  { key: 'codigo', label: 'Codigo', className: 'w-[132px]' },
  { key: 'nombre', label: 'Indicador', className: 'min-w-[280px]' },
  { key: 'instrumento', label: 'Instrumento', className: 'min-w-[220px]' },
  { key: 'tipo', label: 'Tipo', className: 'w-[140px]' },
  { key: 'responsable', label: 'Responsable', className: 'min-w-[180px]' },
  { key: 'meta', label: 'Meta', className: 'w-[140px]' },
  { key: 'estado', label: 'Estado', className: 'w-[120px]' },
];

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'si';
}

function parseMetaValue(metaValor) {
  const raw = String(metaValor ?? '').trim();
  if (!raw) return { raw: '', display: 'Sin meta', comparable: null };

  const normalizedNumber = Number(raw.replace(',', '.'));
  if (!Number.isNaN(normalizedNumber)) {
    return { raw, display: raw, comparable: normalizedNumber };
  }

  return { raw, display: raw, comparable: raw.toLowerCase() };
}

function buildIndicadorHref(instrumentoId, indicadorId) {
  return `/instrumento/${instrumentoId}?indicador=${indicadorId}`;
}

function toCsvCell(value) {
  const stringValue = String(value ?? '');
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function downloadIndicadoresCsv(indicadores) {
  if (!indicadores.length) return;

  const rows = [
    [
      'Codigo',
      'Indicador',
      'Dimension',
      'Subdimension',
      'Instrumento codigo',
      'Instrumento nombre',
      'Tipo',
      'Responsable',
      'Meta',
      'Estado',
      'Detalle',
    ],
    ...indicadores.map((indicador) => [
      indicador.codigoLabel,
      indicador.nombreLabel,
      indicador.dimensionLabel,
      indicador.subdimensionLabel,
      indicador.instrumentoCodigo,
      indicador.instrumentoNombre,
      indicador.tipoLabel,
      indicador.responsable_operativo,
      indicador.metaDisplay,
      indicador.isActivo ? 'Activo' : 'Inactivo',
      buildIndicadorHref(indicador.instrumento_id, indicador.id),
    ]),
  ];

  const csv = rows.map((row) => row.map(toCsvCell).join(',')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `indicadores-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function parseViewState(searchParams) {
  return {
    filters: {
      search: searchParams.get('search') || '',
      instrumento: searchParams.get('instrumento') || 'todos',
      tipo: searchParams.get('tipo') || 'todos',
      responsable: searchParams.get('responsable') || 'todos',
      estado: searchParams.get('estado') || 'todos',
    },
    sort: {
      key: searchParams.get('sort') || DEFAULT_SORT.key,
      direction: searchParams.get('dir') === 'desc' ? 'desc' : DEFAULT_SORT.direction,
    },
  };
}

function buildSearchParams(filters, sortConfig) {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.instrumento !== 'todos') params.set('instrumento', filters.instrumento);
  if (filters.tipo !== 'todos') params.set('tipo', filters.tipo);
  if (filters.responsable !== 'todos') params.set('responsable', filters.responsable);
  if (filters.estado !== 'todos') params.set('estado', filters.estado);
  if (sortConfig.key !== DEFAULT_SORT.key) params.set('sort', sortConfig.key);
  if (sortConfig.direction !== DEFAULT_SORT.direction) params.set('dir', sortConfig.direction);

  return params;
}

function sameFilters(a, b) {
  return a.search === b.search
    && a.instrumento === b.instrumento
    && a.tipo === b.tipo
    && a.responsable === b.responsable
    && a.estado === b.estado;
}

function sameSort(a, b) {
  return a.key === b.key && a.direction === b.direction;
}

function compareValues(left, right, direction) {
  const multiplier = direction === 'desc' ? -1 : 1;

  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;

  if (typeof left === 'number' && typeof right === 'number') {
    return (left - right) * multiplier;
  }

  return String(left).localeCompare(String(right), 'es', { numeric: true, sensitivity: 'base' }) * multiplier;
}

function getSortValue(indicador, key) {
  switch (key) {
    case 'nombre':
      return indicador.nombreLabel;
    case 'instrumento':
      return indicador.instrumentoSortLabel;
    case 'tipo':
      return indicador.tipoLabel;
    case 'responsable':
      return indicador.responsable_operativo;
    case 'meta':
      return indicador.metaComparable ?? indicador.metaDisplay;
    case 'estado':
      return indicador.isActivo ? 1 : 0;
    case 'codigo':
    default:
      return indicador.codigoLabel;
  }
}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedState = useMemo(() => parseViewState(searchParams), [searchParams]);
  const [filters, setFilters] = useState(parsedState.filters);
  const [sortConfig, setSortConfig] = useState(parsedState.sort);
  const deferredSearch = useDeferredValue(filters.search);

  const { data: indicadores = [], isLoading, error } = useTodosLosIndicadores();
  const { data: instrumentos = [] } = useInstrumentos();

  useEffect(() => {
    if (!sameFilters(filters, parsedState.filters)) {
      setFilters(parsedState.filters);
    }

    if (!sameSort(sortConfig, parsedState.sort)) {
      setSortConfig(parsedState.sort);
    }
  }, [filters, parsedState.filters, parsedState.sort, sortConfig]);

  useEffect(() => {
    const nextParams = buildSearchParams(filters, sortConfig).toString();
    const currentParams = searchParams.toString();

    if (nextParams !== currentParams) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams, sortConfig]);

  const enrichedIndicadores = useMemo(() => {
    const instrumentById = new Map(instrumentos.map((instrumento) => [instrumento.id, instrumento]));

    return indicadores.map((indicador) => {
      const instrumento = instrumentById.get(indicador.instrumento_id) || null;
      const codigoLabel = String(indicador.codigo_indicador || 'Sin codigo').trim() || 'Sin codigo';
      const nombreLabel = String(indicador.nombre || 'Sin nombre').trim() || 'Sin nombre';
      const dimensionLabel = String(indicador.dimension || '').trim() || 'Sin dimension';
      const subdimensionLabel = String(indicador.subdimension || '').trim() || 'Sin subdimension';
      const responsableOperativo = subdimensionLabel === 'Sin subdimension' ? 'Sin responsable' : subdimensionLabel;
      const instrumentoCodigo = String(instrumento?.codigo || '').trim() || 'Sin instrumento';
      const instrumentoNombre = String(instrumento?.nombre || '').trim() || 'Sin nombre de instrumento';
      const tipoLabel = String(indicador.tipo_meta || '').trim() || 'Sin tipo';
      const meta = parseMetaValue(indicador.meta_valor);
      const unidadLabel = String(indicador.unidad || '').trim();
      const metaDisplay = meta.raw ? `${meta.display}${unidadLabel ? ` ${unidadLabel}` : ''}` : 'Sin meta';
      const isActivo = normalizeBoolean(indicador.activo);

      return {
        ...indicador,
        instrumento,
        codigoLabel,
        nombreLabel,
        dimensionLabel,
        subdimensionLabel,
        instrumentoCodigo,
        instrumentoNombre,
        instrumentoSortLabel: `${instrumentoCodigo} ${instrumentoNombre}`,
        tipoLabel,
        responsable_operativo: responsableOperativo,
        metaDisplay,
        metaComparable: meta.comparable,
        isActivo,
        searchIndex: [
          codigoLabel,
          nombreLabel,
          dimensionLabel,
          subdimensionLabel,
          instrumentoCodigo,
          instrumentoNombre,
          tipoLabel,
          responsableOperativo,
          metaDisplay,
          isActivo ? 'activo' : 'inactivo',
        ].join(' ').toLowerCase(),
      };
    });
  }, [indicadores, instrumentos]);

  const tipoOptions = useMemo(
    () => [...new Set(enrichedIndicadores.map((indicador) => indicador.tipoLabel).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [enrichedIndicadores]
  );
  const responsableOptions = useMemo(
    () => [...new Set(enrichedIndicadores.map((indicador) => indicador.responsable_operativo).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [enrichedIndicadores]
  );

  const indicadoresFiltrados = useMemo(() => {
    const search = deferredSearch.trim().toLowerCase();

    return enrichedIndicadores.filter((indicador) => {
      if (filters.instrumento !== 'todos' && indicador.instrumento_id !== filters.instrumento) return false;
      if (filters.tipo !== 'todos' && indicador.tipoLabel !== filters.tipo) return false;
      if (filters.responsable !== 'todos' && indicador.responsable_operativo !== filters.responsable) return false;
      if (filters.estado === 'activos' && !indicador.isActivo) return false;
      if (filters.estado === 'inactivos' && indicador.isActivo) return false;

      if (!search) return true;

      return indicador.searchIndex.includes(search);
    });
  }, [deferredSearch, enrichedIndicadores, filters]);

  const indicadoresOrdenados = useMemo(() => {
    return [...indicadoresFiltrados].sort((left, right) => {
      const primary = compareValues(getSortValue(left, sortConfig.key), getSortValue(right, sortConfig.key), sortConfig.direction);
      if (primary !== 0) return primary;

      return compareValues(left.codigoLabel, right.codigoLabel, 'asc');
    });
  }, [indicadoresFiltrados, sortConfig.direction, sortConfig.key]);

  const stats = useMemo(() => {
    const total = indicadoresOrdenados.length;
    const activos = indicadoresOrdenados.filter((indicador) => indicador.isActivo).length;
    const sinMeta = indicadoresOrdenados.filter((indicador) => indicador.metaComparable == null && indicador.metaDisplay === 'Sin meta').length;
    const responsables = new Set(indicadoresOrdenados.map((indicador) => indicador.responsable_operativo).filter(Boolean)).size;

    return { total, activos, sinMeta, responsables };
  }, [indicadoresOrdenados]);

  const hasActiveFilters = useMemo(
    () => !sameFilters(filters, DEFAULT_FILTERS) || !sameSort(sortConfig, DEFAULT_SORT),
    [filters, sortConfig]
  );

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSortConfig(DEFAULT_SORT);
  };
  const toggleSort = (key) => {
    setSortConfig((current) => {
      if (current.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }

      return { key, direction: key === 'estado' ? 'desc' : 'asc' };
    });
  };
  const updateSortFromSelect = (value) => {
    const [key, direction] = value.split(':');
    setSortConfig({ key, direction: direction === 'desc' ? 'desc' : 'asc' });
  };

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
            Revisa todos los indicadores institucionales en una sola pantalla y filtra por estado, tipo, responsable o instrumento.
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

          <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 space-y-5 lg:sticky lg:top-4 z-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Filter size={16} />
                <p className="text-sm font-semibold font-body">Filtros y orden</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadIndicadoresCsv(indicadoresOrdenados)}
                  disabled={!indicadoresOrdenados.length}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${!indicadoresOrdenados.length ? 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 text-slate-700 hover:border-blue hover:text-blue'}`}
                >
                  <Download size={16} />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${!hasActiveFilters ? 'border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed' : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'}`}
                >
                  <X size={16} />
                  Limpiar filtros
                </button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-6">
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
                value={filters.estado}
                onChange={(e) => updateFilter('estado', e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                <option value="todos">Todos los estados</option>
                <option value="activos">Solo activos</option>
                <option value="inactivos">Solo inactivos</option>
              </select>

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

              <select
                value={`${sortConfig.key}:${sortConfig.direction}`}
                onChange={(e) => updateSortFromSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/20"
              >
                {SORT_OPTIONS.flatMap((option) => [
                  <option key={`${option.key}:asc`} value={`${option.key}:asc`}>{`Ordenar por ${option.label} ↑`}</option>,
                  <option key={`${option.key}:desc`} value={`${option.key}:desc`}>{`Ordenar por ${option.label} ↓`}</option>,
                ])}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500 font-body">
                {indicadoresOrdenados.length} de {enrichedIndicadores.length} indicadores visibles.
              </p>
              {hasActiveFilters ? (
                <div className="flex flex-wrap gap-2">
                  {filters.search ? <FilterChip label={`Busqueda: ${filters.search}`} onClear={() => updateFilter('search', '')} /> : null}
                  {filters.estado !== 'todos' ? <FilterChip label={`Estado: ${filters.estado}`} onClear={() => updateFilter('estado', 'todos')} /> : null}
                  {filters.tipo !== 'todos' ? <FilterChip label={`Tipo: ${filters.tipo}`} onClear={() => updateFilter('tipo', 'todos')} /> : null}
                  {filters.responsable !== 'todos' ? <FilterChip label={`Responsable: ${filters.responsable}`} onClear={() => updateFilter('responsable', 'todos')} /> : null}
                  {filters.instrumento !== 'todos' ? <FilterChip label={`Instrumento: ${instrumentos.find((instrumento) => instrumento.id === filters.instrumento)?.codigo || filters.instrumento}`} onClear={() => updateFilter('instrumento', 'todos')} /> : null}
                  {!sameSort(sortConfig, DEFAULT_SORT) ? <FilterChip label={`Orden: ${SORT_OPTIONS.find((option) => option.key === sortConfig.key)?.label || sortConfig.key} ${sortConfig.direction === 'asc' ? '↑' : '↓'}`} onClear={() => setSortConfig(DEFAULT_SORT)} /> : null}
                </div>
              ) : null}
            </div>

            {indicadoresOrdenados.length ? (
              <>
                <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/80">
                      <tr>
                        {TABLE_HEADERS.map((header) => (
                          <th key={header.key} scope="col" className={`px-4 py-3 text-left text-[11px] uppercase tracking-[0.16em] text-slate-500 ${header.className}`}>
                            <button
                              type="button"
                              onClick={() => toggleSort(header.key)}
                              className="inline-flex items-center gap-2 font-semibold hover:text-slate-700"
                            >
                              {header.label}
                              <SortIcon active={sortConfig.key === header.key} direction={sortConfig.direction} />
                            </button>
                          </th>
                        ))}
                        <th scope="col" className="px-4 py-3 text-right text-[11px] uppercase tracking-[0.16em] text-slate-500">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {indicadoresOrdenados.map((indicador) => (
                        <tr key={indicador.id} className="align-top hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-4">
                            <p className="font-mono text-sm font-semibold text-navy">{indicador.codigoLabel}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-navy">{indicador.nombreLabel}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{indicador.dimensionLabel}</span>
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue">{indicador.subdimensionLabel}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-semibold text-slate-700">{indicador.instrumentoCodigo}</p>
                            <p className="mt-1 text-xs text-slate-500">{indicador.instrumentoNombre}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">{indicador.tipoLabel}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{indicador.responsable_operativo}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${indicador.metaDisplay === 'Sin meta' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                              {indicador.metaDisplay}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge isActivo={indicador.isActivo} />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link to={buildIndicadorHref(indicador.instrumento_id, indicador.id)} className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue hover:text-blue">
                                Ver indicador
                              </Link>
                              <a
                                href={buildIndicadorHref(indicador.instrumento_id, indicador.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-blue hover:text-blue"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 lg:hidden">
                  {indicadoresOrdenados.map((indicador) => (
                    <article key={indicador.id} className="rounded-2xl border border-slate-100 p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm font-semibold text-navy">{indicador.codigoLabel}</p>
                          <p className="mt-1 text-sm font-semibold text-navy">{indicador.nombreLabel}</p>
                        </div>
                        <StatusBadge isActivo={indicador.isActivo} />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{indicador.dimensionLabel}</span>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue">{indicador.subdimensionLabel}</span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoField label="Instrumento" value={`${indicador.instrumentoCodigo} · ${indicador.instrumentoNombre}`} />
                        <InfoField label="Tipo" value={indicador.tipoLabel} />
                        <InfoField label="Responsable" value={indicador.responsable_operativo} />
                        <InfoField label="Meta" value={indicador.metaDisplay} emphasis={indicador.metaDisplay === 'Sin meta'} />
                      </div>

                      <div className="flex gap-2">
                        <Link to={buildIndicadorHref(indicador.instrumento_id, indicador.id)} className="inline-flex flex-1 items-center justify-center rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue">
                          Ver indicador
                        </Link>
                        <a
                          href={buildIndicadorHref(indicador.instrumento_id, indicador.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-blue hover:text-blue"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <h2 className="text-xl font-display font-bold text-navy">No hay indicadores para esos filtros</h2>
                <p className="mt-2 text-sm text-slate-500 font-body">
                  Ajusta estado, tipo, responsable o texto de búsqueda para volver a ver resultados.
                </p>
              </section>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
      {label}
      <button type="button" onClick={onClear} className="text-slate-400 transition-colors hover:text-slate-700">
        <X size={12} />
      </button>
    </span>
  );
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowDownUp size={14} className="text-slate-400" />;
  return direction === 'asc' ? <ChevronUp size={14} className="text-blue" /> : <ChevronDown size={14} className="text-blue" />;
}

function StatusBadge({ isActivo }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isActivo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
      {isActivo ? <CheckCircle2 size={13} /> : <CircleOff size={13} />}
      {isActivo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

function InfoField({ label, value, emphasis = false }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-medium ${emphasis ? 'text-amber-700' : 'text-slate-700'}`}>{value}</p>
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