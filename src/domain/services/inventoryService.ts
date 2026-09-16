import { Product, StockMovement, SupplierBill } from '../types';

export function recordStockEntry(
  product: Product,
  quantity: number,
  provider?: string
): { updatedProduct: Product; movement: StockMovement } {
  const numQty = Number(quantity) || 0;
  if (numQty <= 0) {
    throw new Error('La cantidad de entrada debe ser mayor a 0');
  }

  const currentStockNum = Number(product.currentStock) || 0;

  const updatedProduct: Product = {
    ...product,
    currentStock: currentStockNum + numQty
  };

  const movement: StockMovement = {
    id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    productId: product.id,
    productName: product.name,
    type: 'entry',
    quantity: numQty,
    date: new Date().toISOString(),
    provider
  };

  return { updatedProduct, movement };
}

export function recordStockSale(
  product: Product,
  quantity: number
): { updatedProduct: Product; movement: StockMovement } {
  const numQty = Number(quantity) || 0;
  if (numQty <= 0) {
    throw new Error('La cantidad vendida debe ser mayor a 0');
  }

  const currentStockNum = Number(product.currentStock) || 0;

  if (currentStockNum < numQty) {
    throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${currentStockNum}, Requerido: ${numQty}`);
  }

  const updatedProduct: Product = {
    ...product,
    currentStock: currentStockNum - numQty
  };

  const movement: StockMovement = {
    id: 'mov-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    productId: product.id,
    productName: product.name,
    type: 'sale',
    quantity: numQty,
    date: new Date().toISOString()
  };

  return { updatedProduct, movement };
}

export function recordStockAdjustment(
  product: Product,
  newStock: number,
  reasonNote: string
): { updatedProduct: Product; movement: StockMovement } {
  const newStockNum = Number(newStock) || 0;
  if (newStockNum < 0) {
    throw new Error('El stock no puede ser negativo');
  }

  const currentStockNum = Number(product.currentStock) || 0;
  const difference = newStockNum - currentStockNum;

  const updatedProduct: Product = {
    ...product,
    currentStock: newStockNum
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
  return products.filter(p => (Number(p.currentStock) || 0) <= (Number(p.minStock) || 0));
}

export function processStockReceiptFromBill(bill: SupplierBill, products: Product[]): Product[] {
  if (!bill.items || bill.items.length === 0) {
    return products;
  }

  const updatedProducts = [...products];
  const newProductsCreated: Product[] = [];

  for (const item of bill.items) {
    const itemQty = Number(item.quantity) || 0;
    const itemCost = Number(item.unitCost) || 0;
    if (itemQty <= 0) continue;
    
    const cleanItemName = (item.productName || '').trim().toLowerCase();

    // Match by productId if provided, or by trimmed name matching
    const existingIndex = updatedProducts.findIndex(p => 
      (item.productId && p.id === item.productId) || 
      (cleanItemName && p.name.trim().toLowerCase() === cleanItemName)
    );

    if (existingIndex >= 0) {
      const p = updatedProducts[existingIndex];
      const pStock = Number(p.currentStock) || 0;
      const isPriceUpdated = item.updateCatalogPrice && itemCost > 0;
      const nextPrice = isPriceUpdated ? itemCost : p.price;
      const priceLastUpdated = isPriceUpdated ? (bill.date || new Date().toISOString().substring(0, 10)) : p.priceLastUpdated;
      updatedProducts[existingIndex] = {
        ...p,
        currentStock: pStock + itemQty,
        price: nextPrice,
        priceLastUpdated
      };
    } else {
      // Check if we already created a new product in this loop for the same productName
      const newlyCreatedIndex = newProductsCreated.findIndex(p => p.name.toLowerCase() === (item.productName || '').toLowerCase());
      if (newlyCreatedIndex >= 0) {
        const p = newProductsCreated[newlyCreatedIndex];
        const pStock = Number(p.currentStock) || 0;
        const isPriceUpdated = item.updateCatalogPrice && itemCost > 0;
        const nextPrice = isPriceUpdated ? itemCost : p.price;
        const priceLastUpdated = isPriceUpdated ? (bill.date || new Date().toISOString().substring(0, 10)) : p.priceLastUpdated;
        newProductsCreated[newlyCreatedIndex] = {
          ...p,
          currentStock: pStock + itemQty,
          price: nextPrice,
          priceLastUpdated
        };
      } else {
        const newProduct: Product = {
          id: item.productId || ('prod-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4)),
          sku: 'PROD-' + Math.floor(1000 + Math.random() * 9000),
          name: item.productName || 'Producto Nuevo',
          category: 'Insumos Clínicos',
          currentStock: itemQty,
          minStock: 5,
          price: itemCost,
          priceLastUpdated: bill.date || new Date().toISOString().substring(0, 10),
          updateFrequencyDays: 30
        };
        newProductsCreated.push(newProduct);
      }
    }
  }

  return [...updatedProducts, ...newProductsCreated];
}

export function createNewProductRecord(productData: Omit<Product, 'id' | 'sku'> & { sku?: string }): Product {
  if (!productData.name || !productData.name.trim()) {
    throw new Error('El nombre del producto es obligatorio');
  }

  const currentStockNum = Number(productData.currentStock);
  const minStockNum = Number(productData.minStock);
  const priceNum = Number(productData.price);

  return {
    ...productData,
    id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    sku: productData.sku?.trim() || `VET-PRD-${Math.floor(100 + Math.random() * 900)}`,
    name: productData.name.trim(),
    category: productData.category || 'Medicamentos',
    currentStock: isNaN(currentStockNum) || currentStockNum < 0 ? 0 : currentStockNum,
    minStock: isNaN(minStockNum) || minStockNum < 0 ? 0 : minStockNum,
    price: isNaN(priceNum) || priceNum < 0 ? 0 : priceNum,
    barcode: productData.barcode?.trim() || undefined,
    priceLastUpdated: productData.priceLastUpdated || new Date().toISOString().substring(0, 10),
    updateFrequencyDays: productData.updateFrequencyDays || 30
  };
}
