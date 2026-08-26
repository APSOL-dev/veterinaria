import React, { useState } from 'react';
import { Patient } from '../../domain/types';

interface NewConsultationViewProps {
  patients: Patient[];
  selectedPatient: Patient;
  onCancel: () => void;
  onSaveConsultation: (data: {
    patientId: string;
    vetName: string;
    notes: string;
    prescription?: string;
    attachments?: string[];
  }) => void;
}

export const NewConsultationView: React.FC<NewConsultationViewProps> = ({
  patients,
  selectedPatient,
  onCancel,
  onSaveConsultation
}) => {
  const [targetPatientId, setTargetPatientId] = useState<string>(selectedPatient.id);
  const [vetName, setVetName] = useState('Dr. J. Silva');
  const [notes, setNotes] = useState('');
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);

  const currentPatient = patients.find(p => p.id === targetPatientId) || selectedPatient;
  const currentDateFormatted = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleFileSimulate = () => {
    const fileName = `estudio_${Date.now().toString().slice(-4)}.pdf`;
    setAttachedFiles(prev => [...prev, fileName]);
  };

  const handleSave = (generatePrescription: boolean = false) => {
    if (!notes.trim()) {
      alert('Por favor ingrese las notas clínicas de la consulta.');
      return;
    }

    onSaveConsultation({
      patientId: currentPatient.id,
      vetName,
      notes,
      prescription: (showPrescription || generatePrescription) ? (prescriptionText || 'Receta generada en consulta médica') : undefined,
      attachments: attachedFiles.length > 0 ? attachedFiles : undefined
    });

    alert(`¡Consulta registrada exitosamente en la ficha del paciente ${currentPatient.name}!`);
  };

  return (
    <div className="flex flex-col w-full h-full flex-1 gap-md overflow-hidden">
      {/* Top Header Card (Shrink-0) */}
      <div className="shrink-0 bg-surface-container-lowest rounded-2xl p-md px-lg shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-md border border-outline-variant/30">
        <div className="flex items-center gap-md">
          <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[24px]">stethoscope</span>
          </div>
          <div>
            <h1 className="font-display-lg text-[20px] text-primary leading-tight">
              Nueva Consulta — {currentPatient.name}
            </h1>
            <p className="font-body-md text-xs text-on-surface-variant flex flex-wrap items-center gap-2 mt-xs">
              <span>{currentPatient.species} • {currentPatient.breed}</span>
              <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
              <span>Propietario: <strong className="text-primary">{currentPatient.ownerName}</strong></span>
              <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
              <span className="text-secondary font-medium">{currentDateFormatted}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-sm bg-surface-container-low p-xs px-md rounded-xl border border-outline-variant/40 self-stretch md:self-auto justify-between">
          <div className="flex flex-col">
            <label className="font-label-sm text-on-surface-variant uppercase text-[10px]">Cambiar Paciente</label>
            <select
              value={targetPatientId}
              onChange={(e) => setTargetPatientId(e.target.value)}
              className="bg-transparent text-primary font-bold text-xs outline-none cursor-pointer"
            >
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species} - {p.ownerName})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-surface-container-lowest rounded-2xl p-lg shadow-md gap-md border border-outline-variant/30">
        <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-sm border-b border-surface-variant pb-xs">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              description
            </span>
            <h2 className="font-headline-sm text-base text-primary font-bold">Registro de Ficha Médica</h2>
          </div>

          <div className="flex items-center gap-xs">
            <label className="font-label-md text-on-surface-variant uppercase text-[11px]">Veterinario Actuante:</label>
            <input
              type="text"
              value={vetName}
              onChange={(e) => setVetName(e.target.value)}
              className="bg-surface-container border-none rounded-lg py-1 px-3 text-on-surface font-semibold text-xs outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>
        </div>

        {/* Clinical Notes Textarea (Compact / Fixed Height Shrink-0) */}
        <div className="shrink-0 flex flex-col gap-1">
          <label className="font-label-md text-xs text-primary font-bold uppercase tracking-wider">
            Notas Clínicas, Anamnesis y Diagnóstico
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Ingrese motivo de consulta, auscultación, constantes vitales, examen físico, diagnóstico presuntivo e indicaciones médicas..."
            className="w-full bg-surface-container text-on-surface font-body-md text-sm p-md rounded-xl outline-none transition-all focus:bg-surface focus:ring-2 focus:ring-secondary placeholder:text-outline h-32 resize-none"
          />
        </div>

        {/* Prescription section (Optional toggle) */}
        {showPrescription && (
          <div className="shrink-0 flex flex-col gap-1 bg-surface-container-low p-md rounded-xl border border-secondary-container">
            <label className="font-label-md text-secondary font-bold uppercase text-[11px] flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">prescriptions</span>
              Indicaciones de Receta Médica
            </label>
            <textarea
              value={prescriptionText}
              onChange={(e) => setPrescriptionText(e.target.value)}
              rows={2}
              placeholder="Detalle de fármacos, concentración, posología y duración del tratamiento..."
              className="w-full bg-surface text-on-surface font-body-md text-xs p-sm rounded-lg outline-none border border-outline-variant focus:ring-2 focus:ring-secondary resize-none"
            />
          </div>
        )}

        {/* Drag & Drop File Upload Zone (Flex-1, Expands to fill available vertical space!) */}
        <div className="flex-1 flex flex-col min-h-0 gap-xs">
          <label className="shrink-0 font-label-md text-on-surface-variant uppercase text-[11px]">
            Archivos Adjuntos (Estudios, Radiografías, Análisis de Laboratorio)
          </label>
          
          <div
            onClick={handleFileSimulate}
            className="flex-1 min-h-0 w-full bg-surface-container-low hover:bg-surface-container p-md rounded-2xl flex flex-col items-center justify-center gap-xs cursor-pointer transition-colors border-2 border-dashed border-outline-variant/60 shadow-inner"
          >
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
            </div>
            <span className="font-headline-sm text-sm font-bold text-on-surface text-center">
              Subir o Arrastrar Archivos o Imágenes
            </span>
            <span className="font-body-md text-xs text-on-surface-variant text-center max-w-sm">
              Arrastra tus estudios aquí o haz clic para simular subida (.JPG, .PNG, .PDF).
            </span>

            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-xs mt-sm">
                {attachedFiles.map((file, idx) => (
                  <span key={idx} className="bg-surface-container-high text-primary px-3 py-1 rounded-full text-xs flex items-center gap-1 font-medium shadow-sm">
                    <span className="material-symbols-outlined text-[14px]">description</span> {file}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Form Actions Footer Bar (Shrink-0) */}
        <div className="shrink-0 flex flex-col sm:flex-row justify-end gap-sm pt-sm border-t border-surface-variant">
          <button
            type="button"
            onClick={onCancel}
            className="px-lg py-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors font-label-md text-xs shadow-sm"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => setShowPrescription(!showPrescription)}
            className="px-lg py-2 rounded-lg bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary transition-colors font-label-md text-xs shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">prescriptions</span>
            {showPrescription ? 'Quitar Receta' : 'Generar Receta'}
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-lg py-2 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-xs shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              save
            </span>
            Guardar Consulta
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-lg py-2 rounded-lg bg-[#27AE60] text-white hover:bg-[#1E8449] transition-all font-label-md text-xs shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Guardar y Generar Receta
          </button>
        </div>
      </div>
    </div>
  );
};
