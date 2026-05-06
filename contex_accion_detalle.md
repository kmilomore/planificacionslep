# Contexto del Modulo Accion Detalle

## Objetivo

`src/pages/AccionDetalle.js` es la vista operativa mas rica del modulo Acciones. Su responsabilidad es consolidar informacion general, medios de verificacion, timeline operativo, comentarios persistidos y gestion rapida de estado.

## Responsabilidad funcional

La pagina:
- carga una accion individual con `useAccion(id)`
- permite cambio rapido de estado y avance
- permite carga de medios de verificacion con overlay de progreso
- permite alta, edicion y eliminacion de comentarios persistidos
- aplica optimistic update para estado y comentarios
- reconstruye el timeline local mientras llega la confirmacion backend
- resuelve permisos segun rol y metadata de la accion

## Dependencias principales

- `useAccion()`
- `useUpdateEstadoAccion()`
- `useUploadMedioVerificacion()`
- `useAddComentarioAccion()`
- `useUpdateComentarioAccion()`
- `useDeleteComentarioAccion()`
- `useAuth()`
- `useQueryClient()` para manipular cache local
- componentes extraidos:
  - `AccionOverviewSection`
  - `AccionMediaSection`
  - `AccionTimelineSection`
  - `AccionSidebar`
  - `AccionDetalleSkeleton`

## Secciones visuales

### Overview
Muestra datos base de la accion, fechas y metadatos principales.

### Medios de verificacion
Permite:
- seleccionar archivo
- editar nombre visible
- agregar descripcion
- previsualizar imagenes compatibles
- subir archivo a Drive
- ver metadata de medios ya cargados

### Timeline
Consolida:
- creacion
- cambios de estado
- carga de medios
- comentarios operativos

### Sidebar
Incluye:
- gestion rapida de estado y avance
- formulario de comentario operativo
- lista de comentarios persistidos
- edicion inline y eliminacion de comentarios propios o segun rol
- resumen documental

## Optimistic update

### Estado
- al guardar un cambio de estado se actualiza cache local inmediatamente
- se inserta un evento optimista en timeline
- si el backend falla, se hace rollback con `queryClient.setQueryData`

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

## Hallazgos tecnicos del modulo

- esta pagina crecio demasiado y por eso fue refactorizada en componentes especializados
- la percepcion de lentitud mejoro con overlay de upload y optimistic update
- las fechas ISO crudas necesitaron normalizacion explicita en detalle y timeline
- la dependencia de `comentarios_accion` hizo necesario endurecer el esquema backend

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
