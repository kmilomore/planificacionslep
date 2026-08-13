import { useState } from 'react';
import {
  useCreateInstrumento,
  useInstrumentos,
  useUpdateInstrumento,
  useUsuarios,
} from '../../hooks/useApi';
import Modal from '../ui/Modal';
import Alert from '../ui/Alert';
import Spinner from '../ui/Spinner';

const TIPO_LABELS = {
  semestral:      'Semestral',
  trimestral:     'Trimestral',
  anual_con_hitos:'Anual c/ hitos',
};

const FORM_NUEVO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo_seguimiento: 'semestral',
  color_hex: '#25306B',
  responsable_id: '',
};

export default function TabInstrumentos() {
  const { data: instrumentos = [], isLoading } = useInstrumentos();
  const { data: usuarios = [] } = useUsuarios();
  const createMut = useCreateInstrumento();
  const updateMut = useUpdateInstrumento();

  const [creando, setCreando]   = useState(false);
  const [editando, setEditando] = useState(null);
  const [nuevo, setNuevo]       = useState(FORM_NUEVO);
  const [form, setForm]         = useState({});
  const [feedback, setFeedback] = useState(null);

  const abrirCreacion = () => {
    setNuevo(FORM_NUEVO);
    setFeedback(null);
    setCreando(true);
  };

  const abrirEdicion = (inst) => {
    setEditando(inst);
    setForm({ nombre: inst.nombre, descripcion: inst.descripcion || '', responsable_id: inst.responsable_id || '' });
    setFeedback(null);
  };

  const crear = async () => {
    try {
      await createMut.mutateAsync({ data: nuevo });
      setFeedback({ type: 'success', msg: '¡Instrumento creado!' });
      setCreando(false);
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  const guardar = async () => {
    try {
      await updateMut.mutateAsync({ id: editando.id, data: form });
      setFeedback({ type: 'success', msg: '¡Instrumento actualizado!' });
      setEditando(null);
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  const responsableNombre = (id) => {
    const u = usuarios.find(u => u.id === id);
    return u ? u.nombre : '—';
  };

  if (isLoading) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      {feedback && (
        <Alert type={feedback.type} message={feedback.msg} onClose={() => setFeedback(null)} />
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-navy font-body">
        La hoja de instrumentos puede reconstruirse desde una base mock compatible con <code>migracionCDC()</code>. Si vuelves a ejecutar la migración, cualquier dato manual previo podrá ser reemplazado.
      </div>

      <div className="flex justify-end">
        <button
          onClick={abrirCreacion}
          className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-navy transition-colors font-body"
        >
          + Nuevo instrumento
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {instrumentos.map(inst => (
          <div key={inst.id} className="bg-white rounded-card shadow-card overflow-hidden">
            <div className="h-2" style={{ background: inst.color_hex }} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className="text-xs font-bold text-white px-2 py-0.5 rounded font-body"
                    style={{ background: inst.color_hex }}
                  >
                    {inst.codigo}
                  </span>
                  <h3 className="text-sm font-semibold text-navy mt-2 font-display">{inst.nombre}</h3>
                </div>
                <button
                  onClick={() => abrirEdicion(inst)}
                  className="text-xs text-blue hover:underline font-body flex-shrink-0"
                >
                  Editar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 font-body">{inst.descripcion || 'Sin descripción'}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 font-body">
                <span>📅 {TIPO_LABELS[inst.tipo_seguimiento] ?? inst.tipo_seguimiento}</span>
                <span>👤 {responsableNombre(inst.responsable_id)}</span>
                <span>{inst.ciclo || 'anual'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={creando} onClose={() => setCreando(false)} title="Nuevo instrumento">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Código</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
                value={nuevo.codigo}
                onChange={e => setNuevo(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Tipo de seguimiento</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
                value={nuevo.tipo_seguimiento}
                onChange={e => setNuevo(f => ({ ...f, tipo_seguimiento: e.target.value }))}
              >
                <option value="semestral">Semestral</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual_con_hitos">Anual c/ hitos</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Nombre</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={nuevo.nombre}
              onChange={e => setNuevo(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Descripción</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30 resize-none"
              value={nuevo.descripcion}
              onChange={e => setNuevo(f => ({ ...f, descripcion: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Color</label>
              <input
                type="color"
                className="w-full h-10 border border-gray-200 rounded-lg px-1 py-1"
                value={nuevo.color_hex}
                onChange={e => setNuevo(f => ({ ...f, color_hex: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Responsable</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
                value={nuevo.responsable_id}
                onChange={e => setNuevo(f => ({ ...f, responsable_id: e.target.value }))}
              >
                <option value="">— Sin asignar —</option>
                {usuarios.filter(u => u.activo === true || u.activo === 'TRUE' || u.activo === 'true').map(u => (
                  <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
              {createMut.isPending ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal edición */}
      <Modal open={!!editando} onClose={() => setEditando(null)} title={`Editar: ${editando?.codigo}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Nombre</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={form.nombre || ''}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Descripción</label>
            <textarea
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30 resize-none"
              value={form.descripcion || ''}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Responsable (subdirector)</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
              value={form.responsable_id || ''}
              onChange={e => setForm(f => ({ ...f, responsable_id: e.target.value }))}
            >
              <option value="">— Sin asignar —</option>
              {usuarios.filter(u => u.activo === true || u.activo === 'TRUE' || u.activo === 'true').map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
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
              {updateMut.isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
