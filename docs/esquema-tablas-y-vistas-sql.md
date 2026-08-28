# Esquema Maestro Definitivo (Schema: `public`)

Este script limpia cualquier tabla o vista anterior y genera las **15 tablas físicas con prefijo `vetsoft_`** y sus **15 vistas dedicadas con prefijo `vetsoft_vw_`** en el esquema `public`.

```sql
-- =============================================================================
-- SCRIPT MAESTRO DE LIMPIEZA Y CREACIÓN DEFINITIVA PARA VETSOFT (Supabase)
-- Todas las tablas físicas llevan prefijo: vetsoft_
-- Todas las vistas llevan prefijo: vetsoft_vw_
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PASO 1: LIMPIEZA TOTAL DE TABLAS Y VISTAS ANTERIORES
-- -----------------------------------------------------------------------------
DROP SCHEMA IF EXISTS vetsoft CASCADE;

-- Limpiar vistas
DROP VIEW IF EXISTS public.vetsoft_vw_tutores CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_pacientes CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_historial_peso_pacientes CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_consultas_clinicas CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_catalogo_vacunas CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_dosis_vacunas CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_turnos_clinica CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_turnos_peluqueria CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_productos CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_catalogo_servicios CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_recibos CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_detalle_recibos CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_facturas_proveedores CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_presupuestos_proveedores CASCADE;
DROP VIEW IF EXISTS public.vetsoft_vw_gastos CASCADE;

DROP VIEW IF EXISTS public.vw_tutores CASCADE;
DROP VIEW IF EXISTS public.vw_pacientes CASCADE;
DROP VIEW IF EXISTS public.vw_historial_peso_pacientes CASCADE;
DROP VIEW IF EXISTS public.vw_consultas_clinicas CASCADE;
DROP VIEW IF EXISTS public.vw_catalogo_vacunas CASCADE;
DROP VIEW IF EXISTS public.vw_dosis_vacunas CASCADE;
DROP VIEW IF EXISTS public.vw_turnos_clinica CASCADE;
DROP VIEW IF EXISTS public.vw_turnos_peluqueria CASCADE;
DROP VIEW IF EXISTS public.vw_productos CASCADE;
DROP VIEW IF EXISTS public.vw_catalogo_servicios CASCADE;
DROP VIEW IF EXISTS public.vw_recibos CASCADE;
DROP VIEW IF EXISTS public.vw_detalle_recibos CASCADE;
DROP VIEW IF EXISTS public.vw_facturas_proveedores CASCADE;
DROP VIEW IF EXISTS public.vw_presupuestos_proveedores CASCADE;
DROP VIEW IF EXISTS public.vw_gastos CASCADE;

-- Limpiar tablas físicas previas
DROP TABLE IF EXISTS public.vetsoft_tutores CASCADE;
DROP TABLE IF EXISTS public.vetsoft_pacientes CASCADE;
DROP TABLE IF EXISTS public.vetsoft_historial_peso_pacientes CASCADE;
DROP TABLE IF EXISTS public.vetsoft_consultas_clinicas CASCADE;
DROP TABLE IF EXISTS public.vetsoft_catalogo_vacunas CASCADE;
DROP TABLE IF EXISTS public.vetsoft_dosis_vacunas CASCADE;
DROP TABLE IF EXISTS public.vetsoft_turnos_clinica CASCADE;
DROP TABLE IF EXISTS public.vetsoft_turnos_peluqueria CASCADE;
DROP TABLE IF EXISTS public.vetsoft_productos CASCADE;
DROP TABLE IF EXISTS public.vetsoft_catalogo_servicios CASCADE;
DROP TABLE IF EXISTS public.vetsoft_recibos CASCADE;
DROP TABLE IF EXISTS public.vetsoft_detalle_recibos CASCADE;
DROP TABLE IF EXISTS public.vetsoft_facturas_proveedores CASCADE;
DROP TABLE IF EXISTS public.vetsoft_presupuestos_proveedores CASCADE;
DROP TABLE IF EXISTS public.vetsoft_gastos CASCADE;

DROP TABLE IF EXISTS public.tutores CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;
DROP TABLE IF EXISTS public.historial_peso_pacientes CASCADE;
DROP TABLE IF EXISTS public.consultas_clinicas CASCADE;
DROP TABLE IF EXISTS public.catalogo_vacunas CASCADE;
DROP TABLE IF EXISTS public.dosis_vacunas CASCADE;
DROP TABLE IF EXISTS public.turnos_clinica CASCADE;
DROP TABLE IF EXISTS public.turnos_peluqueria CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.catalogo_servicios CASCADE;
DROP TABLE IF EXISTS public.recibos CASCADE;
DROP TABLE IF EXISTS public.detalle_recibos CASCADE;
DROP TABLE IF EXISTS public.facturas_proveedores CASCADE;
DROP TABLE IF EXISTS public.presupuestos_proveedores CASCADE;
DROP TABLE IF EXISTS public.gastos CASCADE;

-- -----------------------------------------------------------------------------
-- PASO 2: CREACIÓN DE LAS 15 TABLAS FÍSICAS EN ESPAÑOL CON PREFIJO vetsoft_
-- -----------------------------------------------------------------------------
CREATE TABLE public.vetsoft_tutores (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_pacientes (
    id VARCHAR(50) PRIMARY KEY,
    owner_id VARCHAR(50) REFERENCES public.vetsoft_tutores(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    sex TEXT,
    birth_date DATE,
    photo_url TEXT,
    status TEXT DEFAULT 'active',
    weight_kg NUMERIC(6,2),
    alerts TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_historial_peso_pacientes (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES public.vetsoft_pacientes(id) ON DELETE CASCADE,
    date_label TEXT NOT NULL,
    weight_kg NUMERIC(6,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_consultas_clinicas (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES public.vetsoft_pacientes(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    vet_name TEXT NOT NULL,
    notes TEXT NOT NULL,
    prescription TEXT,
    attachments TEXT[],
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_catalogo_vacunas (
    id VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    frequency_days INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_dosis_vacunas (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES public.vetsoft_pacientes(id) ON DELETE CASCADE,
    vaccine_id VARCHAR(50) REFERENCES public.vetsoft_catalogo_vacunas(id) ON DELETE SET NULL,
    vaccine_name TEXT NOT NULL,
    application_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    vet_name TEXT NOT NULL,
    batch TEXT,
    status TEXT DEFAULT 'ok',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_turnos_clinica (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES public.vetsoft_pacientes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    vet_name TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_turnos_peluqueria (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES public.vetsoft_pacientes(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration_minutes INT NOT NULL,
    price NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_productos (
    id VARCHAR(50) PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 0,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    barcode TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_catalogo_servicios (
    id VARCHAR(50) PRIMARY KEY,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    quantity INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    price_last_updated DATE,
    last_sold_at DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_recibos (
    id VARCHAR(50) PRIMARY KEY,
    patient_id VARCHAR(50) REFERENCES public.vetsoft_pacientes(id) ON DELETE SET NULL,
    date TIMESTAMPTZ NOT NULL,
    document_type TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    perceptions NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'ARS',
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_detalle_recibos (
    id VARCHAR(50) PRIMARY KEY,
    receipt_id VARCHAR(50) REFERENCES public.vetsoft_recibos(id) ON DELETE CASCADE,
    product_id VARCHAR(50) REFERENCES public.vetsoft_productos(id) ON DELETE SET NULL,
    service_id VARCHAR(50) REFERENCES public.vetsoft_catalogo_servicios(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE public.vetsoft_facturas_proveedores (
    id VARCHAR(50) PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    cuit TEXT,
    razon_social TEXT,
    linea_negocio TEXT,
    document_type TEXT,
    invoice_number TEXT NOT NULL,
    date DATE NOT NULL,
    payment_date DATE,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    perceptions NUMERIC(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'ARS',
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    items_count INT DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_presupuestos_proveedores (
    id VARCHAR(50) PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE public.vetsoft_gastos (
    id VARCHAR(50) PRIMARY KEY,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    month_key TEXT,
    status TEXT DEFAULT 'paid',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- PASO 3: CREACIÓN DE LAS 15 VISTAS DEDICADAS CON PREFIJO vetsoft_vw_
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.vetsoft_vw_tutores AS
SELECT id, name, phone, email, address, created_at AS "createdAt"
FROM public.vetsoft_tutores;

CREATE OR REPLACE VIEW public.vetsoft_vw_pacientes AS
SELECT id, owner_id AS "ownerId", name, species, breed, sex, TO_CHAR(birth_date, 'YYYY-MM-DD') AS "birthDate", photo_url AS "photoUrl", status, weight_kg AS "weightKg", alerts, created_at AS "createdAt"
FROM public.vetsoft_pacientes;

CREATE OR REPLACE VIEW public.vetsoft_vw_historial_peso_pacientes AS
SELECT id, patient_id AS "patientId", date_label AS "dateLabel", weight_kg AS "weightKg", created_at AS "createdAt"
FROM public.vetsoft_historial_peso_pacientes;

CREATE OR REPLACE VIEW public.vetsoft_vw_consultas_clinicas AS
SELECT id, patient_id AS "patientId", date, vet_name AS "vetName", notes, prescription, attachments, created_at AS "createdAt"
FROM public.vetsoft_consultas_clinicas;

CREATE OR REPLACE VIEW public.vetsoft_vw_catalogo_vacunas AS
SELECT id, name, frequency_days AS "frequencyDays", created_at AS "createdAt"
FROM public.vetsoft_catalogo_vacunas;

CREATE OR REPLACE VIEW public.vetsoft_vw_dosis_vacunas AS
SELECT id, patient_id AS "patientId", vaccine_id AS "vaccineId", vaccine_name AS "vaccineName", TO_CHAR(application_date, 'YYYY-MM-DD') AS "applicationDate", TO_CHAR(expiration_date, 'YYYY-MM-DD') AS "expirationDate", vet_name AS "vetName", batch, status, created_at AS "createdAt"
FROM public.vetsoft_dosis_vacunas;

CREATE OR REPLACE VIEW public.vetsoft_vw_turnos_clinica AS
SELECT id, patient_id AS "patientId", TO_CHAR(date, 'YYYY-MM-DD') AS date, time, vet_name AS "vetName", reason, status, created_at AS "createdAt"
FROM public.vetsoft_turnos_clinica;

CREATE OR REPLACE VIEW public.vetsoft_vw_turnos_peluqueria AS
SELECT id, patient_id AS "patientId", service_name AS "serviceName", TO_CHAR(date, 'YYYY-MM-DD') AS date, time, duration_minutes AS "durationMinutes", price, status, notes, created_at AS "createdAt"
FROM public.vetsoft_turnos_peluqueria;

CREATE OR REPLACE VIEW public.vetsoft_vw_productos AS
SELECT id, sku, name, category, current_stock AS "currentStock", min_stock AS "minStock", price, barcode, created_at AS "createdAt"
FROM public.vetsoft_productos;

CREATE OR REPLACE VIEW public.vetsoft_vw_catalogo_servicios AS
SELECT id, category, name, description, quantity, is_active AS "isActive", price, TO_CHAR(price_last_updated, 'YYYY-MM-DD') AS "priceLastUpdated", TO_CHAR(last_sold_at, 'YYYY-MM-DD') AS "lastSoldAt"
FROM public.vetsoft_catalogo_servicios;

CREATE OR REPLACE VIEW public.vetsoft_vw_recibos AS
SELECT id, patient_id AS "patientId", date, document_type AS "documentType", invoice_number AS "invoiceNumber", subtotal, tax_amount AS "taxAmount", perceptions, currency, total_amount AS "totalAmount", payment_method AS "paymentMethod", notes, created_at AS "createdAt"
FROM public.vetsoft_recibos;

CREATE OR REPLACE VIEW public.vetsoft_vw_detalle_recibos AS
SELECT id, receipt_id AS "receiptId", product_id AS "productId", service_id AS "serviceId", description, quantity, unit_price AS "unitPrice", subtotal
FROM public.vetsoft_detalle_recibos;

CREATE OR REPLACE VIEW public.vetsoft_vw_facturas_proveedores AS
SELECT id, supplier_name AS "supplierName", cuit, razon_social AS "razonSocial", linea_negocio AS "lineaNegocio", document_type AS "documentType", invoice_number AS "invoiceNumber", TO_CHAR(date, 'YYYY-MM-DD') AS date, TO_CHAR(payment_date, 'YYYY-MM-DD') AS "paymentDate", subtotal, tax_amount AS "taxAmount", perceptions, currency, amount, items_count AS "itemsCount", status, created_at AS "createdAt"
FROM public.vetsoft_facturas_proveedores;

CREATE OR REPLACE VIEW public.vetsoft_vw_presupuestos_proveedores AS
SELECT id, supplier_name AS "supplierName", title, TO_CHAR(date, 'YYYY-MM-DD') AS date, amount, status, created_at AS "createdAt"
FROM public.vetsoft_presupuestos_proveedores;

CREATE OR REPLACE VIEW public.vetsoft_vw_gastos AS
SELECT id, category, description, amount, TO_CHAR(date, 'YYYY-MM-DD') AS date, month_key AS "monthKey", status, created_at AS "createdAt"
FROM public.vetsoft_gastos;

-- -----------------------------------------------------------------------------
-- PASO 4: DESACTIVAR RLS EN LAS 15 TABLAS FÍSICAS VETSOFT
-- -----------------------------------------------------------------------------
ALTER TABLE public.vetsoft_tutores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_historial_peso_pacientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_consultas_clinicas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_catalogo_vacunas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_dosis_vacunas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_turnos_clinica DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_turnos_peluqueria DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_productos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_catalogo_servicios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_recibos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_detalle_recibos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_facturas_proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_presupuestos_proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vetsoft_gastos DISABLE ROW LEVEL SECURITY;
```
