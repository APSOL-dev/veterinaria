import { 
  Owner, 
  Patient, 
  ClinicalNote, 
  VaccineCatalogItem, 
  VaccineDosis, 
  MedicalAppointment, 
  GroomingService, 
  GroomingAppointment, 
  Product, 
  StockMovement, 
  BillReceipt,
  SupplierBill,
  SupplierQuote,
  ServiceCatalogItem,
  ExpenseRecord
} from '../domain/types';

import {
  importedOwners,
  importedPatients,
  importedClinicalNotes,
  importedVaccineCatalog,
  importedVaccineDoses
} from './importedVeterinaryData';

export const initialOwners: Owner[] = importedOwners;
export const initialPatients: Patient[] = importedPatients;
export const initialClinicalNotes: ClinicalNote[] = importedClinicalNotes;
export const initialVaccineCatalog: VaccineCatalogItem[] = importedVaccineCatalog;
export const initialVaccineDoses: VaccineDosis[] = importedVaccineDoses;

import { getWednesdayOfCurrentWeek } from '../domain/services/agendaService';

const sampleWedDate = getWednesdayOfCurrentWeek();

export const initialMedicalAppointments: MedicalAppointment[] = [];
export const initialGroomingServices: GroomingService[] = [];
export const initialGroomingAppointments: GroomingAppointment[] = [];
export const initialProducts: Product[] = [];
export const initialReceipts: BillReceipt[] = [];
export const initialMonthlyBudgets: Record<string, number> = {};
export const initialSupplierBills: SupplierBill[] = [];
export const initialSupplierQuotes: SupplierQuote[] = [];
export const initialServicesCatalog: ServiceCatalogItem[] = [];
export const initialExpenses: ExpenseRecord[] = [];


