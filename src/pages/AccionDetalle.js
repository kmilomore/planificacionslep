import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  FolderOpen,
  History,
  Image as ImageIcon,
  Save,
  Target,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccion, useUpdateEstadoAccion, useUploadMedioVerificacion } from '../hooks/useApi';
import EstadoBadge from '../components/acciones/EstadoBadge';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';

const ROLES_GESTION = ['admin', 'director_ejecutivo', 'subdirector'];
const TIPO_MEDIO_OPTIONS = [
  { value: 'listado_asistencia', label: 'Listado de asistencia' },
  { value: 'reporte', label: 'Reporte' },
  { value: 'otros', label: 'Otros' },
];

export default function AccionDetalle() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data: accion, isLoading, error } = useAccion(id);
  const updateEstado = useUpdateEstadoAccion(id);
  const uploadMedio = useUploadMedioVerificacion(id);

  const [feedback, setFeedback] = useState(null);
  const [estadoForm, setEstadoForm] = useState({ estado: 'planificada', avance: '0' });
  const [uploadForm, setUploadForm] = useState({
    tipo: 'reporte',
    file: null,
    displayName: '',
    description: '',
  });

  const canManage = ROLES_GESTION.includes(user?.rol);

  useEffect(() => {
    if (!accion) return;
    setEstadoForm({
      estado: accion.estado || 'planificada',
      avance: String(accion.avance ?? 0),
    });
  }, [accion]);

  const timeline = useMemo(() => accion?.timeline || [], [accion]);
  const medios = useMemo(() => accion?.medios || [], [accion]);
  const imagePreviewUrl = useMemo(() => {
    if (!uploadForm.file || !isImageFile(uploadForm.file.name)) return '';
    return URL.createObjectURL(uploadForm.file);
  }, [uploadForm.file]);
  const uploadFileName = useMemo(() => {
    if (!uploadForm.file) return '';
    return ensureFileExtension(uploadForm.displayName, uploadForm.file.name);
  }, [uploadForm.displayName, uploadForm.file]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" message={error.message} />
      </div>
    );
  }

  if (!accion) {
    return (
      <div className="p-6">
        <Alert type="warning" message="La acción solicitada no existe o no está disponible para tu perfil." />
      </div>
    );
  }

  const handleEstadoSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    try {
      await updateEstado.mutateAsync({
        id,
        data: {
          estado: estadoForm.estado,
          avance: Number(estadoForm.avance || 0),
        },
      });
      setFeedback({ type: 'success', message: 'Estado de la acción actualizado.' });
    } catch (submitError) {
      setFeedback({ type: 'error', message: submitError.message });
    }
  };

  const handleUploadSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!uploadForm.file) {
      setFeedback({ type: 'error', message: 'Selecciona un archivo para subir.' });
      return;
    }

    if (!String(uploadForm.displayName || '').trim()) {
      setFeedback({ type: 'error', message: 'Define un nombre para el medio antes de subirlo.' });
      return;
    }

    try {
      const base64Content = await readFileAsBase64(uploadForm.file);
      await uploadMedio.mutateAsync({
        id,
        data: {
          tipo: uploadForm.tipo,
          nombre_archivo: ensureFileExtension(uploadForm.displayName, uploadForm.file.name),
          nombre_original: uploadForm.file.name,
          descripcion: uploadForm.description.trim(),
          mime_type: uploadForm.file.type,
          size_bytes: uploadForm.file.size,
          base64Content,
        },
      });

      setUploadForm({
        tipo: uploadForm.tipo,
        file: null,
        displayName: '',
        description: '',
      });
      setFeedback({ type: 'success', message: 'Medio de verificación subido correctamente.' });
    } catch (submitError) {
      setFeedback({ type: 'error', message: submitError.message });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {uploadMedio.isPending ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 backdrop-blur-[2px] px-4">
          <div className="w-full max-w-xl rounded-[28px] border border-white/15 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Subiendo evidencia</p>
              <h2 className="mt-2 text-2xl font-display font-bold text-navy">Estamos cargando el medio de verificación</h2>
              <p className="mt-2 text-sm text-slate-500 font-body">
                No cierres esta pantalla mientras terminamos la lectura del archivo y el envío a Drive.
              </p>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue/10 text-blue">
                  <Spinner />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-navy break-words">{uploadFileName || uploadForm.file?.name || 'Procesando archivo'}</p>
                  <p className="mt-1 text-sm text-slate-500 font-body">
                    {humanizeTipo(uploadForm.tipo)} · {formatFileSize(uploadForm.file?.size || 0)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="upload-progress-bar h-full w-full rounded-full bg-gradient-to-r from-sky-400 via-blue to-navy" />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <UploadStep label="Leyendo archivo" active />
                  <UploadStep label="Enviando a Drive" active />
                  <UploadStep label="Actualizando acción" active />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? <Alert type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} /> : null}

      <section className="bg-white rounded-card shadow-card border border-slate-100 p-6 lg:p-8 max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Detalle de acción</p>
            <h1 className="mt-3 text-3xl font-display font-bold text-navy">{accion.nombre}</h1>
            <p className="mt-2 text-sm text-slate-500 font-body">
              {accion.instrumento_codigo || 'Sin instrumento'} · {accion.indicador_nombre || 'Sin indicador'}
            </p>
          </div>
          <EstadoBadge estado={accion.estado} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Equipo responsable" value={accion.responsable_display || accion.responsable} />
          <Metric label="Instrumento" value={accion.instrumento_nombre || accion.instrumento_codigo || 'Sin instrumento'} />
          <Metric label="Avance" value={`${accion.avance}%`} />
          <Metric label="Estado actual" value={accion.estado.replace('_', ' ')} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <h2 className="text-lg font-display font-bold text-navy">Descripción operativa</h2>
              <p className="mt-3 text-sm text-slate-600 font-body leading-6">
                {accion.descripcion || 'La acción aún no registra una descripción detallada.'}
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <InfoItem icon={Target} label="Indicador asociado" value={accion.indicador_nombre || accion.indicador_codigo || 'Sin indicador'} />
                <InfoItem icon={CalendarDays} label="Fecha compromiso" value={formatDate(accion.fecha_compromiso)} />
                <InfoItem icon={Clock3} label="Fecha inicio" value={formatDate(accion.fecha_inicio)} />
                <InfoItem icon={CheckCircle2} label="Última actualización" value={formatDateTime(accion.updated_at || accion.created_at)} />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-display font-bold text-navy">Medios de verificación</h2>
                  <p className="mt-1 text-sm text-slate-500 font-body">
                    Archivos guardados en Drive bajo la carpeta de la acción.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <FolderOpen size={14} />
                  {medios.length} archivos
                </span>
              </div>

              {canManage ? (
                <form onSubmit={handleUploadSubmit} className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_auto] lg:items-end">
                    <label className="block space-y-2 text-sm text-slate-600 font-body">
                      Tipo de medio
                      <select
                        value={uploadForm.tipo}
                        onChange={(event) => setUploadForm((current) => ({ ...current, tipo: event.target.value }))}
                        disabled={uploadMedio.isPending}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
                      >
                        {TIPO_MEDIO_OPTIONS.map((option) => (
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
                        disabled={uploadMedio.isPending}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-[11px] text-sm text-slate-700 file:mr-4 file:border-0 file:bg-transparent file:p-0 file:font-medium"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={uploadMedio.isPending}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-5 py-3 text-sm font-semibold text-white hover:bg-navy transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {uploadMedio.isPending ? <Spinner size="sm" /> : <UploadCloud size={16} />}
                      {uploadMedio.isPending ? 'Subiendo...' : 'Subir medio'}
                    </button>

                    <label className="block space-y-2 text-sm text-slate-600 font-body lg:col-span-2">
                      Nombre visible del medio
                      <input
                        type="text"
                        value={uploadForm.displayName}
                        onChange={(event) => setUploadForm((current) => ({ ...current, displayName: event.target.value }))}
                        disabled={uploadMedio.isPending || !uploadForm.file}
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
                        disabled={uploadMedio.isPending || !uploadForm.file}
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
                  <Alert type="info" message="Tu perfil puede revisar el detalle, pero la carga de medios queda restringida por backend a perfiles de gestión sobre la acción." />
                </div>
              )}

              <div className="mt-5 space-y-3">
                {medios.length ? medios.map((medio) => (
                  <article key={medio.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-white p-2 text-blue border border-slate-100">
                        {isImageFile(medio.nombre_archivo) ? <ImageIcon size={18} /> : <FileText size={18} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-navy break-words">{medio.nombre_archivo}</p>
                        <p className="mt-1 text-sm text-slate-500 font-body">
                          {humanizeTipo(medio.tipo)} · Subido por {medio.usuario || 'Usuario no informado'} · {formatDateTime(medio.fecha_subida)}
                        </p>
                        {medio.nombre_original && medio.nombre_original !== medio.nombre_archivo ? (
                          <p className="mt-1 text-xs text-slate-400 font-body">
                            Archivo original: {medio.nombre_original}
                          </p>
                        ) : null}
                        {medio.descripcion ? (
                          <p className="mt-2 text-sm text-slate-600 font-body leading-6">{medio.descripcion}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <a
                        href={medio.url_drive}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue hover:text-blue transition-colors"
                      >
                        <ExternalLink size={16} />
                        Abrir Drive
                      </a>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-slate-50">
                    <p className="text-sm font-semibold text-navy">Aún no hay medios cargados</p>
                    <p className="mt-2 text-sm text-slate-500 font-body">
                      Usa esta vista para dejar evidencia documental centralizada por acción.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-3">
                <History size={18} className="text-blue" />
                <h2 className="text-lg font-display font-bold text-navy">Bitácora operativa</h2>
              </div>
              <div className="mt-5 space-y-4">
                {timeline.length ? timeline.map((entry, index) => (
                  <div key={`${entry.tipo}-${entry.fecha}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-blue mt-1" />
                      {index < timeline.length - 1 ? <div className="mt-2 w-px flex-1 bg-slate-200" /> : null}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-semibold text-navy">{entry.texto}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold">{entry.tipo}</p>
                      <p className="mt-1 text-sm text-slate-500 font-body">{formatDateTime(entry.fecha)}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 font-body">No hay eventos registrados todavía.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-100 bg-white p-5 space-y-4">
              <h2 className="text-lg font-display font-bold text-navy">Gestión rápida</h2>
              <p className="text-sm text-slate-500 font-body">
                Ajusta estado y avance sin salir del detalle. El backend sigue validando coherencia entre estado, avance y fechas.
              </p>

              {canManage ? (
                <form onSubmit={handleEstadoSubmit} className="space-y-4">
                  <label className="block space-y-2 text-sm text-slate-600 font-body">
                    Estado
                    <select
                      value={estadoForm.estado}
                      onChange={(event) => setEstadoForm((current) => ({ ...current, estado: event.target.value }))}
                      disabled={updateEstado.isPending}
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
                      disabled={updateEstado.isPending}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue/30"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={updateEstado.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-blue transition-colors disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Save size={16} />
                    {updateEstado.isPending ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              ) : (
                <Alert type="info" message="Tu perfil no tiene edición rápida habilitada para esta acción." />
              )}
            </section>

            <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
              <h2 className="text-lg font-display font-bold text-navy">Resumen documental</h2>
              <SummaryRow label="Carpeta raíz" value="Planificacion" />
              <SummaryRow label="Ruta lógica" value={`${accion.indicador_nombre || 'Indicador'} / ${accion.nombre} / Medios de Verificacion`} />
              <SummaryRow label="Eventos timeline" value={String(timeline.length)} />
              <SummaryRow label="Archivos cargados" value={String(medios.length)} />
            </section>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">{label}</p>
      <p className="mt-2 text-base font-semibold text-navy font-body">{value}</p>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 flex items-start gap-3">
      <div className="rounded-xl bg-blue-50 p-2 text-blue">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">{label}</p>
        <p className="mt-2 text-sm font-semibold text-navy font-body">{value || 'Sin información'}</p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-500 font-body">{label}</span>
      <span className="text-sm font-semibold text-navy font-body text-right break-words">{value || '—'}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return 'Sin registro';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function humanizeTipo(tipo) {
  return TIPO_MEDIO_OPTIONS.find((option) => option.value === tipo)?.label || tipo || 'Sin tipo';
}

function isImageFile(fileName) {
  return /\.(png|jpg|jpeg|webp)$/i.test(String(fileName || ''));
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const [, base64] = result.split(',');
      if (!base64) {
        reject(new Error('No se pudo leer el archivo seleccionado'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
    reader.readAsDataURL(file);
  });
}

function ensureFileExtension(displayName, originalName) {
  const trimmed = String(displayName || '').trim();
  const originalExtension = getFileExtension(originalName);
  if (!trimmed) return originalName;
  if (!originalExtension) return trimmed;

  return new RegExp(`[.]${originalExtension}$`, 'i').test(trimmed)
    ? trimmed
    : `${trimmed}.${originalExtension}`;
}

function getFileExtension(fileName) {
  const parts = String(fileName || '').trim().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function formatFileSize(size) {
  if (!size) return '0 KB';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadStep({ label, active }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">Estado</p>
      <p className={`mt-2 text-sm font-semibold font-body ${active ? 'text-navy' : 'text-slate-400'}`}>{label}</p>
    </div>
  );
}
