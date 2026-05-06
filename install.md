# PROMPT MAESTRO — Sistema de Control de Gestión Institucional
## SLEP Colchagua · Versión 2.0 · Mayo 2026

> **Instrucción de uso:** Este documento es el prompt arquitectónico completo para construir la aplicación. Entrégalo íntegro a cualquier IA de código (Claude, Cursor, GPT-4o) e indica qué módulo quieres construir primero. Cada sección es autosuficiente.

---

## 0. IDENTIDAD VISUAL (APLICAR EN TODO EL FRONTEND)

La aplicación usa la paleta institucional oficial del SLEP Colchagua. **No usar colores fuera de esta paleta.**

```css
:root {
  /* Colores base */
  --color-navy:       #25306B;  /* Azul marino — fondo sidebar, headers principales */
  --color-blue:       #006BB9;  /* Azul institucional — botones primarios, links activos */
  --color-red:        #FF1D3D;  /* Rojo alerta — semáforo rojo, badges de riesgo */
  --color-gray-light: #EDF0F5;  /* Gris claro — fondos de página, cards secundarias */

  /* Gradientes institucionales */
  --gradient-navy:  linear-gradient(135deg, #2C3D9E 0%, #25306B 100%);
  --gradient-blue:  linear-gradient(135deg, #006BB9 0%, #25306B 100%);
  --gradient-alert: linear-gradient(135deg, #FF1D3D 0%, #EDF0F5 100%);

  /* Semáforos de gestión */
  --semaforo-verde:    #22C55E;  /* Cumplimiento ≥ 80% */
  --semaforo-amarillo: #F59E0B;  /* Cumplimiento 50–79% */
  --semaforo-rojo:     #FF1D3D;  /* Cumplimiento < 50% (usa color institucional) */

  /* Tipografía */
  --font-display: 'Montserrat', sans-serif;   /* Títulos, nombres de instrumentos */
  --font-body:    'Inter', sans-serif;         /* Cuerpo, tablas, formularios */

  /* Espaciado y bordes */
  --radius-card: 12px;
  --shadow-card: 0 2px 12px rgba(37, 48, 107, 0.10);
}
```

**Regla de diseño:** El sidebar usa `--color-navy`. Los botones primarios usan `--color-blue`. Los estados de alerta crítica usan `--color-red`. El fondo general de página usa `--color-gray-light`. Nunca usar colores grises genéricos ni violetas.

---

## 1. CONTEXTO DEL SISTEMA

### Organización
**Servicio Local de Educación Pública (SLEP) Colchagua**, entidad pública dependiente del Ministerio de Educación de Chile. Opera en la región de O'Higgins, gestionando 68 establecimientos educacionales en 4 comunas.

### Problema que resuelve
El SLEP gestiona cuatro instrumentos de planificación y evaluación institucional que contienen decenas de indicadores con metas, fechas de corte y responsables. Hoy el seguimiento es manual (Excel + correos). Esta aplicación centraliza, automatiza y da visibilidad en tiempo real al cumplimiento de esos instrumentos.

### Usuarios del sistema
Solo personal interno del SLEP Colchagua, autenticado con correo institucional Google.

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `admin` | Administrador del sistema | CRUD completo de instrumentos, indicadores, usuarios, cortes |
| `subdirector` | Subdirector de área responsable | Ingresa y edita avances de sus instrumentos asignados. Lee todo. |
| `director_ejecutivo` | Director Ejecutivo del SLEP | Lectura completa. Puede aprobar/observar avances. Recibe todos los reportes. |

---

## 2. INSTRUMENTOS DE GESTIÓN

### Ciclos y estructura de seguimiento

| Código | Nombre Completo | Ciclo | Tipo de seguimiento |
|--------|----------------|-------|---------------------|
| **CDC** | Convenio de Desempeño Colectivo | Anual | Cortes semestrales (S1: junio, S2: diciembre) |
| **PAL** | Plan Anual Local | Anual | Cortes trimestrales (T1, T2, T3, T4) |
| **PEL** | Plan Estratégico Local | Anual (plurianual) | Corte anual (diciembre) + hitos intermedios |
| **PMG** | Plan de Mejoramiento de la Gestión | Anual | Cortes trimestrales (T1, T2, T3, T4) |

### Estructura de datos del CDC (Batería de indicadores)
El CDC es el instrumento más complejo. Su batería tiene la siguiente jerarquía:

```
CDC
├── Dimensión (ej: "Gestión Pedagógica", "Gestión de Recursos")
│   ├── Subdimensión (ej: "Planificación curricular")
│   │   ├── Indicador (ej: "CDC-01")
│   │   │   ├── Nombre del indicador
│   │   │   ├── Descripción / fórmula de cálculo
│   │   │   ├── Unidad de medida (%, número, booleano)
│   │   │   ├── Meta (valor objetivo)
│   │   │   ├── Ponderación dentro de la subdimensión (%)
│   │   │   ├── Fuente de verificación
│   │   │   └── Responsable (subdirector)
```

> **IMPORTANTE para el desarrollador:** Los indicadores exactos de cada instrumento están en el archivo Excel entregado por el SLEP (`Batería_CDC_SLEP_en_regimen.xlsx`). Deben migrarse a la hoja `indicadores` de Google Sheets durante el setup inicial. La app debe permitir editar estos indicadores desde la vista Admin sin tocar código.

---

## 3. STACK TECNOLÓGICO

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND — Vercel                        │
│            React 18 + Vite · React Router v6               │
│         Tailwind CSS · Recharts · date-fns                  │
│         Auth: Google Identity Services (GSI)               │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS POST (JSON)
┌──────────────────────▼──────────────────────────────────────┐
│               BACKEND — Google Apps Script                  │
│          doPost() como API REST · Web App pública           │
│      Validación: Google tokeninfo (id_token por request)   │
│      Email: GmailApp · Triggers: ScriptApp.newTrigger()    │
└──────────────────────┬──────────────────────────────────────┘
                       │ SpreadsheetApp
┌──────────────────────▼──────────────────────────────────────┐
│             BASE DE DATOS — Google Sheets                   │
│         Archivo: SLEP_Colchagua_Gestion_DB.xlsx            │
│   Hojas: usuarios · instrumentos · cortes · indicadores    │
│          avances · alertas_log · config                     │
└─────────────────────────────────────────────────────────────┘
```

### package.json (frontend)
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.22.0",
    "recharts": "^2.12.0",
    "@tanstack/react-query": "^5.28.0",
    "tailwindcss": "^3.4.0",
    "date-fns": "^3.6.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 4. MODELO DE DATOS — GOOGLE SHEETS

Archivo único: `SLEP_Colchagua_Gestion_DB`

---

### Hoja: `usuarios`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | Identificador único |
| `email` | string | Correo institucional Google |
| `nombre` | string | Nombre completo |
| `rol` | enum | `admin` \| `subdirector` \| `director_ejecutivo` |
| `area` | string | Subdirección o área funcional |
| `activo` | boolean | Acceso habilitado |
| `creado_en` | timestamp | ISO 8601 |

---

### Hoja: `instrumentos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | |
| `codigo` | string | `CDC` \| `PAL` \| `PEL` \| `PMG` |
| `nombre` | string | Nombre completo del instrumento |
| `descripcion` | string | Resumen del propósito |
| `ciclo` | enum | `anual` |
| `tipo_seguimiento` | enum | `semestral` \| `trimestral` \| `anual_con_hitos` |
| `responsable_id` | string | FK → usuarios.id (subdirector dueño) |
| `color_hex` | string | Color de UI para distinguir instrumentos |
| `activo` | boolean | |
| `creado_en` | timestamp | |

**Colores por instrumento (predefinidos):**
- CDC → `#25306B` (navy)
- PAL → `#006BB9` (blue)
- PEL → `#2C3D9E` (blue-navy)
- PMG → `#FF1D3D` (red)

---

### Hoja: `cortes`
Un instrumento tiene múltiples cortes por año.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | |
| `instrumento_id` | string | FK → instrumentos.id |
| `codigo_corte` | string | Ej: `CDC-S1-2026`, `PAL-T2-2026` |
| `nombre_corte` | string | Ej: "Semestre 1 2026", "Trimestre 2 2026" |
| `fecha_inicio` | date | YYYY-MM-DD |
| `fecha_limite` | date | Fecha máxima para ingresar avances |
| `dias_recordatorio` | number | Días antes del corte para alertar (default: 7) |
| `estado` | enum | `pendiente` \| `en_curso` \| `cerrado` |
| `año` | number | Año del ciclo |

**Cortes predefinidos por instrumento (año 2026):**
```
CDC: CDC-S1-2026 (límite 30-jun) · CDC-S2-2026 (límite 15-dic)
PAL: PAL-T1-2026 (límite 31-mar) · PAL-T2-2026 (límite 30-jun) · PAL-T3-2026 (límite 30-sep) · PAL-T4-2026 (límite 15-dic)
PEL: PEL-A1-2026 (límite 15-dic) + hitos configurables
PMG: PMG-T1-2026 (límite 31-mar) · PMG-T2-2026 (límite 30-jun) · PMG-T3-2026 (límite 30-sep) · PMG-T4-2026 (límite 15-dic)
```

---

### Hoja: `indicadores`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | |
| `instrumento_id` | string | FK → instrumentos.id |
| `dimension` | string | Dimensión (solo CDC) |
| `subdimension` | string | Subdimensión (solo CDC) |
| `codigo_indicador` | string | Ej: `CDC-01`, `PAL-03` |
| `nombre` | string | Nombre del indicador |
| `descripcion` | string | Descripción completa |
| `formula` | string | Fórmula de cálculo (texto) |
| `tipo_meta` | enum | `porcentaje` \| `numero` \| `booleano` \| `texto` |
| `meta_valor` | string | Valor objetivo (ej: "80", "Sí", "500") |
| `unidad` | string | Ej: "%", "alumnos", "establecimientos" |
| `peso` | number | Ponderación dentro del instrumento (%) |
| `fuente_verificacion` | string | Qué documento acredita el avance |
| `responsable_id` | string | FK → usuarios.id |
| `activo` | boolean | |

---

### Hoja: `avances`
Un avance por cada (indicador × corte). Se puede modificar hasta que el corte cierra.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | |
| `indicador_id` | string | FK → indicadores.id |
| `corte_id` | string | FK → cortes.id |
| `valor_reportado` | string | Valor ingresado por el responsable |
| `porcentaje_cumplimiento` | number | 0–100. Calculado: (valor_reportado / meta_valor) × 100 |
| `estado_semaforo` | enum | `verde` (≥80%) \| `amarillo` (50–79%) \| `rojo` (<50%) |
| `comentario` | string | Observación narrativa (obligatorio si semáforo ≠ verde) |
| `evidencia_url` | string | Link a Google Drive, SIGE, u otro sistema (opcional) |
| `estado_revision` | enum | `borrador` \| `enviado` \| `aprobado` \| `observado` |
| `ingresado_por` | string | FK → usuarios.id |
| `ingresado_en` | timestamp | |
| `modificado_en` | timestamp | |
| `aprobado_por` | string | FK → usuarios.id (Director Ejecutivo) |
| `aprobado_en` | timestamp | |

---

### Hoja: `alertas_log`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string (UUID) | |
| `tipo_alerta` | enum | `recordatorio_corte` \| `reporte_semanal` \| `reporte_mensual` |
| `destinatario_email` | string | |
| `instrumento_id` | string | FK (opcional) |
| `corte_id` | string | FK (opcional) |
| `asunto` | string | Asunto del correo enviado |
| `enviado_en` | timestamp | |
| `exito` | boolean | |
| `error_msg` | string | Si falló, razón |

---

## 5. BACKEND — GOOGLE APPS SCRIPT

### Estructura de archivos
```
Code.gs          ← Router principal (doPost)
Auth.gs          ← Validación Google OAuth token
Config.gs        ← IDs de Sheets, constantes, dominio
Utils.gs         ← UUID, fechas, conversión rows↔objects
Usuarios.gs      ← CRUD usuarios
Instrumentos.gs  ← CRUD instrumentos
Indicadores.gs   ← CRUD indicadores
Cortes.gs        ← CRUD cortes + lógica de estado
Avances.gs       ← Upsert de avances + cálculo semáforo
Dashboard.gs     ← Agregaciones para métricas y Gantt
Emails.gs        ← Composición y envío de correos HTML
Templates.gs     ← HTML templates para emails
Triggers.gs      ← Instalación y ejecución de triggers automáticos
Setup.gs         ← Script de inicialización / migración de datos
```

---

### Config.gs
```javascript
const Config = {
  SHEET_ID: 'TU_GOOGLE_SHEET_ID_AQUI',
  DOMINIO_INSTITUCIONAL: 'slepcolchagua.cl',
  DIAS_RECORDATORIO_DEFAULT: 7,
  ADMIN_EMAIL: 'admin@slepcolchagua.cl',

  SHEETS: {
    USUARIOS: 'usuarios',
    INSTRUMENTOS: 'instrumentos',
    CORTES: 'cortes',
    INDICADORES: 'indicadores',
    AVANCES: 'avances',
    ALERTAS_LOG: 'alertas_log',
  },

  SEMAFORO: {
    VERDE: 80,    // >= 80% → verde
    AMARILLO: 50, // >= 50% → amarillo, < 50% → rojo
  }
};
```

---

### Code.gs (Router)
```javascript
function doPost(e) {
  try {
    const token = e.parameter.token;
    if (!token) return jsonError('Token requerido', 401);

    const user = Auth.validarToken(token);
    if (!user) return jsonError('No autorizado', 401);

    const body = JSON.parse(e.postData.contents);
    const { action, data, id, filtros } = body;

    const router = {
      // Usuarios
      'getUsuarios':           () => Usuarios.getAll(user),
      'updateUsuario':         () => Usuarios.update(id, data, user),
      // Instrumentos
      'getInstrumentos':       () => Instrumentos.getAll(user),
      'createInstrumento':     () => Instrumentos.create(data, user),
      'updateInstrumento':     () => Instrumentos.update(id, data, user),
      // Indicadores
      'getIndicadores':        () => Indicadores.getByInstrumento(filtros.instrumento_id, user),
      'createIndicador':       () => Indicadores.create(data, user),
      'updateIndicador':       () => Indicadores.update(id, data, user),
      'deleteIndicador':       () => Indicadores.softDelete(id, user),
      // Cortes
      'getCortes':             () => Cortes.getByInstrumento(filtros.instrumento_id, user),
      'getAllCortes':           () => Cortes.getAll(user),
      'createCorte':           () => Cortes.create(data, user),
      'cerrarCorte':           () => Cortes.cerrar(id, user),
      // Avances
      'getAvancesPorCorte':    () => Avances.getByCorte(filtros.corte_id, user),
      'upsertAvance':          () => Avances.upsert(data, user),
      'aprobarAvance':         () => Avances.aprobar(id, user),
      'observarAvance':        () => Avances.observar(id, data.comentario, user),
      // Dashboard
      'getDashboardResumen':   () => Dashboard.getResumenGeneral(user),
      'getDashboardInstrumento': () => Dashboard.getResumenInstrumento(filtros.instrumento_id, user),
      'getGanttData':          () => Dashboard.getGanttData(user),
      'getMetricasCorte':      () => Dashboard.getMetricasCorte(filtros.corte_id, user),
      // Emails manuales (admin)
      'enviarReporteManual':   () => Emails.enviarReporteCorte(filtros.corte_id),
    };

    if (!router[action]) return jsonError(`Acción desconocida: ${action}`, 400);

    const result = router[action]();
    return jsonOk(result);

  } catch (err) {
    console.error(err);
    return jsonError(err.message, 500);
  }
}

function jsonOk(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg, code) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg, code }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

---

### Auth.gs
```javascript
const Auth = {
  validarToken(idToken) {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
    const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });

    if (resp.getResponseCode() !== 200) return null;

    const payload = JSON.parse(resp.getContentText());
    const email = payload.email;

    // Verificar dominio institucional
    if (!email || !email.endsWith(`@${Config.DOMINIO_INSTITUCIONAL}`)) return null;

    // Buscar usuario activo en Sheets
    return Utils.buscarEnSheet(Config.SHEETS.USUARIOS, 'email', email, row => row.activo === true);
  }
};
```

---

### Utils.gs
```javascript
const Utils = {
  uuid() {
    return Utilities.getUuid();
  },

  ahora() {
    return new Date().toISOString();
  },

  diasHasta(fechaStr) {
    const hoy = new Date();
    const fecha = new Date(fechaStr);
    return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  },

  sheetToObjects(sheet) {
    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return [];
    const headers = data[0];
    return data.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h, row[i]]))
    );
  },

  appendRow(sheetName, obj) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const row = headers.map(h => obj[h] ?? '');
    sheet.appendRow(row);
    return obj;
  },

  updateRowById(sheetName, id, updates) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === id) {
        headers.forEach((h, j) => {
          if (updates[h] !== undefined) sheet.getRange(i + 1, j + 1).setValue(updates[h]);
        });
        return true;
      }
    }
    return false;
  },

  buscarEnSheet(sheetName, campo, valor, filtroExtra = null) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    const rows = this.sheetToObjects(sheet);
    return rows.find(r => r[campo] === valor && (!filtroExtra || filtroExtra(r))) || null;
  },

  calcularSemaforo(porcentaje) {
    if (porcentaje >= Config.SEMAFORO.VERDE) return 'verde';
    if (porcentaje >= Config.SEMAFORO.AMARILLO) return 'amarillo';
    return 'rojo';
  },

  calcularPorcentaje(valorReportado, metaValor, tipo) {
    if (tipo === 'booleano') return valorReportado === 'Sí' ? 100 : 0;
    if (tipo === 'texto') return valorReportado?.trim().length > 0 ? 100 : 0;
    const v = parseFloat(valorReportado);
    const m = parseFloat(metaValor);
    if (isNaN(v) || isNaN(m) || m === 0) return 0;
    return Math.min(Math.round((v / m) * 100), 100);
  }
};
```

---

### Avances.gs
```javascript
const Avances = {
  upsert(data, user) {
    // Validar que el user es responsable del indicador o es admin
    const indicador = Utils.buscarEnSheet(Config.SHEETS.INDICADORES, 'id', data.indicador_id);
    if (!indicador) throw new Error('Indicador no encontrado');

    if (user.rol !== 'admin' && indicador.responsable_id !== user.id) {
      throw new Error('No tienes permiso para editar este indicador');
    }

    // Calcular cumplimiento y semáforo
    const pct = Utils.calcularPorcentaje(data.valor_reportado, indicador.meta_valor, indicador.tipo_meta);
    const semaforo = Utils.calcularSemaforo(pct);

    // Buscar si ya existe un avance para este indicador+corte
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet = ss.getSheetByName(Config.SHEETS.AVANCES);
    const rows = Utils.sheetToObjects(sheet);
    const existente = rows.find(r => r.indicador_id === data.indicador_id && r.corte_id === data.corte_id);

    const payload = {
      ...data,
      porcentaje_cumplimiento: pct,
      estado_semaforo: semaforo,
      estado_revision: 'enviado',
      modificado_en: Utils.ahora(),
    };

    if (existente) {
      Utils.updateRowById(Config.SHEETS.AVANCES, existente.id, payload);
      return { ...existente, ...payload };
    } else {
      const nuevo = {
        id: Utils.uuid(),
        ...payload,
        ingresado_por: user.id,
        ingresado_en: Utils.ahora(),
      };
      Utils.appendRow(Config.SHEETS.AVANCES, nuevo);
      return nuevo;
    }
  },

  getByCorte(corte_id, user) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const sheet = ss.getSheetByName(Config.SHEETS.AVANCES);
    return Utils.sheetToObjects(sheet).filter(r => r.corte_id === corte_id);
  },

  getIndicadoresSinAvance(corte_id) {
    const corte = Utils.buscarEnSheet(Config.SHEETS.CORTES, 'id', corte_id);
    if (!corte) return [];

    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const indicadores = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INDICADORES))
      .filter(i => i.instrumento_id === corte.instrumento_id && i.activo);
    const avances = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.AVANCES))
      .filter(a => a.corte_id === corte_id);

    const conAvance = new Set(avances.map(a => a.indicador_id));
    return indicadores.filter(i => !conAvance.has(i.id));
  },

  aprobar(id, user) {
    if (user.rol !== 'director_ejecutivo' && user.rol !== 'admin') {
      throw new Error('Solo el Director Ejecutivo puede aprobar avances');
    }
    Utils.updateRowById(Config.SHEETS.AVANCES, id, {
      estado_revision: 'aprobado',
      aprobado_por: user.id,
      aprobado_en: Utils.ahora()
    });
    return { ok: true };
  },

  observar(id, comentario, user) {
    Utils.updateRowById(Config.SHEETS.AVANCES, id, {
      estado_revision: 'observado',
      comentario: comentario
    });
    return { ok: true };
  }
};
```

---

### Dashboard.gs
```javascript
const Dashboard = {
  getResumenGeneral(user) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const instrumentos = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INSTRUMENTOS))
      .filter(i => i.activo);
    const cortes = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.CORTES));
    const indicadores = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INDICADORES));
    const avances = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.AVANCES));

    return instrumentos.map(inst => {
      const cortesInst = cortes.filter(c => c.instrumento_id === inst.id);
      const proxCorte = cortesInst
        .filter(c => c.estado !== 'cerrado')
        .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))[0];

      const indInst = indicadores.filter(i => i.instrumento_id === inst.id && i.activo);
      const avancesInst = avances.filter(a =>
        indInst.some(i => i.id === a.indicador_id)
      );

      // Calcular cumplimiento ponderado
      let cumplimientoPonderado = 0;
      let totalPeso = 0;
      indInst.forEach(ind => {
        const avance = avancesInst.find(a => a.indicador_id === ind.id);
        const peso = parseFloat(ind.peso) || 0;
        const pct = avance ? parseFloat(avance.porcentaje_cumplimiento) : 0;
        cumplimientoPonderado += pct * peso;
        totalPeso += peso;
      });
      const cumplimiento = totalPeso > 0 ? Math.round(cumplimientoPonderado / totalPeso) : 0;

      return {
        instrumento: inst,
        cumplimiento_global: cumplimiento,
        semaforo: Utils.calcularSemaforo(cumplimiento),
        total_indicadores: indInst.length,
        indicadores_con_avance: avancesInst.length,
        indicadores_pendientes: indInst.length - avancesInst.length,
        proximo_corte: proxCorte || null,
        dias_para_corte: proxCorte ? Utils.diasHasta(proxCorte.fecha_limite) : null,
        desglose_semaforos: {
          verde: avancesInst.filter(a => a.estado_semaforo === 'verde').length,
          amarillo: avancesInst.filter(a => a.estado_semaforo === 'amarillo').length,
          rojo: avancesInst.filter(a => a.estado_semaforo === 'rojo').length,
        }
      };
    });
  },

  getGanttData(user) {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    const instrumentos = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.INSTRUMENTOS)).filter(i => i.activo);
    const cortes = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.CORTES));

    return instrumentos.map(inst => ({
      instrumento: inst,
      cortes: cortes
        .filter(c => c.instrumento_id === inst.id)
        .sort((a, b) => new Date(a.fecha_limite) - new Date(b.fecha_limite))
    }));
  }
};
```

---

### Emails.gs + Templates.gs
```javascript
const Emails = {
  enviarRecordatorioCorte(corte_id) {
    const corte = Utils.buscarEnSheet(Config.SHEETS.CORTES, 'id', corte_id);
    if (!corte) return;

    const diasRestantes = Utils.diasHasta(corte.fecha_limite);
    if (diasRestantes > 7 || diasRestantes < 0) return;

    const pendientes = Avances.getIndicadoresSinAvance(corte_id);
    if (pendientes.length === 0) return;

    const destinatarios = this._getDestinatarios();

    destinatarios.forEach(user => {
      const asunto = `⚠️ [SLEP Colchagua] ${diasRestantes} día(s) para cierre: ${corte.nombre_corte}`;
      const html = Templates.recordatorio(corte, pendientes, diasRestantes, user);

      try {
        GmailApp.sendEmail(user.email, asunto, '', {
          htmlBody: html,
          name: 'Sistema de Gestión SLEP Colchagua'
        });
        this._logAlerta('recordatorio_corte', user.email, null, corte_id, asunto, true);
      } catch (err) {
        this._logAlerta('recordatorio_corte', user.email, null, corte_id, asunto, false, err.message);
      }
    });
  },

  enviarReporteSemanal() {
    const resumen = Dashboard.getResumenGeneral({ rol: 'admin' });
    const asunto = `[SLEP Colchagua] Reporte semanal de gestión — ${new Date().toLocaleDateString('es-CL')}`;
    const html = Templates.reporteSemanal(resumen);
    const director = this._getDirectorEjecutivo();

    if (director) {
      GmailApp.sendEmail(director.email, asunto, '', {
        htmlBody: html,
        name: 'Sistema de Gestión SLEP Colchagua'
      });
      this._logAlerta('reporte_semanal', director.email, null, null, asunto, true);
    }
  },

  enviarReporteMensual() {
    const resumen = Dashboard.getResumenGeneral({ rol: 'admin' });
    const asunto = `[SLEP Colchagua] Reporte mensual de gestión — ${new Date().toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}`;
    const html = Templates.reporteMensual(resumen);
    const destinatarios = this._getDestinatarios();

    destinatarios.forEach(user => {
      GmailApp.sendEmail(user.email, asunto, '', {
        htmlBody: html,
        name: 'Sistema de Gestión SLEP Colchagua'
      });
    });
  },

  _getDestinatarios() {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    return Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.USUARIOS))
      .filter(u => u.activo && (u.rol === 'subdirector' || u.rol === 'director_ejecutivo'));
  },

  _getDirectorEjecutivo() {
    const ss = SpreadsheetApp.openById(Config.SHEET_ID);
    return Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.USUARIOS))
      .find(u => u.activo && u.rol === 'director_ejecutivo');
  },

  _logAlerta(tipo, email, instrumento_id, corte_id, asunto, exito, error_msg = '') {
    Utils.appendRow(Config.SHEETS.ALERTAS_LOG, {
      id: Utils.uuid(),
      tipo_alerta: tipo,
      destinatario_email: email,
      instrumento_id: instrumento_id || '',
      corte_id: corte_id || '',
      asunto,
      enviado_en: Utils.ahora(),
      exito,
      error_msg
    });
  }
};

// Templates de correo en HTML con paleta institucional
const Templates = {
  _base(contenido, titulo) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #EDF0F5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(37,48,107,0.10); }
        .header { background: linear-gradient(135deg, #25306B 0%, #006BB9 100%); padding: 28px 32px; color: white; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
        .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.85; }
        .body { padding: 28px 32px; }
        .footer { background: #EDF0F5; padding: 16px 32px; font-size: 12px; color: #6B7280; text-align: center; }
        .badge-verde { background: #DCFCE7; color: #166534; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .badge-amarillo { background: #FEF3C7; color: #92400E; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .badge-rojo { background: #FEE2E2; color: #991B1B; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
        .btn { display: inline-block; background: #006BB9; color: white; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #25306B; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }
        td { padding: 9px 12px; border-bottom: 1px solid #EDF0F5; font-size: 13px; }
        tr:nth-child(even) td { background: #F8FAFC; }
        .alerta-box { background: #FEE2E2; border-left: 4px solid #FF1D3D; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Sistema de Gestión — SLEP Colchagua</h1>
          <p>${titulo}</p>
        </div>
        <div class="body">${contenido}</div>
        <div class="footer">Este correo fue generado automáticamente. No responder directamente.</div>
      </div>
    </body>
    </html>`;
  },

  recordatorio(corte, pendientes, dias, user) {
    const contenido = `
      <p>Estimado/a <strong>${user.nombre}</strong>,</p>
      <div class="alerta-box">
        ⏰ Quedan <strong>${dias} día(s)</strong> para el cierre de <strong>${corte.nombre_corte}</strong>
        (fecha límite: <strong>${corte.fecha_limite}</strong>).
      </div>
      <p>Los siguientes indicadores aún no tienen avance registrado:</p>
      <table>
        <tr><th>Código</th><th>Indicador</th><th>Responsable</th></tr>
        ${pendientes.map(i => `<tr><td>${i.codigo_indicador}</td><td>${i.nombre}</td><td>${i.responsable_id}</td></tr>`).join('')}
      </table>
      <a href="https://tu-app.vercel.app/ingresar-avance" class="btn">Ingresar avances ahora →</a>
    `;
    return this._base(contenido, `Recordatorio de corte — ${corte.nombre_corte}`);
  },

  reporteSemanal(resumen) {
    const filas = resumen.map(r => `
      <tr>
        <td><strong>${r.instrumento.codigo}</strong></td>
        <td>${r.cumplimiento_global}%</td>
        <td><span class="badge-${r.semaforo}">${r.semaforo.toUpperCase()}</span></td>
        <td>${r.indicadores_con_avance}/${r.total_indicadores}</td>
        <td>${r.proximo_corte ? r.proximo_corte.nombre_corte + ' (' + r.dias_para_corte + ' días)' : '—'}</td>
      </tr>
    `).join('');

    const contenido = `
      <p>Resumen de avances al ${new Date().toLocaleDateString('es-CL')}:</p>
      <table>
        <tr><th>Instrumento</th><th>Cumplimiento</th><th>Estado</th><th>Avances</th><th>Próximo corte</th></tr>
        ${filas}
      </table>
      <a href="https://tu-app.vercel.app/dashboard" class="btn">Ver dashboard completo →</a>
    `;
    return this._base(contenido, 'Reporte semanal de gestión');
  }
};
```

---

### Triggers.gs
```javascript
function instalarTriggers() {
  // Eliminar triggers existentes
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // Verificación diaria de recordatorios (8:00 AM)
  ScriptApp.newTrigger('verificarRecordatoriosDiarios')
    .timeBased().everyDays(1).atHour(8).create();

  // Reporte semanal: lunes 8:00 AM
  ScriptApp.newTrigger('ejecutarReporteSemanal')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8).create();

  // Reporte mensual: día 1 de cada mes, 8:00 AM
  ScriptApp.newTrigger('ejecutarReporteMensual')
    .timeBased().onMonthDay(1).atHour(8).create();

  Logger.log('✅ Triggers instalados correctamente');
}

function verificarRecordatoriosDiarios() {
  const ss = SpreadsheetApp.openById(Config.SHEET_ID);
  const cortes = Utils.sheetToObjects(ss.getSheetByName(Config.SHEETS.CORTES))
    .filter(c => c.estado !== 'cerrado');

  cortes.forEach(c => {
    const dias = Utils.diasHasta(c.fecha_limite);
    if (dias >= 0 && dias <= Config.DIAS_RECORDATORIO_DEFAULT) {
      Emails.enviarRecordatorioCorte(c.id);
    }
  });
}

function ejecutarReporteSemanal() {
  Emails.enviarReporteSemanal();
}

function ejecutarReporteMensual() {
  Emails.enviarReporteMensual();
}
```

---

## 6. FRONTEND — ESTRUCTURA Y PÁGINAS

### Árbol de carpetas
```
src/
├── main.jsx
├── App.jsx
├── config/
│   ├── api.js          ← URL del Apps Script + función callApi()
│   └── colors.js       ← Paleta institucional como constantes JS
├── context/
│   └── AuthContext.jsx ← Google OAuth state + proveedor
├── hooks/
│   ├── useApi.js
│   ├── useDashboard.js
│   ├── useInstrumentos.js
│   └── useAvances.js
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── InstrumentoDetalle.jsx
│   ├── IngresarAvance.jsx
│   ├── Gantt.jsx
│   └── Admin.jsx
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx      ← Sidebar + TopBar contenedor
│   │   ├── Sidebar.jsx       ← Nav con colores navy
│   │   └── ProtectedRoute.jsx
│   ├── dashboard/
│   │   ├── TarjetaInstrumento.jsx  ← Card con semáforo + % + próximo corte
│   │   ├── GraficoBarras.jsx       ← Recharts BarChart comparativo
│   │   ├── DonutCumplimiento.jsx   ← Recharts PieChart por instrumento
│   │   └── ResumenSemaforos.jsx    ← Conteo verde/amarillo/rojo
│   ├── gantt/
│   │   └── GanttChart.jsx          ← SVG Gantt de cortes del año
│   ├── avances/
│   │   ├── TablaIndicadores.jsx    ← Lista indicadores + estado
│   │   └── FormAvance.jsx          ← Modal de ingreso de avance
│   └── ui/
│       ├── SemaforoBadge.jsx       ← Badge verde/amarillo/rojo
│       ├── ProgressBar.jsx
│       ├── Modal.jsx
│       ├── Spinner.jsx
│       └── Alert.jsx
└── utils/
    ├── semaforo.js
    ├── formatters.js   ← Fechas en español, % formatting
    └── dates.js
```

---

### config/api.js
```javascript
const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export async function callApi(action, payload = {}) {
  const token = localStorage.getItem('google_id_token');
  if (!token) throw new Error('Sin sesión');

  const response = await fetch(`${API_URL}?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
    redirect: 'follow',
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (!json.ok) throw new Error(json.error || 'Error del servidor');
  return json.data;
}
```

### .env (Vercel environment variables)
```env
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
VITE_GOOGLE_CLIENT_ID=TU_GOOGLE_OAUTH_CLIENT_ID
```

---

### context/AuthContext.jsx
```jsx
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    document.head.appendChild(script);

    // Verificar sesión guardada
    const savedToken = localStorage.getItem('google_id_token');
    const savedUser = localStorage.getItem('slep_user');
    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = (credential, userInfo) => {
    localStorage.setItem('google_id_token', credential);
    localStorage.setItem('slep_user', JSON.stringify(userInfo));
    setUser(userInfo);
  };

  const logout = () => {
    localStorage.removeItem('google_id_token');
    localStorage.removeItem('slep_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

---

## 7. PÁGINAS — DETALLE FUNCIONAL

### 7.1 Login (`/login`)
- Fondo con gradiente institucional (`--gradient-navy`)
- Logo SLEP Colchagua centrado
- Botón "Ingresar con Google" usando Google Identity Services One Tap
- Al recibir `credential` (id_token): llama al backend con acción `validarSesion`
- Si OK → guarda token y datos de usuario, redirige a `/dashboard`
- Si error → muestra mensaje "Correo no autorizado. Contacta al administrador."

---

### 7.2 Dashboard (`/dashboard`)
**Layout:** Grid 2×2 de tarjetas de instrumento + gráfico de barras + Gantt resumido

**Tarjeta por instrumento (×4):**
- Nombre y código (CDC, PAL, PEL, PMG)
- Barra de progreso con % de cumplimiento ponderado
- Badge semáforo (verde/amarillo/rojo)
- Contadores: X/Y indicadores con avance
- Próximo corte + días restantes (urgencia visual si < 7 días → rojo)
- Botón "Ver detalle"

**Gráfico de barras (Recharts BarChart):**
- Eje X: los 4 instrumentos
- Eje Y: % cumplimiento
- Línea de referencia en 80% (meta mínima)
- Colores de barras según semáforo

**Mini-Gantt:**
- Línea de tiempo del año actual
- Puntos de corte de cada instrumento
- Indicador de "hoy"

---

### 7.3 Detalle de Instrumento (`/instrumento/:id`)
**Sección superior:** Resumen del instrumento (igual a tarjeta dashboard pero expandida)

**Tabs:**
1. **Indicadores** — Tabla con todos los indicadores del instrumento:
   - Código, nombre, meta, último avance, % cumplimiento, semáforo, responsable
   - Botón "Ingresar avance" por fila (solo si el usuario es responsable o admin)
   - Filtro por corte activo
2. **Cortes** — Lista de todos los cortes con su estado y fechas
3. **Historial** — Evolución del % de cumplimiento por corte (Recharts LineChart)

---

### 7.4 Ingresar Avance (`/avance/:indicador_id/:corte_id`)
**Formulario:**
- Nombre del indicador (readonly)
- Meta y fórmula (readonly, referencia)
- Campo: Valor reportado (número, %, texto o checkbox según `tipo_meta`)
- Campo: Comentario/observación (obligatorio si % < 80%)
- Campo: URL de evidencia (opcional, link a Drive)
- Preview en tiempo real del % calculado y semáforo resultante
- Botón "Guardar borrador" y "Enviar"

---

### 7.5 Gantt (`/gantt`)
- Vista de línea de tiempo anual (enero–diciembre del año actual)
- Una fila por instrumento (CDC, PAL, PEL, PMG)
- Bloques coloreados por período + puntos de corte marcados
- Click en corte → modal con estado de avances de ese corte
- Leyenda de estado: pendiente / en curso / cerrado / vencido

---

### 7.6 Admin (`/admin`) — Solo rol `admin`
**Tabs:**
1. **Usuarios** — Tabla CRUD de usuarios (activar/desactivar, cambiar rol)
2. **Indicadores** — CRUD de indicadores por instrumento (migración desde Excel)
3. **Cortes** — Crear y gestionar cortes del año
4. **Logs de alertas** — Historial de correos enviados

---

## 8. REGLAS DE NEGOCIO

1. **Comentario obligatorio:** Si el `porcentaje_cumplimiento < 80%`, el campo `comentario` es obligatorio al guardar un avance.

2. **Bloqueo por corte cerrado:** No se pueden ingresar ni modificar avances en cortes con `estado = 'cerrado'`. Solo admin puede reabrir un corte.

3. **Semáforo calculado automáticamente:** Nunca se ingresa manualmente. Se calcula en backend al hacer `upsert` de un avance.

4. **Un avance por (indicador × corte):** Si ya existe, se actualiza (upsert). El historial queda en `modificado_en`.

5. **Aprobación de avances:** Solo `director_ejecutivo` o `admin` pueden cambiar `estado_revision` a `aprobado`. El responsable solo puede dejar en `enviado`.

6. **Permisos de edición de indicadores:** Solo `admin` puede crear, editar o desactivar indicadores. Los subdirectores los ven pero no los editan.

7. **Recordatorio de corte:** El trigger verifica diariamente. Si `dias_restantes ≤ dias_recordatorio` del corte Y hay indicadores sin avance → envía correo. No repite si ya se envió hoy (verifica `alertas_log`).

8. **Cumplimiento ponderado:** El % global del instrumento es la suma de `(pct_indicador × peso_indicador) / suma_pesos`. Los indicadores sin avance cuentan como 0%.

---

## 9. PLAN DE DESARROLLO POR FASES

### Fase 1 — Infraestructura base (Semana 1–2)
- [ ] Crear Google Sheet maestro con todas las hojas y cabeceras
- [ ] Implementar `Config.gs`, `Utils.gs`, `Auth.gs`
- [ ] Implementar `Code.gs` (router básico)
- [ ] Desplegar Apps Script como Web App
- [ ] Scaffold frontend Vite + React Router + Tailwind
- [ ] Implementar `AuthContext.jsx` + página `Login.jsx`
- [ ] Implementar `callApi()` y validar comunicación frontend→backend

### Fase 2 — CRUD de datos maestros (Semana 2–3)
- [ ] `Instrumentos.gs` + página `Admin.jsx` (tab instrumentos)
- [ ] `Indicadores.gs` + CRUD en Admin (tab indicadores)
- [ ] `Cortes.gs` + CRUD en Admin (tab cortes)
- [ ] Migrar indicadores CDC desde Excel a Google Sheets

### Fase 3 — Ingreso de avances (Semana 3–4)
- [ ] `Avances.gs` (upsert, aprobar, observar)
- [ ] Página `InstrumentoDetalle.jsx` con tabla de indicadores
- [ ] Formulario `IngresarAvance.jsx` con cálculo en tiempo real
- [ ] Validaciones de negocio (comentario obligatorio, corte cerrado)

### Fase 4 — Dashboard y visualizaciones (Semana 4–5)
- [ ] `Dashboard.gs` (agregaciones)
- [ ] Página `Dashboard.jsx` con 4 tarjetas
- [ ] Gráfico de barras (Recharts)
- [ ] `Gantt.jsx` con línea de tiempo SVG

### Fase 5 — Automatización de correos (Semana 5–6)
- [ ] `Emails.gs` + `Templates.gs` con HTML institucional
- [ ] `Triggers.gs` + `instalarTriggers()`
- [ ] Probar envíos manuales desde Admin
- [ ] Verificar logs en `alertas_log`

### Fase 6 — QA y despliegue (Semana 6–7)
- [ ] Pruebas de roles y permisos
- [ ] Deploy en Vercel con variables de entorno
- [ ] Configurar dominio personalizado
- [ ] Capacitación al equipo SLEP

---

## 10. NOTAS TÉCNICAS IMPORTANTES

### CORS y Apps Script
Apps Script como Web App tiene restricciones CORS. El frontend debe hacer fetch con `redirect: 'follow'`. Agregar en `doPost`:
```javascript
// No agregar manualmente headers CORS en Apps Script — son manejados por Google
// El fetch del cliente debe incluir: redirect: 'follow'
```

### Token de Google — renovación
El `id_token` de Google expira en 1 hora. El frontend debe implementar renovación silenciosa con `google.accounts.id.prompt()` antes de cada llamada crítica, o verificar expiración del JWT decodificado localmente.

### Límites de Google Sheets
- Apps Script tiene cuota de 6 minutos por ejecución y 90 minutos por día (cuenta gratuita).
- Para más de ~500 indicadores o avances simultáneos, considerar `getValues()` en batch en lugar de múltiples llamadas.
- Los triggers tienen límite de 20 por cuenta de Google.

### Seguridad
- Nunca exponer el `SHEET_ID` en el frontend.
- Validar el dominio institucional en **cada** llamada al backend (no solo en login).
- El Apps Script Web App debe estar configurado como: "Ejecutar como: Yo" + "Acceso: Cualquiera" (para recibir requests, la validación es por token).

---

*Fin del Prompt Maestro — SLEP Colchagua · Sistema de Control de Gestión Institucional*
*Versión 2.0 | Mayo 2026 | Elaborado con asistencia de IA*