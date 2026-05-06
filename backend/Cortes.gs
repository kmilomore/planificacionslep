const Cortes = {
  getAll(user) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    return Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.CORTES));
  },

  getByInstrumento(instrumento_id, user) {
    if (!instrumento_id) throw new Error('instrumento_id requerido');
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    return Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.CORTES))
      .filter(c => c.instrumento_id === instrumento_id)
      .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));
  },

  create(data, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede crear cortes');

    // Verificar que no exista ya un corte con el mismo código
    const existente = Utils.buscarEnSheet(Config.SHEETS.CORTES, 'codigo_corte', data.codigo_corte);
    if (existente) throw new Error(`Ya existe el corte "${data.codigo_corte}"`);

    const nuevo = {
      id:               Utils.uuid(),
      instrumento_id:   data.instrumento_id,
      codigo_corte:     data.codigo_corte,
      nombre_corte:     data.nombre_corte,
      fecha_inicio:     data.fecha_inicio,
      fecha_limite:     data.fecha_limite,
      dias_recordatorio: data.dias_recordatorio || Config.DIAS_RECORDATORIO_DEFAULT,
      estado:           'pendiente',
      año:              data.año || new Date().getFullYear(),
    };
    Utils.appendRow(Config.SHEETS.CORTES, nuevo);
    Utils.invalidateDashboardCaches({ instrumentoId: data.instrumento_id, corteId: nuevo.id });
    return nuevo;
  },

  cerrar(id, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede cerrar cortes');
    const corte = Utils.buscarEnSheet(Config.SHEETS.CORTES, 'id', id);
    Utils.updateRowById(Config.SHEETS.CORTES, id, { estado: 'cerrado' });
    Utils.invalidateDashboardCaches({ instrumentoId: corte?.instrumento_id, corteId: id });
    return { ok: true };
  },

  reabrir(id, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede reabrir cortes');
    const corte = Utils.buscarEnSheet(Config.SHEETS.CORTES, 'id', id);
    Utils.updateRowById(Config.SHEETS.CORTES, id, { estado: 'en_curso' });
    Utils.invalidateDashboardCaches({ instrumentoId: corte?.instrumento_id, corteId: id });
    return { ok: true };
  },
};
