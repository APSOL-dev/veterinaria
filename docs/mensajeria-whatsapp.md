## Mensajería WhatsApp (Evolution API v2)

**Qué hace:**
Módulo de mensajería WhatsApp integrado con Evolution API (v2 / Baileys). Permite la gestión y envío de mensajes en tiempo real con los tutores de pacientes de VETSOFT, vinculación automática por teléfono, envío de plantillas de turnos/recordatorios y recepción de archivos multimedia.

**Escenarios cubiertos:**
- Estado de la conexión de la instancia (Conectado / Desconectado / Conectando) y modal con código QR para escaneo.
- Lista de conversaciones con filtrado (Todos, Clientes VETSOFT, No leídos) y búsqueda por nombre/teléfono.
- Vinculación automática con la ficha de cliente/tutor mediante `phoneMatcher`.
- Chat en tiempo real con historial de mensajes (mensajes propios/recibidos, tildes de lectura, fecha/hora).
- Envío de notas de voz grabadas directamente desde el navegador (MediaRecorder API).
- Envío de plantillas predefinidas (Recordatorio de Turno, Recordatorio de Vacuna, Confirmación de Consulta, Aviso de Retiro).
- Envío y previsualización de imágenes (con Lightbox), audio y documentos adjuntos.
- Marcar chats como leídos al abrirlos.

**Casos borde conocidos:**
- Formatos variados de teléfonos argentinos (`+54 9 ...`, `549...`, `15...`): normalizados automáticamente para garantizar el match con el tutor en VETSOFT.
- Credenciales ausentes de Evolution API: la app captura el error suavemente indicando configurar las variables de entorno sin romper la interfaz.

**Restricciones o supuestos:**
- Se requiere disponer de una instancia de Evolution API (v2) configurada mediante las variables `VITE_EVOLUTION_API_URL`, `VITE_EVOLUTION_API_KEY` y `VITE_EVOLUTION_INSTANCE`.
