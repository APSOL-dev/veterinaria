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

3. **Edición Directa de Precios Unitarios (Precio Editable):**
   - El precio unitario de cualquier concepto en la tabla de detalle de la factura es **completamente editable en tiempo real** mediante campos de ingreso numérico (`<input type="number">`).
   - Al cambiar el precio unitario de un renglón, se recalculan automáticamente el subtotal, los descuentos y el total general de la factura.

4. **Historial de Comprobantes Simplificado:**
   - Se eliminó la columna CAE AFIP de la tabla de historial de cobros (`CobrosView.tsx`), manteniendo una tabla limpia con Comprobante Nº, Fecha, Paciente/Dueño, Tipo Doc, Medio de Pago, Total y Acciones de impresión PDF.

**Casos borde conocidos:**
- **Facturas A / B vs C:** Si el usuario decide cambiar manualmente a Factura A o B, se activa el cálculo de IVA (21% por defecto), manteniendo todos los precios editados por el usuario.
