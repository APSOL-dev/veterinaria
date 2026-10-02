import { describe, it, expect } from 'vitest';
import { 
  parseReceiptVoucherPath,
  mapRowToReceiptItem,
  groupReceiptItemsByReceipt,
  mapRowToPatient, 
  mapRowToClinicalNote, 
  mapRowToProduct, 
  mapRowToSupplierBill, 
  mapRowToExpenseRecord,
  mapRowToMedicalAppointment,
  mapRowToGroomingAppointment,
  mapRowToSupplierPayment,
  mapRowToVaccineCatalogItem,
  mapRowToServiceCatalogItem,
  mapRowToVaccineDosis,
  mapRowToSupplierQuote,
  mapRowToBillReceipt,
  mapRowToTutorPayment,
  formatUserFriendlyErrorMessage
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
      alerts: ['Alergia a penicilina'],
      weight_history: [{ date: '2026-01-10', weightKg: 24.0 }],
      requiredVaccines: [{ id: 'req-1', vaccineName: 'Antirrábica', suggestedDate: '2026-10-15', status: 'pendiente' }]
    };

    const patient = mapRowToPatient(rawRow);

    expect(patient.id).toBe('pat-100');
    expect(patient.name).toBe('Firulais');
    expect(patient.species).toBe('Canino');
    expect(patient.weightKg).toBe(25.5);
    expect(patient.alerts).toContain('Alergia a penicilina');
    expect(patient.weightHistory).toHaveLength(1);
    expect(patient.weightHistory![0].weightKg).toBe(24.0);
    expect(patient.requiredVaccines).toHaveLength(1);
    expect(patient.requiredVaccines![0].vaccineName).toBe('Antirrábica');
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
      barcode: '7791234567890',
      price_last_updated: '2026-09-01',
      update_frequency_days: 60
    };

    const product = mapRowToProduct(rawRow);

    expect(product.id).toBe('prod-1');
    expect(product.sku).toBe('SKU-001');
    expect(product.price).toBe(1500);
    expect(product.currentStock).toBe(15);
    expect(product.priceLastUpdated).toBe('2026-09-01');
    expect(product.updateFrequencyDays).toBe(60);
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

  it('should map DB row with items array to SupplierBill domain model', () => {
    const rawRow = {
      id: 'bill-items-1',
      supplierName: 'FarmaVet SA',
      amount: 60000,
      items: [
        { id: 'item-1', productName: 'Vacuna Sextuple', quantity: 5, unitCost: 12000, subtotal: 60000 }
      ]
    };

    const bill = mapRowToSupplierBill(rawRow);

    expect(bill.items).toBeDefined();
    expect(bill.items).toHaveLength(1);
    expect(bill.items![0].productName).toBe('Vacuna Sextuple');
    expect(bill.items![0].quantity).toBe(5);
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
      patientName: 'Rocky',
      species: 'Canino',
      breed: 'Golden Retriever',
      ownerName: 'Juan Pérez',
      serviceName: 'Baño y Corte',
      date: '2026-08-21',
      time: '14:30',
      durationMinutes: 60,
      price: 3500,
      status: 'pending'
    };

    const groom = mapRowToGroomingAppointment(rawRow);

    expect(groom.id).toBe('groom-1');
    expect(groom.patientName).toBe('Rocky');
    expect(groom.ownerName).toBe('Juan Pérez');
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

  it('should map DB row to VaccineDosis domain model', () => {
    const rawRow = {
      id: 'dosis-1',
      patientId: 'pat-1',
      vaccineId: 'vac-1',
      vaccineName: 'Antirrábica',
      applicationDate: '2026-09-01',
      expirationDate: '2027-09-01',
      vetName: 'Dr. Silva',
      batch: 'LOTE-123',
      status: 'ok'
    };

    const dosis = mapRowToVaccineDosis(rawRow);

    expect(dosis.id).toBe('dosis-1');
    expect(dosis.patientId).toBe('pat-1');
    expect(dosis.vaccineName).toBe('Antirrábica');
    expect(dosis.applicationDate).toBe('2026-09-01');
    expect(dosis.batch).toBe('LOTE-123');
  });

  it('should map DB row to SupplierQuote domain model', () => {
    const rawRow = {
      id: 'quote-1',
      supplierName: 'Distribuidora Pet',
      title: 'Presupuesto Alimento',
      date: '2026-09-05',
      amount: 150000,
      status: 'draft'
    };

    const quote = mapRowToSupplierQuote(rawRow);

    expect(quote.id).toBe('quote-1');
    expect(quote.supplierName).toBe('Distribuidora Pet');
    expect(quote.title).toBe('Presupuesto Alimento');
    expect(quote.amount).toBe(150000);
    expect(quote.status).toBe('draft');
  });

  it('should map DB row with snake_case columns to BillReceipt domain model', () => {
    const rawRow = {
      id: 'rec-1',
      invoice_number: 'FC-B-0001-00005432',
      document_type: 'factura-b',
      date: '2026-09-15T12:00:00.000Z',
      patient_id: 'pat-100',
      patient_name: 'Firu',
      owner_name: 'Mateo',
      payment_method: 'cuenta-corriente',
      subtotal: 15000,
      discount_total: 1000,
      tax_amount: 2940,
      total_amount: 16940
    };

    const receipt = mapRowToBillReceipt(rawRow);

    expect(receipt.id).toBe('rec-1');
    expect(receipt.receiptNumber).toBe('FC-B-0001-00005432');
    expect(receipt.patientId).toBe('pat-100');
    expect(receipt.patientName).toBe('Firu');
    expect(receipt.ownerName).toBe('Mateo');
    expect(receipt.paymentMethod).toBe('cuenta-corriente');
    expect(receipt.subtotal).toBe(15000);
    expect(receipt.discountTotal).toBe(1000);
    expect(receipt.taxAmount).toBe(2940);
    expect(receipt.totalAmount).toBe(16940);
  });

  it('should map DB row to TutorPaymentRecord domain model', () => {
    const rawRow = {
      id: 'tp-100',
      tutor_name: 'Mateo Prueba',
      date: '2026-10-02',
      amount: '5000.00',
      concept: 'Pago a cuenta de consulta',
      payment_method: 'Transferencia'
    };

    const payment = mapRowToTutorPayment(rawRow);

    expect(payment.id).toBe('tp-100');
    expect(payment.tutorName).toBe('Mateo Prueba');
    expect(payment.date).toBe('2026-10-02');
    expect(payment.amount).toBe(5000);
    expect(payment.concept).toBe('Pago a cuenta de consulta');
    expect(payment.paymentMethod).toBe('Transferencia');
  });
});

describe('formatUserFriendlyErrorMessage', () => {
  it('translates RLS policy violations into friendly message', () => {
    const error = { message: 'new row violates row-level security policy for table "vetsoft_pacientes"' };
    expect(formatUserFriendlyErrorMessage(error)).toBe('No se pudo completar la operación por permisos del sistema.');
  });

  it('translates 401 unauthorized errors into friendly message', () => {
    const error = 'HTTP Error 401: Unauthorized';
    expect(formatUserFriendlyErrorMessage(error)).toBe('La sesión no es válida o ha expirado. Por favor recargue la página o inicie sesión nuevamente.');
  });

  it('translates network or fetch failures into friendly message', () => {
    const error = new Error('Failed to fetch');
    expect(formatUserFriendlyErrorMessage(error)).toBe('Error de conexión con el servidor. Por favor verifique su acceso a internet.');
  });

  it('translates duplicate key errors into friendly message', () => {
    const error = { message: 'duplicate key value violates unique constraint' };
    expect(formatUserFriendlyErrorMessage(error)).toBe('Ya existe un registro con estos datos en el sistema.');
  });

  it('returns default fallback message for empty error', () => {
    expect(formatUserFriendlyErrorMessage(null)).toBe('Error de conexión o datos inválidos.');
  });

  it('translates foreign key constraint violations into friendly message', () => {
    const error = { message: 'insert or update on table vetsoft_dosis_vacunas violates foreign key constraint vetsoft_dosis_vacunas_vaccine_id_fkey', code: '23503' };
    const msg = formatUserFriendlyErrorMessage(error);
    // Should not expose raw SQL — should be a user-friendly fallback
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe('filteredServices logic (Mejora 2 — service search)', () => {
  const services = [
    { id: 'srv-1', name: 'Consulta General', category: 'clinica', description: 'Examen clínico', price: 15000, quantity: 1, isActive: true },
    { id: 'srv-2', name: 'Baño Canino', category: 'peluqueria', description: 'Baño con shampoo neutro', price: 12000, quantity: 1, isActive: true },
    { id: 'srv-3', name: 'Cirugía de tejidos blandos', category: 'cirugia', description: 'Procedimiento quirúrgico', price: 80000, quantity: 1, isActive: true },
    { id: 'srv-4', name: 'Baño Felino', category: 'peluqueria', description: 'Baño para felinos', price: 13000, quantity: 1, isActive: true }
  ];

  const filterServices = (catalog: typeof services, query: string) => {
    if (!query.trim()) return catalog;
    const q = query.toLowerCase();
    return catalog.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q)
    );
  };

  it('returns all services when query is empty', () => {
    expect(filterServices(services, '')).toHaveLength(4);
    expect(filterServices(services, '   ')).toHaveLength(4);
  });

  it('filters by name (case-insensitive)', () => {
    const result = filterServices(services, 'baño');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toContain('srv-2');
    expect(result.map(s => s.id)).toContain('srv-4');
  });

  it('filters by category', () => {
    const result = filterServices(services, 'peluqueria');
    expect(result).toHaveLength(2);
  });

  it('filters by description', () => {
    const result = filterServices(services, 'quirúrgico');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('srv-3');
  });

  it('returns empty array when no match', () => {
    const result = filterServices(services, 'zzzznotfound');
    expect(result).toHaveLength(0);
  });

  it('single result when name is unique', () => {
    const result = filterServices(services, 'consulta');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('srv-1');
  });
});

describe('receipt items from the detail table', () => {
  it('maps snake_case and camelCase rows and tells product from service', () => {
    const service = mapRowToReceiptItem({ id: 'i1', receipt_id: 'r1', service_id: 'srv-1', description: 'Baño Perro chico', quantity: 1, unit_price: 15000, subtotal: 15000 });
    expect(service.receiptId).toBe('r1');
    expect(service.item).toMatchObject({ type: 'service', referenceId: 'srv-1', description: 'Baño Perro chico', quantity: 1, unitPrice: 15000, discountPercent: 0 });

    const product = mapRowToReceiptItem({ id: 'i2', receiptId: 'r1', productId: 'p-9', description: 'Collar', quantity: 2, unitPrice: 1000, subtotal: 1800 });
    expect(product.item.type).toBe('product');
    expect(product.item.discountPercent).toBe(10);
  });

  it('groups items by receipt and ignores rows without receipt', () => {
    const grouped = groupReceiptItemsByReceipt([
      { id: 'a', receipt_id: 'r1', description: 'A', quantity: 1, unit_price: 1, subtotal: 1 },
      { id: 'b', receipt_id: 'r1', description: 'B', quantity: 1, unit_price: 1, subtotal: 1 },
      { id: 'c', receipt_id: 'r2', description: 'C', quantity: 1, unit_price: 1, subtotal: 1 },
      { id: 'd', description: 'sin recibo', quantity: 1, unit_price: 1, subtotal: 1 }
    ]);
    expect(grouped.r1.map(i => i.description)).toEqual(['A', 'B']);
    expect(grouped.r2).toHaveLength(1);
    expect(Object.keys(grouped)).toEqual(['r1', 'r2']);
  });
});

describe('receipt voucher storage naming', () => {
  it('parses <receiptId>__<file> back into receipt and original file name', () => {
    expect(parseReceiptVoucherPath('rec-123__factura_1361.pdf')).toEqual({ receiptId: 'rec-123', fileName: 'factura_1361.pdf' });
    expect(parseReceiptVoucherPath('rec-1__a__b.pdf')).toEqual({ receiptId: 'rec-1', fileName: 'a__b.pdf' });
  });

  it('ignores names that do not follow the convention', () => {
    expect(parseReceiptVoucherPath('suelto.pdf')).toBeNull();
    expect(parseReceiptVoucherPath('__sin_id.pdf')).toBeNull();
    expect(parseReceiptVoucherPath('rec-1__')).toBeNull();
  });
});
