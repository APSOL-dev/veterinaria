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

3. **Entrada de Stock Unificada con Carga de Factura:**
   - **Formulario Multilínea (`NewInvoiceDrawer`):** Permite registrar la factura del proveedor asociando $N$ productos del catálogo de inventario con sus cantidades recibidas y precios de costo unitarios.
   - **Actualización Automática de Inventario:** Al guardar la factura, el sistema actualiza de manera simultánea el stock físico (`currentStock += cantidad`) y opcionalmente el precio de catálogo de cada producto, registrando el comprobante en Cuentas Corrientes.
   - **Doble Acceso:** Disponible desde el botón *"Cargar Nueva Factura"* en Proveedores y desde *"Entrada con factura"* en Inventario.

**Casos borde conocidos:**
- **Saldado de Facturas en Tiempo Real:** Al registrar el pago desde Cuentas Corrientes, el saldo corriente del proveedor y el estado del comprobante se actualizan de forma inmediata a "Pagado" o "Pago Parcial".
- **Entrada de Mercadería sin Productos Vinculados:** Si una factura no posee ítems seleccionados del catálogo (ej. gastos generales o servicios), se registra únicamente el comprobante en Cuentas Corrientes sin afectar existencias físicas.
