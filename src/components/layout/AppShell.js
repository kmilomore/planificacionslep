import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Outlet } from 'react-router-dom';
import { callApi } from '../../config/api';
import Sidebar from './Sidebar';
import NavigationProgress from '../ui/NavigationProgress';
import { APP_BRANDING } from '../../config/branding';

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  const prefetchRouteData = useCallback((routeKey) => {
    const emptyAccionesFilters = {
      search: '',
      estado: '',
      instrumento_id: '',
      responsable: '',
    };

    const strategies = {
      dashboard: () => queryClient.prefetchQuery({
        queryKey: ['dashboard_resumen'],
        queryFn: () => callApi('getDashboardResumen'),
        staleTime: 1000 * 60 * 5,
      }),
      indicadores: () => queryClient.prefetchQuery({
        queryKey: ['indicadores_all'],
        queryFn: () => callApi('getIndicadores', { filtros: {} }),
        staleTime: 1000 * 60 * 5,
      }),
      acciones: () => queryClient.prefetchQuery({
        queryKey: ['acciones', emptyAccionesFilters],
        queryFn: () => callApi('getAcciones', { filtros: emptyAccionesFilters }),
        staleTime: 1000 * 60 * 5,
      }),
      gantt: () => queryClient.prefetchQuery({
        queryKey: ['gantt_data'],
        queryFn: () => callApi('getGanttData'),
        staleTime: 1000 * 60 * 5,
      }),
    };

    return strategies[routeKey]?.();
  }, [queryClient]);

  useEffect(() => {
    prefetchRouteData('dashboard');
    prefetchRouteData('indicadores');
    prefetchRouteData('acciones');
    prefetchRouteData('gantt');
  }, [prefetchRouteData]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-light font-body">
      <NavigationProgress />

      {/* Sidebar desktop */}
      <div className="hidden lg:flex">
        <Sidebar onPrefetchRoute={prefetchRouteData} />
      </div>

      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50">
            <Sidebar onClose={() => setSidebarOpen(false)} onPrefetchRoute={prefetchRouteData} />
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar mobile */}
        <header className="lg:hidden bg-navy text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white/80 hover:text-white p-1"
            aria-label="Abrir menú"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <img
            src={APP_BRANDING.logoPath}
            alt={APP_BRANDING.logoAlt}
            className="w-8 h-8 rounded-full object-cover bg-white flex-shrink-0"
          />
          <span className="text-sm font-display font-bold">{APP_BRANDING.appName}</span>
        </header>

        {/* Página activa */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
