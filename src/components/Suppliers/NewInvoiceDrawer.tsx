import React, { useState, useEffect } from 'react';
import { SupplierBill } from '../../domain/types';
import { sendInvoiceWebhook, parseN8nInvoiceResponse } from '../../domain/services/webhookService';
import { resetInvoiceDrawerState, shouldShowResetButton } from '../../domain/services/supplierService';

interface NewInvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBill: (bill: Omit<SupplierBill, 'id'>) => void;
  onUpdateBill?: (id: string, bill: Omit<SupplierBill, 'id'>) => void;
  editingBill?: SupplierBill | null;
  registeredSuppliers?: string[];
}

export const NewInvoiceDrawer: React.FC<NewInvoiceDrawerProps> = ({
  isOpen,
  onClose,
  onSaveBill,
  onUpdateBill,
  editingBill,
  registeredSuppliers = ['Distribuidora FarmaVet SA', 'Laboratorios Zoonosis SRL', 'Insumos Médicos del Plata', 'Distribuidora Veterinaria Sur']
}) => {
  const [loadMode, setLoadMode] = useState<'automatic' | 'manual'>('automatic');

  // Supplier & Company info
  const [supplierName, setSupplierName] = useState<string>('');
  const [cuit, setCuit] = useState<string>('');
  const [razonSocial, setRazonSocial] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Invoice Details
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('Factura A');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [subtotal, setSubtotal] = useState<number | ''>('');
  const [taxAmount, setTaxAmount] = useState<number | ''>('');
  const [perceptions, setPerceptions] = useState<number | ''>('');
  const [currency, setCurrency] = useState<string>('AR$ (Pesos)');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [billStatus, setBillStatus] = useState<'paid' | 'pending'>('pending');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [isSubmittingWebhook, setIsSubmittingWebhook] = useState<boolean>(false);

  const handleResetForm = () => {
    const fresh = resetInvoiceDrawerState();
    setLoadMode(fresh.loadMode);
    setSupplierName(fresh.supplierName);
    setCuit(fresh.cuit);
    setRazonSocial(fresh.razonSocial);
    setSelectedFile(fresh.selectedFile);
    setInvoiceDate(fresh.invoiceDate);
    setPaymentDate('');
    setDocumentType(fresh.documentType);
    setInvoiceNumber(fresh.invoiceNumber);
    setSubtotal(fresh.subtotal);
    setTaxAmount(fresh.taxAmount);
    setPerceptions(fresh.perceptions);
    setCurrency(fresh.currency);
    setTotalAmount(fresh.totalAmount);
    setBillStatus(fresh.billStatus);
    setIsProcessing(fresh.isProcessing);
    setIsProcessed(fresh.isProcessed);
  };

  useEffect(() => {
    if (editingBill) {
      setLoadMode('manual');
      setSupplierName(editingBill.supplierName || '');
      setCuit(editingBill.cuit || '');
      setRazonSocial(editingBill.razonSocial || '');
      setInvoiceDate(editingBill.date || new Date().toISOString().split('T')[0]);
      setPaymentDate(editingBill.paymentDate || '');
      setDocumentType(editingBill.documentType || 'Factura A');
      setInvoiceNumber(editingBill.invoiceNumber || '');
      setSubtotal(editingBill.subtotal !== undefined ? editingBill.subtotal : '');
      setTaxAmount(editingBill.taxAmount !== undefined ? editingBill.taxAmount : '');
      setPerceptions(editingBill.perceptions !== undefined ? editingBill.perceptions : '');
      setCurrency(editingBill.currency || 'AR$ (Pesos)');
      setTotalAmount(editingBill.amount !== undefined ? editingBill.amount : '');
      setBillStatus(editingBill.status || 'pending');
      setIsProcessed(true);
    } else {
      handleResetForm();
    }
  }, [editingBill, isOpen]);

  if (!isOpen) return null;

  const handleProcessInvoiceWithN8n = async (fileToProcess?: File | null) => {
    const file = fileToProcess !== undefined ? fileToProcess : selectedFile;
    setIsProcessing(true);

    try {
      const result = await sendInvoiceWebhook({
        bill: {
          supplierName: supplierName || '',
          invoiceNumber: invoiceNumber || '',
          date: invoiceDate,
          paymentDate,
          amount: Number(totalAmount) || 0,
          itemsCount: 1,
          status: 'pending'
        },
        file
      });

      if (result.data) {
        const parsed = parseN8nInvoiceResponse(result.data);
        const supplierVal = parsed.supplierName || parsed.razonSocial;
        if (supplierVal) {
          setSupplierName(supplierVal);
          setRazonSocial(supplierVal);
        }
        if (parsed.cuit) setCuit(parsed.cuit);
        if (parsed.documentType) setDocumentType(parsed.documentType);
        if (parsed.invoiceNumber) setInvoiceNumber(parsed.invoiceNumber);
        if (parsed.date) setInvoiceDate(parsed.date);
        if (parsed.paymentDate) setPaymentDate(parsed.paymentDate);
        if (parsed.subtotal !== undefined) setSubtotal(parsed.subtotal);
        if (parsed.taxAmount !== undefined) setTaxAmount(parsed.taxAmount);
        if (parsed.perceptions !== undefined) setPerceptions(parsed.perceptions);
        if (parsed.currency) setCurrency(parsed.currency);
        if (parsed.amount !== undefined) setTotalAmount(parsed.amount);
      }
    } catch (err) {
      console.error('Error procesando factura:', err);
    } finally {
      setIsProcessing(false);
      setIsProcessed(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleProcessInvoiceWithN8n(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      handleProcessInvoiceWithN8n(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSupplier = supplierName.trim() || 'Proveedor General';
    const finalInvoiceNumber = invoiceNumber.trim() || 'FC-0000-0000';
    const finalAmount = Number(totalAmount) || Number(subtotal) || 0;

    const newBillData: Omit<SupplierBill, 'id'> = {
      supplierName: finalSupplier,
      cuit: cuit.trim(),
      razonSocial: razonSocial.trim(),
      documentType,
      invoiceNumber: finalInvoiceNumber,
      date: invoiceDate,
      paymentDate: paymentDate || invoiceDate,
      subtotal: Number(subtotal) || 0,
      taxAmount: Number(taxAmount) || 0,
      perceptions: Number(perceptions) || 0,
      currency,
      amount: finalAmount,
      itemsCount: 1,
      status: billStatus
    };

    setIsSubmittingWebhook(true);

    try {
      if (!editingBill) {
        await sendInvoiceWebhook({
          bill: newBillData,
          file: selectedFile
        });
      }
    } catch (err) {
      console.error('Error enviando webhook:', err);
    } finally {
      setIsSubmittingWebhook(false);
      if (editingBill && onUpdateBill) {
        onUpdateBill(editingBill.id, newBillData);
      } else {
        onSaveBill(newBillData);
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-md md:max-w-lg bg-[#1D1426] text-slate-100 h-full flex flex-col shadow-2xl border-l border-purple-900/50 font-body-md text-xs">
        {/* Header */}
        <div className="flex justify-between items-center px-lg py-md border-b border-purple-900/40 bg-[#2B1D3A]">
          <div className="flex items-center gap-xs font-bold text-sm text-white">
            <span className="material-symbols-outlined text-[#CBB5E2] text-[20px]">
              {editingBill ? 'edit' : 'receipt_long'}
            </span>
            {editingBill ? 'Editar Factura de Proveedor' : 'Cargar Nueva Factura'}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-lg flex flex-col gap-md">
          {/* Mode Switcher Tabs */}
          {!editingBill && (
            <div className="bg-[#160E1E] p-1 rounded-xl flex items-center gap-1 border border-purple-900/40">
              <button
                type="button"
                onClick={() => setLoadMode('automatic')}
                className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-xs transition-all ${
                  loadMode === 'automatic'
                    ? 'bg-[#9A7DB8] text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                Carga Automática
              </button>
              <button
                type="button"
                onClick={() => setLoadMode('manual')}
                className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-xs transition-all ${
                  loadMode === 'manual'
                    ? 'bg-[#9A7DB8] text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                Carga Manual
              </button>
            </div>
          )}

          {/* Archivo de factura * Dropzone (Ubicado ARRIBA del proveedor) */}
          {!editingBill && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-slate-300">Archivo de factura *</label>
              <label
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-purple-900/60 hover:border-[#9A7DB8] bg-[#160E1E]/80 rounded-2xl p-lg flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-[#9A7DB8]/20 text-[#CBB5E2] group-hover:scale-110 flex items-center justify-center mb-xs transition-transform">
                  <span className="material-symbols-outlined text-2xl">description</span>
                </div>
                <span className="font-bold text-xs text-white mb-0.5">
                  {selectedFile ? selectedFile.name : 'Seleccionar o arrastrar factura'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Haz clic o arrastra un PDF o imagen desde tu equipo
                </span>
              </label>
            </div>
          )}

          {/* Process Invoice Button / Loading State in Automatic Mode */}
          {!editingBill && loadMode === 'automatic' && !isProcessed && (
            <div className="flex flex-col gap-sm">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center p-xl gap-sm bg-[#160E1E] border border-purple-900/60 rounded-2xl text-center animate-pulse">
                  <span className="material-symbols-outlined text-3xl text-[#CBB5E2] animate-spin">sync</span>
                  <span className="font-bold text-xs text-white">Procesando datos de la factura...</span>
                  <span className="text-[10px] text-slate-400">Extrayendo proveedor, CUIT, montos e IVA</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleProcessInvoiceWithN8n()}
                  className="bg-[#241731] border border-purple-900/60 hover:border-[#9A7DB8] text-slate-300 hover:text-white py-3 rounded-xl font-bold flex items-center justify-center gap-xs shadow-sm transition-all mt-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#CBB5E2]">auto_awesome</span>
                  Procesar factura
                </button>
              )}
            </div>
          )}

          {/* Form Fields: Only visible in Manual mode OR after data returns OR when editing */}
          {(loadMode === 'manual' || isProcessed || editingBill) && (
            <div className="flex flex-col gap-md pt-sm border-t border-purple-900/40 animate-fade-in">
              {!editingBill && loadMode === 'automatic' && (
                <div className="bg-[#1D2B20] border border-emerald-500/40 text-emerald-300 px-md py-2 rounded-xl text-[11px] font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Datos extraídos automáticamente (revisar antes de guardar)
                </div>
              )}

              {/* Nombre proveedor * & CUIT proveedor * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Nombre proveedor *</label>
                  <input
                    type="text"
                    list="suppliers-list"
                    value={supplierName}
                    onChange={(e) => {
                      setSupplierName(e.target.value);
                      setRazonSocial(e.target.value);
                    }}
                    required
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                  <datalist id="suppliers-list">
                    {registeredSuppliers.map(s => (
                      <option key={s} value={s} />
                    ))}
                    <option value="Distribuidora FarmaVet SA" />
                    <option value="Laboratorios Zoonosis SRL" />
                  </datalist>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">CUIT proveedor *</label>
                  <input
                    type="text"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    required
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
              </div>

              {/* Fecha factura * & Fecha de pago */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Fecha factura *</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Fecha de pago</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
              </div>

              {/* Documento * */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">Documento *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                >
                  <option value="Factura A">Factura A</option>
                  <option value="Factura B">Factura B</option>
                  <option value="Factura C">Factura C</option>
                  <option value="Remito">Remito</option>
                </select>
              </div>

              {/* Número de remito / factura * */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">Número de remito / factura *</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                  className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] font-mono"
                />
              </div>

              {/* Subtotal & Tax */}
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Subtotal sin impuestos ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={subtotal}
                    onChange={(e) => setSubtotal(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">IVA / Impuestos ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
              </div>

              {/* Perceptions & Currency */}
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Percepciones ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={perceptions}
                    onChange={(e) => setPerceptions(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Moneda</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  >
                    <option value="AR$ (Pesos)">AR$ (Pesos)</option>
                    <option value="USD (Dólares)">USD (Dólares)</option>
                  </select>
                </div>
              </div>

              {/* Costo total ($) * */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">Costo total ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] font-bold text-sm text-[#CBB5E2]"
                />
              </div>

              {/* Estado Pago */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">Estado de pago *</label>
                <select
                  value={billStatus}
                  onChange={(e) => setBillStatus(e.target.value as any)}
                  className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                >
                  <option value="pending">PENDIENTE</option>
                  <option value="paid">PAGADO</option>
                </select>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-col gap-sm pt-md mt-auto">
            {(editingBill || shouldShowResetButton(loadMode, isProcessed)) && (
              <button
                type="submit"
                disabled={isSubmittingWebhook}
                className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-xs disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isSubmittingWebhook ? 'sync' : 'save'}
                </span>
                {isSubmittingWebhook ? 'Guardando...' : editingBill ? 'Actualizar Factura' : 'Guardar Factura'}
              </button>
            )}

            <div className="flex items-center gap-md">
              {!editingBill && shouldShowResetButton(loadMode, isProcessed) && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 bg-[#2B1D3A] hover:bg-[#3D2952] border border-purple-900/60 text-[#CBB5E2] py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                  Cargar otra factura
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className={`${!editingBill && shouldShowResetButton(loadMode, isProcessed) ? 'flex-1' : 'w-full'} bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl font-bold text-xs transition-all text-center cursor-pointer`}
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
