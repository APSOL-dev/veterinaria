## Gestión de Proveedores, Cuentas Corrientes y Plazos

**Qué hace:** 
El módulo **Proveedores** integra el control de facturas comerciales de compra, presupuestos, gastos de operación, el registro de **Pagos** y el libro diario de **Cuentas Corrientes** por proveedor.

**Escenarios cubiertos:**

1. **Consulta e Inspección de Detalle de Factura al Hacer Clic en el Registro:**
   - Al hacer clic en cualquier fila/registro de la tabla del listado de facturas (`SuppliersView`), el sistema abre inmediatamente el panel desplegable de detalle (`NewInvoiceDrawer`) cargando todos los datos del comprobante y el desglose completo de sus productos/ítems asociados.
   - **Bloqueo de Edición en Facturas Pagadas:** Las facturas que ya han sido canceladas en su totalidad (`isPaid === true`) no permiten modificar sus renglones ni importes para resguardar la integridad contable. El botón de edición se deshabilita mostrando un icono de candado explicativo. Sin embargo, la acción de **eliminar factura** permanece disponible, removiendo los pagos asociados en cascada.

2. **Filtros Avanzados, Presets de Fechas y Ordenación por Columnas:**
   - **Búsqueda por Proveedor y N° Factura:** Barra superior de filtros que permite escribir de forma interactiva y elegir de una lista desplegable el proveedor, además de buscar por número de factura.
   - **Filtros Rápidos de Fecha (Presets):** Junto al selector de rango de fechas de PowerBI, se ofrecen accesos directos para acotar la consulta en un solo clic: `"Este mes"`, `"Próximos 3 meses"` y `"Próximos 6 meses"`, actualizando la visualización de manera inmediata.
   - **Ordenación por Encabezados de Columna:** Cada columna del listado (Fecha emisión, Fecha pago, Proveedor, N° factura, Ítems, Monto total, Saldo restante, Estado) permite alternar el orden ascendente y descendente (mayor a menor y viceversa) con indicadores visuales de flecha (▲/▼).
   - **Insignias de Estado Legibles:** La etiqueta del estado `"Pago parcial"` cuenta con ancho reservado y estilos `whitespace-nowrap` para evitar saltos de línea indeseados o cortes de texto.

3. **Eliminación en Cascada de Pagos al Borrar Factura:**
   - Al eliminar una factura de compras desde el sistema, cualquier pago registrado previamente asociado a dicho comprobante se remueve en cascada del estado local y de la base de datos Supabase (`vetsoft_pagos_proveedores`), manteniendo el balance de Cuentas Corrientes consistente.

4. **Copiar Gasto sin Comprobante Adjunto:**
   - Al duplicar/copiar un gasto existente en el submódulo de Gastos, los campos de categoría, asignación, monto y descripción se precargan, pero el comprobante adjunto se limpia automáticamente para evitar adjuntar recibos desactualizados al nuevo registro.

5. **Vista Consolidada de Cuentas Corrientes y Alta de Proveedores:**
   - **Modal "Agregar Proveedor":** En la cabecera de Cuentas Corrientes se incluye el botón "+ Agregar Proveedor", el cual despliega un modal para registrar nuevos proveedores indicando Nombre / Razón Social (*), CUIT y su Plazo Comercial por defecto (Contado, 30 días, 60 días, 90 días o Personalizado). Los proveedores personalizados se persisten localmente (`vetsoft_registered_suppliers`) y se integran automáticamente en todos los selectores del sistema.
   - **Desplazamiento Fluido (Scroll):** La vista de Cuentas Corrientes y el listado de proveedores cuentan con scroll vertical nativo habilitado tanto en pantallas de escritorio como móviles.
   - **Estructura Simplificada:** Se reemplazó el formato clásico de Debe y Haber por una tabla directa de 2 columnas principales: **Proveedor** y **Saldo**.
   - **Columna Proveedor:** Muestra el nombre comercial de cada proveedor registrado o con movimientos, su inicial de avatar y un indicador de cantidad de comprobantes registrados / facturas pendientes.
   - **Columna Saldo:** Presenta el saldo neto consolidado ($ \text{Total Facturado} - \text{Total Pagado} $) con formato numérico y badge de estado (*Saldo a pagar*, *Saldo a favor* o *Al día*).
   - **Filtros rápidos:** Permite filtrar por texto ("Buscar proveedor...") o por estado de saldo (*Todos*, *Con deuda*, *Al día*).
   - **Inspección de Detalle e Historial:** Al hacer clic sobre cualquier fila de proveedor, se despliega un modal interactivo con el resumen de totales (Total Facturado, Total Pagado, Saldo) y el listado de comprobantes asociados con acceso directo al comprobante digital adjunto, botón de pago rápido y opción de eliminar factura.
   - **Acción Superior "Registrar Pago":** Ubicado arriba a la derecha en Cuentas Corrientes para abrir el panel de pagos a proveedores.

6. **Entrada de Stock Unificada con Carga de Factura:**
   - **Formulario Multilínea en Blanco (`NewInvoiceDrawer`):** Al presionar "Agregar línea de producto", la nueva fila se crea en blanco (`productId: ''`, `productName: ''`) con buscador integrado (`SearchableProductSelect`), permitiendo buscar y seleccionar productos sin sustituir elementos preelegidos.
   - **Actualización Automática de Inventario:** Al guardar la factura, el sistema actualiza de manera simultánea el stock físico (`currentStock += cantidad`) y opcionalmente el precio de catálogo de cada producto, registrando el comprobante en Cuentas Corrientes.

7. **Cálculo Dinámico de Tarjetas KPI de Resumen:**
   - Las tarjetas KPI superiores de Resumen (Comprado, Facturas pagadas, Pendiente de pago y Gastos operativos) se recalculan **dinámicamente en tiempo real** en base al rango de fechas y filtros activos aplicados por el usuario.
   - **Formato decimal de moneda:** Todos los montos en las tarjetas KPI se formatean siempre con 2 decimales explícitos.

**Casos borde conocidos y mejoras de persistencia:**
- **Persistencia de Ítems en Supabase:** Los ítems/productos vinculados a cada factura se persisten íntegramente en la columna `items` (JSONB) de `vetsoft_facturas_proveedores` y se exponen mediante la vista `vetsoft_vw_facturas_proveedores`.
- **Buscadores Interactivos por Texto:** Tanto la selección de proveedores (`SearchableSupplierSelect`) como la selección de productos/mercadería (`SearchableProductSelect`) cuentan con autocompletado en tiempo real al escribir.
- **Costo Total Fijo Autocalculado:** El monto total de la factura es de solo lectura y se calcula automáticamente como la suma exacta de los subtotales de productos vinculados, IVA e impuestos/percepciones aplicables.
- **Tratamiento Fiscal de Factura C y Remitos (Sin IVA):** Al seleccionar o extraer mediante n8n un comprobante tipo "Factura C" o "Remito", el sistema desactiva automáticamente el cálculo de IVA (`applyIva = false`, `taxAmount = $0,00` y `subtotal = totalAmount`), bloqueando el selector para evitar errores impositivos.
- **Tipografía Numérica Estandarizada:** Los importes, saldos y fechas en las tablas y formularios utilizan la tipografía sans-serif nativa de la aplicación (`Inter`), logrando coherencia visual uniforme en todo el sistema.
- **Saldado de Facturas en Tiempo Real:** Al registrar el pago desde Cuentas Corrientes, el saldo corriente del proveedor y el estado del comprobante se actualizan de forma inmediata a "Pagado" o "Pago Parcial".
