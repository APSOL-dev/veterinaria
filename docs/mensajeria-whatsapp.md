## Mensajería WhatsApp (Evolution API v2)

**Qué hace:**
Módulo de mensajería WhatsApp integrado con Evolution API (v2 / Baileys). Permite la gestión y envío de mensajes en tiempo real con los tutores de pacientes de VETSOFT, vinculación automática por teléfono, envío de plantillas de turnos/recordatorios y recepción de archivos multimedia.

**Escenarios cubiertos:**
- Indicador del "Estado de conexión" en el header (Conectado / Desconectado / Conectando) de diseño sobrio sin botones secundarios redundantes.
- Ocultamiento de la interfaz de chat (sidebar con lista de conversaciones y buscador) en estado desconectado, presentando de forma limpia y centrada únicamente la tarjeta de vinculación QR.
- Pantalla e instructivo de vinculación ampliados (`max-w-5xl`, tarjeta de QR `w-60 h-60`) en español con 3 pasos explicativos, el botón "Generar QR" y el botón "Cancelar" (renderizado condicionalmente sólo cuando se está generando o mostrando un QR).
- Resolución automática del nombre de instancia activa en el servidor de mensajería para prevenir errores 404 de vinculación.
- Presentación limpia y profesional en la interfaz de usuario bajo la denominación WhatsApp Web.
- Lista de conversaciones con filtrado (Todos, Clientes VETSOFT, No leídos) y búsqueda por nombre/teléfono.
- Vinculación automática con la ficha de cliente/tutor mediante `phoneMatcher`.
- Chat en tiempo real con historial de mensajes (mensajes propios/recibidos, tildes de lectura, fecha/hora).
- Envío de notas de voz grabadas directamente desde el navegador (MediaRecorder API).
- Envío de plantillas predefinidas (Recordatorio de Turno, Recordatorio de Vacuna, Confirmación de Consulta, Aviso de Retiro).
- Envío y previsualización de imágenes (con Lightbox), audio y documentos adjuntos.
- Marcar chats como leídos al abrirlos.

- Resolución de nombres de usuario y contactos de WhatsApp (`resolveChatDisplayName`):
  1. Si el número coincide con un tutor/paciente de VETSOFT, se muestra su nombre completo (y mascota entre paréntesis).
  2. Si el chat proviene de un LID de WhatsApp (`@lid`), se extrae primero el número de teléfono real del atributo `remoteJidAlt` en `lastMessage` para realizar el match con el tutor en VETSOFT.
  3. Si no hay match con VETSOFT, se usa el `pushName` o nombre de contacto devuelto por WhatsApp (descartando valores genéricos como "Você" o strings de LIDs).
  4. Como fallback, se formatea el número de teléfono limpio (`+54 9 ...`).
- Visualización de imágenes de perfil de contacto (`getChatAvatarUrl`):
  - Renderizado automático de las imágenes de avatar devueltas por el servidor de mensajería (`profilePicUrl`) o fotos asociadas al cliente en VETSOFT.
  - Fallback suave con iniciales estilizadas en caso de error de carga de imagen o ausencia de avatar.
- Recepción y reproducción de archivos multimedia (`getBase64FromMediaMessage`):
  - Las imágenes enviadas/recibidas se obtienen y desencriptan en base64 desde el servidor de mensajería para previsualizarlas directamente en el chat (con soporte para ampliar en Lightbox y miniaturas thumbnail de carga rápida).
  - Las notas de voz / audios PTT se infieren con los encabezados MIME correctos (`audio/ogg`) y se renderizan con un reproductor HTML5 funcional con controles interactivos de reproducción, pausa y avance.
  - Los documentos adjuntos (PDFs) ofrecen enlace de descarga directa con el nombre original del archivo.
- Manejo de Permisos de Micrófono y Conexiones Seguras:
  - Detección previa de disponibilidad de `navigator.mediaDevices`. Si se accede por HTTP no seguro o sin permisos, despliega alertas informativas claras solicitando permisos o HTTPS.
  - Captura diferencial de errores (`NotAllowedError`, `NotFoundError`) evitando bloqueos de la interfaz.
- Formateo de Errores de API (Evolution API):
  - Las respuestas HTTP 400 u otros fallos de la API deserializan arreglos y mensajes de validación internos (`message` / `response.message`) para informar la causa exacta del error en lugar de mensajes genéricos.
- Fondo de pantalla característico de WhatsApp Web:
  - Papel tapiz con patrón de garabatos vectoriales en tono beige cálido (`#efeae2`), aplicado tanto a la vista activa del chat como a la pantalla vacía inicial.
  - Burbujas de chat con estilo fiel a WhatsApp Web: verde suave (`#d9fdd3`) para mensajes enviados y blanco para recibidos, acompañadas de doble tilde azul (`#53bdeb`) para confirmaciones de entrega/lectura.
- Formatos variados de teléfonos argentinos (`+54 9 ...`, `549...`, `15...`) e identificadores LIDs: normalizados automáticamente para garantizar el match con el tutor en VETSOFT y la visualización legible de nombres.
- Credenciales ausentes de Evolution API: la app captura el error suavemente indicando configurar las variables de entorno sin romper la interfaz.

**Restricciones o supuestos:**
- Se requiere disponer de una instancia de Evolution API (v2) configurada mediante las variables `VITE_EVOLUTION_API_URL`, `VITE_EVOLUTION_API_KEY` y `VITE_EVOLUTION_INSTANCE`.
