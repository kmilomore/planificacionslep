import { NavLink } from 'react-router-dom';
import { CalendarRange, ClipboardCheck, LayoutDashboard, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/acciones', label: 'Acciones', icon: ClipboardCheck },
  { to: '/gantt', label: 'Calendario', icon: CalendarRange },
];

const ADMIN_ITEMS = [
  { to: '/admin', label: 'Administración', icon: Settings },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();

  return (
    <aside className="flex flex-col h-full bg-navy text-white w-64 flex-shrink-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold font-display flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            SC
          </div>
          <div className="min-w-0">
            <p className="text-sm font-display font-bold leading-tight truncate">SLEP Colchagua</p>
            <p className="text-xs text-white/60 font-body leading-tight">Gestión Institucional</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.to} {...item} onClose={onClose} />
        ))}

        {user?.rol === 'admin' && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-widest font-body">Admin</p>
            </div>
            {ADMIN_ITEMS.map((item) => (
              <SidebarLink key={item.to} {...item} onClose={onClose} />
            ))}
          </>
        )}
      </nav>

      {/* User / logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {user?.nombre?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold font-body truncate">{user?.nombre}</p>
            <p className="text-xs text-white/50 font-body capitalize truncate">
              {user?.rol?.replace('_', ' ')}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full text-left text-xs text-white/50 hover:text-white/80 transition-colors font-body py-1"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon, onClose }) {
  const Icon = icon;

  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-colors',
          isActive
            ? 'bg-white/15 text-white font-semibold'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )
      }
    >
      <Icon size={18} strokeWidth={2.1} />
      {label}
    </NavLink>
  );
}
