import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Patient } from '../../domain/types';
import { filterPatients, formatPatientOptionLabel } from '../../domain/services/patientService';

interface SearchablePatientSelectProps {
  patients: Patient[];
  selectedPatientId: string;
  onSelectPatient: (patientId: string) => void;
  labelPrefix?: string;
  placeholder?: string;
  variant?: 'full' | 'short' | 'agenda';
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export const SearchablePatientSelect: React.FC<SearchablePatientSelectProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  labelPrefix = '',
  placeholder = 'Buscar por paciente o tutor...',
  variant = 'full',
  className = '',
  buttonClassName = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedPatient = useMemo(
    () => patients.find(p => p.id === selectedPatientId) || patients[0],
    [patients, selectedPatientId]
  );

  const filteredPatients = useMemo(
    () => filterPatients(patients, searchQuery, 'Todos'),
    [patients, searchQuery]
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const currentLabel = selectedPatient
    ? formatPatientOptionLabel(selectedPatient, variant)
    : 'Seleccionar paciente...';

  return (
    <div ref={containerRef} className={`relative inline-block text-left w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 text-left text-xs font-semibold text-slate-900 flex items-center justify-between gap-2 shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-[#9A7DB8]/30 ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
        } ${buttonClassName}`}
      >
        <span className="truncate">
          {labelPrefix && <span className="font-medium text-slate-500 mr-1">{labelPrefix}</span>}
          <span className="font-bold text-slate-900">{currentLabel}</span>
        </span>
        <span className="material-symbols-outlined text-[18px] text-slate-500 shrink-0">
          {isOpen ? 'expand_less' : 'unfold_more'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-full min-w-[280px] max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70 relative">
            <span className="material-symbols-outlined absolute left-4 top-3.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 text-xs p-0.5"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto p-1 text-xs">
            {filteredPatients.length === 0 ? (
              <div className="p-3 text-center text-slate-500 font-medium">
                No se encontraron pacientes ni tutores para "{searchQuery}"
              </div>
            ) : (
              filteredPatients.map((p) => {
                const isSelected = p.id === selectedPatientId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectPatient(p.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-purple-100/70 text-[#5C3C7B] font-bold'
                        : 'hover:bg-slate-100 text-slate-800 font-medium'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {p.species} {p.breed ? `- ${p.breed}` : ''} &bull; <strong className="text-purple-900 font-semibold">Tutor: {p.ownerName}</strong>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[#5C3C7B] text-[18px]">check</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
