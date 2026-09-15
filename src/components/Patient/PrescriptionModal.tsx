import React, { useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import { Patient } from '../../domain/types';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  patient: Patient;
  vetName: string;
  vetLicenseNumber?: string;
  prescriptionText: string;
  dateStr?: string;
  autoPrint?: boolean;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  patient,
  vetName,
  vetLicenseNumber = 'MP 8472-VET',
  prescriptionText,
  dateStr,
  autoPrint = false
}) => {
  if (!isOpen) return null;

  const dateFormatted = dateStr || new Date().toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Prepare WhatsApp message link
  const rawPhone = (patient.ownerPhone || '').replace(/\D/g, '');
  const cleanPhone = rawPhone.length === 10 ? `549${rawPhone}` : rawPhone;
  
  const whatsappMessage = `*Receta médica veterinaria — Vetsoft*\n\n` +
    `*Paciente:* ${patient.name} (${patient.species} - ${patient.breed})\n` +
    `*Tutor:* ${patient.ownerName}\n` +
    `*Fecha:* ${dateFormatted}\n` +
    `*Veterinario asignado:* ${vetName} (${vetLicenseNumber})\n\n` +
    `*RP / Indicaciones médicas:*\n` +
    `${prescriptionText}\n\n` +
    `_Centro Veterinario Vetsoft — Consulta y tratamiento_`;

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const handleDownloadPDF = () => {
    const element = document.getElementById('prescription-printable-card');
    if (!element) {
      window.print();
      return;
    }

    const actionsBar = element.querySelector('.print\\:hidden') as HTMLElement | null;
    if (actionsBar) actionsBar.style.display = 'none';

    const cleanPatientName = (patient.name || 'Paciente').replace(/\s+/g, '_');
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `Receta_${cleanPatientName}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
    };

    try {
      html2pdf().set(opt).from(element).save().then(() => {
        if (actionsBar) actionsBar.style.display = 'flex';
      }).catch(() => {
        if (actionsBar) actionsBar.style.display = 'flex';
        window.print();
      });
    } catch {
      if (actionsBar) actionsBar.style.display = 'flex';
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-md animate-fade-in overflow-y-auto print:bg-white print:p-8 print:static print:block print:inset-auto print:backdrop-blur-none">
      <div id="prescription-printable-card" className="relative bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl flex flex-col gap-6 border border-slate-200 my-auto text-slate-900 font-body-md print:shadow-none print:border-none print:w-full print:max-w-none print:p-0 print:m-0">
        
        {/* Botón Cerrar (X) Arriba a la Derecha */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-full transition-colors cursor-pointer print:hidden"
          title="Cerrar ventana"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Encabezado Membretado Impresión / Vista */}
        <div className="flex items-center justify-between border-b-2 border-purple-900/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1D1426] text-white flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[28px] text-[#CBB5E2]">pets</span>
            </div>
            <div>
              <h2 className="font-display-lg text-xl font-semibold text-[#1D1426] leading-tight">
                Centro Veterinario Vetsoft
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                Atención clínica, cirugía y fármacos • Receta médica oficial
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-purple-50 text-[#5C3C7B] border border-purple-200 rounded-full text-xs font-semibold">
              {dateFormatted}
            </span>
          </div>
        </div>

        {/* Ficha Resumen Paciente & Veterinario (Tipografía Aumentada) */}
        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-slate-500">Datos de la mascota</span>
            <span className="font-semibold text-base text-slate-900">{patient.name}</span>
            <span className="text-xs text-slate-700 font-medium">{patient.species} • {patient.breed} ({patient.sex})</span>
            <span className="text-xs text-slate-700 font-medium">Peso: <strong>{patient.weightKg || '--'} kg</strong></span>
          </div>

          <div className="flex flex-col gap-1 text-right">
            <span className="text-[10px] font-medium text-slate-500">Tutor & profesional</span>
            <span className="text-xs text-slate-900">Tutor: <strong className="font-semibold">{patient.ownerName}</strong></span>
            <span className="text-xs text-slate-700 font-medium">Tel: {patient.ownerPhone || 'Sin teléfono'}</span>
            <span className="text-xs text-[#5C3C7B] font-semibold mt-1">Vet: {vetName} ({vetLicenseNumber})</span>
          </div>
        </div>

        {/* Indicaciones Médicas con Tipografía Grande */}
        <div className="flex flex-col gap-2 min-h-[180px] bg-purple-50/30 p-6 rounded-2xl border border-purple-200/80">
          <div className="flex items-center gap-2 border-b border-purple-200 pb-2">
            <span className="font-display-lg text-2xl font-bold text-[#5C3C7B]">RP /</span>
            <span className="text-xs font-semibold text-slate-600">Indicaciones médicas y posología</span>
          </div>
          <div className="text-base text-slate-900 font-medium leading-relaxed whitespace-pre-line pt-2">
            {prescriptionText}
          </div>
        </div>

        {/* Pie de Receta: Sello & Firma del Veterinario */}
        <div className="flex items-end justify-between pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 font-medium">
            <p>Documento de prescripción veterinaria generado por Vetsoft.</p>
            <p>Válido para dispensación en farmacia veterinaria.</p>
          </div>

          <div className="flex flex-col items-center justify-center min-w-[200px] border-t-2 border-slate-400 pt-1 text-center">
            <span className="font-semibold text-sm text-slate-900">{vetName}</span>
            <span className="text-xs text-slate-600 font-medium">{vetLicenseNumber}</span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">Firma y sello profesional</span>
          </div>
        </div>

        {/* Acciones de Modal (Ocultas en Impresión) */}
        <div className="flex items-center justify-end gap-3 pt-2 print:hidden">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#1EBE5D] text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer text-decoration-none"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Enviar por WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleDownloadPDF}
            className="bg-[#9A7DB8] hover:bg-[#8666A6] text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Descargar PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onSave) {
                onSave();
              } else {
                onClose();
              }
            }}
            className="bg-[#5C3C7B] hover:bg-[#4A2F66] text-white px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
