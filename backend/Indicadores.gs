const Indicadores = {
  getByInstrumento(instrumento_id, user) {
    if (!instrumento_id) throw new Error('instrumento_id requerido');
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    return Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INDICADORES))
      .filter(i => i.instrumento_id === instrumento_id);
  },

  create(data, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede crear indicadores');
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
    return nuevo;
  },

  update(id, data, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede editar indicadores');
    const allowed = {
      nombre: true, descripcion: true, formula: true, tipo_meta: true,
      meta_valor: true, unidad: true, peso: true, fuente_verificacion: true,
      responsable_id: true, dimension: true, subdimension: true, activo: true,
    };
    const updates = Object.fromEntries(Object.entries(data).filter(([k]) => allowed[k]));
    Utils.updateRowById(Config.SHEETS.INDICADORES, id, updates);
    return { ok: true };
  },

  softDelete(id, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede desactivar indicadores');
    Utils.updateRowById(Config.SHEETS.INDICADORES, id, { activo: false });
    return { ok: true };
  },
};
