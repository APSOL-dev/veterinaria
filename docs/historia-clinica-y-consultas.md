## Historia Clínica y Modal de Nueva Consulta

**Qué hace:** 
Al presionar el botón **"Nueva Consulta"** (desde la barra lateral o cualquier punto del sistema), se abre una pantalla/modal dedicada de registro clínico donde el profesional selecciona la mascota, redacta las notas clínicas y diagnóstico, emite receta opcional y adjunta archivos (estudios, radiografías, análisis). Al guardar, la consulta se almacena automáticamente en la ficha del paciente dentro del módulo **"Pacientes"**.

**Escenarios cubiertos:**
- **Acceso global:** El botón "Nueva consulta" en la barra lateral despliega la pantalla de alta médica sin perder el contexto del trabajo actual.
- **Selección de Paciente:** Muestra el paciente seleccionado por defecto con posibilidad de cambiar a cualquier otra mascota registrada.
- **Campos de Registro y Auto-expansión Dinámica:**
  - Notas clínicas y diagnóstico (obligatorio). Las áreas de texto (`AutoResizeTextarea`) crecen verticalmente de forma dinámica y fluida a medida que el profesional escribe o pega texto extenso, evitando cajas de texto fijas o amontonamiento.
  - Indicaciones / Posología de Receta (opcional con botón "Generar Receta") con auto-expansión adaptativa.
  - Zona de carga de archivos adjuntos (simulada para imágenes y PDFs).
- **Atención Rápida y Observaciones en Ficha de Paciente:**
  - El registro de atención rápida directa en la ficha del paciente incorpora campos de texto auto-expandibles con espaciado amplio y `leading-relaxed` para notas y recetas.
  - El modal de edición de consultas, notas de vacunas y anotaciones de turnos en la agenda implementan el mismo comportamiento auto-expandible unificado.
- **Acciones al guardar y generación automática de PDF:**
  - **"Guardar Consulta":** Almacena el registro en el historial clínico del paciente y navega inmediatamente a su ficha técnica en el módulo "Pacientes", mostrando la nueva entrada en la cronología.
  - **Validación Visual de Notas Clínicas:** Si el profesional intenta guardar una consulta sin ingresar texto en las notas clínicas, el sistema resalta el área de texto en rojo (`border-red-500 ring-2 ring-red-400`), muestra un mensaje de advertencia descriptivo en pantalla y activa el modal informativo (`AppNotificationModal`), evitando guardar registros vacíos o fallas silenciosas.
  - **Consistencia del Autor / Veterinario:** El profesional asignado a cada consulta registrada (tanto desde la Ficha Rápida del Paciente como desde el módulo de Clínica) toma automáticamente el nombre del usuario activo con sesión iniciada (`userSession.name`), evitando nombres ficticios o valores hardcodeados en el código fuente.
  - **"Guardar y Generar Receta" / Generar PDF:** Guarda la consulta médica y activa automáticamente el visor/modal de PDF de receta médica, aislado del resto de la interfaz (sin botones de la aplicación ni menús en el documento).
  - **"Ver receta PDF":** Renderiza el documento membretado de la prescripción veterinaria y permite la descarga limpia en PDF vía `html2pdf.js` o impresión física.
  - **"Exportar historia clínica (PDF)":** Genera un informe oficial de la historia clínica completa del paciente (`Historia_Clinica_[NombrePaciente].pdf`) que resume los datos de la mascota, tutor, cronología de atenciones y plan sanitario, libre de controles de navegación o botones del sistema.

- **Almacenamiento en Supabase Storage (`veterinaria-archivos`):**
  - **Archivos Adjuntos:** Todos los estudios, radiografías o análisis cargados se suben al bucket público `veterinaria-archivos` dentro de la carpeta `/consultas/`.
  - **Recetas Médicas:** Al guardar y generar recetas, las indicaciones se almacenan como comprobantes/archivos en la carpeta `/recetas/`.
  - **Acceso y Descarga:** En la ficha histórica del paciente, cada consulta muestra botones de descarga directa (`Ver Receta Adjunta` y lista de adjuntos) enlazados a sus URLs públicas en Supabase Storage.

**Casos borde conocidos:**
- **Validación de notas vacías:** El sistema requiere ingresar texto de diagnóstico antes de permitir guardar la atención, brindando feedback visual e inline tanto en la Ficha Médica como en Nueva Consulta.
- **Carga de archivos múltiples:** Soporta la subida simultánea de varios documentos e imágenes (.JPG, .PNG, .PDF, .DOC).
- **Aislamiento de exportaciones PDF:** Todos los contenedores de reportes se procesan independientemente eliminando botones y barras laterales antes de renderizar la captura a PDF.

**Restricciones o supuestos:**
- Todas las consultas registradas actualizan en tiempo real la cronología de "Consultas Anteriores" del paciente seleccionado y persisten sus URLs en Supabase DB (`public.vetsoft_consultas_clinicas`).
