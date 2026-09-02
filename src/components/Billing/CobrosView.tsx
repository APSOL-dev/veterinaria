import React, { useState, useEffect } from 'react';
import { Patient, BillReceipt, DocumentType, PaymentMethod, BillItem, Product, ServiceCatalogItem } from '../../domain/types';
import { AppNotificationModal } from '../Common/AppNotificationModal';

interface CobrosViewProps {
  patients: Patient[];
  selectedPatient: Patient;
  receipts: BillReceipt[];
  activeSubmodule?: string;
  initialItems?: BillItem[];
  products?: Product[];
  servicesCatalog?: ServiceCatalogItem[];
  onCheckout: (data: {
    documentType: DocumentType;
    paymentMethod: PaymentMethod;
    isAfip: boolean;
    applyTax?: boolean;
    taxRate?: number;
    items: BillItem[];
    patientId: string;
  }) => void;
  onNavigateToHistorial?: () => void;
}

export const CobrosView: React.FC<CobrosViewProps> = ({
  patients,
  selectedPatient,
  receipts,
  activeSubmodule = 'nueva-facturacion',
  initialItems,
  products = [],
  servicesCatalog = [],
  onCheckout,
  onNavigateToHistorial
}) => {
  const [targetPatientId, setTargetPatientId] = useState<string>(selectedPatient.id);
  const currentPatient = patients.find(p => p.id === targetPatientId) || selectedPatient;

  // Sync selected patient if changed externally (e.g. from calendar navigation)
  useEffect(() => {
    setTargetPatientId(selectedPatient.id);
  }, [selectedPatient.id]);

  // Bill items state: starts empty unless initialItems were passed from calendar
  const [items, setItems] = useState<BillItem[]>(initialItems || []);

  useEffect(() => {
    if (initialItems) {
      setItems(initialItems);
    }
  }, [initialItems]);

  // Settings state: Default to Factura C
  const [documentType, setDocumentType] = useState<DocumentType>('factura-c');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [isAfip, setIsAfip] = useState(true);
  const [applyTax, setApplyTax] = useState(false);
  const [taxPercent, setTaxPercent] = useState(21);

  // Modal Add Item state with Catalog Selection
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemType, setItemType] = useState<'servicio' | 'producto'>('servicio');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCat, setNewItemCat] = useState('');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);

  // Math Calculations
  const rawSubtotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const totalDiscounts = items.reduce((acc, item) => {
    const itemSub = item.unitPrice * item.quantity;
    return acc + (itemSub * (item.discountPercent / 100));
  }, 0);

  const subtotalAfterDiscount = rawSubtotal - totalDiscounts;
  const taxAmount = applyTax ? subtotalAfterDiscount * (taxPercent / 100) : 0;
  const totalAmount = subtotalAfterDiscount + taxAmount;

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleUpdatePrice = (id: string, priceStr: string) => {
    const price = Math.max(0, Number(priceStr) || 0);
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, unitPrice: price };
      }
      return item;
    }));
  };

  const handleUpdateDiscount = (id: string, percentStr: string) => {
    const percent = Math.min(100, Math.max(0, Number(percentStr) || 0));
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, discountPercent: percent };
      }
      return item;
    }));
  };

  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Dynamic Categories from Catalogs
  const availableServiceCategories = Array.from(new Set(servicesCatalog.map(s => s.category)));
  const availableProductCategories = Array.from(new Set(products.map(p => p.category)));

  // Available Items in selected type and category
  const availableCatalogItems = itemType === 'servicio'
    ? servicesCatalog.filter(s => s.isActive && (!selectedCategoryFilter || s.category === selectedCategoryFilter))
    : products.filter(p => !selectedCategoryFilter || p.category === selectedCategoryFilter);

  const handleSelectCatalogItem = (itemId: string) => {
    setSelectedCatalogItemId(itemId);
    if (itemType === 'servicio') {
      const s = servicesCatalog.find(item => item.id === itemId);
      if (s) {
        setNewItemDesc(s.name);
        setNewItemCat(`Servicio (${s.category})`);
        setNewItemPrice(s.price);
      }
    } else {
      const p = products.find(item => item.id === itemId);
      if (p) {
        setNewItemDesc(p.name);
        setNewItemCat(`Producto (${p.category})`);
        setNewItemPrice(p.price);
      }
    }
  };

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;

    const newItem: BillItem = {
      id: Date.now().toString(),
      description: newItemDesc.trim(),
      category: newItemCat || (itemType === 'servicio' ? 'Servicio General' : 'Producto General'),
      quantity: 1,
      unitPrice: Number(newItemPrice),
      discountPercent: 0
    };

    setItems(prev => [...prev, newItem]);
    setNewItemDesc('');
    setSelectedCatalogItemId('');
    setShowAddItemModal(false);
  };

  const [notifModal, setNotifModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const handleConfirmCheckout = () => {
    if (items.length === 0) {
      setNotifModal({
        isOpen: true,
        message: 'Debe agregar al menos un concepto para emitir el cobro.'
      });
      return;
    }

    onCheckout({
      documentType,
      paymentMethod,
      isAfip,
      applyTax,
      taxRate: taxPercent,
      items,
      patientId: currentPatient.id
    });

    setItems([]);
    if (onNavigateToHistorial) {
      onNavigateToHistorial();
    }
  };

  if (activeSubmodule === 'historial-cobros') {
    return (
      <div className="flex flex-col w-full gap-md font-body-md text-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display-lg text-[22px] text-slate-900 font-bold leading-tight">
              Cobros — Historial de Comprobantes
            </h1>
            <p className="font-body-md text-xs text-slate-600 font-medium">
              Registro de cobros emitidos y comprobantes digitales
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex-1 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="p-sm px-md">Comprobante Nº</th>
                  <th className="p-sm px-md">Fecha</th>
                  <th className="p-sm px-md">Paciente / dueño</th>
                  <th className="p-sm px-md">Tipo doc</th>
                  <th className="p-sm px-md">Medio pago</th>
                  <th className="p-sm px-md text-right">Total</th>
                  <th className="p-sm px-md text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-lg text-center text-slate-500 text-xs font-medium">
                      No hay cobros registrados en el historial.
                    </td>
                  </tr>
                ) : (
                  receipts.map((rec) => (
                    <tr key={rec.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-sm px-md font-medium text-slate-900">{rec.receiptNumber}</td>
                      <td className="p-sm px-md text-slate-700">{new Date(rec.date).toLocaleDateString('es-AR')}</td>
                      <td className="p-sm px-md font-normal text-slate-800">{rec.patientName} ({rec.ownerName})</td>
                      <td className="p-sm px-md font-semibold text-[#5C3C7B]">{rec.documentType}</td>
                      <td className="p-sm px-md capitalize text-slate-800">{rec.paymentMethod}</td>
                      <td className="p-sm px-md text-right font-semibold text-slate-900">$ {rec.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-sm px-md text-center">
                        <button
                          onClick={() => window.print()}
                          className="bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">print</span>
                          PDF
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
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-md font-body-md text-slate-800 overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0 mb-md">
        <div>
          <h1 className="font-display-lg text-[22px] text-slate-900 font-semibold leading-tight">Cobros — Nueva facturación</h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            Paciente seleccionado: <strong className="text-slate-900 font-semibold">{currentPatient.name}</strong> ({currentPatient.species}, {currentPatient.breed} • Dueño: {currentPatient.ownerName})
          </p>
        </div>

        <div className="flex items-center gap-sm">
          {/* Patient Selector */}
          <div className="flex items-center gap-xs bg-slate-50 p-xs px-sm rounded-xl border border-slate-300">
            <label className="font-label-sm text-slate-700 text-[11px] font-medium">Cambiar paciente:</label>
            <select
              value={targetPatientId}
              onChange={(e) => setTargetPatientId(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold text-xs outline-none cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species} - {p.ownerName})</option>
              ))}
            </select>
          </div>

          {onNavigateToHistorial && (
            <button
              onClick={onNavigateToHistorial}
              className="px-4 py-2 rounded-xl bg-purple-50 text-[#5C3C7B] border border-purple-200 hover:bg-purple-100 transition-colors font-label-md text-xs flex items-center gap-1.5 font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              <span>Historial</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: POS Left + Summary Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md flex-1 overflow-hidden">
        {/* Left Section: Bill Items (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-md h-full overflow-hidden">
          <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-sm mb-sm shrink-0">
              <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">receipt_long</span>
                Conceptos a facturar
              </h2>

              <button
                type="button"
                onClick={() => setShowAddItemModal(true)}
                className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2 rounded-xl font-label-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Agregar ítem</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-y-auto relative z-10">
              <table className="w-full text-left font-body-md text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-sm px-md">Descripción</th>
                    <th className="p-sm px-md text-center w-24">Cant.</th>
                    <th className="p-sm px-md text-right w-32">Precio unit.</th>
                    <th className="p-sm px-md text-center w-24">Desc. %</th>
                    <th className="p-sm px-md text-right w-32">Subtotal</th>
                    <th className="p-sm px-md text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-xl text-center text-slate-500 text-xs font-medium">
                        No hay conceptos agregados a la factura. Utilice el botón "Agregar ítem" para añadir servicios o productos.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const itemSub = item.unitPrice * item.quantity;
                      const itemSubAfterDesc = itemSub * (1 - item.discountPercent / 100);

                      return (
                        <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors group">
                          <td className="p-sm px-md">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 text-xs">{item.description}</span>
                              <span className="text-slate-500 text-[11px] font-medium">{item.category}</span>
                            </div>
                          </td>
                          <td className="p-sm px-md text-center">
                            <div className="flex items-center justify-center gap-xs">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[12px]">remove</span>
                              </button>
                              <span className="w-6 text-center font-semibold text-xs text-slate-900">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[12px]">add</span>
                              </button>
                            </div>
                          </td>
                          <td className="p-sm px-md text-right font-normal text-slate-800 text-xs">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-slate-400 font-semibold text-xs">$</span>
                              <input
                                type="number"
                                min={0}
                                step={100}
                                value={item.unitPrice}
                                onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                                className="w-24 text-right bg-white border border-slate-300 rounded py-0.5 px-1.5 text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-[#9A7DB8] outline-none shadow-xs"
                              />
                            </div>
                          </td>
                          <td className="p-sm px-md text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discountPercent}
                              onChange={(e) => handleUpdateDiscount(item.id, e.target.value)}
                              className="w-12 text-center bg-white border border-slate-300 rounded py-0.5 text-slate-900 font-semibold text-xs focus:ring-2 focus:ring-[#9A7DB8] outline-none"
                            />
                          </td>
                          <td className="p-sm px-md text-right font-semibold text-slate-900 text-xs">
                            $ {itemSubAfterDesc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-sm px-md text-center">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 rounded-full hover:bg-red-50 cursor-pointer"
                              title="Eliminar concepto"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Section: Summary & Payment Settings (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-md h-full overflow-y-auto">
          {/* Summary Card */}
          <div className="bg-[#9A7DB8] text-white rounded-2xl p-md shadow-md relative overflow-hidden shrink-0">
            <h3 className="font-label-md text-purple-100 text-xs mb-xs font-semibold">
              Resumen de cuenta
            </h3>
            <div className="space-y-xs text-xs relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-purple-100">Subtotal bruto</span>
                <span className="font-medium">$ {rawSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-purple-200">
                <span>Descuentos aplicados</span>
                <span>-$ {totalDiscounts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-xs border-b border-purple-300/40">
                <span className="text-purple-100">
                  Impuestos {applyTax ? `(IVA ${taxPercent}%)` : '(Sin IVA)'}
                </span>
                <span className="font-medium">$ {taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end pt-xs">
                <span className="font-headline-sm text-sm font-semibold">Total a cobrar</span>
                <span className="font-display-lg text-2xl font-semibold text-white">
                  $ {totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Configuración de Cobro Card */}
          <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex-1 flex flex-col justify-between text-xs">
            <div className="flex flex-col gap-md">
              <h3 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs border-b border-slate-200 pb-xs">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">settings_suggest</span>
                Configuración de cobro
              </h3>

              {/* Document Type */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-slate-700 text-[11px] font-medium">
                  Tipo de comprobante
                </label>
                <select
                  value={documentType}
                  onChange={(e) => {
                    const newDoc = e.target.value as DocumentType;
                    setDocumentType(newDoc);
                    if (newDoc === 'factura-c' || newDoc === 'remito') {
                      setApplyTax(false);
                    } else {
                      setApplyTax(true);
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2 px-md text-slate-900 font-semibold text-xs outline-none focus:ring-2 focus:ring-[#9A7DB8] cursor-pointer"
                >
                  <option value="factura-b">Factura B (Consumidor final)</option>
                  <option value="factura-a">Factura A (Responsable inscripto)</option>
                  <option value="factura-c">Factura C</option>
                  <option value="remito">Remito interno (Sin valor fiscal)</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-slate-700 text-[11px] font-medium">
                  Método de pago
                </label>
                <div className="grid grid-cols-2 gap-xs">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="efectivo"
                      checked={paymentMethod === 'efectivo'}
                      onChange={() => setPaymentMethod('efectivo')}
                      className="peer sr-only"
                    />
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border-2 border-slate-200 peer-checked:border-[#9A7DB8] peer-checked:bg-purple-50 peer-checked:text-[#5C3C7B] transition-all">
                      <span className="material-symbols-outlined text-[20px] mb-0.5">payments</span>
                      <span className="font-label-md text-[10px] font-bold">Efectivo</span>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="tarjeta"
                      checked={paymentMethod === 'tarjeta'}
                      onChange={() => setPaymentMethod('tarjeta')}
                      className="peer sr-only"
                    />
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border-2 border-slate-200 peer-checked:border-[#9A7DB8] peer-checked:bg-purple-50 peer-checked:text-[#5C3C7B] transition-all">
                      <span className="material-symbols-outlined text-[20px] mb-0.5">credit_card</span>
                      <span className="font-label-md text-[10px] font-bold">Tarjeta</span>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="transferencia"
                      checked={paymentMethod === 'transferencia'}
                      onChange={() => setPaymentMethod('transferencia')}
                      className="peer sr-only"
                    />
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border-2 border-slate-200 peer-checked:border-[#9A7DB8] peer-checked:bg-purple-50 peer-checked:text-[#5C3C7B] transition-all">
                      <span className="material-symbols-outlined text-[20px] mb-0.5">account_balance</span>
                      <span className="font-label-md text-[10px] font-bold">Transferencia</span>
                    </div>
                  </label>

                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cuenta-corriente"
                      checked={paymentMethod === 'cuenta-corriente'}
                      onChange={() => setPaymentMethod('cuenta-corriente')}
                      className="peer sr-only"
                    />
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#FAF5FF] border-2 border-purple-200 peer-checked:border-[#5C3C7B] peer-checked:bg-[#5C3C7B] peer-checked:text-white transition-all text-[#5C3C7B]">
                      <span className="material-symbols-outlined text-[20px] mb-0.5">account_balance_wallet</span>
                      <span className="font-label-md text-[10px] font-bold text-center leading-tight">Cuenta Corriente</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Configuración de IVA */}
              <div className="pt-xs border-t border-slate-200 flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-xs cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={applyTax}
                      onChange={(e) => setApplyTax(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#9A7DB8] focus:ring-[#9A7DB8]"
                    />
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#9A7DB8] transition-colors">
                      Aplicar IVA
                    </span>
                  </label>

                  {applyTax && (
                    <div className="flex items-center gap-1 bg-purple-50/80 px-2.5 py-1 rounded-xl border border-purple-200">
                      <span className="text-[10px] text-[#5C3C7B] font-bold">% IVA:</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                        className="w-12 text-center bg-white border border-slate-300 rounded px-1 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-[#9A7DB8] outline-none shadow-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* AFIP Integration Checkbox */}
              <div className="pt-xs border-t border-slate-200">
                <label className="flex items-start gap-xs cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isAfip}
                    onChange={(e) => setIsAfip(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#9A7DB8] focus:ring-[#9A7DB8] mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-slate-900 group-hover:text-[#9A7DB8] transition-colors">
                      Emitir Comprobante AFIP (CAE)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Autorizar electrónicamente en servidores de AFIP
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Confirm Action Button */}
            <button
              onClick={handleConfirmCheckout}
              className="w-full mt-md py-3 rounded-xl bg-[#9A7DB8] hover:bg-[#8362A5] text-white transition-all font-headline-md text-xs font-bold flex items-center justify-center gap-xs shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Confirmar y Emitir Cobro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
              <h3 className="font-headline-sm text-slate-900 font-semibold text-base">Agregar concepto a factura</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="flex flex-col gap-md text-xs">
              {/* Selector de Tipo: Servicio vs Producto */}
              <div className="flex flex-col gap-xs">
                <label className="font-semibold text-xs text-slate-700 block">
                  Tipo de concepto *
                </label>
                <div className="grid grid-cols-2 gap-xs p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('servicio');
                      setSelectedCategoryFilter('');
                      setSelectedCatalogItemId('');
                      setNewItemDesc('');
                      setNewItemPrice(0);
                    }}
                    className={`py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      itemType === 'servicio'
                        ? 'bg-[#5C3C7B] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">medical_services</span>
                    <span>Servicio</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemType('producto');
                      setSelectedCategoryFilter('');
                      setSelectedCatalogItemId('');
                      setNewItemDesc('');
                      setNewItemPrice(0);
                    }}
                    className={`py-2 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      itemType === 'producto'
                        ? 'bg-[#5C3C7B] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                    <span>Producto</span>
                  </button>
                </div>
              </div>

              {/* Selector de Categoría del Catálogo */}
              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">
                  Filtrar por categoría del catálogo
                </label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => {
                    setSelectedCategoryFilter(e.target.value);
                    setSelectedCatalogItemId('');
                  }}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-xs focus:border-[#9A7DB8] shadow-xs cursor-pointer capitalize"
                >
                  <option value="">-- Todas las categorías ({itemType === 'servicio' ? 'Servicios' : 'Productos'}) --</option>
                  {(itemType === 'servicio' ? availableServiceCategories : availableProductCategories).map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección del Ítem del Catálogo */}
              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">
                  Seleccionar {itemType === 'servicio' ? 'servicio' : 'producto'} del catálogo *
                </label>
                <select
                  value={selectedCatalogItemId}
                  onChange={(e) => handleSelectCatalogItem(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-xs focus:border-[#9A7DB8] shadow-xs cursor-pointer"
                >
                  <option value="">-- Seleccione un {itemType} del catálogo --</option>
                  {availableCatalogItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (${item.price.toLocaleString('es-AR')}) - {item.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descripción del Concepto seleccionada */}
              {newItemDesc && (
                <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200 text-xs flex flex-col gap-0.5">
                  <span className="font-semibold text-[#5C3C7B] text-[11px]">Concepto seleccionado:</span>
                  <span className="font-semibold text-slate-900">{newItemDesc}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{newItemCat}</span>
                </div>
              )}

              {/* Precio Unitario Editable */}
              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">
                  Precio unitario ($) (Editable) *
                </label>
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(Number(e.target.value))}
                  required
                  min={0}
                  step={100}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Agregar concepto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppNotificationModal
        isOpen={notifModal.isOpen}
        message={notifModal.message}
        type="warning"
        onClose={() => setNotifModal({ isOpen: false, message: '' })}
      />
    </div>
  );
};
