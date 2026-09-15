import React, { useState, useRef, useEffect } from 'react';

interface SearchableSupplierSelectProps {
  suppliers: string[];
  value: string;
  onChange: (supplierName: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const SearchableSupplierSelect: React.FC<SearchableSupplierSelectProps> = ({
  suppliers,
  value,
  onChange,
  placeholder = 'Buscar o ingresar proveedor...',
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuppliers = suppliers.filter(s => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return s.toLowerCase().includes(term);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);
    onChange(val);
  };

  const handleSelect = (supplierName: string) => {
    setSearchTerm(supplierName);
    setIsOpen(false);
    onChange(supplierName);
  };

  const handleClear = () => {
    setSearchTerm('');
    setIsOpen(false);
    onChange('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          required={required}
          className="w-full bg-[#160E1E] border border-purple-900/60 rounded-xl p-2.5 text-xs text-white outline-none focus:border-[#9A7DB8] focus:ring-1 focus:ring-[#9A7DB8]"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 text-slate-400 hover:text-white p-0.5"
            title="Limpiar proveedor"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        ) : (
          <span className="material-symbols-outlined absolute right-2.5 text-[#CBB5E2] pointer-events-none text-[18px]">
            search
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#1D1426] border border-purple-900/80 rounded-xl shadow-2xl max-h-52 overflow-y-auto font-body-md text-xs">
          {filteredSuppliers.length === 0 ? (
            <div className="p-3 text-slate-400 text-[11px] text-center italic">
              No hay coincidencia. Se registrará nuevo proveedor: "{searchTerm}"
            </div>
          ) : (
            <div className="py-1">
              {filteredSuppliers.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={`w-full text-left px-3 py-2 hover:bg-[#2B1D3A] transition-colors cursor-pointer flex items-center justify-between ${
                    value.toLowerCase().trim() === s.toLowerCase().trim() ? 'bg-[#2B1D3A] text-[#CBB5E2] font-bold' : 'text-slate-200'
                  }`}
                >
                  <span className="truncate">{s}</span>
                  {value.toLowerCase().trim() === s.toLowerCase().trim() && (
                    <span className="material-symbols-outlined text-[16px] text-emerald-400">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
