# Notificaciones Flotantes Toast y Alertas de Stock

**Qué hace:** 
Gestiona las notificaciones flotantes de la aplicación y el sistema de alertas de stock crítico en el encabezado y modales.

**Características:**
- **Notificaciones Toast:** Posición fija en la esquina superior derecha (`fixed top-6 right-6`), formato horizontal apaisado y autodesvanecimiento a los 3.5 segundos sin bloquear la interfaz.
- **Alertas de Stock Crítico No Repetitivas:**
  - El contador del icono de campana en el Header (`lowStockCount`) refleja exclusivamente la cantidad de **alertas nuevas no reconocidas** (`newLowStockAlerts`), evitando mostrar permanentemente badges del tipo `99+` por productos históricos ya revisados.
  - Al descartar o visualizar la alerta, se almacena el mapa de productos y su stock actual en `vetsoft_acknowledged_low_stock` (`localStorage`).
  - Un producto que ya generó alerta **no vuelve a aparecer** a menos que su stock descienda aún más o que ingrese un nuevo producto con stock por debajo del mínimo configurado.

