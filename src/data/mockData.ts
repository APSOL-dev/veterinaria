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

export const initialGroomingServices: GroomingService[] = [
  { id: 'groom-srv-1', name: 'Baño — perro chico', durationMinutes: 45, price: 12000 },
  { id: 'groom-srv-2', name: 'Baño — perro mediano/grande', durationMinutes: 60, price: 16000 },
  { id: 'groom-srv-3', name: 'Baño y Corte — perro chico', durationMinutes: 60, price: 18000 },
  { id: 'groom-srv-4', name: 'Baño y Corte — perro grande', durationMinutes: 120, price: 25000 },
  { id: 'groom-srv-5', name: 'Baño y Deslanado — gato', durationMinutes: 60, price: 20000 }
];

export const initialGroomingAppointments: GroomingAppointment[] = [];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'VET-MED-001',
    name: 'Bravecto Perros 10-20kg',
    category: 'Medicamentos',
    currentStock: 45,
    minStock: 10,
    price: 32500,
    barcode: '7791234567890',
    priceLastUpdated: '2026-08-01',
    updateFrequencyDays: 30
  },
  {
    id: 'prod-2',
    sku: 'VET-ALM-042',
    name: 'Royal Canin Gastrointestinal 2kg',
    category: 'Alimentación',
    currentStock: 4,
    minStock: 5,
    price: 24990,
    barcode: '7790000111222',
    priceLastUpdated: '2026-07-15',
    updateFrequencyDays: 30
  },
  {
    id: 'prod-3',
    sku: 'VET-MED-089',
    name: 'Meloxicam Inyectable 50ml',
    category: 'Insumos Clínicos',
    currentStock: 0,
    minStock: 2,
    price: 18200,
    barcode: '7798888777666',
    priceLastUpdated: '2026-08-10',
    updateFrequencyDays: 30
  },
  {
    id: 'prod-4',
    sku: 'VET-ACC-112',
    name: 'Correa Retráctil 5m Flexi',
    category: 'Accesorios',
    currentStock: 12,
    minStock: 3,
    price: 15000,
    barcode: '7795555444333',
    priceLastUpdated: '2026-08-10',
    updateFrequencyDays: 60
  },
  {
    id: 'prod-5',
    sku: 'VET-MED-002',
    name: 'Antibiótico Amoxicilina 500mg (Blister x 10)',
    category: 'Medicamentos',
    currentStock: 30,
    minStock: 5,
    price: 8500,
    barcode: '7793333222111',
    priceLastUpdated: '2026-09-01',
    updateFrequencyDays: 30
  }
];

export const initialReceipts: BillReceipt[] = [];

export const initialMonthlyBudgets: Record<string, number> = {
  '2025-05': 1672203,
  '2025-06': 2000000,
  '2025-07': 1521000,
  '2025-08': 2200000,
  '2025-09': 2200000,
  '2025-10': 4000000,
  '2025-11': 4000000,
  '2025-12': 4000000,
  '2026-01': 4000000,
  '2026-02': 4000000,
  '2026-03': 4000000,
  '2026-04': 2000000,
  '2026-05': 4000000,
  '2026-06': 4000000,
  '2026-07': 4000000,
  '2026-08': 2000000,
  '2026-09': 2000000,
  '2026-10': 2000000,
  '2026-11': 2000000
};

export const initialSupplierBills: SupplierBill[] = [
  { id: 'sbill-2025-05', supplierName: 'FarmaVet SA', invoiceNumber: 'FC-A-0001-001', date: '2025-05-15', amount: 2175377, itemsCount: 15, status: 'paid' },
  { id: 'sbill-2025-06', supplierName: 'Laboratorios Zoonosis', invoiceNumber: 'FC-A-0001-002', date: '2025-06-10', amount: 1519447, itemsCount: 10, status: 'paid' },
  { id: 'sbill-2025-07', supplierName: 'Distribuidora del Plata', invoiceNumber: 'FC-A-0001-003', date: '2025-07-20', amount: 1808233, itemsCount: 12, status: 'paid' },
  { id: 'sbill-2025-08', supplierName: 'FarmaVet SA', invoiceNumber: 'FC-A-0001-004', date: '2025-08-12', amount: 2069912, itemsCount: 14, status: 'paid' },
  { id: 'sbill-2025-09', supplierName: 'Insumos Médicos Sur', invoiceNumber: 'FC-A-0001-005', date: '2025-09-05', amount: 1409984, itemsCount: 8, status: 'paid' },
  { id: 'sbill-2025-10', supplierName: 'Distribuidora del Plata', invoiceNumber: 'FC-A-0001-006', date: '2025-10-18', amount: 2501139, itemsCount: 20, status: 'paid' },
  { id: 'sbill-2025-11', supplierName: 'FarmaVet SA', invoiceNumber: 'FC-A-0001-007', date: '2025-11-22', amount: 2263435, itemsCount: 16, status: 'paid' },
  { id: 'sbill-2025-12', supplierName: 'Laboratorios Zoonosis', invoiceNumber: 'FC-A-0001-008', date: '2025-12-14', amount: 2528477, itemsCount: 18, status: 'paid' },
  { id: 'sbill-2026-01', supplierName: 'FarmaVet SA', invoiceNumber: 'FC-A-0002-001', date: '2026-01-10', amount: 2149826, itemsCount: 15, status: 'paid' },
  { id: 'sbill-2026-02', supplierName: 'Insumos Médicos Sur', invoiceNumber: 'FC-A-0002-002', date: '2026-02-15', amount: 2824195, itemsCount: 22, status: 'paid' },
  { id: 'sbill-2026-03', supplierName: 'Distribuidora del Plata', invoiceNumber: 'FC-A-0002-003', date: '2026-03-20', amount: 2653737, itemsCount: 19, status: 'paid' },
  { id: 'sbill-2026-04', supplierName: 'FarmaVet SA', invoiceNumber: 'FC-A-0002-004', date: '2026-04-12', amount: 1516106, itemsCount: 11, status: 'paid' },
  { id: 'sbill-2026-05', supplierName: 'Laboratorios Zoonosis', invoiceNumber: 'FC-A-0002-005', date: '2026-05-18', amount: 2874993, itemsCount: 21, status: 'paid' },
  { id: 'sbill-2026-06', supplierName: 'Distribuidora del Plata', invoiceNumber: 'FC-A-0002-006', date: '2026-06-25', amount: 2352750, itemsCount: 17, status: 'paid' },
  { id: 'sbill-2026-07', supplierName: 'FarmaVet SA', invoiceNumber: 'FC-A-0002-007', date: '2026-07-08', amount: 2264736, itemsCount: 16, status: 'paid' },
  { id: 'sbill-2026-08-paid', supplierName: 'Distribuidora FarmaVet SA', invoiceNumber: 'FC-A-0001-0004521', date: '2026-08-05', amount: 1480531, itemsCount: 18, status: 'paid' },
  { id: 'sbill-2026-08-pending', supplierName: 'Laboratorios Zoonosis SRL', invoiceNumber: 'FC-A-0003-0001289', date: '2026-08-24', amount: 487946, itemsCount: 12, status: 'pending' },
  { id: 'sbill-2026-09', supplierName: 'Insumos Médicos del Plata', invoiceNumber: 'FC-A-0004-0000012', date: '2026-09-10', amount: 876240, itemsCount: 6, status: 'pending' },
  { id: 'sbill-2026-10', supplierName: 'FarmaVet SA', invoiceNumber: 'FC-A-0004-0000045', date: '2026-10-05', amount: 191401, itemsCount: 3, status: 'pending' }
];

export const initialSupplierQuotes: SupplierQuote[] = [
  {
    id: 'squote-1',
    supplierName: 'Distribuidora FarmaVet SA',
    title: 'Presupuesto Lote Vacunas Antirrábicas x 100',
    date: '2026-08-25',
    amount: 320000,
    status: 'approved'
  },
  {
    id: 'squote-2',
    supplierName: 'Insumos Médicos del Plata',
    title: 'Presupuesto Material de Sutura y Jeringas',
    date: '2026-08-26',
    amount: 95000,
    status: 'draft'
  }
];

export const initialServicesCatalog: ServiceCatalogItem[] = [
  {
    id: 'srv-cat-1',
    category: 'clinica',
    name: 'Consulta Médica General',
    description: 'Examen físico completo, auscultación y diagnóstico primario',
    quantity: 1,
    isActive: true,
    price: 15000,
    priceLastUpdated: '2026-08-01',
    lastSoldAt: '2026-08-26'
  },
  {
    id: 'srv-cat-2',
    category: 'clinica',
    name: 'Perfil Bioquímico de Sangre',
    description: 'Análisis de laboratorio completo de función renal y hepática',
    quantity: 1,
    isActive: true,
    price: 22000,
    priceLastUpdated: '2026-07-15',
    lastSoldAt: '2026-08-24'
  },
  {
    id: 'srv-cat-3',
    category: 'peluqueria',
    name: 'Baño e Higiene Canina',
    description: 'Servicio estético de baño, secado, vaciado de glándulas y perfume',
    quantity: 1,
    isActive: true,
    price: 18000,
    priceLastUpdated: '2026-08-10',
    lastSoldAt: '2026-08-25'
  },
  {
    id: 'srv-cat-4',
    category: 'peluqueria',
    name: 'Corte Higiénico y Deslanado',
    description: 'Corte de pelo según raza y cepillado profundo de subpelo',
    quantity: 1,
    isActive: true,
    price: 24000,
    priceLastUpdated: '2026-08-10',
    lastSoldAt: '2026-08-26'
  }
];

export const initialExpenses: ExpenseRecord[] = [];

