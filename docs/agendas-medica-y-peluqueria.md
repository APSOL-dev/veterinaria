## Módulo Unificado: Agenda (Médica y Peluquería)

**Qué hace:** 
Gestiona los turnos y la planificación horaria de la clínica bajo un único módulo unificado denominado **"Agenda"**, permitiendo alternar fácilmente entre los turnos del Área Médica y los turnos del Área de Peluquería.

**Escenarios cubiertos:**
- Pestaña unificada **"Agenda"** en la navegación principal.
- **Hora de Fin y Rango Horario:**
  - **Área Médica:** Permite seleccionar Hora de Inicio y Hora de Fin al agendar la consulta médica.
  - **Peluquería:** Calcula automáticamente la Hora de Fin sumando la duración en minutos del servicio seleccionado a la Hora de Inicio, permitiendo también su edición manual.
- **Visualización Completa en Cronograma:**
  - Las tarjetas de turno muestran la insignia con el rango completo de tiempo (ej. `09:00 - 10:30`).
  - Las franjas horarias subsecuentes ocupadas por la duración del turno muestran un indicador de continuidad (`↳ Paciente (hasta HH:MM)`), reflejando la ocupación total del calendario sin vacíos confusos.
- **Selector interno de vista:**
  - **Área Médica:** Asignación de profesional veterinario, motivo de consulta y seguimiento de estados (Pendiente, Confirmado, En Atención, Finalizado).
  - **Peluquería:** Servicios estéticos (Baños, cortes, deslanado), bloqueo automático de la franja horaria según la duración del servicio en minutos.
- **Disponibilidad independiente:** Mantiene calendarios separados para veterinarios y peluqueros en segundo plano sin superponer horarios.

**Casos borde conocidos:**
- Cambio de vista instantáneo entre agendas sin perder el estado del día seleccionado.
- Ajustes de Hora de Fin personalizados que extienden el turno a través de múltiples franjas horarias.

**Restricciones o supuestos:**
- El personal con perfil restrictivo (ej. Peluquería) accede a la vista de Agenda en su correspondiente subárea.
