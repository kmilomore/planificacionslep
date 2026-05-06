const Dashboard = {
  getResumenGeneral(user) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const instrumentos = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INSTRUMENTOS))
      .filter(i => i.activo === true || i.activo === 'TRUE' || i.activo === 'true');
    const cortes = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.CORTES));
    const indicadores = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INDICADORES));
    const avances = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.AVANCES));

    return instrumentos.map(inst => this._buildInstrumentSummary(inst, cortes, indicadores, avances));
  },

  getResumenInstrumento(instrumento_id, user) {
    if (!instrumento_id) throw new Error('instrumento_id requerido');

    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const instrumentos = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INSTRUMENTOS));
    const cortes = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.CORTES));
    const indicadores = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INDICADORES));
    const avances = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.AVANCES));

    const instrumento = instrumentos.find(i => i.id === instrumento_id);
    if (!instrumento) throw new Error('Instrumento no encontrado');

    return this._buildInstrumentSummary(instrumento, cortes, indicadores, avances);
  },

  getGanttData(user) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const instrumentos = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INSTRUMENTOS))
      .filter(i => i.activo === true || i.activo === 'TRUE' || i.activo === 'true');
    const cortes = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.CORTES));

    return instrumentos.map(inst => ({
      instrumento: inst,
      cortes: cortes
        .filter(c => c.instrumento_id === inst.id)
        .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))
        .map(corte => ({
          ...corte,
          estado_visual: this._estadoEfectivo(corte),
          dias_para_cierre: Utils.diasHasta(corte.fecha_limite),
        })),
    }));
  },

  getMetricasCorte(corte_id, user) {
    if (!corte_id) throw new Error('corte_id requerido');

    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const corte = Utils.buscarEnSheet(Config.SHEETS.CORTES, 'id', corte_id);
    if (!corte) throw new Error('Corte no encontrado');

    const indicadores = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INDICADORES))
      .filter(i => i.instrumento_id === corte.instrumento_id && (i.activo === true || i.activo === 'TRUE' || i.activo === 'true'));
    const avances = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.AVANCES))
      .filter(a => a.corte_id === corte_id);

    const total = indicadores.length;
    const enviados = avances.length;
    const pendientes = Math.max(total - enviados, 0);

    return {
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
  },

  _buildInstrumentSummary(instrumento, cortes, indicadores, avances) {
    const cortesInst = cortes.filter(c => c.instrumento_id === instrumento.id);
    const indicadoresInst = indicadores.filter(i => i.instrumento_id === instrumento.id && (i.activo === true || i.activo === 'TRUE' || i.activo === 'true'));
    const avancesInst = avances.filter(a => indicadoresInst.some(i => i.id === a.indicador_id));

    const proximo_corte = cortesInst
      .filter(c => c.estado !== 'cerrado')
      .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))[0] || null;

    let cumplimientoPonderado = 0;
    let totalPeso = 0;

    indicadoresInst.forEach(ind => {
      const avance = avancesInst
        .filter(a => a.indicador_id === ind.id)
        .sort((a, b) => new Date(b.modificado_en || b.ingresado_en || 0) - new Date(a.modificado_en || a.ingresado_en || 0))[0];
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
      indicadores_con_avance: new Set(avancesInst.map(a => a.indicador_id)).size,
      indicadores_pendientes: Math.max(indicadoresInst.length - new Set(avancesInst.map(a => a.indicador_id)).size, 0),
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

  _cumplimientoSimple(indicadores, avances) {
    if (!indicadores.length) return 0;
    const avanceByIndicador = new Map();
    avances.forEach(av => {
      const current = avanceByIndicador.get(av.indicador_id);
      if (!current || new Date(av.modificado_en || av.ingresado_en || 0) > new Date(current.modificado_en || current.ingresado_en || 0)) {
        avanceByIndicador.set(av.indicador_id, av);
      }
    });

    const total = indicadores.reduce((acc, ind) => {
      const pct = parseFloat(avanceByIndicador.get(ind.id)?.porcentaje_cumplimiento) || 0;
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