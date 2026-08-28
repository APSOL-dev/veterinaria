import React, { useState, useEffect } from 'react';
import { Patient, BillReceipt, DocumentType, PaymentMethod, BillItem } from '../../domain/types';
import { AppNotificationModal } from '../Common/AppNotificationModal';

interface CobrosViewProps {
  patients: Patient[];
  selectedPatient: Patient;
  receipts: BillReceipt[];
  activeSubmodule?: string;
  initialItems?: BillItem[];
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

  // Settings state
  const [documentType, setDocumentType] = useState<DocumentType>('factura-b');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [isAfip, setIsAfip] = useState(true);
  const [applyTax, setApplyTax] = useState(true);
  const [taxPercent, setTaxPercent] = useState(21);

  // Modal Add Item state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemCat, setNewItemCat] = useState('Servicio veterinario');
  const [newItemPrice, setNewItemPrice] = useState(1500);

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

  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc.trim()) return;

    const newItem: BillItem = {
      id: Date.now().toString(),
      description: newItemDesc.trim(),
      category: newItemCat,
      quantity: 1,
      unitPrice: Number(newItemPrice),
      discountPercent: 0
    };

    setItems(prev => [...prev, newItem]);
    setNewItemDesc('');
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
              Registro consolidado de cobros emitidos, CAE AFIP y comprobantes digitales
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex-1 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                  <th className="p-sm px-md">Comprobante Nº</th>
                  <th className="p-sm px-md">Fecha</th>
                  <th className="p-sm px-md">Paciente / Dueño</th>
                  <th className="p-sm px-md">Tipo Doc</th>
                  <th className="p-sm px-md">Medio Pago</th>
                  <th className="p-sm px-md">CAE AFIP</th>
                  <th className="p-sm px-md text-right">Total</th>
                  <th className="p-sm px-md text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-lg text-center text-slate-500 text-xs">
                      No hay cobros registrados en el historial.
                    </td>
                  </tr>
                ) : (
                  receipts.map((rec) => (
                    <tr key={rec.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-sm px-md font-medium text-slate-900">{rec.receiptNumber}</td>
                      <td className="p-sm px-md text-slate-700">{new Date(rec.date).toLocaleDateString('es-AR')}</td>
                      <td className="p-sm px-md font-normal text-slate-800">{rec.patientName} ({rec.ownerName})</td>
                      <td className="p-sm px-md uppercase font-bold text-[#5C3C7B]">{rec.documentType}</td>
                      <td className="p-sm px-md capitalize text-slate-800">{rec.paymentMethod}</td>
                      <td className="p-sm px-md font-mono text-[11px] text-slate-600">{rec.afipCae || 'N/A (Remito)'}</td>
                      <td className="p-sm px-md text-right font-bold text-slate-900">$ {rec.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-sm px-md text-center">
                        <button
                          onClick={() => window.print()}
                          className="bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-2 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-xs cursor-pointer"
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
          <h1 className="font-display-lg text-[22px] text-slate-900 font-bold leading-tight">Cobros — Nueva Facturación</h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            Paciente seleccionado: <strong className="text-slate-900 font-bold">{currentPatient.name}</strong> ({currentPatient.species}, {currentPatient.breed} • Dueño: {currentPatient.ownerName})
          </p>
        </div>

        <div className="flex items-center gap-sm">
          {/* Patient Selector */}
          <div className="flex items-center gap-xs bg-slate-50 p-xs px-sm rounded-xl border border-slate-300">
            <label className="font-label-sm text-slate-700 uppercase text-[10px] font-bold">Cambiar Paciente:</label>
            <select
              value={targetPatientId}
              onChange={(e) => setTargetPatientId(e.target.value)}
              className="bg-transparent text-slate-900 font-bold text-xs outline-none cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species} - {p.ownerName})</option>
              ))}
            </select>
          </div>

          {onNavigateToHistorial && (
            <button
              onClick={onNavigateToHistorial}
              className="px-md py-1.5 rounded-xl bg-purple-50 text-[#5C3C7B] border border-purple-200 hover:bg-purple-100 transition-colors font-label-md text-xs uppercase tracking-wider flex items-center gap-xs font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">history</span>
              Historial
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: 8 Cols Left (Items), 4 Cols Right (Summary & Payment) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md flex-1 overflow-hidden">
        {/* Left Section: Bill Items (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-md h-full overflow-hidden">
          <div className="bg-white rounded-2xl shadow-sm flex flex-col h-full overflow-hidden relative border border-slate-200">
            <div className="p-md px-lg flex items-center justify-between border-b border-slate-200 relative z-10 shrink-0">
              <h2 className="font-headline-sm text-base font-bold text-slate-900 flex items-center gap-xs">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>list_alt</span>
                Detalle de Conceptos
              </h2>

              <button
                onClick={() => setShowAddItemModal(true)}
                className="px-md py-1.5 rounded-xl bg-[#9A7DB8] hover:bg-[#8362A5] text-white transition-all font-label-md text-xs flex items-center gap-xs shadow-sm font-bold cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Agregar Ítem
              </button>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-y-auto relative z-10">
              <table className="w-full text-left font-body-md text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-sm px-md">Descripción</th>
                    <th className="p-sm px-md text-center w-24">Cant.</th>
                    <th className="p-sm px-md text-right w-32">Precio Unit.</th>
                    <th className="p-sm px-md text-center w-24">Desc. %</th>
                    <th className="p-sm px-md text-right w-32">Subtotal</th>
                    <th className="p-sm px-md text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="text-slate-800">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-xl text-center text-slate-500 text-xs font-medium">
                        No hay conceptos agregados a la factura. Utilice el botón "+ Agregar Ítem" para añadir servicios o productos.
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
                              <span className="font-normal text-slate-900 text-xs">{item.description}</span>
                              <span className="text-slate-500 text-[11px]">{item.category}</span>
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
                              <span className="w-6 text-center font-bold text-xs text-slate-900">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="w-5 h-5 rounded bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-purple-100 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[12px]">add</span>
                              </button>
                            </div>
                          </td>
                          <td className="p-sm px-md text-right font-normal text-slate-800 text-xs">$ {item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-sm px-md text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discountPercent}
                              onChange={(e) => handleUpdateDiscount(item.id, e.target.value)}
                              className="w-12 text-center bg-white border border-slate-300 rounded py-0.5 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-[#9A7DB8] outline-none"
                            />
                          </td>
                          <td className="p-sm px-md text-right font-medium text-slate-900 text-xs">
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
            <h3 className="font-label-md uppercase tracking-wider text-purple-100 text-[10px] mb-xs font-bold">
              Resumen de Cuenta
            </h3>
            <div className="space-y-xs text-xs relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-purple-100">Subtotal Bruto</span>
                <span className="font-medium">$ {rawSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-purple-200">
                <span>Descuentos Aplicados</span>
                <span>-$ {totalDiscounts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-xs border-b border-purple-300/40">
                <span className="text-purple-100">
                  Impuestos {applyTax ? `(IVA ${taxPercent}%)` : '(Sin IVA)'}
                </span>
                <span className="font-medium">$ {taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-end pt-xs">
                <span className="font-headline-sm text-sm font-bold">Total a Cobrar</span>
                <span className="font-display-lg text-2xl font-extrabold text-white">
                  $ {totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Configuración de Cobro Card */}
          <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex-1 flex flex-col justify-between text-xs">
            <div className="flex flex-col gap-md">
              <h3 className="font-headline-sm text-sm font-bold text-slate-900 flex items-center gap-xs border-b border-slate-200 pb-xs">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">settings_suggest</span>
                Configuración de Cobro
              </h3>

              {/* Document Type */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold">
                  Tipo de Comprobante
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
                  className="w-full bg-white border border-slate-300 rounded-xl py-2 px-md text-slate-900 font-bold text-xs outline-none focus:ring-2 focus:ring-[#9A7DB8] cursor-pointer"
                >
                  <option value="factura-b">Factura B (Consumidor Final)</option>
                  <option value="factura-a">Factura A (Responsable Inscripto)</option>
                  <option value="factura-c">Factura C</option>
                  <option value="remito">Remito Interno (Sin valor fiscal)</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold">
                  Método de Pago
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

                  <label className="cursor-pointer col-span-2">
                    <input
                      type="radio"
                      name="payment_method"
                      value="transferencia"
                      checked={paymentMethod === 'transferencia'}
                      onChange={() => setPaymentMethod('transferencia')}
                      className="peer sr-only"
                    />
                    <div className="flex items-center justify-center gap-xs p-2 rounded-xl bg-slate-50 border-2 border-slate-200 peer-checked:border-[#9A7DB8] peer-checked:bg-purple-50 peer-checked:text-[#5C3C7B] transition-all">
                      <span className="material-symbols-outlined text-[18px]">account_balance</span>
                      <span className="font-label-md text-[10px] font-bold">Transferencia Bancaria</span>
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
              <h3 className="font-headline-sm text-slate-900 font-bold text-base">Agregar Concepto a Factura</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="flex flex-col gap-md text-xs">
              <div>
                <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Descripción del Concepto *</label>
                <input
                  type="text"
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Ej. Limpieza dental, Ecografía abdominal..."
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
                />
              </div>

              <div>
                <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Categoría / Tipo *</label>
                <select
                  value={newItemCat}
                  onChange={(e) => setNewItemCat(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                >
                  <option value="Servicio veterinario">Servicio veterinario</option>
                  <option value="Servicio peluquería">Servicio peluquería</option>
                  <option value="Farmacia">Farmacia / Medicamento</option>
                  <option value="Pet Shop">Pet Shop / Producto</option>
                </select>
              </div>

              <div>
                <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Precio Unitario ($) *</label>
                <input
                  type="number"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(Number(e.target.value))}
                  required
                  min={0}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-bold text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddItemModal(false)}
                  className="px-md py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-lg py-2.5 rounded-xl font-label-md text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Agregar Concepto
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
