## Registrar Gastos

**Qué hace:** 
El submódulo **Registrar gastos** (dentro del módulo de Proveedores) permite la carga, filtrado, edición y duplicación directa de gastos operativos de la veterinaria (combustible, fletes, viáticos, insumos de oficina, etc.) de forma totalmente independiente a la facturación comercial de proveedores.

**Escenarios cubiertos:**
- **Barra de 5 Filtros de Búsqueda:**
  - `Responsable`: Filtrado dinámico por usuario (ej: Alberto, Sele, o Todos).
  - `Mes / período`: Filtrado por mes/año (ej: Agosto 2026).
  - `Rubro`: Filtrado por categoría de gasto (Combustible, Fletes, Gastos varios, Insumos oficina, etc.).
  - `Asignación`: Filtrado por sede/local (Local Chaco minorista, Local Chaco mayorista, Local Santa Fe mayorista).
  - `Medio de pago`: Filtrado por caja o método de pago (Efectivo Caja chica, Mercado Pago, etc.).
  - Botón `Limpiar todos los filtros`.
- **Card KPI de Resumen ("Gastos filtrados"):** Recalcula en tiempo real el monto total acumulado (`$ X.XXX.XXX,XX`) y la cantidad de registros/comprobantes que coinciden con los filtros aplicados.
- **Tabla de Registros (9 Columnas):**
  - Muestra Fecha, Responsable (badge con avatar), Rubro, Asignación, Medio pago, Descripción (en tipografía destacada font-mono), Monto, Nota y Acciones.
- **Acciones por Fila:**
  - **Duplicar gasto:** Crea una copia rápida del gasto seleccionado.
  - **Editar gasto:** Abre el modal precompletado para modificar cualquier atributo.
  - **Eliminar gasto:** Elimina el registro del gasto.
- **Modal de Alta / Edición de Gastos:**
  - Permite ingresar todos los datos requeridos (Fecha, Responsable, Rubro, Asignación, Medio pago, Descripción, Monto y Nota opcional).

**Casos borde conocidos:**
- **Sin resultados tras filtrar:** Muestra un mensaje informativo en la tabla indicando que no hay coincidencias con los criterios seleccionados.
- **Filtros combinados:** Los 5 filtros funcionan de manera acumulativa (AND lógico).

**Restricciones o supuestos:**
- Los montos ingresados deben ser mayores a 0.
