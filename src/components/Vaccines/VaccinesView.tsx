import React, { useState } from 'react';
import { Patient, VaccineCatalogItem, VaccineDosis } from '../../domain/types';
import { formatVaccineReminderMessage } from '../../domain/services/vaccineService';
import { AppConfirmModal } from '../Common/AppConfirmModal';

interface VaccinesViewProps {
  patients?: Patient[];
  selectedPatient: Patient;
  onSelectPatient?: (patient: Patient) => void;
  vaccineCatalog: VaccineCatalogItem[];
  onAddVaccineToCatalog: (name: string, frequencyDays: number) => void;
  onUpdateVaccineInCatalog?: (id: string, name: string, frequencyDays: number) => void;
  onDeleteVaccineFromCatalog?: (id: string) => void;
  vaccineDoses: VaccineDosis[];
  onRegisterDosis: (dosis: { patientId?: string; vaccineId: string; applicationDate: string; vetName: string; batch?: string }) => void;
  onScheduleAppointment: (patientId: string, vaccineName?: string) => void;
  onDeleteDosis?: (dosisId: string) => void;
  onRemoveDosisByVaccine?: (patientId: string, vaccineName: string) => void;
  currentVetName?: string;
  isGeneralCatalog?: boolean;
  onUpdatePatients?: (updatedPatients: Patient[]) => void;
}

export const VaccinesView: React.FC<VaccinesViewProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  vaccineCatalog,
  onAddVaccineToCatalog,
  onUpdateVaccineInCatalog,
  onDeleteVaccineFromCatalog,
  vaccineDoses = [],
  onRegisterDosis,
  onScheduleAppointment,
  onDeleteDosis,
  onRemoveDosisByVaccine,
  currentVetName = 'Dr. J. Silva',
  isGeneralCatalog = false,
  onUpdatePatients
}) => {
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingItem, setEditingItem] = useState<VaccineCatalogItem | null>(null);

  const handleToggleVaccineAppliedInVaccinesView = (vacId: string) => {
    if (!patients || !onUpdatePatients) return;
    const currentReqs = selectedPatient.requiredVaccines || [];
    let toggledVacName = '';
    let isNowApplied = false;

    const updatedReqs = currentReqs.map(v => {
      if (v.id === vacId) {
        toggledVacName = v.vaccineName;
        isNowApplied = v.status === 'pendiente';
        return {
          ...v,
          status: (isNowApplied ? 'aplicada' : 'pendiente') as 'pendiente' | 'aplicada',
          appliedDate: isNowApplied ? new Date().toISOString().split('T')[0] : undefined
        };
      }
      return v;
    });

    const updatedPatient: Patient = {
      ...selectedPatient,
      requiredVaccines: updatedReqs
    };

    const updatedList = patients.map(p => p.id === selectedPatient.id ? updatedPatient : p);
    onUpdatePatients(updatedList);
    if (onSelectPatient) onSelectPatient(updatedPatient);

    // Agregar o Remover del Historial de Vacunación
    if (isNowApplied && onRegisterDosis) {
      const matchedCat = vaccineCatalog.find(c => c.name.toLowerCase() === toggledVacName.toLowerCase());
      onRegisterDosis({
        patientId: selectedPatient.id,
        vaccineId: matchedCat ? matchedCat.id : toggledVacName,
        applicationDate: new Date().toISOString().split('T')[0],
        vetName: currentVetName || 'Dr. J. Silva'
      });
    } else if (!isNowApplied && onRemoveDosisByVaccine) {
      onRemoveDosisByVaccine(selectedPatient.id, toggledVacName);
    }
  };
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; vaccineId: string; vaccineName: string }>({
    isOpen: false,
    vaccineId: '',
    vaccineName: ''
  });
  const [patientSearch, setPatientSearch] = useState('');

  // New / edit catalog item state
  const [newVacName, setNewVacName] = useState('');
  const [newVacDays, setNewVacDays] = useState(365);

  // Register dosis state
  const [selectedVacId, setSelectedVacId] = useState(vaccineCatalog[0]?.id || '');
  const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [vetName, setVetName] = useState(currentVetName || 'Dr. J. Silva');
  const [batchNum, setBatchNum] = useState('');

  const activePatient = selectedPatient;
  const patientDoses = vaccineDoses.filter(d => d.patientId === activePatient.id);
  const dueOrExpiredDosis = patientDoses.find(d => d.status === 'expired' || d.status === 'due_soon');

  const filteredPatients = (patients || []).filter(p => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.species.toLowerCase().includes(patientSearch.toLowerCase()) ||
    p.ownerName.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleCatalogAddOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVacName.trim()) return;

    if (editingItem) {
      if (onUpdateVaccineInCatalog) {
        onUpdateVaccineInCatalog(editingItem.id, newVacName.trim(), Number(newVacDays));
      } else {
        editingItem.name = newVacName.trim();
        editingItem.frequencyDays = Number(newVacDays);
      }
      setEditingItem(null);
    } else {
      onAddVaccineToCatalog(newVacName.trim(), Number(newVacDays));
    }

    setNewVacName('');
    setNewVacDays(365);
    setShowCatalogModal(false);
  };

  const handleOpenEditModal = (item: VaccineCatalogItem) => {
    setEditingItem(item);
    setNewVacName(item.name);
    setNewVacDays(item.frequencyDays);
    setShowCatalogModal(true);
  };

  const handleRegisterDosis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVacId) return;
    onRegisterDosis({
      patientId: selectedPatient.id,
      vaccineId: selectedVacId,
      applicationDate: appDate,
      vetName,
      batch: batchNum || undefined
    });
    setBatchNum('');
    setShowRegisterModal(false);
  };

  // General Clinic Vaccine Catalog View (NO Patient Selector)
  if (isGeneralCatalog) {
    return (
      <div className="flex flex-col w-full gap-md font-body-md text-slate-800">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md mb-md">
          <div>
            <h1 className="font-display-lg text-[22px] text-slate-900 font-semibold leading-tight">
              Vacunas — Catálogo general (Clínica)
            </h1>
            <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
              Configuración general de biológicos, definición de plazos de inmunización y parámetros institucionales
            </p>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              setNewVacName('');
              setNewVacDays(365);
              setShowCatalogModal(true);
            }}
            className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 transition-colors shadow-sm font-semibold cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Agregar vacuna al catálogo</span>
          </button>
        </div>

        {/* Catalog Table */}
        <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex-1 overflow-hidden">
          <div className="flex items-center justify-between mb-md">
            <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
              <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">list_alt</span>
              Vacunas registradas en la clínica ({vaccineCatalog.length})
            </h2>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-semibold text-[11px] border-b border-slate-200">
                  <th className="p-sm px-md">Nombre de la vacuna</th>
                  <th className="p-sm px-md">Frecuencia / vigencia</th>
                  <th className="p-sm px-md">Equivalente meses</th>
                  <th className="p-sm px-md text-center">Estado</th>
                  <th className="p-sm px-md text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-slate-800">
                {vaccineCatalog.map((item) => {
                  const months = Math.round(item.frequencyDays / 30);
                  return (
                    <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <td className="p-sm px-md font-medium text-slate-900 text-xs">{item.name}</td>
                      <td className="p-sm px-md font-medium text-slate-800">{item.frequencyDays} días</td>
                      <td className="p-sm px-md text-slate-600 font-medium">~ {months} {months === 1 ? 'mes' : 'meses'}</td>
                      <td className="p-sm px-md text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                          Activa
                        </span>
                      </td>
                      <td className="p-sm px-md text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-3 py-1.5 rounded-lg font-label-md text-xs inline-flex items-center gap-1 transition-colors font-semibold cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">edit</span>
                            <span>Modificar</span>
                          </button>
                          {onDeleteVaccineFromCatalog && (
                            <button
                              onClick={() => setDeleteConfirm({ isOpen: true, vaccineId: item.id, vaccineName: item.name })}
                              className="bg-red-50 hover:bg-red-100 text-error border border-red-200 p-1.5 rounded-lg text-xs inline-flex items-center transition-colors cursor-pointer"
                              title="Eliminar vacuna del catálogo"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Catalog Add/Edit */}
        {showCatalogModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
                <h3 className="font-headline-sm text-slate-900 font-semibold text-base">
                  {editingItem ? 'Modificar vacuna del catálogo' : 'Agregar vacuna al catálogo'}
                </h3>
                <button onClick={() => setShowCatalogModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <form onSubmit={handleCatalogAddOrEdit} className="flex flex-col gap-md text-xs">
                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Nombre de la vacuna *</label>
                  <input
                    type="text"
                    value={newVacName}
                    onChange={(e) => setNewVacName(e.target.value)}
                    placeholder=""
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 shadow-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-xs text-slate-700 block mb-1">Frecuencia / plazo de vigencia (días) *</label>
                  <input
                    type="number"
                    value={newVacDays}
                    onChange={(e) => setNewVacDays(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowCatalogModal(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>{editingItem ? 'Guardar cambios' : 'Agregar al catálogo'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <AppConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Confirmar eliminación de vacuna"
          message={`¿Está seguro de que desea eliminar la vacuna "${deleteConfirm.vaccineName}" del catálogo general de la clínica?`}
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          isDanger={true}
          onConfirm={() => {
            if (onDeleteVaccineFromCatalog && deleteConfirm.vaccineId) {
              onDeleteVaccineFromCatalog(deleteConfirm.vaccineId);
            }
            setDeleteConfirm({ isOpen: false, vaccineId: '', vaccineName: '' });
          }}
          onCancel={() => setDeleteConfirm({ isOpen: false, vaccineId: '', vaccineName: '' })}
        />
      </div>
    );
  }

  // Patients Module: Control de Vacunas (With Master Patient Selection)
  return (
    <div className="flex flex-col md:flex-row gap-md w-full h-full flex-1 overflow-hidden font-body-md text-slate-800">
      {/* Left Column: All Patients Master List */}
      {patients && patients.length > 0 && (
        <aside className="flex flex-col w-full md:w-64 xl:w-72 gap-xs shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-xs">
            <h2 className="font-label-md text-xs text-slate-700 font-semibold">
              Pacientes vacunatorio ({filteredPatients.length})
            </h2>
          </div>

          {/* Quick Search */}
          <div className="bg-white rounded-xl shadow-sm p-xs flex items-center relative border border-slate-300">
            <span className="material-symbols-outlined text-slate-400 ml-sm mr-xs text-[18px]">
              search
            </span>
            <input
              type="text"
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Buscar paciente o dueño..."
              className="w-full bg-transparent outline-none p-xs font-body-md text-xs text-slate-800 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Patient List */}
          <div className="flex flex-col gap-xs overflow-y-auto flex-1 pr-1 mt-xs">
            {filteredPatients.map((p) => {
              const isSelected = p.id === activePatient.id;
              const pDoses = vaccineDoses.filter(d => d.patientId === p.id);
              const hasExpired = pDoses.some(d => d.status === 'expired');

              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPatient && onSelectPatient(p)}
                  className={`p-xs px-sm rounded-xl shadow-sm flex items-center gap-sm text-left transition-all relative overflow-hidden group cursor-pointer border ${
                    isSelected
                      ? 'bg-white text-slate-900 border-l-4 border-l-[#9A7DB8] border-purple-300 shadow-md ring-1 ring-[#9A7DB8]/30'
                      : 'bg-white text-slate-800 hover:bg-purple-50/50 border-slate-200'
                  }`}
                >
                  <div className={`relative w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0 flex items-center justify-center ${
                    isSelected ? 'bg-purple-50 border border-[#9A7DB8]/40' : 'bg-slate-100'
                  }`}>
                    {p.photoUrl ? (
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <span className={`material-symbols-outlined text-[22px] absolute ${isSelected ? 'text-[#9A7DB8]' : 'text-slate-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        pets
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col flex-1 min-w-0 z-10">
                    <div className="flex items-center justify-between">
                      <span className={`font-headline-sm text-xs font-semibold truncate ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                        {p.name}
                      </span>
                      {hasExpired ? (
                        <span className="bg-red-50 text-red-700 border border-red-200 text-[9px] font-semibold px-1.5 py-0.2 rounded-full">Vencida</span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold px-1.5 py-0.2 rounded-full">Al día</span>
                      )}
                    </div>
                    <span className={`font-body-md text-[11px] truncate ${isSelected ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                      {p.species} • {p.breed}
                    </span>
                    <span className={`font-label-sm text-[10px] truncate ${isSelected ? 'text-slate-700 font-semibold' : 'text-slate-500'}`}>
                      Dueño: {p.ownerName}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* Right Main Column: Active Patient Vaccine Detail */}
      <main className="flex flex-col flex-1 gap-md min-w-0 overflow-y-auto">
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md bg-white p-md rounded-2xl shadow-sm border border-slate-200 shrink-0">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-200 overflow-hidden shadow-sm flex items-center justify-center shrink-0">
              {activePatient.photoUrl ? (
                <img src={activePatient.photoUrl} alt={activePatient.name} className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[24px] text-[#9A7DB8]" style={{ fontVariationSettings: "'FILL' 1" }}>pets</span>
              )}
            </div>
            <div>
              <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-semibold">{activePatient.name}</h1>
              <p className="font-body-md text-xs text-slate-600 font-medium flex items-center gap-xs mt-0.5">
                <span>{activePatient.species}, {activePatient.breed} • {activePatient.sex} • Dueño: <strong className="text-slate-900 font-semibold">{activePatient.ownerName}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex gap-sm">
            <button
              onClick={() => setShowRegisterModal(true)}
              className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 transition-colors shadow-sm font-semibold cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Registrar aplicación</span>
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-md flex-1">
          <div className="xl:col-span-2 flex flex-col gap-md">
            {/* Tarjeta Vacunas Necesarias del Paciente (Cargadas en Ficha) */}
            {activePatient.requiredVaccines && activePatient.requiredVaccines.length > 0 && (
              <div className="bg-emerald-50/50 rounded-2xl p-md shadow-sm border border-emerald-300 flex flex-col gap-xs w-full col-span-full">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline-sm text-xs font-bold text-emerald-950 flex items-center gap-xs">
                    <span className="material-symbols-outlined text-emerald-700 text-[18px]">vaccines</span>
                    Vacunas necesarias / requeridas ({activePatient.name})
                  </h2>
                  <span className="text-[11px] text-emerald-800 font-medium">Cargadas desde la ficha del paciente</span>
                </div>

                <div className="flex flex-col gap-xs mt-1 w-full">
                  {activePatient.requiredVaccines.map(vac => (
                    <div
                      key={vac.id}
                      className="p-3 rounded-xl border border-emerald-200 bg-emerald-100/60 text-emerald-950 flex items-center justify-between gap-sm text-xs w-full shadow-2xs"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-bold text-xs text-emerald-950 truncate">{vac.vaccineName}</span>
                        <span className="text-[11px] text-emerald-800 font-medium">
                          Sugerida: <strong>{vac.suggestedDate}</strong>
                          {vac.appliedDate && ` • Aplicada: ${vac.appliedDate}`}
                        </span>
                        {vac.notes && <span className="text-[11px] text-emerald-700 italic truncate">{vac.notes}</span>}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleVaccineAppliedInVaccinesView(vac.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs cursor-pointer whitespace-nowrap transition-all ${
                          vac.status === 'aplicada'
                            ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {vac.status === 'aplicada' ? '✓ Aplicada' : 'Marcar aplicada'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historial Table */}
            <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200">
              <h2 className="font-headline-sm text-sm font-semibold text-slate-900 mb-md flex items-center gap-xs">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">vaccines</span>
                Historial de vacunación — {activePatient.name}
              </h2>

              <div className="w-full overflow-x-auto">
                <table className="w-full text-left font-body-md text-xs whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                      <th className="py-2 px-md">Vacuna</th>
                      <th className="py-2 px-md">Fecha aplicación</th>
                      <th className="py-2 px-md">Profesional</th>
                      <th className="py-2 px-md">Fecha límite</th>
                      <th className="py-2 px-md">Vencimiento</th>
                      <th className="py-2 px-md">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800">
                    {(() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const pendingReqs = (activePatient.requiredVaccines || []).filter(
                        v => v.status === 'pendiente' && !patientDoses.some(d => d.vaccineName.toLowerCase() === v.vaccineName.toLowerCase())
                      );

                      if (patientDoses.length === 0 && pendingReqs.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-md text-center text-slate-500 text-xs font-medium">
                              No hay vacunas registradas para {activePatient.name}.
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <>
                          {/* Dosis Aplicadas */}
                          {patientDoses.map((dose) => {
                            const isExpired = dose.status === 'expired' || dose.expirationDate < todayStr;
                            return (
                              <tr key={dose.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                <td className="py-sm px-md font-medium text-slate-900 text-xs">{dose.vaccineName}</td>
                                <td className="py-sm px-md font-medium text-slate-800">{dose.applicationDate}</td>
                                <td className="py-sm px-md flex items-center gap-xs font-medium text-slate-800">
                                  <div className="w-5 h-5 rounded-full bg-purple-100 text-[#5C3C7B] flex items-center justify-center font-semibold text-[10px]">
                                    {dose.vetName.slice(0, 2).toUpperCase()}
                                  </div>
                                  {dose.vetName}
                                </td>
                                <td className={`py-sm px-md font-semibold ${
                                  isExpired ? 'text-red-700' : 'text-slate-800'
                                }`}>
                                  {dose.expirationDate}
                                </td>
                                <td className="py-sm px-md">
                                  {isExpired ? (
                                    <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold text-[10px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                      Vencida
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                      Al día
                                    </span>
                                  )}
                                </td>
                                <td className="py-sm px-md">
                                  <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                    Aplicada
                                  </span>
                                </td>
                              </tr>
                            );
                          })}

                          {/* Vacunas Requeridas Pendientes */}
                          {pendingReqs.map((req) => {
                            const isExpired = req.suggestedDate < todayStr;
                            return (
                              <tr key={req.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                <td className="py-sm px-md font-medium text-slate-900 text-xs">{req.vaccineName}</td>
                                <td className="py-sm px-md font-medium text-slate-400">-</td>
                                <td className="py-sm px-md font-medium text-slate-400">-</td>
                                <td className={`py-sm px-md font-semibold ${
                                  isExpired ? 'text-red-700' : 'text-slate-800'
                                }`}>
                                  {req.suggestedDate}
                                </td>
                                <td className="py-sm px-md">
                                  {isExpired ? (
                                    <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold text-[10px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                      Vencida
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[10px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                      Al día
                                    </span>
                                  )}
                                </td>
                                <td className="py-sm px-md">
                                  <span className="inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                    Pendiente
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {/* Próxima Aplicación Card */}
              <div className="bg-[#9A7DB8] text-white rounded-2xl p-md shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div>
                  <h3 className="font-label-md text-purple-100 text-[10px] mb-xs font-semibold">Próxima aplicación</h3>
                  <p className="font-display-lg text-lg mb-xs font-semibold">
                    {dueOrExpiredDosis ? dueOrExpiredDosis.vaccineName : (activePatient.requiredVaccines?.[0]?.vaccineName || 'Antirrábica')}
                  </p>
                  <p className="font-body-md text-purple-100 text-xs flex items-center gap-xs mb-md font-medium">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    {dueOrExpiredDosis 
                      ? `${dueOrExpiredDosis.status === 'expired' ? 'Vencida desde el' : 'Próxima a vencer el'} ${dueOrExpiredDosis.expirationDate}`
                      : 'Sin vacunas vencidas pendientes'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const vacName = dueOrExpiredDosis 
                      ? dueOrExpiredDosis.vaccineName 
                      : (activePatient.requiredVaccines?.[0]?.vaccineName || 'Antirrábica');
                    onScheduleAppointment(activePatient.id, vacName);
                  }}
                  className="w-full bg-white text-[#5C3C7B] hover:bg-purple-50 py-2.5 rounded-xl font-label-md text-xs transition-colors font-semibold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  <span>Agendar turno</span>
                </button>
              </div>

              {/* Cobertura Actual Card */}
              {(() => {
                const reqList = activePatient.requiredVaccines || [];
                const reqTotal = reqList.length;
                const reqApplied = reqList.filter(v => v.status === 'aplicada').length;
                const reqPct = reqTotal > 0 ? Math.round((reqApplied / reqTotal) * 100) : 0;
                return (
                  <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div>
                      <h3 className="font-label-md text-slate-600 text-[10px] mb-xs font-semibold">Cobertura actual</h3>
                      <div className="flex items-end gap-sm mb-sm">
                        <span className="font-display-lg text-2xl text-slate-900 font-semibold">
                          {reqPct}%
                        </span>
                        <span className="font-body-md text-xs text-slate-600 pb-0.5 font-medium">
                          {reqApplied} de {reqTotal} aplicadas
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="bg-[#9A7DB8] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${reqPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Recordatorios Panel */}
          <div className="flex flex-col gap-md">
            <div className="bg-white rounded-2xl p-md shadow-sm border border-slate-200 h-full">
              <div className="flex items-center justify-between mb-md">
                <h2 className="font-headline-sm text-sm font-semibold text-slate-900 flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">campaign</span>
                  Recordatorios de vacunas
                </h2>
              </div>

              {(() => {
                const cleanPhone = (phone?: string) => phone ? phone.replace(/[^0-9]/g, '') : '';
                const remVacName = dueOrExpiredDosis ? dueOrExpiredDosis.vaccineName : (activePatient.requiredVaccines?.[0]?.vaccineName || 'Antirrábica');
                const remExpDate = dueOrExpiredDosis ? dueOrExpiredDosis.expirationDate : (activePatient.requiredVaccines?.[0]?.suggestedDate || '2026-10-15');
                const reminderText = formatVaccineReminderMessage(
                  activePatient.ownerName,
                  remVacName,
                  activePatient.name,
                  remExpDate
                );

                return (
                  <div className="flex flex-col gap-sm relative">
                    <div className="relative z-10 flex gap-sm">
                      <div className="w-7 h-7 rounded-full bg-purple-50 shadow-xs flex items-center justify-center border border-purple-200 shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[14px] text-[#9A7DB8]">sms</span>
                      </div>
                      <div className="flex-1 bg-purple-50/60 border border-purple-100 rounded-xl p-sm">
                        <div className="flex justify-between items-start mb-0.5">
                          <span className="font-label-md text-xs text-slate-900 font-semibold">{remVacName}</span>
                          <span className="font-label-sm text-[10px] text-slate-500 font-medium">Hoy, 09:00</span>
                        </div>
                        <p className="font-body-md text-slate-700 text-[11px] mb-1 font-normal leading-relaxed">
                          "{reminderText}"
                        </p>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-purple-100/60">
                          <div className="flex items-center gap-xs">
                            <span className="material-symbols-outlined text-[13px] text-[#9A7DB8]">done_all</span>
                            <span className="font-label-sm text-[10px] text-[#5C3C7B] font-semibold">Entregado</span>
                          </div>
                          {activePatient.ownerPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone(activePatient.ownerPhone)}?text=${encodeURIComponent(reminderText)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-[#25D366] hover:underline flex items-center gap-0.5"
                            >
                              <span className="material-symbols-outlined text-[12px]">chat</span>
                              Enviar por WhatsApp
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>

      {/* Register Dosis Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
              <h3 className="font-headline-sm text-slate-900 text-base font-semibold">
                Registrar aplicación de vacuna ({activePatient.name})
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterDosis} className="flex flex-col gap-md text-xs">
              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Seleccionar vacuna *</label>
                <select
                  value={selectedVacId}
                  onChange={(e) => setSelectedVacId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                >
                  {vaccineCatalog.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.frequencyDays} días)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Fecha de aplicación *</label>
                <input
                  type="date"
                  value={appDate}
                  onChange={(e) => setAppDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs cursor-pointer"
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Veterinario actuante *</label>
                <input
                  type="text"
                  value={vetName}
                  onChange={(e) => setVetName(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-sm pt-sm mt-xs border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl font-label-md text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Guardar dosis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AppConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Confirmar eliminación de vacuna"
        message={`¿Está seguro de que desea eliminar la vacuna "${deleteConfirm.vaccineName}" del catálogo general de la clínica?`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={() => {
          if (onDeleteVaccineFromCatalog && deleteConfirm.vaccineId) {
            onDeleteVaccineFromCatalog(deleteConfirm.vaccineId);
          }
          setDeleteConfirm({ isOpen: false, vaccineId: '', vaccineName: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, vaccineId: '', vaccineName: '' })}
      />
    </div>
  );
};
