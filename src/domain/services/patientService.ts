import { Patient, Species } from '../types';

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
