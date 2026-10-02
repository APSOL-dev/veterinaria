import { MedicalAppointment, Patient, PatientRequiredVaccine, VaccineCatalogItem, VaccineDosis } from '../types';

export function calculateExpirationDate(applicationDate: string, frequencyDays: number): string {
  const date = new Date(applicationDate + 'T00:00:00');
  date.setDate(date.getDate() + frequencyDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function determineVaccineStatus(
  expirationDate: string,
  currentDate: string = new Date().toISOString().split('T')[0]
): 'ok' | 'due_soon' | 'expired' {
  const exp = new Date(expirationDate + 'T00:00:00').getTime();
  const cur = new Date(currentDate + 'T00:00:00').getTime();

  if (exp < cur) {
    return 'expired';
  }

  const diffDays = Math.ceil((exp - cur) / (1000 * 60 * 60 * 24));
  if (diffDays <= 30) {
    return 'due_soon';
  }

  return 'ok';
}

export function createDosisRecord(
  patientId: string,
  vaccineCatalogItem: VaccineCatalogItem,
  applicationDate: string,
  vetName: string,
  customExpirationDate?: string,
  batch?: string
): VaccineDosis {
  const expirationDate = customExpirationDate || calculateExpirationDate(applicationDate, vaccineCatalogItem.frequencyDays);
  const status = determineVaccineStatus(expirationDate);

  return {
    id: 'dosis-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    patientId,
    vaccineId: vaccineCatalogItem.id,
    vaccineName: vaccineCatalogItem.name,
    applicationDate,
    expirationDate,
    vetName,
    batch,
    status
  };
}

export function formatVaccineReminderMessage(
  ownerName: string,
  vaccineName: string,
  patientName: string,
  expirationDate: string
): string {
  return `Hola ${ownerName}, te recordamos que la vacuna ${vaccineName} para ${patientName} vence el ${expirationDate} podemos agendar una visita para poner a ${patientName} al día!`;
}

export function getVencimientoLabel(status: string): 'Al día' | 'Vencida' {
  if (status === 'expired') {
    return 'Vencida';
  }
  return 'Al día';
}

export function getEstadoLabel(status: string): 'Aplicada' | 'Pendiente' {
  if (status === 'pendiente') {
    return 'Pendiente';
  }
  return 'Aplicada';
}

export function getEffectiveVaccineNextDueDate(
  patientId: string,
  vac: PatientRequiredVaccine,
  vaccineDoses: VaccineDosis[] = [],
  vaccineCatalog: VaccineCatalogItem[] = []
): string {
  if (vac.status === 'pendiente') {
    return vac.suggestedDate;
  }

  // Si está aplicada, buscar dosis en el historial de este paciente
  const matchingDosis = vaccineDoses.find(
    d => d.patientId === patientId && d.vaccineName.toLowerCase() === vac.vaccineName.toLowerCase()
  );

  if (matchingDosis?.expirationDate) {
    return matchingDosis.expirationDate;
  }

  const catItem = vaccineCatalog.find(
    c => c.name.toLowerCase() === vac.vaccineName.toLowerCase()
  );
  const frequencyDays = catItem?.frequencyDays || 365;
  const baseDate = vac.appliedDate || vac.suggestedDate || new Date().toISOString().split('T')[0];

  return calculateExpirationDate(baseDate, frequencyDays);
}

export interface PendingVaccineInfo {
  vaccineName: string;
  expirationDate: string;
  isExpired: boolean;
  isRequiredPending: boolean;
}

export function getPendingOrDueVaccine(
  patient: Patient,
  vaccineDoses: VaccineDosis[] = [],
  currentDate: string = new Date().toISOString().split('T')[0]
): PendingVaccineInfo | null {
  const patientDoses = vaccineDoses.filter(d => d.patientId === patient.id);
  
  // 1. Check for expired or due soon doses in history
  const dueOrExpiredDose = patientDoses.find(d => {
    const isExp = d.status === 'expired' || Boolean(d.expirationDate && d.expirationDate < currentDate);
    const isDue = d.status === 'due_soon';
    return isExp || isDue;
  });

  if (dueOrExpiredDose) {
    const isExp = dueOrExpiredDose.status === 'expired' || Boolean(dueOrExpiredDose.expirationDate && dueOrExpiredDose.expirationDate < currentDate);
    return {
      vaccineName: dueOrExpiredDose.vaccineName,
      expirationDate: dueOrExpiredDose.expirationDate,
      isExpired: Boolean(isExp),
      isRequiredPending: false
    };
  }

  // 2. Check for pending required vaccines
  const pendingReq = (patient.requiredVaccines || []).find(v => v.status === 'pendiente');
  if (pendingReq) {
    const isExp = pendingReq.suggestedDate ? pendingReq.suggestedDate < currentDate : false;
    return {
      vaccineName: pendingReq.vaccineName,
      expirationDate: pendingReq.suggestedDate,
      isExpired: Boolean(isExp),
      isRequiredPending: true
    };
  }

  return null;
}

export interface PatientVaccineCoverage {
  percentage: number;
  validCount: number;
  totalCount: number;
  label: string;
}

export function calculatePatientVaccineCoverage(
  patient: Patient,
  vaccineDoses: VaccineDosis[] = [],
  vaccineCatalog: VaccineCatalogItem[] = [],
  currentDate: string = new Date().toISOString().split('T')[0]
): PatientVaccineCoverage {
  const patientDoses = vaccineDoses.filter(d => d.patientId === patient.id);
  const reqList = patient.requiredVaccines || [];

  // Caso 1: Paciente tiene vacunas requeridas definidas en su ficha
  if (reqList.length > 0) {
    const totalCount = reqList.length;
    let validCount = 0;

    for (const req of reqList) {
      if (req.status === 'aplicada') {
        const nextDueDate = getEffectiveVaccineNextDueDate(patient.id, req, vaccineDoses, vaccineCatalog);
        if (nextDueDate && nextDueDate >= currentDate) {
          validCount++;
        }
      }
    }

    const percentage = Math.round((validCount / totalCount) * 100);
    const label = `${validCount} de ${totalCount} requeridas al día`;

    return { percentage, validCount, totalCount, label };
  }

  // Caso 2: Paciente no tiene vacunas requeridas, pero tiene dosis en su historial
  if (patientDoses.length > 0) {
    // Agrupar por nombre de vacuna y tomar la última dosis de cada tipo
    const latestDosisByVaccine = new Map<string, VaccineDosis>();
    for (const dose of patientDoses) {
      const key = (dose.vaccineName || '').trim().toLowerCase();
      const existing = latestDosisByVaccine.get(key);
      if (!existing || (dose.applicationDate && (!existing.applicationDate || dose.applicationDate > existing.applicationDate))) {
        latestDosisByVaccine.set(key, dose);
      }
    }

    const uniqueDoses = Array.from(latestDosisByVaccine.values());
    const totalCount = uniqueDoses.length;
    let validCount = 0;

    for (const dose of uniqueDoses) {
      const isExpired = dose.status === 'expired' || Boolean(dose.expirationDate && dose.expirationDate < currentDate);
      if (!isExpired) {
        validCount++;
      }
    }

    const percentage = totalCount > 0 ? Math.round((validCount / totalCount) * 100) : 0;
    const label = `${validCount} de ${totalCount} vacunas al día`;

    return { percentage, validCount, totalCount, label };
  }

  // Caso 3: Paciente sin vacunas
  return {
    percentage: 0,
    validCount: 0,
    totalCount: 0,
    label: 'Sin vacunas registradas'
  };
}

export type PatientVaccineGlobalStatusType = 'sin_datos' | 'al_dia' | 'vencida' | 'pendiente';

export interface PatientVaccineGlobalStatus {
  status: PatientVaccineGlobalStatusType;
  label: string;
  badgeClass: string;
}

export function getPatientVaccineGlobalStatus(
  patient: Patient,
  vaccineDoses: VaccineDosis[] = [],
  vaccineCatalog: VaccineCatalogItem[] = [],
  currentDate: string = new Date().toISOString().split('T')[0]
): PatientVaccineGlobalStatus {
  const patientDoses = vaccineDoses.filter(d => d.patientId === patient.id);
  const reqList = patient.requiredVaccines || [];

  // 1. Si no tiene ni dosis ni vacunas requeridas cargadas: Sin datos
  if (patientDoses.length === 0 && reqList.length === 0) {
    return {
      status: 'sin_datos',
      label: 'Sin datos',
      badgeClass: 'bg-slate-100 text-slate-600 border-slate-300'
    };
  }

  // 2. Si tiene vacunas requeridas definidas en su ficha
  if (reqList.length > 0) {
    const hasExpiredReq = reqList.some(v => v.status !== 'aplicada' && Boolean(v.suggestedDate && v.suggestedDate < currentDate));
    const hasExpiredDose = patientDoses.some(d => d.status === 'expired' || Boolean(d.expirationDate && d.expirationDate < currentDate));
    
    if (hasExpiredReq || hasExpiredDose) {
      return {
        status: 'vencida',
        label: 'Vencida',
        badgeClass: 'bg-red-50 text-red-700 border-red-200'
      };
    }

    const hasPendingReq = reqList.some(v => v.status === 'pendiente');
    if (hasPendingReq) {
      return {
        status: 'pendiente',
        label: 'Pendiente',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }

    return {
      status: 'al_dia',
      label: 'Al día',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
  }

  // 3. Si solo tiene historial de dosis
  const hasExpired = patientDoses.some(d => d.status === 'expired' || Boolean(d.expirationDate && d.expirationDate < currentDate));
  if (hasExpired) {
    return {
      status: 'vencida',
      label: 'Vencida',
      badgeClass: 'bg-red-50 text-red-700 border-red-200'
    };
  }

  return {
    status: 'al_dia',
    label: 'Al día',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  };
}

export function findActiveVaccineAppointment(
  patientId: string,
  vaccineName: string,
  medicalAppointments: MedicalAppointment[] = []
): MedicalAppointment | undefined {
  const normVac = vaccineName.trim().toLowerCase();
  return medicalAppointments.find(app => {
    if (app.patientId !== patientId) return false;
    if (app.status === 'completed' || app.status === 'cancelled') return false;
    const reason = (app.reason || '').toLowerCase();
    return reason.includes(normVac);
  });
}

export function matchVaccineNameFromAppointment(
  reason: string,
  requiredVaccines: PatientRequiredVaccine[] = [],
  vaccineCatalog: VaccineCatalogItem[] = []
): string | undefined {
  if (!reason) return undefined;
  const trimmed = reason.trim();

  const stripAccents = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  // Pattern: "Vacunación: <VaccineName>" or "Vacunacion: <VaccineName>"
  const prefixMatch = trimmed.match(/^vacunaci[oó]n:\s*(.+)$/i);
  if (prefixMatch && prefixMatch[1]) {
    const rawTarget = stripAccents(prefixMatch[1]);
    // Try to find exact or accent-insensitive match in requiredVaccines
    const matchReq = requiredVaccines.find(r => stripAccents(r.vaccineName) === rawTarget);
    if (matchReq) return matchReq.vaccineName;

    // Try in catalog
    const matchCat = vaccineCatalog.find(c => stripAccents(c.name) === rawTarget);
    if (matchCat) return matchCat.name;

    return prefixMatch[1].trim();
  }

  const normalizedReason = stripAccents(trimmed);

  // Check if reason contains any required vaccine name
  for (const req of requiredVaccines) {
    if (normalizedReason.includes(stripAccents(req.vaccineName))) {
      return req.vaccineName;
    }
  }

  // Check if reason contains any catalog vaccine name
  for (const cat of vaccineCatalog) {
    if (normalizedReason.includes(stripAccents(cat.name))) {
      return cat.name;
    }
  }

  return undefined;
}

export function completeVaccineFromAppointment(
  patient: Patient,
  vaccineName: string,
  applicationDate: string,
  vetName: string,
  vaccineCatalog: VaccineCatalogItem[] = []
): { updatedPatient: Patient; newDosis: VaccineDosis } {
  let vacItem = vaccineCatalog.find(
    v => v.name.toLowerCase() === vaccineName.toLowerCase() || v.id === vaccineName
  );

  if (!vacItem) {
    vacItem = {
      id: `vac-${Date.now()}`,
      name: vaccineName,
      frequencyDays: 365
    };
  }

  const newDosis = createDosisRecord(
    patient.id,
    vacItem,
    applicationDate,
    vetName || 'Veterinaria'
  );

  const updatedReqs = (patient.requiredVaccines || []).map(req => {
    if (req.vaccineName.toLowerCase() === vaccineName.toLowerCase()) {
      return {
        ...req,
        status: 'aplicada' as const,
        appliedDate: applicationDate
      };
    }
    return req;
  });

  const updatedPatient: Patient = {
    ...patient,
    requiredVaccines: updatedReqs
  };

  return { updatedPatient, newDosis };
}

/**
 * Filters the vaccine catalog by search query and optional species filter.
 */
export function filterVaccineCatalog(
  catalog: VaccineCatalogItem[],
  query: string,
  speciesFilter?: string
): VaccineCatalogItem[] {
  let result = catalog;

  if (speciesFilter && speciesFilter !== 'Todos' && speciesFilter !== 'Ambos') {
    const sNorm = speciesFilter.toLowerCase().trim();
    result = result.filter(item => {
      if (!item.species || item.species === 'Ambos' || item.species === 'Todos') return true;
      return item.species.toLowerCase() === sNorm;
    });
  }

  if (!query || !query.trim()) {
    return result;
  }

  const q = query.toLowerCase().trim();
  return result.filter(item => {
    return (
      item.name.toLowerCase().includes(q) ||
      (item.species && item.species.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      `${item.frequencyDays}`.includes(q)
    );
  });
}



