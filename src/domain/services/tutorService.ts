import { Patient, Species, Sex, MedicalAppointment, GroomingAppointment, BillItem } from '../types';

/**
 * Resume qué se cobró en un comprobante: "Baño Perro chico", "Consulta clínica ×2" o "A, B y 2 más".
 * Devuelve undefined si el comprobante no tiene ítems cargados.
 */
export function summarizeReceiptItems(items?: BillItem[], maxNames: number = 2): string | undefined {
  const named = (items || []).filter(i => (i.description || '').trim());
  if (named.length === 0) return undefined;
  const label = (i: BillItem) => {
    const name = i.description.trim();
    return i.quantity > 1 ? `${name} ×${i.quantity}` : name;
  };
  const shown = named.slice(0, maxNames).map(label);
  const rest = named.length - shown.length;
  if (rest <= 0) return shown.length > 1 ? `${shown.slice(0, -1).join(', ')} y ${shown[shown.length - 1]}` : shown[0];
  return `${shown.join(', ')} y ${rest} más`;
}

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
        address: p.address,
        pets: [p]
      });
    } else {
      const tutor = tutorMap.get(key)!;
      tutor.pets.push(p);
      if (!tutor.address && p.address) tutor.address = p.address;
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
    newAddress?: string;
    petUpdates?: Record<string, { name?: string; species?: Species; breed?: string; sex?: Sex; birthDate?: string; weightKg?: number }>;
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
        address: updates.newAddress !== undefined ? updates.newAddress : p.address,
        name: petUpdate?.name !== undefined ? petUpdate.name : p.name,
        species: (petUpdate?.species !== undefined ? petUpdate.species : p.species) as Species,
        breed: petUpdate?.breed !== undefined ? petUpdate.breed : p.breed,
        sex: (petUpdate?.sex !== undefined ? petUpdate.sex : p.sex) as Sex,
        birthDate: petUpdate?.birthDate !== undefined ? petUpdate.birthDate : p.birthDate,
        weightKg: petUpdate?.weightKg !== undefined ? petUpdate.weightKg : p.weightKg
      };
    }
    return p;
  });
}

export function createPetForTutor(
  patients: Patient[],
  ownerInfo: {
    ownerId: string;
    ownerName: string;
    ownerPhone: string;
    address?: string;
  },
  petData: {
    name: string;
    species: Species;
    breed?: string;
    sex?: Sex;
    birthDate?: string;
    weightKg?: number;
  }
): { updatedPatients: Patient[]; newPet: Patient } {
  const newPetId = `patient-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newPet: Patient = {
    id: newPetId,
    ownerId: ownerInfo.ownerId || `owner-${Date.now()}`,
    ownerName: ownerInfo.ownerName,
    ownerPhone: ownerInfo.ownerPhone,
    address: ownerInfo.address,
    name: petData.name.trim(),
    species: petData.species || 'Canino',
    breed: (petData.breed || '').trim() || 'Mestizo',
    sex: petData.sex || 'Macho',
    birthDate: petData.birthDate || new Date().toISOString().substring(0, 10),
    status: 'active',
    weightKg: Number(petData.weightKg || 0),
    alerts: [],
    weightHistory: petData.weightKg ? [{ date: new Date().toISOString().substring(0, 10), weightKg: Number(petData.weightKg) }] : []
  };

  return {
    updatedPatients: [newPet, ...patients],
    newPet
  };
}

import { BillReceipt, TutorAccountMovement, TutorPaymentRecord } from '../types';
export type { TutorPaymentRecord };

export function calculateTutorAccountMovements(
  tutorName: string,
  receipts: BillReceipt[] = [],
  tutorPayments: TutorPaymentRecord[] = [],
  petIds: string[] = []
): TutorAccountMovement[] {
  const trimmed = (tutorName || '').trim().toLowerCase();
  const petIdSet = new Set((petIds || []).map(id => String(id)));

  const ccReceipts = receipts.filter(r => {
    const pm = (r.paymentMethod || '').toLowerCase().trim();
    return pm === 'cuenta-corriente' || pm === 'cuenta_corriente';
  });

  const filteredReceipts = trimmed
    ? ccReceipts.filter(r => {
        const ownerMatch = Boolean((r.ownerName || r.clientName || '').trim().toLowerCase() === trimmed);
        const petMatch = Boolean(r.patientId && petIdSet.has(String(r.patientId)));
        return ownerMatch || petMatch;
      })
    : ccReceipts;

  const filteredPayments = trimmed
    ? tutorPayments.filter(tp => (tp.tutorName || '').trim().toLowerCase() === trimmed)
    : tutorPayments;

  interface RawMovement {
    id: string;
    type: 'receipt' | 'payment';
    receipt?: BillReceipt;
    payment?: TutorPaymentRecord;
    tutorName: string;
    date: string;
    concept: string;
    detail?: string;
    debe: number;
    haber: number;
  }

  const raw: RawMovement[] = [];

  filteredReceipts.forEach(r => {
    raw.push({
      id: r.id,
      type: 'receipt',
      receipt: r,
      tutorName: r.ownerName || r.clientName || tutorName,
      date: r.date ? r.date.split('T')[0] : new Date().toISOString().split('T')[0],
      concept: `Comprobante ${r.receiptNumber || r.id}`,
      detail: summarizeReceiptItems(r.items),
      debe: r.total || r.totalAmount || 0,
      haber: 0
    });
  });

  filteredPayments.forEach(p => {
    raw.push({
      id: p.id,
      type: 'payment',
      payment: p,
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
      type: m.type,
      receipt: m.receipt,
      payment: m.payment,
      tutorName: m.tutorName,
      date: m.date,
      concept: m.concept,
      detail: m.detail,
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
    .filter(app => (petSet.has(app.patientId) || app.ownerName.toLowerCase() === ownerLower) && app.status !== 'cancelled' && app.status !== 'completed')
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
    .filter(app => (petSet.has(app.patientId) || app.ownerName.toLowerCase() === ownerLower) && app.status !== 'cancelled' && app.status !== 'completed')
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

export interface TutorDebtAgingInfo {
  currentSaldo: number;
  status: 'debt' | 'credit' | 'settled';
  lastPaymentDate?: string;
  daysSinceLastPayment?: number;
  oldestUnsettledDate?: string;
  daysSinceDebtStart?: number;
  message: string;
}

function parseISODateOnly(dateStr: string): Date {
  const parts = dateStr.split('T')[0].split('-');
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function formatDMY(dateStr: string): string {
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export function calculateTutorDebtAging(
  movements: TutorAccountMovement[] = [],
  referenceDateStr: string = new Date().toISOString().split('T')[0]
): TutorDebtAgingInfo {
  if (!movements || movements.length === 0) {
    return {
      currentSaldo: 0,
      status: 'settled',
      message: 'Al día (sin deuda)'
    };
  }

  const currentSaldo = movements[movements.length - 1].saldo;

  if (currentSaldo === 0) {
    return {
      currentSaldo: 0,
      status: 'settled',
      message: 'Al día (sin deuda)'
    };
  }

  if (currentSaldo < 0) {
    return {
      currentSaldo,
      status: 'credit',
      message: 'Saldo a favor del tutor'
    };
  }

  // If currentSaldo > 0 (Tutor has debt)
  const refDate = parseISODateOnly(referenceDateStr);

  // Find all payments (movements where haber > 0)
  const payments = movements.filter(m => m.haber > 0);

  if (payments.length > 0) {
    const lastPayment = payments[payments.length - 1];
    const lastPayDate = parseISODateOnly(lastPayment.date);
    const diffMs = refDate.getTime() - lastPayDate.getTime();
    const daysSinceLastPayment = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

    let msg = '';
    if (daysSinceLastPayment === 0) {
      msg = 'Último pago hoy';
    } else if (daysSinceLastPayment === 1) {
      msg = 'Último pago ayer';
    } else {
      msg = `Último pago hace ${daysSinceLastPayment} días (${formatDMY(lastPayment.date)})`;
    }

    return {
      currentSaldo,
      status: 'debt',
      lastPaymentDate: lastPayment.date,
      daysSinceLastPayment,
      message: msg
    };
  }

  // If no payments ever recorded, compute days since initial debt
  const debts = movements.filter(m => m.debe > 0);
  const firstDebt = debts[0] || movements[0];
  const debtStartDate = parseISODateOnly(firstDebt.date);
  const diffMs = refDate.getTime() - debtStartDate.getTime();
  const daysSinceDebtStart = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  let msg = '';
  if (daysSinceDebtStart === 0) {
    msg = 'Sin pagos registrados (deuda originada hoy)';
  } else if (daysSinceDebtStart === 1) {
    msg = 'Sin pagos registrados (deuda originada ayer)';
  } else {
    msg = `Sin pagos registrados (deuda desde hace ${daysSinceDebtStart} días)`;
  }

  return {
    currentSaldo,
    status: 'debt',
    oldestUnsettledDate: firstDebt.date,
    daysSinceDebtStart,
    message: msg
  };
}


