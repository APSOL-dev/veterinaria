# Módulo de Inventario y Catálogo de Servicios

## Gestión de Productos Físicos y Servicios

**Qué hace:** 
Permite administrar tanto el inventario de productos físicos (medicamentos, alimentos, accesorios, insumos clínicos) como el catálogo detallado de servicios prestados por la clínica (atenciones médicas y servicios de peluquería). Incluye actualización masiva de precios por inflación, recepción automática de stock desde facturas de compra y seguimiento de pagos parciales.

**Escenarios cubiertos:**
- **Actualización Masiva de Precios por Inflación:**
  - **Selección múltiple de productos:** Checkboxes individuales por fila y casilla de selección global en el encabezado de la tabla para seleccionar varios productos simultáneamente.
  - **Actualización por Categoría o Catálogo Completo:** Posibilidad de aplicar aumentos o ajustes porcentuales a una categoría específica (`Medicamentos`, `Alimentación`, `Accesorios`, `Insumos Clínicos`) o a la totalidad del catálogo.
  - **Modal de Ajuste por Inflación:** Permite ingresar un porcentaje libre (ej: `+12.5%` o `-5%`), botones de acceso rápido (`+5%`, `+10%`, `+15%`, `+20%`, `+25%`, `+30%`, `-5%`), y visualiza una vista previa en vivo con precio anterior, nuevo precio calculado y diferencia antes de confirmar.
  - **Actualización de Vigencia:** Actualiza automáticamente `priceLastUpdated` con la fecha del día (`YYYY-MM-DD`) para resetear los días de vencimiento.

- **Recepción Automática de Stock desde Facturas de Proveedor:**
  - Al registrar una factura de compra con detalle de ítems, el sistema incrementa automáticamente el `currentStock` de cada producto en el inventario.
  - **Coincidencia inteligente:** Empareja ítems por `productId` o por coincidencia de nombre (sin distinguir mayúsculas ni espacios marginales).
  - **Alta automática de ítems nuevos:** Si un ítem de la factura no existía previamente en el catálogo, se da de alta automáticamente con la cantidad recibida como stock inicial y el costo unitario como precio base.
  - **Actualización de Precio de Catálogo:** Si se marca la opción de actualizar precio, se ajusta el precio del producto y su fecha de vigencia.

- **Pagos Parciales de Facturas de Proveedor:**
  - El sistema admite registrar múltiples pagos parciales para una misma factura de proveedor.
  - **Cálculo dinámico de saldo pendiente:** Resta la sumatoria de todos los pagos registrados (`getTotalPaidForBill`) del importe total de la factura.
  - **Estados de pago:** Identifica automáticamente si la factura se encuentra `pending` (sin pagos), `partial` (pago parcial con saldo restante pendiente) o `paid` (saldada en su totalidad).

- **Productos Físicos:** 
  - Control de stock actual, mínimo y alertas de reposición.
  - Registro de entrada de mercadería de proveedores (manual y con factura).
  - Sincronización inmediata de cambios de stock y alta de productos con la base de datos Supabase (`vetsoft_productos`).
  - Ajuste manual de stock por roturas o consumos internos.
  - **Frecuencia de Actualización de Precios:** Configuración del plazo de vencimiento o actualización en días (campo numérico directo, ej: 30 días).
  - **Indicador de Vencimiento de Precio en Productos:** Cálculo en tiempo real en las columnas `Última actualización` y `Frecuencia / Vencimiento` de la tabla de Productos Físicos (Badge **Vencido (Xd)** / Badge **Vigente**).

- **Catálogo de Servicios:**
  - Clasificación de servicios por categoría (`Clínica`, `Cirugía`, `Peluquería`, `Laboratorio`, `Ecografía / Rayos`).
  - Control de estado del servicio (`Activo` / `Inactivo`).
  - Actualización de precio con actualización automática de la fecha de cambio (`priceLastUpdated`).
  - **Frecuencia de Actualización de Precios:** Configuración del plazo de vencimiento o actualización en días (campo numérico directo, ej: 30 días).
  - **Indicador de Vencimiento de Precio:** Cálculo en tiempo real (`si hoy > última actualización + frecuencia` = Badge **Vencido** en rojo; caso contrario = Badge **Vigente** en verde).
  - Seguimiento de fecha de última venta (`lastSoldAt`).

**Casos borde conocidos:**
- Pagos que superan el saldo: El saldo restante no toma valores negativos (`Math.max(0, importe - pagado)`).
- Aumento del 0% o lista vacía: No modifica los precios ni altera las fechas de actualización.
- Intento de facturación de servicios inactivos: El sistema alerta y requiere activación previa en el catálogo.

**Restricciones o supuestos:**
- Los precios calculados por inflación se redondean a 2 decimales para evitar inconsistencias de punto flotante.
