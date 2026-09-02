## Gestión de Proveedores, Cuentas Corrientes y Plazos

**Qué hace:** 
El módulo **Proveedores** integra el control de facturas comerciales de compra, presupuestos, gastos de operación, el registro de **Pagos** y el libro diario de **Cuentas Corrientes** por proveedor.

**Escenarios cubiertos:**

1. **Registro Directo de Pagos en Cuentas Corrientes (`cuentas`):**
   - **Botón Superior "Registrar Pago":** Ubicado arriba a la derecha en Cuentas Corrientes (`payments`), abre el panel `PaymentDrawer` para seleccionar proveedor, número de factura a abonar, método de pago, monto y adjuntar comprobante.
   - **Acción Rápida de Pago por Fila:** Cada fila de factura con saldo pendiente posee un botón de pago directo (`payments`) en la columna de acciones para iniciar el pago preseleccionando dicho comprobante.

2. **Submódulo Cuentas Corrientes:**
   - **Libro Diario:** Muestra Nº Comprobante, Comprobante Adjunto, Estado, Proveedor, Fecha, Debe, Haber y Saldo.
   - **Botón "Configurar Plazos":** Permite acceder al submódulo de Plazos.

**Casos borde conocidos:**
- **Saldado de Facturas en Tiempo Real:** Al registrar el pago desde Cuentas Corrientes, el saldo corriente del proveedor y el estado del comprobante se actualizan de forma inmediata a "Pagado" o "Pago Parcial".
