const Instrumentos = {
  getAll(user) {
    return Utils.getSheetObjectsCached(Config.SHEETS.INSTRUMENTOS, 120);
  },

  create(data, user, requestMeta) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede crear instrumentos');
    if (!data.codigo || !data.nombre || !data.tipo_seguimiento) {
      throw new Error('Código, nombre y tipo de seguimiento son obligatorios');
    }

    const existente = Utils.buscarEnSheet(Config.SHEETS.INSTRUMENTOS, 'codigo', data.codigo);
    if (existente) throw new Error(`Ya existe el instrumento "${data.codigo}"`);

    const nuevo = {
      id:               Utils.uuid(),
      codigo:           data.codigo,
      nombre:           data.nombre,
      descripcion:      data.descripcion || '',
      ciclo:            data.ciclo || 'anual',
      tipo_seguimiento: data.tipo_seguimiento,
      responsable_id:   data.responsable_id || '',
      color_hex:        data.color_hex || '#25306B',
      activo:           true,
      creado_en:        Utils.ahora(),
    };
    Utils.appendRow(Config.SHEETS.INSTRUMENTOS, nuevo);
    Utils.invalidateDashboardCaches({ instrumentoId: nuevo.id });
    Auditoria.logEvent(
      {
        modulo:  'instrumentos',
        entidad: 'instrumento',
        entidad_id: nuevo.id,
        accion:  'create',
        detalle: `Creación de instrumento ${nuevo.codigo}`,
        valores_nuevos: nuevo,
      },
      user,
      requestMeta
    );
    return nuevo;
  },

  update(id, data, user, requestMeta) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede editar instrumentos');
    const allowed = { nombre: true, descripcion: true, responsable_id: true, color_hex: true, activo: true };
    const updates = Object.fromEntries(Object.entries(data).filter(([k]) => allowed[k]));
    const anterior = Utils.buscarEnSheet(Config.SHEETS.INSTRUMENTOS, 'id', id);
    Utils.updateRowById(Config.SHEETS.INSTRUMENTOS, id, updates);
    Utils.invalidateDashboardCaches({ instrumentoId: id });
    Auditoria.logEvent(
      {
        modulo:  'instrumentos',
        entidad: 'instrumento',
        entidad_id: id,
        accion:  'update',
        detalle: `Actualización de instrumento ${anterior ? anterior.codigo : id}`,
        valores_anteriores: anterior,
        valores_nuevos: { ...(anterior || {}), ...updates },
      },
      user,
      requestMeta
    );
    return { ok: true };
  },
};
