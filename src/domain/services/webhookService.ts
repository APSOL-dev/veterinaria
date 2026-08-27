import { SupplierBill } from '../types';

export const INVOICE_WEBHOOK_URL = 'https://bots.apsol-consultora.com.ar/webhook/0ca257f9-31f1-4639-ba17-b096d1c95a66';

export interface SendInvoiceWebhookInput {
  bill: Omit<SupplierBill, 'id'> | SupplierBill;
  file?: File | null;
  customWebhookUrl?: string;
}

export interface WebhookResult {
  success: boolean;
  data?: any;
  error?: string;
}

export async function sendInvoiceWebhook(input: SendInvoiceWebhookInput): Promise<WebhookResult> {
  const url = input.customWebhookUrl || INVOICE_WEBHOOK_URL;

  try {
    let body: BodyInit;
    let headers: Record<string, string> = {};

    if (input.file) {
      const formData = new FormData();
      formData.append('file', input.file, input.file.name);
      formData.append('supplierName', input.bill.supplierName || '');
      formData.append('cuit', input.bill.cuit || '');
      formData.append('razonSocial', input.bill.razonSocial || '');
      formData.append('documentType', input.bill.documentType || '');
      formData.append('invoiceNumber', input.bill.invoiceNumber || '');
      formData.append('date', input.bill.date || '');
      formData.append('subtotal', String(input.bill.subtotal || 0));
      formData.append('taxAmount', String(input.bill.taxAmount || 0));
      formData.append('perceptions', String(input.bill.perceptions || 0));
      formData.append('currency', input.bill.currency || 'AR$ (Pesos)');
      formData.append('amount', String(input.bill.amount || 0));
      formData.append('status', input.bill.status || 'pending');

      body = formData;
    } else {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        event: 'invoice_created',
        timestamp: new Date().toISOString(),
        bill: input.bill
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      keepalive: true
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      
      // If endpoint indicates POST is not registered and GET is expected, fallback to GET with query params
      if (text.includes('GET request') || response.status === 404) {
        const queryParams = new URLSearchParams({
          supplierName: input.bill.supplierName || '',
          cuit: input.bill.cuit || '',
          razonSocial: input.bill.razonSocial || '',
          documentType: input.bill.documentType || '',
          invoiceNumber: input.bill.invoiceNumber || '',
          date: input.bill.date || '',
          subtotal: String(input.bill.subtotal || 0),
          taxAmount: String(input.bill.taxAmount || 0),
          perceptions: String(input.bill.perceptions || 0),
          currency: input.bill.currency || 'AR$ (Pesos)',
          amount: String(input.bill.amount || 0),
          status: input.bill.status || 'pending',
          fileName: input.file ? input.file.name : ''
        });

        const getUrl = `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`;
        const getResponse = await fetch(getUrl, {
          method: 'GET',
          keepalive: true
        });

        let getResponseData: any;
        const getContentType = getResponse.headers && typeof getResponse.headers.get === 'function' ? getResponse.headers.get('content-type') : null;
        if (getContentType && getContentType.includes('application/json')) {
          getResponseData = await getResponse.json().catch(() => null);
        } else {
          getResponseData = await getResponse.text().catch(() => null);
        }

        return {
          success: getResponse.ok || getResponse.status < 500, // n8n workflow triggers even if respond node is unconfigured
          data: getResponseData
        };
      }

      return {
        success: false,
        error: `HTTP Error ${response.status}: ${text || response.statusText}`
      };
    }

    let responseData: any;
    const contentType = response.headers && typeof response.headers.get === 'function' ? response.headers.get('content-type') : null;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json().catch(() => null);
    } else {
      responseData = await response.text().catch(() => null);
    }

    return {
      success: true,
      data: responseData
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Falló la conexión con el servidor del Webhook'
    };
  }
}

export function parseN8nInvoiceResponse(data: any): Partial<SupplierBill> {
  if (!data) return {};

  let payload = data;
  if (Array.isArray(data) && data.length > 0) {
    payload = data[0];
  }

  payload = payload.data || payload.body || payload.json || payload;
  if (Array.isArray(payload) && payload.length > 0) {
    payload = payload[0];
  }

  if (typeof payload !== 'object' || !payload) return {};

  // Document Type mapping
  let documentType: string | undefined = undefined;
  if (payload.tipo_factura) {
    const rawType = String(payload.tipo_factura).trim();
    if (rawType.startsWith('Factura')) {
      documentType = rawType;
    } else {
      documentType = `Factura ${rawType.toUpperCase()}`;
    }
  } else if (payload.documentType) {
    documentType = payload.documentType;
  }

  // Invoice Number formatting (punto_venta + numero_factura)
  let invoiceNumber: string | undefined = undefined;
  if (payload.numero_factura !== undefined && payload.numero_factura !== null) {
    const pv = payload.punto_venta !== undefined && payload.punto_venta !== null ? String(payload.punto_venta).padStart(4, '0') : '0001';
    const num = String(payload.numero_factura).padStart(8, '0');
    invoiceNumber = `${pv}-${num}`;
  } else if (payload.invoiceNumber || payload.nro_factura) {
    invoiceNumber = String(payload.invoiceNumber || payload.nro_factura);
  }

  // Currency mapping
  let currency: string | undefined = undefined;
  if (payload.moneda) {
    const rawCurr = String(payload.moneda).toUpperCase();
    if (rawCurr.includes('ARS') || rawCurr.includes('PESO')) {
      currency = 'AR$ (Pesos)';
    } else if (rawCurr.includes('USD') || rawCurr.includes('DOLAR')) {
      currency = 'USD (Dólares)';
    } else {
      currency = payload.moneda;
    }
  } else if (payload.currency) {
    currency = payload.currency;
  }

  // Numeric helpers
  const parseNum = (val: any): number | undefined => {
    if (val === undefined || val === null) return undefined;
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(num) ? undefined : num;
  };

  const extractedSupplier = payload['Razon social'] || payload.supplierName || payload.proveedor || payload.nombre_proveedor || payload.razon_social || payload.razonSocial || undefined;
  const extractedCuit = payload['Cuit proveedor'] || payload.cuit || payload.cuit_proveedor || payload.cuitProveedor || undefined;
  const extractedRazonSocial = payload['Razon social'] || payload.razon_social || payload.razonSocial || extractedSupplier;

  return {
    supplierName: extractedSupplier,
    cuit: extractedCuit,
    razonSocial: extractedRazonSocial,
    documentType,
    invoiceNumber,
    date: payload.fecha_emision || payload.date || payload.fecha || undefined,
    paymentDate: payload.fecha_vencimiento || payload.fecha_pago || payload.paymentDate || undefined,
    subtotal: parseNum(payload.importe_sin_iva ?? payload.subtotal),
    taxAmount: parseNum(payload.iva ?? payload.taxAmount ?? payload.tax_amount),
    perceptions: parseNum(payload.percepciones ?? payload.perceptions),
    currency,
    amount: parseNum(payload.importe ?? payload.totalAmount ?? payload.amount ?? payload.total)
  };
}
