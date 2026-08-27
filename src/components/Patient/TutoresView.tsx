import React, { useState, useMemo } from 'react';
import { Patient } from '../../domain/types';
import { getUniqueTutores, updateTutorAndPetInfo, TutorSummary } from '../../domain/services/tutorService';
import { AppNotificationModal } from '../Common/AppNotificationModal';

interface TutoresViewProps {
  patients: Patient[];
  onUpdatePatients: (updatedPatients: Patient[]) => void;
}

export const TutoresView: React.FC<TutoresViewProps> = ({
  patients,
  onUpdatePatients
}) => {
  const tutores = useMemo(() => getUniqueTutores(patients), [patients]);
  const [selectedTutorName, setSelectedTutorName] = useState<string>(tutores[0]?.ownerName || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  const activeTutor = useMemo(() => {
    return tutores.find(t => t.ownerName.toLowerCase() === selectedTutorName.toLowerCase()) || tutores[0];
  }, [tutores, selectedTutorName]);

  const filteredTutores = useMemo(() => {
    return tutores.filter(t => 
      t.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.ownerPhone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.pets.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tutores, searchQuery]);

  // Edit Modal Form State
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerPhone, setEditOwnerPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPetFields, setEditPetFields] = useState<Record<string, { name: string; species: any; breed: string; weightKg: number }>>({});

  const handleOpenEdit = () => {
    if (!activeTutor) return;
    setEditOwnerName(activeTutor.ownerName);
    setEditOwnerPhone(activeTutor.ownerPhone);
    setEditAddress(activeTutor.address || '');

    const initialPetState: Record<string, { name: string; species: any; breed: string; weightKg: number }> = {};
    activeTutor.pets.forEach(p => {
      initialPetState[p.id] = {
        name: p.name,
        species: p.species,
        breed: p.breed,
        weightKg: p.weightKg || 0
      };
    });
    setEditPetFields(initialPetState);
    setShowEditModal(true);
  };

  const [notifModal, setNotifModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTutor || !editOwnerName.trim()) return;

    const updated = updateTutorAndPetInfo(patients, activeTutor.ownerName, {
      newOwnerName: editOwnerName.trim(),
      newOwnerPhone: editOwnerPhone.trim(),
      petUpdates: editPetFields
    });

    onUpdatePatients(updated);
    setSelectedTutorName(editOwnerName.trim());
    setShowEditModal(false);
    setNotifModal({
      isOpen: true,
      message: '¡Datos del tutor y sus mascotas actualizados correctamente!'
    });
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  };

  if (!activeTutor) {
    return <div className="p-md text-on-surface-variant">No se encontraron tutores registrados.</div>;
  }

  return (
    <div className="flex flex-col md:flex-row gap-md w-full h-full flex-1 overflow-hidden font-body-md text-on-surface">
      {/* Left Column: Tutores Master List */}
      <aside className="flex flex-col w-full md:w-64 xl:w-72 gap-xs shrink-0 overflow-hidden">
        <div className="flex items-center justify-between px-xs">
          <h2 className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold truncate">
            Padrón de Tutores ({filteredTutores.length})
          </h2>
        </div>

        {/* Quick Search */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-xs flex items-center relative border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant ml-sm mr-xs text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tutor, teléfono o mascota..."
            className="w-full bg-transparent outline-none p-xs font-body-md text-xs text-on-surface placeholder:text-on-surface-variant"
          />
        </div>

        {/* Tutores List */}
        <div className="flex flex-col gap-xs overflow-y-auto flex-1 pr-1 mt-xs">
          {filteredTutores.map((tutor) => {
            const isSelected = tutor.ownerName.toLowerCase() === activeTutor.ownerName.toLowerCase();
            return (
              <button
                key={tutor.ownerName}
                onClick={() => setSelectedTutorName(tutor.ownerName)}
                className={`p-xs px-sm rounded-xl shadow-sm flex items-center gap-sm text-left transition-all relative border ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-md'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-outline-variant/30'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-highest text-primary flex items-center justify-center shrink-0 shadow-sm font-bold text-sm">
                  {tutor.ownerName.slice(0, 2).toUpperCase()}
                </div>

                <div className="flex flex-col flex-1 min-w-0">
                  <span className={`font-headline-sm text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-on-background'}`}>
                    {tutor.ownerName}
                  </span>
                  <span className={`font-body-md text-[11px] truncate ${isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`}>
                    {tutor.ownerPhone}
                  </span>
                  <span className={`font-label-sm text-[10px] truncate ${isSelected ? 'text-primary-fixed-dim' : 'text-primary font-bold'}`}>
                    {tutor.pets.length} {tutor.pets.length === 1 ? 'mascota' : 'mascotas'} ({tutor.pets.map(p => p.name).join(', ')})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Column: Tutor Details & Associated Pets */}
      <main className="flex flex-col flex-1 min-w-0 gap-md overflow-y-auto">
        {/* Tutor Hero Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-md shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xl shadow-md shrink-0">
              {activeTutor.ownerName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-sm">
                <h1 className="font-display-lg text-[22px] text-primary font-bold leading-tight">{activeTutor.ownerName}</h1>
                <span className="bg-secondary-container text-on-secondary-container text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Tutor Registrado
                </span>
              </div>
              <p className="font-body-md text-xs text-on-surface-variant flex flex-wrap items-center gap-md mt-xs">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[15px]">call</span>
                  {activeTutor.ownerPhone}
                </span>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[15px]">location_on</span>
                  {activeTutor.address || 'San Juan 450'}
                </span>
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[15px]">mail</span>
                  {activeTutor.email}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-sm">
            {activeTutor.ownerPhone && (
              <a
                href={`https://wa.me/${cleanPhone(activeTutor.ownerPhone)}`}
                target="_blank"
                rel="noreferrer"
                className="bg-[#25D366] text-white hover:bg-[#1EBE5D] px-md py-2 rounded-xl font-label-md text-xs flex items-center gap-xs transition-colors shadow-sm font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                WhatsApp
              </a>
            )}
            <button
              onClick={handleOpenEdit}
              className="bg-primary text-on-primary hover:bg-primary-container px-md py-2 rounded-xl font-label-md text-xs flex items-center gap-xs transition-colors shadow-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Editar Datos de Tutor y Mascota
            </button>
          </div>
        </div>

        {/* Associated Pets Section */}
        <div className="bg-surface-container-lowest rounded-2xl p-md shadow-sm border border-outline-variant/30 flex-1">
          <h2 className="font-headline-sm text-sm font-bold text-on-surface mb-md flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-[18px]">pets</span>
            Mascotas Asociadas a {activeTutor.ownerName} ({activeTutor.pets.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
            {activeTutor.pets.map((pet) => (
              <div key={pet.id} className="bg-surface-container-low rounded-2xl p-md border border-outline-variant/30 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center gap-md mb-sm">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high overflow-hidden shadow-xs flex items-center justify-center shrink-0">
                    {pet.photoUrl ? (
                      <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[24px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline-sm text-base text-primary font-bold truncate">{pet.name}</h3>
                    <p className="font-body-md text-xs text-on-surface-variant truncate">
                      {pet.species} • {pet.breed}
                    </p>
                    <p className="font-label-sm text-[11px] text-secondary font-bold">
                      {pet.sex} • {pet.weightKg} kg
                    </p>
                  </div>
                </div>

                <div className="border-t border-surface-container pt-xs flex justify-between items-center text-xs text-on-surface-variant">
                  <span>ID: {pet.id}</span>
                  <span className="bg-surface-container-highest px-2 py-0.5 rounded-full text-[10px] font-bold text-primary">
                    Paciente Activo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Edit Tutor & Pets Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-lg shadow-xl flex flex-col gap-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-sm">
              <h3 className="font-headline-sm text-primary font-bold text-base flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
                Editar Datos del Tutor y sus Mascotas
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-on-surface-variant hover:text-error">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex flex-col gap-md">
              {/* Tutor Section */}
              <div className="bg-surface-container-low p-md rounded-xl flex flex-col gap-sm border border-outline-variant/30">
                <h4 className="font-label-md text-xs text-primary uppercase font-bold tracking-wider">
                  1. Datos del Tutor (Propietario)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-sm text-xs">
                  <div>
                    <label className="font-label-md text-on-surface-variant block mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={editOwnerName}
                      onChange={(e) => setEditOwnerName(e.target.value)}
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-xs px-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="font-label-md text-on-surface-variant block mb-1">Teléfono de Contacto</label>
                    <input
                      type="text"
                      value={editOwnerPhone}
                      onChange={(e) => setEditOwnerPhone(e.target.value)}
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-xs px-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="font-label-md text-on-surface-variant block mb-1">Dirección / Domicilio</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-xs px-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Pets Section */}
              <div className="bg-surface-container-low p-md rounded-xl flex flex-col gap-sm border border-outline-variant/30">
                <h4 className="font-label-md text-xs text-primary uppercase font-bold tracking-wider">
                  2. Datos de las Mascotas Asociadas
                </h4>

                {activeTutor.pets.map((pet) => {
                  const pFields = editPetFields[pet.id] || {
                    name: pet.name,
                    species: pet.species,
                    breed: pet.breed,
                    weightKg: pet.weightKg
                  };

                  return (
                    <div key={pet.id} className="bg-surface-container-lowest p-sm rounded-xl border border-outline-variant/40 flex flex-col gap-xs text-xs">
                      <span className="font-bold text-secondary text-xs">Mascota: {pet.name} (ID: {pet.id})</span>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-xs">
                        <div>
                          <label className="text-[10px] text-on-surface-variant block">Nombre</label>
                          <input
                            type="text"
                            value={pFields.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditPetFields(prev => ({
                                ...prev,
                                [pet.id]: { ...prev[pet.id], name: val }
                              }));
                            }}
                            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-xs text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-on-surface-variant block">Especie</label>
                          <input
                            type="text"
                            value={pFields.species}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditPetFields(prev => ({
                                ...prev,
                                [pet.id]: { ...prev[pet.id], species: val }
                              }));
                            }}
                            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-xs text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-on-surface-variant block">Raza</label>
                          <input
                            type="text"
                            value={pFields.breed}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditPetFields(prev => ({
                                ...prev,
                                [pet.id]: { ...prev[pet.id], breed: val }
                              }));
                            }}
                            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-xs text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-on-surface-variant block">Peso (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={pFields.weightKg}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditPetFields(prev => ({
                                ...prev,
                                [pet.id]: { ...prev[pet.id], weightKg: val }
                              }));
                            }}
                            className="w-full bg-surface-container border border-outline-variant/30 rounded-lg p-xs text-xs outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-sm pt-xs border-t">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-md py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-md py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold shadow-sm cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppNotificationModal
        isOpen={notifModal.isOpen}
        message={notifModal.message}
        type="success"
        onClose={() => setNotifModal({ isOpen: false, message: '' })}
      />
    </div>
  );
};
