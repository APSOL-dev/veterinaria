## Módulo de Gestión de Pacientes y Ficha Médica

**Qué hace:** 
Proporciona una vista centralizada para la búsqueda, filtrado, alta rápida y consulta detallada del expediente clínico de cada mascota atendida en la clínica veterinaria.

**Escenarios cubiertos:**
- **Ficha Médica Hero Card:**
  - **Banner de Alertas Clínicas:** Despliega advertencias visuales de seguridad (alergias a fármacos, condiciones crónicas como diabetes, esterilización).
  - **Acciones Rápidas de Contacto:** Enlaces directos a WhatsApp (`https://wa.me/...`) y llamadas telefónicas con el propietario.
  - **Barra de Accesos Directos:** Navegación en un clic hacia `🩺 Nueva Consulta`, `💉 Registrar Vacuna`, `📅 Agendar Turno` y `📄 Exportar/Imprimir HC (PDF)`.
- **Lista de Pacientes y Filtrado:**
  - **Alta Rápida (`+ Nuevo Paciente`):** Modal de registro validado con datos de mascota, propietario y alertas clínicas.
  - **Filtros por Especie y Estado:** Pestañas *pills* para filtrar por `Todos`, `🐶 Caninos`, `🐱 Felinos` y `⚠️ Con Alertas`.
- **Evolución de Peso (Sparkline):**
  - Gráfico dinámico de tendencia de peso a lo largo de las consultas históricas, mostrando el indicador neto de variación (`+1.4 kg` / `-0.5 kg`).

**Casos borde conocidos:**
- Mascotas sin teléfono de contacto: Se omite el acceso a WhatsApp sin romper la maquetación.
- Pacientes sin historial previo de peso: Muestra indicador "Estable" por defecto.

**Restricciones o supuestos:**
- Todas las alertas médicas registradas se destacan tanto en la ficha técnica como con badges en la lista principal.
