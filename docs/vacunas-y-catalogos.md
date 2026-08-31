## Vacunas y Catálogo por Clínica

**Qué hace:** 
Gestiona el catálogo personalizado de vacunas que ofrece la clínica y el registro de dosis aplicadas a cada paciente, calculando automáticamente las fechas de vencimiento y próximas aplicaciones.

**Escenarios cubiertos:**
- Configuración de vacunas por clínica: Nombre y frecuencia de vencimiento (medida en días).
- Registro de dosis aplicada: Selección de la vacuna del catálogo, fecha de aplicación (por defecto hoy) y cálculo automático de fecha de vencimiento (`fecha_aplicacion + dias_frecuencia`).
- Modificación manual de fecha límite si la condición del paciente o el protocolo del veterinario lo exige.
- Registro opcional de lote y observaciones.
- Panel de control de vacunas al día, próximas a vencer y vencidas.

**Operaciones CRUD y Sincronización en Base de Datos:**
- **Catálogo de Vacunas (`public.vetsoft_vacunas_catalogo`):** Permite **Agregar**, **Editar** (nombre, días de vigencia) y **Eliminar** ítems del catálogo general, sincronizando en tiempo real con Supabase PostgreSQL.
- **Catálogo de Servicios y Prestaciones (`public.vetsoft_catalogo_servicios`):** Soporta alta, edición (categoría, nombre, descripción, precio) y eliminación con botones en tabla y modales dedicados.
- **Catálogo de Productos e Inventario (`public.vetsoft_productos`):** Soporta alta de nuevos productos, edición (SKU, nombre, categoría, precio, stock mínimo) y eliminación con sincronización en Supabase DB.

**Casos borde conocidos:**
- Ajuste manual de vencimiento: Prevalece el valor especificado por el profesional sobre el cálculo automático.
- Vacuna fuera del catálogo: Se debe agregar previamente la vacuna al catálogo de la clínica antes de aplicarla.
- Eliminación de ítems: La eliminación remueve la opción de selección para registros futuros sin alterar el historial preexistente.

**Restricciones o supuestos:**
- Todas las operaciones CRUD de catálogos persisten inmediatamente tanto en el estado reactivo de la aplicación como en la base de datos Supabase.
