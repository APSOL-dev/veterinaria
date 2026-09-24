import React, { useState, useEffect } from 'react';
import { SupplierBill, SupplierPayment, SupplierPaymentMethod } from '../../domain/types';
import { getRemainingBalance } from '../../domain/services/paymentService';
import { uploadVoucherToSupabase } from '../../domain/services/supabaseService';
import { formatInvoiceFullNumber } from '../../domain/services/supplierService';
import { AutoResizeTextarea } from '../Common/AutoResizeTextarea';

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bills: SupplierBill[];
  payments?: SupplierPayment[];
  preselectedBillId?: string;
  onSavePayment: (payment: Omit<SupplierPayment, 'id'>) => void;
}

export const PaymentDrawer: React.FC<PaymentDrawerProps> = ({
  isOpen,
  onClose,
  bills,
  payments = [],
  preselectedBillId,
  onSavePayment
}) => {
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<SupplierPaymentMethod>('Efectivo');
  const [note, setNote] = useState<string>('');
  const [selectedVoucherFile, setSelectedVoucherFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Initialize selection when drawer opens or preselectedBillId changes
  useEffect(() => {
    if (!isOpen) return;

    const initialBillId = preselectedBillId || (bills.length > 0 ? bills[0].id : '');
    setSelectedBillId(initialBillId);

    if (initialBillId) {
      const targetBill = bills.find(b => b.id === initialBillId);
      if (targetBill) {
        const remaining = getRemainingBalance(targetBill, payments);
        setAmount(remaining);
      }
    } else {
      setAmount('');
    }

    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Efectivo');
    setNote('');
    setSelectedVoucherFile(null);
    setIsUploading(false);
  }, [isOpen, preselectedBillId, bills, payments]);

  const handleBillSelect = (billId: string) => {
    setSelectedBillId(billId);
    const targetBill = bills.find(b => b.id === billId);
    if (targetBill) {
      const remaining = getRemainingBalance(targetBill, payments);
      setAmount(remaining);
    } else {
      setAmount('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedVoucherFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedVoucherFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillId || isUploading) return;

    const targetBill = bills.find(b => b.id === selectedBillId);
    if (!targetBill) return;

    const numAmount = Number(amount) || 0;
    if (numAmount <= 0) return;

    let voucherName = selectedVoucherFile ? selectedVoucherFile.name : undefined;
    let voucherUrl: string | undefined = undefined;

    if (selectedVoucherFile) {
      setIsUploading(true);
      const uploadRes = await uploadVoucherToSupabase(selectedVoucherFile);
      setIsUploading(false);
      if (uploadRes) {
        voucherName = uploadRes.voucherName;
        voucherUrl = uploadRes.voucherUrl;
      }
    }

    onSavePayment({
      billId: targetBill.id,
      billInvoiceNumber: targetBill.invoiceNumber,
      supplierName: targetBill.supplierName,
      date: paymentDate,
      amount: numAmount,
      paymentMethod,
      note: note.trim() || undefined,
      voucherName,
      voucherUrl
    });

    onClose();
  };

  if (!isOpen) return null;

  const activeBill = bills.find(b => b.id === selectedBillId);
  const activeRemaining = activeBill ? getRemainingBalance(activeBill, payments) : 0;
  const currentPayAmount = Number(amount) || 0;
  const calculatedSaldoRestante = Math.max(0, activeRemaining - currentPayAmount);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="w-full max-w-lg bg-surface-container-lowest text-slate-800 max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden font-body-md text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#5C3C7B] text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-sm text-white">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Registrar Pago a Proveedor</h2>
              <p className="text-[11px] text-purple-200 font-medium">Cancelación y abonos sobre facturas de compra</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

          {/* 1. Factura de Proveedor */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-700">
              Factura de Proveedor *
            </label>
            <div className="relative">
              <select
                value={selectedBillId}
                onChange={(e) => handleBillSelect(e.target.value)}
                className="w-full appearance-none bg-surface-container/60 border border-outline-variant/40 rounded-xl pr-8 pl-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 cursor-pointer font-medium"
                required
              >
                {bills.length === 0 ? (
                  <option value="">No hay facturas disponibles</option>
                ) : (
                  bills.map((bill) => {
                    const rem = getRemainingBalance(bill, payments);
                    return (
                      <option key={bill.id} value={bill.id}>
                        {formatInvoiceFullNumber(bill)} — {bill.supplierName} (Saldo: ${rem.toLocaleString('es-AR')})
                      </option>
                    );
                  })
                )}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>

          {/* 2. Saldo adeudado */}
          {activeBill && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-amber-900 font-medium">Saldo adeudado actual:</span>
              <span className="font-bold text-amber-800 text-sm font-mono">${activeRemaining.toLocaleString('es-AR')}</span>
            </div>
          )}

          {/* 3. Proveedor */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-700">
              Proveedor
            </label>
            <input
              type="text"
              readOnly
              value={activeBill ? activeBill.supplierName : ''}
              placeholder="Seleccione una factura..."
              className="bg-surface-container/30 border border-outline-variant/30 rounded-xl p-2.5 text-xs text-slate-700 outline-none font-medium cursor-not-allowed"
            />
          </div>

          {/* Grid: Monto + Fecha + Medio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 4. Monto */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Monto ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="0.00"
                className="bg-white border border-outline-variant/50 rounded-xl p-2.5 text-xs text-slate-900 font-bold font-mono outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20"
                required
              />
            </div>

            {/* 5. Fecha de Pago */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Fecha de Pago *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-medium"
                required
              />
            </div>

            {/* 6. Método de Pago */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-700">
                Método de Pago *
              </label>
              <div className="relative">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as SupplierPaymentMethod)}
                  className="w-full appearance-none bg-surface-container/60 border border-outline-variant/40 rounded-xl pr-8 pl-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 cursor-pointer font-medium"
                  required
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Tarjeta">Tarjeta</option>
                  <option value="Otro">Otro</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">expand_more</span>
              </div>
            </div>
          </div>

          {/* 7. Saldo restante */}
          {activeBill && (
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Saldo restante tras el pago:</span>
              <span className={`font-bold font-mono text-sm ${calculatedSaldoRestante === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                ${calculatedSaldoRestante.toLocaleString('es-AR')}
              </span>
            </div>
          )}

          {/* 8. Comprobante de Pago */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-700">
              Comprobante de Pago (PDF / Imagen)
            </label>
            <label
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 rounded-2xl transition-all group cursor-pointer ${
                selectedVoucherFile 
                  ? 'border-solid border-emerald-400 bg-emerald-50/50 p-2' 
                  : 'border-dashed border-outline-variant/60 hover:border-[#5C3C7B] bg-surface-container/30 hover:bg-purple-50/40 p-4 flex flex-col items-center justify-center text-center'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedVoucherFile ? (
                <div className="w-full flex items-center justify-between p-2 px-3 bg-white border border-emerald-300 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">description</span>
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900 truncate max-w-[200px]" title={selectedVoucherFile.name}>
                          {selectedVoucherFile.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Adjuntado
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {(selectedVoucherFile.size / 1024).toFixed(1)} KB — Haz clic para cambiar
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedVoucherFile(null);
                    }}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-500 flex items-center justify-center transition-colors shrink-0 ml-2"
                    title="Quitar archivo"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5C3C7B] group-hover:scale-110 flex items-center justify-center mb-1.5 transition-transform">
                    <span className="material-symbols-outlined text-xl">cloud_upload</span>
                  </div>
                  <span className="font-semibold text-xs text-slate-800 mb-0.5">
                    Seleccionar o arrastrar comprobante
                  </span>
                  <span className="text-[10px] text-slate-500">
                    PDF, JPG o PNG del comprobante bancario o recibo
                  </span>
                </>
              )}
            </label>
          </div>

          {/* 9. Nota u Observación */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-700">
              Nota u Observación (Opcional)
            </label>
            <AutoResizeTextarea
              minRows={2}
              maxRows={6}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Detalle o notas adicionales sobre el pago..."
              className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-3 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-normal leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs bg-white border border-outline-variant/40 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isUploading || !selectedBillId || Number(amount) <= 0}
              className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">check</span>
              <span>{isUploading ? 'Guardando...' : 'Registrar Pago'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
