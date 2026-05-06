const Utils = {
  DASHBOARD_CACHE_VERSION: 'v1',

  uuid() {
    return Utilities.getUuid();
  },

  getSpreadsheet() {
    return SpreadsheetApp.openById(Config.SHEET_ID);
  },

  getSheet(sheetName, ss) {
    const spreadsheet = ss || this.getSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) throw new Error(`Hoja no encontrada: ${sheetName}`);
    return sheet;
  },

  ahora() {
    return new Date().toISOString();
  },

  diasHasta(fechaStr) {
    const hoy   = new Date();
    const fecha = new Date(fechaStr);
    return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  },

  sheetToObjects(sheet) {
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    const headers = data[0];
    return data.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h, row[i]]))
    );
  },

  getSheetObjects(sheetName, ss) {
    return this.sheetToObjects(this.getSheet(sheetName, ss));
  },

  indexBy(rows, field) {
    return rows.reduce((acc, row) => {
      acc[row[field]] = row;
      return acc;
    }, {});
  },

  groupBy(rows, field) {
    return rows.reduce((acc, row) => {
      const key = row[field];
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});
  },

  latestBy(rows, field, dateFields) {
    const latest = {};
    rows.forEach(row => {
      const key = row[field];
      const current = latest[key];
      if (!current) {
        latest[key] = row;
        return;
      }

      const rowDate = this._resolveDate(row, dateFields);
      const currentDate = this._resolveDate(current, dateFields);
      if (rowDate > currentDate) latest[key] = row;
    });
    return latest;
  },

  isTruthy(value) {
    return value === true || value === 'TRUE' || value === 'true';
  },

  appendRow(sheetName, obj) {
    const ss      = this.getSpreadsheet();
    const sheet   = this.getSheet(sheetName, ss);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row     = headers.map(h => obj[h] !== undefined ? obj[h] : '');
    sheet.appendRow(row);
    return obj;
  },

  updateRowById(sheetName, id, updates) {
    const ss      = this.getSpreadsheet();
    const sheet   = this.getSheet(sheetName, ss);
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx   = headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id) {
        const nextRow = headers.map((header, index) =>
          updates[header] !== undefined ? updates[header] : data[i][index]
        );
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([nextRow]);
        return true;
      }
    }
    return false;
  },

  buscarEnSheet(sheetName, campo, valor, filtroExtra) {
    const ss = this.getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return null;
    const rows = this.sheetToObjects(sheet);
    return rows.find(r => r[campo] === valor && (!filtroExtra || filtroExtra(r))) || null;
  },

  calcularSemaforo(porcentaje) {
    if (porcentaje >= Config.SEMAFORO.VERDE)    return 'verde';
    if (porcentaje >= Config.SEMAFORO.AMARILLO) return 'amarillo';
    return 'rojo';
  },

  calcularPorcentaje(valorReportado, metaValor, tipo) {
    if (tipo === 'booleano') return valorReportado === 'Sí' ? 100 : 0;
    if (tipo === 'texto')    return (valorReportado && valorReportado.trim().length > 0) ? 100 : 0;
    const v = parseFloat(valorReportado);
    const m = parseFloat(metaValor);
    if (isNaN(v) || isNaN(m) || m === 0) return 0;
    return Math.min(Math.round((v / m) * 100), 100);
  },

  getCacheKey(scope, id) {
    return id
      ? `dashboard:${scope}:${id}:${this.DASHBOARD_CACHE_VERSION}`
      : `dashboard:${scope}:${this.DASHBOARD_CACHE_VERSION}`;
  },

  getCachedJson(key) {
    const raw = CacheService.getScriptCache().get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  },

  putCachedJson(key, value, ttlSeconds) {
    CacheService.getScriptCache().put(key, JSON.stringify(value), ttlSeconds);
    return value;
  },

  invalidateDashboardCaches(options) {
    const opts = options || {};
    const cache = CacheService.getScriptCache();
    const keys = [
      this.getCacheKey('resumen'),
      this.getCacheKey('gantt'),
    ];

    if (opts.instrumentoId) {
      keys.push(this.getCacheKey('instrumento', opts.instrumentoId));
      this.getCorteIdsByInstrumento(opts.instrumentoId).forEach(corteId => {
        keys.push(this.getCacheKey('metricas', corteId));
      });
    }

    if (opts.corteId) {
      keys.push(this.getCacheKey('metricas', opts.corteId));
    }

    cache.removeAll(Array.from(new Set(keys)));
  },

  getCorteIdsByInstrumento(instrumentoId) {
    if (!instrumentoId) return [];
    return this.getSheetObjects(Config.SHEETS.CORTES)
      .filter(corte => corte.instrumento_id === instrumentoId)
      .map(corte => corte.id);
  },

  _resolveDate(row, fields) {
    for (let i = 0; i < fields.length; i++) {
      const value = row[fields[i]];
      if (value) return new Date(value);
    }
    return new Date(0);
  },
};
