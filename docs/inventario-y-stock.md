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
  - Clasificación de servicios por categoría (`Clínica`, `Cirugía`, `Peluquería`, `Laboratorio`, `Ecografía / Rayos`).
  - Control de estado del servicio (`Activo` / `Inactivo`).
  - Actualización de precio con actualización automática de la fecha de cambio (`priceLastUpdated`).
  - **Frecuencia de Actualización de Precios:** Configuración de periodo recomendado de actualización (15, 30, 60, 90, 180, 365 días).
  - **Indicador de Vencimiento de Precio:** Cálculo en tiempo real (`si hoy > última actualización + frecuencia` = Badge **Vencido** en rojo; caso contrario = Badge **Vigente** en verde).
  - Seguimiento de fecha de última venta (`lastSoldAt`).

**Casos borde conocidos:**
- Intento de facturación de servicios inactivos: El sistema alerta y requiere activación previa en el catálogo.
- Precios con frecuencia vencida: Se resalta visualmente en la tabla con la cantidad de días transcurridos desde el vencimiento para recordar la actualización de tarifas.

**Restricciones o supuestos:**
- La actualización de precios de servicios actualiza automáticamente la fecha del registro al día actual y resetea el ciclo de vigencia.
