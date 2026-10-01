## Agenda & Turnos

**Qué hace:** 
En la vista **Agenda & Turnos** (tanto en el calendario de Área Médica como de Peluquería), se presenta una grilla semanal dinámica por franja horaria que se posiciona automáticamente en la **semana actual** y permite navegar libremente entre semanas. Permite agendar turnos con cálculo dinámico de duración, filtrar en tiempo real por paciente o tutor, reprogramar turnos y realizar acciones directas como **`Completar`** o **`Cobrar Turno`**.

**Escenarios cubiertos:**
- **Navegación Semanal Dinámica:**
  - Al ingresar, el calendario calcula y muestra automáticamente la semana actual (de Lunes a Sábado), resaltando el día de hoy.
  - **Botón `Hoy`:** Restablece la vista del calendario a la semana en curso.
  - **Flechas `<` y `>`:** Permiten desplazarse semana a semana hacia el pasado o el futuro.
  - **Filtro exacto por fecha (`YYYY-MM-DD`):** Los turnos (médicos y de peluquería) se ubican estrictamente en la columna correspondiente a su fecha asignada.

- **Filtros Separados por Paciente y Tutor:**
  - Filtro dedicado para **Paciente** (nombre de mascota, especie, raza) con icono y botón para limpiar.
  - Filtro dedicado para **Tutor** (nombre del propietario) con icono y botón para limpiar.
  - Funcionan de forma independiente o combinada (lógica AND) para acotar la búsqueda en la grilla y cola de espera.

- **Acceso a Historial en Encabezado Superior:**
  - El botón de **Historial** se ubica en el encabezado superior del módulo, brindando un acceso directo y despejando la barra de navegación semanal.

- **Duración Dinámica de Turnos:**
  - Selector rápido con píldoras de duración predeterminadas (`15 min`, `30 min`, `45 min`, `60 min`, `90 min`, `120 min`) en el modal de nuevo turno, detalle y reprogramación.
  - Al seleccionar una duración o cambiar la hora de inicio, el sistema calcula y ajusta automáticamente la hora de finalización (`appEndTime`).
  - Las tarjetas en la grilla del calendario muestran únicamente los datos esenciales: el **nombre completo del paciente**, la **duración del turno** (ej. `30 min`), la insignia de estado (ej. `Vencido` o `Completado`), el detalle del servicio o consulta, y los botones de acción rápida (`Completar` y `Cobrar`), omitiendo el rango horario redundante ya indicado por la fila del calendario.
  - Al hacer clic en un slot vacío del calendario, se abre automáticamente el modal con la fecha y hora seleccionadas.

- **Formato Uniforme de Fechas (`DD/MM/YYYY`):**
  - Toda la interfaz de usuario en la aplicación (agenda, cobros, facturas de proveedores, cuenta corriente, perfiles de pacientes, vacunas, recetas y modales) presenta las fechas en formato estándar `DD/MM/YYYY`.

- **Detección y Visualización de Estado "Vencido" en Turnos Pasados:**
  - El sistema evalúa el estado efectivo de cada turno mediante `getEffectiveAppointmentStatus(date, time, status)`.
  - Si un turno permanece en estado `pending` o `confirmed` pero su fecha/hora ya transcurrió con respecto al momento actual (`date < today` o `date == today && time < currentHour`), la interfaz lo clasifica y exhibe automáticamente como **`Vencido`** con distintivo ámbar (`bg-amber-100 text-amber-800`), en lugar de "Pendiente" o "Confirmado".
  - Los turnos en estado `completed` ("Completado") o `cancelled` ("Cancelado") preservan su estado correspondiente independientemente de la fecha.
  - En la **Ficha del Paciente**, la sección de turnos separa el contador de turnos activos programados del de turnos vencidos/históricos y muestra el distintivo correspondiente.
  - En la **Agenda Semanal (Médica y Peluquería)** y en la **Ficha del Tutor**, las tarjetas y modales reflejan el estado "Vencido" pero conservan las acciones rápidas de **`Completar`** o **`Cobrar`** para permitir regularizar o cerrar turnos pasados sin fricción.

- **Vista Responsive para Dispositivos Móviles (360px - 768px):**
  - En pantallas móviles (`< md`), la grilla de 7 columnas se reemplaza por un selector de días semanal horizontal tipo píldoras (`Lun 28`, `Mar 29`, etc.) con contador de turnos por día y badge de día actual.
  - La vista muestra los turnos del día seleccionado en tarjetas legibles a ancho completo con el nombre destacado del paciente, duración, servicio/motivo, estado e interacción táctil cómoda (`min-h-[38px]`) para **`Completar`** y **`Cobrar`**.
  - En tablets y escritorios (`>= 768px`), se mantiene la matriz horaria completa de 6 columnas (Lun a Sáb).

**Flujo de Acciones de Turno (Completar sin cobrar / Cobrar):**
1. **Completar turno (sin necesidad de cobrar):** En las tarjetas de turnos de la grilla y en el modal de detalle del turno, se incluye el botón **`Completar`** (o *Marcar completado (sin cobrar)*). Al accionarlo, el turno cambia inmediatamente su estado a `completed` sin requerir la emisión de un cobro. En la agenda se muestra la insignia de **`Completado`**.
2. **Cobrar Turno:** Al presionar **`Cobrar`**, deriva al módulo **Cobros** preseleccionando al paciente y servicio. Al emitir el cobro, el turno se marca automáticamente como completado.
3. **Modal de Detalle y Reprogramación:** El modal del turno incluye botones de acción rápida para marcar como completado directamente, derivar al cobro, o cambiar fecha/hora con el selector de duración.

**Restricciones o supuestos:**
- Las horas se manejan en formato 24hs (`HH:MM`).
- Si la hora de inicio o la hora de finalización es omitida, la duración se calcula por defecto en 30 minutos.
- Un turno vencido no bloquea la agenda y puede ser completado o cobrado retrospectivamente en cualquier momento.
