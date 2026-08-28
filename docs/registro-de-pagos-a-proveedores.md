## Registro de Pagos a Facturas de Proveedores

**Qué hace:** Permite registrar pagos parciales o totales a facturas de proveedores ya ingresadas en el sistema. Los pagos se listan en el submódulo "Pagos" dentro del módulo Proveedores.

**Escenarios cubiertos:**

- **Registrar pago desde el listado de facturas:** Cada fila del listado de facturas tiene un botón (ícono `price_check`) que abre el modal de pago precompletado con la factura y el saldo restante.
- **Registrar pago desde el submodulo Pagos:** El botón "Registrar pago" en el header también abre el modal con el dropdown para elegir cualquier factura.
- **Pago parcial:** Si se registra un monto menor al total de la factura, el badge cambia a **PAGO PARCIAL** (naranja).
- **Pago total:** Si el saldo restante llega a $0, el badge cambia a **PAGADO** (verde).
- **Historial de pagos:** El tab "Pagos" muestra la tabla completa de todos los pagos registrados, ordenados por fecha descendente.
- **Notificación de confirmación:** Al registrar un pago, se muestra un toast de confirmación con el monto y la factura correspondiente.

**Casos borde conocidos:**

- Si se paga más del monto de la factura, el saldo se muestra en $0 (nunca negativo), gracias a `getRemainingBalance` que usa `Math.max(0, ...)`.
- Si no hay facturas registradas, el dropdown del modal estará vacío y el formulario no podrá enviarse (campo requerido).

**Restricciones o supuestos:**

- Los pagos son locales (en memoria). No hay persistencia en Supabase aún.
- No hay eliminación de pagos registrados en esta versión.
- El campo "Estado" del badge se calcula dinámicamente en base a los pagos, sin modificar el campo `status` de `SupplierBill`.

**Campos del formulario de pago:**
- **Factura** (dropdown con saldo restante visible): requerido.
- **Monto ($)**: pre-completado con el saldo restante; editable.
- **Fecha**: pre-completada con la fecha actual.
- **Método de pago**: Efectivo, Transferencia, Cheque, Tarjeta, Otro.
- **Nota** (opcional): referencia, número de transferencia, etc.
