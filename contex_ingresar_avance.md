# Contexto del Modulo Ingresar Avance

## Objetivo

`src/pages/IngresarAvance.js` es el formulario operativo para registrar o editar el avance de un indicador en un corte especifico. Debe garantizar consistencia minima de negocio antes de enviar al backend.

## Responsabilidad funcional

La pagina:
- carga el indicador con `useIndicador(indicador_id)`
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

El control de `valor_reportado` cambia segun `tipo_meta`:
- `booleano`: select Si/No
- `texto`: textarea
- otros: input numerico

### Vista previa
Muestra:
- cumplimiento calculado
- semaforo resultante
- alerta de comentario obligatorio cuando corresponde

## Reglas de negocio visibles

- si el corte esta cerrado, no se puede guardar
- si el cumplimiento es menor a 80%, el comentario es obligatorio
- indicadores booleanos transforman `Si` en 100 y `No` en 0
- indicadores de texto consideran cumplimiento 100 si hay contenido
- indicadores numericos calculan porcentaje contra `meta_valor`

## Guardado

Flujo:
1. validaciones basicas de negocio en frontend
2. `useUpsertAvance()` envia payload normalizado
3. al guardar correctamente se navega de vuelta al detalle del instrumento
4. si falla, se muestra `Alert`

Payload enviado:
- `indicador_id`
- `corte_id`
- `valor_reportado`
- `comentario`
- `evidencia_url`

## Dependencias principales

- `useIndicador()`
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

## Riesgos al tocar este modulo

- cambiar la formula de cumplimiento sin alinear backend genera discrepancias visibles
- tocar el comportamiento de `tipo_meta` puede romper la carga de valores ya existentes
- permitir guardado en cortes cerrados rompe una regla central del sistema

## Pendientes naturales

- migrar de `evidencia_url` a una carga real de evidencia si el flujo de avances lo requiere
- agregar skeleton en vez de spinner para consistencia con otras vistas
- normalizar mejor fechas informativas del indicador si llegan en ISO o formatos mixtos
