## Duración de Alertas y Notificaciones del Sistema

**Qué hace:** 
Este documento define las temporizaciones automáticas de auto-cierre para todas las alertas flotantes y notificaciones del sistema.

**Configuración de Tiempos:**
1. **Alerta de Stock Crítico al Ingresar:** `autoHideDurationMs = 3000` (3 segundos).
2. **Notificaciones de Éxito / Confirmación:** `autoDismissMs = 3000` (3 segundos).
3. **Comportamiento:** Al cumplirse los 3 segundos desde la aparición de la alerta, esta se oculta automáticamente sin requerir acción manual del usuario.
