# Contexto del Modulo Gantt

## Objetivo

`src/pages/Gantt.js` representa el calendario anual de cortes por instrumento. Su funcion es entregar una lectura temporal del año, mostrar el estado de cada corte y abrir un modal con metricas del corte seleccionado.

## Responsabilidad funcional

La pagina:
- consulta el calendario con `useGanttData()`
- consulta metricas del corte con `useMetricasCorte()` cuando el usuario selecciona uno
- representa meses del año como una grilla horizontal
- ubica los cortes en los meses que abarcan segun `fecha_inicio` y `fecha_limite`
- muestra un modal full width con datos resumidos del corte
- resalta automaticamente el corte abierto mas proximo a vencer

## Dependencias principales

- `useGanttData()`
- `useMetricasCorte()`
- `Modal`
- `Spinner`
- `Skeleton`

## Estructura visual

### Cabecera
- titulo `Calendario de cortes`
- subtitulo operativo

### Grilla anual
- una columna fija por instrumento
- doce columnas para meses
- cada celda del mes puede contener uno o mas cortes

### Tarjetas de corte
Cada corte muestra:
- `codigo_corte`
- fecha corta de vencimiento
- rango de fechas del corte
- color por estado
- badge `Proximo` si es el mas cercano a vencer

### Leyenda
Incluye:
- proximo a vencer
- en curso
- cerrado
- vencido
- pendiente

### Modal de detalle
Muestra:
- inicio
- limite
- periodo
- estado
- indicadores totales
- indicadores con avance
- pendientes
- aprobados
- desglose de semaforos

## Logica clave

### Ubicacion por mes
`incluyeMes(corte, monthIndex)` compara el mes de `fecha_inicio` y `fecha_limite` para decidir en que columnas debe aparecer el corte.

### Corte mas proximo
`getNearestUpcomingCorteId(data)` recorre todos los cortes y toma el de menor `fecha_limite` futura que no este cerrado. Ese corte recibe tratamiento visual especial.

### Formateo de fechas
El modulo incluye helpers locales para evitar fechas ISO crudas:
- `formatShortDate()`
- `formatDateLabel()`
- `formatDateTimeLabel()`
- `formatDateRange()`

## Contrato esperado del backend

Cada fila de `useGanttData()` debe incluir:
- `instrumento.id`
- `instrumento.codigo`
- `instrumento.nombre`
- `instrumento.color_hex`
- `cortes[]` con:
  - `id`
  - `codigo_corte`
  - `nombre_corte`
  - `fecha_inicio`
  - `fecha_limite`
  - `estado_visual`

`useMetricasCorte()` debe devolver:
- `total_indicadores`
- `indicadores_con_avance`
- `indicadores_pendientes`
- `aprobados`
- `semaforos.verde`
- `semaforos.amarillo`
- `semaforos.rojo`

## Hallazgos tecnicos del modulo

- la vista inicial mostraba fechas muy mal porque estaba imprimiendo valores sin normalizacion
- el modal necesitaba ancho completo para que las metricas no quedaran comprimidas
- el resaltado del proximo corte mejora lectura ejecutiva sin cambiar el modelo de datos

## Riesgos al tocar este modulo

- cualquier cambio en `fecha_inicio` o `fecha_limite` afecta posicionamiento mensual
- si el backend devuelve fechas no parseables, la grilla y el resaltado pueden fallar
- el render de cortes dentro del `map` es sensible a errores de JSX y de keys

## Pendientes naturales

- mostrar dias restantes en la tarjeta del corte mas proximo
- permitir filtros por instrumento o año
- mejorar soporte para mas de un corte visible en la misma celda con layouts alternativos
