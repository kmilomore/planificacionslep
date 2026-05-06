import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useDashboardResumen } from '../hooks/useApi';
import Spinner from '../components/ui/Spinner';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: resumen = [], isLoading } = useDashboardResumen();

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-navy mb-2">
        Dashboard
      </h1>
      <p className="text-gray-500 font-body text-sm mb-6">
        Bienvenido/a, <span className="font-semibold text-navy">{user?.nombre}</span>
        {' '}· <span className="capitalize">{user?.rol?.replace('_', ' ')}</span>
      </p>

      {/* Tarjetas por instrumento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {resumen.map((item) => (
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
                <span className="text-gray-500">{item.indicadores_con_avance}/{item.total_indicadores} avances</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 font-body space-y-1">
              <p>Próximo corte: <span className="text-navy font-medium">{item.proximo_corte?.nombre_corte || '—'}</span></p>
              <p>Días restantes: <span className={item.dias_para_corte !== null && item.dias_para_corte <= 7 ? 'text-red font-semibold' : 'text-navy font-medium'}>{item.dias_para_corte ?? '—'}</span></p>
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
        ))}
      </div>

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
              <BarChart data={resumen.map(item => ({
                codigo: item.instrumento.codigo,
                cumplimiento: item.cumplimiento_global,
                color: semaforoColor(item.semaforo),
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="codigo" tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey={() => 80} stroke="#25306B" dot={false} activeDot={false} />
                <Bar dataKey="cumplimiento" radius={[10, 10, 0, 0]}>
                  {resumen.map(item => (
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
            {resumen.map(item => (
              <div key={item.instrumento.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.instrumento.color_hex || '#25306B' }} />
                    <p className="text-sm font-semibold text-navy truncate">{item.instrumento.codigo} · {item.instrumento.nombre}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${semaforoBadge(item.semaforo)}`}>{item.semaforo}</span>
                </div>
                <p className="text-xs text-gray-500 font-body">{item.proximo_corte?.nombre_corte || 'Sin corte pendiente'}{item.proximo_corte ? ` · ${item.proximo_corte.fecha_limite}` : ''}</p>
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
