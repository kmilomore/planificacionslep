import { useState, useMemo } from 'react';
import {
  useCreateIndicador,
  useInstrumentos, useIndicadores,
  useUpdateIndicador, useDeleteIndicador,
  useUsuarios,
} from '../../hooks/useApi';
import Modal   from '../ui/Modal';
import Alert   from '../ui/Alert';
import Spinner from '../ui/Spinner';

const TIPO_META_OPS = ['porcentaje', 'numero', 'booleano', 'texto'];

const CAMPOS_FORM = [
  { key: 'nombre',             label: 'Nombre',                tipo: 'text' },
  { key: 'dimension',          label: 'Dimensión',             tipo: 'text' },
  { key: 'subdimension',       label: 'Subdimensión (CR)',     tipo: 'text' },
  { key: 'tipo_meta',          label: 'Tipo de meta',          tipo: 'select_tipo' },
  { key: 'meta_valor',         label: 'Meta (valor objetivo)', tipo: 'text' },
  { key: 'unidad',             label: 'Unidad',                tipo: 'text' },
  { key: 'peso',               label: 'Ponderación (%)',       tipo: 'text' },
  { key: 'responsable_id',     label: 'Responsable',           tipo: 'select_user' },
  { key: 'formula',            label: 'Fórmula de cálculo',    tipo: 'textarea' },
  { key: 'fuente_verificacion',label: 'Medios de verificación',tipo: 'textarea' },
  { key: 'descripcion',        label: 'Descripción / objetivo',tipo: 'textarea' },
];

export default function TabIndicadores() {
  const { data: instrumentos = [], isLoading: loadingInst } = useInstrumentos();
  const { data: usuarios    = [] }                          = useUsuarios();

  const [instId, setInstId]     = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando]   = useState(false);
  const [editando, setEditando] = useState(null);
  const [nuevo, setNuevo]       = useState({
    codigo_indicador: '', nombre: '', dimension: '', subdimension: '', tipo_meta: 'porcentaje',
    meta_valor: '', unidad: '%', peso: '', responsable_id: '', formula: '',
    fuente_verificacion: '', descripcion: '',
  });
  const [form, setForm]         = useState({});
  const [feedback, setFeedback] = useState(null);

  const { data: indicadores = [], isLoading: loadingInd } = useIndicadores(instId);

  const createMut = useCreateIndicador(instId);
  const updateMut = useUpdateIndicador(instId);
  const deleteMut = useDeleteIndicador(instId);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return indicadores.filter(i =>
      !q ||
      i.codigo_indicador?.toLowerCase().includes(q) ||
      i.nombre?.toLowerCase().includes(q) ||
      i.dimension?.toLowerCase().includes(q)
    );
  }, [indicadores, busqueda]);

  const abrirEdicion = (ind) => {
    setEditando(ind);
    setForm({ ...ind });
    setFeedback(null);
  };

  const abrirCreacion = () => {
    setNuevo({
      codigo_indicador: '', nombre: '', dimension: '', subdimension: '', tipo_meta: 'porcentaje',
      meta_valor: '', unidad: '%', peso: '', responsable_id: '', formula: '',
      fuente_verificacion: '', descripcion: '',
    });
    setFeedback(null);
    setCreando(true);
  };

  const crear = async () => {
    try {
      await createMut.mutateAsync({
        data: { ...nuevo, instrumento_id: instId },
      });
      setFeedback({ type: 'success', msg: 'Indicador creado.' });
      setCreando(false);
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  const guardar = async () => {
    try {
      await updateMut.mutateAsync({ id: editando.id, data: form });
      setFeedback({ type: 'success', msg: 'Indicador actualizado.' });
      setEditando(null);
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  const desactivar = async (ind) => {
    if (!window.confirm(`¿Desactivar "${ind.codigo_indicador}"?`)) return;
    try {
      await deleteMut.mutateAsync({ id: ind.id });
      setFeedback({ type: 'success', msg: `${ind.codigo_indicador} desactivado.` });
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  const usuarioNombre = (id) => usuarios.find(u => u.id === id)?.nombre ?? '—';

  if (loadingInst) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      {feedback && (
        <Alert type={feedback.type} message={feedback.msg} onClose={() => setFeedback(null)} />
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-navy font-body">
        Para este ambiente demo, los indicadores pueden cargarse desde una hoja mock compatible con <code>migracionCDC()</code>. Los campos visibles debajo reflejan la estructura esperada por la aplicación.
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
          value={instId}
          onChange={e => { setInstId(e.target.value); setBusqueda(''); }}
        >
          <option value="">— Selecciona instrumento —</option>
          {instrumentos.map(i => (
            <option key={i.id} value={i.id}>{i.codigo} — {i.nombre}</option>
          ))}
        </select>

        {instId && (
          <>
            <input
              type="text"
              placeholder="Buscar por código o nombre…"
              className="flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <button
              onClick={abrirCreacion}
              className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-navy transition-colors font-body"
            >
              + Nuevo indicador
            </button>
          </>
        )}
      </div>

      {!instId && (
        <p className="text-sm text-gray-400 font-body py-8 text-center">
          Selecciona un instrumento para ver sus indicadores.
        </p>
      )}

      {instId && loadingInd && <Spinner size="lg" />}

      {instId && !loadingInd && (
        <>
          <p className="text-xs text-gray-500 font-body">
            {filtrados.length} de {indicadores.length} indicadores
            {busqueda ? ` · filtrado por "${busqueda}"` : ''}
          </p>

          <div className="bg-white rounded-card shadow-card overflow-x-auto">
            <table className="w-full text-sm font-body min-w-[800px]">
              <thead>
                <tr className="text-left text-xs font-semibold text-white" style={{ background: '#25306B' }}>
                  <th className="px-3 py-3 w-20">Código</th>
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3 w-40">Equipo</th>
                  <th className="px-3 py-3 w-28">Estado</th>
                  <th className="px-3 py-3 w-32">Dimensión</th>
                  <th className="px-3 py-3 w-20 text-center">Meta</th>
                  <th className="px-3 py-3 w-28">Cumplimiento</th>
                  <th className="px-3 py-3 w-16 text-center">Peso %</th>
                  <th className="px-3 py-3 w-32">Responsable</th>
                  <th className="px-3 py-3 w-16 text-center">Estado</th>
                  <th className="px-3 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((ind, i) => (
                  <tr key={ind.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2.5 font-mono text-xs text-navy font-semibold">{ind.codigo_indicador}</td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-xs">
                      <span className="line-clamp-2 leading-snug">{ind.nombre}</span>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{ind.equipo_trabajo || ind.subdimension || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{ind.estado_indicador || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{ind.dimension || '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      {ind.meta_valor
                        ? <span className="font-semibold text-navy">{ind.meta_valor}{ind.unidad === 'Porcentaje' ? '%' : ''}</span>
                        : <span className="text-red text-xs">Sin meta</span>
                      }
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{ind.fecha_cumplimiento_2026 || '—'}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600">
                      {ind.peso ? `${ind.peso}%` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">{usuarioNombre(ind.responsable_id)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ind.activo === true || ind.activo === 'TRUE' || ind.activo === 'true'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {ind.activo === true || ind.activo === 'TRUE' || ind.activo === 'true' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => abrirEdicion(ind)}
                        className="text-xs text-blue hover:underline mr-2"
                      >
                        Editar
                      </button>
                      {(ind.activo === true || ind.activo === 'TRUE' || ind.activo === 'true') && (
                        <button
                          onClick={() => desactivar(ind)}
                          className="text-xs text-red hover:underline"
                        >
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-gray-400">
                      Sin indicadores. Ejecuta <code>migracionCDC()</code> para recargar una base mock o crea registros manualmente para la demo.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal
        open={creando}
        onClose={() => setCreando(false)}
        title="Nuevo indicador"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Código</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={nuevo.codigo_indicador}
              onChange={e => setNuevo(f => ({ ...f, codigo_indicador: e.target.value.toUpperCase() }))}
            />
          </div>
          {CAMPOS_FORM.map(({ key, label, tipo }) => (
            <FormField
              key={key}
              label={label}
              tipo={tipo}
              value={nuevo[key] ?? ''}
              onChange={v => setNuevo(f => ({ ...f, [key]: v }))}
              usuarios={usuarios}
            />
          ))}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setCreando(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-body"
            >
              Cancelar
            </button>
            <button
              onClick={crear}
              disabled={createMut.isPending}
              className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-navy transition-colors font-body disabled:opacity-50"
            >
              {createMut.isPending ? 'Creando…' : 'Crear indicador'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal edición */}
      <Modal
        open={!!editando}
        onClose={() => setEditando(null)}
        title={`${editando?.codigo_indicador} — Editar indicador`}
        size="lg"
      >
        <div className="space-y-4">
          {CAMPOS_FORM.map(({ key, label, tipo }) => (
            <FormField
              key={key}
              label={label}
              tipo={tipo}
              value={form[key] ?? ''}
              onChange={v => setForm(f => ({ ...f, [key]: v }))}
              usuarios={usuarios}
            />
          ))}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setEditando(null)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-body"
            >
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={updateMut.isPending}
              className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-navy transition-colors font-body disabled:opacity-50"
            >
              {updateMut.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FormField({ label, tipo, value, onChange, usuarios }) {
  const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30';

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">{label}</label>
      {tipo === 'textarea' && (
        <textarea rows={3} className={`${cls} resize-none`} value={value} onChange={e => onChange(e.target.value)} />
      )}
      {tipo === 'select_tipo' && (
        <select className={cls} value={value} onChange={e => onChange(e.target.value)}>
          {TIPO_META_OPS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {tipo === 'select_user' && (
        <select className={cls} value={value} onChange={e => onChange(e.target.value)}>
          <option value="">— Sin asignar —</option>
          {usuarios.filter(u => u.activo === true || u.activo === 'TRUE' || u.activo === 'true').map(u => (
            <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
          ))}
        </select>
      )}
      {tipo === 'text' && (
        <input type="text" className={cls} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}
