# Contexto del Módulo Administración

## Objetivo

`src/pages/Admin.js` centraliza la configuración maestra del sistema accesible solo para perfiles con rol administrador. Desde esta vista se gestionan usuarios, instrumentos, indicadores y cortes, actuando como panel de mantenimiento de catálogos clave.

## Responsabilidad funcional

La página:
- muestra pestañas para `Usuarios`, `Instrumentos`, `Indicadores` y `Cortes`
- carga cada submódulo mediante componentes dedicados (`TabUsuarios`, `TabInstrumentos`, `TabIndicadores`, `TabCortes`)
- actúa como contenedor visual y punto de entrada único a la configuración

## Submódulo Usuarios

`src/components/admin/TabUsuarios.js` es la pestaña de administración de usuarios.

Responsabilidades:
- listar usuarios actuales con `useUsuarios()`
- permitir actualizar campos permitidos (`nombre`, `rol`, `area`, `activo`) usando `useUpdateUsuario()`
- mostrar el estado de activación como switch con feedback visual
- **crear nuevos usuarios directamente desde la UI** usando `useCreateUsuario()`

### Creación de usuarios desde la UI

La parte superior de la pestaña incluye un formulario compacto de "Nuevo usuario" con:
- `nombre` (requerido)
- `email` (requerido)
- `rol` (requerido, opciones: `admin`, `subdirector`, `director_ejecutivo`)
- `área` (opcional)

Al enviar:
- solo perfiles con rol `admin` pueden crear usuarios
- se valida que nombre, email y rol no vayan vacíos
- el backend impide duplicar emails existentes
- al éxito, se limpia el formulario, se recarga la lista y se muestra mensaje de confirmación

### Contrato esperado con backend para usuarios

`Usuarios.gs` expone:
- `getAll(user)` para listar usuarios (solo admin)
- `create(data, user)` para crear usuarios (solo admin)
- `update(id, data, user)` para actualizar campos permitidos (solo admin)

Campos esperados por fila en la hoja `usuarios`:
- `id`
- `nombre`
- `email`
- `rol`
- `area`
- `activo`
- `creado_en`

`Code.gs` enruta las acciones de API:
- `getUsuarios` → `Usuarios.getAll`
- `createUsuario` → `Usuarios.create`
- `updateUsuario` → `Usuarios.update`

En React, los hooks en `src/hooks/useApi.js` abstraen estas acciones:
- `useUsuarios()` consulta `getUsuarios`
- `useCreateUsuario()` ejecuta `createUsuario` e invalida cache de `usuarios`
- `useUpdateUsuario()` ejecuta `updateUsuario` e invalida cache de `usuarios`

## Submódulos restantes

- `TabInstrumentos`: gestiona catálogo de instrumentos (creación, edición, activación) contra `Instrumentos.gs`
- `TabIndicadores`: administra indicadores asociados a instrumentos y su configuración base
- `TabCortes`: define y administra cortes de seguimiento para los instrumentos

Cada pestaña sigue el patrón:
- hook `useApi` alineado con acción en `Code.gs`
- componente de tabla o formulario específico
- mensajes de error y éxito con `Alert`

## Riesgos al tocar este módulo

- cambiar nombres de acciones en `Code.gs` sin alinear `useApi.js` rompe las pestañas
- modificar el schema de la hoja `usuarios` sin actualizar `Usuarios.gs` puede dejar el alta/edición inconsistente
- relajar validaciones de rol en backend permitiría que perfiles no administradores gestionen usuarios

## Pendientes naturales

- agregar filtro por rol/área en la tabla de usuarios
- permitir edición inline de rol/área en la lista de usuarios
- exponer métricas básicas de uso administrativo (cantidad de usuarios por rol, por área)

