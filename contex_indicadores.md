# Contexto del Modulo Indicadores

## Objetivo

`src/pages/Indicadores.js` concentra una vista global de indicadores para consulta transversal.

Su funcion es permitir revisar todos los indicadores del sistema en una sola pantalla, sin obligar al usuario a entrar primero a un instrumento especifico.

La pagina prioriza descubrimiento, filtrado y acceso rapido al detalle del indicador dentro de su instrumento.

## Responsabilidad funcional

La pagina:
- consulta todos los indicadores con `useTodosLosIndicadores()`
- consulta instrumentos con `useInstrumentos()` para decorar cada indicador con su instrumento
- construye un `responsable_operativo` usando `subdimension`
- genera filtros locales por texto, instrumento, tipo de indicador y responsable
- calcula KPIs simples sobre el conjunto filtrado
- muestra un listado compacto de indicadores con acceso a su detalle
- navega a `/instrumento/:id?indicador=:indicadorId` para abrir el indicador en contexto

## Dependencias principales

- `useTodosLosIndicadores()` para obtener la base completa de indicadores
- `useInstrumentos()` para resolver codigo y nombre del instrumento
- `react-router-dom` para navegar al detalle de instrumento con query param `indicador`
- `Alert` para mostrar errores
- `Skeleton` para loading inicial
- `lucide-react` para iconos de filtros y busqueda

## Estructura visual

### Hero superior
- etiqueta `Módulo Indicadores`
- titulo principal
- texto de contexto sobre el objetivo de la vista

### KPIs
- indicadores visibles
- indicadores activos
- indicadores sin meta
- responsables unicos

### Filtros
- busqueda libre
- tipo de indicador
- responsable
- instrumento

### Listado principal
Cada tarjeta o fila muestra:
- codigo del indicador
- nombre
- dimension y subdimension
- instrumento
- tipo de indicador
- responsable
- meta
- badge de estado activo/inactivo
- link `Ver indicador`

## Contrato esperado del backend

### `useTodosLosIndicadores()`
Esta consulta depende de que `getIndicadores` soporte ser invocado sin `instrumento_id`.

Cada indicador debe incluir al menos:
- `id`
- `instrumento_id`
- `codigo_indicador`
- `nombre`
- `dimension`
- `subdimension`
- `tipo_meta`
- `meta_valor`
- `unidad`
- `activo`

### `useInstrumentos()`
Cada instrumento debe incluir al menos:
- `id`
- `codigo`
- `nombre`

## Reglas de negocio visibles

- el responsable visible del indicador en esta vista es `subdimension`
- el filtro de responsable trabaja sobre ese valor visible, no sobre `responsable_id`
- la vista puede mostrar indicadores de todos los instrumentos al mismo tiempo
- el acceso al detalle del indicador se resuelve navegando al instrumento correspondiente con query param `indicador`
- si no hay meta registrada, la UI debe mostrar `Sin meta`

## Estados especiales

### Loading
Mientras cargan indicadores o instrumentos, la pagina muestra `IndicadoresSkeleton()`.

### Error
Si falla la consulta principal, se muestra `Alert`.

### Sin resultados
Si los filtros no encuentran coincidencias, la pagina muestra un empty state explicito.

## Logica clave

### Enriquecimiento de datos
`enrichedIndicadores` cruza indicadores con instrumentos para agregar:
- `instrumento`
- `responsable_operativo`

### Opciones de filtros
Las opciones de tipo y responsable se calculan como listas unicas sobre el dataset enriquecido.

### Filtrado final
`indicadoresFiltrados` aplica en frontend:
- filtro por instrumento
- filtro por tipo
- filtro por responsable
- busqueda libre por codigo, nombre, dimension, subdimension o instrumento

### KPIs
Las tarjetas superiores se calculan sobre el conjunto ya filtrado, no sobre el dataset completo.

## Riesgos al tocar este modulo

- si `getIndicadores` vuelve a requerir `instrumento_id`, la pagina deja de funcionar
- si `subdimension` cambia de significado, el filtro de responsable deja de representar la realidad operativa
- si se rompe el query param `indicador`, el acceso directo desde esta vista al detalle pierde contexto

## Supuestos y deudas actuales

- `responsable_operativo` se deriva desde `subdimension` y no necesariamente representa una entidad responsable canonica del modelo de datos
- `activo` puede llegar tipado de forma inconsistente, como boolean o como string, lo que obliga a resolver casos en frontend
- la vista carga todos los indicadores, aplica filtros locales y calcula KPIs completamente en frontend
- existe una dependencia fuerte con la navegacion a `/instrumento/:id?indicador=:indicadorId`, por lo que un cambio en esa ruta o en el query param rompe el acceso contextual al detalle

## Pendientes naturales

- agregar filtros por estado activo/inactivo y por dimension
- permitir ordenamiento por codigo, responsable o instrumento
- agregar exportacion del listado filtrado
- incorporar acciones mas rapidas desde la misma vista, como abrir avance o crear accion