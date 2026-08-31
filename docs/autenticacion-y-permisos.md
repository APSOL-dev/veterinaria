## Autenticación y Seguridad de Inicio de Sesión

**Qué hace:** 
Gestiona la autenticación de usuarios mediante credenciales corporativas (Usuario y Contraseña) y restringe la navegación y acciones según el rol asignado (Administrador, Veterinario, Recepcionista).

**Escenarios cubiertos:**
- **Inicio de sesión seguro:** Los campos de Usuario y Contraseña inician completamente vacíos. Se eliminaron los accesos rápidos o credenciales demo visibles por motivos de seguridad.
- **Alternancia de visibilidad de contraseña:** Incluye un botón interacivo con icono de ojo (`visibility` / `visibility_off`) dentro del campo de contraseña para permitir al usuario mostrar u ocultar los caracteres ingresados según lo requiera.
- **Validación de credenciales:** Valida las credenciales ingresadas contra la capa de autenticación y devuelve un mensaje de error claro en caso de ser incorrectas.
- **Seguridad y Control de Accesos:** Asigna el rol correspondiente y restringe el acceso a módulos específicos según la matriz RBAC de la clínica.

**Casos borde conocidos:**
- **Credenciales inválidas:** Muestra una alerta emergente de error indicando que el usuario o la contraseña son incorrectos sin revelar información sensible.
- **Intento de acceso no autorizado:** Notifica con un modal de "Acceso Restringido" si un usuario intenta navegar a un módulo fuera de sus permisos.

**Restricciones o supuestos:**
- No se permiten autocompletados o botones de inicio rápido público en la pantalla de Login.
