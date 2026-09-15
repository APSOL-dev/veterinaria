import React, { useState, useRef } from 'react';
import { Patient } from '../../domain/types';
import { formatAttachmentFileList, prepareConsultationPrescriptionText, shouldAutoTriggerPdfOnSave } from '../../domain/services/patientService';
import { uploadConsultationAttachmentToSupabase, uploadPrescriptionToSupabase } from '../../domain/services/supabaseService';
import { AppNotificationModal } from '../Common/AppNotificationModal';
import { SearchablePatientSelect } from '../Common/SearchablePatientSelect';

import { PrescriptionModal } from './PrescriptionModal';

interface NewConsultationViewProps {
  patients: Patient[];
  selectedPatient: Patient;
  onCancel: () => void;
  onSaveConsultation: (data: {
    patientId: string;
    vetName: string;
    vetLicenseNumber?: string;
    notes: string;
    prescription?: string;
    prescriptionUrl?: string;
    attachments?: string[];
    attachmentUrls?: string[];
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
  const [vetLicenseNumber, setVetLicenseNumber] = useState('MP 8472-VET');
  const [notes, setNotes] = useState('');
  const [showPrescription, setShowPrescription] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
  const [rawAttachedFiles, setRawAttachedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [pendingConsultationData, setPendingConsultationData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPatient = patients.find(p => p.id === targetPatientId) || selectedPatient;
  const currentDateFormatted = new Date().toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      const fileNames = formatAttachmentFileList(newFiles);
      setRawAttachedFiles(prev => [...prev, ...newFiles]);
      setAttachedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      const fileNames = formatAttachmentFileList(newFiles);
      setRawAttachedFiles(prev => [...prev, ...newFiles]);
      setAttachedFiles(prev => [...prev, ...fileNames]);
    }
  };

  const handleFileBoxClick = () => {
    fileInputRef.current?.click();
  };

  const [modalNotif, setModalNotif] = useState<{ isOpen: boolean; message: string; type: 'success' | 'warning' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const handleSave = async () => {
    if (!notes.trim()) {
      setModalNotif({
        isOpen: true,
        message: 'Por favor ingrese las notas clínicas de la consulta.',
        type: 'warning'
      });
      return;
    }

    setIsUploading(true);
    const uploadedAttachments: string[] = [];
    const uploadedAttachmentUrls: string[] = [];

    for (const rawFile of rawAttachedFiles) {
      const res = await uploadConsultationAttachmentToSupabase(rawFile);
      if (res) {
        uploadedAttachments.push(res.fileName);
        uploadedAttachmentUrls.push(res.fileUrl);
      } else {
        uploadedAttachments.push(rawFile.name);
      }
    }

    const hasGeneratedPrescription = shouldAutoTriggerPdfOnSave(showPrescription, prescriptionText);
    let finalPrescription = hasGeneratedPrescription ? prescriptionText : undefined;
    let finalPrescriptionUrl: string | undefined = undefined;

    if (finalPrescription) {
      const prescriptionBlob = new Blob([`RECETA VETSOFT\n\nPaciente: ${currentPatient.name}\nVeterinario: ${vetName}\nFecha: ${new Date().toLocaleDateString('es-AR')}\n\nIndicaciones:\n${finalPrescription}`], { type: 'text/plain;charset=utf-8' });
      const resPresc = await uploadPrescriptionToSupabase(prescriptionBlob, `receta_${currentPatient.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.txt`);
      if (resPresc) {
        finalPrescriptionUrl = resPresc.fileUrl;
      }
    }

    setIsUploading(false);

    const dataToSave = {
      patientId: currentPatient.id,
      vetName,
      vetLicenseNumber,
      notes,
      prescription: finalPrescription,
      prescriptionUrl: finalPrescriptionUrl,
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      attachmentUrls: uploadedAttachmentUrls.length > 0 ? uploadedAttachmentUrls : undefined
    };

    if (hasGeneratedPrescription) {
      setPendingConsultationData(dataToSave);
      setShowPrescriptionModal(true);
    } else {
      onSaveConsultation(dataToSave);
      setNotes('');
      setPrescriptionText('');
      setShowPrescription(false);
      setAttachedFiles([]);
      setRawAttachedFiles([]);
    }
  };

  const handleConfirmSave = () => {
    if (pendingConsultationData) {
      onSaveConsultation(pendingConsultationData);
    }
    setShowPrescriptionModal(false);
    setPendingConsultationData(null);
    setNotes('');
    setPrescriptionText('');
    setShowPrescription(false);
    setAttachedFiles([]);
    setRawAttachedFiles([]);
  };

  const handleCloseNotif = () => {
    setModalNotif({ isOpen: false, message: '', type: 'success' });
  };

  return (
    <div className="flex flex-col w-full h-full flex-1 gap-md overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-md mb-md">
        <div>
          <h1 className="font-display-lg text-[22px] text-slate-900 leading-tight font-semibold">
            Clínica — Nueva consulta ({currentPatient.name})
          </h1>
          <p className="font-body-md text-xs text-slate-600 font-medium flex flex-wrap items-center gap-2 mt-0.5">
            <span>{currentPatient.species} • {currentPatient.breed}</span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span>Propietario: <strong className="text-slate-900 font-semibold">{currentPatient.ownerName}</strong></span>
            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
            <span className="text-[#5C3C7B] font-semibold">{currentDateFormatted}</span>
          </p>
        </div>

        <SearchablePatientSelect
          patients={patients}
          selectedPatientId={targetPatientId}
          onSelectPatient={setTargetPatientId}
          labelPrefix="Cambiar paciente:"
          variant="short"
          className="w-auto"
        />
      </div>

      {/* Main Form Body */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden bg-surface-container-lowest rounded-2xl p-lg shadow-md gap-md border border-outline-variant/30">
        <div className="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-sm border-b border-surface-variant pb-xs">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              description
            </span>
            <h2 className="font-headline-sm text-base text-primary font-semibold">Registro de ficha médica</h2>
          </div>

          <div className="flex items-center gap-md flex-wrap">
            <div className="flex items-center gap-xs">
              <label className="font-label-md text-on-surface-variant text-[10px] font-medium">Veterinario asignado:</label>
              <input
                type="text"
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
                className="bg-surface-container border border-outline-variant/80 rounded-lg py-1 px-3 text-on-surface font-semibold text-xs outline-none focus:ring-2 focus:ring-secondary shadow-xs"
              />
            </div>
            <div className="flex items-center gap-xs">
              <label className="font-label-md text-on-surface-variant text-[10px] font-medium">Matrícula:</label>
              <input
                type="text"
                value={vetLicenseNumber}
                onChange={(e) => setVetLicenseNumber(e.target.value)}
                placeholder="Ej. MP 8472-VET"
                className="bg-surface-container border border-outline-variant/80 rounded-lg py-1 px-2.5 text-on-surface font-semibold text-xs outline-none focus:ring-2 focus:ring-secondary shadow-xs w-32"
              />
            </div>
          </div>
        </div>

        {/* Clinical Notes Textarea (Compact / Fixed Height Shrink-0) */}
        <div className="shrink-0 flex flex-col gap-1">
          <label className="font-label-md text-xs text-primary font-semibold">
            Notas clínicas, anamnesis y diagnóstico
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Ingrese motivo de consulta, auscultación, constantes vitales, examen físico, diagnóstico presuntivo e indicaciones médicas..."
            className="w-full bg-surface-container border border-outline-variant/80 text-on-surface font-body-md text-sm p-md rounded-xl outline-none transition-all focus:bg-surface focus:ring-2 focus:ring-secondary placeholder:text-on-surface-variant/70 h-32 resize-none shadow-xs"
          />
        </div>

        {/* Prescription section (Optional toggle) */}
        {showPrescription && (
          <div className="shrink-0 flex flex-col gap-1 bg-surface-container-low p-md rounded-xl border border-secondary/50 shadow-xs">
            <label className="font-label-md text-secondary font-semibold text-[11px] flex items-center gap-xs">
              <span className="material-symbols-outlined text-[16px]">prescriptions</span>
              Indicaciones de receta médica
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

        {/* Drag & Drop File Upload Zone */}
        <div className="flex-1 flex flex-col min-h-0 gap-xs">
          <label className="shrink-0 font-label-md text-on-surface-variant text-[11px] font-medium">
            Archivos adjuntos (Estudios, radiografías, análisis de laboratorio)
          </label>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          />

          <div
            onClick={handleFileBoxClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex-1 min-h-0 w-full p-md rounded-2xl flex flex-col items-center justify-center gap-xs cursor-pointer transition-all border-2 border-dashed shadow-xs ${
              isDragging
                ? 'bg-primary-container/20 border-primary scale-[0.99]'
                : 'bg-surface-container-low hover:bg-surface-container border-secondary/50'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
            </div>
            <span className="font-headline-sm text-sm font-semibold text-on-surface text-center">
              Subir o arrastrar archivos o imágenes
            </span>
            <span className="font-body-md text-xs text-on-surface-variant text-center max-w-sm">
              Arrastra tus estudios aquí o haz clic para seleccionar del equipo (.JPG, .PNG, .PDF, .DOC).
            </span>

            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap justify-center gap-xs mt-sm" onClick={(e) => e.stopPropagation()}>
                {attachedFiles.map((file, idx) => (
                  <span key={idx} className="bg-surface-container-high text-primary px-3 py-1 rounded-full text-xs flex items-center gap-1 font-medium shadow-sm border border-outline-variant/40">
                    <span className="material-symbols-outlined text-[14px]">description</span> {file}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="ml-1 text-on-surface-variant hover:text-error transition-colors"
                      title="Eliminar archivo"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
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
            className="px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors font-label-md text-xs font-semibold shadow-sm cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => setShowPrescription(!showPrescription)}
            className="px-4 py-2.5 rounded-xl bg-secondary-container text-on-secondary-container hover:bg-secondary hover:text-on-secondary transition-colors font-label-md text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">prescriptions</span>
            {showPrescription ? 'Quitar receta' : 'Generar receta'}
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isUploading}
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all font-label-md text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              save
            </span>
            {isUploading ? 'Guardando...' : 'Guardar consulta'}
          </button>
        </div>
      </div>

      <AppNotificationModal
        isOpen={modalNotif.isOpen}
        message={modalNotif.message}
        type={modalNotif.type}
        onClose={handleCloseNotif}
      />

      <PrescriptionModal
        isOpen={showPrescriptionModal}
        autoPrint={false}
        onClose={handleConfirmSave}
        onSave={handleConfirmSave}
        patient={currentPatient}
        vetName={vetName}
        vetLicenseNumber={vetLicenseNumber}
        prescriptionText={prepareConsultationPrescriptionText(notes, prescriptionText)}
      />
    </div>
  );
};
