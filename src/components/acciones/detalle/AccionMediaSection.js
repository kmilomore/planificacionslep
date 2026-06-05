import { ExternalLink, FileText, FolderOpen, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { useEffect, useState } from 'react';
import Alert from '../../ui/Alert';
import Spinner from '../../ui/Spinner';

const ALL_TIPO_OPTIONS = [
  { value: 'lista_asistencia', label: 'Lista de asistencia' },
  { value: 'acta', label: 'Acta' },
  { value: 'fotografia', label: 'Fotografia' },
  { value: 'informe', label: 'Informe' },
  { value: 'otro', label: 'Otro' },
];

export default function AccionMediaSection({
  canUpload,
  canEditTipos,
  medios,
  mediosRequeridos,
  mediosForm,
  setMediosForm,
  onSaveTipos,
  onResetTipos,
  isSavingTipos,
  isTiposDirty,
  uploadForm,
  setUploadForm,
  onSubmit,
  isUploading,
  imagePreviewUrl,
  formatDateTime,
  humanizeTipo,
  isImageFile,
  formatFileSize,
  getFileExtension,
  uploadStage,
  tipoOptions,
  mediosRequeridosDetalle = [],
  canDeleteMedios,
  onDeleteMedio,
  deletingMedioId,
  canEditMedios,
  onUpdateMedio,
  updatingMedioId,
}) {
  const hasRequiredMedios = Array.isArray(mediosRequeridos) && mediosRequeridos.length > 0;
  const [isEditingTipos, setIsEditingTipos] = useState(false);
  const [editingMedioId, setEditingMedioId] = useState('');
  const normalizeTipo = (value) => String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const normalizeTipoToKey = (value) => {
    const normalized = normalizeTipo(value).replace(/\s+/g, '_');
    const aliases = {
      lista_asistencia: 'lista_asistencia',
      listas_asistencia: 'lista_asistencia',
      lista_de_asistencia: 'lista_asistencia',
      listas_de_asistencia: 'lista_asistencia',
      acta: 'acta',
      actas: 'acta',
      fotografia: 'fotografia',
      fotografias: 'fotografia',
      foto: 'fotografia',
      fotos: 'fotografia',
      informe: 'informe',
      informes: 'informe',
      otro: 'otro',
      otros: 'otro',
    };
    return aliases[normalized] || normalized;
  };

  useEffect(() => {
    if (!isTiposDirty) return;
    setIsEditingTipos(true);
  }, [isTiposDirty]);

  useEffect(() => {
    if (!isSavingTipos && !isTiposDirty) {
      setIsEditingTipos(false);
    }
  }, [isSavingTipos, isTiposDirty]);

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-display font-bold text-navy">Medios de verificación</h2>
          <p className="mt-1 text-sm text-slate-500 font-body">
            Archivos guardados en Drive bajo la carpeta de la acción. Solo se permiten medios declarados en el constructor de la acción.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          <FolderOpen size={14} />
          {medios.length} archivos
        </span>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">Medios requeridos para esta acción</p>
          {canEditTipos && !isEditingTipos ? (
            <button
              type="button"
              onClick={() => setIsEditingTipos(true)}
              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors"
            >
              Editar tipos
            </button>
          ) : null}
        </div>

        {isEditingTipos && canEditTipos ? (
          <div className="mt-3 space-y-3">
            <select
              multiple
              value={mediosForm}
              onChange={(event) => {
                const selected = Array.from(event.target.selectedOptions || []).map((option) => option.value);
                setMediosForm(selected);
              }}
              disabled={isSavingTipos}
              className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
            >
              {ALL_TIPO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onSaveTipos}
                disabled={isSavingTipos || !isTiposDirty}
                className="inline-flex items-center rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-blue transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isSavingTipos ? 'Guardando...' : 'Guardar tipos'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetTipos();
                  setIsEditingTipos(false);
                }}
                disabled={isSavingTipos}
                className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors disabled:cursor-not-allowed disabled:text-slate-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : hasRequiredMedios ? (
          <div className="mt-3 space-y-2">
            {tipoOptions.map((option) => {
              const config = mediosRequeridosDetalle.find((entry) => entry.tipo === option.value);
              const requiredCount = Number(config?.cantidad || 1) || 1;
              const currentCount = medios.filter((medio) => normalizeTipoToKey(medio.tipo) === option.value).length;
              const pct = Math.min(Math.round((currentCount / requiredCount) * 100), 100);

              return (
                <div key={option.value} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-navy">{option.label}</p>
                    <p className="text-xs font-semibold text-slate-500">
                      {currentCount}/{requiredCount}
                    </p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500 font-body">No hay medios declarados en el constructor. Debes definirlos para habilitar carga específica.</p>
        )}
      </div>

      {canUpload && hasRequiredMedios ? (
        <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
            <label className="block space-y-2 text-sm text-slate-600 font-body">
              Tipo de medio
              <select
                value={uploadForm.tipo}
                onChange={(event) => setUploadForm((current) => ({ ...current, tipo: event.target.value }))}
                disabled={isUploading}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
              >
                {tipoOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm text-slate-600 font-body">
              Archivo
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setUploadForm((current) => ({
                    ...current,
                    file,
                    displayName: file ? file.name : '',
                  }));
                }}
                disabled={isUploading}
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-[11px] text-sm text-slate-700 file:mr-4 file:border-0 file:bg-transparent file:p-0 file:font-medium"
              />
            </label>

            <button
              type="submit"
              disabled={isUploading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-5 py-3 text-sm font-semibold text-white hover:bg-navy transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isUploading ? <Spinner size="sm" /> : <UploadCloud size={16} />}
              {isUploading ? resolveUploadButtonLabel(uploadStage) : 'Subir medio'}
            </button>

            <label className="block space-y-2 text-sm text-slate-600 font-body lg:col-span-2">
              Nombre visible del medio
              <input
                type="text"
                value={uploadForm.displayName}
                onChange={(event) => setUploadForm((current) => ({ ...current, displayName: event.target.value }))}
                disabled={isUploading || !uploadForm.file}
                placeholder="Ej. Evidencia visita territorial abril 2026.pdf"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>

            <label className="block space-y-2 text-sm text-slate-600 font-body lg:col-span-3">
              Descripción del medio
              <textarea
                rows="3"
                value={uploadForm.description}
                onChange={(event) => setUploadForm((current) => ({ ...current, description: event.target.value }))}
                disabled={isUploading || !uploadForm.file}
                placeholder="Describe qué evidencia contiene el archivo y por qué respalda esta acción."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>
          </div>

          {imagePreviewUrl ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3 space-y-3">
              <p className="text-sm font-semibold text-navy">Previsualización</p>
              <img
                src={imagePreviewUrl}
                alt="Previsualización del medio seleccionado"
                className="max-h-72 w-full rounded-xl object-contain bg-slate-50"
              />
            </div>
          ) : null}

          <p className="text-xs text-slate-500 font-body">
            Formatos permitidos: PDF, DOCX, XLSX, PNG, JPG, JPEG y WEBP. Tamaño máximo: 10 MB.
          </p>
        </form>
      ) : (
        <div className="mt-5">
          <Alert
            type="info"
            message={
              canUpload
                ? 'Debes declarar medios de verificación en el constructor de la acción para habilitar la carga.'
                : 'Tu perfil puede revisar el detalle, pero la carga de medios queda restringida por backend a perfiles de gestión sobre la acción.'
            }
          />
        </div>
      )}

      <div className="mt-5 space-y-3">
        {medios.length ? medios.map((medio) => {
          const extension = getFileExtension(medio.nombre_archivo).toUpperCase();
          const medioKind = isImageFile(medio.nombre_archivo) ? 'Imagen' : 'Documento';

          return (
            <article key={medio.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-white p-2 text-blue border border-slate-100">
                    {isImageFile(medio.nombre_archivo) ? <ImageIcon size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-navy break-words">{medio.nombre_archivo}</p>
                    <p className="mt-1 text-sm text-slate-500 font-body">
                      {humanizeTipo(medio.tipo)} · Subido por {medio.usuario || 'Usuario no informado'} · {formatDateTime(medio.fecha_subida)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {medio.url_drive ? (
                    <a
                      href={medio.url_drive}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors"
                    >
                      <ExternalLink size={16} />
                      Abrir Drive
                    </a>
                  ) : null}
                  {canEditMedios ? (
                    <button
                      type="button"
                      onClick={() => setEditingMedioId(editingMedioId === medio.id ? '' : medio.id)}
                      disabled={Boolean(updatingMedioId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {editingMedioId === medio.id ? 'Cancelar edición' : 'Editar'}
                    </button>
                  ) : null}
                  {canDeleteMedios ? (
                    <button
                      type="button"
                      onClick={() => onDeleteMedio(medio)}
                      disabled={deletingMedioId === medio.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingMedioId === medio.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <MetaCard label="Clase" value={medioKind} />
                <MetaCard label="Formato" value={extension || 'N/D'} />
                <MetaCard label="Tipo documental" value={humanizeTipo(medio.tipo)} />
                <MetaCard label="Tamaño" value={medio.size_bytes ? formatFileSize(medio.size_bytes) : 'No informado'} />
              </div>

              {editingMedioId === medio.id && canEditMedios ? (
                <MedioEditForm
                  medio={medio}
                  tipoOptions={tipoOptions}
                  onUpdate={onUpdateMedio}
                  isUpdating={updatingMedioId === medio.id}
                />
              ) : null}

              {medio.nombre_original && medio.nombre_original !== medio.nombre_archivo ? (
                <p className="text-xs text-slate-400 font-body">
                  Archivo original: {medio.nombre_original}
                </p>
              ) : null}

              {medio.file_id ? (
                <p className="text-xs text-slate-400 font-body break-all">
                  ID de archivo: {medio.file_id}
                </p>
              ) : null}

              {medio.descripcion ? (
                <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">Descripción</p>
                  <p className="mt-2 text-sm text-slate-600 font-body leading-6">{medio.descripcion}</p>
                </div>
              ) : null}
            </article>
          );
        }) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-slate-50">
            <p className="text-sm font-semibold text-navy">Aún no hay medios cargados</p>
            <p className="mt-2 text-sm text-slate-500 font-body">
              Usa esta vista para dejar evidencia documental centralizada por acción.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function resolveUploadButtonLabel(stage) {
  if (stage === 'reading') return 'Leyendo archivo...';
  if (stage === 'uploading') return 'Enviando a Drive...';
  if (stage === 'syncing') return 'Actualizando acción...';
  return 'Subiendo...';
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">{label}</p>
      <p className="mt-2 text-sm font-semibold text-navy font-body break-words">{value || '—'}</p>
    </div>
  );
}

function MedioEditForm({ medio, tipoOptions, onUpdate, isUpdating }) {
  const [form, setForm] = useState({
    tipo: medio.tipo || '',
    cantidad_esperada: medio.cantidad_esperada || 1,
    cantidad_lograda: medio.cantidad_lograda ?? medio.cantidad_esperada ?? 1,
    url_externa: medio.url_externa || '',
    descripcion: medio.descripcion || '',
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setLocalError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');

    const expected = Number(form.cantidad_esperada);
    const achieved = Number(form.cantidad_lograda);

    if (!Number.isFinite(expected) || expected <= 0) {
      setLocalError('La cantidad esperada debe ser un número mayor a 0.');
      return;
    }

    if (!Number.isFinite(achieved) || achieved < 0) {
      setLocalError('La cantidad lograda debe ser un número mayor o igual a 0.');
      return;
    }

    const patch = {
      tipo: form.tipo,
      cantidad_esperada: expected,
      cantidad_lograda: achieved,
      url_externa: form.url_externa,
      descripcion: form.descripcion,
    };

    const ok = await onUpdate(medio, patch);
    if (!ok) {
      setLocalError('No se pudieron guardar los cambios del medio. Revisa el detalle del error mostrado arriba.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">Editar medio de verificación</p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm text-slate-600 font-body">
          Tipo de medio
          <select
            value={form.tipo}
            onChange={(event) => handleChange('tipo', event.target.value)}
            disabled={isUpdating}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
          >
            {tipoOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="block space-y-1 text-sm text-slate-600 font-body">
          URL de evidencia externa
          <input
            type="url"
            value={form.url_externa}
            onChange={(event) => handleChange('url_externa', event.target.value)}
            disabled={isUpdating}
            placeholder="https://drive.google.com/..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm text-slate-600 font-body">
          Cantidad esperada
          <input
            type="number"
            min="1"
            step="1"
            value={form.cantidad_esperada}
            onChange={(event) => handleChange('cantidad_esperada', event.target.value)}
            disabled={isUpdating}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
          />
        </label>

        <label className="block space-y-1 text-sm text-slate-600 font-body">
          Cantidad lograda
          <input
            type="number"
            min="0"
            step="1"
            value={form.cantidad_lograda}
            onChange={(event) => handleChange('cantidad_lograda', event.target.value)}
            disabled={isUpdating}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm text-slate-600 font-body">
        Comentario o descripción
        <textarea
          rows="3"
          value={form.descripcion}
          onChange={(event) => handleChange('descripcion', event.target.value)}
          disabled={isUpdating}
          placeholder="Describe brevemente el alcance de este medio y cómo respalda la acción."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
        />
      </label>

      {localError ? (
        <p className="text-xs text-red font-body">{localError}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={isUpdating}
          className="inline-flex items-center rounded-xl bg-navy px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isUpdating ? 'Guardando cambios...' : 'Guardar cambios del medio'}
        </button>
      </div>
    </form>
  );
}