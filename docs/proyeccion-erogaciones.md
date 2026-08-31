## Proyección de Erogaciones y Pagos por Fecha de Pago

**Qué hace:** 
Este submódulo dentro de Proveedores -> Facturas de compras permite visualizar una tabla comparativa mensual ("Resumen") con la proyección de erogaciones acumuladas, facturas abonadas, deuda pendiente de pago, presupuesto total asignado y porcentaje de cumplimiento mensual.

**Escenarios cubiertos:**
- **Agrupación por Fecha de Pago:** El acumulado de la columna `Total adeudado` y las proyecciones mensuales se calculan en función de la **fecha de pago** (`paymentDate`) de cada comprobante (o de la fecha de emisión si no fue especificada). Los pagos individuales registrados a través del submódulo de pagos impactan directamente por su fecha de realización (`payment.date`).
- **Desglose de montos:**
  - `Total adeudado`: Suma de los saldos pendientes de pago de los comprobantes según su fecha en dicho mes.
  - `Total pagado`: Suma de todos los pagos registrados (`SupplierPayment[]`) en dicho mes según la fecha efectiva del pago.
  - `Total`: Suma de adeudado + pagado.
  - `Presupuesto Total`: Monto presupuestado para el mes (editable en línea).
  - `Cumplimiento`: Porcentaje `(Total / Presupuesto Total) * 100`.

**Niveles de Cumplimiento con Alerta Visual:**
- **Superado (> 100%):** Badge rojo con icono `cancel` (🚫).
- **Advertencia (90% - 100%):** Badge amarillo/naranja con icono `warning` (⚠️).
- **En Rango (< 90%):** Badge verde con icono `check_circle` (✅).
