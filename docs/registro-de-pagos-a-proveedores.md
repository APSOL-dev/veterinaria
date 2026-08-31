## Registro de Pagos a Facturas de Proveedores

**Qué hace:** Permite registrar pagos parciales o totales a facturas de proveedores ya ingresadas en el sistema mediante una ventana lateral deslizante (*PaymentDrawer*). Los pagos se listan en el submódulo "Pagos" dentro del módulo Proveedores.

**Escenarios cubiertos:**

- **Registrar pago desde el listado de facturas:** Cada fila del listado de facturas tiene un botón (ícono `price_check`) que abre el panel lateral de pago (*drawer*) precompletado con la factura elegida y su saldo restante.
- **Registrar pago desde el submódulo Pagos:** El botón "Registrar pago" en el header abre el panel lateral con el dropdown para elegir cualquier factura.
- **Carga de comprobante de pago:** Permite adjuntar un comprobante digital (PDF o imagen) en el formulario de pago (*drag & drop* o selección manual), almacenando su nombre en `voucherName`.
- **Visualización de comprobante:** En la tabla del submódulo "Pagos", los pagos con comprobante presentan un indicador/badge con icono de adjunto `attach_file` y el nombre del archivo.
- **Pago parcial:** Si se registra un monto menor al total de la factura, el badge en la lista de facturas cambia a **PAGO PARCIAL** (naranja).
- **Pago total:** Si el saldo restante llega a $0, el badge cambia a **PAGADO** (verde).
- **Historial de pagos:** El tab "Pagos" muestra la tabla completa de todos los pagos registrados con su comprobante, ordenados por fecha descendente.
- **Notificación de confirmación:** Al registrar un pago, se muestra un modal/toast de confirmación con el monto y la factura correspondiente.

**Casos borde conocidos:**

- Si se paga más del monto de la factura, el saldo se muestra en $0 (nunca negativo), gracias a `getRemainingBalance` que usa `Math.max(0, ...)`.
- Si no hay facturas registradas, el dropdown del panel lateral estará vacío y el botón de enviar estará deshabilitado.

**Restricciones o supuestos:**

- Los pagos se persisten automáticamente en la base de datos de Supabase en la tabla física `vetsoft_pagos_proveedores` y se consultan a través de la vista `vetsoft_vw_pagos_proveedores`.
- Los archivos adjuntos de comprobantes (PDF/Imágenes) se suben al bucket público `veterinaria-archivos` de Supabase Storage en la carpeta `comprobantes/`. La URL pública generada (`voucher_url`) permite visualizar y descargar el archivo directamente desde la tabla de pagos.
- No hay eliminación de pagos registrados en esta versión.
- El campo "Estado" del badge se calcula dinámicamente en base a los pagos, sin modificar el campo `status` de `SupplierBill`.

**Campos del formulario de pago (Panel Lateral / PaymentDrawer):**
- **Factura** (dropdown con saldo restante visible): requerido.
- **Monto ($)**: pre-completado con el saldo restante; editable.
- **Fecha de Pago**: pre-completada con la fecha actual.
- **Método de pago**: Efectivo, Transferencia, Cheque, Tarjeta, Otro.
- **Comprobante de Pago** (opcional): zona de arrastre y selección de archivo PDF/Imagen.
- **Nota** (opcional): referencia, número de transferencia, etc.
