import { Patient, PatientRequiredVaccine, VaccineCatalogItem, VaccineDosis } from '../types';

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
    label: '0 dosis registradas'
  };
}

