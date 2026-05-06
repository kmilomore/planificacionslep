# Contexto de Desarrollo

## Objetivo del Documento

Este archivo debe servir como referencia viva del proyecto.

Debe permitir que cualquier persona retome el desarrollo entendiendo:
- qué existe hoy
- cómo está organizado el sistema
- cuáles son las rutas y flujos principales
- qué reglas de negocio ya están implementadas
- qué hallazgos técnicos se detectaron durante el desarrollo
- qué cosas no se deben tocar sin revisar impacto
- qué partes siguen pendientes

## Proyecto

Sistema de Control de Gestión Institucional para SLEP Colchagua.

Objetivo funcional:
- centralizar el seguimiento de instrumentos institucionales
- registrar avances por indicador y corte
- visualizar cumplimiento por instrumento
- permitir aprobación u observación de avances
- incorporar una capa operativa de acciones por indicador
- preparar automatización de recordatorios, evidencias y reportes

## Stack Actual

- Frontend: React + React Router + Tailwind + React Query + Recharts
- Backend: Google Apps Script como Web App
- Base de datos: Google Sheets
- Autenticación: Google OAuth / Google Identity Services
- Deploy frontend: Vercel

## Estado General del Desarrollo

El repositorio tiene implementadas las fases 1 a 4 del plan base y ya abrió el desarrollo funcional del módulo Acciones.

Estado por fase:
- Fase 1: base de frontend, auth, `callApi()`, backend inicial y despliegue base del Web App
- Fase 2: CRUD admin de instrumentos, indicadores y cortes; migración CDC preparada con `migracionCDC()`
- Fase 3: ingreso de avances, validaciones de negocio, detalle por instrumento y formulario de avance
- Fase 3.5: aprobación y observación de avances, más modal de detalle de indicador en la tabla
- Fase 4: dashboard con agregaciones, tarjetas, gráfico de barras y vista de calendario/gantt
- Fase 4.5: módulo Acciones inicial ya implementado en frontend y backend
- Fase 5: pendiente
- Fase 6: pendiente

## Estructura General

### Frontend

Carpeta principal: `src/`

Archivos y zonas relevantes:
- `App.js`: define las rutas principales
- `config/api.js`: encapsula `callApi()` y la URL del Apps Script
- `context/AuthContext.js`: sesión local del usuario
- `hooks/useApi.js`: hooks de consulta y mutación contra el backend
- `pages/Login.js`: login con Google OAuth redirect
- `pages/Dashboard.js`: resumen visual de instrumentos
- `pages/Indicadores.js`: vista global de indicadores con filtros
- `pages/InstrumentoDetalle.js`: tabla de indicadores por corte
- `pages/IngresarAvance.js`: formulario de avance
- `pages/Gantt.js`: calendario anual de cortes
- `pages/Admin.js`: panel de administración
- `pages/Acciones.js`: listado principal del módulo Acciones
- `pages/NuevaAccion.js`: formulario de creación de acciones
- `pages/AccionDetalle.js`: vista detalle de una acción
- `components/acciones/*`: filtros, tabla, resumen y badges del módulo Acciones
- `components/admin/*`: tabs CRUD del panel admin
- `components/layout/*`: shell, sidebar y rutas protegidas
- `components/ui/*`: modal, alert, spinner, skeleton y utilitarios visuales

### Backend

Carpeta principal: `backend/`

Archivos presentes:
- `Acciones.gs`
- `Auth.gs`
- `Code.gs`
- `Config.gs`
- `Cortes.gs`
- `Dashboard.gs`
- `Drive.gs`
- `Indicadores.gs`
- `Instrumentos.gs`
- `Setup.gs`
- `Usuarios.gs`
- `Utils.gs`
- `Avances.gs`

Responsabilidades:
- `Code.gs`: router principal por acción
- `Auth.gs`: validación del `id_token`
- `Config.gs`: constantes, hojas y thresholds
- `Utils.gs`: helpers de Sheets, fechas, UUID, cálculos comunes y capa de cache/invalidation
- `Instrumentos.gs`: CRUD de instrumentos
- `Indicadores.gs`: CRUD de indicadores
- `Cortes.gs`: CRUD de cortes y cambios de estado
- `Avances.gs`: guardado, aprobación y observación de avances
- `Dashboard.gs`: agregaciones optimizadas para dashboard, gantt y métricas por corte
- `Acciones.gs`: CRUD operativo de acciones, medios de verificación y reglas de negocio del módulo
- `Drive.gs`: carga de evidencias a Google Drive
- `Setup.gs`: setup inicial, seed y migración CDC

## Rutas Implementadas

Rutas actuales del frontend:
- `/login`
- `/dashboard`
- `/indicadores`
- `/acciones`
- `/acciones/nueva`
- `/acciones/:id`
- `/gantt`
- `/instrumento/:id`
- `/avance/:indicador_id/:corte_id`
- `/admin`

Comportamiento por ruta:
- `/login`: recibe el retorno de OAuth, procesa `sessionStorage`, valida sesión contra backend
- `/dashboard`: muestra tarjetas por instrumento, comparativo de cumplimiento y resumen de próximos cortes
- `/indicadores`: muestra todos los indicadores del sistema con filtros por tipo, responsable e instrumento
- `/acciones`: muestra KPIs, filtros y tabla de acciones reales
- `/acciones/nueva`: crea una acción real asociada a un indicador activo
- `/acciones/:id`: muestra detalle base, métricas principales y bitácora/medios de la acción
- `/gantt`: muestra calendario anual de cortes con modal de métricas
- `/instrumento/:id`: muestra indicadores del instrumento filtrados por corte
- `/avance/:indicador_id/:corte_id`: crea o edita un avance
- `/admin`: CRUD maestro para usuarios, instrumentos, indicadores y cortes

Rutas protegidas:
- todas excepto `/login`
- `/admin` restringida a rol `admin`

## Acciones Backend Disponibles

Acciones actualmente cableadas desde `Code.gs`:

Sesión:
- `validarSesion`

Usuarios:
- `getUsuarios`
- `updateUsuario`

Instrumentos:
- `getInstrumentos`
- `createInstrumento`
- `updateInstrumento`

Indicadores:
- `getIndicador`
- `getIndicadores`
- `createIndicador`
- `updateIndicador`
- `deleteIndicador`

Cortes:
- `getCortes`
- `getAllCortes`
- `createCorte`
- `cerrarCorte`

Avances:
- `getAvancesPorCorte`
- `upsertAvance`
- `aprobarAvance`
- `observarAvance`

Dashboard:
- `getDashboardResumen`
- `getDashboardInstrumento`
- `getGanttData`
- `getMetricasCorte`

Acciones:
- `getAcciones`
- `getAccion`
- `createAccion`
- `updateAccion`
- `updateEstadoAccion`
- `addComentarioAccion`
- `updateComentarioAccion`
- `deleteComentarioAccion`
- `uploadMedioVerificacion`
- `getMediosAccion`

## Pantallas y Capacidades Ya Implementadas

### Login
- OAuth por redirect
- callback vía `auth_callback.html`
- lectura del resultado desde `sessionStorage`
- validación de usuario activo en backend

### Dashboard
- 4 tarjetas por instrumento
- barra de progreso de cumplimiento
- badge de semáforo
- resumen de avances por instrumento
- próximos cortes
- gráfico comparativo con Recharts
- acceso al calendario y al detalle del instrumento
- skeleton visual rico durante carga inicial

### Indicadores
- vista global de indicadores sin exigir seleccionar instrumento al entrar
- filtros por texto, tipo de indicador, responsable e instrumento
- KPIs simples de visibles, activos, sin meta y responsables unicos
- acceso directo al detalle del indicador dentro de su instrumento

### Detalle de Instrumento
- selector de corte activo
- tabla de indicadores
- acceso a ingreso/edición de avance
- aprobación y observación de avances
- modal con detalle del indicador y sus acciones relacionadas

### Ingreso de Avance
- carga del indicador y del corte
- cálculo en tiempo real de porcentaje
- preview del semáforo
- validación de comentario obligatorio bajo 80%
- bloqueo si el corte está cerrado

### Gantt
- vista anual por instrumento
- representación de cortes por mes
- colores por estado
- modal con métricas del corte seleccionado
- skeleton estructurado durante carga
- modal de detalle expandido a ancho casi completo de pantalla
- normalización visual de fechas en tarjetas y modal de corte
- resaltado visual automático del corte abierto más próximo a vencer

### Admin
- tab usuarios
- tab instrumentos
- tab indicadores
- tab cortes
- altas y ediciones principales ya conectadas al backend

### Acciones
- listado principal con KPIs reales desde backend
- skeletons en loading del módulo
- precarga de datos entre rutas desde el shell y el sidebar
- barra superior de progreso durante navegación y fetch
- filtros por búsqueda, estado, instrumento y equipo responsable
- tabla moderna con navegación a detalle
- tabla compactada para mejorar visibilidad horizontal en escritorio
- fechas de compromiso y actualización normalizadas en el listado
- formulario real de creación en `/acciones/nueva`
- detalle base en `/acciones/:id`
- overlay de carga mientras se sube un medio de verificación
- integración con backend Apps Script
- soporte inicial de medios de verificación en backend

## Estado Actual del Módulo Acciones

### Qué quedó implementado

Frontend:
- sidebar y rutas del módulo ya operativas
- pantalla `/acciones` con cards KPI, filtros y tabla
- carga visual con skeleton en vez de spinner en listado, dashboard y gantt
- precarga silenciosa de dashboard, acciones y gantt desde el shell para mejorar navegación
- barra superior de progreso para navegación y consultas activas
- pantalla `/acciones/nueva` conectada a instrumentos e indicadores activos
- creación real usando `createAccion`
- pantalla `/acciones/:id` con detalle base
- pantalla `/acciones/:id` con carga real de medios desde frontend, edición de nombre visible y descripción previa al upload
- pantalla `/acciones/:id` con overlay de carga al subir medios para evitar sensación de bloqueo
- pantalla `/acciones/:id` con comentarios operativos persistidos en backend
- creación de comentarios con optimistic update para aparición inmediata en UI
- edición y eliminación de comentarios persistidos desde el sidebar
- lenguaje de UI ya alineado a “Equipo responsable”

Backend:
- `Acciones.gs` implementa lectura, detalle, creación, actualización, cambio de estado y medios
- `Acciones.gs` implementa además comentarios persistidos con alta, edición y eliminación lógica
- `Code.gs` ya expone todas las acciones del módulo
- `Code.gs` incorpora `autorizarServicios()` para forzar autorización de Drive con las constantes reales del proyecto
- `Setup.gs` ya define hojas `acciones`, `medios_verificacion` y `comentarios_accion`
- `Acciones.gs` fuerza `ensureAccionesSchema()` al cargar el bundle para autocurar faltantes de esquema del módulo
- invalidación de cache de acciones integrada a `Utils`

### Cómo funciona hoy “Equipo responsable”

- el campo físico de hoja sigue llamándose `responsable` en `acciones`
- semánticamente ya no representa una persona sino un equipo/área
- ese valor se toma desde `equipo_trabajo` del indicador
- si `equipo_trabajo` está vacío, se usa `subdimension` como respaldo
- el frontend no permite texto libre para ese dato en Nueva Acción
- el backend valida que el valor enviado coincida con el equipo del indicador

### Reglas de negocio activas en Acciones

- una acción solo puede crearse sobre un indicador activo
- `nombre`, `responsable` y `fecha_compromiso` son obligatorios
- `avance` debe estar entre 0 y 100
- si estado es `planificada`, el avance debe ser 0
- si estado es `completada`, el avance debe ser 100
- `fecha_compromiso` no puede ser anterior a `fecha_inicio`
- solo `admin`, `director_ejecutivo` y `subdirector` pueden gestionar acciones
- `subdirector` solo puede editar si la acción fue creada por él o si coincide con su área/equipo

### Lo pendiente dentro de Acciones

- edición visual completa de acciones desde frontend
- timeline operativo más rico en detalle
- validaciones más profundas de transición de estados
- posible refactor de nombres internos para reemplazar `responsable` por `equipoResponsable`

## Reglas de Negocio Implementadas

### Avances
- comentario obligatorio cuando el cumplimiento es menor a 80%
- no se permite ingresar ni editar avances en cortes cerrados
- semáforo calculado automáticamente
- un avance por indicador y corte
- aprobación y observación solo para `admin` o `director_ejecutivo`
- permisos de edición de avances restringidos al responsable del indicador o admin

### Datos activos
- indicadores activos e instrumentos activos son los que se consideran en dashboard y vistas principales
- cuando no hay pesos válidos en un instrumento, el dashboard cae a un promedio simple de cumplimiento

### Acciones
- el equipo responsable debe ser coherente con el indicador asociado
- el filtro de acciones por “responsable” internamente hoy filtra por equipo
- las acciones se decoran en backend con `responsable_display` para la UI

## Reglas de Acceso

- solo entra quien tenga correo institucional válido y exista en hoja `usuarios`
- `admin` tiene CRUD total y puede aprobar u observar avances
- `director_ejecutivo` puede revisar, aprobar y observar avances
- `subdirector` puede cargar o editar avances solo en indicadores donde es responsable
- `admin`, `director_ejecutivo` y `subdirector` pueden crear acciones

## Optimizaciones de Rendimiento Implementadas

### Backend Apps Script

- `Dashboard.gs` fue reescrito para cargar cada hoja una sola vez por request y trabajar con índices en memoria
- `Dashboard.gs` construye mapas por `instrumento_id`, `corte_id` e `indicador_id` para evitar filtros repetidos sobre arreglos completos
- `Acciones.gs` usa lecturas cacheadas por hoja para acciones, medios, indicadores e instrumentos
- `Utils.updateRowById()` actualiza filas con una sola llamada `setValues()` en vez de reconstruir lecturas innecesarias

### CacheService

- existe cache de script para respuestas de dashboard, gantt y métricas de corte
- existe cache corta por hoja maestra para `usuarios`, `instrumentos`, `indicadores`, `cortes`, `avances`, `acciones` y `medios_verificacion`
- `appendRow()` y `updateRowById()` invalidan automáticamente la cache de la hoja afectada
- las mutaciones de avances, cortes, instrumentos, indicadores y acciones invalidan también la cache agregada correspondiente

### Percepción de carga en frontend

- `AppShell.js` precarga en segundo plano dashboard, acciones y gantt al entrar a la aplicación
- `Sidebar.js` vuelve a precargar vistas clave al pasar el mouse o enfocar opciones del menú
- existe barra superior de progreso visual durante navegación y fetch activo
- dashboard, acciones y gantt usan skeletons estructurados en vez de spinners duros
- la subida de medios en detalle de acción muestra un overlay de progreso para evitar sensación de congelamiento

TTLs actuales relevantes:
- `usuarios`: 120 segundos
- `instrumentos`: 120 segundos
- `cortes`: 120 segundos
- `indicadores`: 90 segundos
- `avances`: 45 segundos
- `acciones`: 60 segundos
- `medios_verificacion`: 60 segundos

## Hallazgos Técnicos Importantes

### CORS con Apps Script

Hallazgo:
- `Content-Type: application/json` dispara preflight `OPTIONS`
- Apps Script no maneja bien ese preflight en este flujo

Decisión tomada:
- usar `Content-Type: text/plain;charset=UTF-8`

Consecuencia:
- el cliente sigue enviando JSON serializado en el body
- el backend sigue usando `JSON.parse(e.postData.contents)`

### COOP / popup OAuth

Hallazgo:
- Google devolvía `Cross-Origin-Opener-Policy: same-origin`
- eso cortaba `window.opener` y rompía el flujo popup

Decisión tomada:
- abandonar popup
- usar redirect completo hacia Google
- volver a `/login` a través de `auth_callback.html`

Consecuencia:
- `auth_callback.html` guarda el resultado en `sessionStorage`
- `Login.js` procesa ese valor al volver

### Tipos booleanos desde Google Sheets

Hallazgo:
- en Google Sheets algunos booleanos llegan como `true`, `'TRUE'` o `'true'`

Decisión tomada:
- varias validaciones aceptan las tres variantes

Consecuencia:
- no asumir consistencia estricta de tipos al leer filas desde Sheets

### Rendimiento Apps Script / Sheets

Hallazgo:
- el principal cuello de botella no estaba en React sino en Apps Script leyendo y filtrando hojas demasiadas veces por request

Decisión tomada:
- mover la optimización al backend
- usar índices en memoria para dashboard
- usar `CacheService` para respuestas agregadas y lecturas cortas por hoja

Consecuencia:
- varias pantallas ganan velocidad sin cambiar de forma importante el frontend
- cualquier mutación relevante debe seguir invalidando la cache correspondiente

### Bundle del frontend

Hallazgo:
- al integrar Recharts y crecer la UI, el bundle del frontend aumentó

Consecuencia:
- es esperable en el estado actual
- si en el futuro se busca optimización, revisar carga diferida o división más fina de pantallas

### Autorización de Drive en Apps Script

Hallazgo:
- la subida de medios puede fallar con errores como `No cuentas con el permiso para llamar a DriveApp.getFoldersByName`
- ese fallo no depende del frontend sino de permisos pendientes del Web App de Apps Script

Decisión tomada:
- agregar `autorizarServicios()` en `Code.gs` usando `Config.SHEET_ID` y `Drive.getOrCreateRootFolder_()`

Consecuencia:
- después de copiar el backend al proyecto real, hay que ejecutar manualmente `autorizarServicios()` desde Apps Script
- luego se debe volver a publicar el Web App para que la subida a Drive funcione en ambiente real

### Esquema mínimo de Acciones en Apps Script

Hallazgo:
- al incorporar comentarios persistidos, el módulo Acciones pasó a depender también de la hoja `comentarios_accion`
- si esa hoja no existe en el Apps Script publicado, el listado puede dejar de mostrar acciones aunque los datos existan

Decisión tomada:
- extender `Setup.gs` con `setupAcciones()` para crear o completar el esquema del módulo
- ejecutar `ensureAccionesSchema()` también al cargar el bundle de `Acciones.gs`

Consecuencia:
- en despliegues existentes conviene ejecutar manualmente `setupAcciones()` después de copiar backend nuevo
- luego se debe volver a publicar el Web App para que el ambiente real use ese esquema actualizado

### Fechas ISO desde backend

Hallazgo:
- varias vistas estaban imprimiendo fechas ISO crudas como `2026-10-31T07:00:00.000Z`
- el problema no estaba en el dato sino en la falta de normalización de presentación por pantalla

Decisión tomada:
- normalizar fechas explícitamente en `Acciones.js`, `AccionDetalle.js` y `Gantt.js`
- diferenciar cuándo mostrar solo fecha y cuándo mostrar fecha con hora

Consecuencia:
- la UI ya no debe exponer strings ISO directamente en compromiso, actualización o cortes
- cualquier vista nueva que consuma fechas del backend debe aplicar el mismo criterio de formateo antes de renderizar

### Assets con hash en frontend

Hallazgo:
- errores `404` sobre archivos como `main.<hash>.css` suelen indicar desalineación entre el HTML desplegado y los assets de la build más reciente

Consecuencia:
- no confundir ese problema con permisos de Drive
- cuando cambian hashes del bundle, hace falta redeploy del frontend y eventualmente limpiar caché del navegador o CDN

## Cosas que No se Deben Tocar Sin Revisar Impacto

### Integración Apps Script
- no volver a `application/json` en `fetch` hacia Apps Script sin rediseñar el manejo CORS
- no asumir que editar este repo actualiza automáticamente Apps Script
- no asumir que el backend ya está desplegado solo porque el frontend compila
- no tocar las acciones del router en `Code.gs` sin actualizar los hooks del frontend correspondientes
- no olvidar ejecutar y autorizar `autorizarServicios()` si la subida a Drive empieza a fallar por permisos
- no olvidar ejecutar `setupAcciones()` cuando el backend del módulo cambie su esquema en Sheets

### Auth
- no reintroducir popup OAuth con `window.opener`
- no romper el flujo de `sessionStorage` en login sin revisar todo el retorno OAuth
- no modificar reglas de roles sin revisar `AuthContext`, rutas protegidas y validaciones backend

### Datos / Sheets
- no confiar en que `activo` siempre venga como booleano puro desde Sheets
- no renombrar columnas físicas de Google Sheets sin revisar `Setup.gs`, `Utils.gs` y los readers existentes
- no cambiar el significado actual de `acciones.responsable`: hoy guarda equipo/área, no usuario individual
- no borrar `equipo_trabajo` o `subdimension` en indicadores si Acciones depende de ese dato

### Rendimiento
- no agregar nuevas lecturas directas a Sheets en endpoints calientes si ya existe helper cacheado en `Utils.gs`
- no cambiar TTLs o invalidaciones de cache sin revisar impacto en dashboard, admin, detalle de instrumento y acciones

### UI / Dominio
- no volver a hablar de “Responsable” como persona en la UI de Acciones; el lenguaje correcto actual es “Equipo responsable”
- no habilitar texto libre para equipo responsable en Nueva Acción sin redefinir la regla backend
- no cambiar nombres de campos internos del módulo Acciones en una pasada superficial; si se refactoriza `responsable` a otro nombre, debe ser end-to-end

## Restricciones Operativas

- el backend Apps Script no se actualiza automáticamente desde este repo
- cualquier cambio en archivos `.gs` requiere copiar al proyecto Apps Script y republicar el Web App
- la migración CDC existe en código pero requiere ejecución manual con `migracionCDC()`
- la autorización de Drive también requiere ejecución manual de `autorizarServicios()` en Apps Script cuando corresponda
- Vercel requiere redeploy para reflejar cambios del frontend
- las mejoras de rendimiento backend no tienen efecto real hasta republicar el Web App de Apps Script

## Dependencias entre Capas

Dependencias importantes:
- `src/hooks/useApi.js` depende de los nombres de acción definidos en `backend/Code.gs`
- `Dashboard.js` y `Gantt.js` dependen de la forma de datos retornada por `Dashboard.gs`
- `InstrumentoDetalle.js` e `IngresarAvance.js` dependen de `Indicadores.gs`, `Cortes.gs` y `Avances.gs`
- `Acciones.js`, `NuevaAccion.js` y `AccionDetalle.js` dependen de `Acciones.gs`
- el login depende de `Auth.gs` y de la hoja `usuarios`
- la performance actual depende de que `Utils.gs` siga siendo el punto único para cache, invalidación y acceso a hojas

## Estado Operativo Actual

Código implementado localmente:
- fases 1 a 4 completas
- módulo Acciones en estado funcional operativo con carga de medios, loaders ricos, comentarios persistidos y navegación optimizada
- build frontend validado después de los cambios recientes

Pendiente de operación manual o despliegue según ambiente:
- copiar backend actualizado al proyecto real de Apps Script
- ejecutar `setupAcciones()` si el ambiente publicado aún no tiene `comentarios_accion`
- ejecutar `autorizarServicios()` para conceder permisos de Drive al proyecto publicado
- volver a desplegar el Web App de Apps Script cuando se agregan o modifican archivos `.gs`
- desplegar frontend en Vercel después de cambios relevantes
- ejecutar `migracionCDC()` si la batería CDC aún no fue cargada
- validar en ambiente real creación de acciones, detalle, comentarios y permisos por rol

## Pendientes Actuales

### Módulo Acciones
- edición completa desde frontend
- timeline operativo más completo
- revisión de nombres internos del dominio
- manejo más fino de errores backend para subida de medios y autorización de Drive
- eventual extracción de utilitarios compartidos de formateo de fecha entre vistas

### Fase 5
- `Emails.gs`
- `Templates.gs`
- `Triggers.gs`
- pruebas manuales de envío
- validación de logs en `alertas_log`

### Fase 6
- pruebas end-to-end por rol
- estabilización de despliegue final
- dominio personalizado
- capacitación y cierre operativo

## Riesgos a Vigilar

- el login y la autorización dependen de que el usuario exista y esté activo en `usuarios`
- las agregaciones del dashboard dependen de `peso`, `meta_valor` y avances correctamente cargados
- si el backend desplegado no coincide con el código local, el frontend puede fallar aunque compile
- Apps Script y Sheets tienen limitaciones de cuota y rendimiento si el volumen crece demasiado
- si una mutación nueva no invalida cache, se pueden mostrar datos desactualizados por algunos segundos
- si un indicador no trae `equipo_trabajo` ni `subdimension`, no podrá crear acciones coherentes hasta corregir la base

## Recomendación de Continuidad

Siguiente corte recomendado:
1. habilitar edición visual de acciones
2. mejorar mensajes de error backend en subida de medios y autorización de Drive
3. revisar si conviene refactor end-to-end de `responsable` a `equipo_responsable`
4. luego retomar Fase 5 de correos automáticos
