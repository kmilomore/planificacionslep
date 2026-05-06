import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callApi } from '../config/api';

export default function Login() {
  const { loginWithGoogle, user } = useAuth();
  const navigate  = useNavigate();
  const [error,   setError]   = useState('');
  // Si venimos de vuelta de OAuth ya hay un resultado pendiente → arrancar en loading
  const [loading, setLoading] = useState(
    () => !!sessionStorage.getItem('google_auth_result')
  );

  // Si ya hay sesión activa, redirigir
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleToken = useCallback(async (idToken) => {
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('google_id_token', idToken);
      const userInfo = await callApi('validarSesion');
      loginWithGoogle(idToken, userInfo);
      navigate('/dashboard', { replace: true });
    } catch {
      localStorage.removeItem('google_id_token');
      setError('Correo no autorizado. Contacta al administrador del sistema.');
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle, navigate]);

  // Recoger el resultado que auth_callback.html dejó en sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem('google_auth_result');
    if (!raw) return;
    sessionStorage.removeItem('google_auth_result');
    try {
      const result = JSON.parse(raw);
      if (result.type === 'GOOGLE_AUTH_SUCCESS') {
        handleToken(result.idToken);
      } else {
        setError('Error al autenticar con Google. Intenta de nuevo.');
        setLoading(false);
      }
    } catch {
      setError('Error al autenticar con Google. Intenta de nuevo.');
      setLoading(false);
    }
  }, [handleToken]);

  const abrirSelectorCuentas = () => {
    if (loading) return;
    setLoading(true);
    setError('');

    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

    const params = new URLSearchParams({
      client_id:     process.env.REACT_APP_GOOGLE_CLIENT_ID,
      redirect_uri:  `${window.location.origin}/auth_callback.html`,
      response_type: 'id_token',
      scope:         'openid email profile',
      nonce:         nonce,
      prompt:        'select_account',
    });

    // Redirect directo: evita el problema de COOP con popups
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'linear-gradient(rgba(19, 42, 88, 0.72), rgba(16, 34, 74, 0.82)), url(/auth.webp)' }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_40%)] pointer-events-none" />

      <div className="relative bg-white/95 backdrop-blur-sm rounded-card shadow-card w-full max-w-sm p-10 flex flex-col items-center gap-6 border border-white/30">

        {/* Logo / cabecera */}
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/SLEPCOLCHAGUA.webp"
            alt="Logo SLEP Colchagua"
            className="w-20 h-20 object-contain drop-shadow-sm"
          />
          <h1 className="text-xl font-display font-bold text-navy leading-tight">
            SLEP Colchagua
          </h1>
          <p className="text-sm text-gray-500 font-body">
            Sistema de Control de Gestión Institucional
          </p>
        </div>

        <div className="w-full border-t border-gray-100" />

        <p className="text-sm text-gray-600 font-body text-center">
          Ingresa con tu cuenta institucional
        </p>

        {/* Botón Google */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 font-body">
            <svg className="animate-spin h-5 w-5 text-blue" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Verificando acceso…
          </div>
        ) : (
          <button
            onClick={abrirSelectorCuentas}
            className="flex items-center gap-3 px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-body text-sm font-medium text-gray-700 shadow-sm"
          >
            <GoogleIcon />
            Iniciar sesión con Google
          </button>
        )}

        {error && (
          <div className="w-full bg-red-50 border-l-4 border-red-500 text-red-700 text-sm px-4 py-3 rounded-r-lg font-body">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center font-body">
          Solo personal autorizado del SLEP Colchagua
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
