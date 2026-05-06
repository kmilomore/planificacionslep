const Indicadores = {
  getById(id, user) {
    if (!id) throw new Error('id requerido');
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', id);
    if (!indicador) throw new Error('Indicador no encontrado');
    return indicador;
  },

  getByInstrumento(instrumento_id, user) {
    if (!instrumento_id) throw new Error('instrumento_id requerido');
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    return Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INDICADORES))
      .filter(i => i.instrumento_id === instrumento_id);
  },

  create(data, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede crear indicadores');
    if (!data.instrumento_id || !data.codigo_indicador || !data.nombre) {
      throw new Error('Instrumento, código y nombre son obligatorios');
    }

    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const existente = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INDICADORES))
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
    return nuevo;
  },

  update(id, data, user) {
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
    return { ok: true };
  },

  softDelete(id, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede desactivar indicadores');
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', id);
    Utils.updateRowById(Config.SHEETS.INDICADORES, id, { activo: false });
    Utils.invalidateDashboardCaches({ instrumentoId: indicador?.instrumento_id });
    return { ok: true };
  },
};
