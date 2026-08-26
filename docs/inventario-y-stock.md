# Módulo de Inventario y Catálogo de Servicios

## Gestión de Productos Físicos y Servicios

**Qué hace:** 
Permite administrar tanto el inventario de productos físicos (medicamentos, alimentos, accesorios) como el catálogo detallado de servicios prestados por la clínica (atenciones médicas y servicios de peluquería).

**Escenarios cubiertos:**
- **Productos Físicos:** 
  - Control de stock actual, mínimo y alertas de reposición.
  - Registro de entrada de mercadería de proveedores.
  - Ajuste manual de stock por roturas o consumos internos.
- **Catálogo de Servicios:**
  - Clasificación de servicios por categoría (`Clínica` o `Peluquería`).
  - Control de estado del servicio (`ACTIVO` / `INACTIVO`).
  - Actualización de precio con actualización automática de la fecha de cambio (`priceLastUpdated`).
  - Seguimiento de fecha de última venta (`lastSoldAt`).

**Casos borde conocidos:**
- Intento de facturación de servicios inactivos: El sistema alerta y requiere activación previa en el catálogo.

**Restricciones o supuestos:**
- La actualización de precios de servicios actualiza automáticamente la fecha del registro al día actual.
