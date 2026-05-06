import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import AccionesFilters from '../components/acciones/AccionesFilters';
import AccionesTable from '../components/acciones/AccionesTable';
import ResumenAcciones from '../components/acciones/ResumenAcciones';

const ACCIONES_MOCK = [
  {
    id: 'acc-001',
    nombre: 'Jornada territorial abril',
    descripcion: 'Coordinación y ejecución de jornada con comunidades escolares para levantar compromisos del trimestre.',
    indicador: 'Participación efectiva de consejos escolares',
    instrumento: 'CDC',
    responsable: 'María González',
    fechaCompromiso: '2026-04-28',
    estado: 'reportada',
    avance: 75,
    medios: 3,
    actualizado: '2026-04-24',
  },
  {
    id: 'acc-002',
    nombre: 'Mesa técnica de convivencia',
    descripcion: 'Seguimiento interáreas para consolidar plan de apoyo territorial y medidas de contención.',
    indicador: 'Implementación de apoyos de convivencia',
    instrumento: 'PAL',
    responsable: 'Carlos Riquelme',
    fechaCompromiso: '2026-05-10',
    estado: 'en_progreso',
    avance: 48,
    medios: 1,
    actualizado: '2026-05-03',
  },
  {
    id: 'acc-003',
    nombre: 'Actualización de protocolo interno',
    descripcion: 'Revisión jurídica y difusión del protocolo con equipos directivos priorizados.',
    indicador: 'Protocolos institucionales vigentes',
    instrumento: 'PMG',
    responsable: 'Daniela Soto',
    fechaCompromiso: '2026-05-20',
    estado: 'planificada',
    avance: 12,
    medios: 0,
    actualizado: '2026-05-01',
  },
  {
    id: 'acc-004',
    nombre: 'Cierre de reporte semestral',
    descripcion: 'Consolidación final de evidencias y validación de cumplimiento con jefaturas.',
    indicador: 'Reporte oportuno de gestión institucional',
    instrumento: 'PEL',
    responsable: 'María González',
    fechaCompromiso: '2026-04-15',
    estado: 'completada',
    avance: 100,
    medios: 4,
    actualizado: '2026-04-16',
  },
];

export default function Acciones() {
  const [filters, setFilters] = useState({
    search: '',
    estado: 'todos',
    instrumento: 'todos',
    responsable: 'todos',
  });

  const instrumentos = useMemo(
    () => [...new Set(ACCIONES_MOCK.map((accion) => accion.instrumento))],
    []
  );
  const responsables = useMemo(
    () => [...new Set(ACCIONES_MOCK.map((accion) => accion.responsable))],
    []
  );

  const accionesFiltradas = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return ACCIONES_MOCK.filter((accion) => {
      const matchesSearch = !search || [accion.nombre, accion.indicador, accion.responsable]
        .some((value) => value.toLowerCase().includes(search));
      const matchesEstado = filters.estado === 'todos' || accion.estado === filters.estado;
      const matchesInstrumento = filters.instrumento === 'todos' || accion.instrumento === filters.instrumento;
      const matchesResponsable = filters.responsable === 'todos' || accion.responsable === filters.responsable;

      return matchesSearch && matchesEstado && matchesInstrumento && matchesResponsable;
    });
  }, [filters]);

  const resumenCards = useMemo(() => {
    const total = ACCIONES_MOCK.length || 1;
    const count = (estado) => ACCIONES_MOCK.filter((accion) => accion.estado === estado).length;

    return [
      { key: 'total', label: 'Total acciones', value: ACCIONES_MOCK.length, helper: 'Base inicial del módulo', percent: 100, tint: '#EEF2FF', iconColor: '#25306B' },
      { key: 'planificada', label: 'Planificadas', value: count('planificada'), helper: 'Pendientes por activar', percent: Math.round((count('planificada') / total) * 100), tint: '#F1F5F9', iconColor: '#475569' },
      { key: 'en_progreso', label: 'En progreso', value: count('en_progreso'), helper: 'Seguimiento operativo', percent: Math.round((count('en_progreso') / total) * 100), tint: '#E0F2FE', iconColor: '#0369A1' },
      { key: 'reportada', label: 'Reportadas', value: count('reportada'), helper: 'Con evidencia parcial', percent: Math.round((count('reportada') / total) * 100), tint: '#FEF3C7', iconColor: '#B45309' },
      { key: 'completada', label: 'Completadas', value: count('completada'), helper: 'Cierre validado', percent: Math.round((count('completada') / total) * 100), tint: '#DCFCE7', iconColor: '#15803D' },
    ];
  }, []);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-white shadow-card border border-slate-100 p-6 lg:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-sky-50 via-cyan-50 to-transparent pointer-events-none" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-blue font-semibold font-body">Módulo Acciones</p>
            <h1 className="mt-3 text-3xl lg:text-4xl font-display font-bold text-navy">
              Gestión operativa vinculada a indicadores institucionales
            </h1>
            <p className="mt-3 text-sm lg:text-base text-slate-500 font-body max-w-2xl">
              Esta primera entrega deja lista la navegación, la estructura visual y el modelo inicial de seguimiento para avanzar luego con Apps Script, Google Sheets y medios de verificación en Drive.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/acciones/nueva"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue px-5 py-3 text-white font-semibold font-body hover:bg-navy transition-colors"
            >
              <Plus size={18} />
              Nueva acción
            </Link>
            <Link
              to="/acciones/acc-001"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-slate-700 font-semibold font-body hover:border-blue hover:text-blue transition-colors"
            >
              Ver detalle piloto
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <ResumenAcciones cards={resumenCards} />

      <AccionesFilters
        filters={filters}
        onChange={updateFilter}
        instrumentos={instrumentos}
        responsables={responsables}
      />

      <AccionesTable acciones={accionesFiltradas} />
    </div>
  );
}