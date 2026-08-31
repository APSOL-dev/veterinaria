import React, { useState, useMemo, useEffect } from 'react';
import { SupplierBill, SupplierQuote, ExpenseRecord, SupplierPayment, SupplierPaymentMethod } from '../../domain/types';
import { calculateSupplierTotals, calculateMonthlyExpenditureProjections, formatInvoiceFullNumber, filterBillsByDateRange, filterPaymentsByDateRange, getDefaultDateRange } from '../../domain/services/supplierService';
import { filterExpenseRecords, calculateExpenseTotals } from '../../domain/services/expenseService';
import { getTotalPaidForBill, getRemainingBalance } from '../../domain/services/paymentService';
import { NewInvoiceDrawer } from './NewInvoiceDrawer';
import { PaymentDrawer } from './PaymentDrawer';
import { PowerBIDateRangeFilter } from './PowerBIDateRangeFilter';
import { AppConfirmModal } from '../Common/AppConfirmModal';
import { ExpenseCategoryModal } from './ExpenseCategoryModal';

interface SuppliersViewProps {
  bills: SupplierBill[];
  quotes: SupplierQuote[];
  expenses?: ExpenseRecord[];
  payments?: SupplierPayment[];
  monthlyBudgets?: Record<string, number>;
  activeSubModule: 'facturas' | 'presupuestos' | 'pagos';
  onAddBill: (bill: Omit<SupplierBill, 'id'>) => void;
  onUpdateBill?: (id: string, bill: Omit<SupplierBill, 'id'>) => void;
  onDeleteBill?: (id: string) => void;
  onAddQuote: (quote: Omit<SupplierQuote, 'id'>) => void;
  onUpdateMonthlyBudget?: (monthKey: string, amount: number) => void;
  onAddExpense?: (expense: Omit<ExpenseRecord, 'id'>) => void;
  onUpdateExpense?: (id: string, expense: Omit<ExpenseRecord, 'id'>) => void;
  onDeleteExpense?: (id: string) => void;
  onDuplicateExpense?: (id: string) => void;
  onAddPayment?: (payment: Omit<SupplierPayment, 'id'>) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  bills,
  quotes,
  expenses = [],
  payments = [],
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
  onDuplicateExpense,
  onAddPayment
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showInvoiceDrawer, setShowInvoiceDrawer] = useState(false);
  const [editingBill, setEditingBill] = useState<SupplierBill | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; type: 'bill' | 'expense'; id: string; name: string }>({
    isOpen: false,
    type: 'bill',
    id: '',
    name: ''
  });

  // Submodule: Facturas state
  const [facturasTab, setFacturasTab] = useState<'resumen' | 'listado'>('resumen');
  const [editingBudgetMonth, setEditingBudgetMonth] = useState<string | null>(null);
  const [tempBudgetInput, setTempBudgetInput] = useState<string>('');

  // Submodule: Facturas date range state (Estilo Power BI: mes actual a 6 meses adelante por defecto)
  const default6MonthsRange = useMemo(() => getDefaultDateRange('2026-08-01'), []);

  const defaultMinDate = useMemo(() => {
    const dates = [...bills.map(b => b.paymentDate || b.date), ...payments.map(p => p.date)].filter(Boolean);
    if (dates.length === 0) return '2025-01-01';
    dates.sort();
    return dates[0].slice(0, 7) + '-01';
  }, [bills, payments]);

  const defaultMaxDate = useMemo(() => {
    const dates = [...bills.map(b => b.paymentDate || b.date), ...payments.map(p => p.date)].filter(Boolean);
    if (dates.length === 0) return '2027-12-31';
    dates.sort();
    const last = dates[dates.length - 1];
    const [y, m] = last.split('-');
    return `${y}-${m}-31`;
  }, [bills, payments]);

  const [filterStartDate, setFilterStartDate] = useState<string>(default6MonthsRange.startDate);
  const [filterEndDate, setFilterEndDate] = useState<string>(default6MonthsRange.endDate);

  const filteredBills = useMemo(() => filterBillsByDateRange(bills, filterStartDate, filterEndDate), [bills, filterStartDate, filterEndDate]);
  const filteredPayments = useMemo(() => filterPaymentsByDateRange(payments, filterStartDate, filterEndDate), [payments, filterStartDate, filterEndDate]);

  const totals = useMemo(() => calculateSupplierTotals(filteredBills, quotes, filteredPayments, '2026-08-31'), [filteredBills, quotes, filteredPayments]);
  const projections = useMemo(() => calculateMonthlyExpenditureProjections(bills, monthlyBudgets, payments, filterStartDate, filterEndDate), [bills, monthlyBudgets, payments, filterStartDate, filterEndDate]);

  // Submodule: Pagos — drawer de registro de pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBillId, setPaymentBillId] = useState<string>('');

  // Submodule: Registrar Gastos filter state
  const [filterResponsible, setFilterResponsible] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAllocation, setFilterAllocation] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');

  // Expense form state
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expResponsible, setExpResponsible] = useState<string>('Administración');
  const [expCategory, setExpCategory] = useState<string>('Gastos Varios / Caja Chica');
  const [expAllocation, setExpAllocation] = useState<string>('Santo Tomé');
  const [expPaymentMethod, setExpPaymentMethod] = useState<string>('Efectivo');
  const [expDescription, setExpDescription] = useState<string>('');
  const [expAmount, setExpAmount] = useState<number>(1000);
  const [expNote, setExpNote] = useState<string>('');

  // Modal para crear nuevas asignaciones y categorías de gastos
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vetsoft_custom_expense_categories');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [customAllocations, setCustomAllocations] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vetsoft_custom_expense_allocations');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [customResponsibles, setCustomResponsibles] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vetsoft_custom_expense_responsibles');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const handleAddCustomCategory = (newCat: string) => {
    setCustomCategories(prev => {
      if (prev.includes(newCat)) return prev;
      const updated = [...prev, newCat];
      localStorage.setItem('vetsoft_custom_expense_categories', JSON.stringify(updated));
      return updated;
    });
    setExpCategory(newCat);
  };

  const handleRemoveCustomCategory = (catToRemove: string) => {
    setCustomCategories(prev => {
      const updated = prev.filter(c => c !== catToRemove);
      localStorage.setItem('vetsoft_custom_expense_categories', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddCustomAllocation = (newAlloc: string) => {
    setCustomAllocations(prev => {
      if (prev.includes(newAlloc)) return prev;
      const updated = [...prev, newAlloc];
      localStorage.setItem('vetsoft_custom_expense_allocations', JSON.stringify(updated));
      return updated;
    });
    setExpAllocation(newAlloc);
  };

  const handleRemoveCustomAllocation = (allocToRemove: string) => {
    setCustomAllocations(prev => {
      const updated = prev.filter(a => a !== allocToRemove);
      localStorage.setItem('vetsoft_custom_expense_allocations', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddCustomResponsible = (newResp: string) => {
    setCustomResponsibles(prev => {
      if (prev.includes(newResp)) return prev;
      const updated = [...prev, newResp];
      localStorage.setItem('vetsoft_custom_expense_responsibles', JSON.stringify(updated));
      return updated;
    });
    setExpResponsible(newResp);
  };

  const handleRemoveCustomResponsible = (respToRemove: string) => {
    setCustomResponsibles(prev => {
      const updated = prev.filter(r => r !== respToRemove);
      localStorage.setItem('vetsoft_custom_expense_responsibles', JSON.stringify(updated));
      return updated;
    });
  };

  // Dynamic filter options derived from expense data with default presets
  const uniqueResponsibles = useMemo(() => {
    const DEFAULT_RESPONSIBLES = ['Administración', 'Clínica', 'Peluquería'];
    const extraResponsibles = expenses.map(e => e.responsible).filter(Boolean);
    return Array.from(new Set([...DEFAULT_RESPONSIBLES, ...customResponsibles, ...extraResponsibles]));
  }, [expenses, customResponsibles]);
  const uniqueCategories = useMemo(() => {
    const OFFICIAL_EXPENSE_CATEGORIES = [
      'Alimentos y Balanceados',
      'Farmacología y Medicamentos',
      'Accesorios y Juguetes',
      'Higiene y Estética',
      'Materiales Descartables y Quirúrgicos',
      'Alquiler del Local',
      'Servicios Públicos',
      'Internet y Telefonía',
      'Seguridad y Monitoreo',
      'Tasas e Impuestos',
      'Sueldos y Jornales',
      'Honorarios Profesionales',
      'Cargas Sociales y Sindicales',
      'Mantenimiento de Equipos',
      'Limpieza y Desinfección',
      'Fletes y Logística',
      'Gastos Bancarios y Comisiones',
      'Software y Suscripciones',
      'Gastos Varios / Caja Chica'
    ];
    const extraCategories = expenses
      .map(e => e.category)
      .filter(c => c && c.trim().toLowerCase() !== 'gastos varios' && !OFFICIAL_EXPENSE_CATEGORIES.includes(c));
    return Array.from(new Set([...OFFICIAL_EXPENSE_CATEGORIES, ...customCategories, ...extraCategories]));
  }, [expenses, customCategories]);

  const uniqueAllocations = useMemo(() => {
    const DEFAULT_ALLOCATIONS = ['Santo Tomé'];
    const extraAllocations = expenses.map(e => e.allocation).filter(Boolean);
    return Array.from(new Set([...DEFAULT_ALLOCATIONS, ...customAllocations, ...extraAllocations]));
  }, [expenses, customAllocations]);
  const uniquePaymentMethods = useMemo(() => Array.from(new Set(['Efectivo', 'Efectivo, Caja chica', 'Caja administración, Mercado Pago', 'Transferencia bancaria', 'Tarjeta de crédito/débito', 'Cheque', ...expenses.map(e => e.paymentMethod)])), [expenses]);

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
    setDeleteConfirm({
      isOpen: true,
      type: 'bill',
      id: bill.id,
      name: `Factura N° ${bill.invoiceNumber} (${bill.supplierName})`
    });
  };

  const handleOpenAddExpenseModal = () => {
    setEditingExpenseId(null);
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpResponsible('Administración');
    setExpCategory('Gastos Varios / Caja Chica');
    setExpAllocation('Santo Tomé');
    setExpPaymentMethod('Efectivo');
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

  const handleOpenCopyExpenseModal = (exp: ExpenseRecord) => {
    setEditingExpenseId(null);
    setExpDate(exp.date || new Date().toISOString().split('T')[0]);
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

  const handleOpenPaymentModal = (bill?: SupplierBill) => {
    if (bill) {
      setPaymentBillId(bill.id);
    } else {
      setPaymentBillId(bills.length > 0 ? bills[0].id : '');
    }
    setShowPaymentModal(true);
  };

  return (
    <div className="flex flex-col w-full h-full gap-md font-body-md text-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between mb-md">
        <div>
          <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-bold">
            {activeSubModule === 'facturas'
              ? 'Proveedores — Facturas de Compras'
              : activeSubModule === 'pagos'
              ? 'Proveedores — Pagos'
              : 'Proveedores — Registrar Gastos'}
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            {activeSubModule === 'facturas'
              ? 'Control de comprobantes de ingreso de mercadería, proyección de erogaciones y pagos'
              : activeSubModule === 'pagos'
              ? 'Historial de pagos registrados a facturas de proveedores'
              : 'Gestión y registro directo de gastos de operación y proveedores'}

          </p>
        </div>

        <div className="flex items-center gap-sm flex-wrap">
          {activeSubModule === 'facturas' && (
            <PowerBIDateRangeFilter
              minDate={default6MonthsRange.startDate}
              maxDate={default6MonthsRange.endDate}
              startDate={filterStartDate}
              endDate={filterEndDate}
              onChange={(s, e) => {
                setFilterStartDate(s);
                setFilterEndDate(e);
              }}
              onReset={() => {
                setFilterStartDate(default6MonthsRange.startDate);
                setFilterEndDate(default6MonthsRange.endDate);
              }}
            />
          )}

          {activeSubModule !== 'facturas' && activeSubModule !== 'pagos' && (
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="bg-[#F5EFF9] text-[#5C3C7B] hover:bg-[#EFE4F5] border border-[#9A7DB8]/30 px-md py-2 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
              title="Crear nuevas asignaciones y categorías de gastos"
            >
              <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
              <span>Categorías y Asignaciones</span>
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              activeSubModule === 'facturas'
                ? handleOpenAddBill()
                : activeSubModule === 'pagos'
                ? handleOpenPaymentModal()
                : handleOpenAddExpenseModal()
            }
            className="bg-primary text-on-primary hover:bg-primary-container px-md py-2 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            {activeSubModule === 'facturas'
              ? 'Registrar Factura'
              : activeSubModule === 'pagos'
              ? 'Registrar pago'
              : 'Registrar Gasto'}
          </button>
        </div>
      </div>

      {activeSubModule === 'facturas' ? (
        <>
          {/* KPI Cards Summary for Facturas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
            <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
              <span className="font-label-md text-[11px] text-on-surface-variant uppercase font-bold">Comprado este mes</span>
              <span className="font-display-lg text-2xl font-bold text-primary mt-xs">${totals.purchasedThisMonthTotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
              <span className="font-label-md text-[11px] text-on-surface-variant uppercase font-bold">Facturas pagadas</span>
              <span className="font-display-lg text-2xl font-bold text-[#27AE60] mt-xs">${totals.paidBillsTotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
              <span className="font-label-md text-[11px] text-on-surface-variant uppercase font-bold">Pendiente de pago</span>
              <span className="font-display-lg text-2xl font-bold text-error mt-xs">${totals.pendingBillsTotal.toLocaleString('es-AR')}</span>
            </div>
            <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col justify-between">
              <span className="font-label-md text-[11px] text-on-surface-variant uppercase font-bold">Comprometido a 30 días</span>
              <span className="font-display-lg text-2xl font-bold text-amber-600 mt-xs">${totals.committed30DaysTotal.toLocaleString('es-AR')}</span>
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
                                <span className="material-symbols-outlined text-[12px] text-primary">edit</span>
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
                        <th className="p-sm px-md text-right">Saldo Restante</th>
                        <th className="p-sm px-md text-center">Estado</th>
                        <th className="p-sm px-md">Comprobante</th>
                        <th className="p-sm px-md text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-on-surface">
                      {bills.map((bill) => {
                        const totalPaid = getTotalPaidForBill(payments, bill.id);
                        const remaining = getRemainingBalance(bill, payments);
                        const isPaid = remaining === 0;
                        const isPartial = totalPaid > 0 && !isPaid;

                        let badgeClass = 'bg-[#FDEDEC] text-[#C0392B]';
                        let badgeLabel = 'PENDIENTE';
                        if (isPaid) {
                          badgeClass = 'bg-[#E8F5E9] text-[#27AE60]';
                          badgeLabel = 'PAGADO';
                        } else if (isPartial) {
                          badgeClass = 'bg-[#FEF9E7] text-[#D35400]';
                          badgeLabel = 'PAGO PARCIAL';
                        }

                        return (
                          <tr key={bill.id} className="border-b border-surface-container-low hover:bg-surface-container transition-colors">
                            <td className="p-sm px-md font-normal text-slate-700">{bill.date}</td>
                            <td className="p-sm px-md font-normal text-slate-700">{bill.paymentDate || bill.date}</td>
                            <td className="p-sm px-md font-medium text-slate-900">{bill.supplierName}</td>
                            <td className="p-sm px-md font-mono text-[11px]">{formatInvoiceFullNumber(bill)}</td>
                            <td className="p-sm px-md text-center">{bill.itemsCount}</td>
                            <td className="p-sm px-md text-right font-bold">${(bill.amount || 0).toLocaleString('es-AR')}</td>
                            <td className="p-sm px-md text-right font-bold text-error">
                              {remaining > 0 ? `$${remaining.toLocaleString('es-AR')}` : <span className="text-[#27AE60]">$0</span>}
                            </td>
                            <td className="p-sm px-md text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeClass}`}>
                                {badgeLabel}
                              </span>
                            </td>
                            <td className="p-sm px-md">
                              {bill.voucherUrl ? (
                                <a
                                  href={bill.voucherUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#E8F5E9] text-[#27AE60] hover:bg-[#C8E6C9] border border-[#27AE60]/30 transition-colors cursor-pointer"
                                  title={`Ver/Descargar ${bill.voucherName || 'Comprobante'}`}
                                >
                                  <span className="material-symbols-outlined text-[12px]">download</span>
                                  <span className="truncate max-w-[120px] font-bold">{bill.voucherName || 'Ver Comprobante'}</span>
                                </a>
                              ) : bill.voucherName ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#E8F5E9] text-[#27AE60] border border-[#27AE60]/30" title={bill.voucherName}>
                                  <span className="material-symbols-outlined text-[12px]">attach_file</span>
                                  <span className="truncate max-w-[120px] font-bold">{bill.voucherName}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>
                            <td className="p-sm px-md text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  title="Registrar pago"
                                  onClick={() => handleOpenPaymentModal(bill)}
                                  className="p-1 text-slate-400 hover:text-[#27AE60] transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[18px]">wallet</span>
                                </button>
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
                        );
                      })}
                    </tbody>
                  </table>
              )}
            </div>
          </div>
        </>
      ) : activeSubModule === 'pagos' ? (
        /* SUBMODULE: Pagos */
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 flex-1 overflow-hidden flex flex-col">
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-sm text-on-surface-variant py-xl">
              <span className="material-symbols-outlined text-[48px] opacity-30">wallet</span>
              <p className="font-label-md text-sm font-medium">No hay pagos registrados aún.</p>
              <button
                type="button"
                onClick={() => handleOpenPaymentModal()}
                className="mt-sm bg-primary text-on-primary hover:bg-primary-container px-md py-2 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-sm transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Registrar primer pago
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left font-body-md text-xs">
                <thead className="bg-surface-container-low text-on-surface-variant font-label-md uppercase text-[10px]">
                  <tr>
                    <th className="p-sm px-md">Fecha</th>
                    <th className="p-sm px-md">Proveedor</th>
                    <th className="p-sm px-md">N° Factura</th>
                    <th className="p-sm px-md">Método</th>
                    <th className="p-sm px-md text-right">Total</th>
                    <th className="p-sm px-md text-right">Monto Pagado</th>
                    <th className="p-sm px-md text-right">Saldo Restante</th>
                    <th className="p-sm px-md">Comprobante</th>
                    <th className="p-sm px-md">Nota</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  {[...payments].sort((a, b) => b.date.localeCompare(a.date)).map((pay) => {
                    const matchingBill = bills.find(b => b.id === pay.billId || (b.invoiceNumber && formatInvoiceFullNumber(b) === pay.billInvoiceNumber));
                    const totalAmount = matchingBill ? matchingBill.amount : pay.amount;
                    const remainingBalance = matchingBill ? getRemainingBalance(matchingBill, payments) : 0;

                    return (
                      <tr key={pay.id} className="border-b border-surface-container-low hover:bg-surface-container transition-colors">
                        <td className="p-sm px-md font-normal text-slate-700">{pay.date}</td>
                        <td className="p-sm px-md font-medium text-slate-900">{pay.supplierName}</td>
                        <td className="p-sm px-md font-mono text-[11px]">{pay.billInvoiceNumber}</td>
                        <td className="p-sm px-md">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant border border-outline-variant/40">
                            {pay.paymentMethod}
                          </span>
                        </td>
                        <td className="p-sm px-md text-right font-bold text-slate-800">
                          ${totalAmount.toLocaleString('es-AR')}
                        </td>
                        <td className="p-sm px-md text-right font-bold text-[#27AE60]">
                          ${pay.amount.toLocaleString('es-AR')}
                        </td>
                        <td className="p-sm px-md text-right font-bold text-error">
                          {remainingBalance > 0 ? `$${remainingBalance.toLocaleString('es-AR')}` : <span className="text-[#27AE60]">$0</span>}
                        </td>
                        <td className="p-sm px-md">
                          {pay.voucherUrl ? (
                            <a
                              href={pay.voucherUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#E8F5E9] text-[#27AE60] hover:bg-[#C8E6C9] border border-[#27AE60]/30 transition-colors cursor-pointer"
                              title={`Ver/Descargar ${pay.voucherName || 'Comprobante'}`}
                            >
                              <span className="material-symbols-outlined text-[12px]">download</span>
                              <span className="truncate max-w-[120px] font-bold">{pay.voucherName || 'Ver Comprobante'}</span>
                            </a>
                          ) : pay.voucherName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#E8F5E9] text-[#27AE60] border border-[#27AE60]/30" title={pay.voucherName}>
                              <span className="material-symbols-outlined text-[12px]">attach_file</span>
                              <span className="truncate max-w-[120px] font-bold">{pay.voucherName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">—</span>
                          )}
                        </td>
                        <td className="p-sm px-md text-slate-500 italic text-[11px]">{pay.note || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
                            <button
                              type="button"
                              title="Copiar gasto"
                              onClick={() => handleOpenCopyExpenseModal(exp)}
                              className="p-1 text-slate-400 hover:text-secondary transition-colors rounded-lg hover:bg-surface-container-high cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            </button>
                          {onDeleteExpense && (
                            <button
                              type="button"
                              title="Eliminar gasto"
                              onClick={() => setDeleteConfirm({ isOpen: true, type: 'expense', id: exp.id, name: `Gasto de $${exp.amount.toLocaleString('es-AR')} (${exp.category})` })}
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
                  <select
                    value={expResponsible}
                    onChange={(e) => setExpResponsible(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {uniqueResponsibles.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Rubro / Categoría *</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {uniqueCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Asignación *</label>
                  <select
                    value={expAllocation}
                    onChange={(e) => setExpAllocation(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {uniqueAllocations.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-md">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase">Forma de Pago *</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value)}
                    required
                    className="bg-surface-container p-2 rounded-xl border border-outline-variant/40 text-xs font-medium outline-none focus:border-primary cursor-pointer"
                  >
                    {uniquePaymentMethods.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
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

      {/* Drawer Registrar Pago */}
      <PaymentDrawer
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        bills={bills}
        payments={payments}
        preselectedBillId={paymentBillId}
        onSavePayment={(paymentData) => {
          if (onAddPayment) {
            onAddPayment(paymentData);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <AppConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={deleteConfirm.type === 'bill' ? 'Confirmar eliminación de factura' : 'Confirmar eliminación de gasto'}
        message={`¿Está seguro de que desea eliminar ${deleteConfirm.name}?`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={() => {
          if (deleteConfirm.type === 'bill' && onDeleteBill && deleteConfirm.id) {
            onDeleteBill(deleteConfirm.id);
          } else if (deleteConfirm.type === 'expense' && onDeleteExpense && deleteConfirm.id) {
            onDeleteExpense(deleteConfirm.id);
          }
          setDeleteConfirm({ isOpen: false, type: 'bill', id: '', name: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, type: 'bill', id: '', name: '' })}
      />

      {/* Config Categories, Allocations & Responsibles Modal */}
      <ExpenseCategoryModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        allCategories={uniqueCategories}
        allAllocations={uniqueAllocations}
        allResponsibles={uniqueResponsibles}
        customCategories={customCategories}
        customAllocations={customAllocations}
        customResponsibles={customResponsibles}
        onAddCategory={handleAddCustomCategory}
        onRemoveCategory={handleRemoveCustomCategory}
        onAddAllocation={handleAddCustomAllocation}
        onRemoveAllocation={handleRemoveCustomAllocation}
        onAddResponsible={handleAddCustomResponsible}
        onRemoveResponsible={handleRemoveCustomResponsible}
      />
    </div>
  );
};
