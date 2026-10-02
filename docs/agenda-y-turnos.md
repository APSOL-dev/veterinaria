## Agenda & Turnos

**Qué hace:** 
En la vista **Agenda & Turnos** (tanto en el calendario de Área Médica como de Peluquería), se presenta un sistema de calendario multifuncional con vistas de **Día**, **Semana** y **Mes** (con soporte completo de 7 días: Lunes a Domingo). Permite agendar turnos con cálculo dinámico de duración, filtrar en tiempo real por paciente o tutor con autocompletado desplegable, navegar entre períodos, registrar notas, y realizar acciones directas como **`Completar`** o **`Cobrar Turno`**. Además, protege los turnos completados contra cancelaciones o reprogramaciones accidentales.

**Escenarios cubiertos:**
- **Selector de Vista (Día, Semana, Mes):**
  - **Día:** Vista detallada de 2 columnas (hora + día seleccionado) que despliega los turnos con tarjetas ampliadas, profesional, motivo y acciones rápidas.
  - **Semana:** Grilla completa de 8 columnas (hora + 7 días: Lunes a Domingo) que ubica los turnos según su franja y duración calculada.
  - **Mes:** Grilla mensual de 7 columnas que muestra los días del mes y chips compactos de turnos con estado visual (completado, vencido o pendiente).
  - **Navegación contextual:** Los botones `<` y `>` se adaptan al modo activo (día anterior/siguiente, semana anterior/siguiente o mes anterior/siguiente) y el botón `Hoy` regresa al momento actual.

- **Filtros con Autocompletado (Búsqueda de Paciente y Tutor):**
  - Al escribir o enfocar los campos de búsqueda de paciente o tutor, se despliega una lista interactiva con coincidencias para selección inmediata.
  - Permite filtrar la agenda y la vista mensual por paciente o tutor específico con un solo clic.

- **Protección de Turnos Completados:**
  - Cuando un turno pasa al estado `completed` ("Completado"), el modal de detalle bloquea las opciones de cancelar o reprogramar para preservar la integridad del registro histórico. Permite consultar y agregar notas u observaciones clínicas.

- **Integración con Control de Vacunas:**
  - Al completar un turno médico cuyo motivo corresponda a una vacuna, el sistema actualiza automáticamente el estado de la vacuna requerida a "aplicada" y registra la dosis en la base de datos (Supabase y local).
  - Si un paciente ya tiene un turno agendado para una vacuna requerida, el sistema muestra el distintivo de "Turno agendado" y previene la duplicación de turnos.

- **Formato Uniforme de Fechas (`DD/MM/YYYY`):**
  - Toda la interfaz de usuario presenta las fechas en formato estándar `DD/MM/YYYY`.

- **Detección y Visualización de Estado "Vencido" en Turnos Pasados:**
  - El sistema evalúa el estado efectivo de cada turno mediante `getEffectiveAppointmentStatus(date, time, status)`. Si un turno no completado ya venció, se muestra como **`Vencido`** con distintivo ámbar.

- **Vista Responsive para Dispositivos Móviles:**
  - En móviles (`< md`), se ofrece navegación por días con tarjetas táctiles optimizadas (`min-h-[42px]`) para completar y cobrar.

**Restricciones o supuestos:**
- Las horas se manejan en formato 24hs (`HH:MM`).
- Los turnos completados son inmutables en fecha y hora para auditoría histórica.

