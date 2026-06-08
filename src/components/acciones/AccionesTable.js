import { Link } from 'react-router-dom';
import { ArrowUpRight, FolderOpen, Pencil } from 'lucide-react';
import EstadoBadge from './EstadoBadge';

export default function AccionesTable({ acciones, canEditActions = false }) {
  return (
    <section className="bg-white rounded-card shadow-card border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-[13px] font-body leading-5">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-[0.12em] text-[11px]">
            <tr>
              <th className="text-left px-3 py-3 font-semibold">Acción</th>
              <th className="text-left px-3 py-3 font-semibold">Indicador</th>
              <th className="text-left px-3 py-3 font-semibold">Instrumento</th>
              <th className="text-left px-3 py-3 font-semibold">Equipo responsable</th>
              <th className="text-left px-3 py-3 font-semibold">Compromiso</th>
              <th className="text-left px-3 py-3 font-semibold">Estado</th>
              <th className="text-left px-3 py-3 font-semibold">Avance</th>
              <th className="text-left px-3 py-3 font-semibold">Medios</th>
              <th className="text-left px-3 py-3 font-semibold">Actualización</th>
              <th className="text-left px-3 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {acciones.map((accion) => (
              <tr key={accion.id} className="border-t border-slate-100 text-slate-700 align-top">
                <td className="px-3 py-3 min-w-[220px] max-w-[260px]">
                  <p className="font-semibold text-navy leading-5">{accion.nombre}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{accion.descripcion}</p>
                </td>
                <td className="px-3 py-3 min-w-[190px] max-w-[220px] text-slate-600">
                  <p className="line-clamp-2">{accion.indicador}</p>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                    {accion.instrumento}
                  </span>
                </td>
                <td className="px-3 py-3 min-w-[150px] max-w-[180px]">
                  <p className="line-clamp-2">{accion.responsable}</p>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-600">{accion.fechaCompromiso}</td>
                <td className="px-3 py-3 whitespace-nowrap"><EstadoBadge estado={accion.estado} /></td>
                <td className="px-3 py-3 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-blue" style={{ width: `${accion.avance}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-navy">{accion.avance}%</span>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="inline-flex items-center gap-2 text-slate-500">
                    <FolderOpen size={14} />
                    <span>{accion.medios}</span>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-slate-500">{accion.actualizado}</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1.5">
                    <Link
                      to={`/acciones/${accion.id}`}
                      className="inline-flex items-center gap-1.5 text-blue hover:text-navy font-semibold text-[13px]"
                    >
                      Ver detalle
                      <ArrowUpRight size={15} />
                    </Link>
                    {canEditActions ? (
                      <Link
                        to={`/acciones/${accion.id}?edit=1`}
                        className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-semibold text-[13px]"
                      >
                        Editar
                        <Pencil size={14} />
                      </Link>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}