const Auditoria = {
  /**
   * Registra un evento de auditoría genérico.
   *
   * payload:
   *   modulo:     sección lógica de la app (ej: 'auth', 'usuarios', 'instrumentos', 'indicadores', 'cortes', 'acciones', 'avances', 'dashboard')
   *   entidad:    tipo de entidad (ej: 'usuario', 'instrumento', 'indicador', 'corte', 'accion', 'avance', 'sesion')
   *   entidad_id: identificador de la entidad si aplica
   *   accion:     verbo o tipo de acción (ej: 'login', 'logout', 'create', 'update', 'delete', 'soft_delete', 'status_change', 'approve', 'observe')
   *   detalle:    texto corto explicando la operación
   *   valores_anteriores: objeto opcional con snapshot previo
   *   valores_nuevos:     objeto opcional con snapshot nuevo
   *   contexto_extra:     objeto opcional con metadatos adicionales
   */
  logEvent(payload, user, requestMeta) {
    try {
      const cleanedUser = user || {};
      const nowIso = Utils.ahora();

      const base = {
        id:         Utils.uuid(),
        timestamp:  nowIso,
        user_id:    cleanedUser.id || '',
        user_email: cleanedUser.email || '',
        user_nombre: cleanedUser.nombre || '',
        user_rol:   cleanedUser.rol || '',
        user_area:  cleanedUser.area || '',
        ip:         requestMeta && requestMeta.ip || '',
        user_agent: requestMeta && requestMeta.userAgent || '',
        modulo:     String(payload && payload.modulo || '').trim(),
        entidad:    String(payload && payload.entidad || '').trim(),
        entidad_id: String(payload && payload.entidad_id || '').trim(),
        accion:     String(payload && payload.accion || '').trim(),
        detalle:    String(payload && payload.detalle || '').trim(),
      };

      const valoresPrevios = payload && payload.valores_anteriores ? JSON.stringify(payload.valores_anteriores) : '';
      const valoresNuevos  = payload && payload.valores_nuevos     ? JSON.stringify(payload.valores_nuevos)     : '';

      const row = {
        ...base,
        valores_anteriores: valoresPrevios,
        valores_nuevos:     valoresNuevos,
      };

      Utils.appendRow(Config.SHEETS.AUDITORIA, row);
      return row;
    } catch (e) {
      console.error('Error registrando auditoría', e);
      return null;
    }
  },

  /**
   * Listado básico de eventos de auditoría.
   * Solo admin puede consultar.
   *
   * filtros:
   *   user_email, user_id, modulo, entidad, accion
   *   desde (ISO string), hasta (ISO string)
   *   limit (máximo de filas, default 200)
   */
  getEvents(filtros, user) {
    if (!user || user.rol !== 'admin') {
      throw new Error('Solo admin puede ver la auditoría');
    }

    const all = Utils.getSheetObjectsCached(Config.SHEETS.AUDITORIA, 60);
    const f = filtros || {};

    const desde = f.desde ? new Date(f.desde) : null;
    const hasta = f.hasta ? new Date(f.hasta) : null;

    let items = all.filter((row) => {
      if (f.user_email && String(row.user_email || '').trim().toLowerCase() !== String(f.user_email || '').trim().toLowerCase()) {
        return false;
      }
      if (f.user_id && String(row.user_id || '').trim() !== String(f.user_id || '').trim()) {
        return false;
      }
      if (f.modulo && String(row.modulo || '').trim() !== String(f.modulo || '').trim()) {
        return false;
      }
      if (f.entidad && String(row.entidad || '').trim() !== String(f.entidad || '').trim()) {
        return false;
      }
      if (f.accion && String(row.accion || '').trim() !== String(f.accion || '').trim()) {
        return false;
      }

      if (desde || hasta) {
        const ts = row.timestamp ? new Date(row.timestamp) : null;
        if (!ts) return false;
        if (desde && ts < desde) return false;
        if (hasta && ts > hasta) return false;
      }

      return true;
    });

    items = items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    const limit = Number(f.limit || 200);
    if (Number.isFinite(limit) && limit > 0) {
      items = items.slice(0, limit);
    }

    return items;
  },
};

