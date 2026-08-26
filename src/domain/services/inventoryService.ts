import { Product, StockMovement } from '../types';

export function recordStockEntry(
  product: Product,
  quantity: number,
  provider?: string
): { updatedProduct: Product; movement: StockMovement } {
  if (quantity <= 0) {
    throw new Error('La cantidad de entrada debe ser mayor a 0');
  }

  const updatedProduct: Product = {
    ...product,
    currentStock: product.currentStock + quantity
  };

  const movement: StockMovement = {
    id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    productId: product.id,
    productName: product.name,
    type: 'entry',
    quantity,
    date: new Date().toISOString(),
    provider
  };

  return { updatedProduct, movement };
}

export function recordStockSale(
  product: Product,
  quantity: number
): { updatedProduct: Product; movement: StockMovement } {
  if (quantity <= 0) {
    throw new Error('La cantidad vendida debe ser mayor a 0');
  }

  if (product.currentStock < quantity) {
    throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.currentStock}, Requerido: ${quantity}`);
  }

  const updatedProduct: Product = {
    ...product,
    currentStock: product.currentStock - quantity
  };

  const movement: StockMovement = {
    id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    productId: product.id,
    productName: product.name,
    type: 'sale',
    quantity,
    date: new Date().toISOString()
  };

  return { updatedProduct, movement };
}

export function recordStockAdjustment(
  product: Product,
  newStock: number,
  reasonNote: string
): { updatedProduct: Product; movement: StockMovement } {
  if (newStock < 0) {
    throw new Error('El stock no puede ser negativo');
  }

  const difference = newStock - product.currentStock;

  const updatedProduct: Product = {
    ...product,
    currentStock: newStock
  };

  const movement: StockMovement = {
    id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    productId: product.id,
    productName: product.name,
    type: 'adjustment',
    quantity: difference,
    date: new Date().toISOString(),
    reasonNote
  };

  return { updatedProduct, movement };
}

export function findProductByBarcode(products: Product[], barcode: string): Product | undefined {
  if (!barcode.trim()) return undefined;
  return products.find(p => p.barcode === barcode.trim());
}

export function getLowStockAlerts(products: Product[]): Product[] {
  return products.filter(p => p.currentStock <= p.minStock);
}
