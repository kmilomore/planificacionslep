import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderOpen } from 'lucide-react';
import EstadoBadge from './EstadoBadge';

export default function AccionesTable({ acciones }) {
  return (
    <section className="bg-white rounded-card shadow-card border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm font-body">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-[0.14em] text-xs">
            <tr>
              <th className="text-left px-5 py-4 font-semibold">Acción</th>
              <th className="text-left px-5 py-4 font-semibold">Indicador</th>
              <th className="text-left px-5 py-4 font-semibold">Instrumento</th>
              <th className="text-left px-5 py-4 font-semibold">Equipo responsable</th>
              <th className="text-left px-5 py-4 font-semibold">Compromiso</th>
              <th className="text-left px-5 py-4 font-semibold">Estado</th>
              <th className="text-left px-5 py-4 font-semibold">Avance</th>
              <th className="text-left px-5 py-4 font-semibold">Medios</th>
              <th className="text-left px-5 py-4 font-semibold">Actualización</th>
              <th className="text-left px-5 py-4 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {acciones.map((accion) => (
              <tr key={accion.id} className="border-t border-slate-100 text-slate-700 align-top">
                <td className="px-5 py-4 min-w-[240px]">
                  <p className="font-semibold text-navy">{accion.nombre}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{accion.descripcion}</p>
                </td>
                <td className="px-5 py-4 min-w-[220px] text-slate-600">{accion.indicador}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {accion.instrumento}
                  </span>
                </td>
                <td className="px-5 py-4">{accion.responsable}</td>
                <td className="px-5 py-4 whitespace-nowrap">{accion.fechaCompromiso}</td>
                <td className="px-5 py-4"><EstadoBadge estado={accion.estado} /></td>
                <td className="px-5 py-4 min-w-[140px]">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-blue" style={{ width: `${accion.avance}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-navy">{accion.avance}%</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="inline-flex items-center gap-2 text-slate-500">
                    <FolderOpen size={15} />
                    <span>{accion.medios}</span>
                  </div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-slate-500">{accion.actualizado}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                  <Link
                    to={`/acciones/${accion.id}`}
                    className="inline-flex items-center gap-2 text-blue hover:text-navy font-semibold"
                  >
                    Ver detalle
                    <ArrowUpRight size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}