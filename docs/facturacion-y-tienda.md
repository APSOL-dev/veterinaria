## Facturación, Cobros y Selección de Catálogos

**Qué hace:**
El módulo **Cobros** administra la emisión de facturas electrónicas, remitos y comprobantes de venta. Permite seleccionar directamente ítems activos del catálogo de **Productos** e ítems del catálogo de **Servicios**, editar precios unitarios de forma flexible en la tabla de conceptos y emitir Facturas C de forma predeterminada, además de consultar el historial simplificado de comprobantes emitidos.

**Escenarios cubiertos:**

1. **Emisión de Comprobantes por Defecto en Factura C:**
   - La pantalla de **Nueva Facturación** se inicializa predeterminadamente con **Factura C** (`documentType: 'factura-c'`).
   - Al ser Factura C, el discriminado de IVA se desactiva de forma automática (`applyTax: false`).

2. **Selección Directa desde Catálogos de Productos y Servicios:**
   - En el modal de **Agregar Concepto a Factura**, el usuario alterna entre **Servicio** y **Producto**.
   - Permite filtrar por categorías dinámicas registradas en el sistema (ej. `Clínica`, `Peluquería`, `Medicamentos`, `Alimentación`, `Accesorios`, `Insumos Clínicos`).
   - El desplegable lista los ítems existentes en el catálogo con sus precios de referencia, autocompletando la descripción y el costo.

3. **Edición Directa de Precios Unitarios (Precio Editable sin ceros pre-cargados):**
   - El precio unitario de cualquier concepto en la tabla de detalle y en el modal de agregación de conceptos es **completamente editable en tiempo real**.
   - Los campos numéricos utilizan la función `formatPriceInputDisplay` para mostrar el recuadro **en blanco** cuando el valor es 0 (con `placeholder="0"`), evitando que el usuario tenga que borrar ceros antes de escribir.
   - Incluyen la propiedad `onFocus={(e) => e.target.select()}`, lo que selecciona automáticamente todo el texto al hacer clic para facilitar la tipeación directa.
   - Al cambiar el precio unitario de un renglón, se recalculan automáticamente el subtotal, los descuentos y el total general de la factura mediante `parsePriceInput`.

4. **Caja de Adjunto de Comprobante / Factura:**
   - En el panel derecho **Configuración de cobro**, se incluye un componente de carga de archivos (`.PDF`, `.PNG`, `.JPG`, `.JPEG`) para adjuntar la factura o comprobante impreso.
   - El archivo adjunto genera una vista previa del nombre con opción de desadjuntarlo antes de emitir el cobro.
   - La información del comprobante (`voucherName`, `voucherUrl`) se persiste en el `BillReceipt`.

5. **Historial de Comprobantes Simplificado:**
   - Mantiene una tabla limpia con Comprobante Nº, Fecha, Paciente/Dueño, Tipo Doc, Medio de Pago, Total y Acciones.
   - Para comprobantes que cuentan con una factura adjunta, muestra un botón directo **Factura** que permite abrir o descargar el documento adjunto.

**Casos borde conocidos:**
- **Facturas A / B vs C:** Si el usuario decide cambiar manualmente a Factura A o B, se activa el cálculo de IVA (21% por defecto), manteniendo todos los precios editados por el usuario.
- **Formato de Archivo Adjunto:** Se permite subir imágenes y PDFs manteniendo persistencia en base64 u objeto en memoria/storage.

