import React, { useState, useMemo } from 'react';
import { SupplierBill, SupplierQuote, ExpenseRecord } from '../../domain/types';
import { calculateSupplierTotals, calculateMonthlyExpenditureProjections } from '../../domain/services/supplierService';
import { filterExpenseRecords, calculateExpenseTotals } from '../../domain/services/expenseService';
import { NewInvoiceDrawer } from './NewInvoiceDrawer';

interface SuppliersViewProps {
  bills: SupplierBill[];
  quotes: SupplierQuote[];
  expenses?: ExpenseRecord[];
  monthlyBudgets?: Record<string, number>;
  activeSubModule: 'facturas' | 'presupuestos';
  onAddBill: (bill: Omit<SupplierBill, 'id'>) => void;
  onAddQuote: (quote: Omit<SupplierQuote, 'id'>) => void;
  onUpdateMonthlyBudget?: (monthKey: string, amount: number) => void;
  onAddExpense?: (expense: Omit<ExpenseRecord, 'id'>) => void;
  onUpdateExpense?: (id: string, expense: Omit<ExpenseRecord, 'id'>) => void;
  onDeleteExpense?: (id: string) => void;
  onDuplicateExpense?: (id: string) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  bills,
  quotes,
  expenses = [],
  monthlyBudgets = {},
  activeSubModule,
  onAddBill,
  onAddQuote,
  onUpdateMonthlyBudget,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDuplicateExpense
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceDrawer, setShowInvoiceDrawer] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Submodule: Facturas state
  const [facturasTab, setFacturasTab] = useState<'resumen' | 'listado'>('resumen');
  const [editingBudgetMonth, setEditingBudgetMonth] = useState<string | null>(null);
  const [tempBudgetInput, setTempBudgetInput] = useState<string>('');

  // Submodule: Registrar Gastos filter state
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAllocation, setFilterAllocation] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  // Expense form state
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expResponsible, setExpResponsible] = useState<string>('alberto');
  const [expCategory, setExpCategory] = useState<string>('Gastos varios');
  const [expAllocation, setExpAllocation] = useState<string>('Local Chaco minorista');
  const [expPaymentMethod, setExpPaymentMethod] = useState<string>('Efectivo, Caja chica');
  const [expDescription, setExpDescription] = useState<string>('');
  const [expAmount, setExpAmount] = useState<number>(1000);
  const [expNote, setExpNote] = useState<string>('');

  // New Bill state
  const [supplierName, setSupplierName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState(50000);
  const [itemsCount, setItemsCount] = useState(5);
  const [billStatus, setBillStatus] = useState<'paid' | 'pending'>('pending');

  const totals = calculateSupplierTotals(bills, quotes);
  const projections = calculateMonthlyExpenditureProjections(bills, monthlyBudgets);

  // Dynamic filter options derived from expense data with default presets
  const uniqueResponsibles = useMemo(() => Array.from(new Set(['alberto', 'sele', ...expenses.map(e => e.responsible)])), [expenses]);
  const uniqueCategories = useMemo(() => Array.from(new Set(['Gastos varios', 'Combustible', 'Fletes', 'Insumos oficina', 'Viáticos', 'Escoria', ...expenses.map(e => e.category)])), [expenses]);
  const uniqueAllocations = useMemo(() => Array.from(new Set(['Local Chaco minorista', 'Local Chaco mayorista', 'Local Santa Fe mayorista', ...expenses.map(e => e.allocation)])), [expenses]);
  const uniquePaymentMethods = useMemo(() => Array.from(new Set(['Efectivo, Caja chica', 'Caja administración, Mercado Pago', 'Caja chica, Efectivo', ...expenses.map(e => e.paymentMethod)])), [expenses]);

  const filteredExpenses = useMemo(() => {
    return filterExpenseRecords(expenses, {
      responsible: filterResponsible,
      period: filterPeriod,
      category: filterCategory,
      allocation: filterAllocation,
      paymentMethod: filterPaymentMethod
    });
  }, [expenses, filterResponsible, filterPeriod, filterCategory, filterAllocation, filterPaymentMethod]);

  const expenseTotals = useMemo(() => calculateExpenseTotals(filteredExpenses), [filteredExpenses]);

  const handleClearFilters = () => {
    setFilterResponsible('all');
    setFilterPeriod('all');
    setFilterCategory('all');
    setFilterAllocation('all');
    setFilterPaymentMethod('all');
  };

  const handleOpenAddExpenseModal = () => {
    setEditingExpenseId(null);
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpResponsible('alberto');
    setExpCategory('Gastos varios');
    setExpAllocation('Local Chaco minorista');
    setExpPaymentMethod('Efectivo, Caja chica');
    setExpDescription('');
    setExpAmount(1000);
    setExpNote('');
    setShowModal(true);
  };

  const handleOpenEditExpenseModal = (exp: ExpenseRecord) => {
    setEditingExpenseId(exp.id);
    setExpDate(exp.date);
    setExpResponsible(exp.responsible);
    setExpCategory(exp.category);
    setExpAllocation(exp.allocation);
    setExpPaymentMethod(exp.paymentMethod);
    setExpDescription(exp.description);
    setExpAmount(exp.amount);
    setExpNote(exp.note || '');
    setShowModal(true);
  };

  const handleSubmitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDescription.trim() || expAmount <= 0) return;

    if (editingExpenseId && onUpdateExpense) {
      onUpdateExpense(editingExpenseId, {
        date: expDate,
        responsible: expResponsible,
        category: expCategory,
        allocation: expAllocation,
        paymentMethod: expPaymentMethod,
        description: expDescription.trim(),
        amount: Number(expAmount),
        note: expNote.trim() || '-'
      });
    } else if (onAddExpense) {
      onAddExpense({
        date: expDate,
        responsible: expResponsible,
        category: expCategory,
        allocation: expAllocation,
        paymentMethod: expPaymentMethod,
        description: expDescription.trim(),
        amount: Number(expAmount),
        note: expNote.trim() || '-'
      });
    }
    setShowModal(false);
  };

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

  const handleSaveBudget = (monthKey: string) => {
    const parsed = parseFloat(tempBudgetInput);
    if (!isNaN(parsed) && parsed >= 0 && onUpdateMonthlyBudget) {
      onUpdateMonthlyBudget(monthKey, parsed);
    }
    setEditingBudgetMonth(null);
  };

  return (
    <div className="flex flex-col w-full h-full gap-md font-body-md text-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display-lg text-[22px] text-primary leading-tight font-bold">
            {activeSubModule === 'facturas' ? 'Proveedores — Facturas de Compras' : 'Proveedores — Registrar Gastos'}
          </h1>
          <p className="font-body-md text-xs text-on-surface-variant">
            {activeSubModule === 'facturas' 
              ? 'Control de comprobantes de ingreso de mercadería, proyección de erogaciones y pagos'
              : 'Gestión y registro directo de gastos de operación y proveedores'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => activeSubModule === 'facturas' ? setShowInvoiceDrawer(true) : handleOpenAddExpenseModal()}
          className="bg-primary text-on-primary hover:bg-primary-container px-md py-2 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-sm transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          {activeSubModule === 'facturas' ? 'Registrar Factura' : 'Registrar Gasto'}
        </button>
      </div>

      {activeSubModule === 'facturas' ? (
        <>
          {/* KPI Cards Summary for Facturas */}
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

          {/* Submodule Inner Tabs for Facturas */}
          <div className="flex items-center gap-sm border-b border-outline-variant/20 pb-xs">
            <button
              onClick={() => setFacturasTab('resumen')}
              className={`px-md py-1.5 rounded-xl font-label-md text-xs font-bold transition-all flex items-center gap-xs ${
                facturasTab === 'resumen'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">bar_chart</span>
              Resumen (Proyección)
            </button>
            <button
              onClick={() => setFacturasTab('listado')}
              className={`px-md py-1.5 rounded-xl font-label-md text-xs font-bold transition-all flex items-center gap-xs ${
                facturasTab === 'listado'
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              Listado de Facturas ({bills.length})
            </button>
          </div>

          {/* Main Content Card for Facturas */}
          <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              {facturasTab === 'resumen' ? (
                <div>
                  <h2 className="font-headline-sm text-base font-bold text-primary mb-md">Resumen</h2>
                  <table className="w-full text-left font-body-md text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                      <tr>
                        <th className="p-sm px-md">Fecha</th>
                        <th className="p-sm px-md text-right">Total adeudado</th>
                        <th className="p-sm px-md text-right">Total pagado</th>
                        <th className="p-sm px-md text-right">Total</th>
                        <th className="p-sm px-md text-right">Presupuesto Total</th>
                        <th className="p-sm px-md text-center">Cumplimiento</th>
                      </tr>
                    </thead>
                    <tbody className="text-on-surface">
                      {projections.map((proj) => (
                        <tr key={proj.monthKey} className="border-b border-surface-container-low hover:bg-surface-container/60 transition-colors">
                          <td className="p-sm px-md font-mono font-medium text-on-surface">{proj.dateLabel}</td>
                          <td className="p-sm px-md text-right">
                            {proj.totalAdeudado > 0 ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-[#C0392B]">
                                <span className="w-2 h-2 rounded-full bg-[#C0392B] inline-block"></span>
                                {proj.totalAdeudado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/60">0.00</span>
                            )}
                          </td>
                          <td className="p-sm px-md text-right">
                            {proj.totalPagado > 0 ? (
                              <span className="inline-flex items-center gap-1.5 font-bold text-[#27AE60]">
                                <span className="w-2 h-2 rounded-full bg-[#27AE60] inline-block"></span>
                                {proj.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant/60">0.00</span>
                            )}
                          </td>
                          <td className="p-sm px-md text-right font-medium text-on-surface">
                            {proj.total > 0
                              ? proj.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              : '0.00'}
                          </td>
                          <td className="p-sm px-md text-right">
                            {editingBudgetMonth === proj.monthKey ? (
                              <div className="flex items-center justify-end gap-1">
                                <input
                                  type="number"
                                  value={tempBudgetInput}
                                  onChange={(e) => setTempBudgetInput(e.target.value)}
                                  className="w-28 p-1 text-right text-xs rounded border border-primary outline-none"
                                  autoFocus
                                />
                                <button onClick={() => handleSaveBudget(proj.monthKey)} className="text-[#27AE60] font-bold px-1">✓</button>
                              </div>
                            ) : (
                              <div className="group inline-flex items-center gap-1 cursor-pointer" onClick={() => {
                                setEditingBudgetMonth(proj.monthKey);
                                setTempBudgetInput(proj.presupuestoTotal.toString());
                              }}>
                                <span>{proj.presupuestoTotal > 0 ? proj.presupuestoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
                                <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 text-primary">edit</span>
                              </div>
                            )}
                          </td>
                          <td className="p-sm px-md text-center">
                            {proj.statusLevel === 'exceeded' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FDEDEC] text-[#C0392B]">
                                <span className="material-symbols-outlined text-[14px]">cancel</span>
                                {proj.cumplimientoPercentage}%
                              </span>
                            )}
                            {proj.statusLevel === 'warning' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF9E7] text-[#D35400]">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                {proj.cumplimientoPercentage}%
                              </span>
                            )}
                            {proj.statusLevel === 'ok' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F5E9] text-[#27AE60]">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                {proj.cumplimientoPercentage}%
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
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
                        <td className="p-sm px-md text-right font-bold">${(bill.amount || 0).toLocaleString('es-AR')}</td>
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
              )}
            </div>
          </div>
        </>
      ) : (
        /* SUBMODULE: Registrar Gastos (Layout matching reference screenshot) */
        <div className="flex flex-col gap-md flex-1 overflow-hidden">
          {/* Filters Bar & KPI Card Container */}
          <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-md">
            <div className="flex-1 flex flex-col gap-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-xs text-primary font-bold text-xs uppercase font-label-md">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Filtros de Búsqueda
                </div>
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-[#C0392B] hover:underline font-medium flex items-center gap-0.5"
                >
                  Limpiar todos los filtros
                </button>
              </div>

              {/* 5 Filter Select Dropdowns */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-sm text-xs">
                {/* Responsable */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Responsable</label>
                  <select
                    value={filterResponsible}
                    onChange={(e) => setFilterResponsible(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-xl p-2 text-xs text-on-surface outline-none focus:ring-2 focus:ring-secondary font-medium"
                  >
                    <option value="all">Todos los responsables</option>
                    {uniqueResponsibles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Mes / período */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Mes / período</label>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-xl p-2 text-xs text-on-surface outline-none focus:ring-2 focus:ring-secondary font-medium"
                  >
                    <option value="all">Todos los períodos</option>
                    <option value="2026-08">Agosto 2026</option>
                    <option value="2026-07">Julio 2026</option>
                    <option value="2026-06">Junio 2026</option>
                  </select>
                </div>

                {/* Rubro */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Rubro</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-xl p-2 text-xs text-on-surface outline-none focus:ring-2 focus:ring-secondary font-medium"
                  >
                    <option value="all">Todos los rubros</option>
                    {uniqueCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Asignación */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Asignación</label>
                  <select
                    value={filterAllocation}
                    onChange={(e) => setFilterAllocation(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-xl p-2 text-xs text-on-surface outline-none focus:ring-2 focus:ring-secondary font-medium"
                  >
                    <option value="all">Todas las asignaciones</option>
                    {uniqueAllocations.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Medio de pago */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">Medio de pago</label>
                  <select
                    value={filterPaymentMethod}
                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                    className="w-full bg-surface-container border-none rounded-xl p-2 text-xs text-on-surface outline-none focus:ring-2 focus:ring-secondary font-medium"
                  >
                    <option value="all">Todos los medios</option>
                    {uniquePaymentMethods.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Dark KPI Card: Gastos filtrados */}
            <div className="bg-[#2B1D3A] text-white p-md rounded-2xl flex flex-col justify-center min-w-[220px] shadow-md border border-white/10">
              <span className="text-[11px] text-[#E7D7F0] uppercase font-bold tracking-wider">Gastos filtrados</span>
              <span className="text-2xl font-bold font-display-lg text-white mt-0.5">
                ${expenseTotals.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#CBB5E2] mt-1 font-medium">
                {expenseTotals.count} comprobantes
              </span>
            </div>
          </div>

          {/* Expenses Table Container (9 columns) */}
          <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left font-body-md text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                  <tr>
                    <th className="p-sm px-md">Fecha</th>
                    <th className="p-sm px-md">Responsable</th>
                    <th className="p-sm px-md">Rubro</th>
                    <th className="p-sm px-md">Asignación</th>
                    <th className="p-sm px-md">Medio pago</th>
                    <th className="p-sm px-md">Descripción</th>
                    <th className="p-sm px-md text-right">Monto</th>
                    <th className="p-sm px-md">Nota</th>
                    <th className="p-sm px-md text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-surface-container-low hover:bg-surface-container/60 transition-colors">
                      <td className="p-sm px-md font-mono text-[11px]">{exp.date}</td>
                      <td className="p-sm px-md">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F5EFF9] text-[#79529B] uppercase border border-[#E5D5F0]">
                          <span className="w-4 h-4 rounded-full bg-[#9A7DB8] text-white flex items-center justify-center text-[9px]">
                            {exp.responsible.charAt(0).toUpperCase()}
                          </span>
                          {exp.responsible}
                        </span>
                      </td>
                      <td className="p-sm px-md font-bold text-on-surface">{exp.category}</td>
                      <td className="p-sm px-md italic text-on-surface-variant">{exp.allocation}</td>
                      <td className="p-sm px-md text-on-surface-variant">{exp.paymentMethod}</td>
                      <td className="p-sm px-md font-mono font-bold text-xs uppercase text-primary">{exp.description}</td>
                      <td className="p-sm px-md text-right font-bold text-on-surface text-sm">
                        ${exp.amount.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                      </td>
                      <td className="p-sm px-md text-on-surface-variant text-[11px]">{exp.note || '-'}</td>
                      <td className="p-sm px-md text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onDuplicateExpense && onDuplicateExpense(exp.id)}
                            title="Duplicar gasto"
                            className="p-1 rounded-lg hover:bg-surface-container text-[#8362A5] hover:text-[#5C3C7B] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                          </button>
                          <button
                            onClick={() => handleOpenEditExpenseModal(exp)}
                            title="Editar gasto"
                            className="p-1 rounded-lg hover:bg-surface-container text-amber-600 hover:text-amber-800 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={() => onDeleteExpense && onDeleteExpense(exp.id)}
                            title="Eliminar gasto"
                            className="p-1 rounded-lg hover:bg-surface-container text-red-600 hover:text-red-800 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center p-xl text-on-surface-variant">
                        No se encontraron gastos registrados con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar / Editar Gasto o Registrar Factura */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-lg shadow-xl flex flex-col gap-md">
            <div className="flex justify-between items-center border-b border-surface-variant pb-sm">
              <h3 className="font-headline-sm text-primary text-base font-bold">
                {activeSubModule === 'facturas' 
                  ? 'Registrar Factura de Proveedor' 
                  : (editingExpenseId ? 'Editar Gasto Registrado' : 'Registrar Nuevo Gasto')}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {activeSubModule === 'facturas' ? (
              <form onSubmit={handleSubmitBill} className="flex flex-col gap-xs text-xs">
                <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Proveedor *</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Ej. Distribuidora FarmaVet SA"
                  required
                  className="bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                />

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

                <button type="submit" className="bg-primary text-on-primary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-bold shadow-sm">
                  Guardar Registro
                </button>
              </form>
            ) : (
              /* Expense Form */
              <form onSubmit={handleSubmitExpense} className="flex flex-col gap-xs text-xs">
                <div className="grid grid-cols-2 gap-sm">
                  <div>
                    <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Fecha *</label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      required
                      className="w-full bg-surface-container border-none rounded-xl p-2 outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Responsable *</label>
                    <input
                      type="text"
                      value={expResponsible}
                      onChange={(e) => setExpResponsible(e.target.value)}
                      placeholder="Ej. Alberto"
                      required
                      className="w-full bg-surface-container border-none rounded-xl p-2 outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-sm mt-xs">
                  <div>
                    <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Rubro *</label>
                    <input
                      type="text"
                      value={expCategory}
                      onChange={(e) => setExpCategory(e.target.value)}
                      placeholder="Ej. Combustible, Fletes, Viáticos"
                      required
                      className="w-full bg-surface-container border-none rounded-xl p-2 outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Asignación *</label>
                    <input
                      type="text"
                      value={expAllocation}
                      onChange={(e) => setExpAllocation(e.target.value)}
                      placeholder="Ej. Local Chaco mayorista"
                      required
                      className="w-full bg-surface-container border-none rounded-xl p-2 outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Medio de pago *</label>
                <input
                  type="text"
                  value={expPaymentMethod}
                  onChange={(e) => setExpPaymentMethod(e.target.value)}
                  placeholder="Ej. Efectivo, Caja chica / Mercado Pago"
                  required
                  className="bg-surface-container border-none rounded-xl p-2 outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                />

                <label className="font-label-md text-on-surface-variant uppercase text-[11px] mt-xs">Descripción / Concepto *</label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="Ej. COMPRA REJILLA GRANDE"
                  required
                  className="bg-surface-container border-none rounded-xl p-2 outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-mono"
                />

                <div className="grid grid-cols-2 gap-sm mt-xs">
                  <div>
                    <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Monto ($) *</label>
                    <input
                      type="number"
                      value={expAmount}
                      onChange={(e) => setExpAmount(Number(e.target.value))}
                      required
                      min={1}
                      className="w-full bg-surface-container border-none rounded-xl p-2 outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Nota (opcional)</label>
                    <input
                      type="text"
                      value={expNote}
                      onChange={(e) => setExpNote(e.target.value)}
                      placeholder="Ej. Transf 00142"
                      className="w-full bg-surface-container border-none rounded-xl p-2 outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <button type="submit" className="bg-primary text-on-primary py-2.5 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-bold shadow-sm">
                  {editingExpenseId ? 'Guardar Cambios' : 'Guardar Gasto'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* New Invoice Right Drawer Panel */}
      <NewInvoiceDrawer
        isOpen={showInvoiceDrawer}
        onClose={() => setShowInvoiceDrawer(false)}
        onSaveBill={onAddBill}
      />
    </div>
  );
};

