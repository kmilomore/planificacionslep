import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import Alert from '../components/ui/Alert';
import AccionDetalleSkeleton from '../components/acciones/detalle/AccionDetalleSkeleton';
import AccionOverviewSection from '../components/acciones/detalle/AccionOverviewSection';
import AccionMediaSection from '../components/acciones/detalle/AccionMediaSection';
import AccionTimelineSection from '../components/acciones/detalle/AccionTimelineSection';
import AccionSidebar from '../components/acciones/detalle/AccionSidebar';
import { useAuth } from '../context/AuthContext';
import {
  useAccion,
  useAddComentarioAccion,
  useDeleteAccion,
  useDeleteComentarioAccion,
  useDeleteMedioVerificacion,
  useUpdateAccion,
  useUpdateComentarioAccion,
  useUpdateEstadoAccion,
  useUploadMedioVerificacion,
} from '../hooks/useApi';

const ROLES_GESTION = ['admin', 'director_ejecutivo', 'subdirector'];
const TIPO_MEDIO_OPTIONS = [
  { value: 'lista_asistencia', label: 'Lista de asistencia' },
  { value: 'acta', label: 'Acta' },
  { value: 'fotografia', label: 'Fotografia' },
  { value: 'informe', label: 'Informe' },
  { value: 'otro', label: 'Otro' },
];

export default function AccionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: accion, isLoading, error } = useAccion(id);
  const addComentario = useAddComentarioAccion(id);
  const updateComentario = useUpdateComentarioAccion(id);
  const deleteComentario = useDeleteComentarioAccion(id);
  const deleteAccion = useDeleteAccion();
  const deleteMedio = useDeleteMedioVerificacion(id);
  const updateAccion = useUpdateAccion(id);
  const updateEstado = useUpdateEstadoAccion(id);
  const uploadMedio = useUploadMedioVerificacion(id);

  const [feedback, setFeedback] = useState(null);
  const [optimisticAccion, setOptimisticAccion] = useState(null);
  const [uploadStage, setUploadStage] = useState('idle');
  const [comentarioForm, setComentarioForm] = useState('');
  const [estadoForm, setEstadoForm] = useState({ estado: 'planificada', avance: '0' });
  const [uploadForm, setUploadForm] = useState({
    tipo: 'informe',
    file: null,
    displayName: '',
    description: '',
  });
  const [mediosForm, setMediosForm] = useState([]);
  const [deletingMedioId, setDeletingMedioId] = useState('');

  const accionView = useMemo(() => {
    if (!accion) return accion;
    if (!optimisticAccion) return accion;

    return {
      ...accion,
      ...optimisticAccion,
      timeline: optimisticAccion.timeline || accion.timeline || [],
    };
  }, [accion, optimisticAccion]);

  const requiredTipoOptions = useMemo(() => {
    const required = Array.isArray(accionView?.medios_requeridos) ? accionView.medios_requeridos : [];
    if (!required.length) return [];
    return TIPO_MEDIO_OPTIONS.filter((option) => required.includes(option.value));
  }, [accionView]);

  useEffect(() => {
    if (!requiredTipoOptions.length) return;
    const isCurrentAllowed = requiredTipoOptions.some((option) => option.value === uploadForm.tipo);
    if (isCurrentAllowed) return;

    setUploadForm((current) => ({
      ...current,
      tipo: requiredTipoOptions[0].value,
    }));
  }, [requiredTipoOptions, uploadForm.tipo]);

  const permissions = useMemo(() => resolveActionPermissions(accionView, user), [accionView, user]);
  const isMediosDirty = useMemo(() => {
    const current = Array.isArray(accion?.medios_requeridos) ? accion.medios_requeridos : [];
    if (current.length !== mediosForm.length) return true;
    return current.some((tipo) => !mediosForm.includes(tipo));
  }, [accion, mediosForm]);

  useEffect(() => {
    if (!accion) return;
    setEstadoForm({
      estado: accion.estado || 'planificada',
      avance: String(accion.avance ?? 0),
    });
    setMediosForm(Array.isArray(accion.medios_requeridos) ? accion.medios_requeridos : []);
  }, [accion]);

  const timeline = useMemo(() => accionView?.timeline || [], [accionView]);
  const comentariosOperativos = useMemo(() => accionView?.comentarios || [], [accionView]);
  const medios = useMemo(() => accionView?.medios || [], [accionView]);
  const imagePreviewUrl = useMemo(() => {
    if (!uploadForm.file || !isImageFile(uploadForm.file.name)) return '';
    return URL.createObjectURL(uploadForm.file);
  }, [uploadForm.file]);
  const uploadFileName = useMemo(() => {
    if (!uploadForm.file) return '';
    return ensureFileExtension(uploadForm.displayName, uploadForm.file.name);
  }, [uploadForm.displayName, uploadForm.file]);
  const isEstadoDirty = Boolean(
    accion && (
      estadoForm.estado !== (accion.estado || 'planificada')
      || Number(estadoForm.avance || 0) !== Number(accion.avance ?? 0)
    )
  );

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!isEstadoDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEstadoDirty]);

  if (isLoading) {
    return <AccionDetalleSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert type="error" message={error.message} />
      </div>
    );
  }

  if (!accionView) {
    return (
      <div className="p-6">
        <Alert type="warning" message="La acción solicitada no existe o no está disponible para tu perfil." />
      </div>
    );
  }

  const handleEstadoReset = () => {
    if (!accion) return;
    setEstadoForm({
      estado: accion.estado || 'planificada',
      avance: String(accion.avance ?? 0),
    });
    setFeedback(null);
  };

  const handleEstadoSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    const nextEstado = {
      estado: estadoForm.estado,
      avance: Number(estadoForm.avance || 0),
      updated_at: new Date().toISOString(),
    };
    const previousAccion = queryClient.getQueryData(['accion', id]);
    const optimisticTimeline = [
      {
        tipo: 'cambio_estado',
        texto: `Estado actualizado a ${humanizeEstado(nextEstado.estado)} con ${nextEstado.avance}% de avance`,
        fecha: nextEstado.updated_at,
      },
      ...(accionView.timeline || []),
    ];
    const optimisticState = {
      ...nextEstado,
      timeline: optimisticTimeline,
    };

    setOptimisticAccion(optimisticState);
    queryClient.setQueryData(['accion', id], (current) => {
      if (!current) return current;
      return {
        ...current,
        ...optimisticState,
      };
    });

    try {
      await updateEstado.mutateAsync({
        id,
        data: {
          estado: nextEstado.estado,
          avance: nextEstado.avance,
        },
      });
      setOptimisticAccion(null);
      setFeedback({ type: 'success', message: 'Estado de la acción actualizado.' });
    } catch (submitError) {
      setOptimisticAccion(null);
      queryClient.setQueryData(['accion', id], previousAccion);
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
      setUploadStage('reading');
      const base64Content = await readFileAsBase64(uploadForm.file);
      setUploadStage('uploading');

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

      setUploadStage('syncing');
      setUploadForm({
        tipo: uploadForm.tipo,
        file: null,
        displayName: '',
        description: '',
      });
      setFeedback({ type: 'success', message: 'Medio de verificación subido correctamente.' });
    } catch (submitError) {
      setFeedback({ type: 'error', message: getFriendlyUploadErrorMessage(submitError) });
    } finally {
      setUploadStage('idle');
    }
  };

  const handleMediosSubmit = async () => {
    setFeedback(null);

    if (!mediosForm.length) {
      setFeedback({ type: 'error', message: 'Debes mantener al menos un medio de verificación.' });
      return;
    }

    try {
      await updateAccion.mutateAsync({
        id,
        data: {
          medios_requeridos: mediosForm,
        },
      });
      setFeedback({ type: 'success', message: 'Tipos de medios actualizados.' });
    } catch (submitError) {
      setFeedback({ type: 'error', message: submitError.message });
    }
  };

  const handleMediosReset = () => {
    setMediosForm(Array.isArray(accion?.medios_requeridos) ? accion.medios_requeridos : []);
    setFeedback(null);
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    const texto = String(comentarioForm || '').trim();
    if (!texto) {
      setFeedback({ type: 'error', message: 'Escribe un comentario antes de guardarlo.' });
      return;
    }

    const previousAccion = queryClient.getQueryData(['accion', id]);
    const optimisticComment = buildOptimisticComment({
      id: `temp-comment-${Date.now()}`,
      accionId: id,
      texto,
      user,
    });

    patchAccionDetailCache(queryClient, id, (current) => appendCommentToAccion(current, optimisticComment));

    try {
      const createdComment = await addComentario.mutateAsync({
        id,
        data: { texto },
      });
      patchAccionDetailCache(queryClient, id, (current) => replaceCommentInAccion(current, optimisticComment.id, createdComment));
      setComentarioForm('');
      setFeedback({ type: 'success', message: 'Comentario operativo guardado.' });
    } catch (submitError) {
      queryClient.setQueryData(['accion', id], previousAccion);
      setFeedback({ type: 'error', message: submitError.message });
    }
  };

  const handleCommentUpdate = async (entry, nextText) => {
    const texto = String(nextText || '').trim();
    if (!texto) {
      setFeedback({ type: 'error', message: 'El comentario no puede quedar vacío.' });
      return false;
    }

    setFeedback(null);
    const previousAccion = queryClient.getQueryData(['accion', id]);
    const optimisticComment = {
      ...entry,
      texto,
      fecha: new Date().toISOString(),
      tipo: 'comentario',
    };

    patchAccionDetailCache(queryClient, id, (current) => replaceCommentInAccion(current, entry.id, optimisticComment));

    try {
      const updatedComment = await updateComentario.mutateAsync({
        id: entry.id,
        data: { texto },
      });
      patchAccionDetailCache(queryClient, id, (current) => replaceCommentInAccion(current, entry.id, updatedComment));
      setFeedback({ type: 'success', message: 'Comentario actualizado.' });
      return true;
    } catch (submitError) {
      queryClient.setQueryData(['accion', id], previousAccion);
      setFeedback({ type: 'error', message: submitError.message });
      return false;
    }
  };

  const handleCommentDelete = async (entry) => {
    setFeedback(null);
    const previousAccion = queryClient.getQueryData(['accion', id]);

    patchAccionDetailCache(queryClient, id, (current) => removeCommentFromAccion(current, entry.id));

    try {
      await deleteComentario.mutateAsync({ id: entry.id });
      setFeedback({ type: 'success', message: 'Comentario eliminado.' });
    } catch (submitError) {
      queryClient.setQueryData(['accion', id], previousAccion);
      setFeedback({ type: 'error', message: submitError.message });
    }
  };

  const handleDeleteAccion = async () => {
    const confirmed = window.confirm('Esta acción se eliminará del portal. ¿Deseas continuar?');
    if (!confirmed) return;

    setFeedback(null);
    try {
      await deleteAccion.mutateAsync({ id });
      setFeedback({ type: 'success', message: 'Acción eliminada. Serás redirigido al listado.' });
      window.setTimeout(() => {
        navigate('/acciones');
      }, 400);
    } catch (submitError) {
      setFeedback({ type: 'error', message: submitError.message });
    }
  };

  const handleDeleteMedio = async (medio) => {
    const confirmed = window.confirm(`Se eliminará el medio "${medio?.nombre_archivo || 'sin nombre'}". ¿Deseas continuar?`);
    if (!confirmed) return;

    setFeedback(null);
    setDeletingMedioId(medio.id);
    try {
      await deleteMedio.mutateAsync({
        id,
        data: { medio_id: medio.id },
      });
      setFeedback({ type: 'success', message: 'Medio de verificación eliminado.' });
    } catch (submitError) {
      setFeedback({ type: 'error', message: submitError.message });
    } finally {
      setDeletingMedioId('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {uploadMedio.isPending ? (
        <UploadOverlay
          fileName={uploadFileName || uploadForm.file?.name || 'Procesando archivo'}
          tipo={humanizeTipo(uploadForm.tipo)}
          size={formatFileSize(uploadForm.file?.size || 0)}
          stage={uploadStage}
        />
      ) : null}

      {feedback ? <Alert type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} /> : null}

      <section className="w-full bg-white rounded-card shadow-card border border-slate-100 p-6 lg:p-8 space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <AccionOverviewSection accion={accionView} formatDate={formatDate} formatDateTime={formatDateTime} />
            {permissions.canManage ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDeleteAccion}
                  disabled={deleteAccion.isPending}
                  className="inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleteAccion.isPending ? 'Eliminando acción...' : 'Eliminar acción'}
                </button>
              </div>
            ) : null}

            <AccionMediaSection
              canUpload={permissions.canUploadMedios}
              canEditTipos={permissions.canQuickEdit}
              medios={medios}
              mediosRequeridos={accionView?.medios_requeridos || []}
              mediosForm={mediosForm}
              setMediosForm={setMediosForm}
              onSaveTipos={handleMediosSubmit}
              onResetTipos={handleMediosReset}
              isSavingTipos={updateAccion.isPending}
              isTiposDirty={isMediosDirty}
              uploadForm={uploadForm}
              setUploadForm={setUploadForm}
              onSubmit={handleUploadSubmit}
              isUploading={uploadMedio.isPending}
              imagePreviewUrl={imagePreviewUrl}
              formatDateTime={formatDateTime}
              humanizeTipo={humanizeTipo}
              isImageFile={isImageFile}
              formatFileSize={formatFileSize}
              getFileExtension={getFileExtension}
              uploadStage={uploadStage}
              tipoOptions={requiredTipoOptions}
              canDeleteMedios={permissions.canManage}
              onDeleteMedio={handleDeleteMedio}
              deletingMedioId={deletingMedioId}
            />

            <AccionTimelineSection timeline={timeline} formatDateTime={formatDateTime} />
          </div>

          <AccionSidebar
            canQuickEdit={permissions.canQuickEdit}
            canComment={permissions.canComment}
            formatDateTime={formatDateTime}
            currentUserId={user?.id}
            currentUserRole={user?.rol}
            estadoForm={estadoForm}
            setEstadoForm={setEstadoForm}
            onSubmit={handleEstadoSubmit}
            onReset={handleEstadoReset}
            isPending={updateEstado.isPending}
            isDirty={isEstadoDirty}
            comentarioForm={comentarioForm}
            setComentarioForm={setComentarioForm}
            onCommentSubmit={handleCommentSubmit}
            isCommentPending={addComentario.isPending || updateComentario.isPending || deleteComentario.isPending}
            onCommentUpdate={handleCommentUpdate}
            onCommentDelete={handleCommentDelete}
            timelineCount={timeline.length}
            mediosCount={medios.length}
            accion={accionView}
            comentarios={comentariosOperativos}
          />
        </div>
      </section>
    </div>
  );
}

function UploadOverlay({ fileName, tipo, size, stage }) {
  const stageState = {
    reading: 0,
    uploading: 1,
    syncing: 2,
  };
  const currentIndex = stageState[stage] ?? 2;

  return (
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
              <p className="text-sm font-semibold text-navy break-words">{fileName}</p>
              <p className="mt-1 text-sm text-slate-500 font-body">
                {tipo} · {size}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="upload-progress-bar h-full w-full rounded-full bg-gradient-to-r from-sky-400 via-blue to-navy" />
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <UploadStep label="Leyendo archivo" active={currentIndex >= 0} current={stage === 'reading'} />
              <UploadStep label="Enviando a Drive" active={currentIndex >= 1} current={stage === 'uploading'} />
              <UploadStep label="Actualizando acción" active={currentIndex >= 2} current={stage === 'syncing'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadStep({ label, active, current }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${active ? 'border-blue/20 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-400 font-semibold font-body">Estado</p>
      <p className={`mt-2 text-sm font-semibold font-body ${current ? 'text-blue' : active ? 'text-navy' : 'text-slate-400'}`}>{label}</p>
    </div>
  );
}

function resolveActionPermissions(accion, user) {
  const backendPermissions = accion?.permissions || {};
  const canManageByRole = ROLES_GESTION.includes(user?.rol);

  return {
    canManage: Boolean(backendPermissions.canManage ?? accion?.can_manage ?? canManageByRole),
    canUploadMedios: Boolean(backendPermissions.canUploadMedios ?? accion?.can_upload_medios ?? canManageByRole),
    canQuickEdit: Boolean(backendPermissions.canQuickEdit ?? accion?.can_edit_estado ?? canManageByRole),
    canComment: Boolean(backendPermissions.canComment ?? accion?.can_comment ?? canManageByRole),
  };
}

function formatDate(value) {
  if (!value) return 'Sin fecha';
  const normalized = normalizeDateValue(value);
  if (normalized) return normalized;

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
  const normalized = normalizeDateTimeValue(value);
  if (normalized) return normalized;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function normalizeDateValue(value) {
  const parts = extractDateParts(value);
  if (!parts) return '';
  return `${parts.day}/${parts.month}/${parts.year}`;
}

function normalizeDateTimeValue(value) {
  const parts = extractDateParts(value);
  if (!parts) return '';
  if (!parts.hours || !parts.minutes) {
    return `${parts.day}/${parts.month}/${parts.year}`;
  }
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hours}:${parts.minutes}`;
}

function extractDateParts(value) {
  const text = String(value || '').trim();
  if (!text) return null;
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!match) return null;
  const [, year, month, day, hours, minutes] = match;
  return { year, month, day, hours, minutes };
}

function humanizeTipo(tipo) {
  return TIPO_MEDIO_OPTIONS.find((option) => option.value === tipo)?.label || tipo || 'Sin tipo';
}

function humanizeEstado(estado) {
  const labels = {
    planificada: 'Planificada',
    en_progreso: 'En progreso',
    reportada: 'Reportada',
    completada: 'Completada',
  };
  return labels[estado] || estado;
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

function getFriendlyUploadErrorMessage(error) {
  const message = String(error?.message || error || '').trim();
  const lowered = message.toLowerCase();

  if (lowered.includes('driveapp.getfoldersbyname') || lowered.includes('permiso para llamar a driveapp')) {
    return 'El backend Apps Script todavía no tiene permisos de Drive. Ejecuta autorizarServicios() en Apps Script y vuelve a publicar el Web App.';
  }
  if (lowered.includes('tipo mime no permitido') || lowered.includes('extensión de archivo no permitida')) {
    return 'El archivo seleccionado no tiene un formato permitido. Usa PDF, DOCX, XLSX, PNG, JPG, JPEG o WEBP.';
  }
  if (lowered.includes('tamaño máximo') || lowered.includes('excede el tamaño máximo')) {
    return 'El archivo excede el tamaño máximo permitido de 10 MB.';
  }
  if (lowered.includes('failed to fetch') || lowered.includes('networkerror')) {
    return 'No se pudo conectar con el backend. Revisa tu conexión o confirma que el Web App esté publicado.';
  }
  return message || 'No se pudo subir el medio de verificación.';
}

function buildOptimisticComment({ id, accionId, texto, user }) {
  return {
    id,
    accion_id: accionId,
    texto,
    usuario: user?.email || 'Usuario no informado',
    fecha: new Date().toISOString(),
    created_by: user?.id || '',
    tipo: 'comentario',
  };
}

function patchAccionDetailCache(queryClient, accionId, updater) {
  queryClient.setQueryData(['accion', accionId], (current) => {
    if (!current) return current;
    return updater(current);
  });
}

function appendCommentToAccion(current, comment) {
  const comentarios = [comment, ...(current.comentarios || [])];
  return {
    ...current,
    comentarios,
    timeline: composeTimeline(current, comentarios),
  };
}

function replaceCommentInAccion(current, commentId, nextComment) {
  const comentarios = (current.comentarios || []).map((entry) => (entry.id === commentId ? nextComment : entry));
  return {
    ...current,
    comentarios,
    timeline: composeTimeline(current, comentarios),
  };
}

function removeCommentFromAccion(current, commentId) {
  const comentarios = (current.comentarios || []).filter((entry) => entry.id !== commentId);
  return {
    ...current,
    comentarios,
    timeline: composeTimeline(current, comentarios),
  };
}

function composeTimeline(current, comentarios) {
  const nonCommentEntries = (current.timeline || []).filter((entry) => !isCommentTimelineType(entry.tipo));
  const commentEntries = (comentarios || []).map((entry) => ({
    tipo: entry.tipo || 'comentario',
    fecha: entry.fecha,
    texto: entry.texto,
  }));

  return [...nonCommentEntries, ...commentEntries]
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
}

function isCommentTimelineType(tipo) {
  const value = String(tipo || '').toLowerCase();
  return value.includes('coment') || value.includes('observ');
}
