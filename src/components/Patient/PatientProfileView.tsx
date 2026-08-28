import React, { useState, useMemo } from 'react';
import { Patient, ClinicalNote, VaccineDosis, Species, Sex } from '../../domain/types';
import { filterPatients, calculateWeightTrend, updatePatientRecord } from '../../domain/services/patientService';
import { NewPatientModal } from './NewPatientModal';
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
  onUpdatePatients
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [newPrescriptionText, setNewPrescriptionText] = useState('');
  const [showPrescriptionInput, setShowPrescriptionInput] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

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
    onAddClinicalNote({
      notes: newNoteText,
      prescription: showPrescriptionInput ? newPrescriptionText : undefined
    });
    setNewNoteText('');
    setNewPrescriptionText('');
    setShowPrescriptionInput(false);
  };

  const handleExportPDF = () => {
    window.print();
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/[^0-9]/g, '');
  };

  return (
    <div className="flex flex-col md:flex-row gap-md w-full h-full flex-1 overflow-hidden">
      {/* Left Column: Master List (Fixed 256px/288px width) */}
      <aside className="flex flex-col w-full md:w-64 xl:w-72 gap-xs shrink-0 overflow-hidden">
        {/* Quick Header + "+ Nuevo Paciente" Button */}
        <div className="flex items-center justify-between px-xs">
          <h2 className="font-label-md text-xs text-slate-700 uppercase tracking-wider font-bold truncate">
            Mis Pacientes ({filteredPatients.length})
          </h2>

          <button
            onClick={() => setShowNewPatientModal(true)}
            className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-2.5 py-1 rounded-lg font-label-md text-xs flex items-center gap-1 shadow-sm transition-all font-bold shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span className="hidden sm:inline">Nuevo Paciente</span>
            <span className="sm:hidden">+</span>
          </button>
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

        {/* Category Pills */}
        <div className="flex items-center gap-xs overflow-x-auto py-xs scrollbar-hide">
          {categoryPills.map((pill) => {
            const isSelected = selectedCategoryFilter === pill.filter;
            return (
              <button
                key={pill.filter}
                onClick={() => setSelectedCategoryFilter(pill.filter)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-label-md whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#9A7DB8] text-white shadow-sm font-bold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 font-medium'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        {/* Patient List Container */}
        <div className="flex flex-col gap-xs overflow-y-auto flex-1 pr-1">
          {filteredPatients.map((patient) => {
            const isSelected = patient.id === selectedPatient.id;
            const hasAlerts = patient.alerts && patient.alerts.length > 0;

            return (
              <button
                key={patient.id}
                onClick={() => onSelectPatient(patient)}
                className={`p-xs px-sm rounded-xl shadow-sm flex items-center gap-sm text-left transition-all relative overflow-hidden group cursor-pointer border ${
                  isSelected
                    ? 'bg-white text-slate-900 border-l-4 border-l-[#9A7DB8] border-purple-300 shadow-md ring-1 ring-[#9A7DB8]/30'
                    : 'bg-white text-slate-800 hover:bg-purple-50/50 border-slate-200'
                }`}
              >
                <div className={`relative w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0 flex items-center justify-center ${
                  isSelected ? 'bg-[#FAF5FF] border border-[#9A7DB8]/40' : 'bg-slate-100'
                }`}>
                  {patient.photoUrl ? (
                    <img 
                      src={patient.photoUrl} 
                      alt={patient.name} 
                      className="w-full h-full object-cover relative z-10" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <span className={`material-symbols-outlined text-[22px] absolute ${isSelected ? 'text-[#9A7DB8]' : 'text-slate-400'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    pets
                  </span>
                  {hasAlerts && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-white z-20" title="Tiene alertas clínicas"></span>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0 z-10">
                  <div className="flex items-center justify-between">
                    <span className={`font-headline-sm text-xs font-bold truncate ${isSelected ? 'text-slate-900' : 'text-slate-800'}`}>
                      {patient.name}
                    </span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9A7DB8] shadow-[0_0_6px_rgba(154,125,184,0.6)] shrink-0"></span>
                    )}
                  </div>
                  <span className={`font-body-md text-[11px] truncate ${isSelected ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                    {patient.species} • {patient.breed}
                  </span>
                  <div className={`flex items-center gap-xs mt-0.5 ${isSelected ? 'text-slate-700 font-semibold' : 'text-slate-500'}`}>
                    <span className="material-symbols-outlined text-[12px]">person</span>
                    <span className="font-label-sm text-[10px] truncate">{patient.ownerName}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Column: Detailed Patient Profile */}
      <main className="flex flex-col flex-1 min-w-0 gap-sm overflow-hidden">
        {/* Module Title Header */}
        <div className="flex items-center justify-between mb-md shrink-0">
          <div>
            <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-bold">
              Pacientes — Ficha Médica ({selectedPatient.name})
            </h1>
            <p className="font-body-md text-xs text-slate-600 font-medium mt-0.5">
              Historia clínica consolidada, registro de consultas, vacunas y prescripciones
            </p>
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
                <div className="absolute bottom-1 right-1 bg-[#5C3C7B] text-white px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-20">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]"></span>
                  <span className="font-label-sm text-[9px] font-bold uppercase">Activo</span>
                </div>
              </div>

              <div>
                <h2 className="font-headline-sm text-lg text-slate-900 leading-tight font-bold">
                  {selectedPatient.name}
                </h2>
                <p className="font-body-md text-xs text-slate-600 font-medium flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span>{selectedPatient.species} • {selectedPatient.breed}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>{selectedPatient.sex}</span>
                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                  <span>Nac.: {selectedPatient.birthDate}</span>
                </p>

                {/* Owner Contact Quick Action (WhatsApp Direct) */}
                <div className="flex items-center gap-sm mt-1.5 text-xs text-slate-800">
                  <span className="font-bold text-slate-900">Propietario: {selectedPatient.ownerName}</span>
                  {selectedPatient.ownerPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone(selectedPatient.ownerPhone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25D366] text-white hover:brightness-105 px-2.5 py-0.5 rounded-full font-label-sm text-[10px] flex items-center gap-1 shadow-sm font-bold transition-all"
                      title="Enviar WhatsApp al dueño"
                    >
                      <span className="material-symbols-outlined text-[13px]">chat</span>
                      WhatsApp
                    </a>
                  )}

                  <button
                    onClick={handleOpenEditPetModal}
                    className="bg-purple-50 hover:bg-purple-100 text-[#5C3C7B] border border-purple-200 px-2.5 py-0.5 rounded-full font-label-sm text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer ml-xs"
                    title="Editar datos clínicos del paciente"
                  >
                    <span className="material-symbols-outlined text-[13px]">edit</span>
                    Editar datos del paciente
                  </button>
                </div>
              </div>
            </div>

            {/* Weight Evolution Sparkline Widget */}
            <div className="bg-[#FAF8FC] text-slate-900 rounded-xl p-2 px-3 shadow-xs border border-purple-200 flex flex-col items-end min-w-[140px]">
              <span className="font-label-sm text-[10px] text-slate-600 uppercase font-bold">Evolución de Peso</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-headline-md text-base text-slate-900 font-bold">
                  {selectedPatient.weightKg || '0'}<span className="font-body-md text-xs text-slate-500 ml-0.5">kg</span>
                </span>
                <span className={`font-label-sm text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
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
              <span className="font-bold text-red-700 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Alertas Clínicas:
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedPatient.alerts.map((alert, idx) => (
                  <span key={idx} className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                    {alert.replace(/^⚠️\s*/, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Barra de Accesos Directos de la Ficha (Jerarquía de Botones Clara) */}
          <div className="flex items-center gap-xs overflow-x-auto pt-xs border-t border-slate-200">
            {/* Primary Action Button */}
            <button
              onClick={() => onNavigateToTab('nueva-consulta')}
              className="bg-[#9A7DB8] hover:bg-[#8362A5] text-white px-3.5 py-1.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-sm font-bold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">stethoscope</span>
              Nueva Consulta
            </button>

            {/* Secondary Action Buttons (Fondo lila suave + Texto morado de alto contraste) */}
            <button
              onClick={() => onNavigateToTab('control-vacunas')}
              className="bg-[#F4EBFC] hover:bg-[#EAE0F5] text-[#5C3C7B] border border-[#D2B3EA] px-3.5 py-1.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-xs font-bold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">vaccines</span>
              Registrar Vacuna
            </button>

            <button
              onClick={() => onNavigateToTab('agenda')}
              className="bg-[#F4EBFC] hover:bg-[#EAE0F5] text-[#5C3C7B] border border-[#D2B3EA] px-3.5 py-1.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-xs font-bold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              Agendar Turno
            </button>

            <button
              onClick={() => onNavigateToTab('cobros')}
              className="bg-[#F4EBFC] hover:bg-[#EAE0F5] text-[#5C3C7B] border border-[#D2B3EA] px-3.5 py-1.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-xs font-bold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              Registrar Cobro
            </button>

            <button
              onClick={handleExportPDF}
              className="bg-[#F4EBFC] hover:bg-[#EAE0F5] text-[#5C3C7B] border border-[#D2B3EA] px-3.5 py-1.5 rounded-xl font-label-md text-xs flex items-center gap-1.5 shadow-xs font-bold transition-all ml-auto cursor-pointer"
              title="Imprimir o guardar en PDF la Historia Clínica"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Exportar HC (PDF)
            </button>
          </div>
        </header>

        {/* Section Header: Historia Clínica */}
        <div className="flex items-center justify-between px-xs py-1 shrink-0 border-b border-slate-200">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[#9A7DB8] text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              clinical_notes
            </span>
            <h2 className="font-headline-sm text-sm font-bold text-slate-900">Historia Clínica</h2>
          </div>
        </div>

        {/* Content: Historial Clínico */}
        <section className="flex flex-col gap-sm flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Quick Consultation Form */}
          <div className="bg-white shadow-sm rounded-xl p-sm px-md flex flex-col gap-xs border border-slate-200 shrink-0">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-[#9A7DB8] text-[18px]">add_circle</span>
              <h2 className="font-headline-sm text-xs font-bold text-slate-900">Registrar Atención Rápida</h2>
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
                  <label className="font-label-md text-[10px] text-[#5C3C7B] font-bold uppercase tracking-wider">Indicaciones / Receta Médica</label>
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
                className="px-md py-1 rounded-lg bg-[#F4EBFC] hover:bg-[#EAE0F5] text-[#5C3C7B] border border-[#D2B3EA] font-label-md text-xs shadow-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">prescriptions</span> 
                {showPrescriptionInput ? 'Quitar Receta' : 'Generar Receta'}
              </button>
              <button
                type="button"
                onClick={handleSaveConsultation}
                className="px-md py-1 rounded-lg bg-[#9A7DB8] hover:bg-[#8362A5] text-white font-label-md text-xs shadow-sm font-bold flex items-center gap-1 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  save
                </span> 
                Guardar en Ficha
              </button>
            </div>
          </div>

          {/* History Timeline */}
          <div className="flex flex-col gap-xs">
            <h3 className="font-label-md text-[11px] text-slate-700 uppercase tracking-wider font-bold ml-1">
              Consultas Anteriores ({patientNotes.length})
            </h3>

            {patientNotes.length === 0 ? (
              <div className="bg-white rounded-xl p-md text-center text-slate-500 text-xs shadow-xs border border-slate-200 font-medium">
                No hay consultas registradas previamente para {selectedPatient.name}.
              </div>
            ) : (
              patientNotes.map((note) => {
                const noteDate = new Date(note.date);
                const day = noteDate.getDate();
                const monthYear = noteDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

                return (
                  <div key={note.id} className="bg-white rounded-xl shadow-xs p-md flex flex-col sm:flex-row gap-md hover:shadow-md transition-shadow relative border border-slate-200">
                    {/* Date Badge */}
                    <div className="flex flex-col items-center justify-center sm:w-16 shrink-0 bg-[#F4EBFC] border border-[#D2B3EA] rounded-xl p-2 px-3 shadow-xs">
                      <span className="font-display-lg text-base font-bold text-[#5C3C7B]">{day}</span>
                      <span className="font-label-sm text-[10px] text-[#5C3C7B] uppercase font-bold">{monthYear}</span>
                    </div>

                    <div className="flex flex-col gap-xs flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-headline-sm text-xs font-bold text-slate-900">Consulta Médica</span>
                        <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-label-sm text-[9px] font-bold uppercase">
                          Atención Clínica
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-700 text-[11px] mb-0.5">
                        <span className="material-symbols-outlined text-[13px] text-[#9A7DB8]">stethoscope</span>
                        <span className="font-bold">{note.vetName}</span>
                      </div>
                      <p className="font-body-md text-xs text-slate-800 leading-relaxed font-normal">
                        {note.notes}
                      </p>

                      {note.prescription && (
                        <div className="mt-xs p-3 bg-[#FAF5FF] border-l-4 border-l-[#9A7DB8] rounded-r-xl border border-purple-100/80 text-xs shadow-xs">
                          <span className="font-bold text-[#5C3C7B] block text-[11px] mb-0.5">Receta:</span>
                          <span className="font-body-md text-slate-900 text-xs font-medium">{note.prescription}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

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
    </div>
  );
};
