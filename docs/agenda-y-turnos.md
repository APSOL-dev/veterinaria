## Agenda & Turnos

**Qué hace:** 
En la vista **Agenda & Turnos** (tanto en el calendario de Área Médica como de Peluquería), se presenta una grilla semanal dinámica por franja horaria que se posiciona automáticamente en la **semana actual** y permite navegar libremente entre semanas. Cada turno agendado dispone de un botón directo de acción **`Cobrar Turno`**.

**Escenarios cubiertos:**
- **Navegación Semanal Dinámica:**
  - Al ingresar, el calendario calcula y muestra automáticamente la semana actual (de Lunes a Sábado), resaltando el día de hoy.
  - **Botón `Hoy`:** Restablece la vista del calendario a la semana en curso.
  - **Flechas `<` y `>`:** Permiten desplazarse semana a semana hacia el pasado o el futuro.
  - **Filtro exacto por fecha (`YYYY-MM-DD`):** Los turnos (médicos y de peluquería) se ubican estrictamente en la columna correspondiente a su fecha asignada.

**Flujo de Acciones de Turno (Completar sin cobrar / Cobrar):**
1. **Completar turno (sin necesidad de cobrar):** En las tarjetas de turnos de la grilla y en el modal de detalle del turno, se incluye el botón **`Completar`** (o *Marcar completado (sin cobrar)*). Al accionarlo, el turno cambia inmediatamente su estado a `completed` sin requerir la emisión de un cobro. En la agenda se muestra la insignia de **`Completado`**.
2. **Cobrar Turno:** Al presionar **`Cobrar`**, deriva al módulo **Cobros** preseleccionando al paciente y servicio. Al emitir el cobro, el turno se marca automáticamente como completado.
3. **Modal de Detalle:** El modal del turno incluye botones de acción rápida para marcar como completado directamente o derivar al cobro.
