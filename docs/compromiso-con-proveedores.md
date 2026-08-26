# Módulo de Proveedores — Facturas y Presupuestos

## Compromiso con Proveedores

**Qué hace:** 
Gestiona las facturas de compras e insumos provenientes de proveedores de la clínica veterinaria, así como el seguimiento de presupuestos y cotizaciones de compras.

**Escenarios cubiertos:**
- **Registrar Facturas:** Carga de comprobantes de ingreso de mercadería con número de factura, proveedor, cantidad de ítems, monto total y estado de pago (`PENDIENTE` / `PAGADO`).
- **Gestionar Presupuestos:** Registro de cotizaciones y presupuestos de insumos y medicamentos con estado (`BORRADOR`, `APROBADO`, `RECHAZADO`).
- **KPIs y Totales:** Cálculo de total adeudado pendiente de pago, total de facturas pagadas y total de presupuestos aprobados.

**Casos borde conocidos:**
- Montos de facturas o presupuestos en cero: El sistema requiere montos positivos válidos antes de registrar el comprobante.

**Restricciones o supuestos:**
- Las facturas registradas en este módulo corresponden a egresos/compras a proveedores y se diferencian de la facturación cliente (POS/AFIP) del módulo de Cobros.
