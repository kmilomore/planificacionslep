import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_BRANDING } from '../config/branding';

export default function Login() {
  const { enterPortal, user } = useAuth();
  const navigate  = useNavigate();
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  // Si ya hay sesión activa, redirigir
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const logoutMessage = sessionStorage.getItem('auth_logout_message');
    if (!logoutMessage) return;

    sessionStorage.removeItem('auth_logout_message');
    setError(logoutMessage);
  }, []);

  const handleEnter = () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      enterPortal();
      navigate('/dashboard', { replace: true });
    } catch {
      setError('No fue posible abrir el portal. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
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
            src={APP_BRANDING.logoPath}
            alt={APP_BRANDING.logoAlt}
            className="w-20 h-20 object-contain drop-shadow-sm"
          />
          <h1 className="text-xl font-display font-bold text-navy leading-tight">
            {APP_BRANDING.appName}
          </h1>
          <p className="text-sm text-gray-500 font-body">
            {APP_BRANDING.appSubtitle}
          </p>
        </div>

        <div className="w-full border-t border-gray-100" />

        <p className="text-sm text-gray-600 font-body text-center">
          {APP_BRANDING.loginPrompt}
        </p>

        {/* Botón Google */}
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 font-body">
            <svg className="animate-spin h-5 w-5 text-blue" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Abriendo portal...
          </div>
        ) : (
          <button
            onClick={handleEnter}
            className="flex items-center gap-3 px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors font-body text-sm font-medium text-gray-700 shadow-sm"
          >
            <EnterIcon />
            Entrar al portal
          </button>
        )}

        {error && (
          <div className="w-full bg-red-50 border-l-4 border-red-500 text-red-700 text-sm px-4 py-3 rounded-r-lg font-body">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center font-body">
          {APP_BRANDING.loginDisclaimer}
        </p>
      </div>
    </div>
  );
}

function EnterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 5L20 12L13 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
