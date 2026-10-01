import { Patient, Species } from '../types';

const COAT_ALERT_PREFIX = /^\s*pelaje\s*:\s*/i;

/**
 * Splits raw stored alerts into real clinical alerts and the coat description.
 * The database keeps the coat inside the alerts array as "Pelaje: X"; the app treats it as a description.
 */
export function splitPatientAlerts(rawAlerts?: string[] | null): { alerts: string[]; coat: string } {
  const alerts: string[] = [];
  let coat = '';
  for (const entry of Array.isArray(rawAlerts) ? rawAlerts : []) {
    if (typeof entry === 'string' && COAT_ALERT_PREFIX.test(entry)) {
      const value = entry.replace(COAT_ALERT_PREFIX, '').trim();
      if (value && !coat) coat = value;
    } else {
      alerts.push(entry);
    }
  }
  return { alerts, coat };
}

/**
 * Rebuilds the stored alerts array (with "Pelaje: X" when a coat description exists) for persistence.
 */
export function mergePatientAlerts(alerts?: string[] | null, coat?: string | null): string[] {
  const clean = (Array.isArray(alerts) ? alerts : []).filter(a => !COAT_ALERT_PREFIX.test(a));
  const trimmedCoat = (coat || '').trim();
  return trimmedCoat ? [...clean, `Pelaje: ${trimmedCoat}`] : clean;
}

/**
 * Returns the patient with the coat moved out of the alerts array into `coat`.
 */
export function normalizePatientCoat(patient: Patient): Patient {
  const { alerts, coat } = splitPatientAlerts(patient.alerts);
  return { ...patient, alerts, coat: patient.coat || coat || undefined };
}

export function filterPatients(
  patients: Patient[],
  searchQuery: string,
  categoryFilter: string
): Patient[] {
  const query = searchQuery.toLowerCase().trim();

  return patients.filter((patient) => {
    // 1. Text Search Filter
    const matchesSearch =
      query === '' ||
      patient.name.toLowerCase().includes(query) ||
      patient.ownerName.toLowerCase().includes(query) ||
      patient.breed.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // 2. Category Filter
    if (categoryFilter === 'Todos') return true;

    if (categoryFilter === 'Con Alertas') {
      return Boolean(patient.alerts && patient.alerts.length > 0);
    }

    return patient.species === (categoryFilter as Species);
  });
}

export function createNewPatientRecord(input: {
  name: string;
  species: Species;
  breed: string;
  sex: 'Macho' | 'Hembra' | 'Indeterminado';
  birthDate: string;
  ownerName: string;
  ownerPhone?: string;
  weightKg?: number;
  alerts?: string[];
  coat?: string;
  photoUrl?: string;
}): Patient {
  const currentDateLabel = new Date().toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
  const initialWeight = input.weightKg || 0;

  return {
    id: 'patient-' + Date.now(),
    ownerId: 'owner-' + Date.now(),
    ownerName: input.ownerName,
    ownerPhone: input.ownerPhone || '+54 9 11 0000-0000',
    name: input.name,
    species: input.species,
    breed: input.breed,
    sex: input.sex,
    birthDate: input.birthDate,
    status: 'active',
    weightKg: initialWeight,
    alerts: input.alerts || [],
    coat: input.coat?.trim() || undefined,
    photoUrl: input.photoUrl,
    weightHistory: initialWeight > 0 ? [{ date: currentDateLabel, weightKg: initialWeight }] : []
  };
}

export function calculateWeightTrend(weightHistory?: { date: string; weightKg: number }[]): {
  diff: number;
  direction: 'up' | 'down' | 'neutral';
  formatted: string;
} {
  if (!weightHistory || weightHistory.length < 2) {
    return { diff: 0, direction: 'neutral', formatted: 'Estable' };
  }

  const firstWeight = weightHistory[0].weightKg;
  const lastWeight = weightHistory[weightHistory.length - 1].weightKg;
  const diff = Math.round((lastWeight - firstWeight) * 10) / 10;

  if (diff > 0) {
    return { diff, direction: 'up', formatted: `+${diff.toFixed(1)} kg` };
  } else if (diff < 0) {
    return { diff: Math.abs(diff), direction: 'down', formatted: `${diff.toFixed(1)} kg` };
  } else {
    return { diff: 0, direction: 'neutral', formatted: 'Estable' };
  }
}

export function formatAttachmentFileList(files: (File | string)[]): string[] {
  if (!Array.isArray(files)) return [];
  return files.map(f => typeof f === 'string' ? f : f.name).filter(Boolean);
}

export function updatePatientRecord(
  patients: Patient[],
  patientId: string,
  updates: Partial<Patient>
): Patient[] {
  const currentDateLabel = new Date().toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });

  return patients.map(p => {
    if (p.id !== patientId) return p;

    const newWeight = updates.weightKg !== undefined ? Number(updates.weightKg) : p.weightKg;
    let updatedHistory = p.weightHistory ? [...p.weightHistory] : [];

    if (newWeight !== undefined && newWeight > 0 && newWeight !== p.weightKg) {
      updatedHistory.push({ date: currentDateLabel, weightKg: newWeight });
    }

    return {
      ...p,
      ...updates,
      weightKg: newWeight,
      weightHistory: updatedHistory
    };
  });
}

export function shouldAutoTriggerPdfOnSave(
  generatePdfFlag?: boolean, 
  prescriptionText?: string
): boolean {
  if (!generatePdfFlag) return false;
  return Boolean(prescriptionText && prescriptionText.trim().length > 0);
}

export function formatConsultationPdfTitle(
  patientName: string, 
  documentType: string = 'Receta'
): string {
  const sanitizedName = (patientName || 'Paciente').replace(/\s+/g, '_');
  const sanitizedType = (documentType || 'Documento').replace(/\s+/g, '_');
  return `Receta_${sanitizedType}_${sanitizedName}.pdf`;
}

import { ClinicalNote } from '../types';

export function updateClinicalNoteRecord(
  notes: ClinicalNote[],
  noteId: string,
  updates: { notes?: string; vetName?: string; prescription?: string }
): ClinicalNote[] {
  return notes.map(n => {
    if (n.id !== noteId) return n;
    return {
      ...n,
      notes: updates.notes !== undefined ? updates.notes : n.notes,
      vetName: updates.vetName !== undefined ? updates.vetName : n.vetName,
      prescription: updates.prescription !== undefined ? updates.prescription : n.prescription
    };
  });
}

export function deleteClinicalNoteRecord(
  notes: ClinicalNote[],
  noteId: string
): ClinicalNote[] {
  return notes.filter(n => n.id !== noteId);
}

export function prepareConsultationPrescriptionText(
  notes: string,
  prescriptionText?: string
): string {
  if (prescriptionText && prescriptionText.trim().length > 0) {
    return prescriptionText.trim();
  }
  return notes.trim() || 'Consulta médica registrada.';
}

export function toggleAlertItem(alerts: string[], item: string): string[] {
  const trimmed = item.trim();
  if (!trimmed) return alerts;
  if (alerts.includes(trimmed)) {
    return alerts.filter(a => a !== trimmed);
  }
  return [...alerts, trimmed];
}

export function formatPatientOptionLabel(patient: Patient, variant: 'full' | 'short' | 'agenda' = 'full'): string {
  if (!patient) return '';
  if (variant === 'short') {
    return `${patient.name} (${patient.species} - ${patient.ownerName})`;
  }
  if (variant === 'agenda') {
    return `${patient.name} (${patient.species} - Dueño: ${patient.ownerName})`;
  }
  return `${patient.name} (${patient.species}${patient.breed ? ` - ${patient.breed}` : ''} | Tutor: ${patient.ownerName})`;
}

export function getRecentOrFilteredPatients(
  patients: Patient[],
  searchQuery: string,
  activePatientId?: string,
  limit: number = 15
): Patient[] {
  const query = (searchQuery || '').toLowerCase().trim();

  if (!query) {
    const top = patients.slice(0, limit);
    if (activePatientId && !top.some(p => p.id === activePatientId)) {
      const activeP = patients.find(p => p.id === activePatientId);
      if (activeP) {
        return [activeP, ...top.slice(0, limit - 1)];
      }
    }
    return top;
  }

  return patients.filter((patient) => {
    return (
      patient.name.toLowerCase().includes(query) ||
      patient.ownerName.toLowerCase().includes(query) ||
      patient.breed.toLowerCase().includes(query) ||
      patient.species.toLowerCase().includes(query)
    );
  });
}



