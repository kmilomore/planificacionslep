const Usuarios = {
  getAll(user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede listar usuarios');
    const ss    = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet = ss.getSheetByName(Config.SHEETS.USUARIOS);
    return Utils.sheetToObjects(sheet);
  },

  update(id, data, user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede editar usuarios');
    const allowed = { nombre: true, rol: true, area: true, activo: true };
    const updates = Object.fromEntries(
      Object.entries(data).filter(([k]) => allowed[k])
    );
    Utils.updateRowById(Config.SHEETS.USUARIOS, id, updates);
    return { ok: true };
  },
};
