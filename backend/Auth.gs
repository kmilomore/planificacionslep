const Auth = {
  /**
   * Valida un Google id_token y verifica que el email esté en la lista
   * blanca (hoja 'usuarios' con activo = TRUE).
   * Retorna el objeto usuario o null si no autorizado.
   */
  validarToken(idToken) {
    if (!idToken) return null;

    // Validar token con Google
    const url  = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (resp.getResponseCode() !== 200) return null;

    let payload;
    try {
      payload = JSON.parse(resp.getContentText());
    } catch (e) {
      return null;
    }

    const email = payload.email;
    if (!email) return null;

    // Buscar en lista blanca: hoja usuarios, activo = true
    return Utils.buscarEnSheet(
      Config.SHEETS.USUARIOS,
      'email',
      email,
      row => row.activo === true || row.activo === 'TRUE' || row.activo === 'true'
    );
  },
};
