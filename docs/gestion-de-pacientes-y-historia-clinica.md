## Gestión de Pacientes, Historia Clínica y Control de Vacunas

**Qué hace:**
El módulo **Pacientes** administra las fichas médicas, atención clínica, recetas médicas en PDF con veterinario asignado y envío directo a WhatsApp, selección de alertas médicas y vacunas requeridas en un diseño **a ancho completo (sin panel lateral)** enfocado exclusivamente en la ficha médica y plan sanitario del paciente, con insignias de fecha holgadas y bien estructuradas.

**Escenarios cubiertos:**

1. **Diseño UX/UI a Ancho Completo sin Sidebar Lateral:**
   - Se eliminó la columna lateral fija de pacientes para ganar el 100% del espacio horizontal de la pantalla.
   - **Selector de Paciente en Cabecera:** Desplegable superior de selección rápida con buscador de pacientes + botón `Nuevo Paciente`.

2. **Navegación Enfocada en 2 Pestañas Modulares (`PatientProfileView.tsx`):**
   - **Pestaña 1 (Historia Clínica & Consultas):** Registro rápido de atención, receta PDF con envío a WhatsApp y cronología histórica de consultas médicas con distintivos de fecha holgados (Día en fuente destacada, Mes y Año separados).
   - **Pestaña 2 (Vacunas Requeridas & Plan Sanitario):** Tarjeta de vacunas requeridas por paciente (con selección desde catálogo o alta nueva) e integración al vacunatorio.

3. **Recetas Médicas en PDF e Integración con WhatsApp:**
   - **Formato Visual Ampliado:** Formato membretado A4/A5 de alta legibilidad con tipografía aumentada (`text-base`, `text-lg`), datos completos del Centro Veterinario, mascota, tutor, y firma/sello profesional con Matrícula (`vetLicenseNumber`).
   - **Pre-visualización Automática:** Al guardar una consulta con receta médica en `NewConsultationView.tsx` o `PatientProfileView.tsx`, se despliega el modal interactivo `PrescriptionModal`.
   - **Envío Directo por WhatsApp:** Botón que genera el enlace `https://wa.me/...` con el texto de la prescripción estructurado y personalizado para el tutor.

4. **Alta de Pacientes con Tutor Existente o Nuevo (`NewPatientModal.tsx`):**
   - Permite seleccionar un tutor registrado del padrón mediante desplegable con buscador o alternar al modo "+ Crear Nuevo Dueño" registrando sus datos personales completos.

**Casos borde conocidos:**
- **Validaciones de Teléfono en WhatsApp:** Los números de teléfono se formatean automáticamente para generar la URL correcta de WhatsApp Web/App.
