import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  sendInvoiceWebhook, 
  INVOICE_WEBHOOK_URL,
  parseN8nInvoiceResponse 
} from './webhookService';
import { SupplierBill } from '../types';

describe('webhookService', () => {
  const mockBill: Omit<SupplierBill, 'id'> = {
    supplierName: 'Distribuidora FarmaVet SA',
    cuit: '30-71234567-8',
    razonSocial: 'FarmaVet S.A.',
    documentType: 'Factura A',
    invoiceNumber: '0001-00045612',
    date: '2026-08-27',
    subtotal: 100000,
    taxAmount: 21000,
    perceptions: 5000,
    currency: 'AR$ (Pesos)',
    amount: 126000,
    itemsCount: 1,
    status: 'pending'
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (header: string) => header.toLowerCase() === 'content-type' ? 'application/json' : null
      },
      json: async () => ({ status: 'success', message: 'Invoice received' }),
      text: async () => 'OK'
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('INVOICE_WEBHOOK_URL should match specified endpoint', () => {
    expect(INVOICE_WEBHOOK_URL).toBe('https://bots.apsol-consultora.com.ar/webhook/0ca257f9-31f1-4639-ba17-b096d1c95a66');
  });

  it('sendInvoiceWebhook should post JSON data successfully', async () => {
    const result = await sendInvoiceWebhook({ bill: mockBill });

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      INVOICE_WEBHOOK_URL,
      expect.objectContaining({
        method: 'POST'
      })
    );
  });

  it('sendInvoiceWebhook should send FormData when file is provided', async () => {
    const fakeFile = new File(['dummy content'], 'factura.pdf', { type: 'application/pdf' });
    const result = await sendInvoiceWebhook({ bill: mockBill, file: fakeFile });

    expect(result.success).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });

  it('sendInvoiceWebhook should handle network failure gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await sendInvoiceWebhook({ bill: mockBill });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });

  it('sendInvoiceWebhook should fallback to GET if endpoint returns POST method error', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify({ code: 404, message: 'This webhook is not registered for POST requests. Did you mean to make a GET request?' }),
        json: async () => ({ code: 404, message: 'This webhook is not registered for POST requests. Did you mean to make a GET request?' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => 'application/json' },
        text: async () => 'OK',
        json: async () => ({ status: 'success' })
      });

    vi.stubGlobal('fetch', fetchMock);

    const result = await sendInvoiceWebhook({ bill: mockBill });

    expect(result.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].method).toBe('GET');
  });

  it('parseN8nInvoiceResponse should parse extracted invoice fields from n8n response', () => {
    const rawN8nResponse = {
      supplierName: 'Distribuidora FarmaVet SA',
      cuit: '30-71234567-8',
      razonSocial: 'FarmaVet S.A.',
      invoiceNumber: '0001-00045612',
      subtotal: 123966.94,
      taxAmount: 26033.06,
      totalAmount: 150000
    };

    const parsed = parseN8nInvoiceResponse(rawN8nResponse);

    expect(parsed.supplierName).toBe('Distribuidora FarmaVet SA');
    expect(parsed.cuit).toBe('30-71234567-8');
    expect(parsed.razonSocial).toBe('FarmaVet S.A.');
    expect(parsed.invoiceNumber).toBe('0001-00045612');
    expect(parsed.amount).toBe(150000);
  });

  it('parseN8nInvoiceResponse should parse exact webhook payload fields (fecha_emision, importe_sin_iva, iva, percepciones, etc)', () => {
    const webhookOutput = {
      success: true,
      cuit_proveedor: '30-71234567-8',
      tipo_factura: 'A',
      punto_venta: 106,
      numero_factura: 960024,
      fecha_emision: '2026-06-18',
      fecha_vencimiento: '2026-07-03',
      orden_compra: null,
      importe_sin_iva: 360326.84,
      iva: 21924,
      percepciones: 2610,
      tipo_cambio: 0,
      importe: 384860.84,
      moneda: 'ARS',
      descripcion: 'Extracción automática de datos'
    };

    const parsed = parseN8nInvoiceResponse(webhookOutput);

    expect(parsed.cuit).toBe('30-71234567-8');
    expect(parsed.documentType).toBe('Factura A');
    expect(parsed.invoiceNumber).toBe('0106-00960024');
    expect(parsed.date).toBe('2026-06-18');
    expect(parsed.subtotal).toBe(360326.84);
    expect(parsed.taxAmount).toBe(21924);
    expect(parsed.perceptions).toBe(2610);
    expect(parsed.amount).toBe(384860.84);
    expect(parsed.currency).toBe('AR$ (Pesos)');
  });

  it('parseN8nInvoiceResponse should map "Razon social" to supplierName', () => {
    const webhookOutputWithRazonSocial = {
      success: true,
      'Razon social': 'FEDERAL EXPRESS CORP.',
      cuit_proveedor: '30594494187',
      tipo_factura: 'A',
      punto_venta: 106,
      numero_factura: 960024,
      fecha_emision: '2026-06-18',
      importe_sin_iva: 360326.84,
      iva: 21924,
      percepciones: 2610,
      importe: 384860.84,
      moneda: 'ARS'
    };

    const parsed = parseN8nInvoiceResponse(webhookOutputWithRazonSocial);

    expect(parsed.supplierName).toBe('FEDERAL EXPRESS CORP.');
    expect(parsed.cuit).toBe('30594494187');
  });
});
