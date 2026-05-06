# Contexto de Desarrollo

## Proyecto

Sistema de Control de Gestion Institucional para SLEP Colchagua.

Stack actual:

## Objetivo del Documento

Este archivo debe servir como referencia viva del proyecto.

Debe permitir que cualquier persona retome el desarrollo entendiendo:
- que existe hoy
- como esta organizado el sistema
- cuales son las rutas y flujos principales
- que reglas de negocio ya estan implementadas
- que hallazgos tecnicos se detectaron durante el desarrollo
- que cosas no se deben hacer
- que partes siguen pendientes

## Proyecto

Sistema de Control de Gestion Institucional para SLEP Colchagua.

Objetivo funcional:
- centralizar el seguimiento de instrumentos institucionales
- registrar avances por indicador y corte
- visualizar cumplimiento por instrumento
- permitir aprobacion u observacion de avances
- preparar automatizacion de recordatorios y reportes

## Stack Actual

- Frontend: React + React Router + Tailwind + React Query + Recharts
- Backend: Google Apps Script como Web App
- Base de datos: Google Sheets
- Autenticacion: Google OAuth / Google Identity Services
- Deploy frontend: Vercel

## Estado General del Desarrollo

El repositorio tiene implementadas las fases 1 a 4 del plan de desarrollo definido en `install.md`.

Estado por fase:
- Fase 1: base de frontend, auth, `callApi()`, backend inicial y despliegue base del Web App
- Fase 2: CRUD admin de instrumentos, indicadores y cortes; migracion CDC preparada con `migracionCDC()`
- Fase 3: ingreso de avances, validaciones de negocio, detalle por instrumento y formulario de avance
- Fase 3.5: aprobacion y observacion de avances, mas modal de detalle de indicador en la tabla
- Fase 4: dashboard con agregaciones, tarjetas, grafico de barras y vista de calendario/gantt
- Fase 5: pendiente
- Fase 6: pendiente

## Estructura General

### Frontend

Carpeta principal: `src/`

Archivos y zonas relevantes:
- `App.js`: define las rutas principales
- `config/api.js`: encapsula `callApi()` y la URL del Apps Script
- `context/AuthContext.js`: sesion local del usuario
- `hooks/useApi.js`: hooks de consulta y mutacion contra el backend
- `pages/Login.js`: login con Google OAuth redirect
- `pages/Dashboard.js`: resumen visual de instrumentos
- `pages/InstrumentoDetalle.js`: tabla de indicadores por corte
- `pages/IngresarAvance.js`: formulario de avance
- `pages/Gantt.js`: calendario anual de cortes
- `pages/Admin.js`: panel de administracion
- `components/admin/*`: tabs CRUD del panel admin
- `components/layout/*`: shell, sidebar y rutas protegidas
- `components/ui/*`: modal, alert, spinner, utilitarios visuales

### Backend

Carpeta principal: `backend/`

Archivos presentes:
- `Auth.gs`
- `Code.gs`
- `Config.gs`
- `Cortes.gs`
- `Dashboard.gs`
- `Indicadores.gs`
- `Instrumentos.gs`
- `Setup.gs`
- `Usuarios.gs`
- `Utils.gs`
- `Avances.gs`

Responsabilidades:
- `Code.gs`: router principal por accion
- `Auth.gs`: validacion del `id_token`
- `Config.gs`: constantes, hojas y thresholds
- `Utils.gs`: helpers de Sheets, fechas, UUID, calculos comunes y capa de cache/invalidation
- `Instrumentos.gs`: CRUD de instrumentos
- `Indicadores.gs`: CRUD de indicadores
- `Cortes.gs`: CRUD de cortes y cambios de estado
- `Avances.gs`: guardado, aprobacion y observacion de avances
- `Dashboard.gs`: agregaciones optimizadas para dashboard, gantt y metricas por corte
- `Setup.gs`: setup inicial, seed y migracion CDC

## Rutas Implementadas

Rutas actuales del frontend:
- `/login`
- `/dashboard`
- `/gantt`
- `/instrumento/:id`
- `/avance/:indicador_id/:corte_id`
- `/admin`

Comportamiento por ruta:
- `/login`: recibe el retorno de OAuth, procesa `sessionStorage`, valida sesion contra backend
- `/dashboard`: muestra tarjetas por instrumento, comparativo de cumplimiento y resumen de proximos cortes
- `/gantt`: muestra calendario anual de cortes con modal de metricas
- `/instrumento/:id`: muestra indicadores del instrumento filtrados por corte
- `/avance/:indicador_id/:corte_id`: crea o edita un avance
- `/admin`: CRUD maestro para usuarios, instrumentos, indicadores y cortes

Rutas protegidas:
- todas excepto `/login`
- `/admin` restringida a rol `admin`

## Acciones Backend Disponibles

Acciones actualmente cableadas desde `Code.gs`:

Sesion:
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

## Pantallas y Capacidades Ya Implementadas

### Login
- OAuth por redirect
- callback via `auth_callback.html`
- lectura del resultado desde `sessionStorage`
- validacion de usuario activo en backend

### Dashboard
- 4 tarjetas por instrumento
- barra de progreso de cumplimiento
- badge de semaforo
- resumen de avances por instrumento
- proximos cortes
- grafico comparativo con Recharts
- acceso al calendario y al detalle del instrumento

### Detalle de Instrumento
- selector de corte activo
- tabla de indicadores
- acceso a ingreso/edicion de avance
- aprobacion y observacion de avances
- modal con detalle completo del indicador y del ultimo avance

### Ingreso de Avance
- carga del indicador y del corte
- calculo en tiempo real de porcentaje
- preview del semaforo
- validacion de comentario obligatorio bajo 80%
- bloqueo si el corte esta cerrado

### Gantt
- vista anual por instrumento
- representacion de cortes por mes
- colores por estado
- modal con metricas del corte seleccionado

### Admin
- tab usuarios
- tab instrumentos
- tab indicadores
- tab cortes
- altas y ediciones principales ya conectadas al backend

## Reglas de Negocio Implementadas

- comentario obligatorio cuando el cumplimiento es menor a 80%
- no se permite ingresar ni editar avances en cortes cerrados
- semaforo calculado automaticamente
- un avance por indicador y corte
- aprobacion y observacion solo para `admin` o `director_ejecutivo`
- permisos de edicion de avances restringidos al responsable del indicador o admin
- indicadores activos e instrumentos activos son los que se consideran en dashboard y vistas principales
- cuando no hay pesos validos en un instrumento, el dashboard cae a un promedio simple de cumplimiento

## Reglas de Acceso

- solo entra quien tenga correo institucional valido y exista en hoja `usuarios`
- `admin` tiene CRUD total y puede aprobar u observar avances
- `director_ejecutivo` puede revisar, aprobar y observar avances
- `subdirector` puede cargar o editar avances solo en indicadores donde es responsable

## Optimizaciones de Rendimiento Implementadas

### Backend Apps Script

- `Dashboard.gs` fue reescrito para cargar cada hoja una sola vez por request y trabajar con indices en memoria
- `Dashboard.gs` construye mapas por `instrumento_id`, `corte_id` e `indicador_id` para evitar filtros repetidos sobre arreglos completos
- `Utils.updateRowById()` ahora actualiza filas con una sola llamada `setValues()` en vez de reconstruir lecturas innecesarias

### CacheService

- existe cache de script para respuestas de dashboard, gantt y metricas de corte
- existe cache corta por hoja maestra para `usuarios`, `instrumentos`, `indicadores`, `cortes` y `avances`
- `appendRow()` y `updateRowById()` invalidan automaticamente la cache de la hoja afectada
- las mutaciones de avances, cortes, instrumentos e indicadores invalidan tambien la cache de dashboard para no servir agregados viejos

TTLs actuales:
- `usuarios`: 120 segundos
- `instrumentos`: 120 segundos
- `cortes`: 120 segundos
- `indicadores`: 90 segundos
- `avances`: 45 segundos

Impacto esperado:
- panel admin mas rapido
- detalle de instrumento mas rapido al entrar y al cambiar corte
- dashboard y gantt con menos lecturas repetidas a Google Sheets

## Hallazgos Tecnicos Importantes

### CORS con Apps Script

Hallazgo:
- `Content-Type: application/json` dispara preflight `OPTIONS`
- Apps Script no maneja bien ese preflight en este flujo

Decision tomada:
- usar `Content-Type: text/plain;charset=UTF-8`

Consecuencia:
- el cliente sigue enviando JSON serializado en el body
- el backend sigue usando `JSON.parse(e.postData.contents)`

### COOP / popup OAuth

Hallazgo:
- Google devolvia `Cross-Origin-Opener-Policy: same-origin`
- eso cortaba `window.opener` y rompia el flujo popup

Decision tomada:
- abandonar popup
- usar redirect completo hacia Google
- volver a `/login` a traves de `auth_callback.html`

Consecuencia:
- `auth_callback.html` guarda el resultado en `sessionStorage`
- `Login.js` procesa ese valor al volver

### URL del Apps Script mal escrita

Hallazgo:
- la URL del deployment del Web App tenia un typo
- una version devolvia `404` porque el deployment no existia

Decision tomada:
- corregir la URL del Apps Script en la configuracion local del frontend

Consecuencia:
- siempre verificar la URL real del deployment antes de diagnosticar CORS

### Tipos booleanos desde Google Sheets

Hallazgo:
- en Google Sheets algunos booleanos llegan como `true`, `'TRUE'` o `'true'`

Decision tomada:
- varias validaciones aceptan las tres variantes

Consecuencia:
- no asumir consistencia estricta de tipos al leer filas desde Sheets

### Bundle del frontend

Hallazgo:
- al integrar Recharts el bundle crecio de forma importante

Consecuencia:
- es esperable
- si en el futuro se busca optimizacion, revisar carga diferida o componentes mas finos

### Rendimiento Apps Script / Sheets

Hallazgo:
- el principal cuello de botella no estaba en React sino en Apps Script leyendo y filtrando hojas demasiadas veces por request

Decision tomada:
- mover la optimizacion al backend
- usar indices en memoria para dashboard
- usar `CacheService` para respuestas agregadas y lecturas cortas por hoja

Consecuencia:
- varias pantallas ganan velocidad sin cambiar de forma importante el frontend
- cualquier mutacion relevante debe seguir invalidando la cache correspondiente

## Cosas que No se Deben Hacer

- no volver a `application/json` en `fetch` hacia Apps Script sin rediseñar el manejo CORS
- no reintroducir popup OAuth con `window.opener`
- no asumir que editar este repo actualiza automaticamente Apps Script
- no asumir que el backend ya esta desplegado solo porque el frontend compila
- no exponer `SHEET_ID` ni secretos en frontend
- no romper el flujo de `sessionStorage` en login sin revisar todo el retorno OAuth
- no confiar en que `activo` siempre venga como booleano puro desde Sheets
- no modificar reglas de roles sin revisar `AuthContext`, vistas protegidas y validaciones backend
- no tocar las acciones del router en `Code.gs` sin actualizar los hooks del frontend correspondientes
- no agregar nuevas lecturas directas a Sheets en endpoints calientes si ya existe helper cacheado en `Utils.gs`
- no cambiar TTLs o invalidaciones de cache sin revisar impacto en dashboard, admin y detalle de instrumento

## Restricciones Operativas

- el backend Apps Script no se actualiza automaticamente desde este repo
- cualquier cambio en archivos `.gs` requiere copiar al proyecto Apps Script y republicar el Web App
- la migracion CDC existe en codigo pero requiere ejecucion manual con `migracionCDC()`
- Vercel requiere redeploy para reflejar cambios del frontend
- las mejoras de rendimiento backend no tienen efecto real hasta republicar el Web App de Apps Script

## Dependencias entre Capas

Dependencias importantes:
- `src/hooks/useApi.js` depende de los nombres de accion definidos en `backend/Code.gs`
- `Dashboard.js` y `Gantt.js` dependen de la forma de datos retornada por `Dashboard.gs`
- `InstrumentoDetalle.js` e `IngresarAvance.js` dependen de `Indicadores.gs`, `Cortes.gs` y `Avances.gs`
- el login depende de `Auth.gs` y de la hoja `usuarios`
- la performance actual depende de que `Utils.gs` siga siendo el punto unico para cache, invalidacion y acceso a hojas

## Estado Operativo Actual

Codigo implementado:
- fases 1 a 4

Pendiente de operacion manual o despliegue segun ambiente:
- copiar backend actualizado al proyecto real de Apps Script
- volver a desplegar el Web App de Apps Script cuando se agregan o modifican archivos `.gs`
- desplegar frontend en Vercel despues de cambios relevantes
- ejecutar `migracionCDC()` si la bateria CDC aun no fue cargada
- validar en ambiente real la mejora de tiempos del panel admin, dashboard, gantt y detalle de instrumento despues del redeploy backend

## Pendientes Actuales

### Fase 5
- `Emails.gs`
- `Templates.gs`
- `Triggers.gs`
- pruebas manuales de envio
- validacion de logs en `alertas_log`

### Fase 6
- pruebas end-to-end por rol
- estabilizacion de despliegue final
- dominio personalizado
- capacitacion y cierre operativo

## Riesgos a Vigilar

- el login y la autorizacion dependen de que el usuario exista y este activo en `usuarios`
- las agregaciones del dashboard dependen de `peso`, `meta_valor` y avances correctamente cargados
- si el backend desplegado no coincide con el codigo local, el frontend puede fallar aunque compile
- Apps Script y Sheets tienen limitaciones de cuota y rendimiento si el volumen crece demasiado
- si una mutacion nueva no invalida cache, se pueden mostrar datos desactualizados por algunos segundos

## Recomendacion de Continuidad

Siguiente fase recomendada:
- avanzar con Fase 5

Prioridad sugerida:
1. implementar `Emails.gs`
2. implementar `Templates.gs`
3. implementar `Triggers.gs`
4. probar envios manuales
5. registrar resultados y ajustes en este mismo archivo

## Estado General

El repositorio tiene implementadas las fases 1 a 4 del plan de desarrollo definido en `install.md`.

Estado por fase:
- Fase 1: base de frontend, auth, `callApi()`, backend inicial y despliegue base del Web App
- Fase 2: CRUD admin de instrumentos, indicadores y cortes; migracion CDC preparada con `migracionCDC()`
- Fase 3: ingreso de avances, validaciones de negocio, detalle por instrumento y formulario de avance
- Fase 3.5: aprobacion y observacion de avances, mas modal de detalle de indicador en la tabla
- Fase 4: dashboard con agregaciones, tarjetas, grafico de barras y vista de calendario/gantt

## Backend Implementado

Archivos principales actualmente presentes en `backend/`:
- `Auth.gs`
- `Code.gs`
- `Config.gs`
- `Cortes.gs`
- `Dashboard.gs`
- `Indicadores.gs`
- `Instrumentos.gs`
- `Setup.gs`
- `Usuarios.gs`
- `Utils.gs`
- `Avances.gs`

Capacidades backend ya implementadas:
- whitelist por correo institucional usando `usuarios`
- CRUD de instrumentos
- CRUD de indicadores
- CRUD de cortes y cierre de corte
- upsert de avances
- aprobacion y observacion de avances
- agregaciones para dashboard
- datos para vista de gantt
- metricas por corte
- setup inicial de hojas
- seed de instrumentos y cortes 2026
- migracion CDC desde hoja base mediante `migracionCDC()`

## Frontend Implementado

Rutas actuales:
- `/login`
- `/dashboard`
- `/gantt`
- `/instrumento/:id`
- `/avance/:indicador_id/:corte_id`
- `/admin`

Pantallas listas:
- Login con redirect OAuth
- Dashboard con 4 tarjetas por instrumento
- grafico comparativo de cumplimiento
- resumen de proximos cortes
- detalle de instrumento por corte
- formulario de ingreso de avance
- calendario / gantt con modal de metricas
- administracion con tabs de usuarios, instrumentos, indicadores y cortes

## Reglas de Negocio Ya Aplicadas

- comentario obligatorio cuando el cumplimiento es menor a 80%
- no se permite ingresar ni editar avances en cortes cerrados
- semaforo calculado automaticamente
- un avance por indicador y corte
- aprobacion y observacion solo para `admin` o `director_ejecutivo`
- permisos de edicion de avances restringidos al responsable del indicador o admin

## Decisiones Tecnicas Relevantes

- El frontend envia requests al Apps Script usando `Content-Type: text/plain;charset=UTF-8` para evitar preflight CORS.
- El flujo OAuth fue cambiado de popup a redirect para evitar problemas de COOP con `window.opener`.
- El resultado del callback OAuth se guarda en `sessionStorage` y luego se procesa al volver a `/login`.
- La URL del Apps Script tenia un typo y fue corregida en la configuracion local del frontend.
- El dashboard usa Recharts; por eso el bundle del frontend crecio de forma importante al cerrar la fase 4.
- La optimizacion principal de velocidad se movio al backend Apps Script usando indices en memoria y `CacheService`.
- Las lecturas de `usuarios`, `instrumentos`, `indicadores`, `cortes` y `avances` ahora pueden servirse desde cache corta por hoja.

## Estado Operativo Importante

Hay diferencias entre "codigo implementado" y "operacion desplegada".

Pendiente o dependiente de operacion manual:
- copiar cambios nuevos del backend al proyecto real de Google Apps Script
- volver a desplegar el Web App de Apps Script cuando se agregan/modifican archivos `.gs`
- ejecutar `migracionCDC()` si la bateria CDC aun no ha sido cargada a `indicadores`
- desplegar el frontend en Vercel despues de cambios relevantes

## Pendientes Actuales

Fase 5 pendiente:
- automatizacion de correos
- templates HTML finales
- triggers programados
- pruebas de envio y logs

Fase 6 pendiente:
- pruebas de roles y permisos end-to-end
- despliegue final estabilizado
- configuracion de dominio personalizado
- capacitacion y cierre operativo

## Riesgos o Puntos a Cuidar

- El backend Apps Script no se actualiza automaticamente desde este repo; requiere copia y nuevo deploy manual.
- La data de Google Sheets puede venir con booleanos como `true`, `'TRUE'` o `'true'`; varias validaciones ya contemplan eso.
- El login y la autorizacion dependen de que el usuario exista y este activo en la hoja `usuarios`.
- Las agregaciones del dashboard dependen de que `peso`, `meta_valor` y avances esten correctamente cargados.

## Siguiente Paso Recomendado

Continuar con Fase 5:
- `Emails.gs`
- `Templates.gs`
- `Triggers.gs`
- pruebas manuales de recordatorios y reportes
