const Usuarios = {
  getAll(user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede listar usuarios');
    return Utils.getSheetObjectsCached(Config.SHEETS.USUARIOS, 120);
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
