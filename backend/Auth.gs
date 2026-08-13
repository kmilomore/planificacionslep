const Auth = {
  TOKEN_CACHE_VERSION: 'v1',
  TOKEN_CACHE_TTL: 300,
  PUBLIC_USER: {
    id: 'public-demo-user',
    email: 'invitado@demo.local',
    nombre: 'Invitado Demo',
    rol: 'admin',
    area: 'Acceso abierto',
    activo: true,
  },

  /**
   * Valida un Google id_token y verifica que el email esté en la lista
   * blanca (hoja 'usuarios' con activo = TRUE).
   * Retorna el objeto usuario o null si no autorizado.
   */
  validarToken(idToken) {
    if (!idToken) return null;

    const cachedEmail = this.getCachedEmail_(idToken);
    if (cachedEmail) {
      return this.findActiveUserByEmail_(cachedEmail);
    }

    const payload = this.fetchTokenPayload_(idToken);
    if (!payload) return null;

    const email = payload.email;
    if (!email) return null;

    this.putCachedEmail_(idToken, email, payload.exp);

    return this.findActiveUserByEmail_(email);
  },

  fetchTokenPayload_(idToken) {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (resp.getResponseCode() !== 200) return null;

    try {
      return JSON.parse(resp.getContentText());
    } catch (e) {
      return null;
    }
  },

  findActiveUserByEmail_(email) {
    return Utils.buscarEnSheet(
      Config.SHEETS.USUARIOS,
      'email',
      email,
      row => Utils.isActiveFlag(row.activo)
    );
  },

  getCachedEmail_(idToken) {
    return CacheService.getScriptCache().get(this.getTokenCacheKey_(idToken));
  },

  putCachedEmail_(idToken, email, exp) {
    const ttl = this.resolveTokenCacheTtl_(exp);
    if (ttl <= 0) return;

    CacheService.getScriptCache().put(this.getTokenCacheKey_(idToken), email, ttl);
  },

  resolveTokenCacheTtl_(exp) {
    const nowSeconds = Math.floor(Date.now() / 1000);
    const remainingSeconds = Number(exp || 0) - nowSeconds - 30;
    if (remainingSeconds <= 0) {
      return 0;
    }

    return Math.max(30, Math.min(this.TOKEN_CACHE_TTL, remainingSeconds));
  },

  getTokenCacheKey_(idToken) {
    return `auth:token:${this.hashString_(idToken)}:${this.TOKEN_CACHE_VERSION}`;
  },

  hashString_(value) {
    const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value);
    return digest
      .map((byte) => {
        const normalized = byte < 0 ? byte + 256 : byte;
        return normalized.toString(16).padStart(2, '0');
      })
      .join('');
  },

  getPublicUser() {
    return { ...this.PUBLIC_USER };
  },
};
