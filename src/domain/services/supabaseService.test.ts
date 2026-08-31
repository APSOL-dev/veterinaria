import { describe, it, expect } from 'vitest';
import { 
  mapRowToPatient, 
  mapRowToClinicalNote, 
  mapRowToProduct, 
  mapRowToSupplierBill, 
  mapRowToExpenseRecord,
  mapRowToMedicalAppointment,
  mapRowToGroomingAppointment,
  mapRowToSupplierPayment,
  mapRowToVaccineCatalogItem,
  mapRowToServiceCatalogItem
} from './supabaseService';

describe('supabaseService row mappers', () => {
  it('should map DB row to Patient domain model', () => {
    const rawRow = {
      id: 'pat-100',
      ownerId: 'own-200',
      owner_name: 'Carlos Gómez',
      name: 'Firulais',
      species: 'Canino',
      breed: 'Labrador',
      sex: 'Macho',
      birthDate: '2020-05-15',
      status: 'active',
      weightKg: 25.5,
      alerts: ['Alergia a penicilina']
    };

    const patient = mapRowToPatient(rawRow);

    expect(patient.id).toBe('pat-100');
    expect(patient.name).toBe('Firulais');
    expect(patient.species).toBe('Canino');
    expect(patient.weightKg).toBe(25.5);
    expect(patient.alerts).toContain('Alergia a penicilina');
  });

  it('should map DB row to ClinicalNote domain model', () => {
    const rawRow = {
      id: 'cn-1',
      patientId: 'pat-100',
      date: '2026-08-01T10:00:00Z',
      vetName: 'Dr. Pérez',
      notes: 'Consulta de rutina',
      prescription: 'Amoxicilina 500mg',
      attachments: ['receta.pdf'],
      attachment_urls: ['https://storage.supabase.co/consultas/receta.pdf'],
      prescription_url: 'https://storage.supabase.co/recetas/receta.pdf'
    };

    const note = mapRowToClinicalNote(rawRow);

    expect(note.id).toBe('cn-1');
    expect(note.patientId).toBe('pat-100');
    expect(note.vetName).toBe('Dr. Pérez');
    expect(note.prescription).toBe('Amoxicilina 500mg');
    expect(note.attachmentUrls).toContain('https://storage.supabase.co/consultas/receta.pdf');
    expect(note.prescriptionUrl).toBe('https://storage.supabase.co/recetas/receta.pdf');
  });

  it('should map DB row to Product domain model', () => {
    const rawRow = {
      id: 'prod-1',
      sku: 'SKU-001',
      name: 'Antiparasitario',
      category: 'Medicamentos',
      currentStock: 15,
      minStock: 5,
      price: 1500,
      barcode: '7791234567890'
    };

    const product = mapRowToProduct(rawRow);

    expect(product.id).toBe('prod-1');
    expect(product.sku).toBe('SKU-001');
    expect(product.price).toBe(1500);
    expect(product.currentStock).toBe(15);
  });

  it('should map DB row to SupplierBill domain model', () => {
    const rawRow = {
      id: 'bill-1',
      supplierName: 'Distribuidora Pet',
      cuit: '30-12345678-9',
      invoiceNumber: 'FC-A-0001-00001234',
      date: '2026-08-10',
      amount: 45000,
      itemsCount: 3,
      status: 'pending',
      voucherName: 'factura_001.pdf',
      voucherUrl: 'https://cjqziapqtyjsxqxumgbx.supabase.co/storage/v1/object/public/veterinaria-archivos/factura_001.pdf'
    };

    const bill = mapRowToSupplierBill(rawRow);

    expect(bill.id).toBe('bill-1');
    expect(bill.supplierName).toBe('Distribuidora Pet');
    expect(bill.amount).toBe(45000);
    expect(bill.status).toBe('pending');
    expect(bill.voucherName).toBe('factura_001.pdf');
    expect(bill.voucherUrl).toBe('https://cjqziapqtyjsxqxumgbx.supabase.co/storage/v1/object/public/veterinaria-archivos/factura_001.pdf');
  });

  it('should map DB row to ExpenseRecord domain model', () => {
    const rawRow = {
      id: 'exp-1',
      date: '2026-08-15',
      category: 'Servicios',
      description: 'Luz y Agua',
      amount: 12000,
      month_key: '2026-08',
      status: 'paid'
    };

    const expense = mapRowToExpenseRecord(rawRow);

    expect(expense.id).toBe('exp-1');
    expect(expense.category).toBe('Servicios');
    expect(expense.amount).toBe(12000);
  });

  it('should map DB row to MedicalAppointment domain model', () => {
    const rawRow = {
      id: 'appt-1',
      patientId: 'pat-100',
      date: '2026-08-20',
      time: '11:00',
      vetName: 'Dra. Silva',
      reason: 'Vacunación',
      status: 'confirmed'
    };

    const appt = mapRowToMedicalAppointment(rawRow);

    expect(appt.id).toBe('appt-1');
    expect(appt.patientId).toBe('pat-100');
    expect(appt.vetName).toBe('Dra. Silva');
    expect(appt.status).toBe('confirmed');
  });

  it('should map DB row to GroomingAppointment domain model', () => {
    const rawRow = {
      id: 'groom-1',
      patientId: 'pat-100',
      serviceName: 'Baño y Corte',
      date: '2026-08-21',
      time: '14:30',
      durationMinutes: 60,
      price: 3500,
      status: 'pending'
    };

    const groom = mapRowToGroomingAppointment(rawRow);

    expect(groom.id).toBe('groom-1');
    expect(groom.serviceName).toBe('Baño y Corte');
    expect(groom.price).toBe(3500);
  });

  it('should map DB row to SupplierPayment domain model', () => {
    const rawRow = {
      id: 'pay-100',
      billId: 'bill-50',
      billInvoiceNumber: '0002-00001500',
      supplierName: 'Laboratorios Zoonosis SRL',
      date: '2026-08-31',
      amount: 1210000,
      paymentMethod: 'Efectivo',
      note: 'Pago a cuenta',
      voucherName: 'comprobante_001.pdf',
      voucherUrl: 'https://cjqziapqtyjsxqxumgbx.supabase.co/storage/v1/object/public/comprobantes/comprobante_001.pdf'
    };

    const payment = mapRowToSupplierPayment(rawRow);

    expect(payment.id).toBe('pay-100');
    expect(payment.billId).toBe('bill-50');
    expect(payment.billInvoiceNumber).toBe('0002-00001500');
    expect(payment.supplierName).toBe('Laboratorios Zoonosis SRL');
    expect(payment.amount).toBe(1210000);
    expect(payment.paymentMethod).toBe('Efectivo');
    expect(payment.voucherName).toBe('comprobante_001.pdf');
    expect(payment.voucherUrl).toBe('https://cjqziapqtyjsxqxumgbx.supabase.co/storage/v1/object/public/comprobantes/comprobante_001.pdf');
  });

  it('should map DB row to VaccineCatalogItem domain model', () => {
    const rawRow = {
      id: 'vac-1',
      name: 'Antirrábica',
      frequency_days: 365
    };

    const vac = mapRowToVaccineCatalogItem(rawRow);

    expect(vac.id).toBe('vac-1');
    expect(vac.name).toBe('Antirrábica');
    expect(vac.frequencyDays).toBe(365);
  });

  it('should map DB row to ServiceCatalogItem domain model', () => {
    const rawRow = {
      id: 'srv-1',
      category: 'clinica',
      name: 'Consulta General',
      description: 'Atención clínica de rutina',
      quantity: 1,
      is_active: true,
      price: 15000,
      price_last_updated: '2026-08-31'
    };

    const srv = mapRowToServiceCatalogItem(rawRow);

    expect(srv.id).toBe('srv-1');
    expect(srv.name).toBe('Consulta General');
    expect(srv.price).toBe(15000);
    expect(srv.isActive).toBe(true);
  });
});
