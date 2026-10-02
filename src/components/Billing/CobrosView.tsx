import React, { useState, useEffect, useMemo } from 'react';
import html2pdf from 'html2pdf.js';
import { Patient, BillReceipt, DocumentType, PaymentMethod, BillItem, Product, ServiceCatalogItem, TutorAccountMovement } from '../../domain/types';
import { AppNotificationModal } from '../Common/AppNotificationModal';
import { SearchablePatientSelect } from '../Common/SearchablePatientSelect';
import { formatPriceInputDisplay, parsePriceInput } from '../../domain/services/billingService';
import { filterAndSortReceipts, BillingHistoryDatePreset } from '../../domain/services/billingHistoryService';
import { ComprobanteDetailModal } from './ComprobanteDetailModal';
import { formatDate } from '../../utils/dateUtils';

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
    voucherName?: string;
    voucherUrl?: string;
    posNumber?: string;
    customInvoiceNumber?: string;
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
  const [posNumber, setPosNumber] = useState<string>('0001');
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('efectivo');
  const [isAfip, setIsAfip] = useState(false);
  const [applyTax, setApplyTax] = useState(false);
  const [taxPercent, setTaxPercent] = useState(21);
  const [voucherName, setVoucherName] = useState<string>('');
  const [voucherUrl, setVoucherUrl] = useState<string>('');

  // Modal Add Item state with Catalog Selection
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemType, setItemType] = useState<'servicio' | 'producto'>('servicio');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('');
  const [selectedCatalogItemId, setSelectedCatalogItemId] = useState<string>('');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
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
  const availableCatalogItems = useMemo(() => {
    return itemType === 'servicio'
      ? servicesCatalog.filter(s => s.isActive && (!selectedCategoryFilter || s.category === selectedCategoryFilter))
      : products.filter(p => !selectedCategoryFilter || p.category === selectedCategoryFilter);
  }, [itemType, servicesCatalog, products, selectedCategoryFilter]);

  // Filter items by search query in real time
  const filteredCatalogItems = useMemo(() => {
    if (!itemSearchQuery.trim()) {
      return availableCatalogItems;
    }
    const q = itemSearchQuery.toLowerCase().trim();
    return availableCatalogItems.filter(item =>
      item.name.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      item.price.toString().includes(q)
    );
  }, [availableCatalogItems, itemSearchQuery]);

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

    if (!customInvoiceNumber || !customInvoiceNumber.trim()) {
      setNotifModal({
        isOpen: true,
        message: 'Debe ingresar el número de factura/comprobante antes de emitir.'
      });
      return;
    }

    if (!voucherUrl) {
      setNotifModal({
        isOpen: true,
        message: 'Debe adjuntar el archivo del comprobante o factura (PDF o imagen).'
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
      patientId: currentPatient.id,
      voucherName: voucherName || undefined,
      voucherUrl: voucherUrl || undefined,
      posNumber: posNumber || '0001',
      customInvoiceNumber: customInvoiceNumber.trim() || undefined
    });

    setItems([]);
    setVoucherName('');
    setVoucherUrl('');
    setPosNumber('0001');
    setCustomInvoiceNumber('');
    if (onNavigateToHistorial) {
      onNavigateToHistorial();
    }
  };

  // Historial de cobros state
  const [historialSearchQuery, setHistorialSearchQuery] = useState('');
  const [historialDocType, setHistorialDocType] = useState<DocumentType | 'all'>('all');
  const [historialPaymentMethod, setHistorialPaymentMethod] = useState<PaymentMethod | 'all'>('all');
  const [historialDatePreset, setHistorialDatePreset] = useState<BillingHistoryDatePreset>('all');
  const [historialSortBy, setHistorialSortBy] = useState<'receiptNumber' | 'date' | 'ownerName' | 'documentType' | 'paymentMethod' | 'total' | 'itemsCount'>('date');
  const [historialSortDir, setHistorialSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedMovementForDetail, setSelectedMovementForDetail] = useState<TutorAccountMovement | null>(null);

  const filteredAndSortedReceipts = useMemo(() => {
    return filterAndSortReceipts(receipts, {
      searchQuery: historialSearchQuery,
      documentType: historialDocType,
      paymentMethod: historialPaymentMethod,
      datePreset: historialDatePreset,
      sortBy: historialSortBy,
      sortDirection: historialSortDir
    });
  }, [receipts, historialSearchQuery, historialDocType, historialPaymentMethod, historialDatePreset, historialSortBy, historialSortDir]);

  // Historial metrics
  const totalFacturado = useMemo(() => {
    return filteredAndSortedReceipts.reduce((acc, r) => acc + (r.totalAmount ?? r.total ?? 0), 0);
  }, [filteredAndSortedReceipts]);

  const hasActiveHistorialFilters = historialSearchQuery !== '' || historialDocType !== 'all' || historialPaymentMethod !== 'all' || historialDatePreset !== 'all';

  const handleClearHistorialFilters = () => {
    setHistorialSearchQuery('');
    setHistorialDocType('all');
    setHistorialPaymentMethod('all');
    setHistorialDatePreset('all');
  };

  const handleToggleSort = (field: 'receiptNumber' | 'date' | 'ownerName' | 'documentType' | 'paymentMethod' | 'total' | 'itemsCount') => {
    if (historialSortBy === field) {
      setHistorialSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setHistorialSortBy(field);
      setHistorialSortDir(field === 'total' || field === 'date' ? 'desc' : 'asc');
    }
  };

  const handleOpenReceiptDetail = (rec: BillReceipt) => {
    const mov: TutorAccountMovement = {
      id: rec.id,
      date: rec.date,
      tutorName: rec.ownerName || rec.clientName || 'Sin tutor',
      concept: `Comprobante ${rec.receiptNumber || rec.id}`,
      detail: rec.items && rec.items.length > 0
        ? rec.items.map(i => `${i.quantity}x ${i.description}`).join(', ')
        : 'Cobro registrado',
      debe: rec.totalAmount ?? rec.total ?? 0,
      haber: 0,
      saldo: 0,
      type: 'receipt',
      receipt: rec,
      voucherName: rec.voucherName,
      voucherUrl: rec.voucherUrl
    };
    setSelectedMovementForDetail(mov);
  };

  if (activeSubmodule === 'historial-cobros') {
    return (
      <div className="flex flex-col w-full flex-1 gap-md font-body-md text-slate-800 h-full overflow-y-auto p-md lg:p-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm">
          <div>
            <h1 className="font-display-lg text-lg lg:text-[22px] text-slate-900 font-semibold leading-tight">
              Cobros — Historial de Facturación y Recibos
            </h1>
            <p className="font-body-md text-xs text-slate-600 font-normal mt-0.5">
              Consulta, filtrado avanzado y ordenamiento de comprobantes emitidos, facturas y recibos
            </p>
          </div>
          <div className="flex items-center gap-sm flex-wrap">
            <div className="bg-white rounded-2xl px-4 py-2 border border-purple-200 shadow-2xs flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[#7B5EA7] text-[20px]">payments</span>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Facturado</span>
                <span className="text-base lg:text-lg font-bold text-[#5C3C7B] leading-tight">
                  $ {totalFacturado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            {hasActiveHistorialFilters && (
              <button
                onClick={handleClearHistorialFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                <span>Limpiar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search query */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={historialSearchQuery}
                onChange={(e) => setHistorialSearchQuery(e.target.value)}
                placeholder="Buscar por Nº, tutor, mascota, concepto..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 outline-none transition-all"
              />
              {historialSearchQuery && (
                <button
                  onClick={() => setHistorialSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Document type filter */}
            <div>
              <select
                value={historialDocType}
                onChange={(e) => setHistorialDocType(e.target.value as any)}
                aria-label="Filtrar por tipo de comprobante"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 outline-none transition-all cursor-pointer"
              >
                <option value="all">Todos los comprobantes</option>
                <option value="factura-a">Factura A</option>
                <option value="factura-b">Factura B</option>
                <option value="factura-c">Factura C</option>
                <option value="remito">Remito</option>
              </select>
            </div>

            {/* Payment method filter */}
            <div>
              <select
                value={historialPaymentMethod}
                onChange={(e) => setHistorialPaymentMethod(e.target.value as any)}
                aria-label="Filtrar por medio de pago"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 outline-none transition-all cursor-pointer"
              >
                <option value="all">Todos los medios de pago</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta (Débito/Crédito)</option>
                <option value="transferencia">Transferencia bancaria</option>
                <option value="cuenta-corriente">Cuenta corriente</option>
              </select>
            </div>

            {/* Date range preset */}
            <div>
              <select
                value={historialDatePreset}
                onChange={(e) => setHistorialDatePreset(e.target.value as any)}
                aria-label="Filtrar por período de fecha"
                className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 outline-none transition-all cursor-pointer"
              >
                <option value="all">Todos los períodos</option>
                <option value="today">Hoy</option>
                <option value="last_7_days">Últimos 7 días</option>
                <option value="this_month">Este mes</option>
                <option value="this_year">Este año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200">
          <div className="w-full overflow-x-auto border border-slate-200 rounded-xl max-h-[580px] overflow-y-auto">
            <table className="w-full text-left font-body-md text-xs whitespace-nowrap border-collapse">
              <thead className="sticky top-0 bg-slate-100 z-10">
                <tr className="text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th
                    onClick={() => handleToggleSort('receiptNumber')}
                    className="p-sm px-md cursor-pointer hover:bg-slate-200/70 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Comprobante Nº</span>
                      <span className="text-[12px] text-slate-400">
                        {historialSortBy === 'receiptNumber' ? (historialSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('date')}
                    className="p-sm px-md cursor-pointer hover:bg-slate-200/70 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Fecha</span>
                      <span className="text-[12px] text-slate-400">
                        {historialSortBy === 'date' ? (historialSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('ownerName')}
                    className="p-sm px-md cursor-pointer hover:bg-slate-200/70 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tutor / Paciente</span>
                      <span className="text-[12px] text-slate-400">
                        {historialSortBy === 'ownerName' ? (historialSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('documentType')}
                    className="p-sm px-md cursor-pointer hover:bg-slate-200/70 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Tipo doc</span>
                      <span className="text-[12px] text-slate-400">
                        {historialSortBy === 'documentType' ? (historialSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th
                    onClick={() => handleToggleSort('paymentMethod')}
                    className="p-sm px-md cursor-pointer hover:bg-slate-200/70 select-none transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Medio pago</span>
                      <span className="text-[12px] text-slate-400">
                        {historialSortBy === 'paymentMethod' ? (historialSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th className="p-sm px-md">
                    <span>Conceptos / Ítems</span>
                  </th>
                  <th
                    onClick={() => handleToggleSort('total')}
                    className="p-sm px-md text-right cursor-pointer hover:bg-slate-200/70 select-none transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total</span>
                      <span className="text-[12px] text-slate-400">
                        {historialSortBy === 'total' ? (historialSortDir === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                  <th className="p-sm px-md text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 divide-y divide-slate-100">
                {filteredAndSortedReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-xl text-center text-slate-500 text-xs font-medium">
                      <div className="flex flex-col items-center justify-center gap-2 py-8">
                        <span className="material-symbols-outlined text-slate-400 text-[36px]">receipt_long</span>
                        <span className="font-semibold text-slate-700">No se encontraron cobros registrados con los criterios seleccionados.</span>
                        {hasActiveHistorialFilters ? (
                          <button
                            onClick={handleClearHistorialFilters}
                            className="mt-1 text-xs text-[#5C3C7B] hover:underline font-semibold cursor-pointer"
                          >
                            Limpiar filtros de búsqueda
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Los comprobantes emitidos desde "Nueva facturación" aparecerán listados aquí.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedReceipts.map((rec) => (
                    <tr
                      key={rec.id}
                      onClick={() => handleOpenReceiptDetail(rec)}
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="p-sm px-md font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-semibold">{rec.receiptNumber}</span>
                          {rec.afipCae && (
                            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
                              <span className="material-symbols-outlined text-[11px]">verified</span>
                              CAE: {rec.afipCae}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-sm px-md text-slate-700">{formatDate(rec.date)}</td>
                      <td className="p-sm px-md font-medium text-slate-900">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{rec.ownerName || rec.clientName || 'Sin tutor'}</span>
                          {rec.patientName && (
                            <span className="text-slate-500 font-normal text-[11px] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">pets</span>
                              {rec.patientName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-sm px-md">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-purple-50 text-[#5C3C7B] border border-purple-200 uppercase">
                          {rec.documentType.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="p-sm px-md capitalize text-slate-800">
                        <span className="inline-flex items-center gap-1 text-xs">
                          {rec.paymentMethod === 'efectivo' && <span className="material-symbols-outlined text-[14px] text-emerald-600">payments</span>}
                          {rec.paymentMethod === 'tarjeta' && <span className="material-symbols-outlined text-[14px] text-blue-600">credit_card</span>}
                          {rec.paymentMethod === 'transferencia' && <span className="material-symbols-outlined text-[14px] text-indigo-600">account_balance</span>}
                          {rec.paymentMethod === 'cuenta-corriente' && <span className="material-symbols-outlined text-[14px] text-amber-600">account_balance_wallet</span>}
                          {rec.paymentMethod.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="p-sm px-md max-w-[220px] truncate text-slate-600" title={rec.items?.map(i => `${i.quantity}x ${i.description}`).join(', ')}>
                        {rec.items && rec.items.length > 0 ? (
                          <span className="text-[11px]">
                            {rec.items[0].description}
                            {rec.items.length > 1 && ` (+${rec.items.length - 1} más)`}
                          </span>
                        ) : (
                          <span className="italic text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="p-sm px-md text-right font-bold text-slate-900">
                        $ {(rec.totalAmount ?? rec.total ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="p-sm px-md text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenReceiptDetail(rec)}
                            className="p-1.5 text-slate-600 hover:text-[#5C3C7B] hover:bg-purple-100/60 rounded-lg transition-colors cursor-pointer"
                            title="Ver detalle del comprobante"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          {rec.voucherUrl ? (
                            <a
                              href={rec.voucherUrl}
                              download={rec.voucherName || `Factura_${rec.receiptNumber || rec.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                if (rec.voucherUrl?.startsWith('data:')) {
                                  e.preventDefault();
                                  const link = document.createElement('a');
                                  link.href = rec.voucherUrl;
                                  link.download = rec.voucherName || `Factura_${rec.receiptNumber || rec.id}`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }
                              }}
                              className="p-1.5 text-[#5C3C7B] hover:bg-purple-100/60 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                              title={`Descargar adjunto: ${rec.voucherName || 'Factura'}`}
                            >
                              <span className="material-symbols-outlined text-[18px]">download</span>
                            </a>
                          ) : (
                            <span className="p-1.5 text-slate-300">
                              <span className="material-symbols-outlined text-[18px]">attachment</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detail */}
        {selectedMovementForDetail && (
          <ComprobanteDetailModal
            isOpen={!!selectedMovementForDetail}
            movement={selectedMovementForDetail}
            onClose={() => setSelectedMovementForDetail(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 gap-md font-body-md text-slate-800 h-full overflow-y-auto p-2 sm:p-4 lg:p-0 lg:overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-sm shrink-0 mb-md">
        <div>
          <h1 className="font-display-lg text-lg lg:text-[22px] text-slate-900 font-semibold leading-tight">Cobros — Nueva facturación</h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            Paciente seleccionado: <strong className="text-slate-900 font-semibold">{currentPatient.name}</strong> ({currentPatient.species}, {currentPatient.breed} • Dueño: {currentPatient.ownerName})
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-sm">
          {/* Patient Selector */}
          <SearchablePatientSelect
            patients={patients}
            selectedPatientId={targetPatientId}
            onSelectPatient={setTargetPatientId}
            labelPrefix="Cambiar paciente:"
            variant="short"
          />

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-md lg:flex-1 lg:overflow-hidden">
        {/* Left Section: Bill Items (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-md lg:h-full lg:overflow-hidden">
          <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex flex-col lg:flex-1 lg:overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-sm mb-sm shrink-0">
              <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">receipt_long</span>
                Conceptos a facturar
              </h2>

              <button
                type="button"
                onClick={() => setShowAddItemModal(true)}
                className="bg-[#7B5EA7] hover:bg-[#654B8C] text-white px-4 py-2 rounded-xl font-label-md text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Agregar ítem</span>
              </button>
            </div>

            {/* Table Container */}
            <div className="lg:flex-1 lg:overflow-y-auto relative z-10">
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
                                inputMode="decimal"
                                min={0}
                                step={100}
                                value={item.unitPrice}
                                onChange={(e) => handleUpdatePrice(item.id, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="w-24 text-right bg-white border border-slate-300 rounded py-1 px-2 text-slate-900 font-semibold text-base sm:text-xs focus:ring-2 focus:ring-[#9A7DB8] outline-none shadow-xs"
                              />
                            </div>
                          </td>
                          <td className="p-sm px-md text-center">
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              min={0}
                              max={100}
                              value={item.discountPercent}
                              onChange={(e) => handleUpdateDiscount(item.id, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              className="w-12 text-center bg-white border border-slate-300 rounded py-1 text-slate-900 font-semibold text-base sm:text-xs focus:ring-2 focus:ring-[#9A7DB8] outline-none"
                            />
                          </td>
                          <td className="p-sm px-md text-right font-semibold text-slate-900 text-xs">
                            $ {itemSubAfterDesc.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-sm px-md text-center">
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-red-600 transition-colors p-2 rounded-xl hover:bg-red-50 cursor-pointer"
                              title="Eliminar concepto"
                              aria-label={`Eliminar ${item.description}`}
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
        <div className="lg:col-span-4 flex flex-col gap-md lg:h-full lg:overflow-y-auto">
          {/* Summary Card */}
          <div className="bg-[#7B5EA7] text-white rounded-2xl p-md shadow-md relative overflow-hidden shrink-0">
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
                  className="w-full bg-white border border-slate-300 rounded-xl py-2 px-md text-slate-900 font-semibold text-base sm:text-xs outline-none focus:ring-2 focus:ring-[#9A7DB8] cursor-pointer"
                >
                  <option value="factura-b">Factura B</option>
                  <option value="factura-a">Factura A</option>
                  <option value="factura-c">Factura C</option>
                  <option value="remito">Remito</option>
                </select>
              </div>

              {/* Punto de venta y Número de factura */}
              <div className="grid grid-cols-2 gap-xs">
                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-slate-700 text-[11px] font-medium">
                    Punto de venta
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={posNumber}
                    onChange={(e) => setPosNumber(e.target.value)}
                    placeholder=""
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-md text-slate-900 font-semibold text-base sm:text-xs outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                  />
                </div>

                <div className="flex flex-col gap-xs">
                  <label className="font-label-md text-slate-700 text-[11px] font-semibold flex items-center justify-between">
                    <span>Número de factura</span>
                    <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={customInvoiceNumber}
                    onChange={(e) => setCustomInvoiceNumber(e.target.value)}
                    placeholder="Ej. 00004521"
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-md text-slate-900 font-semibold text-base sm:text-xs outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                  />
                </div>
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
                      <span className="font-label-md text-[10px] font-medium">Efectivo</span>
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
                      <span className="font-label-md text-[10px] font-medium">Tarjeta</span>
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
                      <span className="font-label-md text-[10px] font-medium">Transferencia</span>
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
                      <span className="font-label-md text-[10px] font-medium text-center leading-tight">Cuenta Corriente</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Insertar Comprobante (La Factura) */}
              <div className="pt-xs border-t border-slate-200 flex flex-col gap-xs">
                <label className="font-label-md text-slate-700 text-[11px] font-semibold flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-[#9A7DB8]">attach_file</span>
                    <span>Comprobante / Factura adjunta</span>
                  </div>
                  <span className="text-red-500 font-bold">* Obligatorio</span>
                </label>

                {voucherName ? (
                  <div className="flex items-center justify-between bg-purple-50 p-2 px-3 rounded-xl border border-purple-200 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="material-symbols-outlined text-[#5C3C7B] text-[18px]">description</span>
                      <span className="font-semibold text-slate-900 truncate">{voucherName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVoucherName('');
                        setVoucherUrl('');
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer"
                      title="Quitar comprobante"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 hover:border-[#9A7DB8] rounded-xl p-3 text-xs text-slate-600 cursor-pointer transition-all">
                    <span className="material-symbols-outlined text-[18px] text-[#9A7DB8]">upload_file</span>
                    <span className="font-medium">Insertar comprobante (Factura)</span>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setVoucherName(file.name);
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setVoucherUrl(event.target?.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
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
                        inputMode="decimal"
                        min={0}
                        max={100}
                        step={0.5}
                        value={taxPercent}
                        onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                        className="w-14 text-center bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-900 font-bold text-base sm:text-xs focus:ring-2 focus:ring-[#9A7DB8] outline-none shadow-xs"
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
              className="w-full mt-md py-3 rounded-xl bg-[#7B5EA7] hover:bg-[#654B8C] text-white transition-all font-headline-md text-xs font-bold flex items-center justify-center gap-xs shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>Confirmar y Emitir Cobro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add Item */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200 my-4 sm:my-auto">
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
                      setItemSearchQuery('');
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
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-base sm:text-xs focus:border-[#9A7DB8] shadow-xs cursor-pointer capitalize"
                >
                  <option value="">-- Todas las categorías ({itemType === 'servicio' ? 'Servicios' : 'Productos'}) --</option>
                  {(itemType === 'servicio' ? availableServiceCategories : availableProductCategories).map((cat, idx) => (
                    <option key={idx} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Buscador y Selección del Ítem del Catálogo */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-xs text-slate-700 block">
                  Buscar y seleccionar {itemType === 'servicio' ? 'servicio' : 'producto'} del catálogo *
                </label>

                {/* Input con Barra de Búsqueda */}
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">search</span>
                  <input
                    type="text"
                    value={itemSearchQuery}
                    onChange={(e) => setItemSearchQuery(e.target.value)}
                    placeholder={`Escriba para buscar ${itemType === 'servicio' ? 'servicio (ej. Consulta, Baño, Vacuna)...' : 'producto (ej. Medicamento, Alimento)...'}`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-slate-900 font-medium text-xs focus:bg-white focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 outline-none shadow-xs"
                  />
                  {itemSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setItemSearchQuery('')}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Limpiar búsqueda"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>

                {/* Lista de Resultados Filtrados con Scroll */}
                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-2xs mt-1">
                  {filteredCatalogItems.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">
                      No se encontraron {itemType === 'servicio' ? 'servicios' : 'productos'} para "{itemSearchQuery}"
                    </div>
                  ) : (
                    filteredCatalogItems.map((item) => {
                      const isSelected = selectedCatalogItemId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectCatalogItem(item.id)}
                          className={`w-full text-left p-2.5 px-3 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-purple-100/80 text-[#5C3C7B] font-semibold'
                              : 'hover:bg-purple-50 text-slate-800'
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs truncate">{item.name}</span>
                            <span className="text-[10px] text-slate-500 font-normal capitalize">{item.category}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-bold text-xs text-[#5C3C7B]">${item.price.toLocaleString('es-AR')}</span>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[#5C3C7B] text-[16px]">check_circle</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
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
                  inputMode="decimal"
                  value={formatPriceInputDisplay(newItemPrice)}
                  onChange={(e) => setNewItemPrice(parsePriceInput(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="0"
                  min={0}
                  step={100}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-base sm:text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
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
                  className="bg-[#7B5EA7] hover:bg-[#654B8C] text-white px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
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
