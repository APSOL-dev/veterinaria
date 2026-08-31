export type PatientStatus = 'active' | 'deceased' | 'transferred';
export type Species = 'Canino' | 'Felino' | 'Ave' | 'Roedor' | 'Reptil' | 'Otro';
export type Sex = 'Macho' | 'Hembra' | 'Indeterminado';

export interface Owner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface WeightRecord {
  date: string;
  weightKg: number;
}

export interface Patient {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhone?: string;
  name: string;
  species: Species;
  breed: string;
  sex: Sex;
  birthDate: string; // YYYY-MM-DD
  photoUrl?: string;
  status: PatientStatus;
  weightKg?: number;
  alerts?: string[];
  weightHistory?: WeightRecord[];
}

export interface ClinicalNote {
  id: string;
  patientId: string;
  date: string; // ISO string
  vetName: string;
  notes: string;
  attachments?: string[];
  prescription?: string;
}

export interface VaccineCatalogItem {
  id: string;
  name: string;
  frequencyDays: number;
}

export interface VaccineDosis {
  id: string;
  patientId: string;
  vaccineId: string;
  vaccineName: string;
  applicationDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  vetName: string;
  batch?: string;
  status: 'ok' | 'due_soon' | 'expired';
}

export type MedicalAppointmentStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface MedicalAppointment {
  id: string;
  patientId: string;
  patientName: string;
  species: Species;
  breed: string;
  ownerName: string;
  vetName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: MedicalAppointmentStatus;
  notes?: string;
}

export interface GroomingService {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
}

export type GroomingAppointmentStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled';

export interface GroomingAppointment {
  id: string;
  patientId: string;
  patientName: string;
  species: Species;
  breed: string;
  ownerName: string;
  serviceId: string;
  serviceName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  durationMinutes: number;
  price: number;
  status: GroomingAppointmentStatus;
  notes?: string;
}

export type ProductCategory = 
  | 'Medicamentos' 
  | 'Alimentación' 
  | 'Accesorios' 
  | 'Insumos Clínicos';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  currentStock: number;
  minStock: number;
  price: number;
  barcode?: string;
}

export interface ServiceCatalogItem {
  id: string;
  category: 'peluqueria' | 'clinica';
  name: string;
  description: string;
  quantity: number;
  isActive: boolean;
  price: number;
  priceLastUpdated: string; // YYYY-MM-DD
  lastSoldAt?: string; // YYYY-MM-DD
}

export interface SupplierBill {
  id: string;
  supplierName: string;
  cuit?: string;
  razonSocial?: string;
  lineaNegocio?: 'Línea 1' | 'Línea 2';
  documentType?: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD
  subtotal?: number;
  taxAmount?: number;
  perceptions?: number;
  currency?: string;
  amount: number;
  itemsCount: number;
  status: 'paid' | 'pending';
  voucherName?: string;
  voucherUrl?: string;
}

export interface SupplierQuote {
  id: string;
  supplierName: string;
  title: string;
  date: string; // YYYY-MM-DD
  amount: number;
  status: 'draft' | 'approved' | 'rejected';
}

export interface MonthlyExpenditureProjection {
  monthKey: string; // YYYY-MM
  dateLabel: string; // e.g. "mayo_2025"
  totalAdeudado: number;
  totalPagado: number;
  total: number;
  presupuestoTotal: number;
  cumplimientoPercentage: number;
  statusLevel: 'ok' | 'warning' | 'exceeded';
}

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  responsible: string;
  category: string; // Rubro
  allocation: string; // Asignación
  paymentMethod: string;
  description: string;
  amount: number;
  note?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: 'entry' | 'sale' | 'adjustment';
  quantity: number;
  date: string; // ISO string
  reason?: string;
  reasonNote?: string;
  provider?: string;
}

export type DocumentType = 'factura-a' | 'factura-b' | 'factura-c' | 'remito';
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia';

export interface BillItem {
  id: string;
  type?: 'product' | 'service';
  referenceId?: string;
  description: string;
  category?: string;
  categoryDetails?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  subtotal?: number;
}

export type SupplierPaymentMethod = 'Efectivo' | 'Transferencia' | 'Cheque' | 'Tarjeta' | 'Otro';

export interface SupplierPayment {
  id: string;
  billId: string;
  billInvoiceNumber: string;
  supplierName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMethod: SupplierPaymentMethod;
  note?: string;
  voucherName?: string;
  voucherUrl?: string;
}

export interface BillReceipt {
  id: string;
  receiptNumber: string; // e.g. FC-B-0001-00004521
  documentType: DocumentType;
  emitAfip: boolean;
  afipCae?: string;
  afipCaeExpiration?: string;
  date: string; // ISO string
  patientId?: string;
  patientName?: string;
  ownerName?: string;
  paymentMethod: PaymentMethod;
  items: BillItem[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number;
  total: number;
  totalAmount: number;
}
