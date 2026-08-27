# Notificaciones Flotantes Toast (Top-Right Auto-Dismiss)

**Qué hace:** 
Transforma las notificaciones de la aplicación en un cartel flotante horizontal **en la esquina superior derecha** (`top-right`), con altura baja, diseño institucional (#191122, #9A7DB8) y **cierre automático a los 3.5 segundos sin requerir que el usuario haga clic en "Aceptar"**.

**Características:**
- Posición fija en la esquina superior derecha (`fixed top-6 right-6`).
- Banner horizontal apaisado ("más largo y menos alto") que no bloquea la navegación.
- Autodesvanecimiento inteligente a los 3.5 segundos con temporizador `useEffect`.
- Botón discreto `×` para cierre manual anticipado opcional.
- Sin overlay oscuro/backdrop que requiera interacción del usuario.
