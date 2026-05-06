# Contexto del Modulo Acciones

## Objetivo

`src/pages/Acciones.js` es la puerta de entrada al modulo operativo de acciones. Debe mostrar KPIs reales, filtros, tabla resumida y accesos rapidos al detalle o a la creacion de nuevas acciones.

## Responsabilidad funcional

La pagina:
- consulta acciones reales con `useAcciones()`
- arma filtros de UI para busqueda, estado, instrumento y equipo responsable
- calcula KPIs resumidos para cards superiores
- normaliza fechas de compromiso y actualizacion antes de renderizar la tabla
- muestra skeleton estructurado durante la carga
- navega a nueva accion o al primer detalle disponible

## Dependencias principales

- `useAcciones()` para obtener `items` y `resumen` desde backend
- `AccionesFilters` para la capa de filtros visuales
- `AccionesTable` para la tabla final
- `ResumenAcciones` para los KPIs superiores
- `Alert` para errores
- `Skeleton` para loading
- `react-router-dom` para crear o abrir una accion

## Flujo de datos

1. Se construyen `apiFilters` desde el estado local de filtros.
2. `useAcciones(apiFilters)` consulta Apps Script.
3. La respuesta se divide en:
   - `acciones` para filas reales
   - `resumen` para cards KPI
4. La UI genera listas unicas de instrumentos y responsables para poblar filtros.
5. La tabla recibe una version decorada con:
   - `fechaCompromiso` formateada
   - `actualizado` formateado
   - nombre de indicador e instrumento listos para UI

## Estructura visual

### Hero superior
- nombre del modulo
- titulo principal
- CTA a nueva accion
- CTA a la primera accion disponible

### KPIs
- total
- planificadas
- en progreso
- reportadas
- completadas

### Filtros
- busqueda libre
- estado
- instrumento
- equipo responsable

### Tabla
La tabla fue compactada para mejorar visibilidad horizontal e incluye:
- accion
- indicador
- instrumento
- equipo responsable
- compromiso
- estado
- avance
- medios
- actualizacion
- link a detalle

## Contrato esperado del backend

`Acciones.gs` debe devolver:
- `items[]`
- `resumen.total`
- `resumen.planificadas`
- `resumen.en_progreso`
- `resumen.reportadas`
- `resumen.completadas`

Cada item debe llegar decorado o con datos suficientes para construir:
- `id`
- `nombre`
- `descripcion`
- `indicador_nombre` o `indicador_codigo`
- `instrumento_codigo`
- `responsable_display` o `responsable`
- `fecha_compromiso`
- `estado`
- `avance`
- `medios_count`
- `updated_at` o `created_at`

## Reglas de negocio visibles

- el filtro llamado `responsable` ya representa equipo o area, no persona
- el lenguaje correcto en la UI es `Equipo responsable`
- si no hay acciones, se muestra mensaje operativo en vez de tabla vacia
- las fechas ISO se formatean en frontend para evitar exponer strings crudos

## Hallazgos tecnicos del modulo

- el mayor problema inicial del listado no era React sino el backend y la percepcion de carga
- la tabla necesitaba compactacion para ser usable en anchos medios
- varias fechas estaban llegando bien desde backend pero se renderizaban sin normalizacion
- cuando falta `comentarios_accion` en el backend publicado, el modulo Acciones puede parecer vacio por fallo de esquema

## Dependencias cruzadas

- `AccionesTable.js` define el render final del listado
- `AccionesFilters.js` define la entrada del usuario
- `Acciones.gs` controla reglas, filtros y decoracion real
- `useApi.js` debe mantenerse alineado con `Code.gs`

## Riesgos al tocar este modulo

- cambiar el significado de `responsable` rompe filtros y consistencia de negocio
- cambiar el contrato de `resumen` rompe KPIs
- remover normalizacion de fecha reintroduce ISO crudo en UI

## Pendientes naturales

- edicion completa desde el listado o desde un modal
- acciones bulk o vistas agrupadas por instrumento
- exportacion o indicadores de vencimiento cercano dentro del listado
