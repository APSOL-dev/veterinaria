## Historia Clínica y Modal de Nueva Consulta

**Qué hace:** 
Al presionar el botón **"Nueva Consulta"** (desde la barra lateral o cualquier punto del sistema), se abre una pantalla/modal dedicada de registro clínico donde el profesional selecciona la mascota, redacta las notas clínicas y diagnóstico, emite receta opcional y adjunta archivos (estudios, radiografías, análisis). Al guardar, la consulta se almacena automáticamente en la ficha del paciente dentro del módulo **"Pacientes"**.

**Escenarios cubiertos:**
- **Acceso global:** El botón "Nueva consulta" en la barra lateral despliega la pantalla de alta médica sin perder el contexto del trabajo actual.
- **Selección de Paciente:** Muestra el paciente seleccionado por defecto con posibilidad de cambiar a cualquier otra mascota registrada.
- **Campos de Registro:**
  - Notas clínicas y diagnóstico (obligatorio).
  - Indicaciones / Posología de Receta (opcional con botón "Generar Receta").
  - Zona de carga de archivos adjuntos (simulada para imágenes y PDFs).
- **Acciones al guardar:**
  - **"Guardar Consulta":** Almacena el registro en el historial clínico del paciente y navega inmediatamente a su ficha técnica en el módulo "Pacientes", mostrando la nueva entrada en la cronología.
  - **"Guardar y Generar Receta":** Guarda la consulta médica y registra la indicación de receta para el paciente.

**Casos borde conocidos:**
- Validación de notas vacías: El sistema requiere ingresar texto de diagnóstico antes de permitir guardar la atención.

**Restricciones o supuestos:**
- Todas las consultas registradas actualizan en tiempo real la cronología de "Consultas Anteriores" del paciente seleccionado.
