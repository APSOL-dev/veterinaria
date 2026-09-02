import React, { useState, useMemo } from 'react';
import { SupplierBill, SupplierPayment, SupplierCreditTerm } from '../../domain/types';
import { calculateSupplierAccountMovements, getSupplierCreditTerms } from '../../domain/services/supplierService';

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
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for percentages
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSupplierName, setEditingSupplierName] = useState('');
  const [contadoPercent, setContadoPercent] = useState<number>(0);
  const [dias30Percent, setDias30Percent] = useState<number>(0);
  const [dias60Percent, setDias60Percent] = useState<number>(0);
  const [dias90Percent, setDias90Percent] = useState<number>(0);

  // Extract all unique suppliers
  const allSuppliersList = useMemo(() => {
    const set = new Set<string>([...registeredSuppliers, ...bills.map(b => b.supplierName).filter(Boolean)]);
    return Array.from(set);
  }, [registeredSuppliers, bills]);

  // Calculate account movements
  const movements = useMemo(() => {
    const supplierToQuery = selectedSupplier === 'all' ? '' : selectedSupplier;
    return calculateSupplierAccountMovements(supplierToQuery, bills, payments);
  }, [selectedSupplier, bills, payments]);

  // Filter movements by search query
  const filteredMovements = useMemo(() => {
    if (!searchQuery.trim()) return movements;
    const q = searchQuery.toLowerCase().trim();
    return movements.filter(m =>
      m.voucherNumber.toLowerCase().includes(q) ||
      m.date.includes(q) ||
      (m.status && m.status.toLowerCase().includes(q))
    );
  }, [movements, searchQuery]);

  // Total balance for current view
  const currentTotalSaldo = useMemo(() => {
    if (movements.length === 0) return 0;
    return movements[movements.length - 1].saldo;
  }, [movements]);

  const handleOpenEditPlazos = (supplierName?: string) => {
    if (onNavigateToPlazos) {
      onNavigateToPlazos();
      return;
    }
    const targetName = supplierName || (selectedSupplier !== 'all' ? selectedSupplier : allSuppliersList[0] || 'Proveedor General');
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

  return (
    <div className="flex flex-col w-full h-full gap-md font-body-md text-on-surface">
      {/* Header con título e Icono / Botón de Plazos arriba a la derecha */}
      <div className="flex items-center justify-between mb-xs flex-wrap gap-sm">
        <div>
          <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-bold">
            Proveedores — Cuentas Corrientes
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            Estado de cuenta corriente por proveedor: movimiento de facturas (Debe), pagos (Haber) y saldo acumulado
          </p>
        </div>

        <div className="flex items-center gap-sm">
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

      {/* Filter Bar */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-md shadow-xs flex flex-wrap items-center justify-between gap-md">
        <div className="flex items-center gap-md flex-1 min-w-[280px]">
          {/* Supplier Selector */}
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-[11px] font-medium text-on-surface-variant">Proveedor</label>
            <div className="relative">
              <select
                value={selectedSupplier}
                onChange={e => setSelectedSupplier(e.target.value)}
                className="w-full appearance-none bg-surface-container/40 border border-outline-variant/30 rounded-xl pr-8 pl-3 py-2 text-xs text-on-surface outline-none focus:border-primary font-semibold cursor-pointer"
              >
                <option value="all">Todos los proveedores</option>
                {allSuppliersList.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-[11px] font-medium text-on-surface-variant">Buscar comprobante / fecha</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar por comprobante (ej: F. A 2722)..."
                className="w-full pl-9 pr-3 py-2 bg-surface-container/40 border border-outline-variant/30 rounded-xl text-xs text-on-surface outline-none focus:border-primary font-medium"
              />
            </div>
          </div>
        </div>

        {/* Total Saldo Badge */}
        <div className="bg-surface-container/60 border border-outline-variant/40 rounded-xl px-4 py-2 flex items-center gap-md">
          <span className="text-xs font-semibold text-on-surface-variant">Saldo actual:</span>
          <span className={`text-base font-semibold font-mono ${currentTotalSaldo > 0 ? 'text-slate-900' : 'text-[#27AE60]'}`}>
            $ {currentTotalSaldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Main Account Ledger Table */}
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xs overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#5C3C7B] text-white font-semibold text-[11px] border-b border-purple-900/20">
                <th className="py-3 px-md w-12 text-center">Anul.</th>
                <th className="py-3 px-md">Nº comprobante</th>
                <th className="py-3 px-md text-center">Comprobante adjunto</th>
                <th className="py-3 px-md text-center">Estado</th>
                <th className="py-3 px-md">Proveedor</th>
                <th className="py-3 px-md text-center">Fecha</th>
                <th className="py-3 px-md text-right">Debe</th>
                <th className="py-3 px-md text-right">Haber</th>
                <th className="py-3 px-md text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 font-medium">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-xl text-center text-slate-500 font-medium">
                    No hay movimientos registrados en la cuenta corriente.
                  </td>
                </tr>
              ) : (
                filteredMovements.map(m => (
                  <tr key={m.id} className="hover:bg-surface-container/20 transition-colors">
                    <td className="py-3 px-md text-center">
                      <div className="flex items-center justify-center gap-1">
                        {onOpenRegisterPayment && m.type === 'bill' && m.status !== 'Pagado' && (
                          <button
                            type="button"
                            onClick={() => onOpenRegisterPayment(m.id)}
                            className="text-[#5C3C7B] hover:text-[#4A2F66] hover:bg-purple-50 transition-colors p-1 rounded-md cursor-pointer"
                            title="Registrar pago para esta factura"
                          >
                            <span className="material-symbols-outlined text-[16px]">payments</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteBill && m.type === 'bill' && onDeleteBill(m.id)}
                          className="text-slate-400 hover:text-error transition-colors p-1 rounded-md cursor-pointer"
                          title="Anular comprobante"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-md font-medium text-slate-900">
                      {m.voucherNumber}
                    </td>
                    <td className="py-3 px-md text-center">
                      {m.voucherUrl ? (
                        <a
                          href={m.voucherUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                          title={m.voucherName || 'Ver comprobante adjunto'}
                        >
                          <span className="material-symbols-outlined text-[16px]">description</span>
                          <span className="max-w-[120px] truncate">{m.voucherName || 'Ver archivo'}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-normal italic">Sin adjunto</span>
                      )}
                    </td>
                    <td className="py-3 px-md text-center">
                      {m.status && m.status !== '-' ? (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === 'Pagado'
                            ? 'bg-[#E8F5E9] text-[#27AE60]'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {m.status}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-md font-medium text-slate-800">
                      {m.supplierName}
                    </td>
                    <td className="py-3 px-md text-center font-mono text-slate-600">
                      {m.date}
                    </td>
                    <td className="py-3 px-md text-right font-medium text-slate-900">
                      {m.debe > 0 ? (
                        `$ ${m.debe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-3 px-md text-right font-semibold text-[#27AE60]">
                      {m.haber > 0 ? (
                        `$ ${m.haber.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="py-3 px-md text-right font-semibold text-slate-900 font-mono">
                      $ {m.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
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
                <div className="mt-1">
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
                    className="bg-[#160E1E] text-[#CBB5E2] text-xs font-bold p-1 rounded border border-purple-900/50 outline-none"
                  >
                    {allSuppliersList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
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
