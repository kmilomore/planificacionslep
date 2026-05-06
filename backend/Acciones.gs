const Acciones = {
  ESTADOS: {
    planificada: true,
    en_progreso: true,
    reportada: true,
    completada: true,
  },

  TIPOS_MEDIO: {
    listado_asistencia: true,
    reporte: true,
    otros: true,
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

    return {
      ...decorated,
      medios,
      timeline: this.buildTimeline_(decorated, medios),
    };
  },

  create(data, user) {
    this.assertCanEdit_(user);
    this.validatePayload_(data, false);

    const indicador = this.getIndicador_(data.indicador_id);
    this.assertIndicadorActivo_(indicador);

    const now = Utils.ahora();
    const nueva = {
      id: Utils.uuid(),
      indicador_id: data.indicador_id,
      nombre: String(data.nombre || '').trim(),
      descripcion: String(data.descripcion || '').trim(),
      responsable: String(data.responsable || '').trim(),
      fecha_inicio: data.fecha_inicio || '',
      fecha_compromiso: data.fecha_compromiso,
      estado: data.estado || 'planificada',
      avance: this.normalizeAvance_(data.avance),
      activo: true,
      created_at: now,
      updated_at: now,
      created_by: user.id,
    };

    Utils.appendRow(Config.SHEETS.ACCIONES, nueva);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador.instrumento_id, includeIndicadores: true });
    return this.getById(nueva.id, user);
  },

  update(id, data, user) {
    if (!id) throw new Error('id requerido');

    const accion = this.getOwnedAccionForEdit_(id, user);
    const nextData = { ...accion, ...data };
    this.validatePayload_(nextData, true);

    const allowed = {
      nombre: true,
      descripcion: true,
      responsable: true,
      fecha_inicio: true,
      fecha_compromiso: true,
      estado: true,
      avance: true,
      activo: true,
    };
    const updates = Object.fromEntries(
      Object.entries(data)
        .filter(([key]) => allowed[key])
        .map(([key, value]) => [key, key === 'avance' ? this.normalizeAvance_(value) : value])
    );
    updates.updated_at = Utils.ahora();

    Utils.updateRowById(Config.SHEETS.ACCIONES, id, updates);

    const indicador = this.getIndicador_(accion.indicador_id);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    return this.getById(id, user);
  },

  updateEstado(id, data, user) {
    if (!id) throw new Error('id requerido');
    const accion = this.getOwnedAccionForEdit_(id, user);
    const estado = data?.estado;
    if (!this.ESTADOS[estado]) throw new Error('Estado de acción inválido');

    const updates = { estado, updated_at: Utils.ahora() };
    if (data && data.avance !== undefined) {
      updates.avance = this.normalizeAvance_(data.avance);
    }

    Utils.updateRowById(Config.SHEETS.ACCIONES, id, updates);

    const indicador = this.getIndicador_(accion.indicador_id);
    Utils.invalidateAccionesCaches({ instrumentoId: indicador?.instrumento_id, includeIndicadores: true });
    return this.getById(id, user);
  },

  getMedios(accionId, user) {
    if (!accionId) throw new Error('accion_id requerido');
    const accion = this.getById(accionId, user);
    return accion.medios;
  },

  uploadMedio(accionId, data, user) {
    if (!accionId) throw new Error('accion_id requerido');
    const accion = this.getOwnedAccionForEdit_(accionId, user);
    const tipo = String(data?.tipo || '').trim();
    if (!this.TIPOS_MEDIO[tipo]) throw new Error('Tipo de medio inválido');

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
    };

    Utils.appendRow(Config.SHEETS.MEDIOS_VERIFICACION, medio);
    Utils.updateRowById(Config.SHEETS.ACCIONES, accion.id, { updated_at: Utils.ahora() });
    Utils.invalidateAccionesCaches({ instrumentoId: indicador.instrumento_id, includeIndicadores: true });
    return medio;
  },

  getBundle_(user) {
    return {
      acciones: Utils.getSheetObjectsCached(Config.SHEETS.ACCIONES, 60).filter((accion) => this.isActive_(accion)),
      medios: Utils.getSheetObjectsCached(Config.SHEETS.MEDIOS_VERIFICACION, 60),
      indicadores: Utils.getSheetObjectsCached(Config.SHEETS.INDICADORES, 90).filter((indicador) => this.isActive_(indicador)),
      instrumentos: Utils.getSheetObjectsCached(Config.SHEETS.INSTRUMENTOS, 120).filter((instrumento) => this.isActive_(instrumento)),
      usuarios: user?.rol === 'admin'
        ? Utils.getSheetObjectsCached(Config.SHEETS.USUARIOS, 120)
        : [],
    };
  },

  decorate_(accion, bundle) {
    const indicador = bundle.indicadores.find((item) => item.id === accion.indicador_id) || null;
    const instrumento = indicador
      ? bundle.instrumentos.find((item) => item.id === indicador.instrumento_id) || null
      : null;
    const medios = bundle.medios.filter((medio) => medio.accion_id === accion.id);

    return {
      ...accion,
      avance: Number(accion.avance || 0),
      indicador_nombre: indicador?.nombre || '',
      indicador_codigo: indicador?.codigo_indicador || '',
      instrumento_id: instrumento?.id || '',
      instrumento_codigo: instrumento?.codigo || '',
      instrumento_nombre: instrumento?.nombre || '',
      medios_count: medios.length,
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

  buildTimeline_(accion, medios) {
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
      const hayMatch = [decorated.nombre, decorated.indicador_nombre, decorated.responsable]
        .some((value) => String(value || '').toLowerCase().includes(search));
      if (!hayMatch) return false;
    }

    if (estado && accion.estado !== estado) return false;
    if (indicadorId && accion.indicador_id !== indicadorId) return false;
    if (instrumentoId && decorated.instrumento_id !== instrumentoId) return false;
    if (responsable && String(accion.responsable || '').toLowerCase() !== responsable) return false;
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

    const responsible = String(accion.responsable || '').trim().toLowerCase();
    const matchesUser = [user.id, user.email, user.nombre]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())
      .includes(responsible);

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

  assertIndicadorActivo_(indicador) {
    if (!this.isActive_(indicador)) {
      throw new Error('El indicador no está activo');
    }
  },

  validatePayload_(data, isUpdate) {
    if (!isUpdate && !data?.indicador_id) throw new Error('indicador_id requerido');
    if (!String(data?.nombre || '').trim()) throw new Error('Nombre de la acción requerido');
    if (!String(data?.responsable || '').trim()) throw new Error('Responsable requerido');
    if (!String(data?.fecha_compromiso || '').trim()) throw new Error('Fecha compromiso requerida');
    if (data?.estado && !this.ESTADOS[data.estado]) throw new Error('Estado de acción inválido');
    this.normalizeAvance_(data?.avance);
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
    return row && row.activo !== false && row.activo !== 'FALSE' && row.activo !== 'false';
  },
};