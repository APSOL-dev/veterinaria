## Integración Webhook para Carga de Facturas

**Qué hace:** 
Conecta la app VETSOFT con el flujo n8n en el servidor externo vía HTTP POST y/o GET automático a la URL provista.

**URL del Webhook Configurada:**
`https://bots.apsol-consultora.com.ar/webhook/0ca257f9-31f1-4639-ba17-b096d1c95a66`

**Diagnóstico del Webhook Externo (n8n):**
1. **Método HTTP:** El nodo de Webhook en n8n está configurado por defecto para escuchar peticiones **`HTTP Method: GET`**.
2. **Respuesta del Servidor:** Al recibir peticiones `POST`, n8n responde `{"code":404, "message": "This webhook is not registered for POST requests. Did you mean to make a GET request?"}`.
3. **Estrategia Dual (Auto-Fallback):** La aplicación intenta el despacho por `POST` (con `FormData` o `JSON`). Si n8n rechaza la solicitud POST solicitando `GET`, la app automáticamente conmuta a petición **`GET`** enviando los parámetros de la factura mediante Query String (`supplierName`, `cuit`, `razonSocial`, `invoiceNumber`, `amount`, `date`, `subtotal`, `taxAmount`, etc.).

**Recomendación de configuración en n8n:**
- En n8n, dentro del nodo Webhook, cambiar **HTTP Method** a **`POST`** (o **`GET / POST`**) si se requiere procesar el archivo físico adjunto (PDF/Imagen) vía `FormData`.
- Si se mantiene en **`GET`**, la app envía automáticamente todos los datos estructurados mediante Query Parameters.
