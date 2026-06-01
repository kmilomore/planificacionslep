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
   - estado documental por medios (`medios_requeridos_count`, `medios_cumplidos_count`)

## Estructura visual

### Bloque bajo Descripcion: Medios de verificacion

Debajo del campo `Descripcion` en el constructor/edicion de acciones, debe existir un bloque de `Medios de verificacion asociados`.

Comportamiento esperado:
- selector tipo dropdown (con seleccion multiple)
- lista de medios predefinidos (ejemplo: Lista de asistencia, Acta, Fotografia, Informe, Otro)
- lo seleccionado queda asociado a la accion como requisitos de evidencia
- si no hay medios seleccionados, la accion no debe poder pasar a estado reportado/completado

Impacto en avance y cumplimiento del indicador:
- el % de avance reportado de la accion depende del cumplimiento de sus medios asociados
- cada medio asociado debe tener una evidencia subida/validada en Ingresar Avance
- el cumplimiento de la accion por medios se calcula como: `medios validados / medios asociados * 100`
- ese resultado impacta directamente el % de cumplimiento del indicador vinculado

Ejemplo operativo:
- en el constructor de acciones se declara un solo medio: `Lista de asistencia`
- al ingresar avance, se debe subir el archivo de esa lista (PDF u otro formato permitido)
- cuando ese unico medio queda cargado y validado, la accion pasa a `100%` por medios
- al ser el unico verificador asociado, el aporte de esa accion al indicador se considera completo (`100%`)

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
- `medios_requeridos[]`
- `indicador_nombre` o `indicador_codigo`
- `instrumento_codigo`
- `responsable_display` o `responsable`
- `fecha_compromiso`
- `estado`
- `avance`
- `medios_count`
- `medios_requeridos_count`
- `medios_cumplidos_count`
- `updated_at` o `created_at`

## Reglas de negocio visibles

- el filtro llamado `responsable` ya representa equipo o area, no persona
- el lenguaje correcto en la UI es `Equipo responsable`
- si no hay acciones, se muestra mensaje operativo en vez de tabla vacia
- las fechas ISO se formatean en frontend para evitar exponer strings crudos
- una accion debe tener al menos un medio de verificacion declarado
- en detalle de accion solo se pueden subir medios de tipos declarados en la accion
- backend rechaza tipos no declarados y evita duplicar el mismo tipo por accion
- los tipos de medios declarados se pueden editar en el detalle de accion (multi-seleccion)
- el cumplimiento del indicador por avance puede calcularse por cumplimiento documental cuando existen medios requeridos

## Hallazgos tecnicos del modulo (iteracion actual)

- el mayor problema inicial del listado no era React sino el backend y la percepcion de carga
- la tabla necesitaba compactacion para ser usable en anchos medios
- varias fechas estaban llegando bien desde backend pero se renderizaban sin normalizacion
- cuando falta `comentarios_accion` en el backend publicado, el modulo Acciones puede parecer vacio por fallo de esquema
- el warning `no-use-before-define` en CI de Vercel se vuelve bloqueante por `CI=true`; se resolvio reordenando declaraciones en `AccionDetalle.js`
- para coherencia funcional, el catalogo de tipos de medio fue normalizado a: `lista_asistencia`, `acta`, `fotografia`, `informe`, `otro`
- se agrego `medios_requeridos` al schema de `acciones` para persistir configuracion documental por accion
- el flujo de carga documental ahora esta endurecido en frontend y backend para impedir combinaciones no permitidas

## Iteraciones implementadas

### Iteracion 1: Definicion funcional
- se documento bloque bajo descripcion para declarar medios de verificacion asociados
- se definio impacto de medios sobre % de cumplimiento y ejemplo operativo al 100%

### Iteracion 2: Implementacion base
- `NuevaAccion` incorpora selector multiple de medios obligatorios
- `Acciones.gs` valida y persiste `medios_requeridos`
- `Setup.gs` incorpora columna `medios_requeridos` en hoja `acciones`
- `Avances.gs` calcula cumplimiento por medios cuando aplica

### Iteracion 3: Endurecimiento
- en detalle de accion solo se muestran tipos requeridos para la carga
- backend impide subir tipos fuera de lo declarado
- backend impide duplicar archivo para el mismo tipo en una accion

### Iteracion 4: Edicion operativa
- se habilita editar tipos declarados desde el detalle de accion
- guardado via `updateAccion` con validacion de al menos un tipo activo
- restablecer cambios locales de tipos antes de guardar

## Dependencias cruzadas

- `AccionesTable.js` define el render final del listado
- `AccionesFilters.js` define la entrada del usuario
- `Acciones.gs` controla reglas, filtros y decoracion real
- `useApi.js` debe mantenerse alineado con `Code.gs`
- `NuevaAccion.js` controla declaracion inicial de medios por accion
- `AccionDetalle.js` controla edicion de tipos y carga documental
- `AccionMediaSection.js` renderiza restricciones y carga de medios
- `Avances.gs` consume estado documental para calcular cumplimiento cuando hay medios asociados

## Riesgos al tocar este modulo

- cambiar el significado de `responsable` rompe filtros y consistencia de negocio
- cambiar el contrato de `resumen` rompe KPIs
- remover normalizacion de fecha reintroduce ISO crudo en UI
- cambiar llaves de `TIPOS_MEDIO` sin migracion rompe acciones ya configuradas
- editar medios requeridos sin politica de historico puede desalinear evidencias ya cargadas
- desactivar validacion backend permitiria subir evidencias no auditables contra lo declarado

## Flujo operativo vigente (resumen)

1. se crea accion con medios requeridos obligatorios
2. se puede editar lista de tipos requeridos desde detalle de accion
3. se suben evidencias solo de tipos permitidos
4. cada tipo se cumple con una evidencia (sin duplicados por tipo)
5. el avance/cumplimiento consume progreso documental cuando existe configuracion de medios

## Roadmap actualizado

### Corto plazo
- mostrar estado por tipo requerido (`pendiente` o `completo`) en la tarjeta de medios
- bloquear remocion de un tipo requerido si ya tiene evidencia cargada (o pedir reemplazo explicito)
- exponer trazabilidad: quien modifico medios requeridos y cuando

### Mediano plazo
- versionado de medios requeridos por accion para auditoria
- politica de reemplazo de evidencia por tipo (nueva version, no overwrite silencioso)
- reglas por estado: impedir `reportada/completada` si quedan medios pendientes

### Largo plazo
- matriz de cumplimiento documental por indicador y corte
- alertas automaticas de medios pendientes cercanos a fecha compromiso
- exportable de auditoria documental por accion/indicador/instrumento

## Pendientes naturales

- edicion completa desde el listado o desde un modal
- acciones bulk o vistas agrupadas por instrumento
- exportacion o indicadores de vencimiento cercano dentro del listado
