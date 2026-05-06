import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-navy mb-2">
        Dashboard
      </h1>
      <p className="text-gray-500 font-body text-sm mb-6">
        Bienvenido/a, <span className="font-semibold text-navy">{user?.nombre}</span>
        {' '}· <span className="capitalize">{user?.rol?.replace('_', ' ')}</span>
      </p>

      {/* Placeholder — Fase 4 completa con tarjetas e instrumentos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {['CDC', 'PAL', 'PEL', 'PMG'].map((codigo) => (
          <div key={codigo} className="bg-white rounded-card shadow-card p-6 flex flex-col gap-3">
            <div
              className="text-white text-xs font-semibold px-3 py-1 rounded-full self-start font-body"
              style={{ background: codigo === 'PMG' ? '#FF1D3D' : codigo === 'PAL' ? '#006BB9' : codigo === 'PEL' ? '#2C3D9E' : '#25306B' }}
            >
              {codigo}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gray-300 rounded-full w-0" />
            </div>
            <p className="text-xs text-gray-400 font-body">Sin datos aún</p>
          </div>
        ))}
      </div>
    </div>
  );
}
