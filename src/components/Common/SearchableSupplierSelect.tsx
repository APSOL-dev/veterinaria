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
          className="w-full bg-surface-container/60 border border-outline-variant/40 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-[#5C3C7B] focus:ring-2 focus:ring-[#5C3C7B]/20 font-medium"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-0.5"
            title="Limpiar proveedor"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        ) : (
          <span className="material-symbols-outlined absolute right-2.5 text-slate-500 pointer-events-none text-[18px]">
            search
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white border border-outline-variant/40 rounded-xl shadow-xl max-h-52 overflow-y-auto font-body-md text-xs">
          {filteredSuppliers.length === 0 ? (
            <div className="p-3 text-slate-500 text-[11px] text-center italic">
              No hay coincidencia. Se registrará nuevo proveedor: "{searchTerm}"
            </div>
          ) : (
            <div className="py-1">
              {filteredSuppliers.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSelect(s)}
                  className={`w-full text-left px-3 py-2 hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-between ${
                    value.toLowerCase().trim() === s.toLowerCase().trim() ? 'bg-purple-50 text-[#5C3C7B] font-bold' : 'text-slate-800'
                  }`}
                >
                  <span className="truncate font-medium">{s}</span>
                  {value.toLowerCase().trim() === s.toLowerCase().trim() && (
                    <span className="material-symbols-outlined text-[16px] text-[#5C3C7B]">check</span>
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
