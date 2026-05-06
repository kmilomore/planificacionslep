export default function AccionesFilters({ filters, onChange, instrumentos, responsables }) {
  return (
    <section className="bg-white rounded-card shadow-card p-5 border border-slate-100">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <label className="flex flex-col gap-2 text-sm font-body text-slate-600">
          Buscar
          <input
            type="search"
            value={filters.search}
            onChange={(event) => onChange('search', event.target.value)}
            placeholder="Acción, indicador o responsable"
            className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-body text-slate-600">
          Estado
          <select
            value={filters.estado}
            onChange={(event) => onChange('estado', event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue bg-white"
          >
            <option value="todos">Todos</option>
            <option value="planificada">Planificada</option>
            <option value="en_progreso">En progreso</option>
            <option value="reportada">Reportada</option>
            <option value="completada">Completada</option>
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-body text-slate-600">
          Instrumento
          <select
            value={filters.instrumento}
            onChange={(event) => onChange('instrumento', event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue bg-white"
          >
            <option value="todos">Todos</option>
            {instrumentos.map((instrumento) => (
              <option key={instrumento} value={instrumento}>{instrumento}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-body text-slate-600">
          Responsable
          <select
            value={filters.responsable}
            onChange={(event) => onChange('responsable', event.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue bg-white"
          >
            <option value="todos">Todos</option>
            {responsables.map((responsable) => (
              <option key={responsable} value={responsable}>{responsable}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}