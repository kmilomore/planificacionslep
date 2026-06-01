/**
 * SETUP INICIAL — Ejecutar UNA VEZ desde el editor de Apps Script.
 * Crea todas las hojas con sus cabeceras y agrega un usuario admin inicial.
 *
 * Pasos:
 *   1. Abrir Apps Script → Ejecutar → "setupInicial"
 *   2. Autorizar permisos cuando se solicite
 *   3. Agregar usuarios adicionales directamente en la hoja 'usuarios'
 */
function setupInicial() {
  const ss = SpreadsheetApp.openById(Config.SHEET_ID);

  const hojas = {
    usuarios: [
      'id', 'email', 'nombre', 'rol', 'area', 'activo', 'creado_en',
    ],
    instrumentos: [
      'id', 'codigo', 'nombre', 'descripcion', 'ciclo', 'tipo_seguimiento',
      'responsable_id', 'color_hex', 'activo', 'creado_en',
    ],
    cortes: [
      'id', 'instrumento_id', 'codigo_corte', 'nombre_corte',
      'fecha_inicio', 'fecha_limite', 'dias_recordatorio', 'estado', 'año',
    ],
    indicadores: _getIndicadoresHeaders(),
    avances: [
      'id', 'indicador_id', 'corte_id', 'valor_reportado',
      'porcentaje_cumplimiento', 'estado_semaforo', 'comentario',
      'evidencia_url', 'estado_revision', 'ingresado_por', 'ingresado_en',
      'modificado_en', 'aprobado_por', 'aprobado_en',
    ],
    acciones: _getAccionesHeaders(),
    medios_verificacion: _getMediosVerificacionHeaders(),
    comentarios_accion: _getComentariosAccionHeaders(),
    alertas_log: [
      'id', 'tipo_alerta', 'destinatario_email', 'instrumento_id',
      'corte_id', 'asunto', 'enviado_en', 'exito', 'error_msg',
    ],
  };

  // Crear hojas y cabeceras
  Object.entries(hojas).forEach(([nombre, headers]) => {
    let sheet = ss.getSheetByName(nombre);
    if (!sheet) {
      sheet = ss.insertSheet(nombre);
      Logger.log(`✅ Hoja creada: ${nombre}`);
    } else {
      Logger.log(`⚠️  Hoja ya existe: ${nombre} (no se modificó)`);
    }
    // Solo escribir cabeceras si la hoja está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#25306B')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold');
    }
  });

  // Agregar instrumentos predefinidos
  _seedInstrumentos(ss);

  // Agregar cortes 2026
  _seedCortes(ss);

  Logger.log('🎉 Setup completado. Agrega usuarios en la hoja "usuarios".');
}

function setupAcciones() {
  ensureAccionesSchema();
  Logger.log('✅ Setup de Acciones completado.');
}

function ensureAccionesSchema() {
  const ss = SpreadsheetApp.openById(Config.SHEET_ID);
  ensureSheetHeaders_(ss, Config.SHEETS.ACCIONES, _getAccionesHeaders());
  ensureSheetHeaders_(ss, Config.SHEETS.MEDIOS_VERIFICACION, _getMediosVerificacionHeaders());
  ensureSheetHeaders_(ss, Config.SHEETS.COMENTARIOS_ACCION, _getComentariosAccionHeaders());

  Utils.invalidateSheetCache(Config.SHEETS.ACCIONES);
  Utils.invalidateSheetCache(Config.SHEETS.MEDIOS_VERIFICACION);
  Utils.invalidateSheetCache(Config.SHEETS.COMENTARIOS_ACCION);
}

function _getIndicadoresHeaders() {
  return [
    'id', 'instrumento_id', 'servicio', 'numero_indicador', 'codigo_indicador',
    'equipo_trabajo', 'estado_indicador', 'nombre', 'descripcion',
    'justificacion_indicador', 'formula', 'dimension', 'subdimension',
    'ambito_control', 'expresion_formula', 'tipo_meta', 'meta_valor',
    'efectivo_2026', 'unidad', 'numerador_2026', 'denominador_2026',
    'fecha_cumplimiento_2026', 'peso', 'fuente_verificacion',
    'medios_verificacion_2026', 'nota_tecnica_2026', 'responsable_id', 'activo',
  ];
}

function _getAccionesHeaders() {
  return [
    'id', 'indicador_id', 'nombre', 'descripcion', 'responsable',
    'fecha_inicio', 'fecha_compromiso', 'estado', 'avance', 'medios_requeridos', 'activo',
    'created_at', 'updated_at', 'created_by',
  ];
}

function _getMediosVerificacionHeaders() {
  return [
    'id', 'accion_id', 'tipo', 'nombre_archivo', 'url_drive', 'file_id',
    'usuario', 'fecha_subida', 'nombre_original', 'descripcion',
  ];
}

function _getComentariosAccionHeaders() {
  return [
    'id', 'accion_id', 'texto', 'usuario', 'fecha', 'created_by', 'tipo',
  ];
}

function ensureSheetHeaders_(ss, sheetName, expectedHeaders) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    Logger.log(`✅ Hoja creada: ${sheetName}`);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, expectedHeaders.length).setValues([expectedHeaders]);
    sheet.getRange(1, 1, 1, expectedHeaders.length)
      .setBackground('#25306B')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold');
    return;
  }

  const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const missingHeaders = expectedHeaders.filter((header) => !currentHeaders.includes(header));
  if (!missingHeaders.length) return;

  const startColumn = currentHeaders.length + 1;
  sheet.getRange(1, startColumn, 1, missingHeaders.length).setValues([missingHeaders]);
  sheet.getRange(1, startColumn, 1, missingHeaders.length)
    .setBackground('#25306B')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  Logger.log(`✅ Cabeceras agregadas en ${sheetName}: ${missingHeaders.join(', ')}`);
}

function _seedInstrumentos(ss) {
  const sheet = ss.getSheetByName('instrumentos');
  if (sheet.getLastRow() > 1) {
    Logger.log('⚠️  Instrumentos ya existen, omitiendo seed.');
    return;
  }

  const ahora = new Date().toISOString();
  const instrumentos = [
    { codigo: 'CDC', nombre: 'Convenio de Desempeño Colectivo', tipo_seguimiento: 'semestral',      color_hex: '#25306B' },
    { codigo: 'PAL', nombre: 'Plan Anual Local',                tipo_seguimiento: 'trimestral',     color_hex: '#006BB9' },
    { codigo: 'PEL', nombre: 'Plan Estratégico Local',          tipo_seguimiento: 'anual_con_hitos', color_hex: '#2C3D9E' },
    { codigo: 'PMG', nombre: 'Plan de Mejoramiento de la Gestión', tipo_seguimiento: 'trimestral',  color_hex: '#FF1D3D' },
  ];

  instrumentos.forEach(inst => {
    Utils.appendRow('instrumentos', {
      id:              Utils.uuid(),
      codigo:          inst.codigo,
      nombre:          inst.nombre,
      descripcion:     '',
      ciclo:           'anual',
      tipo_seguimiento: inst.tipo_seguimiento,
      responsable_id:  '',
      color_hex:       inst.color_hex,
      activo:          true,
      creado_en:       ahora,
    });
  });

  Logger.log('✅ Instrumentos seed completado.');
}

function _seedCortes(ss) {
  const sheet = ss.getSheetByName('cortes');
  if (sheet.getLastRow() > 1) {
    Logger.log('⚠️  Cortes ya existen, omitiendo seed.');
    return;
  }

  // Obtener IDs de instrumentos
  const instSheet = ss.getSheetByName('instrumentos');
  const insts     = Utils.sheetToObjects(instSheet);
  const byCode    = {};
  insts.forEach(i => { byCode[i.codigo] = i.id; });

  const cortes2026 = [
    // CDC — semestral
    { instrumento_id: byCode['CDC'], codigo_corte: 'CDC-S1-2026', nombre_corte: 'Semestre 1 2026', fecha_inicio: '2026-01-01', fecha_limite: '2026-06-30', año: 2026 },
    { instrumento_id: byCode['CDC'], codigo_corte: 'CDC-S2-2026', nombre_corte: 'Semestre 2 2026', fecha_inicio: '2026-07-01', fecha_limite: '2026-12-15', año: 2026 },
    // PAL — trimestral
    { instrumento_id: byCode['PAL'], codigo_corte: 'PAL-T1-2026', nombre_corte: 'Trimestre 1 2026', fecha_inicio: '2026-01-01', fecha_limite: '2026-03-31', año: 2026 },
    { instrumento_id: byCode['PAL'], codigo_corte: 'PAL-T2-2026', nombre_corte: 'Trimestre 2 2026', fecha_inicio: '2026-04-01', fecha_limite: '2026-06-30', año: 2026 },
    { instrumento_id: byCode['PAL'], codigo_corte: 'PAL-T3-2026', nombre_corte: 'Trimestre 3 2026', fecha_inicio: '2026-07-01', fecha_limite: '2026-09-30', año: 2026 },
    { instrumento_id: byCode['PAL'], codigo_corte: 'PAL-T4-2026', nombre_corte: 'Trimestre 4 2026', fecha_inicio: '2026-10-01', fecha_limite: '2026-12-15', año: 2026 },
    // PEL — anual
    { instrumento_id: byCode['PEL'], codigo_corte: 'PEL-A1-2026', nombre_corte: 'Corte Anual 2026', fecha_inicio: '2026-01-01', fecha_limite: '2026-12-15', año: 2026 },
    // PMG — trimestral
    { instrumento_id: byCode['PMG'], codigo_corte: 'PMG-T1-2026', nombre_corte: 'Trimestre 1 2026', fecha_inicio: '2026-01-01', fecha_limite: '2026-03-31', año: 2026 },
    { instrumento_id: byCode['PMG'], codigo_corte: 'PMG-T2-2026', nombre_corte: 'Trimestre 2 2026', fecha_inicio: '2026-04-01', fecha_limite: '2026-06-30', año: 2026 },
    { instrumento_id: byCode['PMG'], codigo_corte: 'PMG-T3-2026', nombre_corte: 'Trimestre 3 2026', fecha_inicio: '2026-07-01', fecha_limite: '2026-09-30', año: 2026 },
    { instrumento_id: byCode['PMG'], codigo_corte: 'PMG-T4-2026', nombre_corte: 'Trimestre 4 2026', fecha_inicio: '2026-10-01', fecha_limite: '2026-12-15', año: 2026 },
  ];

  cortes2026.forEach(c => {
    if (!c.instrumento_id) return; // instrumento no encontrado
    Utils.appendRow('cortes', {
      id:               Utils.uuid(),
      instrumento_id:   c.instrumento_id,
      codigo_corte:     c.codigo_corte,
      nombre_corte:     c.nombre_corte,
      fecha_inicio:     c.fecha_inicio,
      fecha_limite:     c.fecha_limite,
      dias_recordatorio: Config.DIAS_RECORDATORIO_DEFAULT,
      estado:           'pendiente',
      año:              c.año,
    });
  });

  Logger.log('✅ Cortes 2026 seed completado.');
}

function migracionCDC() {
  const ss = SpreadsheetApp.openById(Config.SHEET_ID);

  const origen = ss.getSheetByName(Config.CDC_SOURCE_SHEET);
  if (!origen) {
    Logger.log(`❌ No se encontró la hoja "${Config.CDC_SOURCE_SHEET}". Verifica el nombre exacto.`);
    return;
  }

  const datos = Utils.sheetToObjects(origen);
  if (!datos.length) {
    Logger.log('❌ La hoja origen está vacía o solo tiene cabecera.');
    return;
  }

  const requiredHeaders = [
    'Servicio',
    'N° de indicador',
    'Equipo de trabajo',
    'Estado de indicador',
    'Justificación de indicador',
    'Nombre del indicador',
    'Fórmula de cálculo',
    'Dimensión',
    'Ámbito de control',
    'Expresión de fórmula',
    'Unidad de Medida',
    'Numerador 2026',
    'Denominador 2026',
    'Efectivo 2026',
    'Fecha de cumplimiento 2026',
    'Ponderación 2026',
    'Medios de Verificación 2026',
    'Nota técnica 2026',
  ];
  const missingHeaders = requiredHeaders.filter(header => !(header in datos[0]));
  if (missingHeaders.length) {
    Logger.log(`❌ Faltan columnas requeridas en ${Config.CDC_SOURCE_SHEET}: ${missingHeaders.join(', ')}`);
    return;
  }

  const instrumentoCDC = _buildCDCInstrumento(datos[0]);

  _resetSheetWithHeaders(ss, Config.SHEETS.INSTRUMENTOS, [
    'id', 'codigo', 'nombre', 'descripcion', 'ciclo', 'tipo_seguimiento',
    'responsable_id', 'color_hex', 'activo', 'creado_en',
  ]);
  _resetSheetWithHeaders(ss, Config.SHEETS.CORTES, [
    'id', 'instrumento_id', 'codigo_corte', 'nombre_corte',
    'fecha_inicio', 'fecha_limite', 'dias_recordatorio', 'estado', 'año',
  ]);
  _resetSheetWithHeaders(ss, Config.SHEETS.INDICADORES, _getIndicadoresHeaders());
  _resetSheetWithHeaders(ss, Config.SHEETS.AVANCES, [
    'id', 'indicador_id', 'corte_id', 'valor_reportado',
    'porcentaje_cumplimiento', 'estado_semaforo', 'comentario',
    'evidencia_url', 'estado_revision', 'ingresado_por', 'ingresado_en',
    'modificado_en', 'aprobado_por', 'aprobado_en',
  ]);
  _resetSheetWithHeaders(ss, Config.SHEETS.ACCIONES, _getAccionesHeaders());
  _resetSheetWithHeaders(ss, Config.SHEETS.MEDIOS_VERIFICACION, _getMediosVerificacionHeaders());

  Utils.appendRow(Config.SHEETS.INSTRUMENTOS, instrumentoCDC);
  _seedCortes(ss);

  let migrados = 0;
  let errores = 0;

  datos.forEach(row => {
    try {
      const indicador = _buildCDCIndicador(row, instrumentoCDC.id);
      if (!indicador) return;
      Utils.appendRow(Config.SHEETS.INDICADORES, indicador);
      migrados++;
    } catch (e) {
      Logger.log(`❌ Error en indicador ${row['N° de indicador'] || 'sin número'}: ${e.message}`);
      errores++;
    }
  });

  [
    Config.SHEETS.INSTRUMENTOS,
    Config.SHEETS.CORTES,
    Config.SHEETS.INDICADORES,
    Config.SHEETS.AVANCES,
    Config.SHEETS.ACCIONES,
    Config.SHEETS.MEDIOS_VERIFICACION,
  ].forEach(sheetName => Utils.invalidateSheetCache(sheetName));
  Utils.invalidateDashboardCaches({ instrumentoId: instrumentoCDC.id });

  Logger.log(
    `✅ Migración CDC completada desde ${Config.CDC_SOURCE_SHEET}: ${migrados} indicadores, ${errores} errores. ` +
    'Se reiniciaron instrumentos, cortes, indicadores y avances para mantener consistencia.'
  );
}

function _buildCDCInstrumento(firstRow) {
  const servicio = _normalizeText(firstRow['Servicio']) || 'SLEP Colchagua';
  return {
    id: Utils.uuid(),
    codigo: 'CDC',
    nombre: 'Convenio de Desempeño Colectivo',
    descripcion: `Base oficial ${servicio}, sincronizada desde la hoja ${Config.CDC_SOURCE_SHEET}.`,
    ciclo: 'anual',
    tipo_seguimiento: 'semestral',
    responsable_id: '',
    color_hex: '#25306B',
    activo: true,
    creado_en: Utils.ahora(),
  };
}

function _buildCDCIndicador(row, instrumentoId) {
  const numero = _normalizeText(row['N° de indicador']);
  if (!numero) return null;

  const numeroNormalizado = String(numero).replace(/[^0-9]/g, '');
  if (!numeroNormalizado) return null;

  const efectivoRaw = _normalizeText(row['Efectivo 2026']);
  const unidad = _normalizeText(row['Unidad de Medida']);
  const ponderacionRaw = _normalizeText(row['Ponderación 2026']);
  const justificacion = _normalizeText(row['Justificación de indicador']);
  const medios = _normalizeText(row['Medios de Verificación 2026']);
  const equipo = _normalizeText(row['Equipo de trabajo']);

  return {
    id: Utils.uuid(),
    instrumento_id: instrumentoId,
    servicio: _normalizeText(row['Servicio']),
    numero_indicador: numeroNormalizado,
    codigo_indicador: `CDC-${numeroNormalizado.padStart(2, '0')}`,
    equipo_trabajo: equipo,
    estado_indicador: _normalizeText(row['Estado de indicador']),
    nombre: _normalizeText(row['Nombre del indicador']),
    descripcion: justificacion,
    justificacion_indicador: justificacion,
    formula: _normalizeText(row['Fórmula de cálculo']),
    dimension: _normalizeText(row['Dimensión']),
    subdimension: equipo,
    ambito_control: _normalizeText(row['Ámbito de control']),
    expresion_formula: _normalizeText(row['Expresión de fórmula']),
    tipo_meta: _resolveTipoMeta(unidad, efectivoRaw),
    meta_valor: _normalizeNumericValue(efectivoRaw),
    efectivo_2026: efectivoRaw,
    unidad: unidad,
    numerador_2026: _normalizeText(row['Numerador 2026']),
    denominador_2026: _normalizeText(row['Denominador 2026']),
    fecha_cumplimiento_2026: _normalizeText(row['Fecha de cumplimiento 2026']),
    peso: _normalizeNumericValue(ponderacionRaw),
    fuente_verificacion: medios,
    medios_verificacion_2026: medios,
    nota_tecnica_2026: _normalizeText(row['Nota técnica 2026']),
    responsable_id: '',
    activo: true,
  };
}

function _resolveTipoMeta(unidad, efectivo) {
  const source = `${unidad || ''} ${efectivo || ''}`.toLowerCase();
  if (source.includes('%') || source.includes('porcentaje')) return 'porcentaje';
  if (source.includes('si') || source.includes('sí') || source.includes('no')) return 'booleano';
  if (_normalizeNumericValue(efectivo)) return 'numero';
  return 'texto';
}

function _normalizeNumericValue(value) {
  const text = _normalizeText(value);
  if (!text) return '';

  const sanitized = text
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/%/g, '')
    .replace(/[^0-9.-]/g, '');

  if (!sanitized || sanitized === '-' || sanitized === '.') return '';
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? String(parsed) : '';
}

function _normalizeText(value) {
  return String(value || '')
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function _resetSheetWithHeaders(ss, sheetName, headers) {
  const sheet = Utils.getSheet(sheetName, ss);
  sheet.clearContents();

  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#25306B')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  if (sheet.getMaxRows() > 1) {
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, Math.max(sheet.getMaxColumns(), headers.length)).clearContent();
  }
}

/**
 * Agrega un usuario a la lista blanca. Ejecutar desde Apps Script o llamar
 * directamente en la hoja 'usuarios'.
 */
function agregarUsuario(email, nombre, rol, area) {
  Utils.appendRow(Config.SHEETS.USUARIOS, {
    id:         Utils.uuid(),
    email:      email,
    nombre:     nombre,
    rol:        rol,    // admin | subdirector | director_ejecutivo
    area:       area || '',
    activo:     true,
    creado_en:  new Date().toISOString(),
  });
  Logger.log(`✅ Usuario agregado: ${email} (${rol})`);
}
