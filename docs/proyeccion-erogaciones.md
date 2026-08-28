## Proyección de Erogaciones y Pagos por Fecha de Pago

**Qué hace:** 
Este submódulo dentro de Proveedores -> Facturas de compras permite visualizar una tabla comparativa mensual ("Resumen") con la proyección de erogaciones acumuladas, facturas abonadas, deuda pendiente de pago, presupuesto total asignado y porcentaje de cumplimiento mensual.

**Escenarios cubiertos:**
- **Agrupación por Fecha de Pago:** El acumulado de la columna `Total adeudado` y las proyecciones mensuales se calculan en función de la **fecha de pago** (`paymentDate`) de cada comprobante (con fallback a la fecha de emisión de la factura si la fecha de pago no fue especificada).
- **Desglose de montos:**
  - `Total adeudado`: Suma de comprobantes pendientes según su fecha de pago en dicho mes.
  - `Total pagado`: Suma de comprobantes abonados según su fecha de pago en dicho mes.
  - `Total`: Suma de adeudado + pagado.
  - `Presupuesto Total`: Monto presupuestado para el mes (editable en línea).
  - `Cumplimiento`: Porcentaje `(Total / Presupuesto Total) * 100`.

**Niveles de Cumplimiento con Alerta Visual:**
- **Superado (> 100%):** Badge rojo con icono `cancel` (🚫).
- **Advertencia (90% - 100%):** Badge amarillo/naranja con icono `warning` (⚠️).
- **En Rango (< 90%):** Badge verde con icono `check_circle` (✅).
