import React, { useState, useEffect } from 'react';
import { SupplierBill, SupplierBillItem, SupplierCreditTerm, Product } from '../../domain/types';
import { sendInvoiceWebhook, parseN8nInvoiceResponse } from '../../domain/services/webhookService';
import { resetInvoiceDrawerState, shouldShowResetButton, getSupplierCreditTerms, calculateDueDateFromTerm, calculateInvoiceSubtotalAndTax } from '../../domain/services/supplierService';
import { uploadInvoiceVoucherToSupabase } from '../../domain/services/supabaseService';
import { initialProducts } from '../../data/mockData';
import { SearchableProductSelect } from '../Common/SearchableProductSelect';
import { SearchableSupplierSelect } from '../Common/SearchableSupplierSelect';

interface NewInvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBill: (bill: Omit<SupplierBill, 'id'>) => void;
  onUpdateBill?: (id: string, bill: Omit<SupplierBill, 'id'>) => void;
  editingBill?: SupplierBill | null;
  registeredSuppliers?: string[];
  creditTerms?: SupplierCreditTerm[];
  products?: Product[];
}

export const NewInvoiceDrawer: React.FC<NewInvoiceDrawerProps> = ({
  isOpen,
  onClose,
  onSaveBill,
  onUpdateBill,
  editingBill,
  registeredSuppliers = ['Distribuidora FarmaVet SA', 'Laboratorios Zoonosis SRL', 'Insumos Médicos del Plata', 'Distribuidora Veterinaria Sur'],
  creditTerms = [],
  products = []
}) => {
  const availableProducts = products && products.length > 0 ? products : initialProducts;
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
  const [billItems, setBillItems] = useState<SupplierBillItem[]>([]);

  const [applyIva, setApplyIva] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isProcessed, setIsProcessed] = useState<boolean>(false);
  const [isSubmittingWebhook, setIsSubmittingWebhook] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const updateTotalsFromItems = (
    items: SupplierBillItem[], 
    currentPerceptions: number | '', 
    useIva: boolean = applyIva
  ) => {
    const perc = Number(currentPerceptions) || 0;
    if (items.length > 0) {
      const { totalAmount: newTotal, subtotal: newSubtotal, taxAmount: newTax } = calculateInvoiceSubtotalAndTax(
        items,
        useIva,
        0.21,
        perc
      );
      setTotalAmount(newTotal);
      setSubtotal(newSubtotal);
      setTaxAmount(newTax);
    } else {
      const tot = Number(totalAmount) || Number(subtotal) || 0;
      if (tot > 0) {
        const { subtotal: newSubtotal, taxAmount: newTax } = calculateInvoiceSubtotalAndTax(
          [{ subtotal: tot - perc }],
          useIva,
          0.21,
          perc
        );
        setTotalAmount(tot);
        setSubtotal(newSubtotal);
        setTaxAmount(newTax);
      }
    }
  };

  const handleToggleIva = () => {
    const nextApply = !applyIva;
    setApplyIva(nextApply);
    updateTotalsFromItems(billItems, perceptions, nextApply);
  };

  const handleAddBillItem = () => {
    const defaultProduct = availableProducts.length > 0 ? availableProducts[0] : null;
    const newItem: SupplierBillItem = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      productId: defaultProduct?.id || '',
      productName: defaultProduct?.name || '',
      category: defaultProduct?.category,
      quantity: 1,
      unitCost: defaultProduct?.price || 0,
      subtotal: defaultProduct?.price || 0,
      updateCatalogPrice: false
    };
    const updated = [...billItems, newItem];
    setBillItems(updated);
    updateTotalsFromItems(updated, perceptions, applyIva);
  };

  const handleRemoveBillItem = (id: string) => {
    const updated = billItems.filter(item => item.id !== id);
    setBillItems(updated);
    updateTotalsFromItems(updated, perceptions, applyIva);
  };

  const handleBillItemChange = (id: string, field: keyof SupplierBillItem, value: any) => {
    const updated = billItems.map(item => {
      if (item.id !== id) return item;

      let updatedItem = { ...item, [field]: value };

      if (field === 'productId') {
        const selectedProd = availableProducts.find(p => p.id === value);
        if (selectedProd) {
          updatedItem.productName = selectedProd.name;
          updatedItem.category = selectedProd.category;
          updatedItem.unitCost = selectedProd.price;
          updatedItem.subtotal = item.quantity * selectedProd.price;
        } else {
          updatedItem.productId = undefined;
        }
      }

      if (field === 'quantity') {
        const qty = Number(value) || 0;
        updatedItem.quantity = qty;
        updatedItem.subtotal = qty * Number(updatedItem.unitCost || 0);
      } else if (field === 'unitCost') {
        const cost = Number(value) || 0;
        updatedItem.unitCost = cost;
        updatedItem.subtotal = Number(updatedItem.quantity || 0) * cost;
      }

      return updatedItem;
    });

    setBillItems(updated);
    updateTotalsFromItems(updated, perceptions, applyIva);
  };

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
    setBillItems([]);
    setApplyIva(true);
    setIsProcessing(fresh.isProcessing);
    setIsProcessed(fresh.isProcessed);
    setExtractionError(null);
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
      setApplyIva(editingBill.taxAmount === undefined || editingBill.taxAmount > 0);
      setPerceptions(editingBill.perceptions !== undefined ? editingBill.perceptions : '');
      setCurrency(editingBill.currency || 'AR$ (Pesos)');
      setTotalAmount(editingBill.amount !== undefined ? editingBill.amount : '');
      setBillStatus(editingBill.status || 'pending');
      setBillItems(editingBill.items || []);
      setIsProcessed(true);
      setExtractionError(null);
    } else {
      handleResetForm();
    }
  }, [editingBill, isOpen]);

  if (!isOpen) return null;

  const handleProcessInvoiceWithN8n = async (fileToProcess?: File | null) => {
    const file = fileToProcess !== undefined ? fileToProcess : selectedFile;
    setIsProcessing(true);
    setExtractionError(null);

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

      if (!result.success) {
        setExtractionError(result.error || 'Error de comunicación con el webhook de n8n.');
        setIsProcessed(false);
        return;
      }

      if (result.data) {
        const parsed = parseN8nInvoiceResponse(result.data);
        const hasExtractedData = Boolean(
          parsed.supplierName ||
          parsed.razonSocial ||
          parsed.cuit ||
          parsed.invoiceNumber ||
          parsed.amount ||
          parsed.subtotal ||
          (parsed.items && parsed.items.length > 0)
        );

        if (hasExtractedData) {
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
          if (parsed.items && parsed.items.length > 0) {
            setBillItems(parsed.items);
          }
          setIsProcessed(true);
          setExtractionError(null);
        } else {
          setExtractionError('El flujo de n8n respondió con éxito (HTTP 200), pero no devolvió ningún dato extraído. Verifica en n8n que el nodo Webhook tenga "Respond" en "Using Respond to Webhook Node" y que el flujo devuelva la respuesta con los datos.');
          setIsProcessed(false);
        }
      } else {
        setExtractionError('El flujo de n8n respondió con éxito (HTTP 200), pero la respuesta vino vacía. Verifica la configuración del flujo en n8n.');
        setIsProcessed(false);
      }
    } catch (err: any) {
      console.error('Error procesando factura:', err);
      setExtractionError(err.message || 'Error al conectar con n8n.');
      setIsProcessed(false);
    } finally {
      setIsProcessing(false);
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
    const finalInvoiceNumber = invoiceNumber.trim() || 'S/N';
    const finalAmount = Number(totalAmount) || Number(subtotal) || 0;

    let voucherName = editingBill?.voucherName;
    let voucherUrl = editingBill?.voucherUrl;

    if (selectedFile) {
      const uploadRes = await uploadInvoiceVoucherToSupabase(selectedFile);
      if (uploadRes) {
        voucherName = uploadRes.voucherName;
        voucherUrl = uploadRes.voucherUrl;
      } else {
        voucherName = selectedFile.name;
      }
    }

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
      itemsCount: billItems.length || 1,
      status: billStatus,
      voucherName,
      voucherUrl,
      items: billItems
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
      <div className="w-full max-w-lg md:max-w-xl lg:max-w-2xl bg-[#1D1426] text-slate-100 h-full flex flex-col shadow-2xl border-l border-purple-900/50 font-body-md text-xs">
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

          {/* Process Invoice Button / Loading State / Error State in Automatic Mode */}
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

              {extractionError && (
                <div className="bg-[#2C1818] border border-amber-500/50 text-amber-200 p-md rounded-2xl text-xs flex flex-col gap-1.5 animate-fade-in mt-xs">
                  <div className="flex items-center gap-xs font-bold text-amber-400">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    <span>No se pudieron extraer datos del archivo</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    {extractionError}
                  </p>
                  <div className="text-[10px] text-amber-300/80 pt-1 border-t border-amber-500/20">
                    Puedes continuar la carga en modo manual o completar los campos abajo.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields: Only visible in Manual mode OR after data returns OR when editing OR when extraction error occurs */}
          {(loadMode === 'manual' || isProcessed || editingBill || extractionError) && (
            <div className="flex flex-col gap-md pt-sm border-t border-purple-900/40 animate-fade-in">
              {!editingBill && loadMode === 'automatic' && isProcessed && (
                <div className="bg-[#1D2B20] border border-emerald-500/40 text-emerald-300 px-md py-2 rounded-xl text-[11px] font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Datos extraídos automáticamente (revisar antes de guardar)
                </div>
              )}

              {/* Nombre proveedor * & CUIT proveedor * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Nombre proveedor *</label>
                  <SearchableSupplierSelect
                    suppliers={registeredSuppliers}
                    value={supplierName}
                    onChange={(name) => {
                      setSupplierName(name);
                      setRazonSocial(name);
                      if (name.trim()) {
                        const term = getSupplierCreditTerms(name, creditTerms);
                        const calculated = calculateDueDateFromTerm(invoiceDate, term.termDays);
                        setPaymentDate(calculated);
                      }
                    }}
                    required
                  />
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

              {/* Fecha factura * & Fecha de vencimiento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Fecha factura *</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setInvoiceDate(newDate);
                      if (supplierName.trim()) {
                        const term = getSupplierCreditTerms(supplierName, creditTerms);
                        setPaymentDate(calculateDueDateFromTerm(newDate, term.termDays));
                      }
                    }}
                    required
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Fecha de vencimiento *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
              </div>

              {/* Documento * */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">Documento *</label>
                <div className="relative">
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full appearance-none bg-[#160E1E] border border-purple-900/60 rounded-xl pr-8 pl-2.5 py-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] cursor-pointer"
                  >
                    <option value="Factura A">Factura A</option>
                    <option value="Factura B">Factura B</option>
                    <option value="Factura C">Factura C</option>
                    <option value="Remito">Remito</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#CBB5E2] pointer-events-none text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Número de remito / factura * */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">Número de remito / factura *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej: 000100012345"
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
                    readOnly
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] opacity-90 cursor-not-allowed font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">IVA / Impuestos ($)</label>
                    <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleToggleIva}>
                      <span className="text-[10px] text-purple-200 font-semibold select-none">
                        {applyIva ? 'IVA (21%)' : 'Sin IVA'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={applyIva}
                        onClick={(e) => { e.stopPropagation(); handleToggleIva(); }}
                        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border border-purple-800 transition-colors duration-200 ease-in-out focus:outline-none ${
                          applyIva ? 'bg-[#9A7DB8]' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out mt-[1px] ${
                            applyIva ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    readOnly={!applyIva}
                    disabled={!applyIva}
                    onChange={(e) => {
                      const newTax = e.target.value === '' ? 0 : Number(e.target.value);
                      setTaxAmount(newTax);
                      const tot = Number(totalAmount) || 0;
                      setSubtotal(tot - newTax);
                    }}
                    className={`bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] ${!applyIva ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Mercadería Recibida / Productos */}
              <div className="flex flex-col gap-xs p-md bg-[#160E1E] rounded-xl border border-purple-900/60 mt-xs">
                <div className="flex justify-between items-center border-b border-purple-900/40 pb-2 mb-xs">
                  <label className="text-xs font-semibold text-[#CBB5E2] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                    <span>Productos / Mercadería recibida</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBillItem}
                    className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Agregar ítem</span>
                  </button>
                </div>

                {billItems.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic text-center py-2">
                    No hay productos vinculados. Haz clic en "+ Agregar ítem" para asociar la entrada de stock a esta factura.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {billItems.map((item) => (
                      <div key={item.id} className="p-3 bg-[#251733] rounded-xl border border-purple-900/40 flex flex-col gap-2 shadow-xs">
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-1 min-w-0">
                            <SearchableProductSelect
                              products={availableProducts}
                              selectedProductId={item.productId}
                              selectedProductName={item.productName}
                              onSelectProduct={({ productId, productName, price, category }) => {
                                const updated = billItems.map(it => {
                                  if (it.id !== item.id) return it;
                                  const unitCost = price !== undefined ? price : it.unitCost;
                                  const quantity = it.quantity || 1;
                                  return {
                                    ...it,
                                    productId,
                                    productName,
                                    category: (category as any) || it.category,
                                    unitCost,
                                    subtotal: quantity * unitCost
                                  };
                                });
                                setBillItems(updated);
                                updateTotalsFromItems(updated, perceptions, applyIva);
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBillItem(item.id)}
                            className="shrink-0 bg-[#160E1E] hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-purple-900/60 hover:border-red-900/60 p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                            title="Eliminar ítem"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-300 block">Cant. recibida</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleBillItemChange(item.id, 'quantity', e.target.value)}
                              className="w-full bg-[#160E1E] border border-purple-900/60 rounded-lg p-1.5 text-xs text-white text-center outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-300 block">Costo unit. ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitCost}
                              onChange={(e) => handleBillItemChange(item.id, 'unitCost', e.target.value)}
                              className="w-full bg-[#160E1E] border border-purple-900/60 rounded-lg p-1.5 text-xs text-white text-right outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-300 block">Subtotal ($)</label>
                            <div className="p-1.5 text-right font-semibold text-[#CBB5E2]">
                              ${(item.subtotal || 0).toLocaleString('es-AR')}
                            </div>
                          </div>
                        </div>

                        <label className="flex items-center gap-1.5 text-[10px] text-purple-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!item.updateCatalogPrice}
                            onChange={(e) => handleBillItemChange(item.id, 'updateCatalogPrice', e.target.checked)}
                            className="rounded accent-[#9A7DB8]"
                          />
                          <span>Actualizar precio en el catálogo</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Perceptions & Currency */}
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Percepciones ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={perceptions}
                    onChange={(e) => {
                      const newPerc = e.target.value === '' ? '' : Number(e.target.value);
                      setPerceptions(newPerc);
                      updateTotalsFromItems(billItems, newPerc, applyIva);
                    }}
                    className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-slate-300">Moneda</label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full appearance-none bg-[#160E1E] border border-purple-900/60 rounded-xl pr-8 pl-2.5 py-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] cursor-pointer"
                    >
                      <option value="AR$ (Pesos)">AR$ (Pesos)</option>
                      <option value="USD (Dólares)">USD (Dólares)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#CBB5E2] pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Costo total ($) * */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">Costo total ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  readOnly
                  required
                  className="bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-[#CBB5E2] font-bold text-sm outline-none cursor-not-allowed opacity-90"
                />
              </div>

              {/* Estado Pago */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-300">Estado de pago *</label>
                <div className="relative">
                  <select
                    value={billStatus}
                    onChange={(e) => setBillStatus(e.target.value as any)}
                    className="w-full appearance-none bg-[#160E1E] border border-purple-900/60 rounded-xl pr-8 pl-2.5 py-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] cursor-pointer"
                  >
                    <option value="pending">PENDIENTE</option>
                    <option value="paid">PAGADO</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#CBB5E2] pointer-events-none text-[18px]">expand_more</span>
                </div>
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
