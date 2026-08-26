import { VaccineCatalogItem, VaccineDosis } from '../types';

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
