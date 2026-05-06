import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { useGanttData, useMetricasCorte } from '../hooks/useApi';
import Skeleton from '../components/ui/Skeleton';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function GanttSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="bg-white rounded-card shadow-card p-5 overflow-x-auto">
        <div className="min-w-[980px] space-y-3">
          <div className="grid grid-cols-[220px_repeat(12,minmax(0,1fr))] gap-2 items-center">
            <Skeleton className="h-4 w-24" />
            {MONTHS.map((month) => (
              <Skeleton key={month} className="mx-auto h-4 w-8" />
            ))}
          </div>

          {Array.from({ length: 4 }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[220px_repeat(12,minmax(0,1fr))] gap-2 items-stretch">
              <div className="rounded-xl border border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 rounded-full" rounded="rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-40" />
              </div>

              {MONTHS.map((month, monthIndex) => (
                <div key={`${month}-${monthIndex}`} className="min-h-20 rounded-xl border border-gray-100 p-2 bg-white">
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    {monthIndex % 3 === 0 ? <Skeleton className="h-7 w-3/4 rounded-lg" /> : null}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" rounded="rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ModalMetricasSkeleton({ selectedCorte }) {
  return (
    <div className="space-y-4">
      {selectedCorte ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ventana del corte</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <Metric label="Inicio" value={formatDateLabel(selectedCorte.fecha_inicio)} />
            <Metric label="Límite" value={formatDateTimeLabel(selectedCorte.fecha_limite)} />
            <Metric label="Periodo" value={formatDateRange(selectedCorte.fecha_inicio, selectedCorte.fecha_limite)} />
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <Skeleton className="h-4 w-36" />
        <div className="mt-3 grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center py-2"><Spinner /></div>
    </div>
  );
}

export default function Gantt() {
  const { data = [], isLoading } = useGanttData();
  const [selectedCorte, setSelectedCorte] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    estado: 'todos',
    responsable: 'todos',
  });
  const { data: metricas, isLoading: loadingMetricas } = useMetricasCorte(selectedCorte?.id);
  const currentMonthIndex = new Date().getMonth();
  const responsables = useMemo(() => {
    return data
      .map(({ instrumento }) => ({
        id: instrumento.responsable_id || 'sin_responsable',
        label: instrumento.responsable_display || 'Sin responsable',
      }))
      .filter((item, index, items) => item.label && items.findIndex((candidate) => candidate.id === item.id) === index)
      .sort((left, right) => left.label.localeCompare(right.label, 'es'));
  }, [data]);

  const filteredData = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();

    return data
      .map(({ instrumento, cortes = [] }) => {
        const matchesResponsable = filters.responsable === 'todos'
          || (filters.responsable === 'sin_responsable' ? !instrumento.responsable_id : instrumento.responsable_id === filters.responsable);
        if (!matchesResponsable) return null;

        const matchesInstrument = !searchValue
          || [instrumento.codigo, instrumento.nombre, instrumento.responsable_display].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchValue));
        const filteredCortes = cortes.filter((corte) => {
          if (filters.estado !== 'todos' && corte.estado_visual !== filters.estado) return false;
          if (!searchValue) return true;

          return matchesInstrument || [corte.codigo_corte, corte.nombre_corte].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchValue));
        });

        if (!matchesInstrument && !filteredCortes.length) return null;

        return {
          instrumento,
          cortes: filteredCortes,
        };
      })
      .filter(Boolean);
  }, [data, filters.estado, filters.responsable, filters.search]);

  const nearestCorteId = getNearestUpcomingCorteId(filteredData);
  const hasVisibleData = filteredData.some(({ cortes = [] }) => cortes.length > 0);
  const primaryCta = getPrimaryCta(selectedCorte, metricas?.indicador_recomendado);
  const secondaryCta = selectedCorte
    ? {
        to: buildInstrumentoRoute(selectedCorte.instrumento_id, selectedCorte.id),
        label: 'Ver corte en instrumento',
      }
    : null;

  if (isLoading) {
    return <GanttSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy">Calendario de cortes</h1>
        <p className="text-sm text-gray-500 font-body mt-1">Vista anual de los instrumentos, sus cortes y su estado actual.</p>
      </div>

      <section className="bg-white rounded-card shadow-card p-5 border border-slate-100">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_220px_220px_auto] lg:items-end">
          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 font-body">Buscar instrumento o corte</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              placeholder="Ej. PME, Corte 2, Convivencia"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue focus:ring-2 focus:ring-sky-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 font-body">Estado</span>
            <select
              value={filters.estado}
              onChange={(event) => setFilters((current) => ({ ...current, estado: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue focus:ring-2 focus:ring-sky-100"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="vencido">Vencido</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 font-body">Responsable</span>
            <select
              value={filters.responsable}
              onChange={(event) => setFilters((current) => ({ ...current, responsable: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue focus:ring-2 focus:ring-sky-100"
            >
              <option value="todos">Todos los responsables</option>
              {responsables.map((responsable) => (
                <option key={responsable.id} value={responsable.id}>{responsable.label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => setFilters({ search: '', estado: 'todos', responsable: 'todos' })}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      <div className="bg-white rounded-card shadow-card p-5 overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[220px_repeat(12,minmax(0,1fr))] gap-2 items-center mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">Instrumento</div>
            {MONTHS.map((month, monthIndex) => (
              <div
                key={month}
                className={`rounded-lg px-2 py-2 text-xs font-semibold text-center font-body ${monthIndex === currentMonthIndex ? 'bg-sky-50 text-blue' : 'text-gray-500'}`}
              >
                {month}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {filteredData.map(({ instrumento, cortes }) => (
              <div key={instrumento.id} className="grid grid-cols-[220px_repeat(12,minmax(0,1fr))] gap-2 items-stretch">
                <div className="rounded-xl border border-gray-100 px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: instrumento.color_hex || '#25306B' }} />
                    <p className="text-sm font-semibold text-navy font-body">{instrumento.codigo}</p>
                  </div>
                  <p className="text-xs text-gray-500 font-body mt-1">{instrumento.nombre}</p>
                </div>

                {MONTHS.map((_, monthIndex) => {
                  const cortesMes = cortes.filter(corte => incluyeMes(corte, monthIndex));
                  return (
                    <div
                      key={`${instrumento.id}-${monthIndex}`}
                      className={`min-h-20 rounded-xl border p-2 ${monthIndex === currentMonthIndex ? 'border-sky-200 bg-sky-50/60' : 'border-gray-100 bg-white'}`}
                    >
                      <div className="space-y-2">
                        {cortesMes.map((corte) => (
                          <CorteCard
                            key={corte.id}
                            corte={corte}
                            instrumentColor={instrumento.color_hex}
                            isNearest={corte.id === nearestCorteId}
                            onSelect={() => setSelectedCorte(corte)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {!hasVisibleData ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700 font-body">No hay cortes para los filtros aplicados.</p>
              <p className="mt-1 text-sm text-slate-500 font-body">Prueba limpiando la búsqueda o cambiando el estado seleccionado.</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-body text-gray-600">
        <Legend color="#F59E0B" label="Próximo a vencer" ringColor="#FCD34D" />
        <Legend color="#006BB9" label="En curso" />
        <Legend color="#22C55E" label="Cerrado" />
        <Legend color="#FF1D3D" label="Vencido" />
        <Legend color="#CBD5E1" label="Pendiente" />
      </div>

      <Modal
        open={!!selectedCorte}
        onClose={() => setSelectedCorte(null)}
        title={selectedCorte ? `${selectedCorte.nombre_corte} · ${selectedCorte.codigo_corte}` : 'Detalle del corte'}
        size="full"
      >
        {!selectedCorte || loadingMetricas ? (
          <ModalMetricasSkeleton selectedCorte={selectedCorte} />
        ) : (
          <div className="space-y-4 font-body text-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Siguiente acción</p>
                <p className="mt-1 text-sm text-slate-600">{getPrimaryCtaDescription(metricas?.indicador_recomendado)}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {primaryCta ? (
                  <Link
                    to={primaryCta.to}
                    className="inline-flex items-center justify-center rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
                    onClick={() => setSelectedCorte(null)}
                  >
                    {primaryCta.label}
                  </Link>
                ) : null}
                {secondaryCta ? (
                  <Link
                    to={secondaryCta.to}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    onClick={() => setSelectedCorte(null)}
                  >
                    {secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            </div>

            {metricas?.indicador_recomendado ? (
              <div className="rounded-2xl border border-sky-100 bg-sky-50 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Indicador sugerido</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-700">
                  <span className="font-semibold text-navy">
                    {metricas.indicador_recomendado.codigo_indicador || 'Sin código'} · {metricas.indicador_recomendado.nombre || 'Indicador'}
                  </span>
                  <span className="text-slate-500">
                    Responsable: {metricas.indicador_recomendado.responsable_display || 'Sin responsable'}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ventana del corte</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <Metric label="Inicio" value={formatDateLabel(selectedCorte.fecha_inicio)} />
                <Metric label="Límite" value={formatDateTimeLabel(selectedCorte.fecha_limite)} />
                <Metric label="Periodo" value={formatDateRange(selectedCorte.fecha_inicio, selectedCorte.fecha_limite)} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Metric label="Estado" value={selectedCorte.estado_visual} />
              <Metric label="Indicadores" value={metricas?.total_indicadores ?? '—'} />
              <Metric label="Con avance" value={metricas?.indicadores_con_avance ?? '—'} />
              <Metric label="Pendientes" value={metricas?.indicadores_pendientes ?? '—'} />
              <Metric label="Aprobados" value={metricas?.aprobados ?? '—'} />
            </div>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Desglose de semáforos</p>
              <div className="grid grid-cols-3 gap-3">
                <Metric label="Verde" value={metricas?.semaforos?.verde ?? 0} />
                <Metric label="Amarillo" value={metricas?.semaforos?.amarillo ?? 0} />
                <Metric label="Rojo" value={metricas?.semaforos?.rojo ?? 0} />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function incluyeMes(corte, monthIndex) {
  const inicio = new Date(corte.fecha_inicio).getMonth();
  const fin = new Date(corte.fecha_limite).getMonth();
  return monthIndex >= inicio && monthIndex <= fin;
}

function CorteCard({ corte, instrumentColor, isNearest, onSelect }) {
  return (
    <div className="group relative">
      <button
        type="button"
        onClick={onSelect}
        className={`w-full text-left px-3 py-3 rounded-xl text-white font-body hover:opacity-90 transition-opacity shadow-sm ${isNearest ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-white scale-[1.02]' : ''}`}
        style={{ background: estadoColor(corte.estado_visual, instrumentColor, isNearest) }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold tracking-[0.08em] uppercase opacity-80">Corte</div>
            <div className="mt-1 text-[13px] font-semibold tracking-[0.01em]">{corte.codigo_corte}</div>
          </div>
          {isNearest ? (
            <span className="inline-flex rounded-full bg-white/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]">
              Próximo
            </span>
          ) : null}
        </div>
        <div className="mt-2 text-[11px] font-semibold opacity-95">Vence {formatShortDate(corte.fecha_limite)}</div>
        <div className="mt-1 text-[10px] opacity-75">{formatDateRange(corte.fecha_inicio, corte.fecha_limite)}</div>
      </button>

      <div className="pointer-events-none absolute left-0 top-full z-20 hidden w-64 pt-2 group-hover:block group-focus-within:block">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-navy">{corte.nombre_corte || corte.codigo_corte}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-600">
              {humanizeEstado(corte.estado_visual)}
            </span>
          </div>
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <p><span className="font-semibold text-slate-800">Periodo:</span> {formatDateRange(corte.fecha_inicio, corte.fecha_limite)}</p>
            <p><span className="font-semibold text-slate-800">Vence:</span> {formatDateTimeLabel(corte.fecha_limite)}</p>
            {Number.isFinite(Number(corte.dias_para_cierre)) ? (
              <p><span className="font-semibold text-slate-800">Tiempo restante:</span> {formatDiasParaCierre(corte.dias_para_cierre)}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatShortDate(value) {
  if (!value) return 'Sin fecha';
  const parts = extractDateParts(value);
  if (parts) return `${parts.day}/${parts.month}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

function formatDateLabel(value) {
  if (!value) return 'Sin fecha';
  const parts = extractDateParts(value);
  if (parts) return `${parts.day}/${parts.month}/${parts.year}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDateTimeLabel(value) {
  if (!value) return 'Sin fecha';
  const parts = extractDateParts(value);
  if (parts) {
    if (!parts.hours || !parts.minutes) return `${parts.day}/${parts.month}/${parts.year}`;
    return `${parts.day}/${parts.month}/${parts.year} ${parts.hours}:${parts.minutes}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatDateRange(startValue, endValue) {
  const start = formatDateLabel(startValue);
  const end = formatDateLabel(endValue);
  if (!startValue && !endValue) return 'Sin rango';
  if (!startValue) return `Hasta ${end}`;
  if (!endValue) return `Desde ${start}`;
  return `${start} - ${end}`;
}

function extractDateParts(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, year, month, day, hours, minutes] = match;
  return { year, month, day, hours, minutes };
}

function getNearestUpcomingCorteId(data) {
  const now = Date.now();
  let nearest = null;

  data.forEach(({ cortes = [] }) => {
    cortes.forEach((corte) => {
      const dueDate = resolveTimestamp(corte.fecha_limite);
      if (!Number.isFinite(dueDate) || dueDate < now) return;
      if (String(corte.estado_visual || '').toLowerCase() === 'cerrado') return;

      if (!nearest || dueDate < nearest.dueDate) {
        nearest = { id: corte.id, dueDate };
      }
    });
  });

  return nearest?.id || '';
}

function resolveTimestamp(value) {
  const date = new Date(value);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? Number.NaN : timestamp;
}

function estadoColor(estado, fallback = '#25306B', isNearest = false) {
  if (isNearest) return '#F59E0B';
  if (estado === 'cerrado') return '#22C55E';
  if (estado === 'en_curso') return fallback || '#006BB9';
  if (estado === 'vencido') return '#FF1D3D';
  return '#CBD5E1';
}

function humanizeEstado(estado) {
  if (estado === 'en_curso') return 'En curso';
  if (estado === 'cerrado') return 'Cerrado';
  if (estado === 'vencido') return 'Vencido';
  if (estado === 'pendiente') return 'Pendiente';
  return estado || 'Sin estado';
}

function formatDiasParaCierre(value) {
  const days = Number(value);
  if (!Number.isFinite(days)) return 'Sin dato';
  if (days < 0) return `Vencido hace ${Math.abs(days)} días`;
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence en 1 día';
  return `Vence en ${days} días`;
}

function buildInstrumentoRoute(instrumentoId, corteId, indicadorId = '') {
  const params = new URLSearchParams();
  if (corteId) params.set('corte', corteId);
  if (indicadorId) params.set('indicador', indicadorId);
  const query = params.toString();
  return query ? `/instrumento/${instrumentoId}?${query}` : `/instrumento/${instrumentoId}`;
}

function getPrimaryCta(selectedCorte, indicador) {
  if (!selectedCorte) return null;
  if (!indicador?.id) {
    return {
      to: buildInstrumentoRoute(selectedCorte.instrumento_id, selectedCorte.id),
      label: 'Ver corte en instrumento',
    };
  }

  if (indicador.accion_sugerida === 'ingresar_avance') {
    return {
      to: `/avance/${indicador.id}/${selectedCorte.id}`,
      label: `Ingresar avance · ${indicador.codigo_indicador || 'Indicador'}`,
    };
  }

  if (indicador.accion_sugerida === 'editar_avance') {
    return {
      to: `/avance/${indicador.id}/${selectedCorte.id}`,
      label: `Revisar avance · ${indicador.codigo_indicador || 'Indicador'}`,
    };
  }

  return {
    to: buildInstrumentoRoute(selectedCorte.instrumento_id, selectedCorte.id, indicador.id),
    label: `Ver indicador · ${indicador.codigo_indicador || 'Indicador'}`,
  };
}

function getPrimaryCtaDescription(indicador) {
  if (!indicador?.id) return 'Abre el instrumento con el corte ya seleccionado para revisar el detalle operativo.';
  if (indicador.accion_sugerida === 'ingresar_avance') return 'Se detectó un indicador sin reporte en este corte. Puedes ir directo a registrar su avance.';
  if (indicador.accion_sugerida === 'editar_avance') return 'Se detectó un indicador que requiere ajuste o revisión. Puedes abrirlo directamente desde aquí.';
  return 'El corte ya tiene avances cargados. Abre el indicador sugerido para revisar su estado en contexto.';
}

function Legend({ color, label, ringColor = '' }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-3 h-3 rounded-full ${ringColor ? 'ring-2 ring-offset-1' : ''}`} style={{ background: color, ringColor }} />
      <span>{label}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-navy font-semibold leading-6 break-words">{value}</p>
    </div>
  );
}