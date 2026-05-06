const Config = {
  SHEET_ID: '1V_x0_e4QlzoRxDvZmQHU5b0C9g-0HRpNdZIlmJXJl8A',
  DIAS_RECORDATORIO_DEFAULT: 7,
  CDC_SOURCE_SHEET: 'cdccolchagua',

  SHEETS: {
    USUARIOS:     'usuarios',
    INSTRUMENTOS: 'instrumentos',
    CORTES:       'cortes',
    INDICADORES:  'indicadores',
    AVANCES:      'avances',
    ALERTAS_LOG:  'alertas_log',
  },

  SEMAFORO: {
    VERDE:    80,   // >= 80% → verde
    AMARILLO: 50,   // >= 50% → amarillo, < 50% → rojo
  },
};
