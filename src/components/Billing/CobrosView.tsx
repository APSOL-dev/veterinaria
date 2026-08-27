import React, { useState } from 'react';
import { Patient, BillReceipt, DocumentType, PaymentMethod, BillItem } from '../../domain/types';
import { AppNotificationModal } from '../Common/AppNotificationModal';

interface CobrosViewProps {
  patients: Patient[];
  selectedPatient: Patient;
  receipts: BillReceipt[];
  activeSubmodule?: string;
  onCheckout: (data: {
    documentType: DocumentType;
    paymentMethod: PaymentMethod;
    isAfip: boolean;
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
  onCheckout,
  onNavigateToHistorial
}) => {
  const [targetPatientId, setTargetPatientId] = useState<string>(selectedPatient.id);
  const currentPatient = patients.find(p => p.id === targetPatientId) || selectedPatient;

  // Bill items state
  const [items, setItems] = useState<BillItem[]>([
    { id: '1', description: 'Consulta General', category: 'Servicio veterinario', quantity: 1, unitPrice: 3500, discountPercent: 0 },
    { id: '2', description: 'Antibiótico Amoxicilina 500mg', category: 'Farmacia - Blister x 10', quantity: 2, unitPrice: 850, discountPercent: 10 },
    { id: '3', description: 'Vacuna Quíntuple', category: 'Aplicación en consultorio', quantity: 1, unitPrice: 4200, discountPercent: 0 }
  ]);

  // Settings state
  const [documentType, setDocumentType] = useState<DocumentType>('factura-b');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [isAfip, setIsAfip] = useState(true);

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
  const taxAmount = subtotalAfterDiscount * 0.21;
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
      items,
      patientId: currentPatient.id
    });
  };

  if (activeSubmodule === 'historial-cobros') {
    return (
      <div className="flex flex-col w-full gap-md font-body-md text-on-surface">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display-lg text-[22px] text-primary font-bold leading-tight">
              Historial de Cobros y Comprobantes
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant">
              Registro consolidado de cobros emitidos, CAE AFIP y comprobantes digitales
            </p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1 overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
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
              <tbody className="text-on-surface">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-lg text-center text-on-surface-variant text-xs">
                      No hay cobros registrados en el historial.
                    </td>
                  </tr>
                ) : (
                  receipts.map((rec) => (
                    <tr key={rec.id} className="border-b border-surface-container hover:bg-surface-container-low transition-colors">
                      <td className="p-sm px-md font-bold text-primary">{rec.receiptNumber}</td>
                      <td className="p-sm px-md">{new Date(rec.date).toLocaleDateString('es-AR')}</td>
                      <td className="p-sm px-md font-medium">{rec.patientName} ({rec.ownerName})</td>
                      <td className="p-sm px-md uppercase font-bold text-secondary">{rec.documentType}</td>
                      <td className="p-sm px-md capitalize">{rec.paymentMethod}</td>
                      <td className="p-sm px-md font-mono text-[11px] text-on-surface-variant">{rec.afipCae || 'N/A (Remito)'}</td>
                      <td className="p-sm px-md text-right font-bold text-primary">$ {rec.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                      <td className="p-sm px-md text-center">
                        <button
                          onClick={() => window.print()}
                          className="bg-surface-container-high text-primary hover:bg-primary hover:text-white px-2 py-1 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-xs"
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
    <div className="flex flex-col w-full h-full gap-md font-body-md text-on-surface overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between shrink-0 bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-xs">
        <div>
          <h1 className="font-display-lg text-[22px] text-on-surface font-bold">Nueva Facturación</h1>
          <p className="font-body-md text-xs text-on-surface-variant flex items-center gap-xs mt-0.5">
            <span className="material-symbols-outlined text-[16px] text-primary">pets</span>
            Paciente seleccionado: <strong className="text-primary">{currentPatient.name}</strong> ({currentPatient.species}, {currentPatient.breed} • Dueño: {currentPatient.ownerName})
          </p>
        </div>

        <div className="flex items-center gap-sm">
          {/* Patient Selector */}
          <div className="flex items-center gap-xs bg-surface-container-low p-xs px-sm rounded-xl border border-outline-variant/30">
            <label className="font-label-sm text-on-surface-variant uppercase text-[10px] font-bold">Cambiar Paciente:</label>
            <select
              value={targetPatientId}
              onChange={(e) => setTargetPatientId(e.target.value)}
              className="bg-transparent text-primary font-bold text-xs outline-none cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species} - {p.ownerName})</option>
              ))}
            </select>
          </div>

          {onNavigateToHistorial && (
            <button
              onClick={onNavigateToHistorial}
              className="px-md py-1.5 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-variant transition-colors font-label-md text-xs uppercase tracking-wider flex items-center gap-xs font-semibold"
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
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col h-full overflow-hidden relative border border-outline-variant/30">
            <div className="p-md px-lg flex items-center justify-between border-b border-surface-variant relative z-10 shrink-0">
              <h2 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>list_alt</span>
                Detalle de Conceptos
              </h2>

              <button
                onClick={() => setShowAddItemModal(true)}
                className="px-md py-1.5 rounded-xl bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary transition-all font-label-md text-xs flex items-center gap-xs shadow-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Agregar Ítem
              </button>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-y-auto relative z-10">
              <table className="w-full text-left font-body-md text-xs">
                <thead className="bg-surface-container text-on-surface-variant font-label-sm uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="p-sm px-md font-medium">Descripción</th>
                    <th className="p-sm px-md font-medium text-center w-24">Cant.</th>
                    <th className="p-sm px-md font-medium text-right w-32">Precio Unit.</th>
                    <th className="p-sm px-md font-medium text-center w-24">Desc. %</th>
                    <th className="p-sm px-md font-medium text-right w-32">Subtotal</th>
                    <th className="p-sm px-md font-medium text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-xl text-center text-on-surface-variant text-xs">
                        No hay conceptos agregados a la factura.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const itemSub = item.unitPrice * item.quantity;
                      const itemSubAfterDesc = itemSub * (1 - item.discountPercent / 100);

                      return (
                        <tr key={item.id} className="border-b border-surface-container/60 hover:bg-surface-container-low transition-colors group">
                          <td className="p-sm px-md">
                            <div className="flex flex-col">
                              <span className="font-semibold text-primary text-xs">{item.description}</span>
                              <span className="text-on-surface-variant text-[11px]">{item.category}</span>
                            </div>
                          </td>
                          <td className="p-sm px-md text-center">
                            <div className="flex items-center justify-center gap-xs">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="w-5 h-5 rounded bg-surface-container text-on-surface flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                              >
                                <span className="material-symbols-outlined text-[12px]">remove</span>
                              </button>
                              <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="w-5 h-5 rounded bg-surface-container text-on-surface flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                              >
                                <span className="material-symbols-outlined text-[12px]">add</span>
                              </button>
                            </div>
                          </td>
                          <td className="p-sm px-md text-right font-medium text-xs">$ {item.unitPrice.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                          <td className="p-sm px-md text-center">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={item.discountPercent}
                              onChange={(e) => handleUpdateDiscount(item.id, e.target.value)}
                              className="w-12 text-center bg-surface-container border-none rounded py-0.5 text-on-surface font-bold text-xs focus:ring-2 focus:ring-primary outline-none"
                            />
                          </td>
                          <td className="p-sm px-md text-right font-bold text-primary text-xs">
                            $ {itemSubAfterDesc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-sm px-md text-center">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-outline hover:text-error transition-colors p-1 rounded-full hover:bg-error-container"
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
          <div className="bg-primary text-on-primary rounded-2xl p-md shadow-md relative overflow-hidden shrink-0">
            <h3 className="font-label-md uppercase tracking-wider text-primary-fixed-dim text-[10px] mb-xs font-bold">
              Resumen de Cuenta
            </h3>
            <div className="space-y-xs text-xs relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-white/80">Subtotal Bruto</span>
                <span>$ {rawSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-error-container">
                <span>Descuentos Aplicados</span>
                <span>-$ {totalDiscounts.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center pb-xs border-b border-white/20">
                <span className="text-white/80">Impuestos (IVA 21%)</span>
                <span>$ {taxAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
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
          <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1 flex flex-col justify-between text-xs">
            <div className="flex flex-col gap-md">
              <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-xs border-b pb-xs">
                <span className="material-symbols-outlined text-secondary text-[18px]">settings_suggest</span>
                Configuración de Cobro
              </h3>

              {/* Document Type */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-on-surface-variant uppercase text-[10px] font-bold">
                  Tipo de Comprobante
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="w-full bg-surface-container border-none rounded-xl py-2 px-md text-on-surface font-bold text-xs outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  <option value="factura-b">Factura B (Consumidor Final)</option>
                  <option value="factura-a">Factura A (Responsable Inscripto)</option>
                  <option value="factura-c">Factura C</option>
                  <option value="remito">Remito Interno (Sin valor fiscal)</option>
                </select>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-on-surface-variant uppercase text-[10px] font-bold">
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
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all">
                      <span className="material-symbols-outlined text-[20px] mb-0.5">payments</span>
                      <span className="font-label-md text-[10px]">Efectivo</span>
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
                    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-surface-container border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all">
                      <span className="material-symbols-outlined text-[20px] mb-0.5">credit_card</span>
                      <span className="font-label-md text-[10px]">Tarjeta</span>
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
                    <div className="flex items-center justify-center gap-xs p-2 rounded-xl bg-surface-container border-2 border-transparent peer-checked:border-primary peer-checked:bg-primary-container peer-checked:text-on-primary-container transition-all">
                      <span className="material-symbols-outlined text-[18px]">account_balance</span>
                      <span className="font-label-md text-[10px]">Transferencia Bancaria</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* AFIP Integration Checkbox */}
              <div className="pt-xs border-t border-surface-container">
                <label className="flex items-start gap-xs cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={isAfip}
                    onChange={(e) => setIsAfip(e.target.checked)}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary mt-0.5"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                      Emitir Comprobante AFIP (CAE)
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      Autorizar electrónicamente en servidores de AFIP
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Confirm Action Button */}
            <button
              onClick={handleConfirmCheckout}
              className="w-full mt-md py-3 rounded-xl bg-secondary text-on-secondary hover:bg-primary transition-all font-headline-md text-xs font-bold flex items-center justify-center gap-xs shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Confirmar y Emitir Cobro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary font-bold text-base">Agregar Concepto a Factura</h3>
              <button onClick={() => setShowAddItemModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="flex flex-col gap-sm text-xs">
              <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Descripción del Concepto</label>
              <input
                type="text"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                placeholder="Ej. Limpieza dental, Ecografía abdominal..."
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-primary"
              />

              <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Categoría / Tipo</label>
              <select
                value={newItemCat}
                onChange={(e) => setNewItemCat(e.target.value)}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-primary"
              >
                <option value="Servicio veterinario">Servicio veterinario</option>
                <option value="Servicio peluquería">Servicio peluquería</option>
                <option value="Farmacia">Farmacia / Medicamento</option>
                <option value="Pet Shop">Pet Shop / Producto</option>
              </select>

              <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Precio Unitario ($)</label>
              <input
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(Number(e.target.value))}
                required
                min={0}
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-primary font-bold"
              />

              <button type="submit" className="bg-primary text-on-primary py-2.5 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-bold shadow-sm cursor-pointer">
                Agregar Concepto
              </button>
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
