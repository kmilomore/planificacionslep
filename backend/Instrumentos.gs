const Instrumentos = {
  getAll(user) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    return Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INSTRUMENTOS));
  },

  create(data, user) {
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
    return nuevo;
  },

  update(id, data, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede editar instrumentos');
    const allowed = { nombre: true, descripcion: true, responsable_id: true, color_hex: true, activo: true };
    const updates = Object.fromEntries(Object.entries(data).filter(([k]) => allowed[k]));
    Utils.updateRowById(Config.SHEETS.INSTRUMENTOS, id, updates);
    Utils.invalidateDashboardCaches({ instrumentoId: id });
    return { ok: true };
  },
};
