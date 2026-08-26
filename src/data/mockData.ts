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
  ServiceCatalogItem 
} from '../domain/types';

export const initialOwners: Owner[] = [
  {
    id: 'owner-1',
    name: 'Carlos Mendoza',
    phone: '+54 9 11 2345-6789',
    email: 'carlos.mendoza@email.com',
    address: 'Av. Libertador 1420'
  },
  {
    id: 'owner-2',
    name: 'Laura Vargas',
    phone: '+54 9 11 8765-4321',
    email: 'laura.vargas@email.com',
    address: 'Calle San Martín 850'
  },
  {
    id: 'owner-3',
    name: 'Miguel Torres',
    phone: '+54 9 11 5555-4444',
    email: 'miguel.torres@email.com',
    address: 'Belgrano 320'
  }
];

export const initialPatients: Patient[] = [
  {
    id: 'patient-1',
    ownerId: 'owner-1',
    ownerName: 'Carlos Mendoza',
    ownerPhone: '+54 9 11 2345-6789',
    name: 'Rocky',
    species: 'Canino',
    breed: 'Golden Retriever',
    sex: 'Macho',
    birthDate: '2018-03-12',
    photoUrl: undefined,
    status: 'active',
    weightKg: 32.4,
    alerts: ['Alérgico a Penicilina', 'Diabético', 'Esterilizado'],
    weightHistory: [
      { date: 'Ene', weightKg: 31.0 },
      { date: 'Mar', weightKg: 31.8 },
      { date: 'May', weightKg: 32.0 },
      { date: 'Jul', weightKg: 32.2 },
      { date: 'Ago', weightKg: 32.4 }
    ]
  },
  {
    id: 'patient-2',
    ownerId: 'owner-2',
    ownerName: 'Laura Vargas',
    ownerPhone: '+54 9 11 8765-4321',
    name: 'Muna',
    species: 'Felino',
    breed: 'Gato Siamés',
    sex: 'Hembra',
    birthDate: '2021-06-15',
    photoUrl: undefined,
    status: 'active',
    weightKg: 4.1,
    alerts: ['Esterilizado', 'Dieta Prescrita Renal'],
    weightHistory: [
      { date: 'Feb', weightKg: 3.9 },
      { date: 'Abr', weightKg: 4.0 },
      { date: 'Ago', weightKg: 4.1 }
    ]
  },
  {
    id: 'patient-3',
    ownerId: 'owner-3',
    ownerName: 'Miguel Torres',
    ownerPhone: '+54 9 11 5555-4444',
    name: 'Buster',
    species: 'Canino',
    breed: 'Bulldog Francés',
    sex: 'Macho',
    birthDate: '2022-01-20',
    status: 'active',
    weightKg: 12.8,
    alerts: ['Sensibilidad Cutánea'],
    weightHistory: [
      { date: 'Mar', weightKg: 12.0 },
      { date: 'Jun', weightKg: 12.5 },
      { date: 'Ago', weightKg: 12.8 }
    ]
  }
];

export const initialClinicalNotes: ClinicalNote[] = [
  {
    id: 'note-1',
    patientId: 'patient-1',
    date: '2024-05-15T10:30:00Z',
    vetName: 'Dra. Ana López',
    notes: 'Paciente acude para refuerzo de vacuna séxtuple y antirrábica. Presenta buen estado general, mucosas rosadas, ganglios normales. Se recomienda continuar con dieta actual y profilaxis dental en 6 meses.',
    prescription: 'Continuar profilaxis antiparasitaria mensual.'
  },
  {
    id: 'note-2',
    patientId: 'patient-1',
    date: '2024-01-02T16:15:00Z',
    vetName: 'Dr. Marcos Silva',
    notes: 'Propietario reporta rascado excesivo y lamido de patas delanteras. A la inspección se observa eritema en zona interdigital. Diagnóstico presuntivo: Dermatitis atópica. Se indica tratamiento con oclacitinib y champú medicado.',
    prescription: 'Oclacitinib 16mg cada 12hs por 7 días. Champú con clorhexidina 2 veces por semana.'
  }
];

export const initialVaccineCatalog: VaccineCatalogItem[] = [
  { id: 'cat-vac-1', name: 'Séxtuple Canina', frequencyDays: 365 },
  { id: 'cat-vac-2', name: 'Antirrábica', frequencyDays: 365 },
  { id: 'cat-vac-3', name: 'Tos de las perreras (Bordetella)', frequencyDays: 365 },
  { id: 'cat-vac-4', name: 'Triple Felina', frequencyDays: 365 },
  { id: 'cat-vac-5', name: 'Leucemia Felina', frequencyDays: 365 }
];

export const initialVaccineDoses: VaccineDosis[] = [
  {
    id: 'dose-1',
    patientId: 'patient-1',
    vaccineId: 'cat-vac-1',
    vaccineName: 'Séxtuple Canina',
    applicationDate: '2024-03-15',
    expirationDate: '2025-03-15',
    vetName: 'Dr. J. Silva',
    batch: 'LOT-SEX-99',
    status: 'ok'
  },
  {
    id: 'dose-2',
    patientId: 'patient-1',
    vaccineId: 'cat-vac-2',
    vaccineName: 'Antirrábica',
    applicationDate: '2023-05-22',
    expirationDate: '2024-05-22',
    vetName: 'Dra. A. López',
    batch: 'LOT-ANT-12',
    status: 'expired'
  },
  {
    id: 'dose-3',
    patientId: 'patient-1',
    vaccineId: 'cat-vac-3',
    vaccineName: 'Tos de las perreras',
    applicationDate: '2023-06-10',
    expirationDate: '2024-06-10',
    vetName: 'Dr. J. Silva',
    batch: 'LOT-BORD-44',
    status: 'due_soon'
  }
];

export const initialMedicalAppointments: MedicalAppointment[] = [
  {
    id: 'med-app-1',
    patientId: 'patient-1',
    patientName: 'Rocky',
    species: 'Canino',
    breed: 'Golden Retriever',
    ownerName: 'Carlos Mendoza',
    vetName: 'Dra. Ana López',
    date: '2026-08-26',
    time: '10:00',
    reason: 'Consulta General & Vacuna Anual',
    status: 'in_progress'
  },
  {
    id: 'med-app-2',
    patientId: 'patient-2',
    patientName: 'Muna',
    species: 'Felino',
    breed: 'Gato Siamés',
    ownerName: 'Laura Vargas',
    vetName: 'Dr. Marcos Silva',
    date: '2026-08-26',
    time: '11:00',
    reason: 'Revisión Oídos',
    status: 'pending'
  }
];

export const initialGroomingServices: GroomingService[] = [
  { id: 'groom-srv-1', name: 'Baño — perro chico', durationMinutes: 45, price: 12000 },
  { id: 'groom-srv-2', name: 'Baño — perro mediano/grande', durationMinutes: 60, price: 16000 },
  { id: 'groom-srv-3', name: 'Baño y Corte — perro chico', durationMinutes: 60, price: 18000 },
  { id: 'groom-srv-4', name: 'Baño y Corte — perro grande', durationMinutes: 120, price: 25000 },
  { id: 'groom-srv-5', name: 'Baño y Deslanado — gato', durationMinutes: 60, price: 20000 }
];

export const initialGroomingAppointments: GroomingAppointment[] = [
  {
    id: 'groom-app-1',
    patientId: 'patient-1',
    patientName: 'Bella',
    species: 'Canino',
    breed: 'Caniche',
    ownerName: 'Sofía M.',
    serviceId: 'groom-srv-3',
    serviceName: 'Baño y Corte',
    date: '2026-08-26',
    time: '09:00',
    durationMinutes: 60,
    price: 18000,
    status: 'confirmed'
  }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'VET-MED-001',
    name: 'Bravecto Perros 10-20kg',
    category: 'Medicamentos',
    currentStock: 45,
    minStock: 10,
    price: 32500,
    barcode: '7791234567890'
  },
  {
    id: 'prod-2',
    sku: 'VET-ALM-042',
    name: 'Royal Canin Gastrointestinal 2kg',
    category: 'Alimentación',
    currentStock: 4,
    minStock: 5,
    price: 24990,
    barcode: '7790000111222'
  },
  {
    id: 'prod-3',
    sku: 'VET-MED-089',
    name: 'Meloxicam Inyectable 50ml',
    category: 'Insumos Clínicos',
    currentStock: 0,
    minStock: 2,
    price: 18200,
    barcode: '7798888777666'
  },
  {
    id: 'prod-4',
    sku: 'VET-ACC-112',
    name: 'Correa Retráctil 5m Flexi',
    category: 'Accesorios',
    currentStock: 12,
    minStock: 3,
    price: 15000,
    barcode: '7795555444333'
  },
  {
    id: 'prod-5',
    sku: 'VET-MED-002',
    name: 'Antibiótico Amoxicilina 500mg (Blister x 10)',
    category: 'Medicamentos',
    currentStock: 30,
    minStock: 5,
    price: 8500,
    barcode: '7793333222111'
  }
];

export const initialReceipts: BillReceipt[] = [];

export const initialSupplierBills: SupplierBill[] = [
  {
    id: 'sbill-1',
    supplierName: 'Distribuidora FarmaVet SA',
    invoiceNumber: 'FC-A-0001-0004521',
    date: '2026-08-20',
    amount: 245000,
    itemsCount: 18,
    status: 'paid'
  },
  {
    id: 'sbill-2',
    supplierName: 'Laboratorios Zoonosis SRL',
    invoiceNumber: 'FC-A-0003-0001289',
    date: '2026-08-24',
    amount: 180000,
    itemsCount: 12,
    status: 'pending'
  }
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
