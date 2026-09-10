## Carga, Edición y Eliminación de Facturas de Proveedores

**Qué hace:** 
Este panel lateral deslizante derecho ("Cargar Nueva Factura" / "Editar Factura de Proveedor") en el submódulo **Facturas de compras** permite cargar nuevos comprobantes manualmente o vía procesamiento automático n8n, así como editar o eliminar facturas ya adjuntadas con sincronización directa en Supabase.

**Escenarios cubiertos:**
- **Carga de Factura:** Formulario limpio con selección de archivo PDF/imagen. El archivo adjunto se sube al bucket público `veterinaria-archivos` de Supabase Storage en la carpeta `facturas/`, almacenando su URL pública (`voucher_url`) en la tabla `vetsoft_facturas_proveedores`.
- **Edición de Facturas:** Abrir una factura existente en el drawer precargando sus valores actuales, permitiendo modificar datos, montos, fecha de pago o estado y actualizarlos en la tabla `vetsoft_facturas_proveedores`.
- **Eliminación de Facturas:** Botón de eliminación en la tabla de facturas con modal de confirmación antes de remover el registro en la interfaz y en Supabase.
- **Visualización/Descarga de Comprobante:** Botón con icono de documento en la columna Acciones de la tabla de facturas que permite abrir/descargar el archivo adjunto en la nube.

- **Cálculo de Costo Total, Subtotal e IVA con Interruptor Deslizante:**
  - **Suma de Productos:** La suma de los subtotales de los productos cargados define automáticamente el **Costo Total**.
  - **Interruptor Deslizante de IVA:** Ubicado arriba del campo de IVA.
    - **IVA Habilitado (21%):** Calcula `Subtotal sin impuestos = Costo Total / 1.21` e `IVA = Costo Total - Subtotal sin impuestos`.
    - **IVA Inhabilitado:** Desactiva el IVA (`0`), igualando el `Subtotal sin impuestos` directamente al `Costo Total`.

- **Procesamiento de Productos en Inventario:**
  - Al guardar la factura, el sistema recorre cada producto listado en la factura.
  - Para productos existentes en el catálogo, actualiza su stock actual y opcionalmente su precio de venta/costo.
  - Para productos nuevos o no catalogados en la factura, crea un registro de producto en el catálogo de inventario automáticamente con el stock inicial recibido.

**Casos borde conocidos:**
- **Fecha de pago no especificada:** Si no se especifica fecha de pago, toma por omisión la fecha de emisión de la factura para mantener consistencia en la proyección.
- **Desactivación de IVA:** Al inhabilitar el interruptor de IVA, el campo IVA se bloquea en 0 y el Subtotal sin impuestos se actualiza al 100% del Costo Total de la factura.
- **Productos No Catalogados:** Al recepcionar una factura con un producto no registrado previamente en el inventario, se crea la entrada en el catálogo con categoría por omisión ("Insumos Clínicos") y precio según el costo unitario informado.
