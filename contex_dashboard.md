# Contexto del Modulo Dashboard

## Objetivo

`src/pages/Dashboard.js` concentra la lectura ejecutiva del sistema. Su funcion es mostrar el estado agregado por instrumento, el cumplimiento global, los proximos cortes y una comparativa visual para facilitar navegacion y toma de decisiones.

## Responsabilidad funcional

La pagina:
- carga el resumen general con `useDashboardResumen()`
- muestra una bienvenida usando `useAuth()`
- renderiza tarjetas por instrumento con cumplimiento, semaforo y proximo corte
- muestra un grafico comparativo de cumplimiento con Recharts
- resume proximos cortes y enlaza al calendario anual
- protege la experiencia de carga con `DashboardSkeleton`

## Dependencias principales

- `useAuth()` para nombre y rol del usuario autenticado
- `useDashboardResumen()` para obtener la data agregada desde Apps Script
- `Alert` para errores y estados vacios
- `Skeleton` para loading estructurado
- `recharts` para el grafico comparativo
- `react-router-dom` para navegar a detalle de instrumento y gantt

## Estructura visual

### Cabecera
- titulo `Dashboard`
- saludo al usuario autenticado
- rol formateado desde el backend

### Tarjetas por instrumento
Cada tarjeta muestra:
- codigo del instrumento
- nombre y descripcion resumida
- cumplimiento global
- barra de progreso con color por semaforo
- badge de semaforo
- numero de indicadores con avance
- proximo corte y dias restantes
- acceso a `/instrumento/:id`

### Comparativo de cumplimiento
- grafico de barras por instrumento
- linea de referencia fija en 80%
- color de cada barra segun semaforo

### Proximos cortes
- lista lateral por instrumento
- nombre del corte pendiente y fecha limite
- resumen visual del estado de cortes
- acceso directo a `/gantt`

## Contrato esperado del backend

`Dashboard.gs` debe devolver un arreglo por instrumento con forma equivalente a:
- `instrumento.id`
- `instrumento.codigo`
- `instrumento.nombre`
- `instrumento.descripcion`
- `instrumento.color_hex`
- `cumplimiento_global`
- `semaforo`
- `indicadores_con_avance`
- `total_indicadores`
- `proximo_corte`
- `dias_para_corte`
- `cortes[]` con `estado_visual`

Si ese contrato cambia, el Dashboard se rompe visualmente aunque compile.

## Reglas de negocio visibles

- el dashboard solo considera instrumentos activos
- cuando no hay datos activos, la UI muestra alerta operativa en vez de dejar la pantalla vacia
- el color del semaforo debe seguir la logica institucional: verde, amarillo, rojo
- los dias restantes se destacan en rojo cuando son 7 o menos

## Estados especiales

### Loading
Se usa `DashboardSkeleton` para evitar saltos bruscos de layout.

### Error
Se muestra `Alert` con el mensaje del backend.

### Data vacia
Se muestra advertencia indicando que puede faltar despliegue de Apps Script o expiracion de cache.

## Hallazgos tecnicos del modulo

- la experiencia del Dashboard mejoro mas por optimizacion backend que por cambios de React
- el modulo depende fuertemente de `Dashboard.gs` y de la cache de Apps Script
- el bundle crecio por Recharts, pero se mantuvo aceptable para el tamaño del proyecto

## Riesgos al tocar este modulo

- cambiar nombres del payload agregado desde backend rompe tarjetas, grafico y proximos cortes
- cambiar la logica de semaforo requiere alinear `Dashboard.js`, `Dashboard.gs` y otras vistas
- si se modifica el grafico, revisar impacto en bundle y responsive

## Pendientes naturales

- tooltips mas ricos para barras y proximos cortes
- mejor tratamiento de fechas en el bloque de proximos cortes si el backend entrega ISO crudo
- profundizar accesos ejecutivos a detalle por instrumento o corte
