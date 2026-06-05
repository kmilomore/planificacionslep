function doPost(e) {
  try {
    const token = e.parameter.token;
    if (!token) return jsonError('Token requerido', 401);

    const user = Auth.validarToken(token);
    if (!user) return jsonError('No autorizado', 401);

    const body = JSON.parse(e.postData.contents);
    const { action, data, id, filtros } = body;

    const requestMeta = {
      ip: (e && e.parameter && e.parameter.ip) || '',
      userAgent: (e && e.parameter && e.parameter.userAgent) || '',
    };

    const router = {
      // Sesión
      'validarSesion': () => {
        Auditoria.logEvent(
          {
            modulo:  'auth',
            entidad: 'sesion',
            entidad_id: user.id,
            accion:  'login',
            detalle: `Validación de sesión para ${user.email}`,
          },
          user,
          requestMeta
        );

        return {
          id:        user.id,
          email:     user.email,
          nombre:    user.nombre,
          rol:       user.rol,
          area:      user.area,
        };
      },

      // Usuarios
      'getUsuarios':   () => Usuarios.getAll(user),
      'createUsuario': () => Usuarios.create(data, user, requestMeta),
      'updateUsuario': () => Usuarios.update(id, data, user, requestMeta),

      // Instrumentos
      'getInstrumentos':   () => Instrumentos.getAll(user),
      'createInstrumento': () => Instrumentos.create(data, user, requestMeta),
      'updateInstrumento': () => Instrumentos.update(id, data, user, requestMeta),

      // Indicadores
      'getIndicador':   () => Indicadores.getById(id, user),
      'getIndicadores':  () => Indicadores.getByInstrumento(filtros.instrumento_id, user),
      'createIndicador': () => Indicadores.create(data, user, requestMeta),
      'updateIndicador': () => Indicadores.update(id, data, user, requestMeta),
      'deleteIndicador': () => Indicadores.softDelete(id, user, requestMeta),

      // Cortes
      'getCortes':   () => Cortes.getByInstrumento(filtros.instrumento_id, user),
      'getAllCortes': () => Cortes.getAll(user),
      'createCorte': () => Cortes.create(data, user, requestMeta),
      'cerrarCorte': () => Cortes.cerrar(id, data, user, requestMeta),

      // Avances
      'getAvancesPorCorte': () => Avances.getByCorte(filtros.corte_id, user),
      'upsertAvance':       () => Avances.upsert(data, user, requestMeta),
      'aprobarAvance':      () => Avances.aprobar(id, user, requestMeta),
      'observarAvance':     () => Avances.observar(id, data.comentario, user, requestMeta),

      // Dashboard
      'getDashboardResumen':     () => Dashboard.getResumenGeneral(user),
      'refreshDashboardResumen': () => Dashboard.refreshResumenGeneral(user),
      'getDashboardInstrumento': () => Dashboard.getResumenInstrumento(filtros.instrumento_id, user),
      'getGanttData':            () => Dashboard.getGanttData(user),
      'getMetricasCorte':        () => Dashboard.getMetricasCorte(filtros.corte_id, user),

      // Acciones
      'getAcciones':             () => Acciones.getAll(filtros || {}, user),
      'getAccion':               () => Acciones.getById(id, user),
      'createAccion':            () => Acciones.create(data, user, requestMeta),
      'updateAccion':            () => Acciones.update(id, data, user, requestMeta),
      'deleteAccion':            () => Acciones.softDelete(id, user, requestMeta),
      'updateEstadoAccion':      () => Acciones.updateEstado(id, data, user, requestMeta),
      'addComentarioAccion':     () => Acciones.addComentario(id, data, user, requestMeta),
      'updateComentarioAccion':  () => Acciones.updateComentario(id, data, user, requestMeta),
      'deleteComentarioAccion':  () => Acciones.deleteComentario(id, user, requestMeta),
      'uploadMedioVerificacion': () => Acciones.uploadMedio(id, data, user, requestMeta),
      'deleteMedioVerificacion': () => Acciones.deleteMedio(id, data, user, requestMeta),
      'updateMedioVerificacion': () => Acciones.updateMedio(id, data, user, requestMeta),
      'getMediosAccion':         () => Acciones.getMedios(id || filtros.accion_id, user),

      // Emails (admin)
      'enviarReporteManual': () => Emails.enviarReporteCorte(filtros.corte_id),

      // Auditoría (admin)
      'getAuditoriaEventos': () => Auditoria.getEvents(filtros || {}, user),
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