# Contexto del Modulo Login

## Objetivo

`src/pages/Login.js` es la puerta de entrada autenticada al sistema. Su responsabilidad es iniciar el flujo OAuth con Google, recuperar el resultado del callback, validar que el usuario exista y siga autorizado en backend, y dejar la sesion lista para el resto de la aplicacion.

No es solo una pantalla visual: actua como frontera entre usuario no autenticado, usuario autorizado y sesion expirada.

## Responsabilidad funcional

La pagina:
- detecta si ya existe un usuario autenticado usando `useAuth()`
- redirige a `/dashboard` cuando ya hay sesion activa
- recupera mensajes de cierre de sesion desde `sessionStorage`
- inicia login por redirect hacia Google OAuth
- construye el request OAuth usando `client_id`, `redirect_uri`, `nonce` y `prompt=select_account`
- recibe el resultado indirectamente desde `auth_callback.html` via `sessionStorage`
- valida el `id_token` llamando `callApi('validarSesion')`
- persiste sesion local mediante `loginWithGoogle()`
- limpia el token local cuando la validacion falla
- muestra estados de carga y mensajes de error operativos

## Dependencias principales

- `useAuth()` para conocer sesion actual y registrar login exitoso
- `useNavigate()` para redirigir a dashboard
- `callApi()` para validar el token contra Apps Script
- `sessionStorage` para intercambiar el resultado de OAuth con `auth_callback.html`
- `localStorage` para persistir temporalmente el `google_id_token`
- variables de entorno `REACT_APP_GOOGLE_CLIENT_ID` y `REACT_APP_APPS_SCRIPT_URL`

## Flujo principal

### Entrada con sesion activa
1. `useAuth()` entrega `user`
2. si existe usuario, la pantalla no permanece en login
3. se navega a `/dashboard` con `replace: true`

### Inicio de autenticacion
1. el usuario presiona `Iniciar sesion con Google`
2. la pagina genera un `nonce`
3. arma la URL OAuth con `response_type=id_token`
4. hace redirect completo a Google

### Retorno desde callback
1. `auth_callback.html` guarda un objeto `google_auth_result` en `sessionStorage`
2. `Login.js` lo lee al montar
3. si `type === 'GOOGLE_AUTH_SUCCESS'`, ejecuta `handleToken(result.idToken)`
4. si falla el parseo o el tipo no es valido, muestra error de autenticacion

### Validacion de sesion real
1. `handleToken()` guarda temporalmente el `id_token` en `localStorage`
2. llama `callApi('validarSesion')`
3. backend valida token Google y autorizacion del correo en la hoja de usuarios
4. si todo sale bien, se ejecuta `loginWithGoogle(idToken, userInfo)`
5. se navega a `/dashboard`

### Token expirado o sesion invalida
1. otro punto de la app puede disparar expiracion de sesion desde `callApi()`
2. ese flujo deja un mensaje `auth_logout_message` en `sessionStorage`
3. al volver a login, la pagina recupera ese mensaje
4. se muestra al usuario que debe volver a iniciar sesion

## Estructura visual

### Fondo y contenedor
- fondo con imagen `auth.webp`
- overlay degradado azul institucional
- capa radial sutil para profundidad visual
- tarjeta central blanca semitransparente con blur

### Cabecera
- logo `SLEPCOLCHAGUA.webp`
- nombre institucional
- subtitulo del sistema

### Cuerpo principal
- mensaje `Ingresa con tu cuenta institucional`
- boton de login con icono Google cuando no hay carga
- indicador `Verificando acceso...` mientras se valida el token
- caja de error roja cuando existe fallo o expiracion
- nota final `Solo personal autorizado del SLEP Colchagua`

## Contrato esperado con almacenamiento del navegador

### localStorage
- `google_id_token`: token vigente de Google
- `slep_user`: usuario autenticado serializado

### sessionStorage
- `google_auth_result`: resultado del callback OAuth
- `auth_logout_message`: mensaje a mostrar despues de expiracion o cierre de sesion forzado

Si alguno de estos nombres cambia sin alinear callback, auth context y api, el modulo deja de cerrar el flujo correctamente.

## Contrato esperado del backend

La pagina depende de que `callApi('validarSesion')` retorne un objeto usuario con al menos:
- `id`
- `email`
- `nombre`
- `rol`
- `area`

Si backend rechaza el token o el correo no esta autorizado, el login no debe persistir sesion local.

## Reglas de negocio visibles

- solo correos autorizados en backend pueden entrar al sistema
- la app usa login por redirect, no popup
- mientras se valida el token, no se debe poder reabrir el flujo OAuth
- si hay sesion activa, login no debe quedar accesible como pantalla estable
- si el token vence, el usuario debe volver a autenticarse manualmente
- el mensaje de expiracion debe sobrevivir al redirect a login usando `sessionStorage`

## Estados especiales

### Loading
Se activa en dos casos:
- cuando existe `google_auth_result` pendiente al cargar la pagina
- cuando se presiona el boton y comienza la validacion del token

### Error de autenticacion
Se muestra cuando:
- el callback no trae un resultado valido
- falla el parseo del resultado OAuth
- backend rechaza el token o el correo

### Sesion expirada
Se muestra como error recuperado desde `auth_logout_message`, diferenciando el caso de reingreso obligatorio.

## Hallazgos tecnicos del modulo

- el flujo por redirect evita problemas de COOP y bloqueo de popups que suelen aparecer con Google Identity en despliegues web simples
- `Login.js` no resuelve el callback directo en URL; delega ese paso a `auth_callback.html` y usa `sessionStorage` como puente
- el token se guarda antes de validar sesion porque `callApi()` lo necesita para llamar al Apps Script
- el modulo depende fuertemente de coherencia entre `Login.js`, `auth_callback.html`, `AuthContext.js` y `config/api.js`
- la diferencia entre usuario no autorizado y token expirado hoy comparte la misma superficie visual de error, aunque el origen tecnico sea distinto

## Riesgos al tocar este modulo

- cambiar los nombres de claves en `sessionStorage` rompe el retorno desde OAuth o el mensaje de expiracion
- mover la validacion fuera de `callApi()` o fuera de `loginWithGoogle()` puede dejar estados de sesion parciales
- cambiar `response_type=id_token` implica revisar todo el flujo actual porque hoy no existe intercambio de `code` por backend
- tocar el `redirect_uri` requiere alinear Vercel, Google Cloud Console y `public/auth_callback.html`
- si se elimina la limpieza del token en errores, pueden quedar credenciales locales inconsistentes

## Pendientes naturales

- diferenciar mejor el mensaje de `correo no autorizado` frente a `sesion expirada`
- centralizar textos de error para no duplicarlos entre login, auth context y api
- evaluar renovacion silenciosa si el modelo de seguridad futuro lo permite
- agregar trazabilidad ligera de errores de autenticacion para soporte operativo