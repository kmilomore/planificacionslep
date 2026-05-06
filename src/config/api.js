const API_URL = process.env.REACT_APP_APPS_SCRIPT_URL;

export async function callApi(action, payload = {}) {
  const token = localStorage.getItem('google_id_token');
  if (!token) throw new Error('Sin sesión');

  const response = await fetch(`${API_URL}?token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
    redirect: 'follow',
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (!json.ok) throw new Error(json.error || 'Error del servidor');
  return json.data;
}
