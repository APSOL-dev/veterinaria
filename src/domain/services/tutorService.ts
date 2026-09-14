import { Patient, Species, MedicalAppointment, GroomingAppointment } from '../types';

export interface TutorSummary {
  ownerName: string;
  ownerPhone: string;
  address?: string;
  email?: string;
  pets: Patient[];
}

export function getUniqueTutores(patients: Patient[]): TutorSummary[] {
  const tutorMap = new Map<string, TutorSummary>();

  patients.forEach(p => {
    const key = p.ownerName.trim().toLowerCase();
    if (!tutorMap.has(key)) {
      tutorMap.set(key, {
        ownerName: p.ownerName,
        ownerPhone: p.ownerPhone || 'Sin teléfono',
        pets: [p]
      });
    } else {
      tutorMap.get(key)!.pets.push(p);
    }
  });

  return Array.from(tutorMap.values());
}

export function updateTutorAndPetInfo(
  patients: Patient[],
  originalOwnerName: string,
  updates: {
    newOwnerName: string;
    newOwnerPhone: string;
    petUpdates?: Record<string, { name?: string; species?: Species; breed?: string; weightKg?: number }>;
  }
): Patient[] {
  const keyToMatch = originalOwnerName.trim().toLowerCase();

  return patients.map(p => {
    if (p.ownerName.trim().toLowerCase() === keyToMatch) {
      const petUpdate = updates.petUpdates?.[p.id];
      return {
        ...p,
        ownerName: updates.newOwnerName,
        ownerPhone: updates.newOwnerPhone,
        name: petUpdate?.name !== undefined ? petUpdate.name : p.name,
        species: (petUpdate?.species !== undefined ? petUpdate.species : p.species) as Species,
        breed: petUpdate?.breed !== undefined ? petUpdate.breed : p.breed,
        weightKg: petUpdate?.weightKg !== undefined ? petUpdate.weightKg : p.weightKg
      };
    }
    return p;
  });
}

import { BillReceipt, TutorAccountMovement } from '../types';

export interface TutorPaymentRecord {
  id: string;
  tutorName: string;
  date: string;
  amount: number;
  concept?: string;
}

export function calculateTutorAccountMovements(
  tutorName: string,
  receipts: BillReceipt[] = [],
  tutorPayments: TutorPaymentRecord[] = []
): TutorAccountMovement[] {
  const trimmed = (tutorName || '').trim().toLowerCase();

  const filteredReceipts = trimmed
    ? receipts.filter(r => ((r.ownerName || r.clientName || '')).trim().toLowerCase() === trimmed)
    : receipts;

  const filteredPayments = trimmed
    ? tutorPayments.filter(tp => (tp.tutorName || '').trim().toLowerCase() === trimmed)
    : tutorPayments;

  interface RawMovement {
    id: string;
    type: 'receipt' | 'payment';
    tutorName: string;
    date: string;
    concept: string;
    debe: number;
    haber: number;
  }

  const raw: RawMovement[] = [];

  filteredReceipts.forEach(r => {
    raw.push({
      id: r.id,
      type: 'receipt',
      tutorName: r.ownerName || r.clientName || tutorName,
      date: r.date ? r.date.split('T')[0] : new Date().toISOString().split('T')[0],
      concept: `Comprobante ${r.receiptNumber || r.id}`,
      debe: r.total || 0,
      haber: 0
    });
  });

  filteredPayments.forEach(p => {
    raw.push({
      id: p.id,
      type: 'payment',
      tutorName: p.tutorName || tutorName,
      date: p.date ? p.date.split('T')[0] : new Date().toISOString().split('T')[0],
      concept: p.concept || 'Pago / Abono a cuenta corriente',
      debe: 0,
      haber: p.amount || 0
    });
  });

  raw.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.type !== b.type) return a.type === 'receipt' ? -1 : 1;
    return a.id.localeCompare(b.id);
  });

  let currentSaldo = 0;
  return raw.map(m => {
    currentSaldo += m.debe - m.haber;
    return {
      id: m.id,
      tutorName: m.tutorName,
      date: m.date,
      concept: m.concept,
      debe: m.debe,
      haber: m.haber,
      saldo: currentSaldo
    };
  });
}

export interface TutorAppointmentSummary {
  id: string;
  type: 'Consulta Médica' | 'Peluquería / Estética';
  date: string;
  time: string;
  patientName: string;
  patientId: string;
  detail: string;
  status: string;
}

export function getTutorAppointments(
  tutorName: string,
  tutorPetIds: string[],
  medicalAppointments: MedicalAppointment[] = [],
  groomingAppointments: GroomingAppointment[] = []
): TutorAppointmentSummary[] {
  const ownerLower = (tutorName || '').trim().toLowerCase();
  const petSet = new Set(tutorPetIds);

  const med = (medicalAppointments || [])
    .filter(app => (petSet.has(app.patientId) || app.ownerName.toLowerCase() === ownerLower) && app.status !== 'cancelled')
    .map(app => ({
      id: app.id,
      type: 'Consulta Médica' as const,
      date: app.date,
      time: app.time,
      patientName: app.patientName,
      patientId: app.patientId,
      detail: `Dr. ${app.vetName} — ${app.reason}`,
      status: app.status
    }));

  const groom = (groomingAppointments || [])
    .filter(app => (petSet.has(app.patientId) || app.ownerName.toLowerCase() === ownerLower) && app.status !== 'cancelled')
    .map(app => ({
      id: app.id,
      type: 'Peluquería / Estética' as const,
      date: app.date,
      time: app.time,
      patientName: app.patientName,
      patientId: app.patientId,
      detail: `${app.serviceName}`,
      status: app.status
    }));

  return [...med, ...groom].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

