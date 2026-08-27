import React, { useState, useMemo } from 'react';
import { Patient, ClinicalNote, VaccineDosis } from '../../domain/types';
import { filterPatients, calculateWeightTrend } from '../../domain/services/patientService';
import { NewPatientModal } from './NewPatientModal';

interface PatientProfileViewProps {
  patients: Patient[];
  selectedPatient: Patient;
  onSelectPatient: (patient: Patient) => void;
  clinicalNotes: ClinicalNote[];
  onAddClinicalNote: (note: { notes: string; prescription?: string }) => void;
  vaccineDoses: VaccineDosis[];
  onNavigateToTab: (tabName: string) => void;
  onAddPatient?: (patientData: any) => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patients,
  selectedPatient,
  onSelectPatient,
  clinicalNotes,
  onAddClinicalNote,
  vaccineDoses,
  onNavigateToTab,
  onAddPatient
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const [newPrescriptionText, setNewPrescriptionText] = useState('');
  const [showPrescriptionInput, setShowPrescriptionInput] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

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
          <h2 className="font-label-md text-xs text-on-surface-variant uppercase tracking-wider font-bold truncate">
            Mis Pacientes ({filteredPatients.length})
          </h2>

          <button
            onClick={() => setShowNewPatientModal(true)}
            className="bg-primary text-on-primary hover:bg-primary-container px-2.5 py-1 rounded-lg font-label-md text-xs flex items-center gap-1 shadow-sm transition-all font-semibold shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span className="hidden sm:inline">Nuevo Paciente</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>

        {/* Quick Search */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-xs flex items-center relative border border-outline-variant/30">
          <span className="material-symbols-outlined text-on-surface-variant ml-sm mr-xs text-[18px]">
            search
          </span>
          <input
            type="text"
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            placeholder="Buscar paciente o dueño..."
            className="w-full bg-transparent outline-none p-xs font-body-md text-xs text-on-surface placeholder:text-on-surface-variant"
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
                className={`px-2.5 py-1 rounded-full text-[11px] font-label-md whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-secondary text-on-secondary shadow-sm font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
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
                className={`p-xs px-sm rounded-xl shadow-sm flex items-center gap-sm text-left transition-all relative overflow-hidden group border ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary shadow-md'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border-outline-variant/30'
                }`}
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden shadow-sm shrink-0 flex items-center justify-center bg-surface-container-highest">
                  {patient.photoUrl ? (
                    <img 
                      src={patient.photoUrl} 
                      alt={patient.name} 
                      className="w-full h-full object-cover relative z-10" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : null}
                  <span className="material-symbols-outlined text-[22px] text-on-surface-variant absolute" style={{ fontVariationSettings: "'FILL' 1" }}>
                    pets
                  </span>
                  {hasAlerts && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-white z-20" title="Tiene alertas clínicas"></span>
                  )}
                </div>

                <div className="flex flex-col flex-1 min-w-0 z-10">
                  <div className="flex items-center justify-between">
                    <span className={`font-headline-sm text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-on-background'}`}>
                      {patient.name}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_6px_rgba(135,214,254,0.8)] shrink-0"></span>
                    )}
                  </div>
                  <span className={`font-body-md text-[11px] truncate ${isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`}>
                    {patient.species} • {patient.breed}
                  </span>
                  <div className={`flex items-center gap-xs mt-0.5 ${isSelected ? 'text-primary-fixed-dim' : 'text-on-surface-variant'}`}>
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
        {/* Pet Hero Card */}
        <header className="bg-surface-container-lowest rounded-2xl shadow-sm p-md flex flex-col gap-sm border border-outline-variant/30 shrink-0">
          <div className="flex flex-col md:flex-row gap-md items-start md:items-center justify-between">
            <div className="flex items-center gap-md">
              <div className="relative w-20 h-20 md:w-22 md:h-22 rounded-2xl overflow-hidden shadow-md shrink-0 flex items-center justify-center bg-surface-container-highest">
                {selectedPatient.photoUrl ? (
                  <img 
                    src={selectedPatient.photoUrl} 
                    alt={selectedPatient.name} 
                    className="w-full h-full object-cover relative z-10" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <span className="material-symbols-outlined text-[40px] text-primary absolute" style={{ fontVariationSettings: "'FILL' 1" }}>
                  pets
                </span>
                <div className="absolute bottom-1 right-1 bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-1 z-20">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="font-label-sm text-[9px] font-bold uppercase">Activo</span>
                </div>
              </div>

              <div>
                <h1 className="font-display-lg text-[22px] text-primary leading-tight font-bold">
                  {selectedPatient.name}
                </h1>
                <p className="font-body-md text-xs text-on-surface-variant flex flex-wrap items-center gap-1.5 mt-0.5">
                  <span>{selectedPatient.species} • {selectedPatient.breed}</span>
                  <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                  <span>{selectedPatient.sex}</span>
                  <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                  <span>Nac.: {selectedPatient.birthDate}</span>
                </p>

                {/* Owner Contact Quick Action (WhatsApp Direct) */}
                <div className="flex items-center gap-sm mt-1.5 text-xs text-on-surface">
                  <span className="font-semibold text-primary">Propietario: {selectedPatient.ownerName}</span>
                  {selectedPatient.ownerPhone && (
                    <a
                      href={`https://wa.me/${cleanPhone(selectedPatient.ownerPhone)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-[#25D366] text-white hover:brightness-105 px-2 py-0.5 rounded-full font-label-sm text-[10px] flex items-center gap-1 shadow-sm font-bold transition-all"
                      title="Enviar WhatsApp al dueño"
                    >
                      <span className="material-symbols-outlined text-[13px]">chat</span>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Weight Evolution Sparkline Widget */}
            <div className="bg-surface text-on-surface rounded-xl p-2 px-3 shadow-sm border border-outline-variant/30 flex flex-col items-end min-w-[140px]">
              <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-bold">Evolución de Peso</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-headline-md text-base text-primary font-bold">
                  {selectedPatient.weightKg || '0'}<span className="font-body-md text-xs text-on-surface-variant ml-0.5">kg</span>
                </span>
                <span className={`font-label-sm text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  weightTrend.direction === 'up' ? 'bg-[#E8F5E9] text-[#27AE60]' : weightTrend.direction === 'down' ? 'bg-[#FDEDEC] text-[#C0392B]' : 'bg-surface-container text-on-surface-variant'
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
            <div className="bg-error-container/40 border border-error/30 p-2 px-3 rounded-xl flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-error flex items-center gap-1 text-[11px] uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                Alertas Clínicas:
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedPatient.alerts.map((alert, idx) => (
                  <span key={idx} className="bg-error text-on-error font-bold text-[10px] px-2 py-0.5 rounded-md shadow-sm">
                    {alert.replace(/^⚠️\s*/, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Barra de Accesos Directos de la Ficha */}
          <div className="flex items-center gap-xs overflow-x-auto pt-xs border-t border-surface-variant/50">
            <button
              onClick={() => onNavigateToTab('nueva-consulta')}
              className="bg-primary text-on-primary hover:bg-primary-container px-3 py-1.5 rounded-lg font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">stethoscope</span>
              Nueva Consulta
            </button>

            <button
              onClick={() => onNavigateToTab('control-vacunas')}
              className="bg-primary text-on-primary hover:bg-primary-container px-3 py-1.5 rounded-lg font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">vaccines</span>
              Registrar Vacuna
            </button>

            <button
              onClick={() => onNavigateToTab('agenda')}
              className="bg-primary text-on-primary hover:bg-primary-container px-3 py-1.5 rounded-lg font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              Agendar Turno
            </button>

            <button
              onClick={() => onNavigateToTab('cobros')}
              className="bg-primary text-on-primary hover:bg-primary-container px-3 py-1.5 rounded-lg font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              Registrar Cobro
            </button>

            <button
              onClick={handleExportPDF}
              className="bg-surface-container-high hover:bg-surface-container-highest text-on-surface px-3 py-1.5 rounded-lg font-label-md text-xs flex items-center gap-1.5 shadow-sm font-semibold transition-all ml-auto"
              title="Imprimir o guardar en PDF la Historia Clínica"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">print</span>
              Exportar HC (PDF)
            </button>
          </div>
        </header>

        {/* Section Header: Historia Clínica */}
        <div className="flex items-center justify-between px-xs py-1 shrink-0 border-b border-surface-variant/40">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              clinical_notes
            </span>
            <h2 className="font-headline-sm text-sm font-bold text-primary">Historia Clínica</h2>
          </div>
        </div>

        {/* Content: Historial Clínico */}
        <section className="flex flex-col gap-sm flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Quick Consultation Form */}
          <div className="bg-surface-container-lowest shadow-sm rounded-xl p-sm px-md flex flex-col gap-xs border border-outline-variant/30 shrink-0">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[18px]">add_circle</span>
              <h2 className="font-headline-sm text-xs font-bold text-primary">Registrar Atención Rápida</h2>
            </div>

            <div className="flex flex-col gap-1">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                rows={2}
                placeholder="Escriba observaciones de la consulta, síntomas, diagnóstico preliminar..."
                className="w-full bg-surface-container text-on-surface font-body-md text-xs p-sm rounded-lg outline-none resize-none focus:bg-surface focus:ring-2 focus:ring-secondary placeholder:text-outline"
              />

              {showPrescriptionInput && (
                <div className="flex flex-col gap-1 bg-surface-container-low p-2 rounded-lg border border-secondary-container">
                  <label className="font-label-md text-[10px] text-secondary font-bold">Indicaciones / Receta Médica</label>
                  <textarea
                    value={newPrescriptionText}
                    onChange={(e) => setNewPrescriptionText(e.target.value)}
                    rows={2}
                    placeholder="Medicamentos, posología y frecuencia..."
                    className="w-full bg-surface text-on-surface font-body-md text-xs p-1.5 rounded-md outline-none border border-outline-variant focus:ring-2 focus:ring-secondary"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-xs">
              <button
                type="button"
                onClick={() => setShowPrescriptionInput(!showPrescriptionInput)}
                className="px-md py-1 rounded-md bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary transition-colors font-label-md text-xs shadow-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">prescriptions</span> 
                {showPrescriptionInput ? 'Quitar Receta' : 'Generar Receta'}
              </button>
              <button
                type="button"
                onClick={handleSaveConsultation}
                className="px-md py-1 rounded-md bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-xs shadow-sm flex items-center gap-1"
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
            <h3 className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-bold ml-1">
              Consultas Anteriores ({patientNotes.length})
            </h3>

            {patientNotes.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-md text-center text-on-surface-variant text-xs shadow-sm">
                No hay consultas registradas previamente para {selectedPatient.name}.
              </div>
            ) : (
              patientNotes.map((note) => {
                const noteDate = new Date(note.date);
                const day = noteDate.getDate();
                const monthYear = noteDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

                return (
                  <div key={note.id} className="bg-surface-container-lowest rounded-xl shadow-sm p-md flex flex-col sm:flex-row gap-md hover:shadow-md transition-shadow relative border border-outline-variant/30">
                    <div className="flex flex-col items-center sm:w-16 shrink-0">
                      <span className="font-headline-md text-sm font-bold text-primary">{day}</span>
                      <span className="font-label-sm text-[10px] text-on-surface-variant uppercase">{monthYear}</span>
                    </div>

                    <div className="flex flex-col gap-xs flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-headline-sm text-xs font-bold text-on-surface">Consulta Médica</span>
                        <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-label-sm text-[9px]">
                          Atención Clínica
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-on-surface-variant text-[11px] mb-0.5">
                        <span className="material-symbols-outlined text-[13px]">stethoscope</span>
                        <span className="font-label-md">{note.vetName}</span>
                      </div>
                      <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                        {note.notes}
                      </p>

                      {note.prescription && (
                        <div className="mt-xs p-2 bg-surface-container-low rounded-lg border border-outline-variant/50 text-xs">
                          <span className="font-label-md text-secondary font-bold block text-[11px]">Receta:</span>
                          <span className="font-body-md text-on-surface text-xs">{note.prescription}</span>
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
    </div>
  );
};
