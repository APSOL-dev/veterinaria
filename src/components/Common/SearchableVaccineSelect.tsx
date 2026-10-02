import React, { useState, useRef, useEffect, useMemo } from 'react';
import { VaccineCatalogItem } from '../../domain/types';
import { filterVaccineCatalog } from '../../domain/services/vaccineService';

interface SearchableVaccineSelectProps {
  catalog: VaccineCatalogItem[];
  selectedVaccineId: string;
  onSelectVaccine: (vaccine: VaccineCatalogItem) => void;
  speciesFilter?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const SearchableVaccineSelect: React.FC<SearchableVaccineSelectProps> = ({
  catalog,
  selectedVaccineId,
  onSelectVaccine,
  speciesFilter,
  placeholder = 'Buscar o seleccionar vacuna del catálogo...',
  className = '',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedVaccine = useMemo(
    () => catalog.find(v => v.id === selectedVaccineId) || null,
    [catalog, selectedVaccineId]
  );

  const filteredVaccines = useMemo(
    () => filterVaccineCatalog(catalog, searchQuery, speciesFilter),
    [catalog, searchQuery, speciesFilter]
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayInputValue = useMemo(() => {
    if (isFocused || isOpen) {
      return searchQuery;
    }
    if (selectedVaccine) {
      return `${selectedVaccine.name} (${selectedVaccine.frequencyDays} días)`;
    }
    return '';
  }, [isFocused, isOpen, searchQuery, selectedVaccine]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
    // Keep search empty so all matching species vaccines are displayed upon opening
    setSearchQuery('');
  };

  const handleSelect = (vac: VaccineCatalogItem) => {
    onSelectVaccine(vac);
    setIsOpen(false);
    setIsFocused(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left w-full ${className}`}>
      {/* Searchable Input Dropdown Trigger */}
      <div 
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setIsFocused(true);
            inputRef.current?.focus();
          }
        }}
        className={`w-full bg-white border ${
          isOpen ? 'border-[#9A7DB8] ring-2 ring-[#9A7DB8]/20' : 'border-slate-300 hover:border-slate-400'
        } rounded-xl px-3 py-2 text-xs flex items-center justify-between gap-2 shadow-xs transition-all cursor-text`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
            search
          </span>
          <input
            ref={inputRef}
            type="text"
            value={displayInputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={selectedVaccine ? `${selectedVaccine.name} (${selectedVaccine.frequencyDays} días)` : placeholder}
            required={required && !selectedVaccineId}
            className="w-full bg-transparent outline-none text-slate-900 font-semibold text-xs placeholder:text-slate-400 placeholder:font-normal"
          />
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {(searchQuery || (isOpen && selectedVaccine)) && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Limpiar texto"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(prev => !prev);
              if (!isOpen) {
                setIsFocused(true);
                inputRef.current?.focus();
              }
            }}
            className="text-slate-500 hover:text-slate-700 p-0.5 cursor-pointer flex items-center"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
        </div>
      </div>

      {/* Dropdown Options List */}
      {isOpen && (
        <div className="absolute left-0 mt-1 w-full bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in max-h-60 overflow-y-auto p-1.5 text-xs">
          {filteredVaccines.length === 0 ? (
            <div className="p-3 text-center text-slate-500 font-medium">
              No se encontraron vacunas para "{searchQuery}"
            </div>
          ) : (
            filteredVaccines.map((vac) => {
              const isSelected = vac.id === selectedVaccineId;
              return (
                <div
                  key={vac.id}
                  onClick={() => handleSelect(vac)}
                  className={`px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-100/70 text-[#5C3C7B] font-bold'
                      : 'hover:bg-purple-50 text-slate-800 font-medium'
                  }`}
                >
                  <div className="truncate flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{vac.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-100 text-purple-900 shrink-0">
                        {vac.frequencyDays} días
                      </span>
                      {vac.species && (
                        <span className="text-[10px] text-slate-500 shrink-0 font-normal">
                          ({vac.species})
                        </span>
                      )}
                    </div>
                    {vac.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5 font-normal">
                        {vac.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <span className="material-symbols-outlined text-[#5C3C7B] text-[18px] shrink-0">
                      check
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
