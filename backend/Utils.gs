const Utils = {
  uuid() {
    return Utilities.getUuid();
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

  appendRow(sheetName, obj) {
    const ss      = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet   = ss.getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row     = headers.map(h => obj[h] !== undefined ? obj[h] : '');
    sheet.appendRow(row);
    return obj;
  },

  updateRowById(sheetName, id, updates) {
    const ss      = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet   = ss.getSheetByName(sheetName);
    const data    = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx   = headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id) {
        headers.forEach((h, j) => {
          if (updates[h] !== undefined) sheet.getRange(i + 1, j + 1).setValue(updates[h]);
        });
        return true;
      }
    }
    return false;
  },

  buscarEnSheet(sheetName, campo, valor, filtroExtra) {
    const ss    = SpreadsheetApp.openById(Config.SHEET_ID);
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
};
