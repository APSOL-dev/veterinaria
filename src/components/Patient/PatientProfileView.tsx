import React, { useState, useMemo } from 'react';
import { Patient, ClinicalNote, VaccineDosis, Species, Sex, PatientRequiredVaccine, VaccineCatalogItem, MedicalAppointment, GroomingAppointment } from '../../domain/types';
import { filterPatients, calculateWeightTrend, updatePatientRecord } from '../../domain/services/patientService';
import { NewPatientModal } from './NewPatientModal';
import { PrescriptionModal } from './PrescriptionModal';
import { AppNotificationModal } from '../Common/AppNotificationModal';

interface PatientProfileViewProps {
  patients: Patient[];
  selectedPatient: Patient;
  onSelectPatient: (patient: Patient) => void;
  clinicalNotes: ClinicalNote[];
  onAddClinicalNote: (note: { notes: string; prescription?: string }) => void;
  vaccineDoses: VaccineDosis[];
  onNavigateToTab: (tabName: string) => void;
  onAddPatient?: (patientData: any) => void;
  onUpdatePatients?: (updatedPatients: Patient[]) => void;
  vaccineCatalog?: VaccineCatalogItem[];
  onRegisterDosis?: (dosis: { vaccineId: string; applicationDate: string; vetName: string; batch?: string }) => void;
  onAddVaccineToCatalog?: (name: string, frequencyDays: number) => void;
  medicalAppointments?: MedicalAppointment[];
  groomingAppointments?: GroomingAppointment[];
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  clinicalNotes,
  onAddClinicalNote,
  vaccineDoses,
  onNavigateToTab,
  onAddPatient,
  onUpdatePatients,
  vaccineCatalog = [],
  onRegisterDosis,
  onAddVaccineToCatalog,
  medicalAppointments = [],
  groomingAppointments = []
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [newPrescriptionText, setNewPrescriptionText] = useState('');
  const [showPrescriptionInput, setShowPrescriptionInput] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  const patientAppointments = useMemo(() => {
    if (!selectedPatient) return [];
    const med = (medicalAppointments || [])
      .filter(app => app.patientId === selectedPatient.id && app.status !== 'cancelled')
      .map(app => ({
        id: app.id,
        type: 'Consulta Médica' as const,
        date: app.date,
        time: app.time,
        detail: `Dr. ${app.vetName} — ${app.reason}`,
        status: app.status
      }));

    const groom = (groomingAppointments || [])
      .filter(app => app.patientId === selectedPatient.id && app.status !== 'cancelled')
      .map(app => ({
        id: app.id,
        type: 'Peluquería / Estética' as const,
        date: app.date,
        time: app.time,
        detail: `${app.serviceName}`,
        status: app.status
      }));

    return [...med, ...groom].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [selectedPatient, medicalAppointments, groomingAppointments]);

  const pendingAppointments = useMemo(() => {
    return patientAppointments.filter(app => app.status === 'pending' || app.status === 'confirmed');
  }, [patientAppointments]);

  // Active Tab state for redesigned layout (No Sidebar)
  const [activeTab, setActiveTab] = useState<'ficha' | 'vacunas'>('ficha');
  const [activePrescriptionNote, setActivePrescriptionNote] = useState<ClinicalNote | null>(null);

  // Required Vaccines State
  const [showAddVaccineModal, setShowAddVaccineModal] = useState(false);
  const [reqVaccineSource, setReqVaccineSource] = useState<'catalog' | 'new'>(vaccineCatalog.length > 0 ? 'catalog' : 'new');
  const [selectedCatalogVacId, setSelectedCatalogVacId] = useState<string>(vaccineCatalog[0]?.id || '');
  const [reqVaccineName, setReqVaccineName] = useState('');
  const [reqVaccineDate, setReqVaccineDate] = useState('2026-10-15');
  const [reqVaccineNotes, setReqVaccineNotes] = useState('');

  // Edit Pet Modal state
  const [showEditPetModal, setShowEditPetModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSpecies, setEditSpecies] = useState<Species>('Canino');
  const [editBreed, setEditBreed] = useState('');
  const [editSex, setEditSex] = useState<Sex>('Macho');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editWeightKg, setEditWeightKg] = useState(0);
  const [editAlertsStr, setEditAlertsStr] = useState('');
  const [notifModal, setNotifModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });

  const handleOpenEditPetModal = () => {
    setEditName(selectedPatient.name);
    setEditSpecies(selectedPatient.species);
    setEditBreed(selectedPatient.breed);
    setEditSex(selectedPatient.sex);
    setEditBirthDate(selectedPatient.birthDate);
    setEditWeightKg(selectedPatient.weightKg || 0);
    setEditAlertsStr((selectedPatient.alerts || []).join(', '));
    setShowEditPetModal(true);
  };

  const handleSavePetEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const parsedAlerts = editAlertsStr
      .split(',')
      .map(a => a.trim())
      .filter(Boolean);

    const updatedList = updatePatientRecord(patients, selectedPatient.id, {
      name: editName.trim(),
      species: editSpecies,
      breed: editBreed.trim(),
      sex: editSex,
      birthDate: editBirthDate,
      weightKg: Number(editWeightKg),
      alerts: parsedAlerts
    });

    if (onUpdatePatients) {
      onUpdatePatients(updatedList);
    }

    const updatedPet = updatedList.find(p => p.id === selectedPatient.id);
    if (updatedPet) {
      onSelectPatient(updatedPet);
    }

    setShowEditPetModal(false);
    setNotifModal({
      isOpen: true,
      message: '¡Datos de la mascota actualizados correctamente!'
    });
  };

  const filteredPatients = useMemo(
    () => filterPatients(patients, patientSearch, selectedCategoryFilter),
    [patients, patientSearch, selectedCategoryFilter]
  );
  const patientNotes = useMemo(
    () => clinicalNotes.filter(n => n.patientId === selectedPatient.id),
    [clinicalNotes, selectedPatient.id]
  );
  const weightTrend = useMemo(
    () => calculateWeightTrend(selectedPatient.weightHistory),
    [selectedPatient.weightHistory]
  );

  const categoryPills = [
    { label: 'Todos', filter: 'Todos' },
    { label: 'Caninos', filter: 'Canino' },
    { label: 'Felinos', filter: 'Felino' },
    { label: 'Con Alertas', filter: 'Con Alertas' },
  ];

  const handleSaveConsultation = () => {
    if (!newNoteText.trim()) return;
    const noteData = {
      notes: newNoteText,
      prescription: showPrescriptionInput ? newPrescriptionText : undefined
    };
    onAddClinicalNote(noteData);

    if (showPrescriptionInput && newPrescriptionText.trim()) {
      setActivePrescriptionNote({
        id: 'temp-' + Date.now(),
        patientId: selectedPatient.id,
        date: new Date().toISOString(),
        vetName: 'Dr. J. Silva',
        notes: newNoteText,
        prescription: newPrescriptionText
      });
    }

    setNewNoteText('');
    setNewPrescriptionText('');
    setShowPrescriptionInput(false);
  };

  const handleAddRequiredVaccineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalVacName = '';
    let finalVacId = '';

    if (reqVaccineSource === 'catalog') {
      const catItem = vaccineCatalog.find(v => v.id === selectedCatalogVacId) || vaccineCatalog[0];
      if (!catItem) return;
      finalVacName = catItem.name;
      finalVacId = catItem.id;
    } else {
      if (!reqVaccineName.trim()) return;
      finalVacName = reqVaccineName.trim();
      finalVacId = `v-cat-${Date.now()}`;
      if (onAddVaccineToCatalog) {
        onAddVaccineToCatalog(finalVacName, 365);
      }
    }

    const newVaccine: PatientRequiredVaccine = {
      id: `req-vac-${Date.now()}`,
      vaccineName: finalVacName,
      suggestedDate: reqVaccineDate,
      status: 'pendiente',
      notes: reqVaccineNotes.trim() || undefined
    };

    const currentReqs = selectedPatient.requiredVaccines || [];
    const updatedPatient: Patient = {
      ...selectedPatient,
      requiredVaccines: [...currentReqs, newVaccine]
    };

    if (onUpdatePatients) {
      const updatedList = patients.map(p => p.id === selectedPatient.id ? updatedPatient : p);
      onUpdatePatients(updatedList);
    }
    onSelectPatient(updatedPatient);

    // Agregar automáticamente al Historial de Vacunación del Paciente
    if (onRegisterDosis && finalVacId) {
      onRegisterDosis({
        vaccineId: finalVacId,
        applicationDate: reqVaccineDate,
        vetName: 'Dr. J. Silva'
      });
    }

    setReqVaccineName('');
    setReqVaccineNotes('');
    setShowAddVaccineModal(false);
  };

  const handleToggleVaccineApplied = (vacId: string) => {
    const currentReqs = selectedPatient.requiredVaccines || [];
    let toggledVacName = '';
    const updatedReqs = currentReqs.map(v => {
      if (v.id === vacId) {
        toggledVacName = v.vaccineName;
        const isNowApplied = v.status === 'pendiente';
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

    if (onUpdatePatients) {
      const updatedList = patients.map(p => p.id === selectedPatient.id ? updatedPatient : p);
      onUpdatePatients(updatedList);
    }
    onSelectPatient(updatedPatient);

    // Si se marca como aplicada, registrar dosis en el Historial de Vacunación
    const foundTarget = currentReqs.find(v => v.id === vacId);
    if (foundTarget && foundTarget.status === 'pendiente' && onRegisterDosis) {
      const matchedCat = vaccineCatalog.find(c => c.name.toLowerCase() === toggledVacName.toLowerCase()) || vaccineCatalog[0];
      if (matchedCat) {
        onRegisterDosis({
          vaccineId: matchedCat.id,
          applicationDate: new Date().toISOString().split('T')[0],
          vetName: 'Dr. J. Silva'
        });
      }
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  };

  return (
    <div className="flex flex-col gap-md w-full h-full flex-1 overflow-y-auto font-body-md text-slate-800 pr-1">
      {/* Top Header Bar con Selector de Pacientes a Ancho Completo */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md shrink-0 bg-white p-md rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-bold">
            Ficha del Paciente — {selectedPatient.name}
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
            {selectedPatient.species} • {selectedPatient.breed} • Propietario: <strong className="text-slate-900 font-bold">{selectedPatient.ownerName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-sm flex-wrap self-stretch md:self-auto justify-between">
          <div className="flex items-center gap-2 bg-slate-100 p-1.5 px-3 rounded-xl border border-slate-300">
            <label className="text-[10px] font-medium text-slate-500">Seleccionar paciente:</label>
            <select
              value={selectedPatient.id}
              onChange={(e) => {
                const found = patients.find(p => p.id === e.target.value);
                if (found) onSelectPatient(found);
              }}
              className="bg-transparent font-semibold text-xs text-slate-900 outline-none cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.species} - {p.breed} | Tutor: {p.ownerName})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowNewPatientModal(true)}
            className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nuevo paciente</span>
          </button>
        </div>
      </div>

        {/* Pet Hero Card */}
        <header className="bg-white rounded-2xl shadow-sm p-md flex flex-col gap-sm border border-slate-200 shrink-0">
          <div className="flex flex-col md:flex-row gap-md items-start md:items-center justify-between">
            <div className="flex items-center gap-md">
              <div className="relative w-20 h-20 md:w-22 md:h-22 rounded-2xl overflow-hidden shadow-md shrink-0 flex items-center justify-center bg-[#FAF5FF] border border-[#9A7DB8]/30">
                {selectedPatient.photoUrl ? (
                  <img 
                    src={selectedPatient.photoUrl} 
                    alt={selectedPatient.name} 
                    className="w-full h-full object-cover relative z-10" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <span className="material-symbols-outlined text-[40px] text-[#9A7DB8] absolute" style={{ fontVariationSettings: "'FILL' 1" }}>
                  pets
                </span>
                <div className="absolute bottom-1 right-1 bg-[#5C3C7B] text-white px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
                  <span className="font-label-sm text-[9px] font-medium">Activo</span>
                </div>
              </div>

              <div>
                <h2 className="font-headline-sm text-lg text-slate-900 leading-tight font-semibold">
                  {selectedPatient.name}
                </h2>
                <p className="font-body-md text-xs text-slate-600 font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span>{selectedPatient.species} • {selectedPatient.breed}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>{selectedPatient.sex}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>Nacimiento: {selectedPatient.birthDate}</span>
                </p>

                {/* Owner Contact Quick Action (WhatsApp Direct) */}
                <div className="flex items-center gap-sm mt-1.5 text-xs text-slate-800">
                  <span className="font-medium text-slate-900">Propietario: {selectedPatient.ownerName}</span>
                  {selectedPatient.ownerPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone(selectedPatient.ownerPhone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25D366] text-white hover:brightness-105 px-3 py-1 rounded-full font-label-sm text-[11px] flex items-center gap-1 shadow-sm font-semibold transition-all"
                      title="Enviar WhatsApp al dueño"
                    >
                      <span className="material-symbols-outlined text-[14px]">chat</span>
                      WhatsApp
                    </a>
                  )}

                  <button
                    onClick={handleOpenEditPetModal}
                    className="bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-3 py-1 rounded-full font-label-sm text-[11px] font-semibold flex items-center gap-1 transition-all shadow-xs cursor-pointer ml-xs"
                    title="Editar datos clínicos del paciente"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Editar datos del paciente
                  </button>
                </div>
              </div>
            </div>

            {/* Weight Evolution Sparkline Widget */}
            <div className="bg-[#FAF8FC] text-slate-900 rounded-xl p-2 px-3 shadow-xs border border-purple-200 flex flex-col items-end min-w-[140px]">
              <span className="font-label-sm text-[10px] text-slate-600 font-medium">Evolución de peso</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-headline-md text-base text-slate-900 font-semibold">
                  {selectedPatient.weightKg || '0'}<span className="font-body-md text-xs text-slate-500 ml-0.5">kg</span>
                </span>
                <span className={`font-label-sm text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  weightTrend.direction === 'up' ? 'bg-[#E8F5E9] text-[#27AE60]' : weightTrend.direction === 'down' ? 'bg-[#FDEDEC] text-[#C0392B]' : 'bg-slate-200 text-slate-700'
                }`}>
                  {weightTrend.formatted}
                </span>
              </div>

              {/* Sparkline Graphic SVG */}
              <div className="w-28 h-6 mt-1 flex items-center justify-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24">
                  <path
                    d="M 0,20 Q 25,18 50,12 T 100,4"
                    fill="none"
                    stroke="#9A7DB8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="100" cy="4" r="3" fill="#9A7DB8" />
                </svg>
              </div>
            </div>
          </div>

          {/* Banner de Alertas Médicas (Sin emojis) */}
          {selectedPatient.alerts && selectedPatient.alerts.length > 0 && (
            <div className="bg-[#FFF5F5] border border-red-200 p-2 px-3 rounded-xl flex items-center gap-2 flex-wrap text-xs">
              <span className="font-semibold text-red-700 flex items-center gap-1 text-[11px]">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Alertas clínicas:
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedPatient.alerts.map((alert, idx) => (
                  <span key={idx} className="bg-red-600 text-white font-medium text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                    {alert.replace(/^⚠️\s*/, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Turnos Pendientes / Programados de este paciente */}
          {patientAppointments.length > 0 && (
            <div className="bg-amber-50/70 border border-amber-200 p-2.5 px-3 rounded-xl flex flex-col gap-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-900 flex items-center gap-1.5 text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">calendar_month</span>
                  Turnos programados ({patientAppointments.length}):
                </span>
                {pendingAppointments.length > 0 && (
                  <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingAppointments.length} {pendingAppointments.length === 1 ? 'pendiente' : 'pendientes'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {patientAppointments.map(app => {
                  const isPending = app.status === 'pending' || app.status === 'confirmed';
                  return (
                    <div key={app.id} className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-2 ${
                      isPending ? 'bg-amber-100/90 border-amber-300 font-semibold text-amber-950' : 'bg-white border-slate-200 text-slate-700'
                    }`}>
                      <span>{app.type} ({app.date} {app.time}hs)</span>
                      <span className="text-slate-500 font-normal">• {app.detail}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                        app.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : isPending ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {app.status === 'completed' ? '✓ Cobrado' : isPending ? 'Pendiente' : app.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </header>

        {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-xs border-b border-slate-200 pb-1 shrink-0 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ficha')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'ficha'
              ? 'bg-[#5C3C7B] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200 font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
          <span>1. Historia clínica & consultas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vacunas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'vacunas'
              ? 'bg-[#5C3C7B] text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200 font-medium'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">vaccines</span>
          <span>2. Vacunas requeridas & plan sanitario</span>
          {selectedPatient.requiredVaccines && selectedPatient.requiredVaccines.length > 0 && (
            <span className="px-2 py-0.2 bg-amber-100 text-amber-900 rounded-full text-[10px] font-semibold">
              {selectedPatient.requiredVaccines.length}
            </span>
          )}
        </button>

        <button
          onClick={handleExportPDF}
          className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-2.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-xs font-semibold transition-all ml-auto cursor-pointer"
          title="Imprimir o guardar en PDF la historia clínica"
        >
          <span className="material-symbols-outlined text-[16px]">print</span>
          <span>Exportar historia clínica (PDF)</span>
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: HISTORIA CLÍNICA */}
      {activeTab === 'ficha' && (
        <section className="flex flex-col gap-sm flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Quick Consultation Form */}
          <div className="bg-white shadow-sm rounded-xl p-sm px-md flex flex-col gap-xs border border-slate-200 shrink-0">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">add_circle</span>
              <h2 className="font-headline-sm text-xs font-semibold text-slate-900">Registrar atención rápida</h2>
            </div>

            <div className="flex flex-col gap-1">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                placeholder="Escriba observaciones de la consulta, síntomas, diagnóstico preliminar..."
                className="w-full bg-white text-slate-900 font-body-md text-xs p-sm rounded-xl outline-none resize-none border border-slate-300 focus:border-[#9A7DB8] focus:ring-2 focus:ring-[#9A7DB8]/20 placeholder:text-slate-400 font-medium shadow-xs"
              />

              {showPrescriptionInput && (
                <div className="flex flex-col gap-1 bg-[#FAF5FF] p-2.5 rounded-xl border-l-4 border-l-[#9A7DB8] border-purple-200 shadow-xs">
                  <label className="font-label-md text-[10px] text-[#5C3C7B] font-semibold">Indicaciones / receta médica</label>
                  <textarea
                    value={newPrescriptionText}
                    onChange={(e) => setNewPrescriptionText(e.target.value)}
                    rows={2}
                    placeholder="Medicamentos, posología y frecuencia..."
                    className="w-full bg-white text-slate-900 font-body-md text-xs p-2 rounded-lg outline-none border border-purple-200 focus:ring-2 focus:ring-[#9A7DB8]/30 font-medium"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-xs">
              <button
                type="button"
                onClick={() => setShowPrescriptionInput(!showPrescriptionInput)}
                className="px-4 py-2 rounded-xl bg-[#F4EBFC] hover:bg-[#EAE0F5] text-[#5C3C7B] border border-[#D2B3EA] font-label-md text-xs shadow-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">prescriptions</span> 
                {showPrescriptionInput ? 'Quitar receta' : 'Generar receta'}
              </button>
              <button
                type="button"
                onClick={handleSaveConsultation}
                className="px-4 py-2 rounded-xl bg-[#9A7DB8] hover:bg-[#8362A5] text-white font-label-md text-xs shadow-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  save
                </span> 
                Guardar en ficha
              </button>
            </div>
          </div>

          {/* History Timeline */}
          <div className="flex flex-col gap-xs">
            <h3 className="font-label-md text-[11px] text-slate-700 font-semibold ml-1">
              Consultas anteriores ({patientNotes.length})
            </h3>

            {patientNotes.length === 0 ? (
              <div className="bg-white rounded-xl p-md text-center text-slate-500 text-xs shadow-xs border border-slate-200 font-medium">
                No hay consultas registradas previamente para {selectedPatient.name}.
              </div>
            ) : (
              patientNotes.map((note) => {
                const noteDate = new Date(note.date);
                const day = noteDate.getDate();
                const monthName = noteDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
                const year = noteDate.getFullYear();

                return (
                  <div key={note.id} className="bg-white rounded-xl shadow-xs p-md flex flex-col sm:flex-row gap-md hover:shadow-md transition-shadow relative border border-slate-200">
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center min-w-[76px] shrink-0 bg-[#F4EBFC] border border-[#D2B3EA] rounded-xl py-2.5 px-3 shadow-xs self-start sm:self-center">
                      <span className="text-lg font-bold text-[#5C3C7B] leading-none">{day}</span>
                      <span className="text-[11px] font-semibold text-[#5C3C7B] capitalize mt-1 leading-tight">{monthName}</span>
                      <span className="text-[10px] font-medium text-[#7B549C] leading-none mt-0.5">{year}</span>
                    </div>

                    <div className="flex flex-col gap-xs flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-headline-sm text-xs font-semibold text-slate-900">Consulta médica</span>
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-label-sm text-[9px] font-medium">
                          Atención clínica
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-700 text-[11px] mb-0.5">
                        <span className="material-symbols-outlined text-[13px] text-[#9A7DB8]">stethoscope</span>
                        <span className="font-semibold">{note.vetName}</span>
                      </div>
                      <p className="font-body-md text-xs text-slate-800 leading-relaxed font-normal">
                        {note.notes}
                      </p>

                      {note.prescription && (
                        <div className="mt-xs p-3 bg-[#FAF5FF] border-l-4 border-l-[#9A7DB8] rounded-r-xl border border-purple-100/80 text-xs shadow-xs flex flex-col gap-2">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-semibold text-[#5C3C7B] block text-[11px]">Indicaciones / receta médica:</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActivePrescriptionNote(note)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5C3C7B] text-white hover:bg-[#4A2F66] shadow-2xs transition-colors cursor-pointer"
                                title="Ver receta en PDF y enviar por WhatsApp"
                              >
                                <span className="material-symbols-outlined text-[14px]">prescriptions</span>
                                <span>Ver receta PDF / WhatsApp</span>
                              </button>
                              {note.prescriptionUrl && (
                                <a
                                  href={note.prescriptionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#E8F5E9] text-[#27AE60] hover:bg-[#C8E6C9] border border-[#27AE60]/30 transition-colors cursor-pointer"
                                  title="Descargar comprobante de receta"
                                >
                                  <span className="material-symbols-outlined text-[14px]">download</span>
                                  <span>Adjunto</span>
                                </a>
                              )}
                            </div>
                          </div>
                          <span className="font-body-md text-slate-900 text-xs font-medium whitespace-pre-line">{note.prescription}</span>
                        </div>
                      )}

                      {note.attachments && note.attachments.length > 0 && (
                        <div className="mt-xs flex flex-wrap items-center gap-xs">
                          <span className="text-[10px] font-medium text-slate-500">Archivos adjuntos:</span>
                          {note.attachments.map((att, idx) => {
                            const url = note.attachmentUrls && note.attachmentUrls[idx];
                            return url ? (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#E8F5E9] text-[#27AE60] hover:bg-[#C8E6C9] border border-[#27AE60]/30 transition-colors cursor-pointer"
                                title={`Ver/Descargar ${att}`}
                              >
                                <span className="material-symbols-outlined text-[12px]">download</span>
                                <span className="truncate max-w-[140px] font-semibold">{att}</span>
                              </a>
                            ) : (
                              <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                <span className="material-symbols-outlined text-[12px]">attach_file</span>
                                <span className="truncate max-w-[140px] font-semibold">{att}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* CONTENIDO PESTAÑA 2: VACUNAS REQUERIDAS & PLAN SANITARIO */}
      {activeTab === 'vacunas' && (
        <section className="flex flex-col gap-md flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="bg-white rounded-2xl shadow-sm p-md border border-slate-200 flex flex-col gap-xs shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[20px]">vaccines</span>
                <h3 className="font-headline-sm text-xs font-semibold text-slate-900">
                  Vacunas necesarias / requeridas por paciente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVaccineModal(true)}
                className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Agregar vacuna requerida</span>
              </button>
            </div>

            {(!selectedPatient.requiredVaccines || selectedPatient.requiredVaccines.length === 0) ? (
              <p className="text-slate-500 text-xs italic py-3 text-center">
                No hay vacunas sugeridas/requeridas cargadas manualmente para este paciente. Presione "Agregar vacuna requerida".
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-xs mt-1">
                {selectedPatient.requiredVaccines.map(vac => (
                  <div
                    key={vac.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-sm text-xs ${
                      vac.status === 'aplicada'
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                        : 'bg-amber-50/60 border-amber-200 text-amber-950'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-xs">{vac.vaccineName}</span>
                      <span className="text-[10px] text-slate-600 font-medium">
                        Fecha sugerida: <strong>{vac.suggestedDate}</strong>
                        {vac.appliedDate && ` • Aplicada el: ${vac.appliedDate}`}
                      </span>
                      {vac.notes && <span className="text-[10px] text-slate-500 italic">{vac.notes}</span>}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleVaccineApplied(vac.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer whitespace-nowrap transition-all ${
                        vac.status === 'aplicada'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {vac.status === 'aplicada' ? '✓ Aplicada' : 'Marcar aplicada'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-md border border-slate-200 shadow-sm">
            <h3 className="font-headline-sm text-xs font-semibold text-slate-900 mb-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">verified</span>
              Ir al control de vacunas general
            </h3>
            <p className="text-xs text-slate-600 mb-md">
              Consulte el calendario completo del vacunatorio, programe turnos de refuerzo y notifique recordatorios por SMS/WhatsApp.
            </p>
            <button
              onClick={() => onNavigateToTab('control-vacunas')}
              className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">vaccines</span>
              Ver vacunatorio completo
            </button>
          </div>
        </section>
      )}

      {/* New Patient Modal */}
      {showNewPatientModal && (
        <NewPatientModal
          onClose={() => setShowNewPatientModal(false)}
          onAddPatient={(data) => {
            if (onAddPatient) {
              onAddPatient(data);
            }
          }}
        />
      )}

      {/* Edit Pet Modal */}
      {showEditPetModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-md">
          <div className="bg-white rounded-2xl max-w-lg w-full p-md shadow-2xl flex flex-col gap-md border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-xs">
              <h3 className="font-headline-sm text-slate-900 text-sm font-bold flex items-center gap-xs">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[20px]">edit_note</span>
                Editar Datos del Paciente ({selectedPatient.name})
              </h3>
              <button
                type="button"
                onClick={() => setShowEditPetModal(false)}
                className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePetEditSubmit} className="flex flex-col gap-sm text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre de la Mascota</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 px-md text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Especie</label>
                  <select
                    value={editSpecies}
                    onChange={(e) => setEditSpecies(e.target.value as Species)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 px-md text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                  >
                    <option value="Canino">Canino</option>
                    <option value="Felino">Felino</option>
                    <option value="Ave">Ave</option>
                    <option value="Roedor">Roedor</option>
                    <option value="Reptil">Reptil</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Raza</label>
                  <input
                    type="text"
                    value={editBreed}
                    onChange={(e) => setEditBreed(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 px-md text-slate-900 font-medium outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sexo</label>
                  <select
                    value={editSex}
                    onChange={(e) => setEditSex(e.target.value as Sex)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 px-md text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                  >
                    <option value="Macho">Macho</option>
                    <option value="Hembra">Hembra</option>
                    <option value="Indeterminado">Indeterminado</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 px-md text-slate-900 font-medium outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Peso Actual (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editWeightKg}
                    onChange={(e) => setEditWeightKg(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 px-md text-slate-900 font-bold outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Alertas Médicas / Alergias (separadas por comas)
                </label>
                <input
                  type="text"
                  value={editAlertsStr}
                  onChange={(e) => setEditAlertsStr(e.target.value)}
                  placeholder="Ej: Alérgico a Penicilina, Diabético, Sensibilidad digestiva"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 px-md text-slate-900 font-medium outline-none focus:ring-2 focus:ring-[#9A7DB8]"
                />
              </div>

              <div className="flex justify-end gap-sm pt-xs border-t border-slate-200 mt-xs">
                <button
                  type="button"
                  onClick={() => setShowEditPetModal(false)}
                  className="px-md py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-md py-1.5 rounded-xl bg-[#9A7DB8] hover:bg-[#8362A5] text-white font-bold transition-all shadow-sm cursor-pointer"
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

      {/* Prescription Modal Grande */}
      {activePrescriptionNote && (
        <PrescriptionModal
          isOpen={true}
          autoPrint={false}
          onClose={() => setActivePrescriptionNote(null)}
          patient={selectedPatient}
          vetName={activePrescriptionNote.vetName}
          vetLicenseNumber={activePrescriptionNote.vetLicenseNumber}
          prescriptionText={activePrescriptionNote.prescription || ''}
          dateStr={activePrescriptionNote.date ? activePrescriptionNote.date.split('T')[0] : undefined}
        />
      )}

      {/* Modal Carga Vacuna Requerida Manual */}
      {showAddVaccineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-lg shadow-2xl flex flex-col gap-md border border-slate-200">
            <div className="flex justify-between items-center border-b border-slate-200 pb-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#9A7DB8] text-[22px]">vaccines</span>
                <h3 className="font-bold text-sm text-slate-900">Agregar Vacuna Requerida</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddVaccineModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddRequiredVaccineSubmit} className="flex flex-col gap-md text-xs">
              <div className="flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-xs text-slate-700 block">Vacuna requerida *</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setReqVaccineSource('catalog')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        reqVaccineSource === 'catalog'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Elegir del catálogo
                    </button>
                    <button
                      type="button"
                      onClick={() => setReqVaccineSource('new')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        reqVaccineSource === 'new'
                          ? 'bg-[#9A7DB8] text-white shadow-2xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Crear nueva
                    </button>
                  </div>
                </div>

                {reqVaccineSource === 'catalog' ? (
                  <select
                    value={selectedCatalogVacId}
                    onChange={(e) => setSelectedCatalogVacId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-xs focus:border-[#9A7DB8] shadow-xs cursor-pointer"
                  >
                    {vaccineCatalog.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.frequencyDays} días)
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={reqVaccineName}
                    onChange={(e) => setReqVaccineName(e.target.value)}
                    placeholder="Ej. Bordetella, Giardia..."
                    required={reqVaccineSource === 'new'}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-semibold text-xs focus:border-[#9A7DB8] placeholder:text-slate-400 shadow-xs"
                  />
                )}
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Fecha sugerida de aplicación *</label>
                <input
                  type="date"
                  value={reqVaccineDate}
                  onChange={(e) => setReqVaccineDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8]"
                />
              </div>

              <div>
                <label className="font-semibold text-xs text-slate-700 block mb-1">Observaciones / notas (Opcional)</label>
                <textarea
                  value={reqVaccineNotes}
                  onChange={(e) => setReqVaccineNotes(e.target.value)}
                  rows={2}
                  placeholder="Indicaciones adicionales, refuerzo anual, laboratorio..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none text-slate-900 font-medium text-xs focus:border-[#9A7DB8] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-sm pt-xs border-t border-slate-200 mt-xs">
                <button
                  type="button"
                  onClick={() => setShowAddVaccineModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>Guardar vacuna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
