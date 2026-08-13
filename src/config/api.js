import { APP_BRANDING } from './branding';

const API_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

export const SESSION_EXPIRED_EVENT = APP_BRANDING.sessionExpiredEvent;

function expireSession(message = 'Tu sesión expiró. Vuelve a iniciar sesión.') {
  localStorage.removeItem('google_id_token');
  localStorage.removeItem(APP_BRANDING.storageUserKey);
  sessionStorage.setItem('auth_logout_message', message);
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
    detail: { message },
  }));
}

export async function callApi(action, payload = {}) {
  const token = localStorage.getItem('google_id_token');
  if (!token) {
    expireSession('Tu sesión ya no es válida. Vuelve a iniciar sesión.');
    throw new Error('Sin sesión');
  }

  const response = await fetch(`${API_URL}?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ action, ...payload }),
    redirect: 'follow',
  });

  if (!response.ok) {
    if (response.status === 401) {
      expireSession('Tu sesión expiró. Vuelve a iniciar sesión.');
    }
    throw new Error(`HTTP ${response.status}`);
  }

  const json = await response.json();
  if (!json.ok) {
    if (json.code === 401) {
      expireSession(json.error || 'Tu sesión expiró. Vuelve a iniciar sesión.');
    }
    throw new Error(json.error || 'Error del servidor');
  }

  return json.data;
}
