## Integración Webhook para Carga de Facturas (n8n)

**Qué hace:** 
Conecta la app VETSOFT con el flujo n8n en el servidor externo vía HTTP POST con encabezado `Authorization: Bearer <secret>` y envío de `FormData` (archivo de factura) para OCR/extracción de datos.

**URL del Webhook Configurada:**
`https://bots.apsol-consultora.com.ar/webhook/0ca257f9-31f1-4639-ba17-b096d1c95a66`

**Diagnóstico y Configuración requerida en n8n:**
1. **Autenticación:** El endpoint de n8n requiere autenticación de tipo Bearer token con `VITE_WEBHOOK_SECRET`.
2. **Respuesta del Webhook (Nodo "Respond to Webhook"):**
   - Si en n8n el nodo Webhook tiene la opción **Respond** configurada como `"Immediately"`, n8n responde inmediatamente con `HTTP 200` y cuerpo **vacío (`""`)**. La app ahora detecta esto y muestra una advertencia explicativa indicando que no se devolvieron campos.
   - Para que la extracción de datos funcione automáticamente en pantalla:
     - En el nodo **Webhook** de n8n, cambiar la opción **Respond** a `"Using 'Respond to Webhook' Node"`.
     - Al final del flujo en n8n, agregar un nodo **Respond to Webhook** que devuelva el objeto JSON con las claves de la factura extraída (`cuit_proveedor`, `Razon social` / `supplierName`, `numero_factura`, `fecha_emision`, `importe_sin_iva`, `iva`, `percepciones`, `importe`, `items`).
3. **Manejo de Errores en la App:** Si n8n no devuelve ningún campo o retorna un cuerpo vacío, la app muestra un aviso de advertencia explicando cómo solucionarlo en n8n y habilita la edición/completado manual de los campos de la factura sin engañar al usuario con falsos mensajes de éxito.

