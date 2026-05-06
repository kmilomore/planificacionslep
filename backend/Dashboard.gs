const Dashboard = {
  getResumenGeneral(user) {
    const cacheKey = Utils.getCacheKey('resumen');
    const cached = Utils.getCachedJson(cacheKey);
    if (cached) return cached;

    const context = this._loadContext();
    const result = context.instrumentos.map(inst => this._buildInstrumentSummary(inst, context));
    return Utils.putCachedJson(cacheKey, result, 120);
  },

  getResumenInstrumento(instrumento_id, user) {
    if (!instrumento_id) throw new Error('instrumento_id requerido');

    const cacheKey = Utils.getCacheKey('instrumento', instrumento_id);
    const cached = Utils.getCachedJson(cacheKey);
    if (cached) return cached;

    const context = this._loadContext();
    const instrumento = context.instrumentosById[instrumento_id];
    if (!instrumento) throw new Error('Instrumento no encontrado');

    const result = this._buildInstrumentSummary(instrumento, context);
    return Utils.putCachedJson(cacheKey, result, 120);
  },

  getGanttData(user) {
    const cacheKey = Utils.getCacheKey('gantt');
    const cached = Utils.getCachedJson(cacheKey);
    if (cached) return cached;

    const context = this._loadContext();
    const result = context.instrumentos.map(inst => ({
      instrumento: inst,
      cortes: (context.cortesByInstrumentoId[inst.id] || [])
        .map(corte => ({
          ...corte,
          estado_visual: this._estadoEfectivo(corte),
          dias_para_cierre: Utils.diasHasta(corte.fecha_limite),
        })),
    }));
    return Utils.putCachedJson(cacheKey, result, 300);
  },

  getMetricasCorte(corte_id, user) {
    if (!corte_id) throw new Error('corte_id requerido');

    const cacheKey = Utils.getCacheKey('metricas', corte_id);
    const cached = Utils.getCachedJson(cacheKey);
    if (cached) return cached;

    const context = this._loadContext();
    const corte = context.cortesById[corte_id];
    if (!corte) throw new Error('Corte no encontrado');

    const indicadores = context.indicadoresByInstrumentoId[corte.instrumento_id] || [];
    const avances = context.avancesByCorteId[corte_id] || [];

    const total = indicadores.length;
    const enviados = avances.length;
    const pendientes = Math.max(total - enviados, 0);

    const result = {
      corte,
      total_indicadores: total,
      indicadores_con_avance: enviados,
      indicadores_pendientes: pendientes,
      aprobados: avances.filter(a => a.estado_revision === 'aprobado').length,
      observados: avances.filter(a => a.estado_revision === 'observado').length,
      semaforos: {
        verde: avances.filter(a => a.estado_semaforo === 'verde').length,
        amarillo: avances.filter(a => a.estado_semaforo === 'amarillo').length,
        rojo: avances.filter(a => a.estado_semaforo === 'rojo').length,
      },
    };
    return Utils.putCachedJson(cacheKey, result, 180);
  },

  _buildInstrumentSummary(instrumento, context) {
    const cortesInst = context.cortesByInstrumentoId[instrumento.id] || [];
    const indicadoresInst = context.indicadoresByInstrumentoId[instrumento.id] || [];
    const avancesInst = indicadoresInst
      .map(ind => context.latestAvanceByIndicadorId[ind.id])
      .filter(Boolean);
    const indicadoresConAvance = avancesInst.length;

    const proximo_corte = cortesInst
      .filter(c => c.estado !== 'cerrado')
      .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))[0] || null;

    let cumplimientoPonderado = 0;
    let totalPeso = 0;

    indicadoresInst.forEach(ind => {
      const avance = context.latestAvanceByIndicadorId[ind.id];
      const peso = parseFloat(ind.peso) || 0;
      const pct = avance ? parseFloat(avance.porcentaje_cumplimiento) || 0 : 0;
      cumplimientoPonderado += pct * peso;
      totalPeso += peso;
    });

    const cumplimiento = totalPeso > 0
      ? Math.round(cumplimientoPonderado / totalPeso)
      : this._cumplimientoSimple(indicadoresInst, avancesInst);

    return {
      instrumento,
      cumplimiento_global: cumplimiento,
      semaforo: Utils.calcularSemaforo(cumplimiento),
      total_indicadores: indicadoresInst.length,
      indicadores_con_avance: indicadoresConAvance,
      indicadores_pendientes: Math.max(indicadoresInst.length - indicadoresConAvance, 0),
      proximo_corte,
      dias_para_corte: proximo_corte ? Utils.diasHasta(proximo_corte.fecha_limite) : null,
      desglose_semaforos: {
        verde: avancesInst.filter(a => a.estado_semaforo === 'verde').length,
        amarillo: avancesInst.filter(a => a.estado_semaforo === 'amarillo').length,
        rojo: avancesInst.filter(a => a.estado_semaforo === 'rojo').length,
      },
      cortes: cortesInst.map(corte => ({
        ...corte,
        estado_visual: this._estadoEfectivo(corte),
      })),
    };
  },

  _loadContext() {
    const ss = Utils.getSpreadsheet();
    const instrumentos = Utils.getSheetObjects(Config.SHEETS.INSTRUMENTOS, ss)
      .filter(i => Utils.isTruthy(i.activo));
    const cortes = Utils.getSheetObjects(Config.SHEETS.CORTES, ss)
      .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite));
    const indicadores = Utils.getSheetObjects(Config.SHEETS.INDICADORES, ss)
      .filter(i => Utils.isTruthy(i.activo));
    const avances = Utils.getSheetObjects(Config.SHEETS.AVANCES, ss);

    return {
      instrumentos,
      instrumentosById: Utils.indexBy(instrumentos, 'id'),
      cortesById: Utils.indexBy(cortes, 'id'),
      cortesByInstrumentoId: Utils.groupBy(cortes, 'instrumento_id'),
      indicadoresByInstrumentoId: Utils.groupBy(indicadores, 'instrumento_id'),
      avancesByCorteId: Utils.groupBy(avances, 'corte_id'),
      latestAvanceByIndicadorId: Utils.latestBy(avances, 'indicador_id', ['modificado_en', 'ingresado_en']),
    };
  },

  _cumplimientoSimple(indicadores, avances) {
    if (!indicadores.length) return 0;
    const avanceByIndicador = Utils.indexBy(avances, 'indicador_id');

    const total = indicadores.reduce((acc, ind) => {
      const pct = parseFloat((avanceByIndicador[ind.id] || {}).porcentaje_cumplimiento) || 0;
      return acc + pct;
    }, 0);

    return Math.round(total / indicadores.length);
  },

  _estadoEfectivo(corte) {
    if (corte.estado === 'cerrado') return 'cerrado';

    const hoy = new Date();
    const inicio = new Date(corte.fecha_inicio);
    const limite = new Date(corte.fecha_limite);

    if (limite < hoy) return 'vencido';
    if (inicio <= hoy) return 'en_curso';
    return 'pendiente';
  },
};