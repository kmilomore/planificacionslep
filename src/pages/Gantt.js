import { useState } from 'react';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { useGanttData, useMetricasCorte } from '../hooks/useApi';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Gantt() {
  const { data = [], isLoading } = useGanttData();
  const [selectedCorte, setSelectedCorte] = useState(null);
  const { data: metricas, isLoading: loadingMetricas } = useMetricasCorte(selectedCorte?.id);

  if (isLoading) {
    return <div className="p-6 flex justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-navy">Calendario de cortes</h1>
        <p className="text-sm text-gray-500 font-body mt-1">Vista anual de los instrumentos, sus cortes y su estado actual.</p>
      </div>

      <div className="bg-white rounded-card shadow-card p-5 overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[220px_repeat(12,minmax(0,1fr))] gap-2 items-center mb-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide font-body">Instrumento</div>
            {MONTHS.map(month => (
              <div key={month} className="text-xs font-semibold text-gray-500 text-center font-body">{month}</div>
            ))}
          </div>

          <div className="space-y-3">
            {data.map(({ instrumento, cortes }) => (
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
                    <div key={`${instrumento.id}-${monthIndex}`} className="min-h-20 rounded-xl border border-gray-100 p-2 bg-white">
                      <div className="space-y-2">
                        {cortesMes.map(corte => (
                          <button
                            key={corte.id}
                            onClick={() => setSelectedCorte(corte)}
                            className="w-full text-left px-2 py-2 rounded-lg text-white text-[11px] leading-tight font-body hover:opacity-90 transition-opacity"
                            style={{ background: estadoColor(corte.estado_visual, instrumento.color_hex) }}
                          >
                            <div className="font-semibold">{corte.codigo_corte}</div>
                            <div className="opacity-90">{corte.fecha_limite}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-body text-gray-600">
        <Legend color="#006BB9" label="En curso" />
        <Legend color="#22C55E" label="Cerrado" />
        <Legend color="#FF1D3D" label="Vencido" />
        <Legend color="#CBD5E1" label="Pendiente" />
      </div>

      <Modal
        open={!!selectedCorte}
        onClose={() => setSelectedCorte(null)}
        title={selectedCorte ? `${selectedCorte.nombre_corte} · ${selectedCorte.codigo_corte}` : 'Detalle del corte'}
      >
        {!selectedCorte || loadingMetricas ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : (
          <div className="space-y-4 font-body text-sm">
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Estado" value={selectedCorte.estado_visual} />
              <Metric label="Fecha límite" value={selectedCorte.fecha_limite} />
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

function estadoColor(estado, fallback = '#25306B') {
  if (estado === 'cerrado') return '#22C55E';
  if (estado === 'en_curso') return fallback || '#006BB9';
  if (estado === 'vencido') return '#FF1D3D';
  return '#CBD5E1';
}

function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-navy font-semibold">{value}</p>
    </div>
  );
}