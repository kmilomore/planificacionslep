import { useMemo, useState } from 'react';
import { useAuditoriaEventos } from '../../hooks/useApi';
import Spinner from '../ui/Spinner';
import Alert from '../ui/Alert';

const ACCION_LABELS = {
  login: 'Ingreso',
  logout: 'Salida',
  create: 'Creación',
  update: 'Actualización',
  delete: 'Eliminación',
  soft_delete: 'Desactivación',
  status_change: 'Cambio de estado',
  approve: 'Aprobación',
  observe: 'Observación',
};

const MODULO_LABELS = {
  auth: 'Autenticación',
  usuarios: 'Usuarios',
  instrumentos: 'Instrumentos',
  indicadores: 'Indicadores',
  cortes: 'Cortes',
  acciones: 'Acciones',
  avances: 'Avances',
  dashboard: 'Dashboard',
};

export default function TabAuditoria() {
  const [filtros, setFiltros] = useState({
    user_email: '',
    modulo: '',
    accion: '',
  });

  const { data: eventos = [], isLoading, isError, error, refetch, isFetching } = useAuditoriaEventos(
    useMemo(
      () => ({
        ...Object.fromEntries(
          Object.entries(filtros)
            .filter(([_, v]) => String(v || '').trim() !== '')
            .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        ),
        limit: 200,
      }),
      [filtros]
    ),
  );

  const onChangeFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const handleBuscar = (e) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="space-y-4">
      {isError && (
        <Alert
          type="error"
          message={error?.message || 'No se pudo cargar la auditoría.'}
        />
      )}

      <div className="bg-white rounded-card shadow-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-navy font-display">Auditoría de cambios</h2>
            <p className="text-xs text-gray-500 font-body">
              Revisa quién hizo qué cambios en la aplicación.
            </p>
          </div>
        </div>

        <form
          className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          onSubmit={handleBuscar}
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 font-body">
              Email usuario
            </label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={filtros.user_email}
              onChange={(e) => onChangeFiltro('user_email', e.target.value)}
              placeholder="Ej: nombre@dominio.cl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 font-body">
              Módulo
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body bg-white focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={filtros.modulo}
              onChange={(e) => onChangeFiltro('modulo', e.target.value)}
            >
              <option value="">Todos</option>
              {Object.entries(MODULO_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 font-body">
              Tipo de acción
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-body bg-white focus:outline-none focus:ring-1 focus:ring-blue focus:border-blue"
              value={filtros.accion}
              onChange={(e) => onChangeFiltro('accion', e.target.value)}
            >
              <option value="">Todas</option>
              {Object.entries(ACCION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-end">
            <button
              type="submit"
              disabled={isFetching}
              className="inline-flex items-center px-4 py-1.5 rounded-md bg-blue text-white text-sm font-medium shadow-sm hover:bg-blue/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isFetching ? 'Actualizando…' : 'Buscar'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-card shadow-card overflow-hidden">
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body min-w-[900px]">
              <thead>
                <tr
                  className="text-left text-xs font-semibold text-white"
                  style={{ background: '#25306B' }}
                >
                  <th className="px-3 py-3 w-44">Fecha / hora</th>
                  <th className="px-3 py-3 w-56">Usuario</th>
                  <th className="px-3 py-3 w-32">Módulo</th>
                  <th className="px-3 py-3 w-32">Acción</th>
                  <th className="px-3 py-3 w-32">Entidad</th>
                  <th className="px-3 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev, idx) => (
                  <tr
                    key={ev.id || idx}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {formatFechaHora(ev.timestamp)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-700">
                      <div className="font-medium text-navy">
                        {ev.user_nombre || ev.user_email || '—'}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {ev.user_email}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {ev.user_rol} {ev.user_area ? `· ${ev.user_area}` : ''}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      {MODULO_LABELS[ev.modulo] ?? ev.modulo ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue/10 text-blue text-[11px] font-medium">
                        {ACCION_LABELS[ev.accion] ?? ev.accion ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      <div className="font-mono text-[11px]">
                        {ev.entidad || '—'}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[140px]">
                        {ev.entidad_id}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-600">
                      <span className="block line-clamp-2">
                        {ev.detalle || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
                {eventos.length === 0 && !isLoading && (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-gray-400 text-sm"
                      colSpan={6}
                    >
                      Sin eventos de auditoría para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatFechaHora(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const fecha = d.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const hora = d.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${fecha} ${hora}`;
  } catch {
    return iso;
  }
}

