## Proyección de Erogaciones y Pagos por Fecha de Pago

**Qué hace:** 
Este submódulo dentro de Proveedores -> Facturas de compras permite visualizar una tabla comparativa mensual ("Resumen") con 7 columnas (`Año/Mes`, `Total Adeudado`, `Total Pagado`, `Gastos`, `Total`, `Presupuesto total`, `Cumplimiento %`) que proyecta y desglosa erogaciones acumuladas por proveedores (mercadería) y gastos operativos generales de la veterinaria.

**Escenarios cubiertos:**
- **Estructura de Columnas de la Tabla:**
  - `Año/Mes`: Mes y año correspondiente a la proyección.
  - `Total Adeudado`: Suma de los saldos pendientes o fraccionados imputados a dicho mes según la condición comercial del proveedor.
  - `Total Pagado`: Suma de todos los pagos registrados a proveedores (`SupplierPayment[]`) en dicho mes según su fecha efectiva.
  - `Gastos`: Suma de todos los gastos/egresos operativos registrados (`ExpenseRecord[]`) en dicho mes según la fecha del registro.
  - `Total`: Suma consolidada del período (`Total Adeudado` + `Total Pagado` + `Gastos`).
  - `Presupuesto Total`: Monto presupuestado asignado para el mes (editable en línea).
  - `Cumplimiento %`: Porcentaje `(Total / Presupuesto Total) * 100`.

- **Agrupación y Distribución por Plazos de Crédito:**
  - El acumulado de la columna `Total adeudado` y las proyecciones mensuales se calculan respetando la **condición comercial / plan de pagos del proveedor** (`SupplierCreditTerm`).
  - Si el proveedor tiene un plan de pagos fraccionado (ej. 50% a 30 días y 50% a 60 días), el saldo pendiente de cada factura emitida se distribuye automáticamente entre los meses correspondientes a cada vencimiento (contado, 30 días, 60 días, 90 días).
  - En caso de proveedores con vencimiento único o sin fraccionamiento, el saldo se imputa a la fecha de pago (`paymentDate`) de la factura o en su defecto a la fecha de emisión.
  - Los pagos individuales registrados (`SupplierPayment[]`) impactan directamente en la fecha efectiva de realización (`payment.date`).

- **Integración de Gastos Operativos (Egresos):**
  - Los egresos de la veterinaria registrados en la sección de Gastos (`ExpenseRecord[]`) computan en la columna `Gastos` del mes correspondiente a `expense.date`.
  - Estos gastos forman parte del consumo del `Presupuesto Total` mensual sumándose al `Total`.

- **Desglose Desplegable por Proveedor y Categoría de Gasto:**
  - Cada fila mensual dispone de un botón desplegable (flecha `>` / `v`) que permite visualizar el detalle por ítems.
  - Al expandir un mes, se dividen dos secciones de desglose:
    1. **Proveedores:** Sub-filas por cada proveedor con movimiento en el mes, detallando `Total adeudado`, `Total pagado` y `Total`.
    2. **Gastos Operativos:** Sub-filas agrupadas por categoría de gasto (ej. Alquiler, Servicios, Honorarios, etc.), detallando el monto imputado en el mes.

**Niveles de Cumplimiento con Alerta Visual:**
- **Superado (> 100%):** Badge rojo con icono `cancel` (🚫).
- **Advertencia (90% - 100%):** Badge amarillo/naranja con icono `warning` (⚠️).
- **En Rango (< 90%):** Badge verde con icono `check_circle` (✅).
