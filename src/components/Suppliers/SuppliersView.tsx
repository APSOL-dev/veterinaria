import React, { useState } from 'react';
import { SupplierBill, SupplierQuote } from '../../domain/types';
import { calculateSupplierTotals } from '../../domain/services/supplierService';

interface SuppliersViewProps {
  bills: SupplierBill[];
  quotes: SupplierQuote[];
  activeSubModule: 'facturas' | 'presupuestos';
  onAddBill: (bill: Omit<SupplierBill, 'id'>) => void;
  onAddQuote: (quote: Omit<SupplierQuote, 'id'>) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  bills,
  quotes,
  activeSubModule,
  onAddBill,
  onAddQuote
}) => {
  const [showModal, setShowModal] = useState(false);
  const totals = calculateSupplierTotals(bills, quotes);

  // New Bill state
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(50000);
  const [itemsCount, setItemsCount] = useState(5);
  const [billStatus, setBillStatus] = useState<'paid' | 'pending'>('pending');

  // New Quote state
  const [quoteTitle, setQuoteTitle] = useState('');
  const [quoteStatus, setQuoteStatus] = useState<'draft' | 'approved' | 'rejected'>('draft');

  const handleSubmitBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !invoiceNumber.trim()) return;
    onAddBill({
      supplierName: supplierName.trim(),
      invoiceNumber: invoiceNumber.trim(),
      date,
      amount: Number(amount),
      itemsCount: Number(itemsCount),
      status: billStatus
    });
    setSupplierName('');
    setInvoiceNumber('');
    setShowModal(false);
  };

  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim() || !quoteTitle.trim()) return;
    onAddQuote({
      supplierName: supplierName.trim(),
      title: quoteTitle.trim(),
      date,
      amount: Number(amount),
      status: quoteStatus
    });
    setSupplierName('');
    setQuoteTitle('');
    setShowModal(false);
  };

  return (
    <div className="flex flex-col w-full h-full gap-md font-body-md text-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-[22px] text-primary leading-tight font-bold">
            {activeSubModule === 'facturas' ? 'Proveedores — Facturas de Compras' : 'Proveedores — Presupuestos y Cotizaciones'}
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant">
            {activeSubModule === 'facturas' 
              ? 'Control de comprobantes de ingreso de mercadería y gastos de proveedores'
              : 'Gestión de cotizaciones y presupuestos de insumos veterinarios'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-on-primary hover:bg-primary-container px-md py-2 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-sm transition-all"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          {activeSubModule === 'facturas' ? 'Registrar Factura' : 'Nuevo Presupuesto'}
        </button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="font-label-md text-[11px] text-on-surface-variant uppercase font-bold">Pendiente de Pago</span>
          <span className="font-display-lg text-2xl font-bold text-error mt-xs">${totals.pendingBillsTotal.toLocaleString('es-AR')}</span>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="font-label-md text-[11px] text-on-surface-variant uppercase font-bold">Facturas Pagadas</span>
          <span className="font-display-lg text-2xl font-bold text-[#27AE60] mt-xs">${totals.paidBillsTotal.toLocaleString('es-AR')}</span>
        </div>
        <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="font-label-md text-[11px] text-on-surface-variant uppercase font-bold">Presupuestos Aprobados</span>
          <span className="font-display-lg text-2xl font-bold text-secondary mt-xs">${totals.approvedQuotesTotal.toLocaleString('es-AR')}</span>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {activeSubModule === 'facturas' ? (
            <table className="w-full text-left font-body-md text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                <tr>
                  <th className="p-sm px-md">Fecha</th>
                  <th className="p-sm px-md">Proveedor</th>
                  <th className="p-sm px-md">N° Factura</th>
                  <th className="p-sm px-md text-center">Ítems</th>
                  <th className="p-sm px-md text-right">Monto Total</th>
                  <th className="p-sm px-md text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b border-surface-container-low hover:bg-surface-container transition-colors">
                    <td className="p-sm px-md">{bill.date}</td>
                    <td className="p-sm px-md font-bold text-primary">{bill.supplierName}</td>
                    <td className="p-sm px-md font-mono text-[11px]">{bill.invoiceNumber}</td>
                    <td className="p-sm px-md text-center">{bill.itemsCount}</td>
                    <td className="p-sm px-md text-right font-bold">${bill.amount.toLocaleString('es-AR')}</td>
                    <td className="p-sm px-md text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        bill.status === 'paid' ? 'bg-[#E8F5E9] text-[#27AE60]' : 'bg-[#FDEDEC] text-[#C0392B]'
                      }`}>
                        {bill.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left font-body-md text-xs">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                <tr>
                  <th className="p-sm px-md">Fecha</th>
                  <th className="p-sm px-md">Proveedor</th>
                  <th className="p-sm px-md">Título / Concepto</th>
                  <th className="p-sm px-md text-right">Monto Estimado</th>
                  <th className="p-sm px-md text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="text-on-surface">
                {quotes.map((quote) => (
                  <tr key={quote.id} className="border-b border-surface-container-low hover:bg-surface-container transition-colors">
                    <td className="p-sm px-md">{quote.date}</td>
                    <td className="p-sm px-md font-bold text-primary">{quote.supplierName}</td>
                    <td className="p-sm px-md font-medium">{quote.title}</td>
                    <td className="p-sm px-md text-right font-bold">${quote.amount.toLocaleString('es-AR')}</td>
                    <td className="p-sm px-md text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        quote.status === 'approved' ? 'bg-[#E8F5E9] text-[#27AE60]' : quote.status === 'rejected' ? 'bg-[#FDEDEC] text-[#C0392B]' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {quote.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Register Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b border-surface-variant pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-bold">
                {activeSubModule === 'facturas' ? 'Registrar Factura de Proveedor' : 'Nuevo Presupuesto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={activeSubModule === 'facturas' ? handleSubmitBill : handleSubmitQuote} className="flex flex-col gap-xs text-xs">
              <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Proveedor *</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Ej. Distribuidora FarmaVet SA"
                required
                className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />

              {activeSubModule === 'facturas' ? (
                <>
                  <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">N° Comprobante / Factura *</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Ej. FC-A-0001-0004521"
                    required
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  />

                  <div className="grid grid-cols-2 gap-sm mt-xs">
                    <div>
                      <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Monto Total ($)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        required
                        className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                      />
                    </div>
                    <div>
                      <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Estado Pago</label>
                      <select
                        value={billStatus}
                        onChange={(e) => setBillStatus(e.target.value as any)}
                        className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                      >
                        <option value="pending">PENDIENTE</option>
                        <option value="paid">PAGADO</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Título / Concepto *</label>
                  <input
                    type="text"
                    value={quoteTitle}
                    onChange={(e) => setQuoteTitle(e.target.value)}
                    placeholder="Ej. Cotización de Vacunas y Jeringas"
                    required
                    className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                  />

                  <div className="grid grid-cols-2 gap-sm mt-xs">
                    <div>
                      <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Monto Estimado ($)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        required
                        className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                      />
                    </div>
                    <div>
                      <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Estado</label>
                      <select
                        value={quoteStatus}
                        onChange={(e) => setQuoteStatus(e.target.value as any)}
                        className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                      >
                        <option value="draft">BORRADOR</option>
                        <option value="approved">APROBADO</option>
                        <option value="rejected">RECHAZADO</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="bg-primary text-on-primary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-bold shadow-sm">
                Guardar Registro
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
