import React, { useState, useMemo } from 'react';
import { SupplierBill, SupplierPayment, SupplierCreditTerm } from '../../domain/types';
import { getSupplierCreditTerms, saveSupplierCreditTerm, formatTermLabel, formatCreditTermSummary } from '../../domain/services/supplierService';
import { getRemainingBalance } from '../../domain/services/paymentService';

interface SupplierCreditTermsViewProps {
  bills: SupplierBill[];
  payments?: SupplierPayment[];
  creditTerms?: SupplierCreditTerm[];
  onSaveCreditTerm?: (term: SupplierCreditTerm) => void;
  onNavigateToCuentas?: () => void;
  registeredSuppliers?: string[];
}

export const SupplierCreditTermsView: React.FC<SupplierCreditTermsViewProps> = ({
  bills,
  payments = [],
  creditTerms = [],
  onSaveCreditTerm,
  onNavigateToCuentas,
  registeredSuppliers = [
    'Distribuidora FarmaVet SA',
    'Laboratorios Zoonosis SRL',
    'Insumos Médicos del Plata',
    'Distribuidora Veterinaria Sur'
  ]
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTermFilter, setSelectedTermFilter] = useState<string>('all');

  // Modal State for percentages
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplierName, setEditingSupplierName] = useState('');
  const [contadoPercent, setContadoPercent] = useState<number>(0);
  const [dias30Percent, setDias30Percent] = useState<number>(0);
  const [dias60Percent, setDias60Percent] = useState<number>(0);
  const [dias90Percent, setDias90Percent] = useState<number>(0);

  // Extract all unique suppliers from bills & registered list
  const allSuppliersList = useMemo(() => {
    const set = new Set<string>([...registeredSuppliers, ...bills.map(b => b.supplierName).filter(Boolean)]);
    return Array.from(set);
  }, [registeredSuppliers, bills]);

  // Combine credit terms for all suppliers
  const supplierRows = useMemo(() => {
    return allSuppliersList.map(name => {
      const termInfo = getSupplierCreditTerms(name, creditTerms);
      const supplierBills = bills.filter(b => b.supplierName.toLowerCase() === name.toLowerCase());
      const pendingBills = supplierBills.filter(b => {
        const rem = getRemainingBalance(b, payments);
        return b.status !== 'paid' && rem > 0;
      });
      const pendingTotal = pendingBills.reduce((sum, b) => sum + getRemainingBalance(b, payments), 0);

      // Next due date
      const dueDates = pendingBills
        .map(b => b.paymentDate || b.date)
        .filter(Boolean)
        .sort();
      const nextDueDate = dueDates[0] || null;

      return {
        supplierName: name,
        cuit: supplierBills[0]?.cuit || termInfo.cuit || '-',
        termInfo,
        pendingBillsCount: pendingBills.length,
        pendingTotal,
        nextDueDate
      };
    });
  }, [allSuppliersList, creditTerms, bills]);

  // Filter rows
  const filteredRows = useMemo(() => {
    return supplierRows.filter(row => {
      const matchesSearch = row.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            row.cuit.includes(searchQuery);
      const matchesTerm = selectedTermFilter === 'all' || row.termInfo.termType === selectedTermFilter;
      return matchesSearch && matchesTerm;
    });
  }, [supplierRows, searchQuery, selectedTermFilter]);

  const handleOpenEdit = (supplierName: string) => {
    const termInfo = getSupplierCreditTerms(supplierName, creditTerms);
    setEditingSupplierName(supplierName);

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

  return (
    <div className="flex flex-col w-full h-full gap-md font-body-md text-on-surface">
      {/* Header */}
      <div className="flex items-center justify-between mb-xs">
        <div>
          <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-bold">
            Proveedores — Plazos
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            Gestión de acuerdos de pago, días de crédito y distribución porcentual de plazos
          </p>
        </div>

        {onNavigateToCuentas && (
          <button
            type="button"
            onClick={onNavigateToCuentas}
            className="bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/30 px-md py-2.5 rounded-xl font-label-md text-xs font-bold flex items-center gap-xs shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            <span>Volver a Cuentas Corrientes</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-md shadow-xs flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-sm flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por proveedor o CUIT..."
              className="w-full pl-9 pr-3 py-2 bg-surface-container/40 border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-primary font-medium"
            />
          </div>
        </div>

        <div className="flex items-center gap-sm">
          <label className="text-xs text-slate-600 font-bold">Filtrar por plazo:</label>
          <div className="relative">
            <select
              value={selectedTermFilter}
              onChange={e => setSelectedTermFilter(e.target.value)}
              className="appearance-none bg-surface-container/40 border border-outline-variant/30 rounded-xl pr-8 pl-3 py-2 text-xs text-on-surface outline-none focus:border-primary font-medium cursor-pointer"
            >
              <option value="all">Todos los plazos</option>
              <option value="contado">Contado</option>
              <option value="15_dias">15 Días</option>
              <option value="30_dias">30 Días</option>
              <option value="60_dias">60 Días</option>
              <option value="90_dias">90 Días</option>
              <option value="cuotas_30_60">30 y 60 Días</option>
              <option value="cuotas_30_60_90">30, 60 y 90 Días</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
          </div>
        </div>
      </div>

      {/* Supplier Credit Terms Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xs overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container/40 border-b border-outline-variant/30 text-on-surface-variant font-semibold text-[11px]">
                <th className="py-3 px-md">Proveedor</th>
                <th className="py-3 px-md">CUIT</th>
                <th className="py-3 px-md">Plazo acordado</th>
                <th className="py-3 px-md text-right">Facturas pendientes</th>
                <th className="py-3 px-md">Próximo vencimiento</th>
                <th className="py-3 px-md text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-xl text-center text-slate-500 font-medium">
                    No se encontraron proveedores que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredRows.map(row => {
                  const summaryLabel = formatCreditTermSummary(row.termInfo);
                  return (
                    <tr key={row.supplierName} className="hover:bg-surface-container/20 transition-colors">
                      <td className="py-3 px-md font-semibold text-slate-900">
                        {row.supplierName}
                      </td>
                      <td className="py-3 px-md text-slate-600 font-mono">
                        {row.cuit}
                      </td>
                      <td className="py-3 px-md">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium ${
                          row.termInfo.contadoPercent === 100 || row.termInfo.termType === 'contado'
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-primary/10 text-primary border border-primary/30'
                        }`}>
                          <span className="material-symbols-outlined text-[15px]">schedule</span>
                          <span>{summaryLabel}</span>
                        </span>
                      </td>
                      <td className="py-3 px-md text-right">
                        {row.pendingBillsCount > 0 ? (
                          <div>
                            <span className="font-semibold text-slate-900">{row.pendingBillsCount} facturas</span>
                            <div className="text-[11px] text-amber-700 font-medium">$ {row.pendingTotal.toLocaleString('es-AR')}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Al día</span>
                        )}
                      </td>
                      <td className="py-3 px-md">
                        {row.nextDueDate ? (
                          <span className="font-mono text-slate-700 bg-surface-container px-2 py-0.5 rounded-lg border border-outline-variant/30 font-medium">
                            {row.nextDueDate}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-md text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(row.supplierName)}
                          className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 px-3 py-1.5 rounded-xl font-semibold text-xs flex items-center gap-1 ml-auto cursor-pointer transition-all"
                        >
                          <span className="material-symbols-outlined text-[15px]">edit</span>
                          <span>Editar plazo</span>
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

      {/* Modal Edit Supplier Credit Term (Estilo Morado Formulario) */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-[#1D1426] text-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-purple-900/60 flex flex-col gap-5">
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div>
                <h3 className="text-base font-bold text-white leading-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#CBB5E2] text-[20px]">more_time</span>
                  <span>Configurar Plazos (%)</span>
                </h3>
                <p className="text-xs text-[#CBB5E2] font-medium mt-0.5">
                  {editingSupplierName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Formulario Estilo Morado */}
            <form onSubmit={handleSaveTermSubmit} className="flex flex-col gap-4">
              {/* 1. Cobro contado (%) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Cobro contado (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={contadoPercent}
                  onChange={e => setContadoPercent(e.target.value !== '' ? Number(e.target.value) : 0)}
                  className="w-full bg-[#160E1E] border border-purple-900/60 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] transition-all"
                />
              </div>

              {/* 2. Plazo 30 días (%) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Plazo 30 días (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dias30Percent}
                  onChange={e => setDias30Percent(e.target.value !== '' ? Number(e.target.value) : 0)}
                  className="w-full bg-[#160E1E] border border-purple-900/60 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] transition-all"
                />
              </div>

              {/* 3. Plazo 60 días (%) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Plazo 60 días (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dias60Percent}
                  onChange={e => setDias60Percent(e.target.value !== '' ? Number(e.target.value) : 0)}
                  className="w-full bg-[#160E1E] border border-purple-900/60 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] transition-all"
                />
              </div>

              {/* 4. Plazo 90 días (%) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-300">
                  Plazo 90 días (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={dias90Percent}
                  onChange={e => setDias90Percent(e.target.value !== '' ? Number(e.target.value) : 0)}
                  className="w-full bg-[#160E1E] border border-purple-900/60 rounded-xl p-3 text-white font-bold text-sm outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8] transition-all"
                />
              </div>

              {/* Acciones */}
              <div className="pt-3 border-t border-purple-900/40 flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9A7DB8] hover:bg-[#8666A6] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Guardar Plazos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
