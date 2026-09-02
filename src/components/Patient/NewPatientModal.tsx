import React, { useState } from 'react';
import { Species, Sex } from '../../domain/types';

const PREDEFINED_ALERTS = [
  'Agresivo',
  'Alergia a Medicamentos',
  'Riesgo Anestésico',
  'Cardiópata',
  'Diabético',
  'Epiléptico',
  'Requiere Bozal',
  'Cuidados Especiales'
];

interface TutorOption {
  ownerName: string;
  ownerPhone?: string;
  address?: string;
  email?: string;
}

interface NewPatientModalProps {
  onClose: () => void;
  existingTutores?: TutorOption[];
  onAddPatient: (data: {
    name: string;
    species: Species;
    breed: string;
    sex: Sex;
    birthDate: string;
    ownerName: string;
    ownerPhone?: string;
    weightKg?: number;
    alerts?: string[];
  }) => void;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  onClose,
  existingTutores = [
    { ownerName: 'Carlos Mendoza', ownerPhone: '+5491144556677' },
    { ownerName: 'Ana Gómez', ownerPhone: '+5491155667788' },
    { ownerName: 'Lucía Fernández', ownerPhone: '+5491166778899' },
    { ownerName: 'Roberto Gómez', ownerPhone: '+5491177889900' }
  ],
  onAddPatient
}) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('Canino');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<Sex>('Macho');
  const [birthDate, setBirthDate] = useState('2022-01-01');

  // Tutor selection mode
  const [tutorMode, setTutorMode] = useState<'existing' | 'new'>(existingTutores.length > 0 ? 'existing' : 'new');
  const [selectedTutorName, setSelectedTutorName] = useState<string>(existingTutores[0]?.ownerName || '');
  const [ownerName, setOwnerName] = useState(existingTutores[0]?.ownerName || '');
  const [ownerPhone, setOwnerPhone] = useState(existingTutores[0]?.ownerPhone || '');
  const [weightKg, setWeightKg] = useState(10);

  // Selectable Alerts Chips
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [customAlertInput, setCustomAlertInput] = useState('');

  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSelectExistingTutor = (name: string) => {
    setSelectedTutorName(name);
    const found = existingTutores.find(t => t.ownerName === name);
    if (found) {
      setOwnerName(found.ownerName);
      setOwnerPhone(found.ownerPhone || '');
    } else {
      setOwnerName(name);
    }
  };

  const toggleAlertChip = (alertTag: string) => {
    setSelectedAlerts(prev =>
      prev.includes(alertTag) ? prev.filter(a => a !== alertTag) : [...prev, alertTag]
    );
  };

  const handleAddCustomAlert = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customAlertInput.trim();
    if (trimmed && !selectedAlerts.includes(trimmed)) {
      setSelectedAlerts(prev => [...prev, trimmed]);
      setCustomAlertInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalOwnerName = tutorMode === 'existing' ? selectedTutorName : ownerName;

    if (!name.trim() || !finalOwnerName.trim()) {
      setErrorMessage('Por favor complete el nombre de la mascota y del dueño/tutor.');
      return;
    }

    onAddPatient({
      name: name.trim(),
      species,
      breed: breed.trim() || 'Mestizo',
      sex,
      birthDate,
      ownerName: finalOwnerName.trim(),
      ownerPhone: ownerPhone.trim() || undefined,
      weightKg: Number(weightKg) || undefined,
      alerts: selectedAlerts.length > 0 ? selectedAlerts : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200 my-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[#9A7DB8] text-[24px]">pets</span>
            <h3 className="font-headline-sm text-base text-slate-900 font-semibold">Alta de nuevo paciente</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md text-xs">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 px-3 rounded-xl text-xs font-semibold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              {errorMessage}
            </div>
          )}

          {/* Datos del Paciente */}
          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-semibold text-xs text-slate-700 block mb-1">Nombre mascota *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Max, Luna..."
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-xs text-slate-700 block mb-1">Especie</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as Species)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
              >
                <option value="Canino">Canino</option>
                <option value="Felino">Felino</option>
                <option value="Ave">Ave</option>
                <option value="Roedor">Roedor</option>
                <option value="Reptil">Reptil</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-semibold text-xs text-slate-700 block mb-1">Raza</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Ej. Labrador, Mestizo..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
              />
            </div>
            <div>
              <label className="font-semibold text-xs text-slate-700 block mb-1">Sexo</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
              >
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-semibold text-xs text-slate-700 block mb-1">Fecha de nacimiento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
              />
            </div>
            <div>
              <label className="font-semibold text-xs text-slate-700 block mb-1">Peso inicial (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                min={0}
                step={0.1}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
              />
            </div>
          </div>

          <hr className="my-xs border-slate-200" />

          {/* Sección Dueño / Tutor con Selector o Alta */}
          <div className="flex flex-col gap-sm">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-xs text-slate-900 block">
                Dueño / tutor responsable *
              </label>
              <div className="flex items-center gap-2 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setTutorMode('existing');
                    if (existingTutores[0]) handleSelectExistingTutor(existingTutores[0].ownerName);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    tutorMode === 'existing'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Elegir existente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTutorMode('new');
                    setOwnerName('');
                    setOwnerPhone('');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    tutorMode === 'new'
                      ? 'bg-[#9A7DB8] text-white shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Crear nuevo
                </button>
              </div>
            </div>

            {tutorMode === 'existing' ? (
              <div className="flex flex-col gap-2">
                <select
                  value={selectedTutorName}
                  onChange={(e) => handleSelectExistingTutor(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                >
                  {existingTutores.map(t => (
                    <option key={t.ownerName} value={t.ownerName}>
                      {t.ownerName} {t.ownerPhone ? `(${t.ownerPhone})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-md bg-purple-50/40 p-md rounded-xl border border-purple-100">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Ej. Ana Gómez..."
                    required={tutorMode === 'new'}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="Ej. +54 9 11 1234-5678"
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <hr className="my-xs border-slate-200" />

          {/* Alertas Médicas Seleccionables */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-xs text-slate-700 block">
              Alertas médicas y conductuales (Seleccionables)
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl">
              {PREDEFINED_ALERTS.map(tag => {
                const isSelected = selectedAlerts.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleAlertChip(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-300'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {isSelected ? 'check_circle' : 'warning_amber'}
                    </span>
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom alert input */}
            <div className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={customAlertInput}
                onChange={(e) => setCustomAlertInput(e.target.value)}
                onKeyDown={handleAddCustomAlert}
                placeholder="Agregar alerta personalizada + Enter..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] shadow-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomAlert}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-xs cursor-pointer"
              >
                Agregar
              </button>
            </div>

            {/* Selected Alerts Preview */}
            {selectedAlerts.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                <span className="text-[10px] text-slate-500 font-semibold self-center">Seleccionadas:</span>
                {selectedAlerts.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => toggleAlertChip(tag)}
                      className="hover:text-red-700 cursor-pointer font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>Guardar paciente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
