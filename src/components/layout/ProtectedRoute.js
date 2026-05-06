import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../ui/Spinner';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <Spinner fullscreen />;
  if (!user)   return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-light">
        <div className="bg-white rounded-card shadow-card p-10 text-center max-w-sm">
          <p className="text-navy font-display font-bold text-lg mb-2">Acceso restringido</p>
          <p className="text-gray-500 text-sm font-body">
            No tienes permisos para acceder a esta sección.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
