const Usuarios = {
  getAll(user) {
    if (user.rol !== 'admin') throw new Error('Solo admin puede listar usuarios');
    return Utils.getSheetObjectsCached(Config.SHEETS.USUARIOS, 120);
  },

  getResponsablesAccion(user) {
    if (!user || !['admin', 'director_ejecutivo', 'subdirector'].includes(user.rol)) {
      throw new Error('No tienes permiso para listar responsables');
    }

    return this.getActiveUsers_().map((usuario) => ({
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
      area: usuario.area || '',
      label: `${usuario.nombre || usuario.email} · ${usuario.email}`,
    }));
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

  findActiveByReference(reference) {
    const normalized = this.normalizeReference_(reference);
    if (!normalized) return null;

    return this.getActiveUsers_().find((usuario) => {
      return [usuario.id, usuario.email, usuario.nombre]
        .filter(Boolean)
        .map((value) => this.normalizeReference_(value))
        .includes(normalized);
    }) || null;
  },

  getActiveUsers_() {
    return Utils.getSheetObjectsCached(Config.SHEETS.USUARIOS, 120)
      .filter((row) => Utils.isActiveFlag(row.activo));
  },

  normalizeReference_(value) {
    return String(value || '').trim().toLowerCase();
  },
};
