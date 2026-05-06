function doPost(e) {
  try {
    const token = e.parameter.token;
    if (!token) return jsonError('Token requerido', 401);

    const user = Auth.validarToken(token);
    if (!user) return jsonError('No autorizado', 401);

    const body = JSON.parse(e.postData.contents);
    const { action, data, id, filtros } = body;

    const router = {
      // Sesión
      'validarSesion': () => ({
        id:        user.id,
        email:     user.email,
        nombre:    user.nombre,
        rol:       user.rol,
        area:      user.area,
      }),

      // Usuarios
      'getUsuarios':   () => Usuarios.getAll(user),
      'updateUsuario': () => Usuarios.update(id, data, user),

      // Instrumentos
      'getInstrumentos':   () => Instrumentos.getAll(user),
      'createInstrumento': () => Instrumentos.create(data, user),
      'updateInstrumento': () => Instrumentos.update(id, data, user),

      // Indicadores
      'getIndicador':   () => Indicadores.getById(id, user),
      'getIndicadores':  () => Indicadores.getByInstrumento(filtros.instrumento_id, user),
      'createIndicador': () => Indicadores.create(data, user),
      'updateIndicador': () => Indicadores.update(id, data, user),
      'deleteIndicador': () => Indicadores.softDelete(id, user),

      // Cortes
      'getCortes':   () => Cortes.getByInstrumento(filtros.instrumento_id, user),
      'getAllCortes': () => Cortes.getAll(user),
      'createCorte': () => Cortes.create(data, user),
      'cerrarCorte': () => Cortes.cerrar(id, user),

      // Avances
      'getAvancesPorCorte': () => Avances.getByCorte(filtros.corte_id, user),
      'upsertAvance':       () => Avances.upsert(data, user),
      'aprobarAvance':      () => Avances.aprobar(id, user),
      'observarAvance':     () => Avances.observar(id, data.comentario, user),

      // Dashboard
      'getDashboardResumen':     () => Dashboard.getResumenGeneral(user),
      'refreshDashboardResumen': () => Dashboard.refreshResumenGeneral(user),
      'getDashboardInstrumento': () => Dashboard.getResumenInstrumento(filtros.instrumento_id, user),
      'getGanttData':            () => Dashboard.getGanttData(user),
      'getMetricasCorte':        () => Dashboard.getMetricasCorte(filtros.corte_id, user),

      // Acciones
      'getAcciones':             () => Acciones.getAll(filtros || {}, user),
      'getAccion':               () => Acciones.getById(id, user),
      'createAccion':            () => Acciones.create(data, user),
      'updateAccion':            () => Acciones.update(id, data, user),
      'updateEstadoAccion':      () => Acciones.updateEstado(id, data, user),
      'addComentarioAccion':     () => Acciones.addComentario(id, data, user),
      'updateComentarioAccion':  () => Acciones.updateComentario(id, data, user),
      'deleteComentarioAccion':  () => Acciones.deleteComentario(id, user),
      'uploadMedioVerificacion': () => Acciones.uploadMedio(id, data, user),
      'getMediosAccion':         () => Acciones.getMedios(id || filtros.accion_id, user),

      // Emails (admin)
      'enviarReporteManual': () => Emails.enviarReporteCorte(filtros.corte_id),
    };

    if (!router[action]) return jsonError(`Acción desconocida: ${action}`, 400);

    const result = router[action]();
    return jsonOk(result);

  } catch (err) {
    console.error(err);
    return jsonError(err.message, 500);
  }
}

function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg, code) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg, code }))
    .setMimeType(ContentService.MimeType.JSON);
}

function autorizarServicios() {
  SpreadsheetApp.openById(Config.SHEET_ID).getId();
  var folder = Drive.getOrCreateRootFolder_();
  var authProbeFile = null;

  try {
    authProbeFile = folder.createFile(
      'tmp_auth_' + new Date().getTime() + '.txt',
      'Autorizacion temporal de Drive para documentos.'
    );
  } finally {
    if (authProbeFile) {
      try {
        authProbeFile.setTrashed(true);
      } catch (trashError) {
        // No bloquear la autorizacion si no se puede enviar a la papelera.
      }
    }
  }
}