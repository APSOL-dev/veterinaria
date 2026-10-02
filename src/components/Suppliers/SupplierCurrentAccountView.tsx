import React, { useState, useMemo } from 'react';
import { SupplierBill, SupplierPayment, SupplierCreditTerm } from '../../domain/types';
import { 
  calculateSupplierSummaryBalances, 
  calculateSupplierAccountMovements, 
  getSupplierCreditTerms 
} from '../../domain/services/supplierService';
import { formatDate } from '../../utils/dateUtils';

interface SupplierCurrentAccountViewProps {
  bills: SupplierBill[];
  payments?: SupplierPayment[];
  creditTerms?: SupplierCreditTerm[];
  onSaveCreditTerm?: (term: SupplierCreditTerm) => void;
  onNavigateToPlazos?: () => void;
  onOpenRegisterPayment?: (billId?: string) => void;
  onDeleteBill?: (id: string) => void;
  registeredSuppliers?: string[];
}

export const SupplierCurrentAccountView: React.FC<SupplierCurrentAccountViewProps> = ({
  bills,
  payments = [],
  creditTerms = [],
  onSaveCreditTerm,
  onNavigateToPlazos,
  onOpenRegisterPayment,
  onDeleteBill,
  registeredSuppliers = [
    'Distribuidora FarmaVet SA',
    'Laboratorios Zoonosis SRL',
    'Insumos Médicos del Plata',
    'Distribuidora Veterinaria Sur'
  ]
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebtOnly, setFilterDebtOnly] = useState<'all' | 'debt' | 'zero'>('all');

  // Custom persistent suppliers
  const [customSuppliers, setCustomSuppliers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vetsoft_registered_suppliers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal State for adding a new supplier
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierCuit, setNewSupplierCuit] = useState('');
  const [newSupplierTerm, setNewSupplierTerm] = useState<SupplierCreditTerm['termType']>('contado');

  // Modal State for viewing single supplier details / movements
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState<string | null>(null);

  // Modal State for percentages
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplierName, setEditingSupplierName] = useState('');
  const [contadoPercent, setContadoPercent] = useState<number>(0);
  const [dias30Percent, setDias30Percent] = useState<number>(0);
  const [dias60Percent, setDias60Percent] = useState<number>(0);
  const [dias90Percent, setDias90Percent] = useState<number>(0);

  // Extract all unique suppliers (defaults + custom + from bills)
  const effectiveRegisteredSuppliers = useMemo(() => {
    const set = new Set<string>([
      ...registeredSuppliers,
      ...customSuppliers,
      ...bills.map(b => b.supplierName).filter(Boolean)
    ]);
    return Array.from(set);
  }, [registeredSuppliers, customSuppliers, bills]);

  const allSuppliersList = effectiveRegisteredSuppliers;

  // Calculate 2-column summary balances per supplier
  const supplierBalances = useMemo(() => {
    return calculateSupplierSummaryBalances(bills, payments, effectiveRegisteredSuppliers);
  }, [bills, payments, effectiveRegisteredSuppliers]);

  // Filter summaries
  const filteredSummaries = useMemo(() => {
    return supplierBalances.filter(s => {
      const matchesSearch = !searchQuery.trim() || s.supplierName.toLowerCase().includes(searchQuery.toLowerCase().trim());
      if (!matchesSearch) return false;
      if (filterDebtOnly === 'debt') return s.saldo > 0;
      if (filterDebtOnly === 'zero') return s.saldo <= 0;
      return true;
    });
  }, [supplierBalances, searchQuery, filterDebtOnly]);

  // Total balance sum
  const totalSaldoGeneral = useMemo(() => {
    return supplierBalances.reduce((sum, s) => sum + s.saldo, 0);
  }, [supplierBalances]);

  // Movements for the selected supplier detail modal
  const detailMovements = useMemo(() => {
    if (!selectedSupplierDetail) return [];
    return calculateSupplierAccountMovements(selectedSupplierDetail, bills, payments);
  }, [selectedSupplierDetail, bills, payments]);

  const selectedSupplierSummary = useMemo(() => {
    if (!selectedSupplierDetail) return null;
    return supplierBalances.find(s => s.supplierName.toLowerCase() === selectedSupplierDetail.toLowerCase()) || null;
  }, [selectedSupplierDetail, supplierBalances]);

  const handleOpenEditPlazos = (supplierName?: string) => {
    if (onNavigateToPlazos) {
      onNavigateToPlazos();
      return;
    }
    const targetName = supplierName || (selectedSupplierDetail || allSuppliersList[0] || 'Proveedor General');
    const termInfo = getSupplierCreditTerms(targetName, creditTerms);
    setEditingSupplierName(targetName);

    setContadoPercent(termInfo.contadoPercent ?? (termInfo.termType === 'contado' ? 100 : 0));
    setDias30Percent(termInfo.dias30Percent ?? (termInfo.termType === '30_dias' ? 100 : 0));
    setDias60Percent(termInfo.dias60Percent ?? (termInfo.termType === '60_dias' ? 100 : 0));
    setDias90Percent(termInfo.dias90Percent ?? (termInfo.termType === '90_dias' ? 100 : 0));

    setShowEditModal(true);
  };

  const handleSaveTermSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplierName) return;

    let termDays = 0;
    if (dias90Percent > 0) termDays = 90;
    else if (dias60Percent > 0) termDays = 60;
    else if (dias30Percent > 0) termDays = 30;
    else termDays = 0;

    let termType: SupplierCreditTerm['termType'] = 'contado';
    if (contadoPercent === 100) termType = 'contado';
    else if (dias30Percent === 100) termType = '30_dias';
    else if (dias60Percent === 100) termType = '60_dias';
    else if (dias90Percent === 100) termType = '90_dias';
    else if (dias30Percent > 0 && dias60Percent > 0 && dias90Percent > 0) termType = 'cuotas_30_60_90';
    else if (dias30Percent > 0 && dias60Percent > 0) termType = 'cuotas_30_60';

    const updatedTerm: SupplierCreditTerm = {
      supplierName: editingSupplierName,
      termType,
      termDays,
      contadoPercent: Number(contadoPercent) || 0,
      dias30Percent: Number(dias30Percent) || 0,
      dias60Percent: Number(dias60Percent) || 0,
      dias90Percent: Number(dias90Percent) || 0,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    if (onSaveCreditTerm) {
      onSaveCreditTerm(updatedTerm);
    }

    setShowEditModal(false);
  };

  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newSupplierName.trim();
    if (!name) return;

    if (!effectiveRegisteredSuppliers.some(s => s.toLowerCase() === name.toLowerCase())) {
      const updated = [...customSuppliers, name];
      setCustomSuppliers(updated);
      try {
        localStorage.setItem('vetsoft_registered_suppliers', JSON.stringify(updated));
      } catch (err) {
        console.warn('Error saving suppliers:', err);
      }
    }

    if (onSaveCreditTerm) {
      let contado = 0;
      let d30 = 0;
      let d60 = 0;
      let d90 = 0;
      let days = 0;

      if (newSupplierTerm === 'contado') {
        contado = 100;
        days = 0;
      } else if (newSupplierTerm === '30_dias') {
        d30 = 100;
        days = 30;
      } else if (newSupplierTerm === '60_dias') {
        d60 = 100;
        days = 60;
      } else if (newSupplierTerm === '90_dias') {
        d90 = 100;
        days = 90;
      } else if (newSupplierTerm === 'cuotas_30_60_90') {
        d30 = 33.33;
        d60 = 33.33;
        d90 = 33.34;
        days = 90;
      }

      onSaveCreditTerm({
        supplierName: name,
        cuit: newSupplierCuit.trim() || undefined,
        termDays: days,
        termType: newSupplierTerm,
        contadoPercent: contado,
        dias30Percent: d30,
        dias60Percent: d60,
        dias90Percent: d90,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    }

    setNewSupplierName('');
    setNewSupplierCuit('');
    setNewSupplierTerm('contado');
    setShowAddSupplierModal(false);
  };

  return (
    <div className="flex flex-col w-full flex-1 h-full overflow-y-auto gap-md font-body-md text-on-surface">
      {/* Header con título e Icono / Botón de Plazos arriba a la derecha */}
      <div className="flex items-center justify-between mb-xs flex-wrap gap-sm">
        <div>
          <h1 className="font-display-lg text-lg lg:text-[22px] text-slate-900 leading-tight font-bold">
            Proveedores — Cuentas Corrientes
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            Estado de cuenta corriente y saldos consolidados por proveedor
          </p>
        </div>

        <div className="flex items-center gap-sm flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddSupplierModal(true)}
            className="bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-md py-2.5 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap"
            title="Dar de alta un nuevo proveedor"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Agregar Proveedor</span>
          </button>

          {onOpenRegisterPayment && (
            <button
              type="button"
              onClick={() => onOpenRegisterPayment()}
              className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-md py-2.5 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-sm transition-all cursor-pointer whitespace-nowrap"
              title="Registrar nuevo pago a proveedor"
            >
              <span className="material-symbols-outlined text-[18px]">payments</span>
              <span>Registrar Pago</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenEditPlazos()}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 px-md py-2.5 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="Configurar plazos comerciales acordados de pago"
          >
            <span className="material-symbols-outlined text-[18px]">more_time</span>
            <span>Configurar Plazos</span>
          </button>
        </div>
      </div>

      {/* Filter & Summary Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-md shadow-xs flex flex-wrap items-center justify-between gap-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-md flex-1 w-full min-w-0 sm:min-w-[280px]">
          {/* Search bar */}
          <div className="flex flex-col gap-1 flex-1 w-full">
            <label className="text-[11px] font-medium text-on-surface-variant">Buscar proveedor</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Escribir nombre del proveedor..."
                className="w-full pl-9 pr-3 py-2 bg-surface-container/40 border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-[11px] font-medium text-on-surface-variant">Filtro de saldo</label>
            <div className="flex items-center gap-1 bg-surface-container/40 p-1 rounded-xl border border-outline-variant/30 [&>button]:flex-1 sm:[&>button]:flex-none">
              <button
                type="button"
                onClick={() => setFilterDebtOnly('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterDebtOnly === 'all'
                    ? 'bg-[#5C3C7B] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({supplierBalances.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDebtOnly('debt')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterDebtOnly === 'debt'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-red-700'
                }`}
              >
                Con deuda ({supplierBalances.filter(s => s.saldo > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDebtOnly('zero')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterDebtOnly === 'zero'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                Al día ({supplierBalances.filter(s => s.saldo <= 0).length})
              </button>
            </div>
          </div>
        </div>

        {/* Total Saldo Badge */}
        <div className={`border rounded-xl px-4 py-2 flex items-center gap-md ${
          totalSaldoGeneral > 0
            ? 'bg-red-50/80 border-red-200 text-red-900'
            : totalSaldoGeneral < 0
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-surface-container/60 border-outline-variant/40'
        }`}>
          <span className="text-xs font-semibold text-on-surface-variant">
            {totalSaldoGeneral > 0 ? 'Total a pagar (Deuda global):' : totalSaldoGeneral < 0 ? 'Saldo a favor global:' : 'Saldo actual:'}
          </span>
          <span className={`text-base font-bold ${
            totalSaldoGeneral > 0 ? 'text-red-700' : totalSaldoGeneral < 0 ? 'text-[#27AE60]' : 'text-slate-700'
          }`}>
            {totalSaldoGeneral < 0 
              ? `- $ ${Math.abs(totalSaldoGeneral).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
              : `$ ${totalSaldoGeneral.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
        </div>
      </div>

      {/* Main 2-Column Table: Proveedor | Saldo */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xs lg:overflow-hidden lg:flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#5C3C7B] text-white font-semibold text-[11px] border-b border-purple-900/20">
                <th className="py-3 px-md">Proveedor</th>
                <th className="py-3 px-md text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-xl text-center text-slate-500 font-medium">
                    No se encontraron proveedores para el criterio de búsqueda.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((supp) => (
                  <tr 
                    key={supp.supplierName} 
                    onClick={() => setSelectedSupplierDetail(supp.supplierName)}
                    className="hover:bg-purple-50/50 transition-colors cursor-pointer group"
                  >
                    {/* Columna 1: Proveedor */}
                    <td className="py-3.5 px-md">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 group-hover:bg-[#5C3C7B] text-[#5C3C7B] group-hover:text-white flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-2xs">
                          {supp.supplierName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 text-sm group-hover:text-[#5C3C7B] transition-colors">
                            {supp.supplierName}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {supp.billsCount === 0 
                              ? 'Sin facturas registradas' 
                              : `${supp.billsCount} factura${supp.billsCount > 1 ? 's' : ''}${
                                  supp.pendingBillsCount > 0 ? ` (${supp.pendingBillsCount} pendiente${supp.pendingBillsCount > 1 ? 's' : ''})` : ''
                                }`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Columna 2: Saldo */}
                    <td className="py-3.5 px-md text-right whitespace-nowrap">
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold whitespace-nowrap ${
                          supp.saldo > 0 ? 'text-red-700' : supp.saldo < 0 ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                          {supp.saldo < 0 
                            ? `- $ ${Math.abs(supp.saldo).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `$ ${supp.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          supp.saldo > 0 
                            ? 'bg-red-50 text-red-700 border border-red-200/60' 
                            : supp.saldo < 0 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {supp.saldo > 0 ? 'Saldo a pagar' : supp.saldo < 0 ? 'Saldo a favor' : 'Al día'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Drawer de Detalle del Proveedor Seleccionado */}
      {selectedSupplierDetail && selectedSupplierSummary && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-surface-container-lowest text-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-auto">
            {/* Header del Modal */}
            <div className="bg-[#5C3C7B] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center font-bold text-base text-white">
                  {selectedSupplierDetail.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    {selectedSupplierDetail}
                  </h3>
                  <p className="text-xs text-purple-200 font-medium">
                    Detalle de facturas y pagos registrados
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onOpenRegisterPayment && selectedSupplierSummary.saldo > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstPendingBill = bills.find(
                        b => b.supplierName.trim().toLowerCase() === selectedSupplierDetail.trim().toLowerCase() && 
                             b.status !== 'paid' && (b.status as string) !== 'Pagado'
                      );
                      onOpenRegisterPayment(firstPendingBill?.id);
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">payments</span>
                    <span>Registrar Pago</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSupplierDetail(null)}
                  className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Resumen de totales */}
            <div className="p-4 bg-slate-50 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Total Facturado</span>
                  <span className="text-sm font-bold text-slate-900">
                    $ {selectedSupplierSummary.totalFacturado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Total Pagado</span>
                  <span className="text-sm font-bold text-emerald-700">
                    $ {selectedSupplierSummary.totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${
                selectedSupplierSummary.saldo > 0
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : selectedSupplierSummary.saldo < 0
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <span className="text-xs font-semibold">
                  {selectedSupplierSummary.saldo > 0 ? 'Saldo a pagar:' : selectedSupplierSummary.saldo < 0 ? 'Saldo a favor:' : 'Saldo:'}
                </span>
                <span className={`text-base font-bold ${
                  selectedSupplierSummary.saldo > 0 ? 'text-red-700' : selectedSupplierSummary.saldo < 0 ? 'text-emerald-700' : 'text-slate-700'
                }`}>
                  {selectedSupplierSummary.saldo < 0 
                    ? `- $ ${Math.abs(selectedSupplierSummary.saldo).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                    : `$ ${selectedSupplierSummary.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>
            </div>

            {/* Lista de Movimientos / Facturas */}
            <div className="flex-1 overflow-y-auto p-4">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Comprobantes y Movimientos</h4>
              {detailMovements.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 font-medium">
                  No hay movimientos registrados para este proveedor.
                </div>
              ) : (
                <div className="border border-outline-variant/30 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Nº Comprobante</th>
                        <th className="py-2.5 px-3 text-center">Tipo / Estado</th>
                        <th className="py-2.5 px-3 text-right">Monto</th>
                        <th className="py-2.5 px-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailMovements.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-slate-600">
                            {formatDate(m.date)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {m.voucherNumber}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {m.type === 'bill' ? (
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                m.status === 'Pagado' || m.status === 'paid'
                                  ? 'bg-[#E8F5E9] text-[#27AE60]'
                                  : m.status === 'Pago parcial' || m.status === 'partial'
                                  ? 'bg-[#FEF9E7] text-[#D35400]'
                                  : 'bg-[#FDEDEC] text-[#C0392B]'
                              }`}>
                                {m.status || 'Factura'}
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                Pago
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold whitespace-nowrap">
                            {m.type === 'bill' ? (
                              <span className="text-slate-900 whitespace-nowrap">$ {m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            ) : (
                              <span className="text-emerald-700 whitespace-nowrap">$ {m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {m.voucherUrl && (
                                <a
                                  href={m.voucherUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-[#5C3C7B] hover:bg-purple-100 rounded transition-colors"
                                  title={m.voucherName || 'Ver comprobante adjunto'}
                                >
                                  <span className="material-symbols-outlined text-[16px]">description</span>
                                </a>
                              )}
                              {onOpenRegisterPayment && m.type === 'bill' && m.status !== 'Pagado' && m.status !== 'paid' && (
                                <button
                                  type="button"
                                  onClick={() => onOpenRegisterPayment(m.id)}
                                  className="p-1 text-[#5C3C7B] hover:bg-purple-100 rounded transition-colors cursor-pointer"
                                  title="Registrar pago"
                                >
                                  <span className="material-symbols-outlined text-[16px]">payments</span>
                                </button>
                              )}
                              {onDeleteBill && m.type === 'bill' && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteBill(m.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                                  title="Eliminar factura"
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
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedSupplierDetail(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Supplier Credit Term (Estilo Claro) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-surface-container-lowest text-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-outline-variant/30 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4 sm:my-auto">
            {/* Header del Modal */}
            <div className="bg-[#5C3C7B] text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white leading-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-200 text-[20px]">more_time</span>
                  <span>Configurar Plazos (%)</span>
                </h3>
                <div className="mt-1 relative inline-block">
                  <select
                    value={editingSupplierName}
                    onChange={e => {
                      const name = e.target.value;
                      setEditingSupplierName(name);
                      const termInfo = getSupplierCreditTerms(name, creditTerms);
                      setContadoPercent(termInfo.contadoPercent ?? (termInfo.termType === 'contado' ? 100 : 0));
                      setDias30Percent(termInfo.dias30Percent ?? (termInfo.termType === '30_dias' ? 100 : 0));
                      setDias60Percent(termInfo.dias60Percent ?? (termInfo.termType === '60_dias' ? 100 : 0));
                      setDias90Percent(termInfo.dias90Percent ?? (termInfo.termType === '90_dias' ? 100 : 0));
                    }}
                    className="appearance-none bg-white/15 text-white text-xs font-bold py-1 pr-7 pl-2 rounded border border-white/20 outline-none cursor-pointer"
                  >
                    {allSuppliersList.map(s => (
                      <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-purple-200 pointer-events-none text-[16px]">expand_more</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Formulario Estilo Claro */}
            <form onSubmit={handleSaveTermSubmit} className="p-5 flex flex-col gap-4">
              {/* 1. Cobro contado (%) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Cobro contado (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={contadoPercent}
                  onChange={e => setContadoPercent(e.target.value !== '' ? Number(e.target.value) : 0)}
                  className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-xl p-3 text-slate-900 font-bold text-sm outline-none focus:border-[#5C3C7B] focus:ring-1 focus:ring-[#5C3C7B] transition-all"
                />
              </div>

              {/* 2. Plazo 30 días (%) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Plazo 30 días (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dias30Percent}
                  onChange={e => setDias30Percent(e.target.value !== '' ? Number(e.target.value) : 0)}
                  className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-xl p-3 text-slate-900 font-bold text-sm outline-none focus:border-[#5C3C7B] focus:ring-1 focus:ring-[#5C3C7B] transition-all"
                />
              </div>

              {/* 3. Plazo 60 días (%) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Plazo 60 días (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dias60Percent}
                  onChange={e => setDias60Percent(e.target.value !== '' ? Number(e.target.value) : 0)}
                  className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-xl p-3 text-slate-900 font-bold text-sm outline-none focus:border-[#5C3C7B] focus:ring-1 focus:ring-[#5C3C7B] transition-all"
                />
              </div>

              {/* 4. Plazo 90 días (%) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Plazo 90 días (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dias90Percent}
                  onChange={e => setDias90Percent(e.target.value !== '' ? Number(e.target.value) : 0)}
                  className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-xl p-3 text-slate-900 font-bold text-sm outline-none focus:border-[#5C3C7B] focus:ring-1 focus:ring-[#5C3C7B] transition-all"
                />
              </div>

              {/* Acciones */}
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#5C3C7B] hover:bg-[#4a3063] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Guardar Plazos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Proveedor */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-[70] flex items-start sm:items-center justify-center p-3 sm:p-md pt-6 sm:pt-10 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200 my-4 sm:my-auto text-slate-900">
            <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
              <h3 className="font-headline-sm text-slate-900 font-semibold text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-[#7B5EA7] text-[20px]">person_add</span>
                <span>Agregar Nuevo Proveedor</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSupplierSubmit} className="flex flex-col gap-md">
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-slate-700 text-xs font-semibold flex items-center justify-between">
                  <span>Nombre / Razón Social</span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Ej. Distribuidora FarmaVet SA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-slate-700 text-xs font-medium">
                  CUIT (Opcional)
                </label>
                <input
                  type="text"
                  value={newSupplierCuit}
                  onChange={(e) => setNewSupplierCuit(e.target.value)}
                  placeholder="Ej. 30-12345678-9"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 font-mono"
                />
              </div>

              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-slate-700 text-xs font-medium">
                  Plazo comercial predeterminado
                </label>
                <select
                  value={newSupplierTerm}
                  onChange={(e) => setNewSupplierTerm(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium outline-none focus:bg-white focus:border-[#9A7DB8] cursor-pointer"
                >
                  <option value="contado">Contado / Inmediato (0 días)</option>
                  <option value="30_dias">30 días</option>
                  <option value="60_dias">60 días</option>
                  <option value="90_dias">90 días</option>
                  <option value="cuotas_30_60_90">Cuotas 30 / 60 / 90 días</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-sm pt-sm border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newSupplierName.trim()}
                  className="px-4 py-2 bg-[#7B5EA7] hover:bg-[#654B8C] disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>Guardar proveedor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
