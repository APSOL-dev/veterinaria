# Migración de Datos Históricos (HDG Veterinaria)

## Importación de Datos Históricos del Sistema Veterinario

**Qué hace:** Procesa e incorpora a VETSOFT la totalidad de los datos preexistentes del sistema HDG Veterinaria (extraídos en la planilla Excel `HDG_Veterinaria_Historias_Clinicas.xlsx`), poblando los catálogos, tutores/clientes, pacientes, historias clínicas y registros de vacunación.

**Escenarios cubiertos:**
- **Catálogo de Vacunas:** 19 vacunas históricas registradas (`PARVOVIRUS`, `SEXTUPLE`, `QUINTUPLE`, `ANTIRRABICA`, etc.) con sus frecuencias de refuerzo en días.
- **Clientes / Tutores:** 620 tutores con nombre, teléfono, domicilio y localidad normalizados.
- **Pacientes:** 766 animales con nombre, especie (Canino, Felino, Ave, Roedor, Reptil, Otro), raza, sexo, fecha de nacimiento, estado (activo / fallecido), peso, alertas (esterilización, pelaje, etc.) e historial de peso.
- **Historias Clínicas:** 1.564 consultas y notas de evolución clínica con fecha, diagnóstico, tratamiento, indicaciones médicas y veterinario actuante.
- **Vacunaciones:** 797 aplicaciones de vacunas con fecha de aplicación, fecha de vencimiento/refuerzo, lote/marca y estado de vigencia.

**Casos borde conocidos:**
- **Pacientes huérfanos sin cliente:** Los pacientes 325 (SHAKIRA) y 609 (MARA) poseían `id_cliente = 0` en el sistema de origen. Se asignan a un tutor virtual `"Sin tutor asignado"` (`owner-0`) para garantizar la integridad referencial y evitar caídas en pantalla.
- **Caracteres especiales y saltos de línea FoxPro:** Los saltos de línea XML `_x000D_` y caracteres acentuados o la letra `Ñ` se limpian y preservan en formato UTF-8 nativo.
- **Historial de peso enriquecido:** El peso registrado en las consultas de historia clínica se incorpora al historial cronológico de peso de cada mascota.

**Restricciones o supuestos:**
- Los registros se encuentran disponibles en el dataset central de la aplicación (`src/data/importedVeterinaryData.ts` / `src/data/mockData.ts`) y se encuentran persistidos en la base de datos PostgreSQL de Supabase (`vetsoft_catalogo_vacunas`, `vetsoft_tutores`, `vetsoft_pacientes`, `vetsoft_consultas_clinicas`, `vetsoft_dosis_vacunas`).

---

## Importación de Catálogo de Precios y Productos ("Global Precios")

**Qué hace:** Extrae e importa la totalidad de la lista de precios vigente desde la hoja `"Global Precios"` del archivo `Precios Veterinaria.xlsx` hacia la base de datos de Supabase, distribuyéndola en las tablas de servicios clínicos/peluquería (`vetsoft_catalogo_servicios`) e inventario de productos (`vetsoft_productos`).

**Escenarios cubiertos:**
- **Servicios:** 70 servicios clínicos, cirugías, internaciones, consultas y peluquería con sus precios con IVA, última fecha de actualización y descripción de presentación/marca.
- **Productos:** 608 productos (Medicamentos, Alimentos balanceados, Artículos de Pet-shop/Accesorios, Insumos Clínicos e Higiene) con sus códigos de barra, SKUs normalizados (`VET-ALM-...`, `VET-MED-...`, `VET-ACC-...`, `VET-INS-...`), precios al público con IVA y stock disponible.

**Casos borde conocidos:**
- **Filas anuladas/vacías:** Se ignoraron las filas marcadas explícitamente como `'ANULADO'` o sin nombre/identificador para mantener la base limpia.
- **Normalización de Categorías:** Se clasificaron y normalizaron las categorías a los tipos soportados por el dominio (`clinica` / `peluqueria` para servicios; `Medicamentos`, `Alimentación`, `Accesorios`, `Insumos Clínicos`, `Higiene y Estética` para productos).

