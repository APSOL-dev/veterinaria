## Módulo Unificado: Agenda (Médica y Peluquería)

**Qué hace:** 
Gestiona los turnos y la planificación horaria de la clínica bajo un único módulo unificado denominado **"Agenda"**, permitiendo alternar fácilmente entre los turnos del Área Médica y los turnos del Área de Peluquería.

**Escenarios cubiertos:**
- Pestaña unificada **"Agenda"** en la navegación principal.
- **Selector interno de vista:**
  - **Área Médica:** Asignación de profesional veterinario, motivo de consulta y seguimiento de estados (Pendiente, Confirmado, En Atención, Finalizado).
  - **Peluquería:** Servicios estéticos (Baños, cortes, deslanado), bloqueo automático de la franja horaria según la duración del servicio en minutos.
- **Disponibilidad independiente:** Mantiene calendarios separados para veterinarios y peluqueros en segundo plano sin superponer horarios.

**Casos borde conocidos:**
- Cambio de vista instantáneo entre agendas sin perder el estado del día seleccionado.

**Restricciones o supuestos:**
- El personal con perfil restrictivo (ej. Peluquería) accede a la vista de Agenda en su correspondiente subárea.
