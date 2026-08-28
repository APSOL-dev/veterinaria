import React, { useState } from 'react';
import { Species, Sex } from '../../domain/types';

interface NewPatientModalProps {
  onClose: () => void;
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
  onAddPatient
}) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState<Species>('Canino');
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState<Sex>('Macho');
  const [birthDate, setBirthDate] = useState('2022-01-01');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [weightKg, setWeightKg] = useState(10);
  const [alertsInput, setAlertsInput] = useState('');

  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim()) {
      setErrorMessage('Por favor complete el nombre de la mascota y del propietario.');
      return;
    }

    const alertsArray = alertsInput
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    onAddPatient({
      name: name.trim(),
      species,
      breed: breed.trim() || 'Mestizo',
      sex,
      birthDate,
      ownerName: ownerName.trim(),
      ownerPhone: ownerPhone.trim() || undefined,
      weightKg: Number(weightKg) || undefined,
      alerts: alertsArray.length > 0 ? alertsArray : undefined
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[#9A7DB8] text-[24px]">pets</span>
            <h3 className="font-headline-sm text-base text-slate-900 font-bold">Alta de Nuevo Paciente</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-md text-xs">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 px-3 rounded-xl text-xs font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Nombre Mascota *</label>
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
              <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Especie</label>
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
              <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Raza</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Ej. Labrador, Mestizo..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
              />
            </div>
            <div>
              <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Sexo</label>
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
              <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
              />
            </div>
            <div>
              <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Peso Inicial (kg)</label>
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

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Nombre Dueño *</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ej. Ana Gómez..."
                required
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
              />
            </div>
            <div>
              <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="Ej. +54 9 11 1234-5678"
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-label-md text-slate-700 uppercase text-[10px] font-bold block mb-1">Alertas Médicas (Separadas por comas)</label>
            <input
              type="text"
              value={alertsInput}
              onChange={(e) => setAlertsInput(e.target.value)}
              placeholder="Ej. Alérgico a Penicilina, Diabético, Esterilizado"
              className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-md py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-lg py-2.5 rounded-xl font-label-md text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Guardar Paciente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
