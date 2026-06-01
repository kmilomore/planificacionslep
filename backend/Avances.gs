const Avances = {
  upsert(data, user) {
    if (!data.indicador_id || !data.corte_id) {
      throw new Error('indicador_id y corte_id son obligatorios');
    }

    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', data.indicador_id);
    if (!indicador) throw new Error('Indicador no encontrado');

    const corte = Utils.buscarEnSheet(Config.SHEETS.CORTES, 'id', data.corte_id);
    if (!corte) throw new Error('Corte no encontrado');
    if (corte.estado === 'cerrado') throw new Error('El corte está cerrado');

    if (user.rol !== 'admin' && indicador.responsable_id !== user.id) {
      throw new Error('No tienes permiso para editar este indicador');
    }

    const pctBase = Utils.calcularPorcentaje(data.valor_reportado, indicador.meta_valor, indicador.tipo_meta);
    const pctMedios = this.calcularPctPorMedios_(indicador.id);
    const pct = pctMedios.totalRequeridos > 0 ? pctMedios.pct : pctBase;
    const semaforo = Utils.calcularSemaforo(pct);
    const comentario = String(data.comentario || '').trim();

    if (pct < Config.SEMAFORO.VERDE && !comentario) {
      throw new Error('El comentario es obligatorio si el cumplimiento es menor a 80%');
    }

    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet = ss.getSheetByName(Config.SHEETS.AVANCES);
    const rows = Utils.sheetToObjects(sheet);
    const existente = rows.find(r => r.indicador_id === data.indicador_id && r.corte_id === data.corte_id);

    const payload = {
      indicador_id: data.indicador_id,
      corte_id: data.corte_id,
      valor_reportado: data.valor_reportado ?? '',
      porcentaje_cumplimiento: pct,
      estado_semaforo: semaforo,
      comentario: comentario,
      evidencia_url: data.evidencia_url || '',
      estado_revision: 'enviado',
      modificado_en: Utils.ahora(),
    };

    if (existente) {
      Utils.updateRowById(Config.SHEETS.AVANCES, existente.id, payload);
      Utils.invalidateDashboardCaches({ instrumentoId: indicador.instrumento_id, corteId: data.corte_id });
      return { ...existente, ...payload, id: existente.id };
    }

    const nuevo = {
      id: Utils.uuid(),
      ...payload,
      ingresado_por: user.id,
      ingresado_en: Utils.ahora(),
      aprobado_por: '',
      aprobado_en: '',
    };
    Utils.appendRow(Config.SHEETS.AVANCES, nuevo);
    Utils.invalidateDashboardCaches({ instrumentoId: indicador.instrumento_id, corteId: data.corte_id });
    return nuevo;
  },

  calcularPctPorMedios_(indicadorId) {
    ensureAccionesSchema();

    const acciones = Utils.getSheetObjectsCached(Config.SHEETS.ACCIONES, 45)
      .filter((accion) => Utils.isActiveFlag(accion.activo) && accion.indicador_id === indicadorId);
    const medios = Utils.getSheetObjectsCached(Config.SHEETS.MEDIOS_VERIFICACION, 45);

    let totalRequeridos = 0;
    let totalCumplidos = 0;

    acciones.forEach((accion) => {
      const requeridos = String(accion.medios_requeridos || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!requeridos.length) return;

      const tiposSubidos = medios
        .filter((medio) => medio.accion_id === accion.id)
        .map((medio) => String(medio.tipo || '').trim())
        .filter(Boolean);

      totalRequeridos += requeridos.length;
      totalCumplidos += requeridos.filter((tipo) => tiposSubidos.includes(tipo)).length;
    });

    if (!totalRequeridos) {
      return { pct: 0, totalRequeridos: 0, totalCumplidos: 0 };
    }

    return {
      pct: Math.min(Math.round((totalCumplidos / totalRequeridos) * 100), 100),
      totalRequeridos,
      totalCumplidos,
    };
  },

  getByCorte(corte_id, user) {
    if (!corte_id) throw new Error('corte_id requerido');
    const rows = Utils.getSheetObjectsCached(Config.SHEETS.AVANCES, 45)
      .filter(r => r.corte_id === corte_id);

    return Object.values(
      Utils.latestBy(rows, 'indicador_id', ['modificado_en', 'ingresado_en'])
    );
  },

  aprobar(id, user) {
    if (user.rol !== 'director_ejecutivo' && user.rol !== 'admin') {
      throw new Error('Solo director ejecutivo o admin pueden aprobar avances');
    }

    const avance = Utils.buscarEnSheet(Config.SHEETS.AVANCES, 'id', id);
    if (!avance) throw new Error('Avance no encontrado');

    Utils.updateRowById(Config.SHEETS.AVANCES, id, {
      estado_revision: 'aprobado',
      aprobado_por: user.id,
      aprobado_en: Utils.ahora(),
      modificado_en: Utils.ahora(),
    });
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', avance.indicador_id);
    Utils.invalidateDashboardCaches({ instrumentoId: indicador?.instrumento_id, corteId: avance.corte_id });
    return { ok: true };
  },

  observar(id, comentario, user) {
    if (user.rol !== 'director_ejecutivo' && user.rol !== 'admin') {
      throw new Error('Solo director ejecutivo o admin pueden observar avances');
    }
    if (!String(comentario || '').trim()) {
      throw new Error('El comentario es obligatorio para observar un avance');
    }

    const avance = Utils.buscarEnSheet(Config.SHEETS.AVANCES, 'id', id);
    if (!avance) throw new Error('Avance no encontrado');

    Utils.updateRowById(Config.SHEETS.AVANCES, id, {
      estado_revision: 'observado',
      comentario: String(comentario).trim(),
      modificado_en: Utils.ahora(),
    });
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', avance.indicador_id);
    Utils.invalidateDashboardCaches({ instrumentoId: indicador?.instrumento_id, corteId: avance.corte_id });
    return { ok: true };
  },
};