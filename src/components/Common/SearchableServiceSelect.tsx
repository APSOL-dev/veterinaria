import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GroomingService } from '../../domain/types';

interface SearchableServiceSelectProps {
  services: GroomingService[];
  selectedServiceId: string;
  onSelectService: (serviceId: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  speciesFallback?: boolean;
}

export const SearchableServiceSelect: React.FC<SearchableServiceSelectProps> = ({
  services,
  selectedServiceId,
  onSelectService,
  label,
  placeholder = 'Buscar o seleccionar servicio...',
  className = '',
  disabled = false,
  required = false,
  speciesFallback = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedService = useMemo(() => {
    return services.find(s => s.id === selectedServiceId);
  }, [services, selectedServiceId]);

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) {
      return services;
    }
    const q = searchQuery.toLowerCase().trim();
    return services.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.description && s.description.toLowerCase().includes(q)) ||
      s.price.toString().includes(q) ||
      s.durationMinutes.toString().includes(q)
    );
  }, [services, searchQuery]);

  // Reset highlight when filtered items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredServices.length]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelect = (serviceId: string) => {
    onSelectService(serviceId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredServices.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : filteredServices.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredServices[highlightedIndex]) {
        handleSelect(filteredServices[highlightedIndex].id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="font-semibold text-xs text-slate-700 block mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Main trigger button */}
      <div
        onClick={() => {
          if (!isOpen) handleOpen();
        }}
        className={`w-full bg-white border rounded-xl p-2.5 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-xs ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:border-[#9A7DB8]'
        } ${
          isOpen ? 'border-[#9A7DB8] ring-2 ring-[#9A7DB8]/20' : 'border-slate-300'
        }`}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="material-symbols-outlined text-[#9A7DB8] text-[18px] shrink-0">
            content_cut
          </span>
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escriba para buscar servicio..."
              className="w-full bg-transparent outline-none text-slate-900 font-medium text-xs placeholder:text-slate-400 p-0"
              autoComplete="off"
            />
          ) : (
            <span className={`text-xs truncate ${selectedService ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
              {selectedService
                ? `${selectedService.name} (${selectedService.durationMinutes} min - $${selectedService.price.toLocaleString('es-AR')})`
                : placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {isOpen && searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSearchQuery('');
                inputRef.current?.focus();
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
          <span className="material-symbols-outlined text-slate-400 text-[18px] transition-transform duration-200">
            {isOpen ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {speciesFallback && (
        <p className="text-[11px] text-amber-700 font-medium mt-1">
          No hay servicios de estética cargados para esta especie. Se muestran todos; verifique el servicio elegido.
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-[80] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1 animate-fade-in"
        >
          {filteredServices.length === 0 ? (
            <div className="p-3 text-center text-slate-500 text-xs font-medium">
              No se encontraron servicios para "{searchQuery}"
            </div>
          ) : (
            filteredServices.map((service, index) => {
              const isSelected = service.id === selectedServiceId;
              const isHighlighted = index === highlightedIndex;

              return (
                <div
                  key={service.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(service.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3 py-2 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isHighlighted ? 'bg-purple-50 text-[#5C3C7B]' : 'text-slate-800 hover:bg-slate-50'
                  } ${isSelected ? 'font-bold text-[#7B5EA7]' : ''}`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{service.name}</span>
                    {service.description && (
                      <span className="text-[10px] text-slate-400 truncate">{service.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                      {service.durationMinutes} min
                    </span>
                    <span className="font-semibold text-slate-900">
                      ${service.price.toLocaleString('es-AR')}
                    </span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[#7B5EA7] text-[16px]">check</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
