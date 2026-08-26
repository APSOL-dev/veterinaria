import React, { useState } from 'react';
import { 
  BillItem, 
  DocumentType, 
  GroomingService, 
  Patient, 
  PaymentMethod, 
  Product 
} from '../../domain/types';
import { calculateBillSummary, calculateItemSubtotal } from '../../domain/services/billingService';

interface StoreBillingViewProps {
  patients: Patient[];
  selectedPatientId?: string;
  products: Product[];
  groomingServices: GroomingService[];
  onCheckout: (checkoutData: {
    patientId?: string;
    patientName?: string;
    ownerName?: string;
    documentType: DocumentType;
    emitAfip: boolean;
    paymentMethod: PaymentMethod;
    items: BillItem[];
  }) => void;
}

export const StoreBillingView: React.FC<StoreBillingViewProps> = ({
  patients,
  selectedPatientId: initialPatientId,
  products,
  groomingServices,
  onCheckout
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    initialPatientId || patients[0]?.id || ''
  );
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Cart Items
  const [cartItems, setCartItems] = useState<BillItem[]>([
    {
      id: 'cart-1',
      type: 'service',
      referenceId: 'srv-consultation',
      description: 'Consulta General',
      categoryDetails: 'Servicio veterinario',
      quantity: 1,
      unitPrice: 3500,
      discountPercent: 0,
      subtotal: 3500
    },
    {
      id: 'cart-2',
      type: 'product',
      referenceId: 'prod-5', // Amoxicilina
      description: 'Antibiótico Amoxicilina 500mg',
      categoryDetails: 'Farmacia - Blister x 10',
      quantity: 2,
      unitPrice: 850,
      discountPercent: 10,
      subtotal: 1530
    },
    {
      id: 'cart-3',
      type: 'service',
      referenceId: 'srv-vacuna',
      description: 'Vacuna Quíntuple',
      categoryDetails: 'Aplicación en consultorio',
      quantity: 1,
      unitPrice: 4200,
      discountPercent: 0,
      subtotal: 4200
    }
  ]);

  // Checkout Config State
  const [documentType, setDocumentType] = useState<DocumentType>('factura-b');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [emitAfip, setEmitAfip] = useState<boolean>(true);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

  // Add Item Form State
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [selectedGroomSrvId, setSelectedGroomSrvId] = useState(groomingServices[0]?.id || '');
  const [customServiceName, setCustomServiceName] = useState('Consulta Médica Especializada');
  const [customServicePrice, setCustomServicePrice] = useState(15000);
  const [addQty, setAddQty] = useState(1);

  // Summary calculations
  const applyTax = documentType !== 'remito';
  const summary = calculateBillSummary(cartItems, applyTax);

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const newQty = Math.max(1, item.quantity + delta);
      return {
        ...item,
        quantity: newQty,
        subtotal: calculateItemSubtotal(item.unitPrice, newQty, item.discountPercent)
      };
    }));
  };

  const handleUpdateDiscount = (itemId: string, discount: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const safeDiscount = Math.min(100, Math.max(0, discount));
      return {
        ...item,
        discountPercent: safeDiscount,
        subtotal: calculateItemSubtotal(item.unitPrice, item.quantity, safeDiscount)
      };
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemType === 'product') {
      const prod = products.find(p => p.id === selectedProductId);
      if (!prod) return;
      const newItem: BillItem = {
        id: 'cart-' + Date.now(),
        type: 'product',
        referenceId: prod.id,
        description: prod.name,
        categoryDetails: `Stock disponible: ${prod.currentStock}`,
        quantity: Number(addQty),
        unitPrice: prod.price,
        discountPercent: 0,
        subtotal: calculateItemSubtotal(prod.price, Number(addQty), 0)
      };
      setCartItems(prev => [...prev, newItem]);
    } else {
      let desc = customServiceName;
      let price = Number(customServicePrice);
      const srv = groomingServices.find(s => s.id === selectedGroomSrvId);
      if (srv) {
        desc = srv.name;
        price = srv.price;
      }
      const newItem: BillItem = {
        id: 'cart-' + Date.now(),
        type: 'service',
        referenceId: 'srv-' + Date.now(),
        description: desc,
        categoryDetails: 'Prestación de Servicio',
        quantity: Number(addQty),
        unitPrice: price,
        discountPercent: 0,
        subtotal: calculateItemSubtotal(price, Number(addQty), 0)
      };
      setCartItems(prev => [...prev, newItem]);
    }
    setShowAddItemModal(false);
  };

  const handleConfirmCheckout = () => {
    if (cartItems.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    try {
      onCheckout({
        patientId: selectedPatient?.id,
        patientName: selectedPatient?.name,
        ownerName: selectedPatient?.ownerName,
        documentType,
        emitAfip: documentType !== 'remito' ? emitAfip : false,
        paymentMethod,
        items: cartItems
      });
      alert(`¡Cobro emitido con éxito! Comprobante: ${documentType.toUpperCase()}`);
    } catch (err: any) {
      alert(`Error al emitir cobro: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col w-full h-full gap-md">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-[22px] text-on-surface leading-tight">Nueva Facturación y Tienda (POS)</h1>
          <p className="font-body-lg text-xs text-on-surface-variant flex items-center gap-xs mt-0.5">
            <span className="material-symbols-outlined text-[16px]">pets</span>
            Paciente seleccionado: 
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="ml-2 bg-surface-container border-none rounded-lg py-0.5 px-2 text-primary font-bold outline-none text-xs cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species} • Dueño: {p.ownerName})</option>
              ))}
            </select>
          </p>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
        {/* Left Section: Bill Items (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-md">
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex flex-col h-full overflow-hidden">
            <div className="p-md px-lg flex items-center justify-between border-b border-surface-variant">
              <h2 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  list_alt
                </span>
                Detalle de Conceptos (Servicios + Productos)
              </h2>
              <button
                onClick={() => setShowAddItemModal(true)}
                className="px-md py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-all font-label-md text-xs flex items-center gap-xs shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Agregar Ítem
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left font-body-md text-xs">
                <thead className="bg-surface-container text-on-surface-variant font-label-sm uppercase tracking-wider text-[10px] sticky top-0">
                  <tr>
                    <th className="p-sm px-md font-medium">Descripción</th>
                    <th className="p-sm px-md font-medium text-center w-24">Cant.</th>
                    <th className="p-sm px-md font-medium text-right w-28">Precio Unit.</th>
                    <th className="p-sm px-md font-medium text-center w-20">Desc. %</th>
                    <th className="p-sm px-md font-medium text-right w-28">Subtotal</th>
                    <th className="p-sm px-md font-medium text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-lg text-center text-on-surface-variant text-xs">
                        No hay ítems agregados al cobro. Haz clic en "Agregar Ítem".
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item) => (
                      <tr key={item.id} className="hover:bg-surface/50 transition-colors group border-b border-surface-container-low">
                        <td className="p-sm px-md">
                          <div className="flex flex-col">
                            <span className="font-semibold text-primary">{item.description}</span>
                            <span className="text-on-surface-variant text-[11px]">{item.categoryDetails || item.type}</span>
                          </div>
                        </td>
                        <td className="p-sm px-md text-center">
                          <div className="flex items-center justify-center gap-xs">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              className="w-5 h-5 rounded bg-surface-container text-on-surface flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors"
                            >
                              <span className="material-symbols-outlined text-[12px]">remove</span>
                            </button>
                            <span className="w-6 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              className="w-5 h-5 rounded bg-surface-container text-on-surface flex items-center justify-center hover:bg-primary-container hover:text-on-primary-container transition-colors"
                            >
                              <span className="material-symbols-outlined text-[12px]">add</span>
                            </button>
                          </div>
                        </td>
                        <td className="p-sm px-md text-right font-medium">${item.unitPrice.toLocaleString('es-AR')}</td>
                        <td className="p-sm px-md text-center">
                          <input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) => handleUpdateDiscount(item.id, Number(e.target.value))}
                            min={0}
                            max={100}
                            className="w-10 text-center bg-surface-container border-none rounded py-0.5 text-on-surface focus:ring-2 focus:ring-primary outline-none transition-all text-xs"
                          />
                        </td>
                        <td className="p-sm px-md text-right font-semibold text-primary">
                          ${(item.subtotal || 0).toLocaleString('es-AR')}
                        </td>
                        <td className="p-sm px-md text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-outline hover:text-error transition-colors p-0.5 rounded-full hover:bg-error-container"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section: Summary & Payment Config (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-md">
          {/* Summary Card */}
          <div className="bg-primary text-on-primary rounded-2xl p-md shadow-sm relative overflow-hidden">
            <h3 className="font-label-md uppercase tracking-wider text-on-primary/70 mb-xs text-[10px]">Resumen de Cuenta</h3>
            <div className="space-y-xs relative z-10 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-on-primary/80">Subtotal</span>
                <span>${summary.subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-on-primary/80">Descuentos</span>
                <span className="text-error-container">-${summary.discountTotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-center pb-xs border-b border-white/20">
                <span className="text-on-primary/80">Impuestos (IVA 21%)</span>
                <span>${summary.taxAmount.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between items-end pt-xs">
                <span className="font-headline-sm text-sm">Total</span>
                <span className="font-display-lg text-2xl font-bold">${summary.total.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* Checkout Settings */}
          <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-md">
            <div className="space-y-sm text-xs">
              <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-secondary text-[18px]">settings_suggest</span>
                Configuración de Cobro
              </h3>

              {/* Document Type */}
              <div className="flex flex-col gap-0.5">
                <label className="font-label-md text-on-surface-variant uppercase text-[10px]">Tipo de Comprobante</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="w-full bg-surface-container hover:bg-surface-variant border-none rounded-xl py-2 px-3 text-on-surface font-body-md text-xs focus:ring-2 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value="factura-b">Factura B (Consumidor Final)</option>
                  <option value="factura-a">Factura A (Responsable Inscripto)</option>
                  <option value="factura-c">Factura C</option>
                  <option value="remito">Remito Interno (Sin valor fiscal)</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-0.5">
                <label className="font-label-md text-on-surface-variant uppercase text-[10px]">Método de Pago</label>
                <div className="grid grid-cols-2 gap-xs">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('efectivo')}
                    className={`flex flex-col items-center justify-center p-sm rounded-xl border transition-all ${
                      paymentMethod === 'efectivo'
                        ? 'border-primary bg-primary-container text-on-primary-container font-bold'
                        : 'border-transparent bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined mb-0.5 text-[20px]">payments</span>
                    <span className="font-label-md text-xs">Efectivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('tarjeta')}
                    className={`flex flex-col items-center justify-center p-sm rounded-xl border transition-all ${
                      paymentMethod === 'tarjeta'
                        ? 'border-primary bg-primary-container text-on-primary-container font-bold'
                        : 'border-transparent bg-surface-container text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined mb-0.5 text-[20px]">credit_card</span>
                    <span className="font-label-md text-xs">Tarjeta</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirmCheckout}
              className="w-full py-2.5 rounded-xl bg-secondary text-on-secondary hover:bg-primary transition-all font-headline-md text-sm flex items-center justify-center gap-xs shadow-sm font-bold"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Confirmar y Emitir Cobro
            </button>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-bold">Agregar Ítem al Carrito</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="flex flex-col gap-xs text-xs">
              <div className="flex gap-xs mb-xs">
                <button
                  type="button"
                  onClick={() => setItemType('product')}
                  className={`flex-1 py-1.5 rounded-xl font-label-md border text-xs flex items-center justify-center gap-1 ${
                    itemType === 'product' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                  Producto (Pet Shop)
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('service')}
                  className={`flex-1 py-1.5 rounded-xl font-label-md border text-xs flex items-center justify-center gap-1 ${
                    itemType === 'service' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container text-on-surface border-transparent'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">medical_services</span>
                  Prestación de Servicio
                </button>
              </div>

              {itemType === 'product' ? (
                <>
                  <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Seleccionar Producto</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ${p.price} (Stock: {p.currentStock})
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Servicios</label>
                  <select
                    value={selectedGroomSrvId}
                    onChange={(e) => setSelectedGroomSrvId(e.target.value)}
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  >
                    {groomingServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — ${s.price}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Cantidad</label>
              <input
                type="number"
                value={addQty}
                onChange={(e) => setAddQty(Number(e.target.value))}
                min={1}
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />

              <button type="submit" className="bg-primary text-on-primary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container">
                Agregar al Cobro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
