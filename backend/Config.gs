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
    ACCIONES:     'acciones',
    MEDIOS_VERIFICACION: 'medios_verificacion',
    COMENTARIOS_ACCION: 'comentarios_accion',
    ALERTAS_LOG:  'alertas_log',
    AUDITORIA:    'auditoria',
  },

  DRIVE: {
    ROOT_FOLDER_NAME: 'Planificacion',
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_EXTENSIONS: ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'webp'],
    ALLOWED_MIME_TYPES: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'image/webp',
    ],
  },

  SEMAFORO: {
    VERDE:    80,   // >= 80% → verde
    AMARILLO: 50,   // >= 50% → amarillo, < 50% → rojo
  },
};
