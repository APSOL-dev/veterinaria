## Carga, Edición y Eliminación de Facturas de Proveedores

**Qué hace:** 
Este panel lateral deslizante derecho ("Cargar Nueva Factura" / "Editar Factura de Proveedor") en el submódulo **Facturas de compras** permite cargar nuevos comprobantes manualmente o vía procesamiento automático n8n, así como editar o eliminar facturas ya adjuntadas con sincronización directa en Supabase.

**Escenarios cubiertos:**
- **Carga de Factura:** Formulario limpio con selección de archivo PDF/imagen. El archivo adjunto se sube al bucket público `veterinaria-archivos` de Supabase Storage en la carpeta `facturas/`, almacenando su URL pública (`voucher_url`) en la tabla `vetsoft_facturas_proveedores`.
- **Edición de Facturas:** Abrir una factura existente en el drawer precargando sus valores actuales, permitiendo modificar datos, montos, fecha de pago o estado y actualizarlos en la tabla `vetsoft_facturas_proveedores`.
- **Eliminación de Facturas:** Botón de eliminación en la tabla de facturas con modal de confirmación antes de remover el registro en la interfaz y en Supabase.
- **Visualización/Descarga de Comprobante:** Botón con icono de documento en la columna Acciones de la tabla de facturas que permite abrir/descargar el archivo adjunto en la nube.

**Casos borde conocidos:**
- **Fecha de pago no especificada:** Si no se especifica fecha de pago, toma por omisión la fecha de emisión de la factura para mantener consistencia en la proyección.
