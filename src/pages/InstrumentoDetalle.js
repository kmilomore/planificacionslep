import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  useAprobarAvance,
  useAcciones,
  useAccionesPorIndicador,
  useAvancesPorCorte,
  useCortesPorInstrumento,
  useIndicadores,
  useInstrumentos,
  useObservarAvance,
  useUpdateIndicador,
  useUsuarios,
} from '../hooks/useApi';
import Alert from '../components/ui/Alert';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';

const TIPO_META_OPS = ['porcentaje', 'numero', 'booleano', 'texto'];

const CAMPOS_EDITABLES_INDICADOR = [
  { key: 'nombre', label: 'Nombre', tipo: 'text' },
  { key: 'dimension', label: 'Dimensión', tipo: 'text' },
  { key: 'subdimension', label: 'Subdimensión', tipo: 'text' },
  { key: 'tipo_meta', label: 'Tipo de meta', tipo: 'select_tipo' },
  { key: 'meta_valor', label: 'Meta', tipo: 'text' },
  { key: 'unidad', label: 'Unidad', tipo: 'text' },
  { key: 'peso', label: 'Peso (%)', tipo: 'text' },
  { key: 'responsable_id', label: 'Responsable', tipo: 'select_user' },
  { key: 'formula', label: 'Fórmula', tipo: 'textarea' },
  { key: 'fuente_verificacion', label: 'Medio de verificación', tipo: 'textarea' },
  { key: 'descripcion', label: 'Descripción', tipo: 'textarea' },
];

export default function InstrumentoDetalle() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: instrumentos = [], isLoading: loadingInst } = useInstrumentos();
  const { data: usuarios = [] } = useUsuarios();
  const { data: indicadores = [], isLoading: loadingIndicadores } = useIndicadores(id);
  const { data: cortes = [], isLoading: loadingCortes } = useCortesPorInstrumento(id);
  const [corteId, setCorteId] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [detalleForm, setDetalleForm] = useState({});
  const [editandoDetalle, setEditandoDetalle] = useState(false);
  const [observando, setObservando] = useState(null);
  const [comentarioObservacion, setComentarioObservacion] = useState('');
  const requestedCorteId = searchParams.get('corte') || '';
  const requestedIndicadorId = searchParams.get('indicador') || '';

  useEffect(() => {
    if (!cortes.length) return;
    if (requestedCorteId && cortes.some((corte) => corte.id === requestedCorteId)) {
      setCorteId(requestedCorteId);
      return;
    }

    const abierto = cortes.find((corte) => corte.estado !== 'cerrado');
    setCorteId((actual) => actual || abierto?.id || cortes[0].id);
  }, [cortes, requestedCorteId]);

  const { data: avances = [], isLoading: loadingAvances } = useAvancesPorCorte(corteId);
  const { data: accionesInstrumentoData } = useAcciones({ instrumento_id: id });
  const aprobarMut = useAprobarAvance(corteId, id);
  const observarMut = useObservarAvance(corteId, id);
  const updateIndicadorMut = useUpdateIndicador(id);
  const indicadorDetalleId = detalle?.indicador?.id || '';
  const { data: accionesRelacionadasData, isLoading: loadingAccionesRelacionadas } = useAccionesPorIndicador(indicadorDetalleId);

  const instrumento = instrumentos.find((inst) => inst.id === id);
  const corteActual = cortes.find((corte) => corte.id === corteId);
  const puedeEditarIndicador = user?.rol === 'admin';
  const accionesInstrumento = useMemo(() => {
    if (Array.isArray(accionesInstrumentoData)) return accionesInstrumentoData;
    return accionesInstrumentoData?.items || [];
  }, [accionesInstrumentoData]);
  const accionesPlanificadasPorIndicador = useMemo(() => {
    const counts = new Map();

    accionesInstrumento.forEach((accion) => {
      if (accion.estado !== 'planificada' || !accion.indicador_id) return;
      counts.set(accion.indicador_id, (counts.get(accion.indicador_id) || 0) + 1);
    });

    return counts;
  }, [accionesInstrumento]);

  const filas = useMemo(() => {
    const avanceByIndicador = new Map(avances.map((avance) => [avance.indicador_id, avance]));
    return indicadores.map((indicador) => ({
      indicador,
      avance: avanceByIndicador.get(indicador.id) || null,
      accionesPlanificadas: accionesPlanificadasPorIndicador.get(indicador.id) || 0,
      puedeEditar: user?.rol === 'admin' || indicador.responsable_id === user?.id,
      puedeRevisar: user?.rol === 'admin' || user?.rol === 'director_ejecutivo',
    }));
  }, [accionesPlanificadasPorIndicador, avances, indicadores, user]);

  const accionesRelacionadas = useMemo(() => {
    if (Array.isArray(accionesRelacionadasData)) return accionesRelacionadasData;
    return accionesRelacionadasData?.items || [];
  }, [accionesRelacionadasData]);

  useEffect(() => {
    if (!requestedIndicadorId || !filas.length) return;

    const fila = filas.find(({ indicador }) => indicador.id === requestedIndicadorId);
    if (!fila) return;

    abrirDetalle(fila.indicador, fila.avance);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('indicador');
    setSearchParams(nextParams, { replace: true });
  }, [filas, requestedIndicadorId, searchParams, setSearchParams]);

  const nombreUsuario = (userId) => usuarios.find((entry) => entry.id === userId)?.nombre || '—';
  const responsableOperativo = (indicador) => {
    const equipo = String(indicador?.equipo_trabajo || indicador?.subdimension || '').trim();
    return equipo || nombreUsuario(indicador?.responsable_id);
  };

  const abrirDetalle = (indicador, avance) => {
    setDetalle({ indicador, avance });
    setDetalleForm(buildDetalleForm(indicador));
    setEditandoDetalle(false);
  };

  const cerrarDetalle = () => {
    setDetalle(null);
    setDetalleForm({});
    setEditandoDetalle(false);
  };

  const aprobar = async (avance) => {
    try {
      await aprobarMut.mutateAsync({ id: avance.id });
      setFeedback({ type: 'success', msg: 'Avance aprobado.' });
    } catch (error) {
      setFeedback({ type: 'error', msg: error.message });
    }
  };

  const abrirObservacion = (fila) => {
    setObservando(fila);
    setComentarioObservacion(fila?.avance?.comentario || '');
  };

  const observar = async () => {
    if (!observando?.avance?.id) return;
    try {
      await observarMut.mutateAsync({
        id: observando.avance.id,
        data: { comentario: comentarioObservacion },
      });
      setFeedback({ type: 'success', msg: 'Avance observado.' });
      setObservando(null);
      setComentarioObservacion('');
    } catch (error) {
      setFeedback({ type: 'error', msg: error.message });
    }
  };

  const guardarDetalle = async () => {
    if (!detalle?.indicador?.id) return;
    try {
      await updateIndicadorMut.mutateAsync({ id: detalle.indicador.id, data: detalleForm });
      setDetalle((actual) => (
        actual
          ? { ...actual, indicador: { ...actual.indicador, ...detalleForm } }
          : actual
      ));
      setFeedback({ type: 'success', msg: 'Indicador actualizado.' });
      setEditandoDetalle(false);
    } catch (error) {
      setFeedback({ type: 'error', msg: error.message });
    }
  };

  if (loadingInst || loadingIndicadores || loadingCortes) {
    return <div className="p-6 flex justify-center"><Spinner size="lg" /></div>;
  }

  if (!instrumento) {
    return <div className="p-6 text-sm text-red font-body">Instrumento no encontrado.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {feedback && <Alert type={feedback.type} message={feedback.msg} onClose={() => setFeedback(null)} />}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-sm text-blue hover:underline font-body">← Volver al dashboard</Link>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1 rounded-full text-white font-body" style={{ background: instrumento.color_hex || '#25306B' }}>
              {instrumento.codigo}
            </span>
            <h1 className="text-2xl font-display font-bold text-navy">{instrumento.nombre}</h1>
          </div>
          <p className="text-sm text-gray-500 font-body mt-2 max-w-3xl">{instrumento.descripcion || 'Revisa los indicadores del instrumento y registra avances por corte.'}</p>
        </div>

        <div className="bg-white rounded-card shadow-card p-4 min-w-72">
          <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">Corte activo</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
            value={corteId}
            onChange={(e) => setCorteId(e.target.value)}
          >
            {cortes.map((corte) => (
              <option key={corte.id} value={corte.id}>{corte.nombre_corte}</option>
            ))}
          </select>
          {corteActual && (
            <p className="text-xs text-gray-500 font-body mt-2">
              Estado: <span className="font-semibold text-navy">{corteActual.estado}</span> · Límite: {corteActual.fecha_limite}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-card shadow-card overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm font-body">
          <thead>
            <tr className="text-left text-xs font-semibold text-white" style={{ background: '#25306B' }}>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Indicador</th>
              <th className="px-4 py-3">Meta</th>
              <th className="px-4 py-3 text-center">Acciones planificadas</th>
              <th className="px-4 py-3 text-center">Cumplimiento</th>
              <th className="px-4 py-3 text-center">Semáforo</th>
              <th className="px-4 py-3 text-center">Estado de gestión</th>
              <th className="px-4 py-3">Responsable</th>
              <th className="px-4 py-3">Último comentario</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filas.map(({ indicador, avance, accionesPlanificadas, puedeEditar, puedeRevisar }, index) => {
              const estadoGestion = getEstadoGestion(avance);

              return (
                <tr key={indicador.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-navy">{indicador.codigo_indicador}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div className="font-medium">{indicador.nombre}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {indicador.dimension || 'Sin dimensión'}
                      {indicador.equipo_trabajo ? ` · ${indicador.equipo_trabajo}` : indicador.subdimension ? ` · ${indicador.subdimension}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{indicador.meta_valor || '—'} {indicador.unidad || ''}</div>
                    <div className="text-xs text-gray-400 mt-1">{indicador.fecha_cumplimiento_2026 || 'Sin fecha de cumplimiento'}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex min-w-10 items-center justify-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {accionesPlanificadas}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-navy">{avance ? `${avance.porcentaje_cumplimiento}%` : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getSemaforoBadgeClass(avance?.estado_semaforo)}`}>
                      {avance?.estado_semaforo || 'sin dato'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoGestion.badgeClassName}`}>
                      {estadoGestion.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{responsableOperativo(indicador)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs">{avance?.comentario || 'Sin comentario'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3 flex-wrap">
                      <button
                        onClick={() => abrirDetalle(indicador, avance)}
                        className="text-xs text-navy hover:underline font-medium"
                      >
                        Ver detalle
                      </button>

                      {corteActual?.estado === 'cerrado' ? (
                        <span className="text-xs text-gray-400">Corte cerrado</span>
                      ) : puedeEditar ? (
                        <Link
                          to={`/avance/${indicador.id}/${corteId}`}
                          className="text-xs text-blue hover:underline font-medium"
                        >
                          {avance ? 'Editar avance' : 'Ingresar avance'}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">Sin permiso</span>
                      )}

                      {puedeRevisar && avance?.id && (
                        <>
                          <button
                            onClick={() => aprobar(avance)}
                            disabled={aprobarMut.isPending || avance.estado_revision === 'aprobado'}
                            className="text-xs text-green-700 hover:underline font-medium disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => abrirObservacion({ indicador, avance })}
                            disabled={observarMut.isPending}
                            className="text-xs text-yellow-700 hover:underline font-medium disabled:opacity-50"
                          >
                            Observar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {!filas.length && !loadingAvances && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-400">No hay indicadores para este instrumento.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {loadingAvances && <div className="flex justify-center"><Spinner /></div>}

      <Modal
        open={!!detalle}
        onClose={cerrarDetalle}
        title={detalle ? `${detalle.indicador.codigo_indicador} · ${detalle.indicador.nombre}` : 'Detalle del indicador'}
        size="xl"
      >
        {detalle && (
          <div className="space-y-5 font-body text-sm">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-gray-500">Revisa el indicador, su avance y las acciones vinculadas al corte seleccionado.</p>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {corteActual?.estado !== 'cerrado' && (user?.rol === 'admin' || detalle.indicador.responsable_id === user?.id) && (
                  <Link
                    to={`/avance/${detalle.indicador.id}/${corteId}`}
                    className="px-3 py-1.5 text-xs border border-blue/20 text-blue rounded-lg hover:bg-blue/5"
                  >
                    {detalle.avance?.id ? 'Editar avance' : 'Ingresar avance'}
                  </Link>
                )}
                <Link
                  to="/acciones"
                  className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:border-blue hover:text-blue"
                >
                  Ir a acciones
                </Link>
                {puedeEditarIndicador && (
                  <div className="flex items-center gap-2">
                    {editandoDetalle ? (
                      <>
                        <button
                          onClick={() => {
                            setDetalleForm(buildDetalleForm(detalle.indicador));
                            setEditandoDetalle(false);
                          }}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancelar edición
                        </button>
                        <button
                          onClick={guardarDetalle}
                          disabled={updateIndicadorMut.isPending}
                          className="px-3 py-1.5 text-xs bg-blue text-white rounded-lg hover:bg-navy disabled:opacity-50"
                        >
                          {updateIndicadorMut.isPending ? 'Guardando…' : 'Guardar indicador'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditandoDetalle(true)}
                        className="px-3 py-1.5 text-xs bg-navy text-white rounded-lg hover:bg-blue"
                      >
                        Editar información
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <ResumenCard
                label="Cumplimiento"
                value={detalle.avance ? `${detalle.avance.porcentaje_cumplimiento}%` : 'Sin dato'}
                helper={detalle.indicador.meta_valor ? `Meta ${detalle.indicador.meta_valor} ${detalle.indicador.unidad || ''}`.trim() : 'Sin meta registrada'}
                tone="blue"
              />
              <ResumenCard
                label="Estado de gestión"
                value={getEstadoGestion(detalle.avance).label}
                helper={detalle.avance?.estado_revision || 'Sin revisión'}
                tone="emerald"
              />
              <ResumenCard
                label="Responsable"
                value={responsableOperativo(detalle.indicador)}
                helper={detalle.indicador.dimension || 'Sin dimensión'}
                tone="slate"
              />
              <ResumenCard
                label="Acciones relacionadas"
                value={String(accionesRelacionadas.length)}
                helper={loadingAccionesRelacionadas ? 'Buscando acciones...' : 'Vinculadas a este indicador'}
                tone="amber"
              />
            </div>

            {!editandoDetalle && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Vista operativa</p>
                    <h3 className="mt-1 text-base font-semibold text-navy">Lectura rápida del indicador</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-medium ${getSemaforoBadgeClass(detalle.avance?.estado_semaforo)}`}>
                      Semáforo: {detalle.avance?.estado_semaforo || 'sin dato'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-medium text-slate-600 border border-slate-200">
                      Corte: {corteActual?.nombre_corte || 'Sin corte'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 font-medium text-slate-600 border border-slate-200">
                      Fecha objetivo: {formatDateValue(detalle.indicador.fecha_cumplimiento_2026)}
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {detalle.indicador.descripcion || 'Este indicador aún no tiene descripción operativa registrada.'}
                </p>
              </div>
            )}

            {editandoDetalle ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CAMPOS_EDITABLES_INDICADOR.map(({ key, label, tipo }) => (
                  <FormField
                    key={key}
                    label={label}
                    tipo={tipo}
                    value={detalleForm[key] ?? ''}
                    onChange={(value) => setDetalleForm((actual) => ({ ...actual, [key]: value }))}
                    usuarios={usuarios}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DetalleItem label="Dimensión" value={detalle.indicador.dimension || '—'} />
                  <DetalleItem label="Equipo de trabajo" value={detalle.indicador.equipo_trabajo || detalle.indicador.subdimension || '—'} />
                  <DetalleItem label="Estado del indicador" value={detalle.indicador.estado_indicador || '—'} />
                  <DetalleItem label="Subdimensión" value={detalle.indicador.subdimension || '—'} />
                  <DetalleItem label="Meta" value={`${detalle.indicador.meta_valor || '—'} ${detalle.indicador.unidad || ''}`} />
                  <DetalleItem label="Peso" value={detalle.indicador.peso ? `${detalle.indicador.peso}%` : '—'} />
                  <DetalleItem label="Tipo de meta" value={detalle.indicador.tipo_meta || '—'} />
                  <DetalleItem label="Ámbito de control" value={detalle.indicador.ambito_control || '—'} />
                  <DetalleItem label="Expresión de fórmula" value={detalle.indicador.expresion_formula || '—'} />
                  <DetalleItem label="Fecha de cumplimiento" value={detalle.indicador.fecha_cumplimiento_2026 || '—'} />
                  <DetalleItem label="Responsable" value={responsableOperativo(detalle.indicador)} />
                </div>

                <DetalleBlock label="Descripción" value={detalle.indicador.descripcion || 'Sin descripción'} />
                <DetalleBlock label="Fórmula" value={detalle.indicador.formula || 'Sin fórmula'} />
                <DetalleBlock label="Medio de verificación" value={detalle.indicador.fuente_verificacion || 'Sin medio de verificación'} />
                <DetalleBlock label="Nota técnica 2026" value={detalle.indicador.nota_tecnica_2026 || 'Sin nota técnica'} />
              </>
            )}

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <h3 className="text-sm font-semibold text-navy">Último avance del corte seleccionado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DetalleItem label="Valor reportado" value={detalle.avance?.valor_reportado || '—'} />
                <DetalleItem label="Cumplimiento" value={detalle.avance ? `${detalle.avance.porcentaje_cumplimiento}%` : '—'} />
                <DetalleItem label="Semáforo" value={detalle.avance?.estado_semaforo || 'sin dato'} />
                <DetalleItem label="Estado de gestión" value={getEstadoGestion(detalle.avance).label} />
              </div>
              <DetalleBlock label="Comentario" value={detalle.avance?.comentario || 'Sin comentario'} />
              <DetalleBlock label="Evidencia" value={detalle.avance?.evidencia_url || 'Sin evidencia'} isLink={!!detalle.avance?.evidencia_url} />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-sm font-semibold text-navy">Acciones relacionadas con este indicador</h3>
                  <p className="text-xs text-gray-500 mt-1">Si existen acciones ligadas al indicador, se muestran aquí para seguimiento cruzado.</p>
                </div>
                <Link to="/acciones/nueva" className="text-xs font-medium text-blue hover:underline">
                  Crear nueva acción
                </Link>
              </div>

              {loadingAccionesRelacionadas ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : accionesRelacionadas.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {accionesRelacionadas.map((accion) => (
                    <div key={accion.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-navy">{accion.nombre || 'Acción sin nombre'}</p>
                          <p className="text-xs text-slate-500 mt-1">{accion.descripcion || 'Sin descripción operativa registrada.'}</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${getAccionEstadoBadgeClass(accion.estado)}`}>
                          {accion.estado || 'sin estado'}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <MiniMetric label="Avance" value={`${Number(accion.avance || 0)}%`} />
                        <MiniMetric label="Responsable" value={accion.responsable_display || accion.responsable || '—'} />
                        <MiniMetric label="Compromiso" value={formatDateValue(accion.fecha_compromiso)} />
                        <MiniMetric label="Actualizada" value={formatDateValue(accion.updated_at || accion.created_at)} />
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-400">
                          {accion.indicador_nombre || detalle.indicador.nombre || 'Indicador relacionado'}
                        </span>
                        <Link to={`/acciones/${accion.id}`} className="text-xs font-medium text-blue hover:underline">
                          Ver acción
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-slate-600">No hay acciones vinculadas a este indicador.</p>
                  <p className="mt-1 text-xs text-slate-500">Puedes crear una acción para convertir el seguimiento del indicador en gestión operativa.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!observando}
        onClose={() => {
          setObservando(null);
          setComentarioObservacion('');
        }}
        title={observando ? `Observar ${observando.indicador.codigo_indicador}` : 'Observar avance'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 font-body">
            Ingresa la observación que quedará asociada al avance seleccionado.
          </p>
          <textarea
            rows={5}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30 resize-none"
            value={comentarioObservacion}
            onChange={(e) => setComentarioObservacion(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setObservando(null);
                setComentarioObservacion('');
              }}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-body"
            >
              Cancelar
            </button>
            <button
              onClick={observar}
              disabled={observarMut.isPending}
              className="px-4 py-2 text-sm bg-blue text-white rounded-lg hover:bg-navy transition-colors font-body disabled:opacity-50"
            >
              {observarMut.isPending ? 'Guardando…' : 'Guardar observación'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetalleItem({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-700 break-words">{value}</p>
    </div>
  );
}

function DetalleBlock({ label, value, isLink = false }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      {isLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-sm text-blue hover:underline break-all">
          {value}
        </a>
      ) : (
        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{value}</p>
      )}
    </div>
  );
}

function ResumenCard({ label, value, helper, tone = 'slate' }) {
  const tones = {
    blue: 'border-blue-100 bg-blue-50/80 text-blue',
    emerald: 'border-emerald-100 bg-emerald-50/80 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50/80 text-amber-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone] || tones.slate}`}>
      <p className="text-[11px] uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="mt-1 text-xs opacity-80">{helper}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  );
}

function buildDetalleForm(indicador) {
  return {
    nombre: indicador.nombre || '',
    dimension: indicador.dimension || '',
    subdimension: indicador.subdimension || '',
    tipo_meta: indicador.tipo_meta || 'porcentaje',
    meta_valor: indicador.meta_valor || '',
    unidad: indicador.unidad || '',
    peso: indicador.peso || '',
    responsable_id: indicador.responsable_id || '',
    formula: indicador.formula || '',
    fuente_verificacion: indicador.fuente_verificacion || '',
    descripcion: indicador.descripcion || '',
  };
}

function getEstadoGestion(avance) {
  const porcentaje = Number(avance?.porcentaje_cumplimiento || 0);
  const valorReportado = String(avance?.valor_reportado || '').trim();

  if (!avance?.id) {
    return { label: 'pendiente', badgeClassName: 'bg-gray-100 text-gray-500' };
  }

  if (porcentaje >= 100) {
    return { label: 'cumplido', badgeClassName: 'bg-emerald-100 text-emerald-700' };
  }

  if (avance.estado_revision === 'aprobado') {
    return { label: 'aprobado', badgeClassName: 'bg-green-100 text-green-700' };
  }

  if (avance.estado_revision === 'observado') {
    return { label: 'observado', badgeClassName: 'bg-yellow-100 text-yellow-700' };
  }

  if (porcentaje > 0 || valorReportado) {
    return { label: 'en proceso', badgeClassName: 'bg-blue-100 text-blue' };
  }

  return { label: 'borrador', badgeClassName: 'bg-gray-100 text-gray-500' };
}

function getSemaforoBadgeClass(estado) {
  if (estado === 'verde') return 'bg-emerald-100 text-emerald-700';
  if (estado === 'amarillo') return 'bg-amber-100 text-amber-700';
  if (estado === 'rojo') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-500';
}

function getAccionEstadoBadgeClass(estado) {
  if (estado === 'completada') return 'bg-emerald-100 text-emerald-700';
  if (estado === 'reportada') return 'bg-amber-100 text-amber-700';
  if (estado === 'en_progreso') return 'bg-blue-100 text-blue';
  if (estado === 'planificada') return 'bg-slate-100 text-slate-600';
  return 'bg-gray-100 text-gray-500';
}

function formatDateValue(value) {
  if (!value) return '—';

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(parsed);
  }

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return String(value);

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function FormField({ label, tipo, value, onChange, usuarios }) {
  return (
    <div className={tipo === 'textarea' ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-gray-600 mb-1 font-body">{label}</label>
      {tipo === 'textarea' ? (
        <textarea
          rows={4}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30 resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : tipo === 'select_user' ? (
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Selecciona responsable —</option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>{usuario.nombre}</option>
          ))}
        </select>
      ) : tipo === 'select_tipo' ? (
        <select
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {TIPO_META_OPS.map((opcion) => (
            <option key={opcion} value={opcion}>{opcion}</option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-body focus:outline-none focus:ring-2 focus:ring-blue/30"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
