import React, { useState } from 'react';

interface ExpenseCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCategories: string[];
  allAllocations: string[];
  allResponsibles: string[];
  customCategories: string[];
  customAllocations: string[];
  customResponsibles: string[];
  onAddCategory: (category: string) => void;
  onRemoveCategory: (category: string) => void;
  onAddAllocation: (allocation: string) => void;
  onRemoveAllocation: (allocation: string) => void;
  onAddResponsible: (responsible: string) => void;
  onRemoveResponsible: (responsible: string) => void;
}

export const ExpenseCategoryModal: React.FC<ExpenseCategoryModalProps> = ({
  isOpen,
  onClose,
  allCategories,
  allAllocations,
  allResponsibles,
  customCategories,
  customAllocations,
  customResponsibles,
  onAddCategory,
  onRemoveCategory,
  onAddAllocation,
  onRemoveAllocation,
  onAddResponsible,
  onRemoveResponsible
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'allocations' | 'responsibles'>('categories');
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newAllocationInput, setNewAllocationInput] = useState('');
  const [newResponsibleInput, setNewResponsibleInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAddCat = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setNewCategoryInput('');
  };

  const handleAddAlloc = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newAllocationInput.trim();
    if (!trimmed) return;
    onAddAllocation(trimmed);
    setNewAllocationInput('');
  };

  const handleAddResp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = newResponsibleInput.trim();
    if (!trimmed) return;
    onAddResponsible(trimmed);
    setNewResponsibleInput('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
      <div className="bg-surface-container-lowest text-on-surface rounded-3xl p-lg max-w-xl w-full shadow-2xl border border-outline-variant/30 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-md border-b border-outline-variant/30 mb-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">settings_suggest</span>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">
                Configuración de Parámetros de Gastos
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                Gestione y cree nuevos Rubros, Asignaciones y Responsables para el registro de erogaciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-surface-container p-1 rounded-xl mb-md gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('categories'); setErrorMsg(''); }}
            className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
              activeTab === 'categories'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Categorías ({allCategories.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('allocations'); setErrorMsg(''); }}
            className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
              activeTab === 'allocations'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Asignaciones ({allAllocations.length})
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('responsibles'); setErrorMsg(''); }}
            className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg transition-all cursor-pointer truncate ${
              activeTab === 'responsibles'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Responsables ({allResponsibles.length})
          </button>
        </div>

        {errorMsg && (
          <div className="mb-md p-sm bg-error-container/40 text-error rounded-xl text-xs font-medium border border-error/30 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-xs">
          {/* TAB 1: CATEGORÍAS */}
          {activeTab === 'categories' && (
            <div className="flex flex-col gap-md">
              <form onSubmit={handleAddCat} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="Ej: Marketing y Publicidad, Insumos de Limpieza..."
                  className="flex-1 bg-surface-container p-2.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary font-medium"
                />
                <button
                  type="submit"
                  disabled={!newCategoryInput.trim()}
                  className="bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 px-md py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Agregar Rubro</span>
                </button>
              </form>

              <div>
                <h4 className="text-[11px] font-bold uppercase text-on-surface-variant mb-xs">
                  Rubros y Categorías Disponibles ({allCategories.length})
                </h4>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1 bg-surface-container/30 rounded-xl border border-outline-variant/20">
                  {allCategories.map((cat) => {
                    const isCustom = customCategories.includes(cat);
                    return (
                      <span
                        key={cat}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
                          isCustom
                            ? 'bg-primary/10 text-primary border border-primary/30 font-semibold'
                            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40'
                        }`}
                      >
                        <span>{cat}</span>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => onRemoveCategory(cat)}
                            className="hover:text-error transition-colors cursor-pointer"
                            title="Eliminar categoría personalizada"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASIGNACIONES */}
          {activeTab === 'allocations' && (
            <div className="flex flex-col gap-md">
              <form onSubmit={handleAddAlloc} className="flex gap-2">
                <input
                  type="text"
                  value={newAllocationInput}
                  onChange={(e) => setNewAllocationInput(e.target.value)}
                  placeholder="Ej: Sucursal Centro, Quirófano 2, Administración..."
                  className="flex-1 bg-surface-container p-2.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary font-medium"
                />
                <button
                  type="submit"
                  disabled={!newAllocationInput.trim()}
                  className="bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 px-md py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Agregar Asignación</span>
                </button>
              </form>

              <div>
                <h4 className="text-[11px] font-bold uppercase text-on-surface-variant mb-xs">
                  Asignaciones / Sedes Disponibles ({allAllocations.length})
                </h4>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1 bg-surface-container/30 rounded-xl border border-outline-variant/20">
                  {allAllocations.map((alloc) => {
                    const isCustom = customAllocations.includes(alloc);
                    return (
                      <span
                        key={alloc}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
                          isCustom
                            ? 'bg-secondary/10 text-secondary border border-secondary/30 font-semibold'
                            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40'
                        }`}
                      >
                        <span>{alloc}</span>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => onRemoveAllocation(alloc)}
                            className="hover:text-error transition-colors cursor-pointer"
                            title="Eliminar asignación personalizada"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESPONSABLES */}
          {activeTab === 'responsibles' && (
            <div className="flex flex-col gap-md">
              <form onSubmit={handleAddResp} className="flex gap-2">
                <input
                  type="text"
                  value={newResponsibleInput}
                  onChange={(e) => setNewResponsibleInput(e.target.value)}
                  placeholder="Ej: Dr. Pérez, Recepción, Logística..."
                  className="flex-1 bg-surface-container p-2.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary font-medium"
                />
                <button
                  type="submit"
                  disabled={!newResponsibleInput.trim()}
                  className="bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 px-md py-2.5 rounded-xl font-semibold text-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  <span>Agregar Responsable</span>
                </button>
              </form>

              <div>
                <h4 className="text-[11px] font-bold uppercase text-on-surface-variant mb-xs">
                  Responsables Disponibles ({allResponsibles.length})
                </h4>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto p-1 bg-surface-container/30 rounded-xl border border-outline-variant/20">
                  {allResponsibles.map((resp) => {
                    const isCustom = customResponsibles.includes(resp);
                    return (
                      <span
                        key={resp}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${
                          isCustom
                            ? 'bg-purple-100 text-[#5C3C7B] border border-purple-300 font-semibold'
                            : 'bg-surface-container-high text-on-surface-variant border border-outline-variant/40'
                        }`}
                      >
                        <span>{resp}</span>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => onRemoveResponsible(resp)}
                            className="hover:text-error transition-colors cursor-pointer"
                            title="Eliminar responsable personalizado"
                          >
                            <span className="material-symbols-outlined text-[14px]">close</span>
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-md border-t border-outline-variant/30 mt-md flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-primary text-on-primary px-lg py-2 rounded-xl text-xs font-bold hover:bg-primary-container transition-all cursor-pointer"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
