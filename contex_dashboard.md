# Contexto del Modulo Dashboard

## Objetivo

`src/pages/Dashboard.js` concentra la lectura ejecutiva del sistema. Su funcion es mostrar el estado agregado por instrumento, el cumplimiento global, los proximos cortes y una comparativa visual para facilitar navegacion y toma de decisiones.

En su estado actual, el modulo ya no solo entrega una foto estatica: incorpora KPIs superiores, priorizacion temporal, cabecera diferenciada por rol, refresco manual y exportacion ejecutiva inicial.

## Responsabilidad funcional

La pagina:
- carga el resumen general con `useDashboardResumen()`
- permite forzar refresco con `useRefreshDashboardResumen()`
- muestra una bienvenida usando `useAuth()`
- adapta la cabecera y el foco sugerido segun rol autenticado
- muestra metadatos de ultima actualizacion cuando el backend los entrega
- resume KPIs ejecutivos de cumplimiento, instrumentos en rojo, cortes urgentes y cobertura de avance
- permite filtrar instrumentos por urgencia temporal
- renderiza tarjetas por instrumento con cumplimiento, semaforo y proximo corte
- muestra brecha contra meta 80% y cobertura por instrumento
- muestra un grafico comparativo de cumplimiento con Recharts
- enriquece el tooltip del grafico con semaforo, cobertura y plazo
- resume proximos cortes y enlaza al calendario anual
- permite exportar el resumen filtrado a CSV
- protege la experiencia de carga con `DashboardSkeleton`

## Dependencias principales

- `useAuth()` para nombre y rol del usuario autenticado
- `useDashboardResumen()` para obtener la data agregada desde Apps Script
- `useRefreshDashboardResumen()` para invalidar cache y regenerar el resumen
- `Alert` para errores y estados vacios
- `Skeleton` para loading estructurado
- `recharts` para el grafico comparativo
- `react-router-dom` para navegar a detalle de instrumento y gantt

## Estructura visual

### Cabecera
- titulo `Dashboard`
- saludo al usuario autenticado
- rol formateado desde el backend
- timestamp de ultima actualizacion cuando existe `updated_at`
- boton `Actualizar dashboard`
- boton `Exportar resumen CSV`

### Hero por rol
- bloque destacado con copy distinto para `admin`, `director_ejecutivo` y `subdirector`
- lista de focos sugeridos segun perfil
- indicador principal contextual segun rol

### KPIs superiores
- cumplimiento promedio
- instrumentos en rojo
- cortes vencidos o dentro de 7 dias
- cobertura de avance global

### Filtro por urgencia temporal
- todos
- vencidos
- vence en 7 dias
- vence en 15 dias
- sin corte proximo

### Tarjetas por instrumento
Cada tarjeta muestra:
- codigo del instrumento
- nombre y descripcion resumida
- cumplimiento global
- barra de progreso con color por semaforo
- badge de semaforo
- cobertura de avance
- numero de indicadores con avance
- brecha contra meta del 80%
- proximo corte y dias restantes
- plazo traducido a lenguaje operativo como `Vence hoy` o `Vencido hace X dias`
- acceso a `/instrumento/:id`

### Comparativo de cumplimiento
- grafico de barras por instrumento
- linea de referencia fija en 80%
- color de cada barra segun semaforo
- tooltip enriquecido con cumplimiento, semaforo, cobertura y plazo
- ordenado por urgencia temporal en vez de mostrar solo el orden de origen

### Proximos cortes
- lista lateral por instrumento
- nombre del corte pendiente y fecha limite
- plazo normalizado y resaltado segun cercania
- resumen visual del estado de cortes
- acceso directo a `/gantt`
- ordenado por urgencia temporal

## Contrato esperado del backend

`Dashboard.gs` hoy puede devolver dos formas para el resumen general:

### Forma actual preferida
- `items[]`
- `updated_at`
- `cache_ttl_seconds`

Cada elemento de `items[]` debe incluir:
- `instrumento.id`
- `instrumento.codigo`
- `instrumento.nombre`
- `instrumento.descripcion`
- `instrumento.color_hex`
- `cumplimiento_global`
- `semaforo`
- `total_indicadores`
- `indicadores_con_avance`
- `indicadores_pendientes`
- `desglose_semaforos.verde`
- `desglose_semaforos.amarillo`
- `desglose_semaforos.rojo`
- `proximo_corte`
- `dias_para_corte`
- `cortes[]` con `estado_visual`

### Compatibilidad legacy
- el frontend todavia tolera que `getDashboardResumen` devuelva directamente el arreglo de instrumentos sin `items` ni `updated_at`

### Accion de refresco
- `refreshDashboardResumen` invalida cache del dashboard y devuelve el mismo payload actualizado

Si ese contrato cambia, el Dashboard se rompe visualmente aunque compile.

## Reglas de negocio visibles

- el dashboard solo considera instrumentos activos
- cuando no hay datos activos, la UI muestra alerta operativa en vez de dejar la pantalla vacia
- el color del semaforo debe seguir la logica institucional: verde, amarillo, rojo
- los dias restantes se traducen a etiquetas operativas y se destacan en rojo cuando son 7 o menos
- la meta visual de referencia del dashboard es 80%
- el orden visual de instrumentos y cortes prioriza urgencia temporal
- la exportacion ejecutiva respeta el filtro de urgencia activo en pantalla

## Estados especiales

### Loading
Se usa `DashboardSkeleton` para evitar saltos bruscos de layout.

### Error
Se muestra `Alert` con el mensaje del backend.

El refresh manual puede mostrar un error independiente si el frontend ya fue desplegado pero el Apps Script aun no publica `refreshDashboardResumen`.

### Data vacia
Se muestra advertencia indicando que puede faltar despliegue de Apps Script o expiracion de cache.

## Hallazgos tecnicos del modulo

- la experiencia del Dashboard mejoro mas por optimizacion backend que por cambios de React
- el modulo depende fuertemente de `Dashboard.gs` y de la cache de Apps Script
- el bundle crecio por Recharts, pero se mantuvo aceptable para el tamaño del proyecto
- varias mejoras recientes se resolvieron solo con el payload existente: KPIs, filtro por urgencia, cobertura y brecha contra meta
- para mostrar trazabilidad de datos fue necesario enriquecer el payload con `updated_at`
- el refresh manual requiere backend nuevo publicado; si no, el frontend funciona pero la accion de refresh falla por ruta desconocida
- la exportacion inicial se resolvio en frontend con CSV para evitar agregar dependencias pesadas o complejidad temprana
- el frontend mantiene compatibilidad con el contrato legacy del resumen para no romper ambientes parcialmente desplegados

## Riesgos al tocar este modulo

- cambiar nombres del payload agregado desde backend rompe tarjetas, grafico y proximos cortes
- cambiar la logica de semaforo requiere alinear `Dashboard.js`, `Dashboard.gs` y otras vistas
- si se modifica el grafico, revisar impacto en bundle y responsive
- si se despliega frontend sin republicar Apps Script, el boton de actualizar puede fallar aunque la vista cargue
- si se elimina la compatibilidad con el payload legacy, los ambientes con backend antiguo dejaran de renderizar el resumen
- la exportacion CSV usa el estado filtrado actual; si se cambia la logica de filtros hay que revisar coherencia del archivo exportado

## Pendientes naturales

- mover la configuracion de cabecera por rol a una estructura reutilizable fuera de la pagina
- evaluar exportacion `.xlsx` real o PDF ejecutivo cuando la necesidad de presentacion supere al CSV actual
- profundizar accesos ejecutivos a detalle por instrumento o corte
- unificar utilitarios de fechas del dashboard con otros modulos para evitar duplicacion de formateo
