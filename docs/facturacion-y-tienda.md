## Facturación, Cobros y Selección de Catálogos

**Qué hace:**
El módulo **Cobros** administra la emisión de facturas electrónicas, remitos y comprobantes de venta. Permite seleccionar directamente ítems activos del catálogo de **Productos** e ítems del catálogo de **Servicios**, editar precios unitarios de forma flexible en la tabla de conceptos y emitir Facturas C de forma predeterminada, además de consultar el historial simplificado de comprobantes emitidos.

**Escenarios cubiertos:**

1. **Emisión de Comprobantes por Defecto en Factura C:**
   - La pantalla de **Nueva Facturación** se inicializa predeterminadamente con **Factura C** (`documentType: 'factura-c'`).
   - Al ser Factura C, el discriminado de IVA se desactiva de forma automática (`applyTax: false`).

2. **Selección Directa y Desplegable Buscador en Modal de Agregar Conceptos:**
   - En el modal de **Agregar Concepto a Factura**, el usuario alterna entre **Servicio** y **Producto**.
   - **Desplegable Interactivo (Apertura al hacer Clic):** La lista de productos o servicios permanece colapsada por defecto para mantener el modal compacto y se despliega como un menú flotante sobrepuesto (`absolute z-[80]`) al hacer clic o foco en el campo de búsqueda o en el botón de flecha (chevron).
   - **Buscador Integrado en Tiempo Real:** Permite escribir para filtrar dinámicamente por nombre, categoría o precio referencial. Incluye botón para limpiar el texto y cierre automático al seleccionar un concepto o al hacer clic fuera del control.
   - Permite filtrar previamente por categorías dinámicas registradas en el sistema (ej. `Clínica`, `Peluquería`, `Medicamentos`, `Alimentación`, `Accesorios`, `Insumos Clínicos`).
   - Al seleccionar un ítem de la lista, autocompleta la descripción y el costo unitario de referencia en el formulario del concepto.

3. **Edición Directa de Precios Unitarios (Precio Editable sin ceros pre-cargados):**
   - El precio unitario de cualquier concepto en la tabla de detalle y en el modal de agregación de conceptos es **completamente editable en tiempo real**.
   - Los campos numéricos utilizan la función `formatPriceInputDisplay` para mostrar el recuadro **en blanco** cuando el valor es 0 (con `placeholder="0"`), evitando que el usuario tenga que borrar ceros antes de escribir.
   - Incluyen la propiedad `onFocus={(e) => e.target.select()}`, lo que selecciona automáticamente todo el texto al hacer clic para facilitar la tipeación directa.
   - Al cambiar el precio unitario de un renglón, se recalculan automáticamente el subtotal, los descuentos y el total general de la factura mediante `parsePriceInput`.

4. **Configuración de Cobro y Validación Obligatoria:**
   - **Campos Obligatorios de Emisión:** El **Número de Comprobante / Factura** (`customInvoiceNumber`) y el **Archivo de Comprobante / Factura Adjunta** (`voucherUrl`) son **estrictamente obligatorios**. Si el usuario intenta confirmar el cobro con alguno de estos campos vacío, el sistema bloquea el checkout y muestra una notificación clara solicitando completar el número y adjuntar el archivo correspondiente.
   - La opción **"Emitir Comprobante AFIP (CAE)"** se inicializa **desmarcada por defecto** (`isAfip: false`). Esto protege a la veterinaria de enviar autorizaciones fiscales reales a los servidores de AFIP de manera accidental o involuntaria en cada cobro estándar. El usuario debe tildarla explícitamente cuando requiera emitir con CAE fiscal.
   - En dispositivos móviles, todos los campos de texto y desplegables de Cobros poseen un tamaño tipográfico mínimo de 16px (`text-base sm:text-xs`) para evitar el zoom involuntario de pantalla en iOS Safari al tocarlos.

5. **Caja de Adjunto de Comprobante / Factura:**
   - En el panel derecho **Configuración de cobro**, se incluye un componente de carga de archivos (`.PDF`, `.PNG`, `.JPG`, `.JPEG`) para adjuntar la factura o comprobante impreso obligatorio con indicador visual de asterisco rojo.
   - El archivo adjunto genera una vista previa del nombre con opción de desadjuntarlo antes de emitir el cobro.
   - La información del comprobante (`voucherName`, `voucherUrl`) se persiste en el `BillReceipt`.

6. **Historial de Comprobantes, Búsqueda Avanzada, Métricas y Detalle:**
   - **Buscador General Multicriterio:** Permite buscar comprobantes en tiempo real por número de comprobante/factura, nombre del tutor, nombre del paciente/mascota, medio de pago, tipo de comprobante, código CAE y descripción/concepto de los ítems facturados.
   - **Filtros Combinables:** Permite filtrar de forma simultánea por Tipo de Comprobante (Factura A, B, C, Remito), Medio de Pago (Efectivo, Tarjeta, Transferencia, Cuenta Corriente) y Período Temporal (Hoy, Últimos 7 días, Este mes, Este año).
   - **Indicador de Total Facturado:** Presenta en la cabecera el Total Facturado acumulado según los filtros y búsquedas aplicadas.
   - **Ordenamiento Multicolumna:** Todas las columnas clave (Comprobante Nº, Fecha, Tutor/Paciente, Tipo Doc, Medio Pago, Total) son interactivas y permiten ordenar de forma ascendente y descendente con indicadores visuales claros.
   - **Detalle Completo e Impresión (`ComprobanteDetailModal`):** Al hacer clic sobre cualquier fila del historial o en el botón de visualización, se abre el modal con desglose de conceptos, cantidades, precios unitarios, descuentos aplicados, totales y descarga/vista previa de adjuntos.
   - **Persistencia en Supabase:** Sincroniza la cabecera del comprobante en `vetsoft_recibos` y sus renglones en `vetsoft_detalle_recibos`.

**Casos borde conocidos:**
- **Validación de Cobro:** Checkout cancelado si falta el número personalizado de factura o el comprobante adjunto.
- **Facturas A / B vs C:** Si el usuario decide cambiar manualmente a Factura A o B, se activa el cálculo de IVA (21% por defecto), manteniendo todos los precios editados por el usuario.
- **Formato de Archivo Adjunto:** Se permite subir imágenes y PDFs manteniendo persistencia en base64 u objeto en memoria/storage.
- **Filtrado sin resultados:** Cuando los filtros activos no coinciden con ningún comprobante, se muestra un mensaje informativo con botón directo "Limpiar filtros" para restablecer la vista.


