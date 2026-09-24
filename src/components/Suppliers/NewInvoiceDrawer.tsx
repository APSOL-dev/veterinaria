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
    <div className="fixed inset-0 z-50 bg-slate-900/25 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-surface-container-lowest text-slate-800 max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-outline-variant/30 overflow-hidden font-body-md text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#5C3C7B] text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 font-bold text-sm text-white">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">
                {editingBill ? 'edit' : 'receipt_long'}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">
                {editingBill ? 'Editar Factura de Proveedor' : 'Cargar Nueva Factura de Proveedor'}
              </h2>
              <p className="text-[11px] text-purple-200 font-medium">
                {editingBill ? 'Modifique los datos y mercadería vinculada' : 'Carga de comprobantes de compras y stock'}
              </p>
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
          {/* Mode Switcher Tabs */}
          {!editingBill && (
            <div className="bg-surface-container/60 p-1 rounded-xl flex items-center gap-1 border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setLoadMode('automatic')}
                className={`flex-1 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-xs transition-all ${
                  loadMode === 'automatic'
                    ? 'bg-[#5C3C7B] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
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
                    ? 'bg-[#5C3C7B] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 font-medium'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                Carga Manual
              </button>
            </div>
          )}

          {/* Archivo de factura * Dropzone */}
          {!editingBill && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-700">Archivo de factura *</label>
              <label
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-outline-variant/60 hover:border-[#5C3C7B] bg-surface-container/30 hover:bg-purple-50/40 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-[#5C3C7B] group-hover:scale-110 flex items-center justify-center mb-1.5 transition-transform">
                  <span className="material-symbols-outlined text-xl">description</span>
                </div>
                <span className="font-semibold text-xs text-slate-800 mb-0.5">
                  {selectedFile ? selectedFile.name : 'Seleccionar o arrastrar factura'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Haz clic o arrastra un PDF o imagen desde tu equipo
                </span>
              </label>
            </div>
          )}

          {/* Process Invoice Button / Loading State / Error State in Automatic Mode */}
          {!editingBill && loadMode === 'automatic' && !isProcessed && (
            <div className="flex flex-col gap-sm">
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center p-6 gap-2 bg-purple-50 border border-purple-200 rounded-2xl text-center animate-pulse">
                  <span className="material-symbols-outlined text-2xl text-[#5C3C7B] animate-spin">sync</span>
                  <span className="font-bold text-xs text-slate-900">Procesando datos de la factura...</span>
                  <span className="text-[10px] text-slate-500">Extrayendo proveedor, CUIT, montos e IVA</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleProcessInvoiceWithN8n()}
                  className="bg-white border border-[#5C3C7B]/40 hover:bg-purple-50 text-[#5C3C7B] hover:text-[#4A2F66] py-2.5 rounded-xl font-bold flex items-center justify-center gap-xs shadow-xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#5C3C7B]">auto_awesome</span>
                  Procesar factura
                </button>
              )}

              {extractionError && (
                <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3.5 rounded-2xl text-xs flex flex-col gap-1.5 animate-fade-in">
                  <div className="flex items-center gap-xs font-bold text-amber-900">
                    <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
                    <span>No se pudieron extraer datos del archivo</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {extractionError}
                  </p>
                  <div className="text-[10px] text-amber-700 pt-1 border-t border-amber-200">
                    Puedes continuar la carga en modo manual o completar los campos abajo.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          {(loadMode === 'manual' || isProcessed || editingBill || extractionError) && (
            <div className="flex flex-col gap-4 pt-2 border-t border-outline-variant/30 animate-fade-in">
              {!editingBill && loadMode === 'automatic' && isProcessed && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[16px] text-emerald-700">check_circle</span>
                  Datos extraídos automáticamente (revisar antes de guardar)
                </div>
              )}

              {/* Nombre proveedor * & CUIT proveedor * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">Nombre proveedor *</label>
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
                  <label className="text-[11px] font-semibold text-slate-700">CUIT proveedor *</label>
                  <input
                    type="text"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    required
                    className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-medium"
                  />
                </div>
              </div>

              {/* Fecha factura * & Fecha de vencimiento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">Fecha factura *</label>
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
                    className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">Fecha de vencimiento *</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    required
                    className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-medium"
                  />
                </div>
              </div>

              {/* Documento & Número */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">Documento *</label>
                  <div className="relative">
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                      className="w-full appearance-none bg-surface-container/60 border border-outline-variant/40 rounded-xl pr-8 pl-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 cursor-pointer font-medium"
                    >
                      <option value="Factura A">Factura A</option>
                      <option value="Factura B">Factura B</option>
                      <option value="Factura C">Factura C</option>
                      <option value="Remito">Remito</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">Número de remito / factura *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder=""
                    required
                    className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-mono font-medium"
                  />
                </div>
              </div>

              {/* Subtotal & Tax */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">Subtotal sin impuestos ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={subtotal}
                    readOnly
                    className="bg-surface-container/30 border border-outline-variant/30 rounded-xl p-2.5 text-xs text-slate-700 outline-none cursor-not-allowed font-medium font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700">IVA / Impuestos ($)</label>
                    <div className="flex items-center gap-1.5 cursor-pointer" onClick={handleToggleIva}>
                      <span className="text-[10px] text-purple-900 font-semibold select-none">
                        {applyIva ? 'IVA (21%)' : 'Sin IVA'}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={applyIva}
                        onClick={(e) => { e.stopPropagation(); handleToggleIva(); }}
                        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out focus:outline-none ${
                          applyIva ? 'bg-[#5C3C7B] border-[#5C3C7B]' : 'bg-slate-300 border-slate-400'
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
                    className={`bg-surface-container/60 border border-outline-variant/40 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] font-mono ${!applyIva ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Mercadería Recibida / Productos */}
              <div className="flex flex-col gap-xs p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2 mb-2">
                  <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#5C3C7B]">inventory_2</span>
                    <span>Productos / Mercadería recibida</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddBillItem}
                    className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Agregar ítem</span>
                  </button>
                </div>

                {billItems.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic text-center py-2">
                    No hay productos vinculados. Haz clic en "+ Agregar ítem" para asociar la entrada de stock a esta factura.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {billItems.map((item) => (
                      <div key={item.id} className="p-3 bg-white rounded-xl border border-outline-variant/30 flex flex-col gap-2 shadow-2xs">
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
                            className="shrink-0 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-outline-variant/30 hover:border-rose-200 p-2 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                            title="Eliminar ítem"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-600 font-medium block">Cant. recibida</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleBillItemChange(item.id, 'quantity', e.target.value)}
                              className="w-full bg-surface-container/50 border border-outline-variant/30 rounded-lg p-1.5 text-xs text-slate-900 text-center outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-600 font-medium block">Costo unit. ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitCost}
                              onChange={(e) => handleBillItemChange(item.id, 'unitCost', e.target.value)}
                              className="w-full bg-surface-container/50 border border-outline-variant/30 rounded-lg p-1.5 text-xs text-slate-900 text-right outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-600 font-medium block">Subtotal ($)</label>
                            <div className="p-1.5 text-right font-bold text-slate-900 font-mono">
                              ${(item.subtotal || 0).toLocaleString('es-AR')}
                            </div>
                          </div>
                        </div>

                        <label className="flex items-center gap-1.5 text-[10px] text-purple-900 font-medium cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!item.updateCatalogPrice}
                            onChange={(e) => handleBillItemChange(item.id, 'updateCatalogPrice', e.target.checked)}
                            className="rounded accent-[#5C3C7B]"
                          />
                          <span>Actualizar precio en el catálogo</span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Perceptions & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">Percepciones ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={perceptions}
                    onChange={(e) => {
                      const newPerc = e.target.value === '' ? '' : Number(e.target.value);
                      setPerceptions(newPerc);
                      updateTotalsFromItems(billItems, newPerc, applyIva);
                    }}
                    className="bg-surface-container/60 border border-outline-variant/40 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-700">Moneda</label>
                  <div className="relative">
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full appearance-none bg-surface-container/60 border border-outline-variant/40 rounded-xl pr-8 pl-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 cursor-pointer font-medium"
                    >
                      <option value="AR$ (Pesos)">AR$ (Pesos)</option>
                      <option value="USD (Dólares)">USD (Dólares)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Costo total ($) * */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Costo total ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalAmount}
                  readOnly
                  required
                  className="bg-surface-container/30 border border-outline-variant/30 rounded-xl p-2.5 text-sm text-slate-900 font-bold font-mono outline-none cursor-not-allowed"
                />
              </div>

              {/* Estado Pago */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-700">Estado de pago *</label>
                <div className="relative">
                  <select
                    value={billStatus}
                    onChange={(e) => setBillStatus(e.target.value as any)}
                    className="w-full appearance-none bg-surface-container/60 border border-outline-variant/40 rounded-xl pr-8 pl-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 cursor-pointer font-medium"
                  >
                    <option value="pending">PENDIENTE</option>
                    <option value="paid">PAGADO</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none text-[18px]">expand_more</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="bg-surface-container-low p-4 px-6 border-t border-outline-variant/30 flex items-center justify-end gap-3 mt-4 shrink-0 -mx-6 -mb-6">
            {!editingBill && shouldShowResetButton(loadMode, isProcessed) && (
              <button
                type="button"
                onClick={handleResetForm}
                className="bg-white hover:bg-slate-100 border border-outline-variant/40 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                Cargar otra factura
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-100 border border-outline-variant/40 text-slate-700 px-4 py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {(editingBill || shouldShowResetButton(loadMode, isProcessed)) && (
              <button
                type="submit"
                disabled={isSubmittingWebhook}
                className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isSubmittingWebhook ? 'sync' : 'save'}
                </span>
                <span>{isSubmittingWebhook ? 'Guardando...' : editingBill ? 'Actualizar Factura' : 'Guardar Factura'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
