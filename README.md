# Sistema de Control de Gestion Institucional

Aplicacion para el seguimiento de instrumentos de gestion del SLEP Colchagua.

El sistema centraliza:
- instrumentos, indicadores y cortes
- ingreso, aprobacion y observacion de avances
- dashboard y calendario anual de cortes
- modulo operativo de acciones por indicador
- carga de medios de verificacion y comentarios operativos persistidos

## Stack

- Frontend: React + React Router + Tailwind + React Query + Recharts
- Backend: Google Apps Script Web App
- Base de datos: Google Sheets
- Auth: Google OAuth / Google Identity Services
- Deploy frontend: Vercel

## Rutas principales

- `/login`
- `/dashboard`
- `/gantt`
- `/instrumento/:id`
- `/avance/:indicador_id/:corte_id`
- `/acciones`
- `/acciones/nueva`
- `/acciones/:id`
- `/admin`

## Estado actual

Ya estan implementados:
- dashboard con agregaciones y skeletons
- calendario de cortes con modal ampliado, fechas normalizadas y resaltado del corte mas proximo a vencer
- CRUD admin principal de instrumentos, indicadores, usuarios y cortes
- flujo de avances con validaciones y revision
- modulo Acciones con listado, detalle, cambio rapido de estado, carga de medios, comentarios persistidos y optimistic update para comentarios
- precarga entre rutas y barra superior de progreso para mejorar percepcion de carga

## Estructura

Frontend:
- `src/pages/`: vistas principales
- `src/components/`: componentes de UI, layout, admin y acciones
- `src/hooks/useApi.js`: hooks de consulta y mutacion
- `src/context/AuthContext.js`: sesion del usuario
- `src/config/api.js`: integracion con Apps Script

Backend:
- `backend/Code.gs`: router principal
- `backend/Auth.gs`: validacion del token
- `backend/Dashboard.gs`: resumenes y datos de calendario
- `backend/Acciones.gs`: CRUD del modulo Acciones, medios y comentarios
- `backend/Setup.gs`: setup inicial, esquema de acciones y migracion
- `backend/Utils.gs`: helpers de Sheets y cache

## Instalacion local del frontend

Requisitos:
- Node.js 18+
- npm

Comandos:

```bash
npm install
npm start
```

Build de produccion:

```bash
npm run build
```

## Operacion del backend Apps Script

Los cambios en `backend/*.gs` no se despliegan automaticamente desde este repositorio.

Cada vez que cambies backend debes:
1. Copiar los archivos `.gs` al proyecto real de Apps Script.
2. Ejecutar las funciones manuales que correspondan.
3. Publicar una nueva version del Web App.

Funciones operativas importantes:
- `setupInicial()`: crea hojas base y seeds iniciales. Solo para instalacion inicial.
- `setupAcciones()`: crea o completa el esquema del modulo Acciones. Usar cuando cambie ese modulo en ambientes ya existentes.
- `autorizarServicios()`: fuerza autorizacion de Drive para subida de evidencias.
- `migracionCDC()`: carga o migra la bateria CDC si aun no existe en la base.

## Pasos minimos despues de cambios recientes en Acciones

Si el ambiente publicado no tiene aun comentarios persistidos o dejo de mostrar acciones, ejecutar:

1. Copiar backend actualizado.
2. Ejecutar `setupAcciones()`.
3. Ejecutar `autorizarServicios()` si la subida a Drive falla o aun no fue autorizada.
4. Publicar nuevamente el Web App.

## Hallazgos operativos importantes

### CORS con Apps Script

Las llamadas al backend deben seguir usando `Content-Type: text/plain;charset=UTF-8`.

No cambiar a `application/json` sin rediseñar el flujo, porque Apps Script dispara preflight y el backend actual no esta preparado para ese manejo.

### OAuth

El login usa redirect completo, no popup. El popup genero problemas por `Cross-Origin-Opener-Policy` y se descarto.

### Drive

Los errores de `DriveApp` no dependen del frontend. Normalmente indican que falta ejecutar `autorizarServicios()` y republicar el Web App.

### Esquema de Acciones

El modulo Acciones hoy depende de estas hojas:
- `acciones`
- `medios_verificacion`
- `comentarios_accion`

Si `comentarios_accion` no existe en el Apps Script publicado, el modulo puede quedar inconsistente. Por eso existe `setupAcciones()` y `Acciones.gs` asegura el esquema al leer.

### Fechas

El backend puede entregar fechas ISO. La UI ya las normaliza en Acciones, detalle de accion y calendario de cortes. Cualquier vista nueva que consuma fechas del backend debe formatearlas antes de renderizar.

## Reglas de negocio clave

Avances:
- comentario obligatorio bajo 80%
- no se edita un avance en corte cerrado
- aprobacion y observacion solo para `admin` o `director_ejecutivo`

Acciones:
- solo se crean sobre indicadores activos
- `nombre`, `responsable` y `fecha_compromiso` son obligatorios
- `avance` entre 0 y 100
- `planificada` exige avance 0
- `completada` exige avance 100
- `fecha_compromiso` no puede ser menor que `fecha_inicio`
- el campo fisico `responsable` guarda el equipo o area, no una persona

## Despliegue

Frontend:
- desplegar en Vercel despues de cambios relevantes en `src/`

Backend:
- copiar `.gs`
- ejecutar setup o autorizacion si corresponde
- republicar el Web App

## Referencias del repositorio

- [contex.md](contex.md): documento vivo con estado de desarrollo, hallazgos y pendientes
- Documentacion modular:
- [contex_dashboard.md](contex_dashboard.md): contexto funcional y tecnico de `src/pages/Dashboard.js`
- [contex_acciones.md](contex_acciones.md): contexto funcional y tecnico de `src/pages/Acciones.js`
- [contex_accion_detalle.md](contex_accion_detalle.md): contexto funcional y tecnico de `src/pages/AccionDetalle.js`
- [contex_gantt.md](contex_gantt.md): contexto funcional y tecnico de `src/pages/Gantt.js`
- [contex_ingresar_avance.md](contex_ingresar_avance.md): contexto funcional y tecnico de `src/pages/IngresarAvance.js`
- [install.md](install.md): documento base de instalacion y arquitectura
- `backend/`: implementacion Apps Script
- `src/`: implementacion React
