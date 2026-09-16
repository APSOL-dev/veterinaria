## Gestión de Proveedores, Cuentas Corrientes y Plazos

**Qué hace:** 
El módulo **Proveedores** integra el control de facturas comerciales de compra, presupuestos, gastos de operación, el registro de **Pagos** y el libro diario de **Cuentas Corrientes** por proveedor.

**Escenarios cubiertos:**

1. **Consulta e Inspección de Detalle de Factura al Hacer Clic en el Registro:**
   - Al hacer clic en cualquier fila/registro de la tabla del listado de facturas (`SuppliersView`), el sistema abre inmediatamente el panel desplegable de detalle (`NewInvoiceDrawer`) cargando todos los datos del comprobante y el desglose completo de sus productos/ítems asociados.

2. **Filtros Avanzados y Ordenación por Columnas en Facturas:**
   - **Búsqueda por Proveedor y N° Factura:** Barra superior de filtros que permite escribir de forma interactiva y elegir de una lista desplegable el proveedor, además de buscar por número de factura.
   - **Ordenación por Encabezados de Columna:** Cada columna del listado (Fecha emisión, Fecha pago, Proveedor, N° factura, Ítems, Monto total, Saldo restante, Estado) permite alternar el orden ascendente y descendente (mayor a menor y viceversa) con indicadores visuales de flecha (▲/▼).

3. **Eliminación en Cascada de Pagos al Borrar Factura:**
   - Al eliminar una factura de compras desde el sistema, cualquier pago registrado previamente asociado a dicho comprobante se remueve en cascada del estado local y de la base de datos Supabase (`vetsoft_pagos_proveedores`), manteniendo el balance de Cuentas Corrientes consistente.

4. **Copiar Gasto sin Comprobante Adjunto:**
   - Al duplicar/copiar un gasto existente en el submódulo de Gastos, los campos de categoría, asignación, monto y descripción se precargan, pero el comprobante adjunto se limpia automáticamente para evitar adjuntar recibos desactualizados al nuevo registro.

5. **Registro Directo de Pagos en Cuentas Corrientes (`cuentas`):**
   - **Botón Superior "Registrar Pago":** Ubicado arriba a la derecha en Cuentas Corrientes (`payments`), abre el panel `PaymentDrawer` para seleccionar proveedor, número de factura a abonar, método de pago, monto y adjuntar comprobante.
   - **Acción Rápida de Pago por Fila:** Cada fila de factura con saldo pendiente posee un botón de pago directo (`payments`) en la columna de acciones para iniciar el pago preseleccionando dicho comprobante.

6. **Entrada de Stock Unificada con Carga de Factura:**
   - **Formulario Multilínea (`NewInvoiceDrawer`):** Permite registrar la factura del proveedor asociando $N$ productos del catálogo de inventario con sus cantidades recibidas y precios de costo unitarios.
   - **Actualización Automática de Inventario:** Al guardar la factura, el sistema actualiza de manera simultánea el stock físico (`currentStock += cantidad`) y opcionalmente el precio de catálogo de cada producto, registrando el comprobante en Cuentas Corrientes.

7. **Cálculo de Tarjetas KPI de Resumen en Facturas (Modelo Proyección / Vencimientos):**
   - **Comprado este mes:** Suma total de erogaciones proyectadas del mes actual (Adeudado que vence en el mes + Pagado en el mes + Gastos operativos del mes) -> **$848.125,04**.
   - **Facturas pagadas:** Suma total exclusiva de los pagos realizados en el mes actual sobre facturas de proveedores (`totalPagado` del mes) -> **$100.000,00**.
   - **Pendiente de pago:** Saldo adeudado proyectado con vencimiento exclusivo en el mes actual (`totalAdeudado` del mes en curso) -> **$719.625,04**.
   - **Comprometido a 30 días:** Saldo total adeudado proyectado a vencer en el próximo mes / próximos 30 días (`totalAdeudado` del mes siguiente en proyección) -> **$1.155.668,50**.
   - **Formato decimal de moneda:** Todos los montos en las tarjetas KPI se formatean siempre con 2 decimales explícitos.

**Casos borde conocidos y mejoras de persistencia:**
- **Persistencia de Ítems en Supabase:** Los ítems/productos vinculados a cada factura se persisten íntegramente en la columna `items` (JSONB) de `vetsoft_facturas_proveedores` y se exponen mediante la vista `vetsoft_vw_facturas_proveedores`.
- **Buscadores Interactivos por Texto:** Tanto la selección de proveedores (`SearchableSupplierSelect`) como la selección de productos/mercadería (`SearchableProductSelect`) cuentan con autocompletado en tiempo real al escribir.
- **Costo Total Fijo Autocalculado:** El monto total de la factura es de solo lectura y se calcula automáticamente como la suma exacta de los subtotales de productos vinculados, IVA e impuestos/percepciones aplicables.
- **Saldado de Facturas en Tiempo Real:** Al registrar el pago desde Cuentas Corrientes, el saldo corriente del proveedor y el estado del comprobante se actualizan de forma inmediata a "Pagado" o "Pago Parcial".
