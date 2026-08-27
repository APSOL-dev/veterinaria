## Proyección de Erogaciones y Pagos

**Qué hace:** 
Este submódulo dentro de Proveedores -> Facturas de compras permite visualizar una tabla comparativa mensual ("Resumen") con la proyección de erogaciones acumuladas, facturas abonadas, deuda pendiente de pago, presupuesto total asignado y porcentaje de cumplimiento mensual.

**Escenarios cubiertos:**
- **Visualización mensual en pestaña Resumen:** Muestra los meses ordenados cronológicamente (`mes_año`, ej: `mayo_2025`).
- **Desglose de montos:**
  - `Total adeudado`: Suma de comprobantes con estado `pending` en dicho mes (en rojo si > 0).
  - `Total pagado`: Suma de comprobantes con estado `paid` en dicho mes (en verde si > 0).
  - `Total`: Suma de adeudado + pagado.
  - `Presupuesto Total`: Monto presupuestado para el mes (editable en línea).
  - `Cumplimiento`: Porcentaje `(Total / Presupuesto Total) * 100`.
- **Niveles de Cumplimiento con Alerta Visual:**
  - **Superado (> 100%):** Badge rojo con icono `cancel` (🚫).
  - **Advertencia (90% - 100%):** Badge amarillo/naranja con icono `warning` (⚠️).
  - **En Rango (< 90%):** Badge verde con icono `check_circle` (✅).

**Casos borde conocidos:**
- **Presupuesto no definido o en 0:** Se muestra 0% de cumplimiento para evitar división por cero.
- **Nuevas facturas agregadas:** Al registrar una factura desde el modal, la tabla de Resumen recalcula automáticamente el total adeudado o pagado del mes correspondiente.

**Restricciones o supuestos:**
- El formato de fecha de la factura debe incluir mes y año (`YYYY-MM-DD`).
