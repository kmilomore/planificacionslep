import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callApi } from '../config/api';

export function useApiQuery(queryKey, action, payload = {}, options = {}) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn:  () => callApi(action, payload),
    ...options,
  });
}

export function useApiMutation(action, invalidateKeys = [], options = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => callApi(action, payload),
    onSuccess: (...args) => {
      invalidateKeys.forEach(k => qc.invalidateQueries({ queryKey: Array.isArray(k) ? k : [k] }));
      options.onSuccess?.(...args);
    },
    ...options,
  });
}

// --- Instrumentos ---
export function useInstrumentos() {
  return useApiQuery('instrumentos', 'getInstrumentos');
}

export function useCreateInstrumento() {
  return useApiMutation('createInstrumento', ['instrumentos']);
}

export function useUpdateInstrumento() {
  return useApiMutation('updateInstrumento', ['instrumentos']);
}

// --- Indicadores ---
export function useIndicadores(instrumento_id) {
  return useApiQuery(
    ['indicadores', instrumento_id],
    'getIndicadores',
    { filtros: { instrumento_id } },
    { enabled: !!instrumento_id }
  );
}

export function useIndicador(id) {
  return useApiQuery(
    ['indicador', id],
    'getIndicador',
    { id },
    { enabled: !!id }
  );
}

export function useCreateIndicador(instrumento_id) {
  return useApiMutation('createIndicador', [['indicadores', instrumento_id]]);
}

export function useUpdateIndicador(instrumento_id) {
  return useApiMutation('updateIndicador', [['indicadores', instrumento_id]]);
}

export function useDeleteIndicador(instrumento_id) {
  return useApiMutation('deleteIndicador', [['indicadores', instrumento_id]]);
}

// --- Cortes ---
export function useCortesPorInstrumento(instrumento_id) {
  return useApiQuery(
    ['cortes', instrumento_id],
    'getCortes',
    { filtros: { instrumento_id } },
    { enabled: !!instrumento_id }
  );
}

export function useTodosLosCortes() {
  return useApiQuery('cortes_all', 'getAllCortes');
}

export function useCreateCorte(instrumento_id) {
  return useApiMutation('createCorte', [['cortes', instrumento_id], 'cortes_all']);
}

export function useCerrarCorte(instrumento_id) {
  return useApiMutation('cerrarCorte', [['cortes', instrumento_id], 'cortes_all']);
}

// --- Avances ---
export function useAvancesPorCorte(corte_id) {
  return useApiQuery(
    ['avances', corte_id],
    'getAvancesPorCorte',
    { filtros: { corte_id } },
    { enabled: !!corte_id }
  );
}

export function useUpsertAvance(corte_id, instrumento_id) {
  return useApiMutation('upsertAvance', [
    ['avances', corte_id],
    ['indicadores', instrumento_id],
  ]);
}

export function useAprobarAvance(corte_id, instrumento_id) {
  return useApiMutation('aprobarAvance', [
    ['avances', corte_id],
    ['indicadores', instrumento_id],
  ]);
}

export function useObservarAvance(corte_id, instrumento_id) {
  return useApiMutation('observarAvance', [
    ['avances', corte_id],
    ['indicadores', instrumento_id],
  ]);
}

// --- Dashboard ---
export function useDashboardResumen() {
  return useApiQuery('dashboard_resumen', 'getDashboardResumen');
}

export function useDashboardInstrumento(instrumento_id) {
  return useApiQuery(
    ['dashboard_instrumento', instrumento_id],
    'getDashboardInstrumento',
    { filtros: { instrumento_id } },
    { enabled: !!instrumento_id }
  );
}

export function useGanttData() {
  return useApiQuery('gantt_data', 'getGanttData');
}

export function useMetricasCorte(corte_id) {
  return useApiQuery(
    ['metricas_corte', corte_id],
    'getMetricasCorte',
    { filtros: { corte_id } },
    { enabled: !!corte_id }
  );
}

// --- Acciones ---
export function useAcciones(filtros = {}) {
  return useApiQuery(
    ['acciones', filtros],
    'getAcciones',
    { filtros }
  );
}

export function useAccion(id) {
  return useApiQuery(
    ['accion', id],
    'getAccion',
    { id },
    { enabled: !!id }
  );
}

export function useCreateAccion() {
  return useApiMutation('createAccion', ['acciones']);
}

export function useUpdateAccion(id) {
  return useApiMutation('updateAccion', ['acciones', ['accion', id]]);
}

export function useUpdateEstadoAccion(id) {
  return useApiMutation('updateEstadoAccion', ['acciones', ['accion', id]]);
}

export function useMediosAccion(accionId) {
  return useApiQuery(
    ['medios_accion', accionId],
    'getMediosAccion',
    { filtros: { accion_id: accionId } },
    { enabled: !!accionId }
  );
}

export function useUploadMedioVerificacion(accionId) {
  return useApiMutation('uploadMedioVerificacion', ['acciones', ['accion', accionId], ['medios_accion', accionId]]);
}

// --- Usuarios ---
export function useUsuarios() {
  return useApiQuery('usuarios', 'getUsuarios');
}

export function useUpdateUsuario() {
  return useApiMutation('updateUsuario', ['usuarios']);
}
