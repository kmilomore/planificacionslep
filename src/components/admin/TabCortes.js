import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useInstrumentos, useCortesPorInstrumento,
  useCreateCorte, useCerrarCorte,
} from '../../hooks/useApi';
import Modal   from '../ui/Modal';
import Alert   from '../ui/Alert';
import Spinner from '../ui/Spinner';

const ESTADO_BADGE = {
  pendiente: { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Pendiente' },
  en_curso:  { bg: 'bg-blue/10',    text: 'text-blue',       label: 'En curso'  },
  cerrado:   { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Cerrado'   },
  vencido:   { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Vencido'   },
};

const FORM_INIT = {
  nombre_corte: '', codigo_corte: '', fecha_inicio: '', fecha_limite: '', dias_recordatorio: 7,
};

export default function TabCortes() {
  const { data: instrumentos = [], isLoading: loadingInst } = useInstrumentos();
  const [instId, setInstId]   = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(FORM_INIT);
  const [feedback, setFeedback] = useState(null);

  const { data: cortes = [], isLoading: loadingCortes } = useCortesPorInstrumento(instId);
  const createMut = useCreateCorte();
  const cerrarMut = useCerrarCorte(instId);

  const instrActual = instrumentos.find(i => i.id === instId);

  const autocodigo = () => {
    if (!instrActual || !form.nombre_corte) return '';
    const prefijo = instrActual.codigo;
    const clean   = form.nombre_corte.replace(/\s+/g, '-').toUpperCase().replace(/[^A-Z0-9-]/g, '');
    return `${prefijo}-${clean}`;
  };

  const abrirModal = () => {
    setForm({ ...FORM_INIT, instrumento_id: instId });
    setFeedback(null);
    setModal(true);
  };

  const crear = async () => {
    if (!form.nombre_corte || !form.fecha_inicio || !form.fecha_limite) {
      setFeedback({ type: 'error', msg: 'Completa nombre, fecha inicio y fecha límite.' });
      return;
    }
    const codigo = form.codigo_corte || autocodigo();
    try {
      await createMut.mutateAsync({
        data: { ...form, instrumento_id: instId, codigo_corte: codigo },
      });
      setFeedback({ type: 'success', msg: `Corte "${codigo}" creado.` });
      setModal(false);
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  const cerrar = async (corte) => {
    if (!window.confirm(`¿Cerrar el corte "${corte.nombre_corte}"? Esta acción bloqueará el ingreso de avances.`)) return;
    try {
      await cerrarMut.mutateAsync({ id: corte.id });
      setFeedback({ type: 'success', msg: `Corte "${corte.nombre_corte}" cerrado.` });
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  const formatFecha = (f) => {
    try { return format(new Date(f), 'd MMM yyyy', { locale: es }); } catch { return f; }
  };

  const estadoEfectivo = (corte) => {
    if (corte.estado === 'cerrado') return 'cerrado';
    const hoy = new Date();
    const lim = new Date(corte.fecha_limite);
    if (lim < hoy) return 'vencido';
    const ini = new Date(corte.fecha_inicio);
    return ini <= hoy ? 'en_curso' : 'pendiente';
  };

  if (loadingInst) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      {feedback && (
        <Alert type={feedback.type} message={feedback.msg} onClose={() => setFeedback(null)} />
      )}

      {/* Selector de instrumento */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
          value={instId}
          onChange={e => setInstId(e.target.value)}
        >
          <option value="">— Selecciona instrumento —</option>
          {instrumentos.map(i => (
            <option key={i.id} value={i.id}>{i.codigo} — {i.nombre}</option>
          ))}
        </select>

        {instId && (
          <button
            onClick={abrirModal}
            className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-navy transition-colors font-body"
          >
            + Nuevo corte
          </button>
        )}
      </div>

      {!instId && (
        <p className="text-sm text-gray-400 font-body py-8 text-center">
          Selecciona un instrumento para ver sus cortes.
        </p>
      )}

      {instId && loadingCortes && <Spinner size="lg" />}

      {instId && !loadingCortes && (
        <div className="bg-white rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-left text-xs font-semibold text-white" style={{ background: '#25306B' }}>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Límite</th>
                <th className="px-4 py-3">Recordatorio</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {cortes.map((c, i) => {
                const est = estadoEfectivo(c);
                const b   = ESTADO_BADGE[est] ?? ESTADO_BADGE.pendiente;
                return (
                  <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{c.codigo_corte}</td>
                    <td className="px-4 py-3 text-gray-700">{c.nombre_corte}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatFecha(c.fecha_inicio)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatFecha(c.fecha_limite)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs text-center">{c.dias_recordatorio}d</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.bg} ${b.text}`}>
                        {b.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {est !== 'cerrado' && (
                        <button
                          onClick={() => cerrar(c)}
                          disabled={cerrarMut.isPending}
                          className="text-xs text-red hover:underline font-body"
                        >
                          Cerrar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {cortes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                    Sin cortes configurados. Usa "+ Nuevo corte" o ejecuta <code>setupInicial()</code>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal nuevo corte */}
      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo corte">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Nombre del corte *</label>
            <input
              type="text"
              placeholder="Ej: Semestre 1 2027"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={form.nombre_corte}
              onChange={e => setForm(f => ({ ...f, nombre_corte: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">
              Código (opcional — se genera automáticamente)
            </label>
            <input
              type="text"
              placeholder={autocodigo() || `${instrActual?.codigo}-...`}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={form.codigo_corte}
              onChange={e => setForm(f => ({ ...f, codigo_corte: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Fecha inicio *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
                value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Fecha límite *</label>
              <input type="date" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
                value={form.fecha_limite}
                onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Días de recordatorio antes del cierre</label>
            <input type="number" min={1} max={30}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={form.dias_recordatorio}
              onChange={e => setForm(f => ({ ...f, dias_recordatorio: Number(e.target.value) }))}
            />
          </div>
          {feedback && <Alert type={feedback.type} message={feedback.msg} />}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-500 font-body">Cancelar</button>
            <button
              onClick={crear}
              disabled={createMut.isPending}
              className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-navy transition-colors font-body disabled:opacity-50"
            >
              {createMut.isPending ? 'Creando…' : 'Crear corte'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
