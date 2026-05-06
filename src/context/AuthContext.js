import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('google_id_token');
    const savedUser  = localStorage.getItem('slep_user');
    if (savedToken && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { logout(); }
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = (credential, userInfo) => {
    localStorage.setItem('google_id_token', credential);
    localStorage.setItem('slep_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('google_id_token');
    localStorage.removeItem('slep_user');
    setUser(null);
    // Revocar sesión de Google si el SDK está disponible
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
