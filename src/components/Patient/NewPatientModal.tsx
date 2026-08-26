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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim()) {
      alert('Por favor complete el nombre de la mascota y del propietario.');
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-md">
      <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-lg shadow-xl flex flex-col gap-md">
        <div className="flex justify-between items-center border-b border-surface-variant pb-sm">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">pets</span>
            <h3 className="font-headline-sm text-base text-primary font-bold">Alta de Nuevo Paciente</h3>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-error">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-xs text-xs">
          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Nombre Mascota *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Max, Luna..."
                required
                className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Especie</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value as Species)}
                className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
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

          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Raza</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Ej. Labrador, Mestizo..."
                className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Sexo</label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as Sex)}
                className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              >
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Peso Inicial (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                min={0}
                step={0.1}
                className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          <hr className="my-xs border-surface-variant/50" />

          <div className="grid grid-cols-2 gap-sm">
            <div>
              <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Nombre Dueño *</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ej. Ana Gómez..."
                required
                className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="Ej. +54 9 11 1234-5678"
                className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          <div>
            <label className="font-label-md text-on-surface-variant uppercase text-[11px] block mb-1">Alertas Médicas (Separadas por comas)</label>
            <input
              type="text"
              value={alertsInput}
              onChange={(e) => setAlertsInput(e.target.value)}
              placeholder="Ej. ⚠️ Alérgico a Penicilina, Diabético, Esterilizado"
              className="w-full bg-surface-container border-none rounded-xl p-sm outline-none text-on-surface text-xs focus:ring-2 focus:ring-secondary"
            />
          </div>

          <button type="submit" className="bg-primary text-on-primary py-2 rounded-xl font-label-md text-xs mt-md hover:bg-primary-container font-bold shadow-sm">
            Guardar Paciente
          </button>
        </form>
      </div>
    </div>
  );
};
