const Indicadores = {
  getById(id, user) {
    if (!id) throw new Error('id requerido');
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', id);
    if (!indicador) throw new Error('Indicador no encontrado');
    return indicador;
  },

  getByInstrumento(instrumento_id, user) {
    const rows = Utils.getSheetObjectsCached(Config.SHEETS.INDICADORES, 90);
    if (!instrumento_id) return rows;
    return rows.filter(i => i.instrumento_id === instrumento_id);
  },

  create(data, user, requestMeta) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede crear indicadores');
    if (!data.instrumento_id || !data.codigo_indicador || !data.nombre) {
      throw new Error('Instrumento, código y nombre son obligatorios');
    }

    const existente = Utils.getSheetObjectsCached(Config.SHEETS.INDICADORES, 90)
      .find(i => i.codigo_indicador === data.codigo_indicador);
    if (existente) throw new Error(`Ya existe el indicador "${data.codigo_indicador}"`);

    const nuevo = {
      id:                  Utils.uuid(),
      instrumento_id:      data.instrumento_id,
      dimension:           data.dimension || '',
      subdimension:        data.subdimension || '',
      codigo_indicador:    data.codigo_indicador,
      nombre:              data.nombre,
      descripcion:         data.descripcion || '',
      formula:             data.formula || '',
      tipo_meta:           data.tipo_meta || 'porcentaje',
      meta_valor:          data.meta_valor || '',
      unidad:              data.unidad || '%',
      peso:                data.peso || '',
      fuente_verificacion: data.fuente_verificacion || '',
      responsable_id:      data.responsable_id || '',
      activo:              true,
    };
    Utils.appendRow(Config.SHEETS.INDICADORES, nuevo);
    Utils.invalidateDashboardCaches({ instrumentoId: data.instrumento_id });
    Auditoria.logEvent(
      {
        modulo:  'indicadores',
        entidad: 'indicador',
        entidad_id: nuevo.id,
        accion:  'create',
        detalle: `Creación de indicador ${nuevo.codigo_indicador}`,
        valores_nuevos: nuevo,
      },
      user,
      requestMeta
    );
    return nuevo;
  },

  update(id, data, user, requestMeta) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede editar indicadores');
    const allowed = {
      nombre: true, descripcion: true, formula: true, tipo_meta: true,
      meta_valor: true, unidad: true, peso: true, fuente_verificacion: true,
      responsable_id: true, dimension: true, subdimension: true, activo: true,
    };
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', id);
    const updates = Object.fromEntries(Object.entries(data).filter(([k]) => allowed[k]));
    Utils.updateRowById(Config.SHEETS.INDICADORES, id, updates);
    Utils.invalidateDashboardCaches({ instrumentoId: indicador?.instrumento_id });
    Auditoria.logEvent(
      {
        modulo:  'indicadores',
        entidad: 'indicador',
        entidad_id: id,
        accion:  'update',
        detalle: `Actualización de indicador ${indicador ? indicador.codigo_indicador : id}`,
        valores_anteriores: indicador,
        valores_nuevos: { ...(indicador || {}), ...updates },
      },
      user,
      requestMeta
    );
    return { ok: true };
  },

  softDelete(id, user, requestMeta) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede desactivar indicadores');
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', id);
    Utils.updateRowById(Config.SHEETS.INDICADORES, id, { activo: false });
    Utils.invalidateDashboardCaches({ instrumentoId: indicador?.instrumento_id });
    Auditoria.logEvent(
      {
        modulo:  'indicadores',
        entidad: 'indicador',
        entidad_id: id,
        accion:  'soft_delete',
        detalle: `Desactivación de indicador ${indicador ? indicador.codigo_indicador : id}`,
        valores_anteriores: indicador,
        valores_nuevos: { ...(indicador || {}), activo: false },
      },
      user,
      requestMeta
    );
    return { ok: true };
  },
};
