import { BillItem, BillReceipt, DocumentType, PaymentMethod, Product, StockMovement } from '../types';
import { recordStockSale } from './inventoryService';

export function calculateItemSubtotal(unitPrice: number, quantity: number, discountPercent: number = 0): number {
  const gross = unitPrice * quantity;
  const discountAmount = gross * (discountPercent / 100);
  return Number((gross - discountAmount).toFixed(2));
}

export interface BillSummary {
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  total: number;
}

export function calculateBillSummary(items: BillItem[], applyTax: boolean = true): BillSummary {
  let grossSubtotal = 0;
  let discountTotal = 0;

  for (const item of items) {
    const grossItem = item.unitPrice * item.quantity;
    const discountItem = grossItem * (item.discountPercent / 100);
    grossSubtotal += grossItem;
    discountTotal += discountItem;
  }

  const netTotal = grossSubtotal - discountTotal;
  const taxAmount = applyTax ? netTotal * 0.21 : 0;
  const total = netTotal + taxAmount;

  return {
    subtotal: Number(grossSubtotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}

function generateAfipCae(): { cae: string; expirationDate: string } {
  // Mock AFIP SDK CAE generator: 14 digit numeric string
  const cae = '74' + Math.floor(100000000000 + Math.random() * 900000000000).toString();
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + 10);
  const expirationDate = expDate.toISOString().split('T')[0];
  return { cae, expirationDate };
}

export function generateReceiptNumber(docType: DocumentType): string {
  const prefix = docType === 'factura-a' ? 'FC-A' : docType === 'factura-b' ? 'FC-B' : docType === 'factura-c' ? 'FC-C' : 'REM';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-0001-0000${num}`;
}

export interface CheckoutParams {
  patientId?: string;
  patientName?: string;
  ownerName?: string;
  documentType: DocumentType;
  emitAfip: boolean;
  paymentMethod: PaymentMethod;
  items: BillItem[];
  productsCatalog: Product[];
}

export interface CheckoutResult {
  receipt: BillReceipt;
  updatedProducts: Product[];
  stockMovements: StockMovement[];
}

export function processCheckout(params: CheckoutParams): CheckoutResult {
  const {
    patientId,
    patientName,
    ownerName,
    documentType,
    emitAfip,
    paymentMethod,
    items,
    productsCatalog
  } = params;

  if (items.length === 0) {
    throw new Error('No se pueden facturar comprobantes vacíos');
  }

  // 1. Validate and deduct stock for product items
  const updatedProductsMap = new Map<string, Product>();
  productsCatalog.forEach(p => updatedProductsMap.set(p.id, { ...p }));
  const stockMovements: StockMovement[] = [];

  for (const item of items) {
    if (item.type === 'product' && item.referenceId) {
      const existingProduct = updatedProductsMap.get(item.referenceId);
      if (!existingProduct) {
        throw new Error(`Producto no encontrado en inventario: ${item.description}`);
      }

      const { updatedProduct, movement } = recordStockSale(existingProduct, item.quantity);
      updatedProductsMap.set(updatedProduct.id, updatedProduct);
      stockMovements.push(movement);
    }
  }

  // 2. Calculate summary totals
  const applyTax = documentType !== 'remito';
  const summary = calculateBillSummary(items, applyTax);

  // 3. AFIP integration if requested
  let afipCae: string | undefined;
  let afipExpirationDate: string | undefined;

  if (documentType !== 'remito' && emitAfip) {
    const afipData = generateAfipCae();
    afipCae = afipData.cae;
    afipExpirationDate = afipData.expirationDate;
  }

  const receipt: BillReceipt = {
    id: 'receipt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    receiptNumber: generateReceiptNumber(documentType),
    patientId,
    patientName,
    ownerName,
    documentType,
    emitAfip: Boolean(afipCae),
    afipCae,
    afipCaeExpiration: afipExpirationDate,
    paymentMethod,
    items: [...items],
    subtotal: summary.subtotal,
    discountTotal: summary.discountTotal,
    taxAmount: summary.taxAmount,
    total: summary.total,
    totalAmount: summary.total,
    date: new Date().toISOString()
  };

  return {
    receipt,
    updatedProducts: Array.from(updatedProductsMap.values()),
    stockMovements
  };
}
