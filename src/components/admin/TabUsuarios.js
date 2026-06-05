import { useState } from 'react';
import { useUsuarios, useUpdateUsuario, useCreateUsuario } from '../../hooks/useApi';
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
  const createMut = useCreateUsuario();
  const [feedback, setFeedback] = useState(null);
  const [nuevo, setNuevo] = useState({
    nombre: '',
    email: '',
    rol: 'admin',
    subdireccion: '',
    subdepartamento: '',
    cargo: '',
  });

  const toggle = async (u, campo, valor) => {
    try {
      await updateMut.mutateAsync({ id: u.id, data: { [campo]: valor } });
      setFeedback({ type: 'success', msg: 'Usuario actualizado.' });
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const partesArea = [
        nuevo.subdireccion?.trim(),
        nuevo.subdepartamento?.trim(),
        nuevo.cargo?.trim(),
      ].filter(Boolean);

      const payload = {
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
        area: partesArea.join(' · '),
      };

      await createMut.mutateAsync({ data: payload });
      setFeedback({ type: 'success', msg: 'Usuario creado.' });
      setNuevo({
        nombre: '',
        email: '',
        rol: 'admin',
        subdireccion: '',
        subdepartamento: '',
        cargo: '',
      });
    } catch (e) {
      setFeedback({ type: 'error', msg: e.message });
    }
  };

  if (isLoading) return <Spinner size="lg" />;
  if (isError)   return <Alert type="error" message="No se pudo cargar la lista de usuarios." />;

  return (
    <div className="space-y-6">
      {feedback && (
        <Alert type={feedback.type} message={feedback.msg} onClose={() => setFeedback(null)} />
      )}
      <div className="bg-white rounded-card shadow-card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-navy font-display">Nuevo usuario</h2>
        <p className="text-xs text-gray-500 font-body">
          Crea usuarios directamente desde el portal. Solo perfiles con rol <span className="font-semibold">admin</span> pueden usar este formulario.
        </p>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end" onSubmit={handleCreate}>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Nombre</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={nuevo.email}
              onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Rol</label>
            <select
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body bg-white focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={nuevo.rol}
              onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
              required
            >
              <option value="admin">Administrador</option>
              <option value="subdirector">Subdirector</option>
              <option value="director_ejecutivo">Director Ejecutivo</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Subdirección / Departamento</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={nuevo.subdireccion}
              onChange={(e) => setNuevo({ ...nuevo, subdireccion: e.target.value })}
              placeholder="Ej: Subdirección de Gestión"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Subdepartamento</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={nuevo.subdepartamento}
              onChange={(e) => setNuevo({ ...nuevo, subdepartamento: e.target.value })}
              placeholder="Ej: Dept. Seguimiento CDC"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">Cargo</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={nuevo.cargo}
              onChange={(e) => setNuevo({ ...nuevo, cargo: e.target.value })}
              placeholder="Ej: Profesional, Jefe de departamento"
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={createMut.isPending}
              className="inline-flex items-center px-4 py-1.5 rounded-md bg-blue text-white text-sm font-medium shadow-sm hover:bg-blue/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {createMut.isPending ? 'Creando…' : 'Agregar usuario'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-card shadow-card overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-left text-xs font-semibold text-white" style={{ background: '#25306B' }}>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Subdirección / Depto / Cargo</th>
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
