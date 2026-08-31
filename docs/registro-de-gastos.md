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
- **Modal de Alta / Edición de Gastos:**
  - `Asignación`: Campo fijo configurado en "Santo Tomé".
  - `Responsable`: Opciones del desplegable: Administración, Clínica, Peluquería.
  - `Rubro / Categoría`: 19 categorías oficiales (Alimentos y Balanceados, Farmacología y Medicamentos, Accesorios y Juguetes, Higiene y Estética, Materiales Descartables y Quirúrgicos, Alquiler del Local, Servicios Públicos, Internet y Telefonía, Seguridad y Monitoreo, Tasas e Impuestos, Sueldos y Jornales, Honorarios Profesionales, Cargas Sociales y Sindicales, Mantenimiento de Equipos, Limpieza y Desinfección, Fletes y Logística, Gastos Bancarios y Comisiones, Software y Suscripciones, Gastos Varios / Caja Chica).
  - Permite ingresar Fecha, Monto, Descripción y Nota opcional.

**Casos borde conocidos:**
- **Sin resultados tras filtrar:** Muestra un mensaje informativo en la tabla indicando que no hay coincidencias con los criterios seleccionados.
- **Filtros combinados:** Los 5 filtros funcionan de manera acumulativa (AND lógico).

**Restricciones o supuestos:**
- Los montos ingresados deben ser mayores a 0.
