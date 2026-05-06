Objetivo General del Nuevo Módulo
El nuevo módulo “Acciones” debe permitir:


registrar acciones operativas asociadas directamente a indicadores institucionales


realizar control de gestión y seguimiento del estado de avance de cada acción


administrar medios de verificación asociados


organizar automáticamente evidencia documental en Google Drive


visualizar acciones mediante una experiencia moderna, intuitiva y altamente operativa


preparar el sistema para futuras automatizaciones y reportabilidad institucional


Este módulo debe integrarse completamente con:


indicadores


instrumentos


dashboard


permisos por rol


autenticación existente


estructura Apps Script actual


cache/invalidation existente


arquitectura visual ya implementada



Principio Funcional del Módulo
Actualmente el sistema trabaja principalmente sobre:


instrumentos


indicadores


cortes


avances


La nueva capa de “Acciones” debe transformarse en el nivel operativo inferior de los indicadores.
Relación esperada:
Instrumento └── Indicador      └── Acciones            └── Medios de Verificación
Cada indicador podrá tener múltiples acciones.
Cada acción deberá representar una actividad concreta de gestión institucional vinculada al cumplimiento del indicador.

Nueva Ruta Frontend
Debe incorporarse una nueva ruta protegida:
/acciones
Y adicionalmente:
/acciones/nueva/acciones/:id
El acceso debe respetar el sistema actual de roles implementado en AuthContext y backend.

Nuevo Ítem en Sidebar
Agregar nuevo menú lateral:
Acciones
Ubicación sugerida:


debajo de “Dashboard”


antes de “Gantt”


Debe utilizar iconografía moderna consistente con Lucide React.
Icono sugerido:


ClipboardCheck
o


ListChecks



Experiencia UX/UI Esperada
La experiencia debe ser:


extremadamente intuitiva


moderna


modular


minimalista


institucional


rápida visualmente


muy clara para usuarios no técnicos


Inspiración:


Notion


Monday


Linear


ClickUp


Airtable


NO se busca una UI gubernamental antigua.
Debe mantenerse:


Tailwind


diseño limpio


cards suaves


tablas modernas


modales elegantes


badges de estado


chips visuales


semáforos suaves


componentes reutilizables



Vista Principal de Acciones
La pantalla /acciones debe mostrar:
Encabezado Superior


título


resumen rápido


botón “Nueva Acción”



Tarjetas Resumen
Mostrar tarjetas KPI:


Total acciones


Planificadas


En progreso


Reportadas


Completadas


Con:


colores suaves


iconos


porcentajes


mini tendencias futuras preparadas



Tabla Principal de Acciones
La tabla debe permitir:
Columnas


Acción


Indicador asociado


Instrumento


Responsable


Fecha compromiso


Estado


Avance %


Medios cargados


Última actualización


Acciones rápidas



Estados de Gestión
La acción debe tener los siguientes estados:
- planificada- en_progreso- reportada- completada
Visualmente:


badges modernos


colores suaves


consistentes con semáforos actuales


Ejemplo:


gris → planificada


azul → en progreso


amarillo → reportada


verde → completada



Filtros y Búsqueda
La vista debe incluir:
Filtros rápidos


por instrumento


por indicador


por responsable


por estado


por rango de fechas


Búsqueda global
Debe permitir:


buscar acciones


buscar indicadores


buscar responsables



Vista Detalle de Acción
Ruta:
/acciones/:id
Debe incluir:
Cabecera


nombre acción


indicador asociado


instrumento asociado


responsable


estado actual


porcentaje avance



Timeline Operativo
Mostrar:


creación


cambios de estado


reportes


carga de medios


observaciones futuras


Inspiración:


activity feed moderno



Sección Medios de Verificación
Debe mostrar:


listado visual de archivos


tipo de evidencia


fecha subida


usuario


botón abrir Drive


botón descargar



Formulario Nueva Acción
Ruta:
/acciones/nueva

Campos del Formulario
Información Base


Nombre acción


Descripción


Indicador asociado (selector obligatorio)


Responsable


Fecha inicio


Fecha compromiso


Estado inicial


Porcentaje avance inicial



Selector de Indicador
El selector debe:


cargar indicadores activos


permitir búsqueda


mostrar:


nombre indicador


instrumento asociado




UX tipo:


combobox moderna


autocomplete



Validaciones de Negocio
Obligatorias


indicador requerido


nombre acción requerido


responsable requerido


fecha compromiso requerida



Reglas


una acción siempre debe pertenecer a un indicador


no pueden existir acciones huérfanas


solo usuarios autorizados pueden editar


acciones completadas pueden quedar bloqueadas opcionalmente


porcentaje debe ir de 0 a 100



Medios de Verificación
La acción debe permitir cargar evidencia documental.

Tipos de Medios Permitidos
El usuario debe seleccionar:
- listado_asistencia- reporte- otros

Flujo de Carga
Paso 1
Seleccionar tipo de medio.
Paso 2
Subir archivo.
Tipos soportados:


PDF


DOCX


XLSX


imágenes



Integración Google Drive
La integración Drive debe ser automática mediante Apps Script.

Estructura Esperada en Drive
Debe crearse automáticamente:
Planificacion/ └── [Indicador]       └── [Accion]             └── Medios de Verificacion
Ejemplo:
Planificacion/ └── Fortalecer Consejos Escolares       └── Jornada Territorial Abril             └── listado_asistencia.pdf

Reglas de Carpetas
Indicador
Si la carpeta del indicador NO existe:


crear automáticamente


Acción
Si la subcarpeta de acción NO existe:


crear automáticamente


Archivos
Guardar:


nombre limpio


metadata


fecha


usuario



Metadata Requerida
Cada medio debe registrar:


id


accion_id


tipo


nombre_archivo


url_drive


file_id


usuario_subida


fecha_subida



Backend Apps Script — Nuevos Archivos
Deben agregarse:
Acciones.gsDrive.gs

Responsabilidades
Acciones.gs
Debe contener:


CRUD acciones


validaciones


cambios de estado


listado


filtros


timeline


métricas


control de permisos



Drive.gs
Debe contener:


creación de carpetas


búsqueda de carpetas


subida de archivos


organización documental


helpers Drive



Nuevas Acciones Backend
Agregar al router de Code.gs:
getAccionesgetAccioncreateAccionupdateAccionupdateEstadoAccionuploadMedioVerificaciongetMediosAccion

Nueva Hoja Google Sheets
Debe crearse:
acciones
Columnas sugeridas:
idindicador_idnombredescripcionresponsablefecha_iniciofecha_compromisoestadoavanceactivocreated_atupdated_atcreated_by

Nueva Hoja
medios_verificacion
Columnas:
idaccion_idtiponombre_archivourl_drivefile_idusuariofecha_subida

Dashboard Futuro
Preparar el módulo para futuras visualizaciones:


acciones vencidas


acciones críticas


cumplimiento por responsable


cumplimiento por indicador


indicadores sin acciones


acciones con evidencia pendiente


NO implementar todavía,
pero dejar arquitectura preparada.

Reglas de Cache
Debe integrarse con CacheService.
Invalidaciones obligatorias:


acciones


dashboard


indicadores relacionados



Restricciones Técnicas
NO:


romper estructura actual


duplicar helpers existentes


leer Sheets repetidamente


subir archivos directo desde frontend a Drive


exponer IDs sensibles


SI:


reutilizar Utils.gs


reutilizar callApi()


reutilizar useApi.js


mantener patrón actual Apps Script


mantener invalidación centralizada



Seguridad
Debe respetar:


autenticación existente


permisos por rol


usuarios activos


whitelist institucional


Uploads deben validar:


tamaño


extensión


mime type



Componentes Frontend Esperados
Crear:
pages/Acciones.jspages/AccionDetalle.jspages/NuevaAccion.jscomponents/acciones/*

Componentes Sugeridos
AccionesTableEstadoBadgeAccionFormTimelineAccionUploadMediosMediosListAccionesFiltersResumenAcciones

Experiencia Visual Deseada
La pantalla debe sentirse:


ejecutiva


moderna


rápida


territorial


clara


altamente operativa


Debe parecer una plataforma SaaS moderna y NO un sistema administrativo tradicional.

Estado Esperado Después de la Implementación
El sistema quedará preparado para:


control de gestión real


seguimiento operativo territorial


trazabilidad institucional


evidencia documental centralizada


reportabilidad futura


automatización de alertas


recordatorios automáticos


dashboard ejecutivo avanzado



Consideraciones Finales
Respetar completamente:


arquitectura actual


decisiones OAuth existentes


restricciones CORS Apps Script


sistema de cache


estructura React Router actual


lógica de permisos


patrón de hooks


estructura visual existente


El nuevo módulo debe sentirse como una extensión natural y profesional del sistema ya implementado.