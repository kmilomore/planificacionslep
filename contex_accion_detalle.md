# Contexto del Modulo Accion Detalle

## Objetivo

`src/pages/AccionDetalle.js` es la vista operativa mas rica del modulo Acciones. Su responsabilidad es consolidar informacion general, medios de verificacion, timeline operativo y comentarios persistidos, priorizando el seguimiento documental de la accion en una sola columna.

## Responsabilidad funcional

La pagina:
- carga una accion individual con `useAccion(id)`
- permite carga y gestion de medios de verificacion con overlay de progreso
- permite eliminar medios de verificacion desde el mismo detalle (con confirmacion)
- permite alta, edicion y eliminacion de comentarios persistidos
- permite eliminar la accion desde el detalle (soft delete, con confirmacion)
- aplica optimistic update para comentarios
- reconstruye el timeline local mientras llega la confirmacion backend
- resuelve permisos segun rol y metadata de la accion

## Dependencias principales

- `useAccion()`
- `useUploadMedioVerificacion()`
- `useDeleteMedioVerificacion()`
- `useUpdateMedioVerificacion()`
- `useAddComentarioAccion()`
- `useUpdateComentarioAccion()`
- `useDeleteComentarioAccion()`
- `useDeleteAccion()`
- `useAuth()`
- `useQueryClient()` para manipular cache local
- componentes extraidos:
  - `AccionOverviewSection`
  - `AccionMediaSection`
  - `AccionTimelineSection`
  - `AccionDetalleSkeleton`

## Secciones visuales

La vista se organiza en una sola columna (sin sidebar), en el siguiente orden:

### Overview
Muestra datos base de la accion, fechas y metadatos principales. El bloque de métricas incluye:
- equipo responsable
- instrumento
- **avance documental**, calculado preferentemente a partir de `medios_cumplidos_count / medios_requeridos_count * 100` (cuando existe configuracion de medios) y, en ausencia de medios, desde `accion.avance`.

### Medios de verificacion
Permite:
- seleccionar archivo
- editar nombre visible
- agregar descripcion
- previsualizar imagenes compatibles
- subir archivo a Drive
- asociar URL externa de evidencia cuando aplique (ej. carpeta o archivo ya existente en Drive)
- editar el tipo de medio (dentro de los declarados en la accion)
- definir y actualizar cantidades esperada y lograda por medio (ej. cuantas actas se consideran para el cumplimiento)
- ver metadata de medios ya cargados
- eliminar un medio ya cargado (si el perfil tiene gestion)

### Comentarios operativos
Bloque especifico ubicado **debajo de medios de verificacion y antes de la bitacora operativa**, en la misma columna. Incluye:
- formulario para agregar nuevo comentario operativo
- lista de comentarios persistidos con soporte de edicion y eliminacion (segun permisos).

### Bitacora operativa (timeline)
Consolida:
- creacion
- cambios de estado historicos
- carga de medios
- comentarios operativos

Se renderiza mediante `AccionTimelineSection`, manteniendo los estilos de tipos de evento.

### Resumen documental
Bloque final que muestra:
- carpeta raiz logica
- ruta logica de la accion dentro de la estructura (`Indicador / Accion / Medios de Verificacion`)
- cantidad de eventos en la bitacora
- cantidad de archivos cargados.

## Optimistic update

### Comentarios
- al crear comentario se inserta un comentario temporal con id local
- al editar se reemplaza localmente el comentario antes de la respuesta backend
- al eliminar se remueve localmente de `comentarios` y `timeline`
- cualquier error revierte la cache previa

## Upload de medios

Flujo:
1. validacion de archivo y nombre visible
2. lectura del archivo a base64
3. mutacion a backend
4. overlay con etapas `reading`, `uploading`, `syncing`
5. reseteo del formulario al terminar

Restricciones visibles:
- si no hay archivo, no se puede subir
- si no hay nombre visible, no se puede subir
- imagenes `.png`, `.jpg`, `.jpeg`, `.webp` tienen preview en frontend

## Comentarios persistidos

El detalle ya no deriva comentarios solo desde timeline. Ahora:
- la accion trae `comentarios` desde backend
- el timeline se compone tambien con esos comentarios
- la edicion y eliminacion son reales contra Apps Script
- se respeta autoria o privilegio de gestion

## Reglas de permisos

`resolveActionPermissions()` combina:
- permisos entregados por backend si existen
- flags legacy de la accion
- fallback por rol para `admin`, `director_ejecutivo` y `subdirector`

`AccionSidebar` usa ademas el `created_by` del comentario para decidir si puede editar o eliminar.

Acciones destructivas:
- eliminar medio y eliminar accion se habilitan solo con permisos de gestion (`canManage`)
- ambas requieren confirmacion explicita del usuario en frontend

## Hallazgos tecnicos del modulo

- esta pagina crecio demasiado y por eso fue refactorizada en componentes especializados
- la percepcion de lentitud mejoro con overlay de upload y optimistic update
- las fechas ISO crudas necesitaron normalizacion explicita en detalle y timeline
- la dependencia de `comentarios_accion` hizo necesario endurecer el esquema backend
- se agrego soporte de eliminacion documental:
  - `deleteMedioVerificacion` (backend marca medio como `eliminado` y limpia enlace)
  - intento de envio a papelera en Drive por `file_id`
- se agrego soporte de eliminacion de accion:
  - `deleteAccion` usa baja logica (`activo = false`) para mantener trazabilidad

## Riesgos al tocar este modulo

- romper la sincronizacion entre `comentarios`, `timeline` y cache de React Query
- cambiar nombres de acciones backend sin actualizar hooks
- tocar upload sin revisar CORS, permisos de Drive y tamaño de archivo
- modificar permisos sin revisar backend y sidebar al mismo tiempo

## Pendientes naturales

- enriquecer el timeline con mas tipos de eventos
- extraer helpers de fecha y cache a utilitarios compartidos
- agregar confirmacion visual para eliminar comentario
- habilitar edicion completa de la accion desde esta vista
