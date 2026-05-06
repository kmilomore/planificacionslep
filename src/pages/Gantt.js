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
  });
  const { data: metricas, isLoading: loadingMetricas } = useMetricasCorte(selectedCorte?.id);
  const currentMonthIndex = new Date().getMonth();

  const filteredData = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();

    return data
      .map(({ instrumento, cortes = [] }) => {
        const matchesInstrument = !searchValue
          || [instrumento.codigo, instrumento.nombre].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchValue));
        const filteredCortes = cortes.filter((corte) => {
          if (filters.estado !== 'todos' && corte.estado_visual !== filters.estado) return false;
          if (!searchValue) return true;

          return matchesInstrument || [corte.codigo_corte, corte.nombre_corte].filter(Boolean).some((value) => String(value).toLowerCase().includes(searchValue));
        });

        if (!matchesInstrument && !filteredCortes.length) return null;

        return {
          instrumento,
          cortes: matchesInstrument ? filteredCortes : filteredCortes,
        };
      })
      .filter(Boolean);
  }, [data, filters.estado, filters.search]);

  const nearestCorteId = getNearestUpcomingCorteId(filteredData);
  const hasVisibleData = filteredData.some(({ cortes = [] }) => cortes.length > 0);

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
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_220px_auto] lg:items-end">
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

          <button
            type="button"
            onClick={() => setFilters({ search: '', estado: 'todos' })}
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
                        {cortesMes.map(corte => (
                          (() => {
                            const isNearest = corte.id === nearestCorteId;
                            return (
                          <button
                            key={corte.id}
                            onClick={() => setSelectedCorte(corte)}
                            title={buildCorteTooltip(corte)}
                            className={`w-full text-left px-3 py-3 rounded-xl text-white font-body hover:opacity-90 transition-opacity shadow-sm ${isNearest ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-white scale-[1.02]' : ''}`}
                            style={{ background: estadoColor(corte.estado_visual, instrumento.color_hex, isNearest) }}
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
                            );
                          })()
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
                <p className="mt-1 text-sm text-slate-600">Abre el instrumento para revisar indicadores, avances y gestión asociada a este corte.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/instrumento/${selectedCorte.instrumento_id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
                  onClick={() => setSelectedCorte(null)}
                >
                  Gestionar avances
                </Link>
                <Link
                  to={`/instrumento/${selectedCorte.instrumento_id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  onClick={() => setSelectedCorte(null)}
                >
                  Ver instrumento
                </Link>
              </div>
            </div>

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

function buildCorteTooltip(corte) {
  const lines = [
    corte.nombre_corte || corte.codigo_corte || 'Corte',
    `Estado: ${humanizeEstado(corte.estado_visual)}`,
    `Periodo: ${formatDateRange(corte.fecha_inicio, corte.fecha_limite)}`,
  ];

  if (Number.isFinite(Number(corte.dias_para_cierre))) {
    lines.push(`Días para cierre: ${corte.dias_para_cierre}`);
  }

  return lines.join('\n');
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