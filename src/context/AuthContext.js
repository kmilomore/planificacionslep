import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { SESSION_EXPIRED_EVENT } from '../config/api';
import { APP_BRANDING } from '../config/branding';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(APP_BRANDING.publicUser);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(({ message } = {}) => {
    localStorage.removeItem('google_id_token');
    localStorage.removeItem(APP_BRANDING.storageUserKey);
    if (message) {
      sessionStorage.setItem('auth_logout_message', message);
    }
    setUser(APP_BRANDING.publicUser);
  }, []);

  useEffect(() => {
    const savedUser  = localStorage.getItem(APP_BRANDING.storageUserKey);
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { logout(); }
    } else {
      localStorage.setItem(APP_BRANDING.storageUserKey, JSON.stringify(APP_BRANDING.publicUser));
      setUser(APP_BRANDING.publicUser);
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
    const nextUser = userInfo || APP_BRANDING.publicUser;
    if (credential) {
      localStorage.setItem('google_id_token', credential);
    }
    localStorage.setItem(APP_BRANDING.storageUserKey, JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const enterPortal = useCallback(() => {
    localStorage.setItem(APP_BRANDING.storageUserKey, JSON.stringify(APP_BRANDING.publicUser));
    setUser(APP_BRANDING.publicUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, enterPortal }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
