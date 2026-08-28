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
  onUpdateBill?: (id: string, bill: Omit<SupplierBill, 'id'>) => void;
  onDeleteBill?: (id: string) => void;
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
  onUpdateBill,
  onDeleteBill,
  onAddQuote,
  onUpdateMonthlyBudget,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  onDuplicateExpense
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceDrawer, setShowInvoiceDrawer] = useState(false);
  const [editingBill, setEditingBill] = useState<SupplierBill | null>(null);
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

  const handleOpenAddBill = () => {
    setEditingBill(null);
    setShowInvoiceDrawer(true);
  };

  const handleOpenEditBill = (bill: SupplierBill) => {
    setEditingBill(bill);
    setShowInvoiceDrawer(true);
  };

  const handleDeleteBillClick = (bill: SupplierBill) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la factura N° ${bill.invoiceNumber} de ${bill.supplierName}?`)) {
      if (onDeleteBill) onDeleteBill(bill.id);
    }
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
      <div className="flex items-center justify-between mb-md">
        <div>
          <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-bold">
            {activeSubModule === 'facturas' ? 'Proveedores — Facturas de Compras' : 'Proveedores — Registrar Gastos'}
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            {activeSubModule === 'facturas' 
              ? 'Control de comprobantes de ingreso de mercadería, proyección de erogaciones y pagos'
              : 'Gestión y registro directo de gastos de operación y proveedores'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => activeSubModule === 'facturas' ? handleOpenAddBill() : handleOpenAddExpenseModal()}
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
                  <h2 className="font-headline-sm text-base font-bold text-primary mb-md">Resumen de Proyección (por Fecha de Pago)</h2>
                  <table className="w-full text-left font-body-md text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                      <tr>
                        <th className="p-sm px-md">Fecha Pago</th>
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
                      <th className="p-sm px-md">Fecha Emisión</th>
                      <th className="p-sm px-md">Fecha Pago</th>
                      <th className="p-sm px-md">Proveedor</th>
                      <th className="p-sm px-md">N° Factura</th>
                      <th className="p-sm px-md text-center">Ítems</th>
                      <th className="p-sm px-md text-right">Monto Total</th>
                      <th className="p-sm px-md text-center">Estado</th>
                      <th className="p-sm px-md text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="text-on-surface">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="border-b border-surface-container-low hover:bg-surface-container transition-colors">
                        <td className="p-sm px-md font-normal text-slate-700">{bill.date}</td>
                        <td className="p-sm px-md font-normal text-slate-700">{bill.paymentDate || bill.date}</td>
                        <td className="p-sm px-md font-medium text-slate-900">{bill.supplierName}</td>
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
                        <td className="p-sm px-md text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="Editar factura"
                              onClick={() => handleOpenEditBill(bill)}
                              className="p-1 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              type="button"
                              title="Eliminar factura"
                              onClick={() => handleDeleteBillClick(bill)}
                              className="p-1 text-slate-400 hover:text-error transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
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
        /* SUBMODULE: Registrar Gastos */
        <div className="flex flex-col gap-md flex-1 overflow-hidden">
          {/* Filters Bar & KPI Card Container */}
          <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-md">
            {/* Filters grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-xs flex-1">
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Responsable</label>
                <select
                  value={filterResponsible}
                  onChange={(e) => setFilterResponsible(e.target.value)}
                  className="bg-surface-container p-1.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface font-medium outline-none focus:border-primary"
                >
                  <option value="all">Todos</option>
                  {uniqueResponsibles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Período</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="bg-surface-container p-1.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface font-medium outline-none focus:border-primary"
                >
                  <option value="all">Todos</option>
                  <option value="current_month">Mes Actual</option>
                  <option value="last_month">Mes Anterior</option>
                  <option value="year_2026">Año 2026</option>
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Rubro</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-surface-container p-1.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface font-medium outline-none focus:border-primary"
                >
                  <option value="all">Todos</option>
                  {uniqueCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Asignación</label>
                <select
                  value={filterAllocation}
                  onChange={(e) => setFilterAllocation(e.target.value)}
                  className="bg-surface-container p-1.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface font-medium outline-none focus:border-primary"
                >
                  <option value="all">Todas</option>
                  {uniqueAllocations.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Método Pago</label>
                <select
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                  className="bg-surface-container p-1.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface font-medium outline-none focus:border-primary"
                >
                  <option value="all">Todos</option>
                  {uniquePaymentMethods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-md border-t md:border-t-0 md:border-l border-outline-variant/30 pt-xs md:pt-0 md:pl-md">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-on-surface-variant hover:text-primary text-xs font-bold transition-colors flex items-center gap-xs"
              >
                <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
                Limpiar
              </button>

              <div className="bg-primary/10 border border-primary/30 p-xs px-md rounded-xl flex flex-col items-end shrink-0">
                <span className="text-[9px] font-bold text-primary uppercase">Total Filtrado ({expenseTotals.count})</span>
                <span className="font-display-lg text-lg font-bold text-primary">${expenseTotals.totalAmount.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left font-body-md text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                  <tr>
                    <th className="p-sm px-md">Fecha</th>
                    <th className="p-sm px-md">Responsable</th>
                    <th className="p-sm px-md">Rubro</th>
                    <th className="p-sm px-md">Asignación</th>
                    <th className="p-sm px-md">Método Pago</th>
                    <th className="p-sm px-md">Descripción</th>
                    <th className="p-sm px-md text-right">Monto ($)</th>
                    <th className="p-sm px-md text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-surface-container-low hover:bg-surface-container/60 transition-colors">
                      <td className="p-sm px-md font-mono text-[11px]">{exp.date}</td>
                      <td className="p-sm px-md font-bold text-primary capitalize">{exp.responsible}</td>
                      <td className="p-sm px-md">{exp.category}</td>
                      <td className="p-sm px-md">{exp.allocation}</td>
                      <td className="p-sm px-md">{exp.paymentMethod}</td>
                      <td className="p-sm px-md font-medium">{exp.description}</td>
                      <td className="p-sm px-md text-right font-bold text-on-surface">${exp.amount.toLocaleString('es-AR')}</td>
                      <td className="p-sm px-md text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            title="Editar gasto"
                            onClick={() => handleOpenEditExpenseModal(exp)}
                            className="p-1 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          {onDuplicateExpense && (
                            <button
                              type="button"
                              title="Duplicar gasto"
                              onClick={() => onDuplicateExpense(exp.id)}
                              className="p-1 text-slate-400 hover:text-secondary transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            </button>
                          )}
                          {onDeleteExpense && (
                            <button
                              type="button"
                              title="Eliminar gasto"
                              onClick={() => onDeleteExpense(exp.id)}
                              className="p-1 text-slate-400 hover:text-error transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Drawer */}
      <NewInvoiceDrawer
        isOpen={showInvoiceDrawer}
        onClose={() => {
          setShowInvoiceDrawer(false);
          setEditingBill(null);
        }}
        onSaveBill={onAddBill}
        onUpdateBill={onUpdateBill}
        editingBill={editingBill}
      />

      {/* Register / Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest text-on-surface rounded-2xl max-w-lg w-full p-lg shadow-2xl border border-outline-variant/30 animate-fade-in flex flex-col gap-md">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-sm">
              <h3 className="font-display-lg text-base font-bold text-primary">
                {editingExpenseId ? 'Editar Gasto Registrado' : 'Registrar Nuevo Gasto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="flex flex-col gap-md">
              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Fecha *</label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Responsable *</label>
                  <input
                    type="text"
                    list="exp-responsibles"
                    value={expResponsible}
                    onChange={(e) => setExpResponsible(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary capitalize"
                  />
                  <datalist id="exp-responsibles">
                    <option value="alberto" />
                    <option value="sele" />
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Rubro / Categoría *</label>
                  <input
                    type="text"
                    list="exp-categories"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary"
                  />
                  <datalist id="exp-categories">
                    {uniqueCategories.map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Asignación *</label>
                  <input
                    type="text"
                    list="exp-allocations"
                    value={expAllocation}
                    onChange={(e) => setExpAllocation(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary"
                  />
                  <datalist id="exp-allocations">
                    {uniqueAllocations.map(a => (
                      <option key={a} value={a} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Forma de Pago *</label>
                  <input
                    type="text"
                    list="exp-payments"
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary"
                  />
                  <datalist id="exp-payments">
                    {uniquePaymentMethods.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Monto ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-bold outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase">Descripción / Detalle *</label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="ej. Carga Nafta Super Móvil 1"
                  required
                  className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase">Nota / Comprobante (opcional)</label>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="ej. Ticket 0001-4451"
                  className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-md py-2 rounded-xl text-xs font-bold bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-md py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-container text-on-primary shadow-sm transition-all cursor-pointer"
                >
                  {editingExpenseId ? 'Guardar Cambios' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
