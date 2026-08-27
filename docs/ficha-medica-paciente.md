## Adjuntos y Estudios en Registro de Ficha Médica

**Qué hace:** 
En la vista **Nueva Consulta / Registro de Ficha Médica**, la casilla de carga de archivos adjuntos permite seleccionar directamente archivos del equipo y arrastrar/soltar documentos (PDF, imágenes, radiografías, estudios).

**Funcionalidades de la Casilla:**
- **Selección Directa de Archivo:** Al hacer clic en cualquier sector de la casilla, se abre el selector nativo de archivos del sistema operativo (`<input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.doc,.docx">`).
- **Soporte Drag & Drop:** Control de eventos de arrastre (`onDragOver`, `onDragLeave`, `onDrop`) con feedback visual de resalte cuando se arrastra un archivo sobre la zona.
- **Lista Interactiva de Adjuntos:** Los archivos seleccionados o arrastrados se muestran como etiquetas (chips) con opción de eliminación individual mediante un botón de cierre (`×`).
