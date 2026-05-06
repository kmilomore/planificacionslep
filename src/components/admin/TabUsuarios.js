import { useState } from 'react';
import { useUsuarios, useUpdateUsuario } from '../../hooks/useApi';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';

const ROL_LABELS = {
  admin: 'Administrador',
  subdirector: 'Subdirector',
  director_ejecutivo: 'Director Ejecutivo',
};

export default function TabUsuarios() {
  const { data: usuarios = [], isLoading, isError } = useUsuarios();
  const updateMut = useUpdateUsuario();
  const [feedback, setFeedback] = useState(null);

  const toggle = async (u, campo, valor) => {
    try {
      await updateMut.mutateAsync({ id: u.id, data: { [campo]: valor } });
      setFeedback({ type: 'success', msg: 'Usuario actualizado.' });
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  if (isLoading) return <Spinner size="lg" />;
  if (isError)   return <Alert type="error" message="No se pudo cargar la lista de usuarios." />;

  return (
    <div className="space-y-4">
      {feedback && (
        <Alert type={feedback.type} message={feedback.msg} onClose={() => setFeedback(null)} />
      )}
      <p className="text-sm text-gray-500 font-body">
        Agrega usuarios directamente en la hoja <code className="bg-gray-100 px-1 rounded">usuarios</code> del Google Sheet,
        o usando la función <code className="bg-gray-100 px-1 rounded">agregarUsuario()</code> en Apps Script.
      </p>

      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-left text-xs font-semibold text-white" style={{ background: '#25306B' }}>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Área</th>
              <th className="px-4 py-3 text-center">Activo</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 font-medium text-navy">{u.nombre}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue/10 text-blue text-xs px-2 py-0.5 rounded-full font-medium">
                    {ROL_LABELS[u.rol] ?? u.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.area || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggle(u, 'activo', !(u.activo === true || u.activo === 'TRUE' || u.activo === 'true'))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      u.activo === true || u.activo === 'TRUE' || u.activo === 'true'
                        ? 'bg-green-400'
                        : 'bg-gray-300'
                    }`}
                    disabled={updateMut.isPending}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      u.activo === true || u.activo === 'TRUE' || u.activo === 'true'
                        ? 'left-5'
                        : 'left-0.5'
                    }`} />
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  Sin usuarios registrados. Agrega el primer usuario desde Apps Script.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
