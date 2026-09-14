## Agenda & Turnos

**Qué hace:** 
En la vista **Agenda & Turnos** (tanto en el calendario de Área Médica como de Peluquería), se presenta una grilla semanal dinámica por franja horaria que se posiciona automáticamente en la **semana actual** y permite navegar libremente entre semanas. Cada turno agendado dispone de un botón directo de acción **`Cobrar Turno`**.

**Escenarios cubiertos:**
- **Navegación Semanal Dinámica:**
  - Al ingresar, el calendario calcula y muestra automáticamente la semana actual (de Lunes a Sábado), resaltando el día de hoy.
  - **Botón `Hoy`:** Restablece la vista del calendario a la semana en curso.
  - **Flechas `<` y `>`:** Permiten desplazarse semana a semana hacia el pasado o el futuro.
  - **Filtro exacto por fecha (`YYYY-MM-DD`):** Los turnos (médicos y de peluquería) se ubican estrictamente en la columna correspondiente a su fecha asignada.

**Flujo de Navegación Directa a Cobros:**
1. Al presionar **`Cobrar Turno`** en una tarjeta de la agenda, el sistema obtiene el paciente y la prestación agendada.
2. Deriva automáticamente al usuario hacia el módulo **Cobros** $\rightarrow$ `nueva-facturacion` (Punto de Venta POS).
3. Preselecciona al paciente asignado al turno para agilizar la emisión del comprobante de cobranza.
4. **Actualización Automática a Estado Cobrado:** Al confirmar y cobrar la venta en el punto de cobro, el turno correspondiente cambia automáticamente su estado a `completado`. En el calendario de la Agenda, el botón "Cobrar Turno" se reemplaza automáticamente por una insignia verde resaltada de **`✓ Cobrado`**.
