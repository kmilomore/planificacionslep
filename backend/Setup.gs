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
    indicadores: [
      'id', 'instrumento_id', 'dimension', 'subdimension', 'codigo_indicador',
      'nombre', 'descripcion', 'formula', 'tipo_meta', 'meta_valor', 'unidad',
      'peso', 'fuente_verificacion', 'responsable_id', 'activo',
    ],
    avances: [
      'id', 'indicador_id', 'corte_id', 'valor_reportado',
      'porcentaje_cumplimiento', 'estado_semaforo', 'comentario',
      'evidencia_url', 'estado_revision', 'ingresado_por', 'ingresado_en',
      'modificado_en', 'aprobado_por', 'aprobado_en',
    ],
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

/**
 * MIGRACIÓN CDC — Lee la hoja "Base (SLEP ANT)" del mismo Google Sheet
 * y migra todos sus indicadores a la hoja normalizada "indicadores".
 *
 * La hoja origen tiene estas columnas (en orden):
 *   A: N°  |  B: Objetivo  |  C: Tipo  |  D: Nombre  |  E: Categoría
 *   F: CR  |  G: Relación CADP  |  H: Fórmula  |  I: Unidad  |  J: Medios de Verificación  |  K: Notas
 *
 * Ejecutar UNA VEZ después de setupInicial().
 * Es idempotente: si el indicador ya existe (mismo codigo_indicador), lo omite.
 */
function migracionCDC() {
  const ss = SpreadsheetApp.openById(Config.SHEET_ID);

  // Hoja origen
  const origen = ss.getSheetByName('Base (SLEP ANT)');
  if (!origen) {
    Logger.log('❌ No se encontró la hoja "Base (SLEP ANT)". Verifica el nombre exacto.');
    return;
  }

  // Obtener ID del instrumento CDC
  const instSheet = ss.getSheetByName(Config.SHEETS.INSTRUMENTOS);
  const insts     = Utils.sheetToObjects(instSheet);
  const cdcInst   = insts.find(i => i.codigo === 'CDC');
  if (!cdcInst) {
    Logger.log('❌ Instrumento CDC no encontrado. Ejecuta setupInicial() primero.');
    return;
  }

  // Leer indicadores ya existentes para evitar duplicados
  const indSheet    = ss.getSheetByName(Config.SHEETS.INDICADORES);
  const existentes  = Utils.sheetToObjects(indSheet);
  const codigosSet  = new Set(existentes.map(i => i.codigo_indicador));

  // Leer hoja origen — fila 1 = cabecera, desde fila 2 en adelante = datos
  const datos = origen.getDataRange().getValues();
  if (datos.length < 2) {
    Logger.log('❌ La hoja origen está vacía o solo tiene cabecera.');
    return;
  }

  // Índices de columnas (0-based)
  // N° | Objetivo | Tipo | Nombre | Categoría | CR | Relación CADP | Fórmula | Unidad | Medios Verif | Notas
  const COL = { num: 0, objetivo: 1, tipo: 2, nombre: 3, categoria: 4, cr: 5, cadp: 6, formula: 7, unidad: 8, medios: 9, notas: 10 };

  let migrados  = 0;
  let omitidos  = 0;
  let errores   = 0;

  for (let i = 1; i < datos.length; i++) {
    const fila = datos[i];
    const num  = fila[COL.num];

    // Saltar filas sin número de indicador
    if (!num || isNaN(Number(num))) continue;

    const nPad   = String(Number(num)).padStart(2, '0');
    const codigo = `CDC-${nPad}`;

    // Saltar si ya existe
    if (codigosSet.has(codigo)) {
      omitidos++;
      continue;
    }

    const unidadRaw = String(fila[COL.unidad] || '').trim().toLowerCase();
    const tipo_meta = unidadRaw.includes('porcentaje') ? 'porcentaje'
                    : unidadRaw.includes('cantidad')   ? 'numero'
                    : unidadRaw.includes('número')     ? 'numero'
                    : 'porcentaje';

    // Descripción enriquecida: objetivo + tipo
    const tipo  = String(fila[COL.tipo] || '').trim();
    const obj   = String(fila[COL.objetivo] || '').trim();
    const desc  = tipo ? `[${tipo}] ${obj}` : obj;

    try {
      const indicador = {
        id:               Utils.uuid(),
        instrumento_id:   cdcInst.id,
        dimension:        String(fila[COL.categoria] || '').trim(),
        subdimension:     String(fila[COL.cr] || '').trim(),
        codigo_indicador: codigo,
        nombre:           String(fila[COL.nombre] || '').trim(),
        descripcion:      desc,
        formula:          String(fila[COL.formula] || '').trim(),
        tipo_meta:        tipo_meta,
        meta_valor:       '',
        unidad:           String(fila[COL.unidad] || '').trim(),
        peso:             '',
        fuente_verificacion: String(fila[COL.medios] || '').trim(),
        responsable_id:   '',
        activo:           true,
      };

      Utils.appendRow(Config.SHEETS.INDICADORES, indicador);
      codigosSet.add(codigo);
      migrados++;

    } catch (e) {
      Logger.log(`❌ Error en indicador N° ${num}: ${e.message}`);
      errores++;
    }
  }

  Logger.log(`✅ Migración CDC completada: ${migrados} migrados, ${omitidos} ya existían, ${errores} errores.`);
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
