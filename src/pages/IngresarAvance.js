import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Alert from '../components/ui/Alert';
import Spinner from '../components/ui/Spinner';
import {
  useAvancesPorCorte,
  useCortesPorInstrumento,
  useIndicador,
  useUpsertAvance,
} from '../hooks/useApi';

export default function IngresarAvance() {
  const { indicador_id, corte_id } = useParams();
  const navigate = useNavigate();
  const { data: indicador, isLoading: loadingIndicador } = useIndicador(indicador_id);
  const { data: cortes = [], isLoading: loadingCortes } = useCortesPorInstrumento(indicador?.instrumento_id);
  const { data: avances = [], isLoading: loadingAvances } = useAvancesPorCorte(corte_id);
  const corte = cortes.find(item => item.id === corte_id);
  const avanceExistente = useMemo(
    () => avances.find(av => av.indicador_id === indicador_id) || null,
    [avances, indicador_id]
  );

  const [form, setForm] = useState({
    valor_reportado: '',
    comentario: '',
    evidencia_url: '',
  });
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!avanceExistente) return;
    setForm({
      valor_reportado: avanceExistente.valor_reportado || '',
      comentario: avanceExistente.comentario || '',
      evidencia_url: avanceExistente.evidencia_url || '',
    });
  }, [avanceExistente]);

  const cumplimiento = useMemo(() => {
    if (!indicador) return 0;
    return calcularPorcentaje(form.valor_reportado, indicador.meta_valor, indicador.tipo_meta);
  }, [form.valor_reportado, indicador]);

  const semaforo = useMemo(() => calcularSemaforo(cumplimiento), [cumplimiento]);
  const comentarioObligatorio = cumplimiento < 80;

  const upsertMut = useUpsertAvance(corte_id, indicador?.instrumento_id);

  const guardar = async () => {
    if (corte?.estado === 'cerrado') {
      setFeedback({ type: 'error', msg: 'El corte está cerrado.' });
      return;
    }
    if (comentarioObligatorio && !form.comentario.trim()) {
      setFeedback({ type: 'error', msg: 'Debes ingresar un comentario si el cumplimiento es menor a 80%.' });
      return;
    }

    try {
      await upsertMut.mutateAsync({
        data: {
          indicador_id,
          corte_id,
          valor_reportado: normalizarValor(form.valor_reportado, indicador?.tipo_meta),
          comentario: form.comentario,
          evidencia_url: form.evidencia_url,
        },
      });
      navigate(`/instrumento/${indicador.instrumento_id}`);
    } catch (error) {
      setFeedback({ type: 'error', msg: error.message });
    }
  };

  if (loadingIndicador || loadingCortes || loadingAvances) {
    return <div className="p-6 flex justify-center"><Spinner size="lg" /></div>;
  }

  if (!indicador || !corte) {
    return <div className="p-6 text-sm text-red font-body">No se encontró el indicador o el corte solicitado.</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Link to={`/instrumento/${indicador.instrumento_id}`} className="text-sm text-blue hover:underline font-body">← Volver al instrumento</Link>
        <h1 className="text-2xl font-display font-bold text-navy mt-3">Ingresar avance</h1>
        <p className="text-sm text-gray-500 font-body mt-1">{indicador.codigo_indicador} · {indicador.nombre}</p>
      </div>

      {feedback && <Alert type={feedback.type} message={feedback.msg} onClose={() => setFeedback(null)} />}

      <div className="bg-white rounded-card shadow-card p-6 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-body">
          <Info label="Corte" value={corte.nombre_corte} />
          <Info label="Estado del corte" value={corte.estado} />
          <Info label="Meta" value={`${indicador.meta_valor || '—'} ${indicador.unidad || ''}`} />
          <Info label="Fecha de cumplimiento" value={indicador.fecha_cumplimiento_2026 || '—'} />
          <Info label="Fórmula" value={indicador.formula || 'Sin fórmula definida'} />
          <Info label="Equipo de trabajo" value={indicador.equipo_trabajo || indicador.subdimension || '—'} />
          <Info label="Ámbito de control" value={indicador.ambito_control || '—'} />
          <Info label="Medios de verificación" value={indicador.medios_verificacion_2026 || indicador.fuente_verificacion || '—'} />
        </section>

        <section className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Valor reportado</label>
            <ValorInput tipoMeta={indicador.tipo_meta} value={form.valor_reportado} onChange={(valor_reportado) => setForm(actual => ({ ...actual, valor_reportado }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">
              Comentario {comentarioObligatorio ? '*' : '(opcional)'}
            </label>
            <textarea
              rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30 resize-none"
              value={form.comentario}
              onChange={e => setForm(actual => ({ ...actual, comentario: e.target.value }))}
              placeholder="Explica el resultado o las observaciones del avance"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">URL de evidencia</label>
            <input
              type="url"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={form.evidencia_url}
              onChange={e => setForm(actual => ({ ...actual, evidencia_url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
        </section>

        <section className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs font-semibold text-gray-600 font-body mb-3">Vista previa</p>
          <div className="flex flex-wrap items-center gap-3 text-sm font-body">
            <span className="text-navy font-semibold">Cumplimiento: {cumplimiento}%</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${semaforo === 'verde' ? 'bg-green-100 text-green-700' : semaforo === 'amarillo' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
              {semaforo}
            </span>
            {comentarioObligatorio && <span className="text-xs text-red">Se requerirá comentario para guardar.</span>}
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Link
            to={`/instrumento/${indicador.instrumento_id}`}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-body"
          >
            Cancelar
          </Link>
          <button
            onClick={guardar}
            disabled={upsertMut.isPending || corte.estado === 'cerrado'}
            className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-navy transition-colors font-body disabled:opacity-50"
          >
            {upsertMut.isPending ? 'Guardando…' : 'Guardar avance'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}

function ValorInput({ tipoMeta, value, onChange }) {
  const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30';

  if (tipoMeta === 'booleano') {
    return (
      <select className={cls} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— Selecciona —</option>
        <option value="Sí">Sí</option>
        <option value="No">No</option>
      </select>
    );
  }

  if (tipoMeta === 'texto') {
    return (
      <textarea
        rows={3}
        className={`${cls} resize-none`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    );
  }

  return (
    <input
      type="number"
      step="any"
      className={cls}
      value={value}
      onChange={e => onChange(e.target.value)}
    />
  );
}

function calcularPorcentaje(valorReportado, metaValor, tipo) {
  if (tipo === 'booleano') return valorReportado === 'Sí' ? 100 : 0;
  if (tipo === 'texto') return String(valorReportado || '').trim() ? 100 : 0;
  const valor = parseFloat(valorReportado);
  const meta = parseFloat(metaValor);
  if (Number.isNaN(valor) || Number.isNaN(meta) || meta === 0) return 0;
  return Math.min(Math.round((valor / meta) * 100), 100);
}

function calcularSemaforo(porcentaje) {
  if (porcentaje >= 80) return 'verde';
  if (porcentaje >= 50) return 'amarillo';
  return 'rojo';
}

function normalizarValor(valor, tipoMeta) {
  if (tipoMeta === 'booleano') return valor || 'No';
  return valor;
}