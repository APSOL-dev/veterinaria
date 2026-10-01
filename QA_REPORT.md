# Reporte de Control de Calidad (QA), corrida 2
- **Fecha y Hora:** 2026-10-01 (re-test tras el commit "Cambios de QA 2", bundle `index-CKuXn704.js`)
- **Objetivo evaluado:** VETSOFT en producción (https://veterinaria.apsol-consultora.com.ar/). Reverificación de los 6 errores de la corrida 1 y revisión de módulos.
- **Perfiles evaluados:** Administrador. **No probados:** Veterinario y Peluquero (sin credenciales).
- **Alcance:** E2E felices ⚠️ parcial · Casos borde ⚠️ pocos · Mobile ✅ (390px, medición por JS) · UX/UI ✅ · Unitarios ✅

---

## 1. Resumen General para el Usuario
- **Estado general:** **No aprobado** por un error crítico nuevo (ver Error 7).
- **Resumen:** Los cambios de la corrida 1 funcionan: AFIP ya no viene tildado, la consulta vacía muestra mensaje, el autor es el usuario logueado y "Sin datos" reemplaza al "Al día" falso. Pero al reverificar vacunas apareció que **las dosis de vacuna no se guardan**: la pantalla las muestra con cobertura 100%, pero al recargar desaparecen.
- **Errores:** 1 crítico (nuevo), 0 medios, 2 bajos (persisten) · Resueltos de la corrida 1: 4 de 6.
- **Casos borde:** 4 ejecutados, 4 pasan.
- **Tests unitarios:** 328 pasan / 0 fallan.
- **Pasos no ejecutados:** emisión de cobro (necesita tu OK), OCR (sin archivo de muestra), ajuste por inflación y WhatsApp (prohibidos). Consulta a la base de datos de producción: denegada por el permiso del entorno, y no se insistió.

---

## 2. Detalle de Errores

### 🔴 Errores Críticos

#### Error 7: Las dosis de vacuna no se guardan en la base (la pantalla muestra éxito)
- **Detectado en:** Administrador · Camino feliz (registrar dosis) · Escritorio
- **Tipo de caso:** Camino feliz
- **¿Qué pasó?:** Al presionar "Guardar dosis", Control de vacunas muestra la dosis y cobertura 100%. Al recargar la página la dosis desaparece. Se reprodujo 3 veces con Mateo Prueba. La corrida 1 había reportado esto como OK porque no se recargó.
- **Pasos para repetirlo:**
  1. Pacientes → Control de vacunas → Mateo Prueba.
  2. "Registrar aplicación" → "Guardar dosis" con los valores por defecto (SÉXTUPLE CANINA).
  3. Recargar la página y volver a abrir el paciente: "No hay vacunas registradas".

##### Datos Técnicos para el Agente / Desarrollador:
- **Archivo:** `src/App.tsx:496-538` (`handleRegisterDosis`) y `src/domain/services/supabaseService.ts:756` (`insertVaccineDosisToSupabase`).
- **Mensaje en consola:** `Supabase error inserting vaccine dosis: code 23503, "insert or update on table vetsoft_dosis_vacunas violates foreign key constraint vetsoft_dosis_vacunas_vaccine_id_fkey", details: Key is not present in table vetsoft_catalogo_vacunas`
- **Causa probable (a confirmar contra la base):**
  - El `vaccineId` enviado (ej. `vac-sextuple`, definido en `src/data/importedVeterinaryData.ts:5`) no existe como `id` en la tabla `vetsoft_catalogo_vacunas` de producción.
  - `App.tsx:518` ignora el resultado de `insertVaccineDosisToSupabase`, por eso la UI muestra éxito.
  - `App.tsx:520-537` sí persiste el paciente con la vacuna requerida "aplicada". Por eso Mateo Prueba 2 muestra ANTIRRÁBICA "Aplicada 01/10/2026" y el historial dice "No hay vacunas registradas".
- **Corrección sugerida:**
  - Alinear los IDs del catálogo local con los de la tabla, o sembrar el catálogo faltante en la base.
  - Verificar `result.success` y mostrar error al usuario sin actualizar el estado local.
  - La aprobación de cambios en la base de producción es tuya.
- **No se pudo confirmar:** el contenido de `vetsoft_catalogo_vacunas`, porque la consulta SQL a producción fue denegada.

### 🟡 Errores Medios
Sin errores medios detectados.

### 🟢 Errores Bajos

#### Error 5 (persiste): Inputs de Cobros con fuente < 16 px en mobile
- 6 campos en Cobros → Nueva facturación a 390 px. iPhone hace zoom automático al tocarlos.

#### Error 6 (persiste): Botones chicos (< 36 px) en tablas en mobile
- Inventario (15) y Proveedores (10) a 390 px.

### ✅ Resueltos respecto a la corrida 1
| Error | Verificación |
|---|---|
| 1. AFIP tildado por defecto | Verificado: `checked=false` al abrir Cobros. |
| 2. Paciente sin vacunas "Al día" | Verificado: ahora "Sin datos" con "Sin vacunas registradas". Cobertura 0%. |
| 3. Autor "Dr. J. Silva" | Verificado: la consulta nueva figura con el usuario logueado ("Mateo Courault"). |
| 4. Consulta vacía sin feedback | Verificado en ficha y en Clínica: mensaje de validación. No se guarda registro vacío. |

---

## 3. Casos Borde

| # | Perfil | Categoría | Qué se hizo | Esperado | Obtenido | Resultado |
|---|---|---|---|---|---|---|
| 1 | Admin | Datos | Producto con stock/precio negativos (corrida 1) | Rechazo | Bloqueado | ✅ |
| 2 | Admin | Datos | Guardar consulta vacía en ficha | Mensaje | "Debe ingresar observaciones…" | ✅ |
| 3 | Admin | Datos | Guardar consulta vacía en Clínica | Mensaje | "Debe completar las notas clínicas…" | ✅ |
| 4 | Admin | Estados | Recarga tras guardar dosis | Dosis persiste | Dosis perdida | ❌ (Error 7) |

(El caso 4 cuenta como camino feliz fallido y no como caso borde pasado. Casos 1 a 3: pasan.)

- **No ejecutados:** vacuna con fecha futura, turno de peluquería superpuesto, acceso por URL como otros perfiles, cobro con ítems.
- **Registros de prueba (`QA-TEST`) para limpiar:**
  - 2 consultas en Mateo Prueba.
  - Turno de peluquería hoy 10:00 (Mateo Prueba).
  - Producto `QA-TEST Producto`.
  - Servicio `QA-TEST Servicio`.
  - Vacuna requerida ANTIRRÁBICA "aplicada" en Mateo Prueba 2 (sin dosis real).

---

## 4. Responsive y Mobile
- **Veredicto:** Usable, con detalles menores.
- **Meta viewport:** correcto. Sin scroll horizontal en los 7 módulos a 390 px.
- **Anchos probados:** 390 y 1366 px. Tablet y 360 px no probados.
- **Peso:** el bundle JS pesaba 694 KB en la corrida 1. No se re-midió.
- **No cubierto:** táctil real, red móvil.

---

## 5. Mejoras de UX/UI (pendientes de la corrida 1)
1. Modal "Agendar turno" preselecciona a VALKIRIA (paciente real): conviene dejar "Seleccione paciente". Alto / S. *(No re-verificado en esta corrida.)*
2. Inventario → Servicios sigue sin buscador (71 servicios en 4 páginas). Medio / S. *(Confirmado.)*
3. Servicios de peluquería solo de "Perro" aun para felinos. Medio / M.
4. Nuevo: mostrar un error visible cuando falla una escritura a la base (relacionado con el Error 7). Alto / S.

---

## 6. Tests Unitarios
- **Runner:** Vitest, 27 archivos, 328 tests: 328 pasan, 0 fallan.
- **Hueco:** ningún test cubre `handleRegisterDosis` ni el manejo del resultado de `insertVaccineDosisToSupabase`. Conviene agregar uno que verifique que, si falla la inserción, el estado local no queda como éxito.
