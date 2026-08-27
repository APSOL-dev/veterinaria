# Esquema de 15 Tablas y 15 Vistas SQL (Schema: `vetsoft`)

## 1. Script de 15 Vistas Dedicadas (1 a 1 para cada tabla)

```sql
-- 1. VISTA TUTORES / PROPIETARIOS
CREATE OR REPLACE VIEW vetsoft.vw_owners AS
SELECT 
    id, 
    name, 
    phone, 
    email, 
    address, 
    created_at AS "createdAt"
FROM vetsoft.owners;

-- 2. VISTA PACIENTES
CREATE OR REPLACE VIEW vetsoft.vw_patients AS
SELECT 
    id, 
    owner_id AS "ownerId", 
    name, 
    species, 
    breed, 
    sex, 
    TO_CHAR(birth_date, 'YYYY-MM-DD') AS "birthDate", 
    photo_url AS "photoUrl", 
    status, 
    weight_kg AS "weightKg", 
    alerts, 
    created_at AS "createdAt"
FROM vetsoft.patients;

-- 3. VISTA HISTORIAL DE PESO
CREATE OR REPLACE VIEW vetsoft.vw_patient_weight_history AS
SELECT 
    id, 
    patient_id AS "patientId", 
    date_label AS "dateLabel", 
    weight_kg AS "weightKg", 
    created_at AS "createdAt"
FROM vetsoft.patient_weight_history;

-- 4. VISTA FICHAS MÉDICAS / CONSULTAS
CREATE OR REPLACE VIEW vetsoft.vw_clinical_notes AS
SELECT 
    id, 
    patient_id AS "patientId", 
    date, 
    vet_name AS "vetName", 
    notes, 
    prescription, 
    attachments, 
    created_at AS "createdAt"
FROM vetsoft.clinical_notes;

-- 5. VISTA CATÁLOGO DE VACUNAS
CREATE OR REPLACE VIEW vetsoft.vw_vaccine_catalog AS
SELECT 
    id, 
    name, 
    frequency_days AS "frequencyDays", 
    created_at AS "createdAt"
FROM vetsoft.vaccine_catalog;

-- 6. VISTA DOSIS DE VACUNAS APLICADAS
CREATE OR REPLACE VIEW vetsoft.vw_vaccine_doses AS
SELECT 
    id, 
    patient_id AS "patientId", 
    vaccine_id AS "vaccineId", 
    vaccine_name AS "vaccineName", 
    TO_CHAR(application_date, 'YYYY-MM-DD') AS "applicationDate", 
    TO_CHAR(expiration_date, 'YYYY-MM-DD') AS "expirationDate", 
    vet_name AS "vetName", 
    batch, 
    status, 
    created_at AS "createdAt"
FROM vetsoft.vaccine_doses;

-- 7. VISTA AGENDA MÉDICA
CREATE OR REPLACE VIEW vetsoft.vw_medical_appointments AS
SELECT 
    id, 
    patient_id AS "patientId", 
    TO_CHAR(date, 'YYYY-MM-DD') AS date, 
    time, 
    vet_name AS "vetName", 
    reason, 
    status, 
    created_at AS "createdAt"
FROM vetsoft.medical_appointments;

-- 8. VISTA AGENDA PELUQUERÍA
CREATE OR REPLACE VIEW vetsoft.vw_grooming_appointments AS
SELECT 
    id, 
    patient_id AS "patientId", 
    service_name AS "serviceName", 
    TO_CHAR(date, 'YYYY-MM-DD') AS date, 
    time, 
    duration_minutes AS "durationMinutes", 
    price, 
    status, 
    notes, 
    created_at AS "createdAt"
FROM vetsoft.grooming_appointments;

-- 9. VISTA PRODUCTOS INVENTARIO
CREATE OR REPLACE VIEW vetsoft.vw_products AS
SELECT 
    id, 
    sku, 
    name, 
    category, 
    current_stock AS "currentStock", 
    min_stock AS "minStock", 
    price, 
    barcode, 
    created_at AS "createdAt"
FROM vetsoft.products;

-- 10. VISTA CATÁLOGO DE SERVICIOS
CREATE OR REPLACE VIEW vetsoft.vw_services_catalog AS
SELECT 
    id, 
    category, 
    name, 
    description, 
    quantity, 
    is_active AS "isActive", 
    price, 
    TO_CHAR(price_last_updated, 'YYYY-MM-DD') AS "priceLastUpdated", 
    TO_CHAR(last_sold_at, 'YYYY-MM-DD') AS "lastSoldAt", 
    created_at AS "createdAt"
FROM vetsoft.services_catalog;

-- 11. VISTA RECIBOS / COBROS
CREATE OR REPLACE VIEW vetsoft.vw_receipts AS
SELECT 
    id, 
    patient_id AS "patientId", 
    date, 
    document_type AS "documentType", 
    invoice_number AS "invoiceNumber", 
    subtotal, 
    tax_amount AS "taxAmount", 
    perceptions, 
    currency, 
    total_amount AS "totalAmount", 
    payment_method AS "paymentMethod", 
    notes, 
    created_at AS "createdAt"
FROM vetsoft.receipts;

-- 12. VISTA DETALLE DE RECIBOS
CREATE OR REPLACE VIEW vetsoft.vw_receipt_items AS
SELECT 
    id, 
    receipt_id AS "receiptId", 
    product_id AS "productId", 
    service_id AS "serviceId", 
    description, 
    quantity, 
    unit_price AS "unitPrice", 
    subtotal
FROM vetsoft.receipt_items;

-- 13. VISTA FACTURAS DE PROVEEDORES
CREATE OR REPLACE VIEW vetsoft.vw_supplier_bills AS
SELECT 
    id, 
    supplier_name AS "supplierName", 
    cuit, 
    razon_social AS "razonSocial", 
    linea_negocio AS "lineaNegocio", 
    document_type AS "documentType", 
    invoice_number AS "invoiceNumber", 
    TO_CHAR(date, 'YYYY-MM-DD') AS date, 
    TO_CHAR(payment_date, 'YYYY-MM-DD') AS "paymentDate", 
    subtotal, 
    tax_amount AS "taxAmount", 
    perceptions, 
    currency, 
    amount, 
    items_count AS "itemsCount", 
    status, 
    created_at AS "createdAt"
FROM vetsoft.supplier_bills;

-- 14. VISTA PRESUPUESTOS DE PROVEEDORES
CREATE OR REPLACE VIEW vetsoft.vw_supplier_quotes AS
SELECT 
    id, 
    supplier_name AS "supplierName", 
    title, 
    TO_CHAR(date, 'YYYY-MM-DD') AS date, 
    amount, 
    status, 
    created_at AS "createdAt"
FROM vetsoft.supplier_quotes;

-- 15. VISTA GASTOS OPERATIVOS
CREATE OR REPLACE VIEW vetsoft.vw_expenses AS
SELECT 
    id, 
    category, 
    description, 
    amount, 
    TO_CHAR(date, 'YYYY-MM-DD') AS date, 
    month_key AS "monthKey", 
    status, 
    created_at AS "createdAt"
FROM vetsoft.expenses;
```
