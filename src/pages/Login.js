import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { callApi } from '../config/api';

export default function Login() {
  const { loginWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const btnRef   = useRef(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión activa, redirigir
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // Inicializar Google Identity Services
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    const init = () => {
      if (!btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback:  handleCredential,
        auto_select: false,
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme:  'outline',
        size:   'large',
        text:   'signin_with',
        locale: 'es',
        width:  280,
      });
    };

    if (window.google) {
      init();
    } else {
      const script = document.getElementById('gsi-script');
      if (script) {
        script.addEventListener('load', init);
        return () => script.removeEventListener('load', init);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCredential = async ({ credential }) => {
    setLoading(true);
    setError('');
    try {
      localStorage.setItem('google_id_token', credential);
      const userInfo = await callApi('validarSesion');
      loginWithGoogle(credential, userInfo);
      navigate('/dashboard', { replace: true });
    } catch {
      localStorage.removeItem('google_id_token');
      setError('Correo no autorizado. Contacta al administrador del sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #2C3D9E 0%, #25306B 100%)' }}
    >
      <div className="bg-white rounded-card shadow-card w-full max-w-sm p-10 flex flex-col items-center gap-6">

        {/* Logo / cabecera */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-display font-bold"
            style={{ background: 'linear-gradient(135deg, #006BB9 0%, #25306B 100%)' }}
          >
            SC
          </div>
          <h1 className="text-xl font-display font-bold text-navy leading-tight">
            SLEP Colchagua
          </h1>
          <p className="text-sm text-gray-500 font-body">
            Sistema de Control de Gestión Institucional
          </p>
        </div>

        {/* Divisor */}
        <div className="w-full border-t border-gray-100" />

        <p className="text-sm text-gray-600 font-body text-center">
          Ingresa con tu cuenta institucional
        </p>

        {/* Botón Google */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="animate-spin h-5 w-5 text-blue" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Verificando acceso…
          </div>
        ) : (
          <div ref={btnRef} />
        )}

        {/* Error */}
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
