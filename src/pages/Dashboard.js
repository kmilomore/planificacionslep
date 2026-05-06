import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInstrumentos } from '../hooks/useApi';
import Spinner from '../components/ui/Spinner';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: instrumentos = [], isLoading } = useInstrumentos();

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-display font-bold text-navy mb-2">
        Dashboard
      </h1>
      <p className="text-gray-500 font-body text-sm mb-6">
        Bienvenido/a, <span className="font-semibold text-navy">{user?.nombre}</span>
        {' '}· <span className="capitalize">{user?.rol?.replace('_', ' ')}</span>
      </p>

      {/* Puerta de entrada a Fase 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {instrumentos.map((inst) => (
          <div key={inst.id} className="bg-white rounded-card shadow-card p-6 flex flex-col gap-3">
            <div
              className="text-white text-xs font-semibold px-3 py-1 rounded-full self-start font-body"
              style={{ background: inst.color_hex || '#25306B' }}
            >
              {inst.codigo}
            </div>
            <div>
              <h2 className="text-base font-display font-bold text-navy">{inst.nombre}</h2>
              <p className="text-xs text-gray-500 font-body mt-1">
                {inst.descripcion || 'Accede al detalle del instrumento y registra avances por corte.'}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to={`/instrumento/${inst.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue text-white text-sm font-body hover:bg-navy transition-colors"
              >
                Ver detalle
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
