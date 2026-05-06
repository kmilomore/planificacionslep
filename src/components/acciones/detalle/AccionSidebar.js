import { Check, PencilLine, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import Alert from '../../ui/Alert';

export default function AccionSidebar({
  canQuickEdit,
  canComment,
  formatDateTime,
  currentUserId,
  currentUserRole,
  estadoForm,
  setEstadoForm,
  onSubmit,
  onReset,
  isPending,
  isDirty,
  comentarioForm,
  setComentarioForm,
  onCommentSubmit,
  isCommentPending,
  onCommentUpdate,
  onCommentDelete,
  timelineCount,
  mediosCount,
  accion,
  comentarios,
}) {
  const [editingCommentId, setEditingCommentId] = useState('');
  const [editingText, setEditingText] = useState('');

  const startEditing = (entry) => {
    setEditingCommentId(entry.id);
    setEditingText(entry.texto || '');
  };

  const cancelEditing = () => {
    setEditingCommentId('');
    setEditingText('');
  };

  const handleUpdate = async (entry) => {
    const ok = await onCommentUpdate?.(entry, editingText);
    if (ok !== false) cancelEditing();
  };

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-display font-bold text-navy">Gestión rápida</h2>
          {isDirty ? <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Cambios sin guardar</span> : null}
        </div>

        <p className="text-sm text-slate-500 font-body">
          Ajusta estado y avance sin salir del detalle. El backend sigue validando coherencia entre estado, avance y fechas.
        </p>

        {canQuickEdit ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <label className="block space-y-2 text-sm text-slate-600 font-body">
              Estado
              <select
                value={estadoForm.estado}
                onChange={(event) => setEstadoForm((current) => ({ ...current, estado: event.target.value }))}
                disabled={isPending}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
              >
                <option value="planificada">Planificada</option>
                <option value="en_progreso">En progreso</option>
                <option value="reportada">Reportada</option>
                <option value="completada">Completada</option>
              </select>
            </label>

            <label className="block space-y-2 text-sm text-slate-600 font-body">
              Avance (%)
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={estadoForm.avance}
                onChange={(event) => setEstadoForm((current) => ({ ...current, avance: event.target.value }))}
                disabled={isPending}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
              />
            </label>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isPending || !isDirty}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-blue transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save size={16} />
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>

              <button
                type="button"
                onClick={onReset}
                disabled={isPending || !isDirty}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-300"
              >
                <RotateCcw size={16} />
                Restablecer
              </button>
            </div>
          </form>
        ) : (
          <Alert type="info" message="Tu perfil no tiene edición rápida habilitada para esta acción." />
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-display font-bold text-navy">Comentarios operativos</h2>
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{comentarios.length}</span>
        </div>

        {canComment ? (
          <form onSubmit={onCommentSubmit} className="space-y-3">
            <textarea
              rows="4"
              value={comentarioForm}
              onChange={(event) => setComentarioForm(event.target.value)}
              disabled={isCommentPending}
              placeholder="Escribe un comentario operativo que quede persistido en la acción."
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
            />
            <button
              type="submit"
              disabled={isCommentPending || !String(comentarioForm || '').trim()}
              className="inline-flex items-center justify-center rounded-xl bg-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isCommentPending ? 'Guardando comentario...' : 'Agregar comentario'}
            </button>
          </form>
        ) : null}

        {comentarios.length ? comentarios.map((entry, index) => {
          const canManageEntry = canManageComment(entry, canComment, currentUserId, currentUserRole);
          const isEditing = editingCommentId === entry.id;

          return (
            <div key={entry.id || `${entry.fecha}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 space-y-3">
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    rows="3"
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    disabled={isCommentPending}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(entry)}
                      disabled={isCommentPending || !String(editingText || '').trim()}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue px-3 py-2 text-sm font-semibold text-white hover:bg-navy transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <Check size={14} />
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      disabled={isCommentPending}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <X size={14} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-slate-600 font-body leading-6">{entry.texto}</p>
                    {canManageEntry ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditing(entry)}
                          disabled={isCommentPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          <PencilLine size={13} />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => onCommentDelete?.(entry)}
                          disabled={isCommentPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:text-red-300"
                        >
                          <Trash2 size={13} />
                          Eliminar
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-400 font-body">
                    {entry.usuario || 'Usuario no informado'} · {formatDateTime ? formatDateTime(entry.fecha) : (entry.fecha || 'Sin fecha')}
                  </p>
                </>
              )}
            </div>
          );
        }) : (
          <p className="text-sm text-slate-500 font-body">
            Aún no hay comentarios operativos persistidos para esta acción.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
        <h2 className="text-lg font-display font-bold text-navy">Resumen documental</h2>
        <SummaryRow label="Carpeta raíz" value="Planificacion" />
        <SummaryRow label="Ruta lógica" value={`${accion.indicador_nombre || 'Indicador'} / ${accion.nombre} / Medios de Verificacion`} />
        <SummaryRow label="Eventos timeline" value={String(timelineCount)} />
        <SummaryRow label="Archivos cargados" value={String(mediosCount)} />
      </section>
    </aside>
  );
}

function canManageComment(entry, canComment, currentUserId, currentUserRole) {
  if (!canComment) return false;
  if (currentUserRole === 'admin' || currentUserRole === 'director_ejecutivo') return true;
  return entry?.created_by === currentUserId;
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500 font-body">{label}</span>
      <span className="text-sm font-semibold text-navy font-body text-right break-words">{value || '—'}</span>
    </div>
  );
}