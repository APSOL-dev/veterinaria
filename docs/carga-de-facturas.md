## Carga de Facturas de Proveedores (Eliminación de Placeholders e Inclusión de Fecha de Pago)

**Qué hace:** 
Este panel lateral deslizante derecho ("Cargar Nueva Factura") en el submódulo **Facturas de compras** elimina el texto de sugerencia/ejemplo en las cajas de entrada y añade la fecha de pago estimada o efectiva.

**Cambios en el Formulario:**
- **Eliminación de Textos de Ejemplo (`placeholder`):** Se removieron todos los valores simulados o de ejemplo (`Ej. FEDERAL EXPRESS CORP.`, `Ej. 30594494187`, `Ej. 0001-00045612`, `0.00`, `Ej. 150.000`) de los campos de texto y número.
- **Sin Asignaciones Ficticias de Respaldo:** En caso de fallas o respuestas vacías en el procesamiento, los campos permanecen limpios sin precargar datos genéricos no reales.
- **Campo `Fecha de pago`:** Incorporado un nuevo selector de fecha (`<input type="date">`) ubicado junto a `Fecha factura *`. Mapea automáticamente la clave `fecha_vencimiento` o `fecha_pago` devuelta por la extracción de comprobantes.
