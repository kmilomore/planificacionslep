import { useState } from 'react';
import clsx from 'clsx';
import TabUsuarios     from '../components/admin/TabUsuarios';
import TabInstrumentos from '../components/admin/TabInstrumentos';
import TabIndicadores  from '../components/admin/TabIndicadores';
import TabCortes       from '../components/admin/TabCortes';
import TabAuditoria    from '../components/admin/TabAuditoria';

const TABS = [
  { id: 'usuarios',      label: 'Usuarios' },
  { id: 'instrumentos',  label: 'Instrumentos' },
  { id: 'indicadores',   label: 'Indicadores' },
  { id: 'cortes',        label: 'Cortes' },
  { id: 'auditoria',     label: 'Auditoría' },
];

export default function Admin() {
  const [tab, setTab] = useState('usuarios');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-navy">Administración</h1>
        <p className="text-sm text-gray-500 font-body mt-1">Gestión de datos maestros del sistema</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-body font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-blue text-blue'
                : 'border-transparent text-gray-500 hover:text-navy'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'usuarios'     && <TabUsuarios />}
      {tab === 'instrumentos' && <TabInstrumentos />}
      {tab === 'indicadores'  && <TabIndicadores />}
      {tab === 'cortes'       && <TabCortes />}
      {tab === 'auditoria'    && <TabAuditoria />}
    </div>
  );
}
