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
  - **Copiar gasto:** Abre el modal de alta con todos los campos precompletados con los mismos datos del gasto seleccionado (Fecha, Responsable, Rubro, Asignación, Método pago, Descripción, Monto y Nota) para que el usuario pueda revisarlos o modificarlos antes de guardar (sin duplicar de forma automática).
  - **Editar gasto:** Abre el modal precompletado para modificar el registro existente.
  - **Eliminar gasto:** Elimina el registro del gasto.
- **Modal Independiente de Configuración de Parámetros de Gastos (`ExpenseCategoryModal`):**
  - Accesible de forma independiente mediante el botón `Categorías y Asignaciones` al lado de `Registrar Gasto`.
  - Muestra todos los rubros, asignaciones y responsables **existentes** en listas dinámicas ordenadas con contadores en tiempo real.
  - Posee 3 solapas: **Categorías / Rubros**, **Asignaciones / Sedes** y **Responsables**.
  - Permite la creación y eliminación en tiempo real de nuevos rubros, sedes e incluso responsables adicionales (ej: Dr. Gómez, Recepción).
  - Guarda las configuraciones de forma persistente en `localStorage`.
- **Modal de Alta / Edición de Gastos:**
  - `Asignación`: Desplegable dinámico que incluye la sede predeterminada oficial ("Santo Tomé") más las asignaciones adicionales creadas en el modal.
  - `Responsable`: Desplegable dinámico alimentado por los responsables predeterminados y creados.
  - `Rubro / Categoría`: 19 categorías oficiales más todas las categorías personalizadas creadas en el modal.
  - Permite ingresar Fecha, Monto, Descripción y Nota opcional.

**Casos borde conocidos:**
- **Sin resultados tras filtrar:** Muestra un mensaje informativo en la tabla indicando que no hay coincidencias con los criterios seleccionados.
- **Filtros combinados:** Los 5 filtros funcionan de manera acumulativa (AND lógico).

**Restricciones o supuestos:**
- Los montos ingresados deben ser mayores a 0.
