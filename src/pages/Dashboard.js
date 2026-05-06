import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useDashboardResumen, useRefreshDashboardResumen } from '../hooks/useApi';
import Alert from '../components/ui/Alert';
import Skeleton from '../components/ui/Skeleton';

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-white rounded-card shadow-card p-6 space-y-4">
            <Skeleton className="h-6 w-16 rounded-full" rounded="rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" rounded="rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6">
        <section className="bg-white rounded-card shadow-card p-5 space-y-4">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-80 w-full" />
        </section>
        <section className="bg-white rounded-card shadow-card p-5 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-44" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border border-gray-100 rounded-xl p-4 space-y-3">
              <div className="flex justify-between gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" rounded="rounded-full" />
              </div>
              <Skeleton className="h-4 w-48" />
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((__, innerIndex) => (
                  <Skeleton key={innerIndex} className="h-2 flex-1 rounded-full" rounded="rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, error } = useDashboardResumen();
  const refreshDashboard = useRefreshDashboardResumen();
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const resumen = Array.isArray(dashboardData) ? dashboardData : dashboardData?.items || [];
  const updatedAt = Array.isArray(dashboardData) ? null : dashboardData?.updated_at || null;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const resumenOrdenado = [...resumen].sort(compareByUrgency);
  const resumenFiltrado = resumenOrdenado.filter(item => matchesUrgencyFilter(item, urgencyFilter));
  const totalInstrumentos = resumen.length;
  const instrumentosEnRojo = resumen.filter(item => item.semaforo === 'rojo').length;
  const instrumentosConCorteUrgente = resumen.filter(item => isUrgentCutoff(item.dias_para_corte)).length;
  const cumplimientoPromedio = totalInstrumentos
    ? Math.round(resumen.reduce((acc, item) => acc + normalizeNumber(item.cumplimiento_global), 0) / totalInstrumentos)
    : 0;
  const totalIndicadores = resumen.reduce((acc, item) => acc + normalizeNumber(item.total_indicadores), 0);
  const totalIndicadoresConAvance = resumen.reduce((acc, item) => acc + normalizeNumber(item.indicadores_con_avance), 0);
  const coberturaAvance = totalIndicadores
    ? Math.round((totalIndicadoresConAvance / totalIndicadores) * 100)
    : 0;
  const metaGapPromedio = cumplimientoPromedio - 80;
  const roleConfig = getRoleDashboardConfig(user?.rol, {
    instrumentosEnRojo,
    instrumentosConCorteUrgente,
    coberturaAvance,
    cumplimientoPromedio,
  });

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-navy mb-2">
            Dashboard
          </h1>
          <p className="text-gray-500 font-body text-sm">
            Bienvenido/a, <span className="font-semibold text-navy">{user?.nombre}</span>
            {' '}· <span className="capitalize">{formatRoleLabel(user?.rol)}</span>
          </p>
          <p className="text-xs text-gray-500 font-body mt-2">
            {updatedAt ? `Actualizado ${formatUpdatedAt(updatedAt)}` : 'Sin marca de actualizacion desde backend'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => downloadExecutiveSummaryCsv({
              items: resumenFiltrado,
              urgencyFilter,
              userRole: user?.rol,
              updatedAt,
              cumplimientoPromedio,
              instrumentosEnRojo,
              instrumentosConCorteUrgente,
              coberturaAvance,
            })}
            disabled={!resumenFiltrado.length}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold font-body transition-colors ${!resumenFiltrado.length ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white text-navy border border-gray-200 hover:border-blue hover:text-blue'}`}
          >
            Exportar resumen CSV
          </button>
          <button
            type="button"
            onClick={() => refreshDashboard.mutate()}
            disabled={refreshDashboard.isPending}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold font-body transition-colors ${refreshDashboard.isPending ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-navy text-white hover:bg-blue'}`}
          >
            {refreshDashboard.isPending ? 'Actualizando...' : 'Actualizar dashboard'}
          </button>
        </div>
      </div>

      {!error ? (
        <section className="mb-6 rounded-card shadow-card overflow-hidden bg-[linear-gradient(135deg,#25306B_0%,#006BB9_100%)] text-white">
          <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60 font-body">{roleConfig.eyebrow}</p>
              <h2 className="mt-3 text-2xl font-display font-bold">{roleConfig.title}</h2>
              <p className="mt-3 max-w-2xl text-sm text-white/80 font-body">{roleConfig.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {roleConfig.focus.map(item => (
                  <span key={item} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold font-body">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 font-body">Foco sugerido hoy</p>
              <p className="mt-3 text-3xl font-display font-bold">{roleConfig.highlightValue}</p>
              <p className="mt-2 text-sm text-white/80 font-body">{roleConfig.highlightLabel}</p>
            </div>
          </div>
        </section>
      ) : null}

      {error ? <Alert type="error" message={error.message} className="mb-6" /> : null}
      {refreshDashboard.error ? <Alert type="error" message={refreshDashboard.error.message} className="mb-6" /> : null}

      {!error && !resumen.length ? (
        <Alert
          type="warning"
          message="El dashboard no recibió instrumentos activos desde backend. Si tus hojas son antiguas, vuelve a desplegar Apps Script con esta corrección y espera a que expire la cache." 
          className="mb-6"
        />
      ) : null}

      {!error && resumen.length ? (
        <section className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Cumplimiento promedio"
            value={`${cumplimientoPromedio}%`}
            hint={formatGoalGap(metaGapPromedio)}
          />
          <MetricCard
            label="Instrumentos en rojo"
            value={instrumentosEnRojo}
            hint={`${Math.round((instrumentosEnRojo / totalInstrumentos) * 100)}% del total`}
            accent="text-red"
          />
          <MetricCard
            label="Cortes en 7 dias"
            value={instrumentosConCorteUrgente}
            hint="Con vencimiento cercano o ya vencidos"
            accent="text-yellow-700"
          />
          <MetricCard
            label="Cobertura de avance"
            value={`${coberturaAvance}%`}
            hint={`${totalIndicadoresConAvance}/${totalIndicadores} indicadores con avance`}
            accent="text-blue"
          />
        </section>
      ) : null}

      {!error && resumen.length ? (
        <section className="bg-white rounded-card shadow-card p-4 mb-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-display font-bold text-navy">Filtro por urgencia temporal</h2>
              <p className="text-xs text-gray-500 font-body mt-1">Prioriza instrumentos por cercania del proximo corte.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {URGENCY_FILTERS.map(filter => {
                const isActive = urgencyFilter === filter.value;
                return (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setUrgencyFilter(filter.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold font-body border transition-colors ${isActive ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-blue hover:text-blue'}`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Tarjetas por instrumento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resumenFiltrado.map((item) => {
          const coverage = calculateCoverage(item.indicadores_con_avance, item.total_indicadores);
          const goalGap = normalizeNumber(item.cumplimiento_global) - 80;

          return (
          <div key={item.instrumento.id} className="bg-white rounded-card shadow-card p-6 flex flex-col gap-4">
            <div
              className="text-white text-xs font-semibold px-3 py-1 rounded-full self-start font-body"
              style={{ background: item.instrumento.color_hex || '#25306B' }}
            >
              {item.instrumento.codigo}
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-navy">{item.instrumento.nombre}</h2>
              <p className="text-xs text-gray-500 font-body mt-1 line-clamp-2">
                {item.instrumento.descripcion || 'Seguimiento institucional con avances, cortes y semáforo de cumplimiento.'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-body">
                <span className="text-gray-500">Cumplimiento</span>
                <span className="font-semibold text-navy">{item.cumplimiento_global}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(0, Math.min(item.cumplimiento_global, 100))}%`,
                    background: semaforoColor(item.semaforo),
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-body">
                <span className={`px-2 py-0.5 rounded-full font-medium ${semaforoBadge(item.semaforo)}`}>
                  {item.semaforo}
                </span>
                <span className="text-gray-500">Cobertura {coverage}%</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-body space-y-1">
              <p>
                Brecha meta 80%:{' '}
                <span className={goalGap >= 0 ? 'text-green-700 font-semibold' : 'text-red font-semibold'}>
                  {formatGoalGap(goalGap)}
                </span>
              </p>
              <p>Indicadores con avance: <span className="text-navy font-medium">{item.indicadores_con_avance}/{item.total_indicadores}</span></p>
              <p>Próximo corte: <span className="text-navy font-medium">{item.proximo_corte?.nombre_corte || '—'}</span></p>
              <p>
                Plazo:{' '}
                <span className={deadlineTone(item.dias_para_corte)}>
                  {formatDeadlineLabel(item.dias_para_corte)}
                </span>
              </p>
            </div>
            <div className="pt-2">
              <Link
                to={`/instrumento/${item.instrumento.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue text-white text-sm font-body hover:bg-navy transition-colors"
              >
                Ver detalle
              </Link>
            </div>
          </div>
          );
        })}
      </div>

      {!error && resumen.length && !resumenFiltrado.length ? (
        <Alert
          type="warning"
          message="No hay instrumentos que coincidan con el filtro de urgencia seleccionado."
          className="mt-6"
        />
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-6 mt-6">
        <section className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-display font-bold text-navy">Comparativo de cumplimiento</h2>
              <p className="text-xs text-gray-500 font-body mt-1">Meta visual de referencia en 80%.</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumenOrdenado.map(item => ({
                codigo: item.instrumento.codigo,
                cumplimiento: item.cumplimiento_global,
                color: semaforoColor(item.semaforo),
                semaforo: item.semaforo,
                dias_para_corte: item.dias_para_corte,
                indicadores_con_avance: item.indicadores_con_avance,
                total_indicadores: item.total_indicadores,
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="codigo" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip content={<DashboardTooltip />} />
                <ReferenceLine y={80} stroke="#25306B" strokeDasharray="4 4" label={{ value: 'Meta 80%', position: 'insideTopRight', fill: '#25306B', fontSize: 12 }} />
                <Bar dataKey="cumplimiento" radius={[10, 10, 0, 0]}>
                  {resumenOrdenado.map(item => (
                    <Cell key={item.instrumento.id} fill={semaforoColor(item.semaforo)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-card shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-display font-bold text-navy">Próximos cortes</h2>
              <p className="text-xs text-gray-500 font-body mt-1">Resumen de hitos más cercanos del año.</p>
            </div>
            <Link to="/gantt" className="text-sm text-blue hover:underline font-body">Ver calendario</Link>
          </div>
          <div className="space-y-4">
            {resumenOrdenado.map(item => (
              <div key={item.instrumento.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.instrumento.color_hex || '#25306B' }} />
                    <p className="text-sm font-semibold text-navy truncate">{item.instrumento.codigo} · {item.instrumento.nombre}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${semaforoBadge(item.semaforo)}`}>{item.semaforo}</span>
                </div>
                <p className="text-xs text-gray-500 font-body">
                  {item.proximo_corte?.nombre_corte || 'Sin corte pendiente'}
                  {item.proximo_corte ? ` · ${item.proximo_corte.fecha_limite}` : ''}
                </p>
                <p className="text-xs font-body mt-2">
                  <span className={deadlineTone(item.dias_para_corte)}>{formatDeadlineLabel(item.dias_para_corte)}</span>
                </p>
                <div className="mt-3 flex items-center gap-2">
                  {(item.cortes || []).slice(0, 4).map(corte => (
                    <div
                      key={corte.id}
                      className="h-2 rounded-full flex-1"
                      title={`${corte.nombre_corte} · ${corte.estado_visual}`}
                      style={{ background: estadoColor(corte.estado_visual) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, hint, accent = 'text-navy' }) {
  return (
    <article className="bg-white rounded-card shadow-card p-5">
      <p className="text-xs uppercase tracking-[0.16em] text-gray-500 font-body">{label}</p>
      <p className={`mt-3 text-3xl font-display font-bold ${accent}`}>{value}</p>
      <p className="mt-2 text-xs text-gray-500 font-body">{hint}</p>
    </article>
  );
}

function DashboardTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  const goalGap = normalizeNumber(point.cumplimiento) - 80;

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-card px-4 py-3">
      <p className="text-sm font-semibold text-navy font-body">{label}</p>
      <p className="text-xs text-gray-500 font-body mt-2">Cumplimiento: <span className="text-navy font-semibold">{point.cumplimiento}%</span></p>
      <p className="text-xs text-gray-500 font-body">Brecha meta: <span className={goalGap >= 0 ? 'text-green-700 font-semibold' : 'text-red font-semibold'}>{formatGoalGap(goalGap)}</span></p>
      <p className="text-xs text-gray-500 font-body">Semaforo: <span className="text-navy font-semibold capitalize">{point.semaforo}</span></p>
      <p className="text-xs text-gray-500 font-body">Cobertura: <span className="text-navy font-semibold">{calculateCoverage(point.indicadores_con_avance, point.total_indicadores)}%</span></p>
      <p className="text-xs text-gray-500 font-body">Plazo: <span className={deadlineTone(point.dias_para_corte)}>{formatDeadlineLabel(point.dias_para_corte)}</span></p>
    </div>
  );
}

function formatUpdatedAt(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'sin hora disponible';

  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatRoleLabel(role) {
  return ROLE_LABELS[role] || (role || '').replace(/_/g, ' ');
}

function getRoleDashboardConfig(role, metrics) {
  const normalizedRole = role || 'default';

  const configs = {
    admin: {
      eyebrow: 'Vista de control operacional',
      title: 'Prioriza consistencia de carga y seguimiento de hitos abiertos.',
      description: 'Esta cabecera resalta brechas operativas para administracion: cobertura de avance, proximidad de cortes y focos donde el tablero puede degradarse por atraso de carga.',
      focus: ['Cobertura de avance', 'Cortes urgentes', 'Instrumentos sin holgura'],
      highlightValue: `${metrics.coberturaAvance}%`,
      highlightLabel: 'Cobertura total reportada en indicadores con avance.',
    },
    director_ejecutivo: {
      eyebrow: 'Vista ejecutiva priorizada',
      title: 'Concentra riesgos de cumplimiento y proximidad de decisiones.',
      description: 'Pensada para lectura rapida de excepciones: instrumentos en rojo, brecha contra meta institucional y cortes con riesgo inmediato de vencimiento.',
      focus: ['Semaforos rojos', 'Brecha contra meta', 'Cortes en riesgo'],
      highlightValue: String(metrics.instrumentosEnRojo),
      highlightLabel: 'Instrumentos en rojo que requieren seguimiento directivo.',
    },
    subdirector: {
      eyebrow: 'Vista de seguimiento tactico',
      title: 'Equilibra avance reportado con presion de plazos cercanos.',
      description: 'El foco tactico combina avance real y urgencia temporal para priorizar coordinacion con equipos antes del siguiente corte.',
      focus: ['Cumplimiento promedio', 'Cobertura reportada', 'Vencimientos proximos'],
      highlightValue: String(metrics.instrumentosConCorteUrgente),
      highlightLabel: 'Instrumentos con corte vencido o dentro de 7 dias.',
    },
    default: {
      eyebrow: 'Vista general',
      title: 'Resumen ejecutivo del estado agregado por instrumento.',
      description: 'Entrega una lectura sintetica de cumplimiento, cobertura de avance y proximidad de cortes para navegar al detalle con contexto.',
      focus: ['Cumplimiento', 'Semaforos', 'Proximos cortes'],
      highlightValue: `${metrics.cumplimientoPromedio}%`,
      highlightLabel: 'Cumplimiento promedio agregado del tablero.',
    },
  };

  return configs[normalizedRole] || configs.default;
}

function downloadExecutiveSummaryCsv({
  items,
  urgencyFilter,
  userRole,
  updatedAt,
  cumplimientoPromedio,
  instrumentosEnRojo,
  instrumentosConCorteUrgente,
  coberturaAvance,
}) {
  if (!items?.length) return;

  const metadataRows = [
    ['Reporte', 'Dashboard ejecutivo'],
    ['Rol', formatRoleLabel(userRole)],
    ['Filtro urgencia', getUrgencyFilterLabel(urgencyFilter)],
    ['Actualizado', updatedAt ? formatUpdatedAt(updatedAt) : 'Sin marca de actualizacion'],
    ['Cumplimiento promedio', `${cumplimientoPromedio}%`],
    ['Instrumentos en rojo', String(instrumentosEnRojo)],
    ['Cortes en 7 dias', String(instrumentosConCorteUrgente)],
    ['Cobertura de avance', `${coberturaAvance}%`],
    [],
  ];

  const headerRow = [[
    'Codigo',
    'Instrumento',
    'Cumplimiento global',
    'Brecha meta 80',
    'Semaforo',
    'Indicadores con avance',
    'Total indicadores',
    'Cobertura avance',
    'Indicadores pendientes',
    'Proximo corte',
    'Fecha limite',
    'Dias para corte',
    'Plazo visual',
  ]];

  const dataRows = items.map(item => [
    item.instrumento.codigo,
    item.instrumento.nombre,
    `${normalizeNumber(item.cumplimiento_global)}%`,
    formatGoalGap(normalizeNumber(item.cumplimiento_global) - 80),
    item.semaforo,
    String(normalizeNumber(item.indicadores_con_avance)),
    String(normalizeNumber(item.total_indicadores)),
    `${calculateCoverage(item.indicadores_con_avance, item.total_indicadores)}%`,
    String(normalizeNumber(item.indicadores_pendientes)),
    item.proximo_corte?.nombre_corte || 'Sin corte pendiente',
    item.proximo_corte?.fecha_limite || '',
    item.dias_para_corte === null || item.dias_para_corte === undefined ? '' : String(item.dias_para_corte),
    formatDeadlineLabel(item.dias_para_corte),
  ]);

  const csv = [...metadataRows, ...headerRow, ...dataRows]
    .map(row => row.map(escapeCsvCell).join(','))
    .join('\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dashboard-ejecutivo-${formatFileDate(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value) {
  const normalized = String(value ?? '');
  return `"${normalized.replace(/"/g, '""')}"`;
}

function getUrgencyFilterLabel(filter) {
  return URGENCY_FILTERS.find(item => item.value === filter)?.label || 'Todos';
}

function formatFileDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}`;
}

const ROLE_LABELS = {
  admin: 'Administrador',
  subdirector: 'Subdirector',
  director_ejecutivo: 'Director Ejecutivo',
};

const URGENCY_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'overdue', label: 'Vencidos' },
  { value: '7days', label: 'Vence en 7 dias' },
  { value: '15days', label: 'Vence en 15 dias' },
  { value: 'no-cutoff', label: 'Sin corte proximo' },
];

function matchesUrgencyFilter(item, filter) {
  const days = item.dias_para_corte;

  if (filter === 'all') return true;
  if (filter === 'overdue') return typeof days === 'number' && days < 0;
  if (filter === '7days') return typeof days === 'number' && days >= 0 && days <= 7;
  if (filter === '15days') return typeof days === 'number' && days >= 0 && days <= 15;
  if (filter === 'no-cutoff') return days === null || days === undefined;

  return true;
}

function compareByUrgency(a, b) {
  const scoreA = urgencyScore(a.dias_para_corte);
  const scoreB = urgencyScore(b.dias_para_corte);

  if (scoreA !== scoreB) return scoreA - scoreB;
  return normalizeNumber(a.cumplimiento_global) - normalizeNumber(b.cumplimiento_global);
}

function urgencyScore(days) {
  if (days === null || days === undefined) return 9999;
  if (days < 0) return days - 1000;
  return days;
}

function calculateCoverage(done, total) {
  const normalizedTotal = normalizeNumber(total);
  if (!normalizedTotal) return 0;
  return Math.round((normalizeNumber(done) / normalizedTotal) * 100);
}

function formatGoalGap(value) {
  const normalized = normalizeNumber(value);
  if (normalized === 0) return 'En meta';
  return `${normalized > 0 ? '+' : ''}${normalized} pts`;
}

function formatDeadlineLabel(days) {
  if (days === null || days === undefined) return 'Sin corte programado';
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return overdueDays === 1 ? 'Vencido ayer' : `Vencido hace ${overdueDays} dias`;
  }
  if (days === 0) return 'Vence hoy';
  if (days === 1) return 'Vence manana';
  if (days <= 7) return `Vence en ${days} dias`;
  if (days <= 15) return `Vence en ${days} dias`;
  const weeks = Math.round(days / 7);
  return weeks <= 1 ? 'Vence en 1 semana' : `Vence en ${weeks} semanas`;
}

function deadlineTone(days) {
  if (days === null || days === undefined) return 'text-gray-500 font-medium';
  if (days < 0) return 'text-red font-semibold';
  if (days <= 7) return 'text-red font-semibold';
  if (days <= 15) return 'text-yellow-700 font-semibold';
  return 'text-navy font-medium';
}

function isUrgentCutoff(days) {
  return typeof days === 'number' && days <= 7;
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function semaforoColor(semaforo) {
  if (semaforo === 'verde') return '#22C55E';
  if (semaforo === 'amarillo') return '#F59E0B';
  return '#FF1D3D';
}

function semaforoBadge(semaforo) {
  if (semaforo === 'verde') return 'bg-green-100 text-green-700';
  if (semaforo === 'amarillo') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function estadoColor(estado) {
  if (estado === 'cerrado') return '#22C55E';
  if (estado === 'en_curso') return '#006BB9';
  if (estado === 'vencido') return '#FF1D3D';
  return '#CBD5E1';
}
