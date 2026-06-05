const Acciones = {
  ESTADOS: {
    planificada: true,
    en_progreso: true,
    reportada: true,
    completada: true,
  },

  TIPOS_MEDIO: {
    lista_asistencia: true,
    acta: true,
    fotografia: true,
    informe: true,
    otro: true,
  },

  getAll(filtros, user) {
    const bundle = this.getBundle_(user);
    const normalized = filtros || {};
    const items = bundle.acciones
      .filter((accion) => this.canView_(accion, user))
      .filter((accion) => this.matchesFilters_(accion, normalized, bundle))
      .map((accion) => this.decorate_(accion, bundle));

    return {
      items,
      resumen: this.buildResumen_(items),
    };
  },

  getById(id, user) {
    if (!id) throw new Error('id requerido');

    const bundle = this.getBundle_(user);
    const accion = bundle.acciones.find((row) => row.id === id && this.isActive_(row));
    if (!accion) throw new Error('Acción no encontrada');
    if (!this.canView_(accion, user)) throw new Error('No tienes permiso para ver esta acción');

    const decorated = this.decorate_(accion, bundle);
    const medios = bundle.medios
      .filter((medio) => medio.accion_id === id)
      .sort((a, b) => new Date(b.fecha_subida || 0) - new Date(a.fecha_subida || 0));
    const comentarios = bundle.comentarios
      .filter((comentario) => comentario.accion_id === id)
      .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));

    return {
      ...decorated,
      medios,
      comentarios,
      timeline: this.buildTimeline_(decorated, medios, comentarios),
    };
  },

  create(data, user, requestMeta) {
    this.assertCanEdit_(user);
    const indicador = this.getIndicador_(data.indicador_id);
    this.assertIndicadorActivo_(indicador);
    const responsable = this.assertEquipoResponsableValido_(data?.responsable, indicador);
    this.validatePayload_({ ...data, responsable }, false, indicador);

    const now = Utils.ahora();
    const nueva = {
      id: Utils.uuid(),
      indicador_id: data.indicador_id,
      nombre: String(data.nombre || '').trim(),
      descripcion: String(data.descripcion || '').trim(),
      responsable,
      fecha_inicio: data.fecha_inicio || '',
      fecha_compromiso: data.fecha_compromiso,
      estado: data.estado || 'planificada',
      avance: this.normalizeAvance_(data.avance),
      medios_requeridos: this.serializeMediosRequeridos_(data.medios_requeridos),
      medios_requeridos_detalle: this.serializeMediosRequeridosDetalle_(data.medios_requeridos, data.medios_requeridos_detalle),
      activo: true,
      created_at: now,
      updated_at: now,
      created_by: user.id,
    };

    Utils.appendRow(Config.SHEETS.ACCIONES, nueva);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador.instrumento_id, includeIndicadores: true });
    const creada = this.getById(nueva.id, user);
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'accion',
        entidad_id: nueva.id,
        accion:  'create',
        detalle: `Creación de acción "${nueva.nombre}" para indicador ${indicador.codigo_indicador}`,
        valores_nuevos: creada,
      },
      user,
      requestMeta
    );
    return creada;
  },

  update(id, data, user, requestMeta) {
    if (!id) throw new Error('id requerido');

    const accion = this.getOwnedAccionForEdit_(id, user);
    const indicador = this.getIndicador_(accion.indicador_id);
    const nextData = { ...accion, ...data };

    if (Object.prototype.hasOwnProperty.call(nextData, 'responsable')) {
      nextData.responsable = this.assertEquipoResponsableValido_(nextData.responsable, indicador);
    }

    this.validatePayload_(nextData, true, indicador);

    const allowed = {
      nombre: true,
      descripcion: true,
      responsable: true,
      fecha_inicio: true,
      fecha_compromiso: true,
      estado: true,
      avance: true,
      medios_requeridos: true,
      medios_requeridos_detalle: true,
      activo: true,
    };
    const updates = Object.fromEntries(
      Object.entries(data)
        .filter(([key]) => allowed[key])
        .map(([key, value]) => {
          if (key === 'avance') return [key, this.normalizeAvance_(value)];
          if (key === 'medios_requeridos') {
            return [key, this.serializeMediosRequeridos_(value)];
          }
          if (key === 'medios_requeridos_detalle') {
            const nextMedios = Object.prototype.hasOwnProperty.call(data, 'medios_requeridos')
              ? data.medios_requeridos
              : accion.medios_requeridos;
            const nextDetalle = Object.prototype.hasOwnProperty.call(data, 'medios_requeridos_detalle')
              ? data.medios_requeridos_detalle
              : accion.medios_requeridos_detalle;
            return ['medios_requeridos_detalle', this.serializeMediosRequeridosDetalle_(nextMedios, nextDetalle)];
          }
          return [key, value];
        })
    );

    if (Object.prototype.hasOwnProperty.call(updates, 'responsable')) {
      updates.responsable = this.assertEquipoResponsableValido_(updates.responsable, indicador);
    }

    if (
      Object.prototype.hasOwnProperty.call(data, 'medios_requeridos')
      && !Object.prototype.hasOwnProperty.call(updates, 'medios_requeridos_detalle')
    ) {
      updates.medios_requeridos_detalle = this.serializeMediosRequeridosDetalle_(
        data.medios_requeridos,
        accion.medios_requeridos_detalle
      );
    }

    updates.updated_at = Utils.ahora();

    const anterior = { ...accion };
    Utils.updateRowById(Config.SHEETS.ACCIONES, id, updates);

    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    const actualizada = this.getById(id, user);
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'accion',
        entidad_id: id,
        accion:  'update',
        detalle: `Actualización de acción "${accion.nombre}"`,
        valores_anteriores: anterior,
        valores_nuevos: actualizada,
      },
      user,
      requestMeta
    );
    return actualizada;
  },

  softDelete(id, user, requestMeta) {
    if (!id) throw new Error('id requerido');
    const accion = this.getOwnedAccionForEdit_(id, user);
    const indicador = this.getIndicador_(accion.indicador_id);
    const deletedAt = Utils.ahora();

    const anterior = { ...accion };
    Utils.updateRowById(Config.SHEETS.ACCIONES, accion.id, {
      activo: false,
      updated_at: deletedAt,
    });

    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'accion',
        entidad_id: accion.id,
        accion:  'soft_delete',
        detalle: `Desactivación de acción "${accion.nombre}"`,
        valores_anteriores: anterior,
        valores_nuevos: { ...anterior, activo: false, updated_at: deletedAt },
      },
      user,
      requestMeta
    );
    return { id: accion.id, deleted: true };
  },

  updateEstado(id, data, user, requestMeta) {
    if (!id) throw new Error('id requerido');
    const accion = this.getOwnedAccionForEdit_(id, user);
    const estado = data?.estado;
    if (!this.ESTADOS[estado]) throw new Error('Estado de acción inválido');

    const nextData = {
      ...accion,
      estado,
      avance: data && data.avance !== undefined ? data.avance : accion.avance,
    };
    this.validateBusinessRules_(nextData);

    const updates = { estado, updated_at: Utils.ahora() };
    if (data && data.avance !== undefined) {
      updates.avance = this.normalizeAvance_(data.avance);
    }

    const anterior = { ...accion };
    Utils.updateRowById(Config.SHEETS.ACCIONES, id, updates);

    const indicador = this.getIndicador_(accion.indicador_id);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    const actualizada = this.getById(id, user);
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'accion',
        entidad_id: id,
        accion:  'status_change',
        detalle: `Cambio de estado de acción "${accion.nombre}" a ${estado}`,
        valores_anteriores: anterior,
        valores_nuevos: actualizada,
      },
      user,
      requestMeta
    );
    return actualizada;
  },

  addComentario(id, data, user, requestMeta) {
    if (!id) throw new Error('id requerido');

    const accion = this.getOwnedAccionForEdit_(id, user);
    const texto = String(data?.texto || '').trim();
    if (!texto) throw new Error('Comentario requerido');

    ensureAccionesSchema();

    const comentario = {
      id: Utils.uuid(),
      accion_id: accion.id,
      texto,
      usuario: user.email,
      fecha: Utils.ahora(),
      created_by: user.id,
      tipo: 'comentario',
    };

    Utils.appendRow(Config.SHEETS.COMENTARIOS_ACCION, comentario);
    Utils.updateRowById(Config.SHEETS.ACCIONES, accion.id, { updated_at: comentario.fecha });

    const indicador = this.getIndicador_(accion.indicador_id);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'comentario_accion',
        entidad_id: comentario.id,
        accion:  'create',
        detalle: `Comentario agregado en acción "${accion.nombre}"`,
        valores_nuevos: comentario,
      },
      user,
      requestMeta
    );
    return comentario;
  },

  updateComentario(id, data, user, requestMeta) {
    if (!id) throw new Error('id requerido');

    const comentario = this.getComentarioForEdit_(id, user);
    const texto = String(data?.texto || '').trim();
    if (!texto) throw new Error('Comentario requerido');

    const updates = {
      texto,
      fecha: Utils.ahora(),
      tipo: 'comentario',
    };

    const anterior = { ...comentario };
    Utils.updateRowById(Config.SHEETS.COMENTARIOS_ACCION, comentario.id, updates);
    Utils.updateRowById(Config.SHEETS.ACCIONES, comentario.accion_id, { updated_at: updates.fecha });

    const accion = this.getOwnedAccionForEdit_(comentario.accion_id, user);
    const indicador = this.getIndicador_(accion.indicador_id);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    const actualizado = { ...comentario, ...updates };
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'comentario_accion',
        entidad_id: comentario.id,
        accion:  'update',
        detalle: `Comentario actualizado en acción "${accion.nombre}"`,
        valores_anteriores: anterior,
        valores_nuevos: actualizado,
      },
      user,
      requestMeta
    );
    return actualizado;
  },

  deleteComentario(id, user, requestMeta) {
    if (!id) throw new Error('id requerido');

    const comentario = this.getComentarioForEdit_(id, user);
    const deletedAt = Utils.ahora();

    const anterior = { ...comentario };
    Utils.updateRowById(Config.SHEETS.COMENTARIOS_ACCION, comentario.id, {
      tipo: 'comentario_eliminado',
      texto: '[Comentario eliminado]',
      fecha: deletedAt,
    });
    Utils.updateRowById(Config.SHEETS.ACCIONES, comentario.accion_id, { updated_at: deletedAt });

    const accion = this.getOwnedAccionForEdit_(comentario.accion_id, user);
    const indicador = this.getIndicador_(accion.indicador_id);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'comentario_accion',
        entidad_id: comentario.id,
        accion:  'delete',
        detalle: `Comentario eliminado en acción "${accion.nombre}"`,
        valores_anteriores: anterior,
        valores_nuevos: { ...anterior, tipo: 'comentario_eliminado', texto: '[Comentario eliminado]' },
      },
      user,
      requestMeta
    );
    return { id: comentario.id, deleted: true };
  },

  getMedios(accionId, user) {
    if (!accionId) throw new Error('accion_id requerido');
    const accion = this.getById(accionId, user);
    return accion.medios;
  },

  uploadMedio(accionId, data, user, requestMeta) {
    if (!accionId) throw new Error('accion_id requerido');
    const accion = this.getOwnedAccionForEdit_(accionId, user);
    const tipo = this.normalizeTipoMedio_(data?.tipo);
    if (!this.TIPOS_MEDIO[tipo]) throw new Error('Tipo de medio inválido');

    const mediosRequeridos = this.parseMediosRequeridos_(accion.medios_requeridos);
    if (!mediosRequeridos.includes(tipo)) {
      throw new Error('El tipo de medio no está declarado para esta acción');
    }

    ensureAccionesSchema();

    const existentes = Utils.getSheetObjectsCached(Config.SHEETS.MEDIOS_VERIFICACION, 30)
      .filter((medio) => medio.accion_id === accion.id && this.normalizeTipoMedio_(medio.tipo) === tipo);

    const detalleRequeridos = this.parseMediosRequeridosDetalle_(accion.medios_requeridos, accion.medios_requeridos_detalle);
    const configTipo = detalleRequeridos.find((entry) => this.normalizeTipoMedio_(entry?.tipo) === tipo);
    const maxArchivos = configTipo ? this.normalizeMedioCantidad_(configTipo.cantidad) : 1;

    if (existentes.length >= maxArchivos) {
      throw new Error('Ya existen todas las evidencias declaradas para este tipo de medio en la acción');
    }

    const indicador = this.getIndicador_(accion.indicador_id);
    const upload = Drive.uploadMedio(data, {
      indicadorNombre: indicador.nombre,
      accionNombre: accion.nombre,
    });

    const medio = {
      id: Utils.uuid(),
      accion_id: accion.id,
      tipo,
      nombre_archivo: upload.nombreArchivo,
      url_drive: upload.url,
      file_id: upload.fileId,
      usuario: user.email,
      fecha_subida: Utils.ahora(),
      nombre_original: String(data?.nombre_original || data?.nombre_archivo || '').trim(),
      descripcion: String(data?.descripcion || '').trim(),
      cantidad_esperada: Number(data?.cantidad_esperada || 1) || 1,
      cantidad_lograda: Number(data?.cantidad_lograda || data?.cantidad_esperada || 1) || 1,
      url_externa: String(data?.url_externa || '').trim(),
      size_bytes: Number(data?.size_bytes || 0) || 0,
    };

    Utils.appendRow(Config.SHEETS.MEDIOS_VERIFICACION, medio);
    Utils.updateRowById(Config.SHEETS.ACCIONES, accion.id, { updated_at: Utils.ahora() });
    Utils.invalidateAccionesCaches({ instrumentoId: indicador.instrumento_id, includeIndicadores: true });
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'medio_verificacion',
        entidad_id: medio.id,
        accion:  'create',
        detalle: `Medio de verificación (${tipo}) subido para acción "${accion.nombre}"`,
        valores_nuevos: medio,
      },
      user,
      requestMeta
    );
    return medio;
  },

  updateMedio(accionId, data, user, requestMeta) {
    if (!accionId) throw new Error('accion_id requerido');
    const accion = this.getOwnedAccionForEdit_(accionId, user);
    const medioId = String(data?.medio_id || '').trim();
    if (!medioId) throw new Error('medio_id requerido');

    const medio = Utils.buscarEnSheet(
      Config.SHEETS.MEDIOS_VERIFICACION,
      'id',
      medioId,
      (row) => row.accion_id === accion.id
    );
    if (!medio) throw new Error('Medio de verificación no encontrado');

    const indicador = this.getIndicador_(accion.indicador_id);

    const updates = {};

    if (Object.prototype.hasOwnProperty.call(data, 'tipo')) {
      const nextTipo = this.normalizeTipoMedio_(data.tipo);
      if (!this.TIPOS_MEDIO[nextTipo]) {
        throw new Error('Tipo de medio inválido');
      }
      const mediosRequeridos = this.parseMediosRequeridos_(accion.medios_requeridos);
      if (!mediosRequeridos.includes(nextTipo)) {
        throw new Error('El tipo de medio no está declarado para esta acción');
      }
      const existentes = Utils.getSheetObjectsCached(Config.SHEETS.MEDIOS_VERIFICACION, 30)
        .filter((other) => other.accion_id === accion.id && this.normalizeTipoMedio_(other.tipo) === nextTipo && other.id !== medio.id);

      const detalleRequeridos = this.parseMediosRequeridosDetalle_(accion.medios_requeridos, accion.medios_requeridos_detalle);
      const configTipo = detalleRequeridos.find((entry) => this.normalizeTipoMedio_(entry?.tipo) === nextTipo);
      const maxArchivos = configTipo ? this.normalizeMedioCantidad_(configTipo.cantidad) : 1;

      if (existentes.length >= maxArchivos) {
        throw new Error('Ya existen todas las evidencias declaradas para este tipo de medio en la acción');
      }
      updates.tipo = nextTipo;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'cantidad_esperada')) {
      const expected = Number(data.cantidad_esperada);
      if (!Number.isFinite(expected) || expected <= 0) {
        throw new Error('La cantidad esperada debe ser un número mayor a 0');
      }
      updates.cantidad_esperada = expected;
      if (!Object.prototype.hasOwnProperty.call(data, 'cantidad_lograda')) {
        const currentLograda = Number(medio.cantidad_lograda || expected);
        updates.cantidad_lograda = Math.min(currentLograda, expected);
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'cantidad_lograda')) {
      const lograda = Number(data.cantidad_lograda);
      const expectedBase = Object.prototype.hasOwnProperty.call(updates, 'cantidad_esperada')
        ? updates.cantidad_esperada
        : Number(medio.cantidad_esperada || 1);
      if (!Number.isFinite(lograda) || lograda < 0) {
        throw new Error('La cantidad lograda debe ser un número mayor o igual a 0');
      }
      updates.cantidad_lograda = Math.min(lograda, expectedBase || 1);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'url_externa')) {
      updates.url_externa = String(data.url_externa || '').trim();
    }

    if (Object.prototype.hasOwnProperty.call(data, 'descripcion')) {
      updates.descripcion = String(data.descripcion || '').trim();
    }

    if (Object.keys(updates).length === 0) {
      return { id: medio.id, updated: false };
    }

    const anterior = { ...medio };
    Utils.updateRowById(Config.SHEETS.MEDIOS_VERIFICACION, medio.id, updates);
    Utils.updateRowById(Config.SHEETS.ACCIONES, accion.id, { updated_at: Utils.ahora() });

    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });

    const actualizado = { ...anterior, ...updates };
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'medio_verificacion',
        entidad_id: medio.id,
        accion:  'update',
        detalle: `Medio de verificación actualizado para acción "${accion.nombre}"`,
        valores_anteriores: anterior,
        valores_nuevos: actualizado,
      },
      user,
      requestMeta
    );

    return actualizado;
  },

  deleteMedio(accionId, data, user, requestMeta) {
    if (!accionId) throw new Error('accion_id requerido');
    const accion = this.getOwnedAccionForEdit_(accionId, user);
    const medioId = String(data?.medio_id || '').trim();
    if (!medioId) throw new Error('medio_id requerido');

    const medio = Utils.buscarEnSheet(
      Config.SHEETS.MEDIOS_VERIFICACION,
      'id',
      medioId,
      (row) => row.accion_id === accion.id
    );
    if (!medio) throw new Error('Medio de verificación no encontrado');

    const deletedAt = Utils.ahora();
    Drive.deleteFileById(medio.file_id);

    const anterior = { ...medio };
    Utils.updateRowById(Config.SHEETS.MEDIOS_VERIFICACION, medio.id, {
      url_drive: '',
      file_id: '',
      nombre_archivo: medio.nombre_archivo ? `[ELIMINADO] ${medio.nombre_archivo}` : '[ELIMINADO]',
      descripcion: '[Medio eliminado]',
      usuario: user.email || user.id || '',
      fecha_subida: deletedAt,
      tipo: 'eliminado',
    });
    Utils.updateRowById(Config.SHEETS.ACCIONES, accion.id, { updated_at: deletedAt });

    const indicador = this.getIndicador_(accion.indicador_id);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    Auditoria.logEvent(
      {
        modulo:  'acciones',
        entidad: 'medio_verificacion',
        entidad_id: medio.id,
        accion:  'delete',
        detalle: `Medio de verificación eliminado para acción "${accion.nombre}"`,
        valores_anteriores: anterior,
        valores_nuevos: {
          ...anterior,
          url_drive: '',
          file_id: '',
          nombre_archivo: anterior.nombre_archivo ? `[ELIMINADO] ${anterior.nombre_archivo}` : '[ELIMINADO]',
          descripcion: '[Medio eliminado]',
          usuario: user.email || user.id || '',
          fecha_subida: deletedAt,
          tipo: 'eliminado',
        },
      },
      user,
      requestMeta
    );
    return { id: medio.id, deleted: true };
  },

  getBundle_(user) {
    ensureAccionesSchema();

    return {
      acciones: Utils.getSheetObjectsCached(Config.SHEETS.ACCIONES, 60).filter((accion) => this.isActive_(accion)),
      medios: Utils.getSheetObjectsCached(Config.SHEETS.MEDIOS_VERIFICACION, 60)
        .filter((medio) => String(medio.tipo || '').trim() !== 'eliminado'),
      comentarios: Utils.getSheetObjectsCached(Config.SHEETS.COMENTARIOS_ACCION, 60)
        .filter((comentario) => String(comentario.tipo || '').trim() !== 'comentario_eliminado'),
      indicadores: Utils.getSheetObjectsCached(Config.SHEETS.INDICADORES, 90).filter((indicador) => this.isActive_(indicador)),
      instrumentos: Utils.getSheetObjectsCached(Config.SHEETS.INSTRUMENTOS, 120).filter((instrumento) => this.isActive_(instrumento)),
    };
  },

  decorate_(accion, bundle) {
    const indicador = bundle.indicadores.find((item) => item.id === accion.indicador_id) || null;
    const instrumento = indicador
      ? bundle.instrumentos.find((item) => item.id === indicador.instrumento_id) || null
      : null;
    const medios = bundle.medios.filter((medio) => medio.accion_id === accion.id);
    const mediosRequeridos = this.parseMediosRequeridos_(accion.medios_requeridos);
    const mediosRequeridosDetalle = this.parseMediosRequeridosDetalle_(accion.medios_requeridos, accion.medios_requeridos_detalle);
    const progresoMedios = this.countMediosCumplidos_(medios, mediosRequeridosDetalle);
    const equipoIndicador = this.getEquipoResponsable_(indicador);
    const responsableDisplay = String(accion.responsable || equipoIndicador || '').trim();

    return {
      ...accion,
      avance: Number(accion.avance || 0),
      medios_requeridos: mediosRequeridos,
      medios_requeridos_detalle: mediosRequeridosDetalle,
      indicador_nombre: indicador?.nombre || '',
      indicador_codigo: indicador?.codigo_indicador || '',
      indicador_equipo_trabajo: indicador?.equipo_trabajo || '',
      instrumento_id: instrumento?.id || '',
      instrumento_codigo: instrumento?.codigo || '',
      instrumento_nombre: instrumento?.nombre || '',
      responsable_display: responsableDisplay || 'Sin equipo',
      medios_count: medios.length,
      medios_requeridos_count: progresoMedios.totalRequeridos,
      medios_cumplidos_count: progresoMedios.totalCumplidos,
    };
  },

  buildResumen_(items) {
    const total = items.length;
    return {
      total,
      planificadas: items.filter((item) => item.estado === 'planificada').length,
      en_progreso: items.filter((item) => item.estado === 'en_progreso').length,
      reportadas: items.filter((item) => item.estado === 'reportada').length,
      completadas: items.filter((item) => item.estado === 'completada').length,
    };
  },

  buildTimeline_(accion, medios, comentarios) {
    const timeline = [
      {
        tipo: 'creacion',
        fecha: accion.created_at,
        texto: 'Acción creada',
      },
    ];

    if (accion.updated_at && accion.updated_at !== accion.created_at) {
      timeline.push({
        tipo: 'actualizacion',
        fecha: accion.updated_at,
        texto: `Estado actual: ${accion.estado}`,
      });
    }

    medios.forEach((medio) => {
      timeline.push({
        tipo: 'medio',
        fecha: medio.fecha_subida,
        texto: `Medio cargado: ${medio.nombre_archivo}`,
      });
    });

    (comentarios || []).forEach((comentario) => {
      timeline.push({
        tipo: comentario.tipo || 'comentario',
        fecha: comentario.fecha,
        texto: comentario.texto,
      });
    });

    return timeline.sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0));
  },

  matchesFilters_(accion, filtros, bundle) {
    const decorated = this.decorate_(accion, bundle);
    const search = String(filtros.search || '').trim().toLowerCase();
    const estado = filtros.estado;
    const indicadorId = filtros.indicador_id;
    const instrumentoId = filtros.instrumento_id;
    const responsable = String(filtros.responsable || '').trim().toLowerCase();
    const desde = filtros.fecha_desde ? new Date(filtros.fecha_desde) : null;
    const hasta = filtros.fecha_hasta ? new Date(filtros.fecha_hasta) : null;
    const compromiso = decorated.fecha_compromiso ? new Date(decorated.fecha_compromiso) : null;

    if (search) {
      const hayMatch = [decorated.nombre, decorated.indicador_nombre, decorated.responsable_display, decorated.indicador_equipo_trabajo]
        .some((value) => String(value || '').toLowerCase().includes(search));
      if (!hayMatch) return false;
    }

    if (estado && accion.estado !== estado) return false;
    if (indicadorId && accion.indicador_id !== indicadorId) return false;
    if (instrumentoId && decorated.instrumento_id !== instrumentoId) return false;
    if (responsable) {
      const responsableKeys = [decorated.responsable_display, decorated.indicador_equipo_trabajo, accion.responsable]
        .map((value) => String(value || '').trim().toLowerCase())
        .filter(Boolean);
      if (!responsableKeys.includes(responsable)) return false;
    }
    if (desde && compromiso && compromiso < desde) return false;
    if (hasta && compromiso && compromiso > hasta) return false;

    return true;
  },

  getOwnedAccionForEdit_(id, user) {
    this.assertCanEdit_(user);

    const accion = Utils.buscarEnSheet(
      Config.SHEETS.ACCIONES,
      'id',
      id,
      (row) => this.isActive_(row)
    );
    if (!accion) throw new Error('Acción no encontrada');

    if (user.rol === 'admin' || user.rol === 'director_ejecutivo') return accion;

    const indicador = this.getIndicador_(accion.indicador_id);
    const equipoResponsable = this.normalizeTeam_(this.getEquipoResponsable_(indicador));
    const userArea = this.normalizeTeam_(user.area);
    const userNombre = this.normalizeTeam_(user.nombre);
    const actionArea = this.normalizeTeam_(accion.responsable);
    const matchesUser = !!actionArea && [equipoResponsable, userArea, userNombre].filter(Boolean).includes(actionArea);

    if (accion.created_by !== user.id && !matchesUser) {
      throw new Error('No tienes permiso para editar esta acción');
    }

    return accion;
  },

  getIndicador_(indicadorId) {
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', indicadorId);
    if (!indicador) throw new Error('Indicador no encontrado');
    return indicador;
  },

  getComentarioForEdit_(comentarioId, user) {
    const comentario = Utils.buscarEnSheet(Config.SHEETS.COMENTARIOS_ACCION, 'id', comentarioId);
    if (!comentario) throw new Error('Comentario no encontrado');

    const accion = this.getOwnedAccionForEdit_(comentario.accion_id, user);
    if (user.rol === 'admin' || user.rol === 'director_ejecutivo') {
      return { ...comentario, accion_id: accion.id };
    }

    if (comentario.created_by !== user.id) {
      throw new Error('Solo puedes editar o eliminar tus propios comentarios');
    }

    return { ...comentario, accion_id: accion.id };
  },

  assertIndicadorActivo_(indicador) {
    if (!this.isActive_(indicador)) {
      throw new Error('El indicador no está activo');
    }
  },

  validatePayload_(data, isUpdate, indicador) {
    if (!isUpdate && !data?.indicador_id) throw new Error('indicador_id requerido');
    if (!String(data?.nombre || '').trim()) throw new Error('Nombre de la acción requerido');
    if (!String(data?.responsable || '').trim()) throw new Error('Equipo responsable requerido');
    if (!String(data?.fecha_compromiso || '').trim()) throw new Error('Fecha compromiso requerida');
    if (data?.estado && !this.ESTADOS[data.estado]) throw new Error('Estado de acción inválido');
    const mediosRequeridos = this.parseMediosRequeridos_(data?.medios_requeridos);
    if (!mediosRequeridos.length) {
      throw new Error('Debes declarar al menos un medio de verificación asociado a la acción');
    }
    if (indicador) this.assertEquipoResponsableValido_(data?.responsable, indicador);
    this.validateBusinessRules_(data);
  },

  parseMediosRequeridos_(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => this.normalizeTipoMedio_(item))
        .filter((item) => this.TIPOS_MEDIO[item]);
    }

    return String(value || '')
      .split(',')
      .map((item) => this.normalizeTipoMedio_(item))
      .filter((item) => this.TIPOS_MEDIO[item]);
  },

  serializeMediosRequeridos_(value) {
    const unique = [];
    this.parseMediosRequeridos_(value).forEach((medio) => {
      if (!unique.includes(medio)) unique.push(medio);
    });
    if (!unique.length) {
      throw new Error('Debes declarar al menos un medio de verificación asociado a la acción');
    }
    return unique.join(',');
  },

  countMediosCumplidos_(medios, mediosRequeridosDetalle) {
    if (!Array.isArray(mediosRequeridosDetalle) || !mediosRequeridosDetalle.length) {
      return { totalRequeridos: 0, totalCumplidos: 0 };
    }

    const byTipo = medios.reduce((acc, medio) => {
      const tipo = this.normalizeTipoMedio_(medio.tipo);
      if (!tipo) return acc;
      if (!acc[tipo]) acc[tipo] = 0;
      acc[tipo] += 1;
      return acc;
    }, {});

    let totalRequeridos = 0;
    let totalCumplidos = 0;

    mediosRequeridosDetalle.forEach((entry) => {
      const tipo = this.normalizeTipoMedio_(entry?.tipo);
      if (!tipo) return;
      const cantidad = this.normalizeMedioCantidad_(entry?.cantidad);
      totalRequeridos += cantidad;
      totalCumplidos += Math.min(byTipo[tipo] || 0, cantidad);
    });

    return { totalRequeridos, totalCumplidos };
  },

  validateBusinessRules_(data) {
    const avance = this.normalizeAvance_(data?.avance);
    const fechaInicio = String(data?.fecha_inicio || '').trim();
    const fechaCompromiso = String(data?.fecha_compromiso || '').trim();
    const estado = String(data?.estado || 'planificada').trim();

    if (fechaInicio && fechaCompromiso && fechaCompromiso < fechaInicio) {
      throw new Error('La fecha compromiso no puede ser anterior a la fecha de inicio');
    }

    if (estado === 'planificada' && avance > 0) {
      throw new Error('Una acción planificada debe iniciar con avance 0');
    }

    if (estado === 'completada' && avance !== 100) {
      throw new Error('Una acción completada debe registrar avance 100');
    }
  },

  assertEquipoResponsableValido_(value, indicador) {
    const expected = this.getEquipoResponsable_(indicador);
    const normalizedValue = this.normalizeTeam_(value);
    const normalizedExpected = this.normalizeTeam_(expected);

    if (!normalizedExpected) {
      throw new Error('El indicador no tiene equipo de trabajo configurado');
    }

    if (!normalizedValue || normalizedValue !== normalizedExpected) {
      throw new Error('El equipo responsable debe coincidir con el equipo de trabajo del indicador');
    }

    return expected;
  },

  getEquipoResponsable_(indicador) {
    return String(indicador?.equipo_trabajo || indicador?.subdimension || '').trim();
  },

  normalizeTeam_(value) {
    return String(value || '').trim().toLowerCase();
  },

  normalizeTipoMedio_(value) {
    const raw = String(value || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (!raw) return '';

    const compact = raw.replace(/\s+/g, '_');
    const aliases = {
      lista_asistencia: 'lista_asistencia',
      listas_asistencia: 'lista_asistencia',
      'lista_de_asistencia': 'lista_asistencia',
      'listas_de_asistencia': 'lista_asistencia',
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

    return aliases[compact] || '';
  },

  normalizeMedioCantidad_(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.round(parsed);
  },

  parseMediosRequeridosDetalle_(mediosRequeridos, detalle) {
    const tipos = this.parseMediosRequeridos_(mediosRequeridos);
    const source = Array.isArray(detalle)
      ? detalle
      : (() => {
        const text = String(detalle || '').trim();
        if (!text) return [];
        try {
          const parsed = JSON.parse(text);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          return [];
        }
      })();

    const mapCantidad = {};
    source.forEach((entry) => {
      const tipo = this.normalizeTipoMedio_(entry?.tipo);
      if (!tipo) return;
      mapCantidad[tipo] = this.normalizeMedioCantidad_(entry?.cantidad);
    });

    return tipos.map((tipo) => ({
      tipo,
      cantidad: mapCantidad[tipo] || 1,
    }));
  },

  serializeMediosRequeridosDetalle_(mediosRequeridos, detalle) {
    const normalized = this.parseMediosRequeridosDetalle_(mediosRequeridos, detalle);
    return JSON.stringify(normalized);
  },

  normalizeAvance_(value) {
    const parsed = Number(value ?? 0);
    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      throw new Error('El avance debe estar entre 0 y 100');
    }
    return Math.round(parsed);
  },

  assertCanEdit_(user) {
    if (!user || !['admin', 'director_ejecutivo', 'subdirector'].includes(user.rol)) {
      throw new Error('No tienes permiso para gestionar acciones');
    }
  },

  canView_(accion, user) {
    if (!user) return false;
    if (user.rol === 'admin' || user.rol === 'director_ejecutivo') return true;

    const responsible = String(accion.responsable || '').trim().toLowerCase();
    return [user.id, user.email, user.nombre]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())
      .includes(responsible) || accion.created_by === user.id;
  },

  isActive_(row) {
    return row && Utils.isActiveFlag(row.activo);
  },
};