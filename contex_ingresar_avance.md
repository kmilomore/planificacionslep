# Contexto del Modulo Ingresar Avance

## Objetivo

`src/pages/IngresarAvance.js` es el formulario operativo para registrar o editar el avance de un indicador en un corte especifico.

Actualizacion de criterio funcional:
- cuando el indicador tiene acciones con medios de verificacion requeridos, el avance se entiende como cumplimiento documental (no como captura aislada de valor reportado)
- cuando no existen medios requeridos, se mantiene la logica tradicional por `tipo_meta`

## Responsabilidad funcional

La pagina:
- carga el indicador con `useIndicador(indicador_id)`
- carga acciones del indicador con `useAccionesPorIndicador(indicador_id)` (respuesta normalizada desde `data.items`)
- carga los cortes del instrumento con `useCortesPorInstrumento(indicador.instrumento_id)`
- carga los avances del corte con `useAvancesPorCorte(corte_id)`
- detecta si ya existe un avance previo del indicador para ese corte
- precarga el formulario con ese avance existente
- calcula cumplimiento y semaforo en tiempo real
- obliga comentario cuando el cumplimiento es menor a 80%
- bloquea guardado si el corte esta cerrado
- guarda usando `useUpsertAvance()`

## Parametros de ruta

La pagina depende de:
- `indicador_id`
- `corte_id`

Si alguno no resuelve correctamente contra backend, la pagina muestra error de entidad no encontrada.

## Estructura visual

### Cabecera
- link de regreso al instrumento
- titulo `Ingresar avance`
- codigo y nombre del indicador

### Bloque informativo
Muestra:
- corte
- estado del corte
- meta
- fecha de cumplimiento
- formula
- equipo de trabajo
- ambito de control
- medios de verificacion

### Formulario
Campos:
- `valor_reportado`
- `comentario`
- `evidencia_url`

Comportamiento actualizado:
- si hay medios requeridos en acciones asociadas, se muestra bloque de "logica integrada por medios" y no se prioriza captura manual de `valor_reportado`
- en ese escenario, el valor guardado se traza como `cumplidos/total` de medios
- si no hay medios requeridos, se mantiene el input tradicional de `valor_reportado` por `tipo_meta`

El control de `valor_reportado` cambia segun `tipo_meta`:
- `booleano`: select Si/No
- `texto`: textarea
- otros: input numerico

### Vista previa
Muestra:
- cumplimiento final calculado (por medios cuando aplica, por `tipo_meta` en caso contrario)
- semaforo resultante
- alerta de comentario obligatorio cuando corresponde

## Reglas de negocio visibles

- si el corte esta cerrado, no se puede guardar
- si el cumplimiento es menor a 80%, el comentario es obligatorio
- indicadores booleanos transforman `Si` en 100 y `No` en 0
- indicadores de texto consideran cumplimiento 100 si hay contenido
- indicadores numericos calculan porcentaje contra `meta_valor`
- si existen medios requeridos en acciones asociadas, el cumplimiento final del indicador se calcula por medios:
  - `medios_cumplidos / medios_requeridos * 100`
  - ese porcentaje domina sobre el calculo manual

## Guardado

Flujo:
1. validaciones basicas de negocio en frontend
2. `useUpsertAvance()` envia payload normalizado
3. al guardar correctamente se navega de vuelta al detalle del instrumento
4. si falla, se muestra `Alert`

Payload enviado:
- `indicador_id`
- `corte_id`
- `valor_reportado` (manual o `cumplidos/total` cuando aplica logica por medios)
- `comentario`
- `evidencia_url`

## Dependencias principales

- `useIndicador()`
- `useAccionesPorIndicador()`
- `useCortesPorInstrumento()`
- `useAvancesPorCorte()`
- `useUpsertAvance()`
- `useNavigate()` y `useParams()`
- `Alert`
- `Spinner`

## Hallazgos tecnicos del modulo

- este modulo depende de tres consultas previas antes de poder operar, por eso su estado de loading bloquea la pantalla completa
- la logica de cumplimiento se replica en frontend como feedback inmediato, pero la fuente final de verdad sigue siendo backend
- el formulario aun usa `evidencia_url` como campo de texto, no como carga real de archivo
- bug corregido: `useAccionesPorIndicador()` puede devolver objeto (`{ items, resumen }`) y no arreglo plano; ahora se normaliza antes de usar `.filter`

## Riesgos al tocar este modulo

- cambiar la formula de cumplimiento sin alinear backend genera discrepancias visibles
- tocar el comportamiento de `tipo_meta` puede romper la carga de valores ya existentes
- permitir guardado en cortes cerrados rompe una regla central del sistema

## Pendientes naturales

- migrar de `evidencia_url` a una carga real de evidencia si el flujo de avances lo requiere
- agregar skeleton en vez de spinner para consistencia con otras vistas
- normalizar mejor fechas informativas del indicador si llegan en ISO o formatos mixtos
