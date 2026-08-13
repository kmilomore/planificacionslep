const STORAGE_KEY = 'planificacion-demo-store-v1';

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeBoolean(value) {
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'si', 'sí', 'TRUE'].includes(String(value || '').trim());
}

function normalizeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isoDate(daysOffset = 0) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().slice(0, 10);
}

function isoDateTime(daysOffset = 0, hour = 9, minute = 0) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
}

function seedStore() {
  const users = [
    { id: 'usr_admin', nombre: 'Ana Demo', email: 'ana.demo@demo.local', rol: 'admin', area: 'Planificacion y Control', activo: true, creado_en: nowIso() },
    { id: 'usr_sub_1', nombre: 'Carlos QA', email: 'carlos.qa@demo.local', rol: 'subdirector', area: 'Gestion Pedagogica', activo: true, creado_en: nowIso() },
    { id: 'usr_dir', nombre: 'Daniela Ejecutiva', email: 'direccion.demo@demo.local', rol: 'director_ejecutivo', area: 'Direccion Ejecutiva', activo: true, creado_en: nowIso() },
  ];

  const instrumentos = [
    { id: 'inst_001', codigo: 'PMI', nombre: 'PMI 2026', descripcion: 'Plan anual de mejora institucional con hitos trimestrales.', tipo_seguimiento: 'trimestral', color_hex: '#25306B', responsable_id: 'usr_sub_1', activo: true, ciclo: '2026' },
    { id: 'inst_002', codigo: 'PT', nombre: 'Plan Territorial', descripcion: 'Seguimiento territorial con foco en cobertura y ejecucion.', tipo_seguimiento: 'semestral', color_hex: '#0F766E', responsable_id: 'usr_admin', activo: true, ciclo: '2026' },
    { id: 'inst_003', codigo: 'CDC', nombre: 'Convenio de Desempeño', descripcion: 'Control de hitos criticos y compromisos de desempeño.', tipo_seguimiento: 'anual_con_hitos', color_hex: '#B45309', responsable_id: 'usr_dir', activo: true, ciclo: '2026' },
  ];

  const indicadores = [
    { id: 'ind_001', instrumento_id: 'inst_001', codigo_indicador: 'PMI-01', nombre: 'Cobertura de seguimiento mensual', dimension: 'Seguimiento', subdimension: 'Unidad de Mejora', equipo_trabajo: 'Unidad de Mejora', tipo_meta: 'porcentaje', meta_valor: '100', unidad: '%', peso: '25', responsable_id: 'usr_sub_1', formula: '(A/B)*100', fuente_verificacion: 'Informe mensual', descripcion: 'Mide el seguimiento mensual del instrumento.', fecha_cumplimiento_2026: isoDate(45), activo: true, estado_indicador: 'Activo' },
    { id: 'ind_002', instrumento_id: 'inst_001', codigo_indicador: 'PMI-02', nombre: 'Cumplimiento de hitos críticos', dimension: 'Operacion', subdimension: 'Gestion Pedagogica', equipo_trabajo: 'Gestion Pedagogica', tipo_meta: 'porcentaje', meta_valor: '90', unidad: '%', peso: '30', responsable_id: 'usr_sub_1', formula: '(A/B)*100', fuente_verificacion: 'Actas y respaldos', descripcion: 'Seguimiento de hitos críticos del semestre.', fecha_cumplimiento_2026: isoDate(12), activo: true, estado_indicador: 'Activo' },
    { id: 'ind_003', instrumento_id: 'inst_001', codigo_indicador: 'PMI-03', nombre: 'Ejecución del plan anual', dimension: 'Gestion', subdimension: 'Planificacion y Control', equipo_trabajo: 'Planificacion y Control', tipo_meta: 'porcentaje', meta_valor: '85', unidad: '%', peso: '20', responsable_id: 'usr_admin', formula: '(A/B)*100', fuente_verificacion: 'Reporte consolidado', descripcion: 'Avance acumulado del plan anual.', fecha_cumplimiento_2026: isoDate(90), activo: true, estado_indicador: 'Activo' },
    { id: 'ind_004', instrumento_id: 'inst_002', codigo_indicador: 'PT-01', nombre: 'Validación de compromisos territoriales', dimension: 'Territorio', subdimension: 'Vinculacion Territorial', equipo_trabajo: 'Vinculacion Territorial', tipo_meta: 'numero', meta_valor: '12', unidad: 'hitos', peso: '25', responsable_id: 'usr_dir', formula: 'A', fuente_verificacion: 'Bitacora territorial', descripcion: 'Cantidad de compromisos validados.', fecha_cumplimiento_2026: isoDate(-4), activo: true, estado_indicador: 'Activo' },
    { id: 'ind_005', instrumento_id: 'inst_002', codigo_indicador: 'PT-02', nombre: 'Reporte de cobertura territorial', dimension: 'Cobertura', subdimension: 'Analisis Territorial', equipo_trabajo: 'Analisis Territorial', tipo_meta: 'porcentaje', meta_valor: '80', unidad: '%', peso: '25', responsable_id: 'usr_admin', formula: '(A/B)*100', fuente_verificacion: 'Reporte semanal', descripcion: 'Cobertura territorial reportada.', fecha_cumplimiento_2026: isoDate(20), activo: true, estado_indicador: 'Activo' },
    { id: 'ind_006', instrumento_id: 'inst_003', codigo_indicador: 'CDC-01', nombre: 'Formalización de entregables', dimension: 'Desempeño', subdimension: 'Control de Gestión', equipo_trabajo: 'Control de Gestión', tipo_meta: 'booleano', meta_valor: 'Sí', unidad: '', peso: '40', responsable_id: 'usr_dir', formula: 'Cumple / No cumple', fuente_verificacion: 'Resolución firmada', descripcion: 'Control de entregables críticos.', fecha_cumplimiento_2026: isoDate(5), activo: true, estado_indicador: 'Activo' },
  ];

  const cortes = [
    { id: 'corte_001', instrumento_id: 'inst_001', nombre_corte: 'Corte marzo', codigo_corte: 'PMI-C1', fecha_inicio: isoDate(-150), fecha_limite: isoDate(-120), dias_recordatorio: 7, estado: 'cerrado' },
    { id: 'corte_002', instrumento_id: 'inst_001', nombre_corte: 'Corte agosto', codigo_corte: 'PMI-C2', fecha_inicio: isoDate(-10), fecha_limite: isoDate(12), dias_recordatorio: 7, estado: 'en_curso' },
    { id: 'corte_003', instrumento_id: 'inst_002', nombre_corte: 'Corte territorial 1', codigo_corte: 'PT-C1', fecha_inicio: isoDate(-30), fecha_limite: isoDate(-4), dias_recordatorio: 5, estado: 'pendiente' },
    { id: 'corte_004', instrumento_id: 'inst_002', nombre_corte: 'Corte territorial 2', codigo_corte: 'PT-C2', fecha_inicio: isoDate(8), fecha_limite: isoDate(25), dias_recordatorio: 5, estado: 'pendiente' },
    { id: 'corte_005', instrumento_id: 'inst_003', nombre_corte: 'Hito documental', codigo_corte: 'CDC-H1', fecha_inicio: isoDate(-2), fecha_limite: isoDate(5), dias_recordatorio: 3, estado: 'en_curso' },
  ];

  const avances = [
    { id: 'av_001', indicador_id: 'ind_001', corte_id: 'corte_002', valor_reportado: '82', comentario: 'Seguimiento estable con evidencia parcial.', evidencia_url: '', porcentaje_cumplimiento: 82, estado_semaforo: 'verde', estado_revision: 'aprobado', updated_at: isoDateTime(-1, 12, 15) },
    { id: 'av_002', indicador_id: 'ind_002', corte_id: 'corte_002', valor_reportado: '58', comentario: 'Faltan respaldos de dos hitos críticos.', evidencia_url: '', porcentaje_cumplimiento: 64, estado_semaforo: 'amarillo', estado_revision: 'observado', updated_at: isoDateTime(-2, 11, 0) },
    { id: 'av_003', indicador_id: 'ind_004', corte_id: 'corte_003', valor_reportado: '5', comentario: 'Corte vencido sin cierre formal.', evidencia_url: '', porcentaje_cumplimiento: 42, estado_semaforo: 'rojo', estado_revision: '', updated_at: isoDateTime(-6, 9, 30) },
    { id: 'av_004', indicador_id: 'ind_006', corte_id: 'corte_005', valor_reportado: 'No', comentario: 'Documento en revisión final.', evidencia_url: '', porcentaje_cumplimiento: 0, estado_semaforo: 'rojo', estado_revision: '', updated_at: isoDateTime(0, 8, 30) },
  ];

  const acciones = [
    {
      id: 'accion_001',
      indicador_id: 'ind_002',
      nombre: 'Levantar diagnóstico inicial',
      descripcion: 'Reunir antecedentes pendientes del corte.',
      responsable: 'Gestion Pedagogica',
      fecha_inicio: isoDate(-7),
      fecha_compromiso: isoDate(6),
      estado: 'en_progreso',
      avance: 50,
      created_at: isoDateTime(-7, 10, 0),
      updated_at: isoDateTime(-1, 16, 20),
      created_by: 'usr_sub_1',
      deleted: false,
      medios_requeridos: ['acta', 'informe'],
      medios_requeridos_detalle: [{ tipo: 'acta', cantidad: 1 }, { tipo: 'informe', cantidad: 2 }],
      comentarios: [
        { id: 'com_001', texto: 'Se coordinó reunión con equipo responsable.', fecha: isoDateTime(-3, 15, 0), usuario: 'Carlos QA', created_by: 'usr_sub_1', tipo: 'comentario' },
      ],
      medios: [
        { id: 'med_001', tipo: 'acta', nombre_archivo: 'Acta reunion agosto.pdf', nombre_original: 'acta.pdf', descripcion: 'Acta de coordinación inicial.', mime_type: 'application/pdf', size_bytes: 120000, url: 'mock://med_001', created_at: isoDateTime(-2, 13, 0), cantidad_lograda: 1, cantidad_esperada: 1 },
      ],
    },
    {
      id: 'accion_002',
      indicador_id: 'ind_001',
      nombre: 'Validar avance con equipos',
      descripcion: 'Consolidar reporte semanal y validar consistencia.',
      responsable: 'Unidad de Mejora',
      fecha_inicio: isoDate(-3),
      fecha_compromiso: isoDate(10),
      estado: 'reportada',
      avance: 75,
      created_at: isoDateTime(-5, 9, 45),
      updated_at: isoDateTime(-1, 14, 40),
      created_by: 'usr_admin',
      deleted: false,
      medios_requeridos: ['informe'],
      medios_requeridos_detalle: [{ tipo: 'informe', cantidad: 2 }],
      comentarios: [],
      medios: [
        { id: 'med_002', tipo: 'informe', nombre_archivo: 'Resumen semanal.docx', nombre_original: 'resumen.docx', descripcion: 'Resumen preliminar.', mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size_bytes: 98000, url: 'mock://med_002', created_at: isoDateTime(-1, 10, 15), cantidad_lograda: 1, cantidad_esperada: 1 },
      ],
    },
    {
      id: 'accion_003',
      indicador_id: 'ind_004',
      nombre: 'Publicar reporte de seguimiento',
      descripcion: 'Emitir versión final del seguimiento territorial.',
      responsable: 'Vinculacion Territorial',
      fecha_inicio: isoDate(-12),
      fecha_compromiso: isoDate(-2),
      estado: 'completada',
      avance: 100,
      created_at: isoDateTime(-12, 8, 0),
      updated_at: isoDateTime(-2, 18, 0),
      created_by: 'usr_dir',
      deleted: false,
      medios_requeridos: ['informe', 'fotografia'],
      medios_requeridos_detalle: [{ tipo: 'informe', cantidad: 1 }, { tipo: 'fotografia', cantidad: 1 }],
      comentarios: [
        { id: 'com_002', texto: 'Se cerró acción con entrega territorial validada.', fecha: isoDateTime(-2, 18, 0), usuario: 'Daniela Ejecutiva', created_by: 'usr_dir', tipo: 'comentario' },
      ],
      medios: [
        { id: 'med_003', tipo: 'informe', nombre_archivo: 'Reporte final.pdf', nombre_original: 'reporte.pdf', descripcion: 'Entrega final.', mime_type: 'application/pdf', size_bytes: 145000, url: 'mock://med_003', created_at: isoDateTime(-2, 16, 45), cantidad_lograda: 1, cantidad_esperada: 1 },
        { id: 'med_004', tipo: 'fotografia', nombre_archivo: 'Registro terreno.jpg', nombre_original: 'registro.jpg', descripcion: 'Respaldo fotográfico.', mime_type: 'image/jpeg', size_bytes: 220000, url: 'mock://med_004', created_at: isoDateTime(-2, 17, 10), cantidad_lograda: 1, cantidad_esperada: 1 },
      ],
    },
  ];

  const auditoria = [
    { id: 'aud_001', timestamp: isoDateTime(-3, 9, 0), user_nombre: 'Ana Demo', user_email: 'ana.demo@demo.local', user_rol: 'admin', user_area: 'Planificacion y Control', modulo: 'acciones', accion: 'update', entidad: 'accion', entidad_id: 'accion_001', detalle: 'Actualización de avance y fecha compromiso.' },
    { id: 'aud_002', timestamp: isoDateTime(-2, 17, 15), user_nombre: 'Daniela Ejecutiva', user_email: 'direccion.demo@demo.local', user_rol: 'director_ejecutivo', user_area: 'Direccion Ejecutiva', modulo: 'avances', accion: 'observe', entidad: 'avance', entidad_id: 'av_002', detalle: 'Observación de avance por falta de respaldos.' },
    { id: 'aud_003', timestamp: isoDateTime(-1, 12, 30), user_nombre: 'Carlos QA', user_email: 'carlos.qa@demo.local', user_rol: 'subdirector', user_area: 'Gestion Pedagogica', modulo: 'acciones', accion: 'create', entidad: 'medio', entidad_id: 'med_001', detalle: 'Carga de medio de verificación acta.' },
  ];

  return {
    meta: { updated_at: nowIso() },
    users,
    instrumentos,
    indicadores,
    cortes,
    avances,
    acciones,
    auditoria,
  };
}

function loadStore() {
  if (typeof window === 'undefined') return seedStore();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seeded = seedStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

function saveStore(store) {
  const next = { ...store, meta: { ...(store.meta || {}), updated_at: nowIso() } };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

function withStore(updater) {
  const current = loadStore();
  const draft = clone(current);
  const result = updater(draft);
  saveStore(draft);
  return result;
}

function getInstrumentoById(store, id) {
  return store.instrumentos.find((item) => item.id === id);
}

function getIndicadorById(store, id) {
  return store.indicadores.find((item) => item.id === id);
}

function getUserById(store, id) {
  return store.users.find((item) => item.id === id);
}

function getCutStatus(corte) {
  if (corte.estado === 'cerrado') return 'cerrado';
  const now = new Date();
  const start = new Date(corte.fecha_inicio);
  const end = new Date(corte.fecha_limite);
  if (end < now) return 'vencido';
  if (start <= now) return 'en_curso';
  return 'pendiente';
}

function getDaysTo(dateValue) {
  const target = new Date(dateValue);
  target.setHours(23, 59, 59, 999);
  const diff = target.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function semaforoFromPercentage(value) {
  if (value >= 80) return 'verde';
  if (value >= 50) return 'amarillo';
  return 'rojo';
}

function porcentajeFromIndicador(indicador, valorReportado) {
  if (!indicador) return 0;
  if (indicador.tipo_meta === 'booleano') {
    return ['sí', 'si', 'true', '1'].includes(String(valorReportado || '').trim().toLowerCase()) ? 100 : 0;
  }
  if (indicador.tipo_meta === 'texto') {
    return String(valorReportado || '').trim() ? 100 : 0;
  }
  const meta = normalizeNumber(String(indicador.meta_valor || '').replace(',', '.'));
  const valor = normalizeNumber(String(valorReportado || '').replace(',', '.'));
  if (!meta) return 0;
  return Math.max(0, Math.min(100, Math.round((valor / meta) * 100)));
}

function buildAvanceView(store, avance) {
  const indicador = getIndicadorById(store, avance.indicador_id);
  const porcentaje = Number.isFinite(Number(avance.porcentaje_cumplimiento))
    ? Number(avance.porcentaje_cumplimiento)
    : porcentajeFromIndicador(indicador, avance.valor_reportado);
  return {
    ...avance,
    porcentaje_cumplimiento: porcentaje,
    estado_semaforo: avance.estado_semaforo || semaforoFromPercentage(porcentaje),
    estado_revision: avance.estado_revision || '',
  };
}

function buildAccionSummary(store, accion) {
  const indicador = getIndicadorById(store, accion.indicador_id);
  const instrumento = indicador ? getInstrumentoById(store, indicador.instrumento_id) : null;
  const mediosDetalle = Array.isArray(accion.medios_requeridos_detalle) ? accion.medios_requeridos_detalle : [];
  const totalRequeridos = mediosDetalle.reduce((acc, item) => acc + normalizeNumber(item.cantidad), 0);
  const totalCumplidos = Array.isArray(accion.medios) ? accion.medios.length : 0;

  return {
    ...accion,
    indicador_nombre: indicador?.nombre || '',
    indicador_codigo: indicador?.codigo_indicador || '',
    instrumento_id: instrumento?.id || '',
    instrumento_codigo: instrumento?.codigo || '',
    instrumento_nombre: instrumento?.nombre || '',
    responsable_display: accion.responsable || '',
    medios_count: totalCumplidos,
    medios_requeridos_count: totalRequeridos,
    medios_cumplidos_count: totalCumplidos,
    can_manage: true,
    can_upload_medios: true,
    can_comment: true,
    can_edit_estado: true,
    permissions: {
      canManage: true,
      canUploadMedios: true,
      canQuickEdit: true,
      canComment: true,
    },
  };
}

function buildTimeline(accion) {
  const commentEntries = (accion.comentarios || []).map((comment) => ({
    id: comment.id,
    tipo: comment.tipo || 'comentario',
    fecha: comment.fecha,
    texto: comment.texto,
  }));
  const medioEntries = (accion.medios || []).map((medio) => ({
    id: medio.id,
    tipo: 'medio',
    fecha: medio.created_at,
    texto: `Se cargó ${medio.nombre_archivo || medio.nombre_original || 'un medio'}`,
  }));
  const baseEntries = [
    { id: `${accion.id}_create`, tipo: 'create', fecha: accion.created_at, texto: 'Acción creada' },
    { id: `${accion.id}_update`, tipo: 'update', fecha: accion.updated_at, texto: 'Última actualización de la acción' },
  ];
  return [...baseEntries, ...commentEntries, ...medioEntries]
    .sort((left, right) => new Date(right.fecha || 0) - new Date(left.fecha || 0));
}

function addAudit(store, entry) {
  store.auditoria.unshift({
    id: createId('aud'),
    timestamp: nowIso(),
    user_nombre: 'Invitado Demo',
    user_email: 'invitado@demo.local',
    user_rol: 'admin',
    user_area: 'Acceso abierto',
    ...entry,
  });
}

function filterAcciones(store, filtros = {}) {
  return store.acciones
    .filter((accion) => !accion.deleted)
    .map((accion) => buildAccionSummary(store, accion))
    .filter((accion) => {
      if (filtros.indicador_id && accion.indicador_id !== filtros.indicador_id) return false;
      if (filtros.instrumento_id && accion.instrumento_id !== filtros.instrumento_id) return false;
      if (filtros.estado && accion.estado !== filtros.estado) return false;
      if (filtros.responsable && accion.responsable !== filtros.responsable && accion.responsable_display !== filtros.responsable) return false;
      if (filtros.search) {
        const hay = [
          accion.nombre,
          accion.descripcion,
          accion.indicador_nombre,
          accion.instrumento_codigo,
          accion.instrumento_nombre,
          accion.responsable_display,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(String(filtros.search).toLowerCase())) return false;
      }
      return true;
    });
}

export const mockRepository = {
  async getInstrumentos() {
    return clone(loadStore().instrumentos);
  },

  async createInstrumento({ data }) {
    return withStore((store) => {
      const created = {
        id: createId('inst'),
        codigo: String(data?.codigo || '').trim().toUpperCase(),
        nombre: String(data?.nombre || '').trim(),
        descripcion: String(data?.descripcion || '').trim(),
        tipo_seguimiento: data?.tipo_seguimiento || 'semestral',
        color_hex: data?.color_hex || '#25306B',
        responsable_id: data?.responsable_id || '',
        activo: true,
        ciclo: '2026',
      };
      store.instrumentos.push(created);
      addAudit(store, { modulo: 'instrumentos', accion: 'create', entidad: 'instrumento', entidad_id: created.id, detalle: `Se creó ${created.codigo}.` });
      return clone(created);
    });
  },

  async updateInstrumento({ id, data }) {
    return withStore((store) => {
      const item = getInstrumentoById(store, id);
      if (!item) throw new Error('Instrumento no encontrado');
      Object.assign(item, data || {});
      addAudit(store, { modulo: 'instrumentos', accion: 'update', entidad: 'instrumento', entidad_id: item.id, detalle: `Se actualizó ${item.codigo}.` });
      return { ok: true };
    });
  },

  async getIndicadores({ filtros = {} } = {}) {
    const store = loadStore();
    const items = store.indicadores.filter((item) => !filtros.instrumento_id || item.instrumento_id === filtros.instrumento_id);
    return clone(items);
  },

  async getIndicador({ id }) {
    const item = getIndicadorById(loadStore(), id);
    if (!item) throw new Error('Indicador no encontrado');
    return clone(item);
  },

  async createIndicador({ data }) {
    return withStore((store) => {
      const created = {
        id: createId('ind'),
        activo: true,
        estado_indicador: 'Activo',
        ...data,
      };
      store.indicadores.push(created);
      addAudit(store, { modulo: 'indicadores', accion: 'create', entidad: 'indicador', entidad_id: created.id, detalle: `Se creó ${created.codigo_indicador || created.nombre}.` });
      return clone(created);
    });
  },

  async updateIndicador({ id, data }) {
    return withStore((store) => {
      const item = getIndicadorById(store, id);
      if (!item) throw new Error('Indicador no encontrado');
      Object.assign(item, data || {});
      addAudit(store, { modulo: 'indicadores', accion: 'update', entidad: 'indicador', entidad_id: item.id, detalle: `Se actualizó ${item.codigo_indicador}.` });
      return { ok: true };
    });
  },

  async deleteIndicador({ id }) {
    return withStore((store) => {
      const item = getIndicadorById(store, id);
      if (!item) throw new Error('Indicador no encontrado');
      item.activo = false;
      addAudit(store, { modulo: 'indicadores', accion: 'soft_delete', entidad: 'indicador', entidad_id: item.id, detalle: `Se desactivó ${item.codigo_indicador}.` });
      return { ok: true };
    });
  },

  async getCortes({ filtros = {} } = {}) {
    const store = loadStore();
    return clone(store.cortes.filter((item) => !filtros.instrumento_id || item.instrumento_id === filtros.instrumento_id));
  },

  async getAllCortes() {
    return clone(loadStore().cortes);
  },

  async createCorte({ data }) {
    return withStore((store) => {
      const created = {
        id: createId('corte'),
        estado: 'pendiente',
        ...data,
      };
      store.cortes.push(created);
      addAudit(store, { modulo: 'cortes', accion: 'create', entidad: 'corte', entidad_id: created.id, detalle: `Se creó ${created.codigo_corte}.` });
      return clone(created);
    });
  },

  async cerrarCorte({ id }) {
    return withStore((store) => {
      const item = store.cortes.find((entry) => entry.id === id);
      if (!item) throw new Error('Corte no encontrado');
      item.estado = 'cerrado';
      addAudit(store, { modulo: 'cortes', accion: 'status_change', entidad: 'corte', entidad_id: item.id, detalle: `Se cerró ${item.codigo_corte}.` });
      return { ok: true };
    });
  },

  async getAvancesPorCorte({ filtros = {} } = {}) {
    const store = loadStore();
    return clone(
      store.avances
        .filter((item) => !filtros.corte_id || item.corte_id === filtros.corte_id)
        .map((item) => buildAvanceView(store, item))
    );
  },

  async upsertAvance({ data }) {
    return withStore((store) => {
      const indicador = getIndicadorById(store, data?.indicador_id);
      if (!indicador) throw new Error('Indicador no encontrado');
      const corte = store.cortes.find((entry) => entry.id === data?.corte_id);
      if (!corte) throw new Error('Corte no encontrado');
      let item = store.avances.find((entry) => entry.indicador_id === data.indicador_id && entry.corte_id === data.corte_id);
      const porcentaje = porcentajeFromIndicador(indicador, data.valor_reportado);
      if (!item) {
        item = { id: createId('av') };
        store.avances.push(item);
      }
      Object.assign(item, data, {
        porcentaje_cumplimiento: porcentaje,
        estado_semaforo: semaforoFromPercentage(porcentaje),
        updated_at: nowIso(),
      });
      addAudit(store, { modulo: 'avances', accion: 'update', entidad: 'avance', entidad_id: item.id, detalle: `Se registró avance para ${indicador.codigo_indicador}.` });
      return clone(buildAvanceView(store, item));
    });
  },

  async aprobarAvance({ id }) {
    return withStore((store) => {
      const item = store.avances.find((entry) => entry.id === id);
      if (!item) throw new Error('Avance no encontrado');
      item.estado_revision = 'aprobado';
      item.updated_at = nowIso();
      addAudit(store, { modulo: 'avances', accion: 'approve', entidad: 'avance', entidad_id: item.id, detalle: 'Avance aprobado.' });
      return { ok: true };
    });
  },

  async observarAvance({ id, data }) {
    return withStore((store) => {
      const item = store.avances.find((entry) => entry.id === id);
      if (!item) throw new Error('Avance no encontrado');
      item.estado_revision = 'observado';
      item.comentario = String(data?.comentario || '').trim();
      item.updated_at = nowIso();
      addAudit(store, { modulo: 'avances', accion: 'observe', entidad: 'avance', entidad_id: item.id, detalle: 'Avance observado.' });
      return { ok: true };
    });
  },

  async getDashboardResumen() {
    const store = loadStore();
    const items = store.instrumentos.map((instrumento) => {
      const indicadores = store.indicadores.filter((item) => item.instrumento_id === instrumento.id && normalizeBoolean(item.activo));
      const cortes = store.cortes.filter((item) => item.instrumento_id === instrumento.id);
      const avances = store.avances
        .filter((avance) => indicadores.some((indicador) => indicador.id === avance.indicador_id))
        .map((avance) => buildAvanceView(store, avance));
      const totalIndicadores = indicadores.length;
      const indicadoresConAvance = avances.length;
      const promedio = totalIndicadores
        ? Math.round(indicadores.reduce((acc, indicador) => {
          const avance = avances.find((item) => item.indicador_id === indicador.id);
          return acc + normalizeNumber(avance?.porcentaje_cumplimiento);
        }, 0) / totalIndicadores)
        : 0;
      const semaforo = semaforoFromPercentage(promedio);
      const abiertos = cortes
        .map((corte) => ({ ...corte, estado_visual: getCutStatus(corte), dias_para_corte: getDaysTo(corte.fecha_limite) }))
        .filter((corte) => corte.estado_visual !== 'cerrado')
        .sort((left, right) => left.dias_para_corte - right.dias_para_corte);
      const proximo = abiertos[0] || null;
      return {
        instrumento,
        cumplimiento_global: promedio,
        semaforo,
        total_indicadores: totalIndicadores,
        indicadores_con_avance: indicadoresConAvance,
        indicadores_pendientes: Math.max(totalIndicadores - indicadoresConAvance, 0),
        dias_para_corte: proximo?.dias_para_corte ?? null,
        proximo_corte: proximo ? { id: proximo.id, nombre_corte: proximo.nombre_corte, fecha_limite: proximo.fecha_limite } : null,
        cortes: cortes.map((corte) => ({ ...corte, estado_visual: getCutStatus(corte) })),
      };
    });
    return { items, updated_at: store.meta?.updated_at || nowIso() };
  },

  async refreshDashboardResumen() {
    return this.getDashboardResumen();
  },

  async getDashboardInstrumento({ filtros = {} } = {}) {
    const resumen = await this.getDashboardResumen();
    return resumen.items.find((item) => item.instrumento.id === filtros.instrumento_id) || null;
  },

  async getGanttData() {
    const store = loadStore();
    return clone(store.instrumentos.map((instrumento) => {
      const responsable = getUserById(store, instrumento.responsable_id);
      return {
        instrumento: {
          ...instrumento,
          responsable_display: responsable?.nombre || 'Sin responsable',
        },
        cortes: store.cortes
          .filter((corte) => corte.instrumento_id === instrumento.id)
          .map((corte) => ({
            ...corte,
            instrumento_id: instrumento.id,
            estado_visual: getCutStatus(corte),
            dias_para_cierre: getDaysTo(corte.fecha_limite),
          })),
      };
    }));
  },

  async getMetricasCorte({ filtros = {} } = {}) {
    const store = loadStore();
    const corte = store.cortes.find((item) => item.id === filtros.corte_id);
    if (!corte) return null;
    const indicadores = store.indicadores.filter((item) => item.instrumento_id === corte.instrumento_id && normalizeBoolean(item.activo));
    const avances = store.avances
      .filter((item) => item.corte_id === corte.id)
      .map((item) => buildAvanceView(store, item));
    const pendingIndicador = indicadores.find((indicador) => !avances.some((avance) => avance.indicador_id === indicador.id));
    const observedIndicador = indicadores.find((indicador) => avances.some((avance) => avance.indicador_id === indicador.id && avance.estado_revision === 'observado'));
    const recomendado = pendingIndicador || observedIndicador || indicadores[0] || null;
    return {
      total_indicadores: indicadores.length,
      indicadores_con_avance: avances.length,
      indicadores_pendientes: Math.max(indicadores.length - avances.length, 0),
      aprobados: avances.filter((item) => item.estado_revision === 'aprobado').length,
      semaforos: {
        verde: avances.filter((item) => item.estado_semaforo === 'verde').length,
        amarillo: avances.filter((item) => item.estado_semaforo === 'amarillo').length,
        rojo: avances.filter((item) => item.estado_semaforo === 'rojo').length,
      },
      indicador_recomendado: recomendado ? {
        id: recomendado.id,
        codigo_indicador: recomendado.codigo_indicador,
        nombre: recomendado.nombre,
        responsable_display: recomendado.equipo_trabajo || recomendado.subdimension || 'Sin responsable',
        accion_sugerida: pendingIndicador?.id === recomendado.id ? 'ingresar_avance' : 'editar_avance',
      } : null,
    };
  },

  async getAuditoriaEventos({ filtros = {} } = {}) {
    const rows = loadStore().auditoria.filter((item) => {
      if (filtros.user_email && !String(item.user_email || '').toLowerCase().includes(String(filtros.user_email).toLowerCase())) return false;
      if (filtros.modulo && item.modulo !== filtros.modulo) return false;
      if (filtros.accion && item.accion !== filtros.accion) return false;
      return true;
    });
    return clone(rows.slice(0, filtros.limit || 200));
  },

  async getAcciones({ filtros = {} } = {}) {
    const items = filterAcciones(loadStore(), filtros);
    return {
      items: clone(items),
      resumen: {
        total: items.length,
        planificadas: items.filter((item) => item.estado === 'planificada').length,
        en_progreso: items.filter((item) => item.estado === 'en_progreso').length,
        reportadas: items.filter((item) => item.estado === 'reportada').length,
        completadas: items.filter((item) => item.estado === 'completada').length,
      },
    };
  },

  async getAccion({ id }) {
    const store = loadStore();
    const raw = store.acciones.find((item) => item.id === id && !item.deleted);
    if (!raw) return null;
    const summary = buildAccionSummary(store, raw);
    return clone({
      ...summary,
      timeline: buildTimeline(raw),
      comentarios: raw.comentarios || [],
      medios: raw.medios || [],
    });
  },

  async createAccion({ data }) {
    return withStore((store) => {
      const indicador = getIndicadorById(store, data?.indicador_id);
      if (!indicador) throw new Error('Indicador no encontrado');
      const created = {
        id: createId('accion'),
        indicador_id: data.indicador_id,
        nombre: String(data?.nombre || '').trim(),
        descripcion: String(data?.descripcion || '').trim(),
        responsable: String(data?.responsable || indicador.equipo_trabajo || indicador.subdimension || '').trim(),
        fecha_inicio: data?.fecha_inicio || '',
        fecha_compromiso: data?.fecha_compromiso || '',
        estado: data?.estado || 'planificada',
        avance: normalizeNumber(data?.avance),
        created_at: nowIso(),
        updated_at: nowIso(),
        created_by: 'public-demo-user',
        deleted: false,
        medios_requeridos: Array.isArray(data?.medios_requeridos) ? data.medios_requeridos : [],
        medios_requeridos_detalle: Array.isArray(data?.medios_requeridos_detalle) ? data.medios_requeridos_detalle.map((item) => ({ tipo: item.tipo, cantidad: normalizeNumber(item.cantidad) || 1 })) : [],
        comentarios: [],
        medios: [],
      };
      store.acciones.push(created);
      addAudit(store, { modulo: 'acciones', accion: 'create', entidad: 'accion', entidad_id: created.id, detalle: `Se creó ${created.nombre}.` });
      return clone(buildAccionSummary(store, created));
    });
  },

  async updateAccion({ id, data }) {
    return withStore((store) => {
      const item = store.acciones.find((entry) => entry.id === id && !entry.deleted);
      if (!item) throw new Error('Acción no encontrada');
      Object.assign(item, data || {}, { updated_at: nowIso() });
      addAudit(store, { modulo: 'acciones', accion: 'update', entidad: 'accion', entidad_id: item.id, detalle: `Se actualizó ${item.nombre}.` });
      return clone(buildAccionSummary(store, item));
    });
  },

  async updateEstadoAccion({ id, data }) {
    return this.updateAccion({ id, data });
  },

  async deleteAccion({ id }) {
    return withStore((store) => {
      const item = store.acciones.find((entry) => entry.id === id && !entry.deleted);
      if (!item) throw new Error('Acción no encontrada');
      item.deleted = true;
      item.updated_at = nowIso();
      addAudit(store, { modulo: 'acciones', accion: 'soft_delete', entidad: 'accion', entidad_id: item.id, detalle: `Se eliminó ${item.nombre}.` });
      return { ok: true };
    });
  },

  async addComentarioAccion({ id, data }) {
    return withStore((store) => {
      const item = store.acciones.find((entry) => entry.id === id && !entry.deleted);
      if (!item) throw new Error('Acción no encontrada');
      const created = { id: createId('com'), texto: String(data?.texto || '').trim(), fecha: nowIso(), usuario: 'Invitado Demo', created_by: 'public-demo-user', tipo: 'comentario' };
      item.comentarios.unshift(created);
      item.updated_at = nowIso();
      addAudit(store, { modulo: 'acciones', accion: 'update', entidad: 'comentario', entidad_id: created.id, detalle: `Comentario agregado en ${item.nombre}.` });
      return clone(created);
    });
  },

  async updateComentarioAccion({ id, data }) {
    return withStore((store) => {
      const accion = store.acciones.find((entry) => entry.comentarios?.some((comment) => comment.id === id));
      const comentario = accion?.comentarios?.find((entry) => entry.id === id);
      if (!accion || !comentario) throw new Error('Comentario no encontrado');
      comentario.texto = String(data?.texto || '').trim();
      comentario.fecha = nowIso();
      accion.updated_at = nowIso();
      addAudit(store, { modulo: 'acciones', accion: 'update', entidad: 'comentario', entidad_id: comentario.id, detalle: `Comentario actualizado en ${accion.nombre}.` });
      return clone(comentario);
    });
  },

  async deleteComentarioAccion({ id }) {
    return withStore((store) => {
      const accion = store.acciones.find((entry) => entry.comentarios?.some((comment) => comment.id === id));
      if (!accion) throw new Error('Comentario no encontrado');
      accion.comentarios = accion.comentarios.filter((comment) => comment.id !== id);
      accion.updated_at = nowIso();
      addAudit(store, { modulo: 'acciones', accion: 'delete', entidad: 'comentario', entidad_id: id, detalle: `Comentario eliminado en ${accion.nombre}.` });
      return { ok: true };
    });
  },

  async uploadMedioVerificacion({ id, data }) {
    return withStore((store) => {
      const accion = store.acciones.find((entry) => entry.id === id && !entry.deleted);
      if (!accion) throw new Error('Acción no encontrada');
      const created = {
        id: createId('med'),
        tipo: data?.tipo || 'otro',
        nombre_archivo: data?.nombre_archivo || data?.nombre_original || 'archivo',
        nombre_original: data?.nombre_original || data?.nombre_archivo || 'archivo',
        descripcion: String(data?.descripcion || '').trim(),
        mime_type: data?.mime_type || 'application/octet-stream',
        size_bytes: normalizeNumber(data?.size_bytes),
        url: `mock://${createId('file')}`,
        created_at: nowIso(),
        cantidad_lograda: normalizeNumber(data?.cantidad_lograda) || 1,
        cantidad_esperada: normalizeNumber(data?.cantidad_esperada) || 1,
      };
      accion.medios.unshift(created);
      accion.updated_at = nowIso();
      addAudit(store, { modulo: 'acciones', accion: 'create', entidad: 'medio', entidad_id: created.id, detalle: `Medio cargado en ${accion.nombre}.` });
      return clone(created);
    });
  },

  async deleteMedioVerificacion({ id, data }) {
    return withStore((store) => {
      const accion = store.acciones.find((entry) => entry.id === id && !entry.deleted);
      if (!accion) throw new Error('Acción no encontrada');
      accion.medios = (accion.medios || []).filter((medio) => medio.id !== data?.medio_id);
      accion.updated_at = nowIso();
      addAudit(store, { modulo: 'acciones', accion: 'delete', entidad: 'medio', entidad_id: data?.medio_id, detalle: `Medio eliminado en ${accion.nombre}.` });
      return { ok: true };
    });
  },

  async updateMedioVerificacion({ id, data }) {
    return withStore((store) => {
      const accion = store.acciones.find((entry) => entry.id === id && !entry.deleted);
      const medio = accion?.medios?.find((entry) => entry.id === data?.medio_id);
      if (!accion || !medio) throw new Error('Medio no encontrado');
      Object.assign(medio, data || {});
      accion.updated_at = nowIso();
      addAudit(store, { modulo: 'acciones', accion: 'update', entidad: 'medio', entidad_id: medio.id, detalle: `Medio actualizado en ${accion.nombre}.` });
      return clone(medio);
    });
  },

  async getMediosAccion({ filtros = {} } = {}) {
    const accion = loadStore().acciones.find((entry) => entry.id === filtros.accion_id && !entry.deleted);
    return clone(accion?.medios || []);
  },

  async getUsuarios() {
    return clone(loadStore().users);
  },

  async createUsuario({ data }) {
    return withStore((store) => {
      const created = { id: createId('usr'), activo: true, creado_en: nowIso(), ...data };
      store.users.push(created);
      addAudit(store, { modulo: 'usuarios', accion: 'create', entidad: 'usuario', entidad_id: created.id, detalle: `Se creó ${created.email}.` });
      return clone(created);
    });
  },

  async updateUsuario({ id, data }) {
    return withStore((store) => {
      const item = getUserById(store, id);
      if (!item) throw new Error('Usuario no encontrado');
      Object.assign(item, data || {});
      addAudit(store, { modulo: 'usuarios', accion: 'update', entidad: 'usuario', entidad_id: item.id, detalle: `Se actualizó ${item.email}.` });
      return { ok: true };
    });
  },
};
