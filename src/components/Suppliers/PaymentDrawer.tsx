import React, { useState, useEffect } from 'react';
import { SupplierBill, SupplierPayment, SupplierPaymentMethod } from '../../domain/types';
import { getRemainingBalance } from '../../domain/services/paymentService';
import { uploadVoucherToSupabase } from '../../domain/services/supabaseService';
import { formatInvoiceFullNumber } from '../../domain/services/supplierService';

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
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-md md:max-w-lg bg-[#1D1426] text-slate-100 h-full flex flex-col shadow-2xl border-l border-purple-900/50 font-body-md text-xs">
        
        {/* Header */}
        <div className="flex justify-between items-center px-lg py-md border-b border-purple-900/40 bg-[#2B1D3A]">
          <div className="flex items-center gap-xs font-bold text-sm text-white">
            <span className="material-symbols-outlined text-[#CBB5E2] text-[20px]">
              wallet
            </span>
            Registrar Pago a Proveedor
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-lg flex flex-col gap-md">

          {/* 1. Factura de Proveedor */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-300">
              Factura de Proveedor *
            </label>
            <select
              value={selectedBillId}
              onChange={(e) => handleBillSelect(e.target.value)}
              className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
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
          </div>

          {/* 2. Saldo adeudado */}
          {activeBill && (
            <div className="bg-[#160E1E] border border-purple-900/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Saldo adeudado:</span>
              <span className="font-bold text-amber-400">${activeRemaining.toLocaleString('es-AR')}</span>
            </div>
          )}

          {/* 3. Proveedor */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-300">
              Proveedor
            </label>
            <input
              type="text"
              readOnly
              value={activeBill ? activeBill.supplierName : ''}
              placeholder="Seleccione una factura..."
              className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-slate-300 outline-none opacity-90 cursor-not-allowed"
            />
          </div>

          {/* 4. Monto */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-300">
              Monto ($) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value !== '' ? Number(e.target.value) : '')}
              placeholder="0.00"
              className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white font-bold text-sm text-[#CBB5E2] outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
              required
            />
          </div>

          {/* 5. Fecha de Pago */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-300">
              Fecha de Pago *
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
              required
            />
          </div>

          {/* 6. Método de Pago */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-300">
              Método de Pago *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as SupplierPaymentMethod)}
              className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
              required
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cheque">Cheque</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          {/* 7. Saldo restante */}
          {activeBill && (
            <div className="bg-[#160E1E] border border-purple-900/40 rounded-xl p-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Saldo restante tras el pago:</span>
              <span className={`font-bold ${calculatedSaldoRestante === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ${calculatedSaldoRestante.toLocaleString('es-AR')}
              </span>
            </div>
          )}

          {/* 8. Comprobante de Pago */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-300">
              Comprobante de Pago (PDF / Imagen)
            </label>
            <label
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 rounded-2xl transition-all group cursor-pointer ${
                selectedVoucherFile 
                  ? 'border-solid border-emerald-400 bg-[#160E1E] p-1.5' 
                  : 'border-dashed border-purple-900/60 hover:border-[#9A7DB8] bg-[#160E1E]/80 p-md flex flex-col items-center justify-center text-center'
              }`}
            >
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedVoucherFile ? (
                <div className="w-full flex items-center justify-between p-sm px-md bg-[#251A32] border border-emerald-500/40 rounded-xl">
                  <div className="flex items-center gap-md min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">description</span>
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <div className="flex items-center gap-xs">
                        <span className="font-bold text-xs text-white truncate max-w-[180px]" title={selectedVoucherFile.name}>
                          {selectedVoucherFile.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Adjuntado
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
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
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 flex items-center justify-center transition-colors shrink-0 ml-2"
                    title="Quitar archivo"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-[#9A7DB8]/20 text-[#CBB5E2] group-hover:scale-110 flex items-center justify-center mb-xs transition-transform">
                    <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                  </div>
                  <span className="font-bold text-xs text-white mb-0.5">
                    Seleccionar o arrastrar comprobante
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PDF, JPG o PNG del comprobante bancario o recibo
                  </span>
                </>
              )}
            </label>
          </div>

          {/* 9. Nota u Observación */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-slate-300">
              Nota u Observación (Opcional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ej. Transferencia Banco Nación N° ref. 458921"
              className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-sm pt-md mt-auto border-t border-purple-900/40">
            <button
              type="submit"
              disabled={!selectedBillId || Number(amount) <= 0}
              className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-xs disabled:opacity-50 cursor-pointer w-full"
            >
              <span className="material-symbols-outlined text-[18px]">check</span>
              Registrar Pago
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-bold text-xs transition-all text-center cursor-pointer"
            >
              Cancelar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
