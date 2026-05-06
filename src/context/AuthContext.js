import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(({ message } = {}) => {
    localStorage.removeItem('google_id_token');
    localStorage.removeItem('slep_user');
    if (message) {
      sessionStorage.setItem('auth_logout_message', message);
    }
    setUser(null);
    // Revocar sesión de Google si el SDK está disponible
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('google_id_token');
    const savedUser  = localStorage.getItem('slep_user');
    if (savedToken && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { logout(); }
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    const handleSessionExpired = (event) => {
      logout({ message: event.detail?.message });
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
  }, [logout]);

  const loginWithGoogle = (credential, userInfo) => {
    localStorage.setItem('google_id_token', credential);
    localStorage.setItem('slep_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
