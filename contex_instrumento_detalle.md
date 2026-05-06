# Contexto del Modulo Detalle de Instrumento

## Objetivo rediseñado

`src/pages/InstrumentoDetalle.js` debe dejar de sentirse como una tabla administrativa aislada y pasar a ser una vista de gestion operativa por instrumento.

El modulo debe permitir, desde un mismo flujo:
- entender rapido el estado del instrumento y sus indicadores
- entrar al detalle sin perder contexto del corte activo
- editar informacion estructural del indicador cuando el rol lo permita
- ingresar o corregir avance sin salir del hilo de trabajo
- ver si existen acciones vinculadas al indicador
- saltar al detalle de esas acciones para seguimiento cruzado

La meta UX no es solo "consultar datos", sino ayudar a decidir que hacer ahora.

## Problema del estado anterior

La experiencia previa resolvia bien la consulta basica, pero tenia tres debilidades:
- el detalle del indicador era funcional, pero poco visual y con baja jerarquia de informacion
- la edicion del indicador existia, pero no se sentia integrada a un flujo operativo
- no habia visibilidad inmediata de acciones relacionadas, aunque backend ya soporta filtrar acciones por `indicador_id`

## Vision funcional esperada

La pantalla debe comportarse como una consola de seguimiento por instrumento.

### Nivel 1. Vista general del instrumento
- encabezado con identidad del instrumento
- selector de corte activo
- tabla de indicadores con estado, responsable, cantidad de acciones declaradas y acciones disponibles

### Nivel 2. Vista operativa del indicador
Al abrir el detalle de un indicador, el usuario debe ver:
- resumen visual rapido con cumplimiento, estado de gestion, responsable y cantidad de acciones relacionadas
- bloque operativo con semaforo, corte activo y fecha objetivo
- ficha del indicador en lectura o modo edicion
- listado de acciones relacionadas con acceso directo a cada una

### Nivel 3. Accion concreta
Desde el mismo modal el usuario debe poder:
- editar el indicador si tiene permisos
- ingresar o editar avance si el corte sigue abierto
- abrir el modulo de acciones
- entrar al detalle de una accion relacionada

## Responsabilidad funcional actualizada

La pagina:
- obtiene el `id` del instrumento desde la ruta
- lee query params `corte` e `indicador`
- carga instrumentos con `useInstrumentos()`
- carga usuarios con `useUsuarios()`
- carga indicadores del instrumento con `useIndicadores(id)`
- carga cortes del instrumento con `useCortesPorInstrumento(id)`
- selecciona automaticamente el corte inicial
- carga avances del corte activo con `useAvancesPorCorte(corteId)`
- carga acciones del instrumento con `useAcciones({ instrumento_id: id })` para calcular cantidades declaradas por indicador
- deriva filas con permisos de edicion y revision
- abre el detalle del indicador al hacer click o al aterrizar por deep link
- permite editar campos del indicador cuando el usuario es `admin`
- enlaza a `/avance/:indicador_id/:corte_id` para operar el avance
- consulta acciones relacionadas con `useAccionesPorIndicador(indicadorId)` cuando un indicador esta abierto
- permite navegar a `/acciones` y `/acciones/:id` desde el detalle
- muestra feedback con `Alert`

## Dependencias principales

- `react-router-dom` para rutas, deep links y navegacion operativa
- `useAuth()` para permisos
- `useInstrumentos()` para el encabezado del modulo
- `useUsuarios()` para resolver responsables
- `useIndicadores(id)` para poblar el instrumento
- `useCortesPorInstrumento(id)` para el control del corte
- `useAvancesPorCorte(corteId)` para el estado del corte actual
- `useAcciones({ instrumento_id: id })` para contar acciones declaradas por indicador en la tabla
- `useUpdateIndicador(id)` para guardar cambios estructurales
- `useAprobarAvance()` y `useObservarAvance()` para revision de avances
- `useAccionesPorIndicador(indicadorId)` para mostrar acciones relacionadas
- `Alert`, `Modal` y `Spinner` como primitives de UI

## Estructura visual esperada

### Cabecera
- enlace `Volver al dashboard`
- badge con `instrumento.codigo`
- nombre del instrumento
- descripcion operativa
- bloque lateral del corte activo con estado y fecha limite

### Tabla de indicadores
Cada fila debe priorizar lectura operativa. Muestra:
- `codigo_indicador`
- nombre del indicador
- dimension y equipo o subdimension
- meta y fecha objetivo
- cantidad total de acciones declaradas asociadas al indicador
- cumplimiento del corte
- semaforo
- estado de gestion
- responsable, entendido como `subdimension`
- ultimo comentario
- acciones por fila

### Modal de detalle del indicador
Debe sentirse como una ficha de control, no solo como un formulario.

#### Franja superior
- contexto del indicador
- CTA para editar indicador si aplica
- CTA para ingresar o editar avance si aplica
- CTA para ir al modulo acciones

#### Resumen visual
- card de cumplimiento
- card de estado de gestion
- card de responsable, usando `subdimension`
- card de cantidad de acciones relacionadas

#### Lectura rapida
- semaforo actual
- corte activo
- fecha objetivo
- descripcion operativa corta del indicador

#### Ficha del indicador
- campos estructurales en lectura
- campos editables en modo formulario

#### Acciones relacionadas
Si hay acciones asociadas al indicador, mostrar:
- nombre de la accion
- descripcion breve
- badge de estado
- avance
- responsable
- fecha compromiso
- fecha de ultima actualizacion
- link a `/acciones/:id`

Si no hay acciones:
- estado vacio explicando que aun no existen acciones vinculadas
- CTA para crear una nueva accion

## Contrato esperado del backend

### `useInstrumentos()`
Cada instrumento debe incluir:
- `id`
- `codigo`
- `nombre`
- `descripcion`
- `color_hex`

### `useCortesPorInstrumento(id)`
Cada corte debe incluir:
- `id`
- `nombre_corte`
- `estado`
- `fecha_limite`

### `useIndicadores(id)`
Cada indicador debe incluir:
- `id`
- `codigo_indicador`
- `nombre`
- `dimension`
- `subdimension`
- `equipo_trabajo`
- `meta_valor`
- `unidad`
- `peso`
- `tipo_meta`
- `ambito_control`
- `expresion_formula`
- `fecha_cumplimiento_2026`
- `responsable_id`
- `formula`
- `fuente_verificacion`
- `descripcion`
- `nota_tecnica_2026`
- `estado_indicador`

Nota de negocio visible:
- para esta vista, `subdimension` se considera el dato principal de responsable operativo
- `responsable_id` queda como respaldo para mostrar nombre de usuario solo si `subdimension` viene vacio

### `useAvancesPorCorte(corteId)`
Cada avance debe incluir:
- `id`
- `indicador_id`
- `valor_reportado`
- `porcentaje_cumplimiento`
- `estado_semaforo`
- `estado_revision`
- `comentario`
- `evidencia_url`

### `useAccionesPorIndicador(indicadorId)`
La consulta debe exponer acciones filtradas por `indicador_id` y cada item debiera incluir al menos:
- `id`
- `indicador_id`
- `nombre`
- `descripcion`
- `estado`
- `avance`
- `responsable`
- `responsable_display`
- `fecha_compromiso`
- `created_at`
- `updated_at`
- `indicador_nombre`

### `useAcciones({ instrumento_id: id })`
La consulta se reutiliza tambien para construir la columna de acciones declaradas en la tabla.

Regla de conteo esperada:
- agrupar por `indicador_id`
- contar todas las acciones declaradas del indicador, sin importar su estado

### `useUsuarios()`
Cada usuario debe incluir:
- `id`
- `nombre`

## Reglas de negocio visibles

- si existe query param `corte` valido, ese corte se vuelve el inicial
- si no existe `corte`, se privilegia el primer corte no cerrado
- si existe query param `indicador`, se abre automaticamente el detalle del indicador al cargar filas
- despues de consumir `indicador`, se limpia de la URL
- solo `admin` puede editar informacion estructural del indicador
- puede editar avance el `admin` o el responsable del indicador
- pueden revisar avances `admin` y `director_ejecutivo`
- si el corte actual esta cerrado, no se habilita ingreso o edicion de avance
- la columna `Acciones declaradas` muestra el total de acciones del instrumento agrupadas por `indicador_id`, sin filtrar por estado
- en esta vista el responsable visible del indicador es `subdimension`
- las acciones relacionadas se consultan solo cuando un indicador esta abierto
- el estado de gestion visible se sigue calculando en frontend con `getEstadoGestion(avance)`

## Estados especiales

### Loading inicial
Si cargan instrumento, indicadores o cortes, se muestra `Spinner` centrado.

### Instrumento inexistente
Si el `id` no coincide con un instrumento, se muestra `Instrumento no encontrado`.

### Sin indicadores
Si no existen indicadores para el instrumento, la tabla muestra estado vacio.

### Loading de avances
Mientras cambia el corte, la tabla puede permanecer visible y mostrar feedback de carga.

### Loading de acciones relacionadas
Mientras se consulta `indicador_id`, el modal muestra un estado de carga en el bloque de acciones.

### Sin acciones relacionadas
El detalle del indicador debe mostrar un empty state claro y accionable.

### Error de acciones
Errores de aprobacion, observacion o guardado se muestran mediante `Alert`.

## Logica clave

### Seleccion automatica de corte
Orden de prioridad:
- query param `corte`
- primer corte no cerrado
- primer corte disponible

### Filas derivadas
`filas` usa `useMemo` para unir indicadores con avances y calcular:
- `accionesDeclaradas`
- `puedeEditar`
- `puedeRevisar`

### Apertura profunda desde URL
Si llega `requestedIndicadorId`, se busca la fila y se ejecuta `abrirDetalle(indicador, avance)`.

### Estado de gestion
`getEstadoGestion(avance)` clasifica en:
- `pendiente`
- `cumplido`
- `aprobado`
- `observado`
- `en proceso`
- `borrador`

### Vinculo con acciones
La relacion clave del modulo ahora es:
- `indicador.id` -> filtro `indicador_id`
- `getAcciones({ indicador_id })` -> listado operativo dentro del detalle del indicador
- `getAcciones({ instrumento_id })` -> conteo de acciones declaradas por indicador en la tabla principal

## Riesgos al tocar este modulo

- cambiar nombres de campos en indicadores, avances o acciones rompe lectura del modal sin fallar de forma evidente
- si backend deja de soportar `indicador_id` en acciones, el bloque relacionado se vacia aunque existan datos
- si backend deja de exponer acciones del instrumento, la nueva columna puede mostrar conteos incorrectos
- modificar permisos en frontend sin alinear backend puede exponer CTAs que luego fallen
- alterar la seleccion automatica de corte puede romper deep links desde Gantt o Dashboard
- si `subdimension` deja de representar responsable operativo, la vista mostrara un responsable incorrecto aunque compile

## Mejoras visuales, UI y UX propuestas

1. Reemplazar el selector simple de corte por un selector enriquecido con estado, fecha limite y conteo de indicadores con avance.
2. Agregar una banda superior con metricas del instrumento: indicadores totales, con avance, observados y cumplidos.
3. Hacer sticky el encabezado de la tabla para mantener contexto al hacer scroll.
4. Convertir el porcentaje de cumplimiento en barra de progreso visual dentro de la tabla.
5. Mostrar tooltips con definiciones de semaforo, estado de gestion y tipo de meta.
6. Resaltar automaticamente la fila del indicador abierta en el modal.
7. Incorporar filtros rapidos por responsable, semaforo y estado de gestion dentro del instrumento.
Responsable aqui debe mapear a `subdimension`.
8. Permitir busqueda por codigo o nombre del indicador sin salir de la vista.
9. Mostrar contadores por estado encima de la tabla como chips clickeables.
10. Cambiar los badges actuales por una paleta mas consistente y con mejor contraste.
11. Formatear todas las fechas en `es-CL` y evitar ISO crudo en cualquier bloque visible.
12. Incluir skeletons especificos para cabecera, tabla y modal en vez de usar solo spinner.
13. Agregar CTA fijo de `Nuevo avance` cuando el usuario tiene permisos y hay corte abierto.
14. Mostrar la ultima modificacion del indicador o avance para ayudar a auditoria rapida.
15. Incluir una mini linea de tiempo del indicador con hitos: creado, ultimo avance, ultima observacion y ultima aprobacion.
16. Permitir expandir una fila en mobile en vez de depender de una tabla horizontal extensa.
17. Incorporar tabs dentro del modal: resumen, ficha tecnica, avance y acciones.
18. Agregar una vista comparativa entre corte actual y corte anterior para cada indicador.
19. Mostrar chips de contexto como dimension, subdimension y equipo con jerarquia visual real.
20. Incluir un panel lateral con `proximos vencimientos` del instrumento.
21. Habilitar un modo `solo pendientes` para que jefaturas vean rapido lo que requiere accion.
22. Mostrar si un indicador no tiene `subdimension` asignada con una alerta visual clara.
23. Transformar el empty state de acciones en un CTA contextual que precargue el indicador al crear la accion.
24. Incorporar confirmaciones mas claras y resumidas tras aprobar u observar un avance.
25. Agregar navegacion entre indicadores dentro del modal sin cerrarlo.
26. Usar colores suaves de fondo por estado para que la lectura sea mas inmediata sin saturar.
27. Destacar indicadores criticos con borde lateral o glow sutil cuando el semaforo sea rojo.
28. Mostrar densidad adaptable de tabla: compacta, normal y detallada.
29. Añadir exportacion del instrumento filtrado a Excel o CSV desde la misma vista.
30. Incorporar atajos de teclado para abrir detalle, guardar y navegar entre indicadores.

## Pendientes naturales

- desacoplar el modal del indicador en componentes propios si sigue creciendo
- unificar helpers de formato de fecha, estados y badges con otros modulos
- evaluar precarga contextual para `NuevaAccion` desde el indicador
- mover parte de la logica visual a componentes reutilizables para mantener la pagina legible