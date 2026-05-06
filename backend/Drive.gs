const Drive = {
  ensureAccionFolder(indicadorNombre, accionNombre) {
    const root = this.getOrCreateRootFolder_();
    const indicadorFolder = this.getOrCreateChildFolder_(root, this.sanitizeName_(indicadorNombre || 'Indicador'));
    const accionFolder = this.getOrCreateChildFolder_(indicadorFolder, this.sanitizeName_(accionNombre || 'Accion'));
    return this.getOrCreateChildFolder_(accionFolder, 'Medios de Verificacion');
  },

  uploadMedio(payload, context) {
    this.validateUpload_(payload);

    const folder = this.ensureAccionFolder(context.indicadorNombre, context.accionNombre);
    const fileName = this.sanitizeName_(payload.nombre_archivo || 'archivo');
    const bytes = Utilities.base64Decode(payload.base64Content);
    const blob = Utilities.newBlob(bytes, payload.mime_type, fileName);
    const file = folder.createFile(blob).setName(fileName);

    return {
      fileId: file.getId(),
      url: file.getUrl(),
      nombreArchivo: file.getName(),
    };
  },

  validateUpload_(payload) {
    if (!payload || !payload.base64Content) {
      throw new Error('Archivo requerido para subir medio de verificación');
    }

    const extension = this.getExtension_(payload.nombre_archivo);
    if (!Config.DRIVE.ALLOWED_EXTENSIONS.includes(extension)) {
      throw new Error('Extensión de archivo no permitida');
    }

    if (payload.mime_type && !Config.DRIVE.ALLOWED_MIME_TYPES.includes(payload.mime_type)) {
      throw new Error('Tipo MIME no permitido');
    }

    if (payload.size_bytes && Number(payload.size_bytes) > Config.DRIVE.MAX_FILE_SIZE_BYTES) {
      throw new Error('El archivo excede el tamaño máximo permitido');
    }
  },

  getOrCreateRootFolder_() {
    const folders = DriveApp.getFoldersByName(Config.DRIVE.ROOT_FOLDER_NAME);
    return folders.hasNext() ? folders.next() : DriveApp.createFolder(Config.DRIVE.ROOT_FOLDER_NAME);
  },

  getOrCreateChildFolder_(parent, name) {
    const folders = parent.getFoldersByName(name);
    return folders.hasNext() ? folders.next() : parent.createFolder(name);
  },

  getExtension_(fileName) {
    const cleanName = String(fileName || '').trim().toLowerCase();
    const parts = cleanName.split('.');
    return parts.length > 1 ? parts.pop() : '';
  },

  sanitizeName_(value) {
    return String(value || '')
      .replace(/[\\/:*?"<>|#%]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 120) || 'sin_nombre';
  },
};