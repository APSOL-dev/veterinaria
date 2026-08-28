import { supabase } from '../supabaseClient';
import { 
  Patient, 
  ClinicalNote, 
  VaccineCatalogItem, 
  VaccineDosis, 
  MedicalAppointment, 
  GroomingAppointment, 
  Product, 
  ServiceCatalogItem, 
  BillReceipt, 
  SupplierBill, 
  SupplierQuote, 
  ExpenseRecord 
} from '../types';

// =============================================================================
// HELPER: Format YYYY-MM-DD Date for PostgreSQL DATE Columns
// =============================================================================

function sanitizeDateString(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;
  return trimmed.length >= 10 ? trimmed.substring(0, 10) : trimmed;
}

function extractErrorMessage(error: any): string | undefined {
  if (!error) return undefined;
  if (typeof error === 'string') return error;
  return error.message || error.details || error.hint || JSON.stringify(error);
}

// =============================================================================
// MAPPERS: Transform DB View Rows to Domain Models
// =============================================================================

export function mapRowToPatient(row: any): Patient {
  return {
    id: String(row.id || ''),
    ownerId: String(row.ownerId || row.owner_id || ''),
    ownerName: String(row.ownerName || row.owner_name || 'Tutor no especificado'),
    ownerPhone: row.ownerPhone || row.owner_phone || '',
    name: String(row.name || ''),
    species: row.species || 'Canino',
    breed: String(row.breed || ''),
    sex: row.sex || 'Macho',
    birthDate: String(row.birthDate || row.birth_date || ''),
    photoUrl: row.photoUrl || row.photo_url || undefined,
    status: row.status || 'active',
    weightKg: Number(row.weightKg ?? row.weight_kg ?? 0),
    alerts: Array.isArray(row.alerts) ? row.alerts : [],
    weightHistory: Array.isArray(row.weightHistory) ? row.weightHistory : []
  };
}

export function mapRowToClinicalNote(row: any): ClinicalNote {
  return {
    id: String(row.id || ''),
    patientId: String(row.patientId || row.patient_id || ''),
    date: String(row.date || new Date().toISOString()),
    vetName: String(row.vetName || row.vet_name || ''),
    notes: String(row.notes || ''),
    prescription: row.prescription || undefined,
    attachments: Array.isArray(row.attachments) ? row.attachments : []
  };
}

export function mapRowToVaccineCatalogItem(row: any): VaccineCatalogItem {
  return {
    id: String(row.id || ''),
    name: String(row.name || ''),
    frequencyDays: Number(row.frequencyDays ?? row.frequency_days ?? 365)
  };
}

export function mapRowToVaccineDosis(row: any): VaccineDosis {
  return {
    id: String(row.id || ''),
    patientId: String(row.patientId || row.patient_id || ''),
    vaccineId: String(row.vaccineId || row.vaccine_id || ''),
    vaccineName: String(row.vaccineName || row.vaccine_name || ''),
    applicationDate: String(row.applicationDate || row.application_date || ''),
    expirationDate: String(row.expirationDate || row.expiration_date || ''),
    vetName: String(row.vetName || row.vet_name || ''),
    batch: row.batch || undefined,
    status: row.status || 'ok'
  };
}

export function mapRowToMedicalAppointment(row: any): MedicalAppointment {
  return {
    id: String(row.id || ''),
    patientId: String(row.patientId || row.patient_id || ''),
    patientName: String(row.patientName || row.patient_name || 'Paciente'),
    species: row.species || 'Canino',
    breed: String(row.breed || ''),
    ownerName: String(row.ownerName || row.owner_name || 'Tutor'),
    vetName: String(row.vetName || row.vet_name || ''),
    date: String(row.date || ''),
    time: String(row.time || ''),
    reason: String(row.reason || ''),
    status: row.status || 'pending',
    notes: row.notes || undefined
  };
}

export function mapRowToGroomingAppointment(row: any): GroomingAppointment {
  return {
    id: String(row.id || ''),
    patientId: String(row.patientId || row.patient_id || ''),
    patientName: String(row.patientName || row.patient_name || 'Paciente'),
    species: row.species || 'Canino',
    breed: String(row.breed || ''),
    ownerName: String(row.ownerName || row.owner_name || 'Tutor'),
    serviceId: String(row.serviceId || row.service_id || 'serv-1'),
    serviceName: String(row.serviceName || row.service_name || 'Peluquería'),
    date: String(row.date || ''),
    time: String(row.time || ''),
    durationMinutes: Number(row.durationMinutes ?? row.duration_minutes ?? 45),
    price: Number(row.price ?? 0),
    status: row.status || 'pending',
    notes: row.notes || undefined
  };
}

export function mapRowToProduct(row: any): Product {
  return {
    id: String(row.id || ''),
    sku: String(row.sku || ''),
    name: String(row.name || ''),
    category: row.category || 'Medicamentos',
    currentStock: Number(row.currentStock ?? row.current_stock ?? 0),
    minStock: Number(row.minStock ?? row.min_stock ?? 0),
    price: Number(row.price ?? 0),
    barcode: row.barcode || undefined
  };
}

export function mapRowToServiceCatalogItem(row: any): ServiceCatalogItem {
  return {
    id: String(row.id || ''),
    category: row.category || 'clinica',
    name: String(row.name || ''),
    description: String(row.description || ''),
    quantity: Number(row.quantity ?? 1),
    isActive: Boolean(row.isActive ?? row.is_active ?? true),
    price: Number(row.price ?? 0),
    priceLastUpdated: String(row.priceLastUpdated || row.price_last_updated || new Date().toISOString().substring(0, 10)),
    lastSoldAt: row.lastSoldAt || row.last_sold_at || undefined
  };
}

export function mapRowToBillReceipt(row: any): BillReceipt {
  return {
    id: String(row.id || ''),
    receiptNumber: String(row.invoiceNumber || row.receipt_number || row.id || ''),
    documentType: row.documentType || row.document_type || 'factura-b',
    emitAfip: Boolean(row.emitAfip ?? false),
    afipCae: row.afipCae || undefined,
    afipCaeExpiration: row.afipCaeExpiration || undefined,
    date: String(row.date || new Date().toISOString()),
    patientId: row.patientId || row.patient_id || undefined,
    patientName: row.patientName || undefined,
    ownerName: row.ownerName || undefined,
    paymentMethod: row.paymentMethod || row.payment_method || 'efectivo',
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal ?? 0),
    discountTotal: Number(row.discountTotal ?? 0),
    taxAmount: Number(row.taxAmount ?? row.tax_amount ?? 0),
    total: Number(row.total ?? row.totalAmount ?? row.total ?? 0),
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? row.total ?? 0)
  };
}

export function mapRowToSupplierBill(row: any): SupplierBill {
  return {
    id: String(row.id || ''),
    supplierName: String(row.supplierName || row.supplier_name || ''),
    cuit: row.cuit || undefined,
    razonSocial: row.razonSocial || row.razon_social || undefined,
    lineaNegocio: row.lineaNegocio || row.linea_negocio || undefined,
    documentType: row.documentType || row.document_type || undefined,
    invoiceNumber: String(row.invoiceNumber || row.invoice_number || ''),
    date: String(row.date || ''),
    paymentDate: row.paymentDate || row.payment_date || undefined,
    subtotal: Number(row.subtotal ?? 0),
    taxAmount: Number(row.taxAmount ?? row.tax_amount ?? 0),
    perceptions: Number(row.perceptions ?? 0),
    currency: row.currency || 'ARS',
    amount: Number(row.amount ?? 0),
    itemsCount: Number(row.itemsCount ?? row.items_count ?? 1),
    status: row.status || 'pending'
  };
}

export function mapRowToSupplierQuote(row: any): SupplierQuote {
  return {
    id: String(row.id || ''),
    supplierName: String(row.supplierName || row.supplier_name || ''),
    title: String(row.title || ''),
    date: String(row.date || ''),
    amount: Number(row.amount ?? 0),
    status: row.status || 'draft'
  };
}

export function mapRowToExpenseRecord(row: any): ExpenseRecord {
  return {
    id: String(row.id || ''),
    date: String(row.date || ''),
    responsible: row.responsible || 'Administración',
    category: String(row.category || 'General'),
    allocation: row.allocation || 'Operativo',
    paymentMethod: row.paymentMethod || row.payment_method || 'Efectivo',
    description: String(row.description || ''),
    amount: Number(row.amount ?? 0),
    note: row.note || undefined
  };
}

// =============================================================================
// DATABASE DATA FETCHING AND SYNC (Schema: public)
// =============================================================================

export async function fetchPatientsFromSupabase(): Promise<Patient[] | null> {
  try {
    const { data, error } = await supabase.from('vetsoft_vw_pacientes').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map(mapRowToPatient);
  } catch {
    return null;
  }
}

export async function fetchSupplierBillsFromSupabase(): Promise<SupplierBill[] | null> {
  try {
    const { data, error } = await supabase.from('vetsoft_vw_facturas_proveedores').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map(mapRowToSupplierBill);
  } catch {
    return null;
  }
}

export async function fetchExpensesFromSupabase(): Promise<ExpenseRecord[] | null> {
  try {
    const { data, error } = await supabase.from('vetsoft_vw_gastos').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map(mapRowToExpenseRecord);
  } catch {
    return null;
  }
}

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  try {
    const { data, error } = await supabase.from('vetsoft_vw_productos').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map(mapRowToProduct);
  } catch {
    return null;
  }
}

export async function fetchClinicalNotesFromSupabase(): Promise<ClinicalNote[] | null> {
  try {
    const { data, error } = await supabase.from('vetsoft_vw_consultas_clinicas').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map(mapRowToClinicalNote);
  } catch {
    return null;
  }
}

export async function fetchMedicalAppointmentsFromSupabase(): Promise<MedicalAppointment[] | null> {
  try {
    const { data, error } = await supabase.from('vetsoft_vw_turnos_clinica').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map(mapRowToMedicalAppointment);
  } catch {
    return null;
  }
}

export async function fetchGroomingAppointmentsFromSupabase(): Promise<GroomingAppointment[] | null> {
  try {
    const { data, error } = await supabase.from('vetsoft_vw_turnos_peluqueria').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map(mapRowToGroomingAppointment);
  } catch {
    return null;
  }
}

export async function fetchReceiptsFromSupabase(): Promise<BillReceipt[] | null> {
  try {
    const { data, error } = await supabase.from('vetsoft_vw_recibos').select('*');
    if (error || !data || data.length === 0) return null;
    return data.map(mapRowToBillReceipt);
  } catch {
    return null;
  }
}

// =============================================================================
// INSERTION HELPERS (Tables prefixed with vetsoft_)
// =============================================================================

export interface SyncResult {
  success: boolean;
  error?: string;
}

export async function insertPatientToSupabase(patient: Patient): Promise<SyncResult> {
  try {
    if (patient.ownerId) {
      await supabase.from('vetsoft_tutores').upsert({
        id: patient.ownerId,
        name: patient.ownerName,
        phone: patient.ownerPhone || null
      });
    }

    const { error } = await supabase.from('vetsoft_pacientes').insert({
      id: patient.id,
      owner_id: patient.ownerId || null,
      name: patient.name,
      species: patient.species,
      breed: patient.breed,
      sex: patient.sex,
      birth_date: sanitizeDateString(patient.birthDate),
      photo_url: patient.photoUrl || null,
      status: patient.status,
      weight_kg: patient.weightKg || null,
      alerts: patient.alerts || []
    });

    if (error) console.error('Supabase error inserting patient:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function insertClinicalNoteToSupabase(note: ClinicalNote): Promise<SyncResult> {
  try {
    const { error } = await supabase.from('vetsoft_consultas_clinicas').insert({
      id: note.id,
      patient_id: note.patientId,
      date: note.date,
      vet_name: note.vetName,
      notes: note.notes,
      prescription: note.prescription || null,
      attachments: note.attachments || []
    });
    if (error) console.error('Supabase error inserting clinical note:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function insertMedicalAppointmentToSupabase(appt: MedicalAppointment): Promise<SyncResult> {
  try {
    const { error } = await supabase.from('vetsoft_turnos_clinica').insert({
      id: appt.id,
      patient_id: appt.patientId,
      date: sanitizeDateString(appt.date) || new Date().toISOString().substring(0, 10),
      time: appt.time,
      vet_name: appt.vetName,
      reason: appt.reason,
      status: appt.status
    });
    if (error) console.error('Supabase error inserting medical appointment:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function insertGroomingAppointmentToSupabase(appt: GroomingAppointment): Promise<SyncResult> {
  try {
    const { error } = await supabase.from('vetsoft_turnos_peluqueria').insert({
      id: appt.id,
      patient_id: appt.patientId,
      service_name: appt.serviceName,
      date: sanitizeDateString(appt.date) || new Date().toISOString().substring(0, 10),
      time: appt.time,
      duration_minutes: appt.durationMinutes,
      price: appt.price,
      status: appt.status,
      notes: appt.notes || null
    });
    if (error) console.error('Supabase error inserting grooming appointment:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function insertProductToSupabase(prod: Product): Promise<SyncResult> {
  try {
    const { error } = await supabase.from('vetsoft_productos').insert({
      id: prod.id,
      sku: prod.sku,
      name: prod.name,
      category: prod.category,
      current_stock: prod.currentStock,
      min_stock: prod.minStock,
      price: prod.price,
      barcode: prod.barcode || null
    });
    if (error) console.error('Supabase error inserting product:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function insertSupplierBillToSupabase(bill: SupplierBill): Promise<SyncResult> {
  try {
    const cleanDate = sanitizeDateString(bill.date) || new Date().toISOString().substring(0, 10);
    const cleanPaymentDate = sanitizeDateString(bill.paymentDate);

    const { error } = await supabase.from('vetsoft_facturas_proveedores').insert({
      id: bill.id,
      supplier_name: bill.supplierName,
      cuit: bill.cuit || null,
      razon_social: bill.razonSocial || null,
      linea_negocio: bill.lineaNegocio || null,
      document_type: bill.documentType || null,
      invoice_number: bill.invoiceNumber,
      date: cleanDate,
      payment_date: cleanPaymentDate,
      subtotal: bill.subtotal || 0,
      tax_amount: bill.taxAmount || 0,
      perceptions: bill.perceptions || 0,
      currency: bill.currency || 'ARS',
      amount: bill.amount,
      items_count: bill.itemsCount,
      status: bill.status
    });
    if (error) console.error('Supabase error inserting supplier bill:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function updateSupplierBillInSupabase(id: string, bill: Partial<SupplierBill>): Promise<SyncResult> {
  try {
    const payload: any = {};
    if (bill.supplierName !== undefined) payload.supplier_name = bill.supplierName;
    if (bill.cuit !== undefined) payload.cuit = bill.cuit || null;
    if (bill.razonSocial !== undefined) payload.razon_social = bill.razonSocial || null;
    if (bill.lineaNegocio !== undefined) payload.linea_negocio = bill.lineaNegocio || null;
    if (bill.documentType !== undefined) payload.document_type = bill.documentType || null;
    if (bill.invoiceNumber !== undefined) payload.invoice_number = bill.invoiceNumber;
    if (bill.date !== undefined) payload.date = sanitizeDateString(bill.date);
    if (bill.paymentDate !== undefined) payload.payment_date = sanitizeDateString(bill.paymentDate);
    if (bill.subtotal !== undefined) payload.subtotal = bill.subtotal;
    if (bill.taxAmount !== undefined) payload.tax_amount = bill.taxAmount;
    if (bill.perceptions !== undefined) payload.perceptions = bill.perceptions;
    if (bill.currency !== undefined) payload.currency = bill.currency;
    if (bill.amount !== undefined) payload.amount = bill.amount;
    if (bill.itemsCount !== undefined) payload.items_count = bill.itemsCount;
    if (bill.status !== undefined) payload.status = bill.status;

    const { error } = await supabase.from('vetsoft_facturas_proveedores').update(payload).eq('id', id);
    if (error) console.error('Supabase error updating supplier bill:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function deleteSupplierBillFromSupabase(id: string): Promise<SyncResult> {
  try {
    const { error } = await supabase.from('vetsoft_facturas_proveedores').delete().eq('id', id);
    if (error) console.error('Supabase error deleting supplier bill:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function insertExpenseToSupabase(expense: ExpenseRecord): Promise<SyncResult> {
  try {
    const cleanDate = sanitizeDateString(expense.date) || new Date().toISOString().substring(0, 10);

    const { error } = await supabase.from('vetsoft_gastos').insert({
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: cleanDate,
      month_key: cleanDate.substring(0, 7),
      status: 'paid'
    });
    if (error) console.error('Supabase error inserting expense:', error);
    return { success: !error, error: extractErrorMessage(error) };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}

export async function insertReceiptToSupabase(receipt: BillReceipt): Promise<SyncResult> {
  try {
    const { error: headerErr } = await supabase.from('vetsoft_recibos').insert({
      id: receipt.id,
      patient_id: receipt.patientId || null,
      date: receipt.date,
      document_type: receipt.documentType,
      invoice_number: receipt.receiptNumber,
      subtotal: receipt.subtotal,
      tax_amount: receipt.taxAmount,
      currency: 'ARS',
      total_amount: receipt.totalAmount || receipt.total,
      payment_method: receipt.paymentMethod
    });

    if (headerErr) {
      console.error('Supabase error inserting receipt header:', headerErr);
      return { success: false, error: extractErrorMessage(headerErr) };
    }

    if (receipt.items && receipt.items.length > 0) {
      const itemsToInsert = receipt.items.map(item => ({
        id: item.id || ('item-' + Math.random().toString(36).substring(2, 9)),
        receipt_id: receipt.id,
        product_id: item.type === 'product' ? item.referenceId : null,
        service_id: item.type === 'service' ? item.referenceId : null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.subtotal || (item.quantity * item.unitPrice)
      }));

      const { error: itemErr } = await supabase.from('vetsoft_detalle_recibos').insert(itemsToInsert);
      if (itemErr) console.error('Supabase error inserting receipt items:', itemErr);
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de conexión' };
  }
}
