## Vacunas y Catálogo por Clínica

**Qué hace:** 
Gestiona el catálogo personalizado de vacunas que ofrece la clínica, el registro de dosis aplicadas a cada paciente, el cálculo de **Cobertura Actual** según vacunas necesarias, la asignación automática del profesional activo y la generación de recordatorios para tutores.

**Formato de Mensaje de Recordatorio (WhatsApp / SMS):**
```text
Hola (Nombre tutor), te recordamos que la vacuna (Nombre vacuna) para (Nombre paciente) vence el (Dia de vencimiento) podemos agendar una visita para poner a (Nombre paciente) al día!
```

**Escenarios cubiertos:**
- **Cobertura Actual según Vacunas Necesarias:** Se calcula dividiendo la cantidad de vacunas necesarias en estado `aplicada` sobre el total de vacunas necesarias asignadas al paciente (`aplicadas / necesarias`).
- **Eliminación en Cascada del Historial:** Al desmarcar o remover una vacuna aplicada del esquema del paciente, el registro de la dosis correspondiente se elimina de forma inmediata del Historial de Vacunación y de la base de datos Supabase (`vetsoft_dosis_vacunas`).
- **Profesional por Defecto:** El campo "Profesional / Veterinario" en los formularios de consulta, vacunación y agenda toma por defecto el nombre del usuario activo con sesión iniciada (`userSession.name`).
- Configuración de vacunas por clínica: Nombre y frecuencia de vencimiento (medida en días).
- Registro de dosis aplicada: Selección de la vacuna del catálogo, fecha de aplicación y cálculo automático de vencimiento.
- Tabla de historial de vacunación:
  - Columna **Vencimiento**: Muestra las etiquetas `Al día` (en verde) o `Vencida` (en rojo).
  - Columna **Estado**: Muestra las etiquetas `Aplicada` o `Pendiente`.

**Operaciones CRUD y Sincronización en Base de Datos:**
- **Catálogo de Vacunas (`public.vetsoft_vacunas_catalogo`):** Permite **Agregar**, **Editar** y **Eliminar** ítems del catálogo general, sincronizando en tiempo real con Supabase.
- **Dosis Aplicadas (`public.vetsoft_dosis_vacunas`):** Inserta (`insertVaccineDosisToSupabase`) y elimina (`deleteVaccineDosisFromSupabase` / `deleteVaccineDosesByPatientAndVaccineFromSupabase`) las dosis aplicadas del historial y la base de datos.
- **Búsqueda con Fallback e Identificación del Paciente:** El registro de dosis acepta tanto el ID del ítem en catálogo como el nombre de la vacuna (`vaccineId` o `vaccineName`), garantizando la creación de la dosis sin fallar aunque la vacuna no existiese previamente en la lista en memoria. Sincroniza automáticamente el estado de la vacuna del paciente a `aplicada`.
