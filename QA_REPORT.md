# Reporte de Control de Calidad (QA), corrida 4
- **Fecha y Hora:** 2026-10-01 (re-test tras el commit `1eac4ef`, bundle `index-Be9EUJmE.js`)
- **Objetivo evaluado:** VETSOFT en producción. Reverificación de las correcciones y revisión de formularios de Proveedores.
- **Perfiles evaluados:** Administrador. **No probados:** Veterinario y Peluquero (sin credenciales).
- **Alcance:** E2E felices ⚠️ parcial · Casos borde ✅ · Mobile/Tablet ✅ (390, 768 y 1366 px) · UX/UI ✅ · Unitarios ✅

---

## 1. Resumen General para el Usuario
- **Estado general:** **Aprobado con observaciones.** Todas las correcciones pedidas funcionan en producción. Quedan 2 observaciones nuevas en Proveedores y detalles menores de tamaño táctil.
- **Resumen:** La fecha futura se bloquea, las dosis se pueden borrar (y el borrado persiste), el turno sin paciente muestra mensaje, los felinos ven solo servicios felinos y el mobile quedó sin scroll horizontal en los 7 módulos. En tablet tampoco hay scroll horizontal.
- **Errores:** 0 críticos, 2 medios (nuevos), 1 bajo. Errores previos resueltos: 8 de 9 (el Error 5 era un falso positivo).
- **Casos borde:** 8 ejecutados en total: 7 pasan, 1 falla (negativos en factura manual, ver Error 10).
- **Tests unitarios:** 339 pasan / 0 fallan.
- **Pasos no ejecutados:** emisión de cobro (necesita tu OK), carga con OCR (sin archivo de muestra), ajuste por inflación y WhatsApp (prohibidos).

---

## 2. Detalle de Errores

### 🔴 Errores Críticos
Sin errores críticos detectados.

### 🟡 Errores Medios

#### Error 10 (nuevo): La factura manual acepta importes negativos
- **Detectado en:** Administrador · Caso borde · Datos · Escritorio
- **¿Qué pasó?:** En Proveedores → Registrar Factura → Carga Manual, los 4 campos de importe (subtotal, IVA, percepciones y total) aceptan valores negativos. El formulario los da por válidos. No se envió el formulario para no crear registros reales.
- **Pasos para repetirlo:** 1. Proveedores → Registrar Factura → Carga Manual. 2. Escribir -100 en el total. El navegador no marca error.
- **Archivo o pantalla sugerida:** `src/components/Suppliers/NewInvoiceDrawer.tsx`, inputs `type="number"` en las líneas 634, 670, 799 y 831 (sin `min`). Los de las líneas 751 y 764 sí tienen `min`.
- **Corrección sugerida:** agregar `min="0"` y validar en `handleSubmit`. Si se admiten notas de crédito, debería ser un campo explícito.

#### Error 11 (nuevo, solo por código): "Procesar factura" llama al webhook de n8n aunque no haya archivo
- **Detectado en:** Administrador · revisión de código (no ejecutado, para no disparar el webhook real)
- **¿Qué pasó?:** En Carga Automática el botón no está deshabilitado sin archivo. `handleProcessInvoiceWithN8n` (línea 230) envía el webhook con `file = null` y montos en 0.
- **Archivo o pantalla sugerida:** `src/components/Suppliers/NewInvoiceDrawer.tsx:230-247` y el botón de la línea 497.
- **Corrección sugerida:** deshabilitar el botón o salir con un mensaje si `!selectedFile`.

### 🟢 Errores Bajos

#### Error 12 (nuevo): Algunos controles quedan entre 36 y 40 px en mobile
- **Detectado en:** Administrador · Celular 390 px
- **¿Qué pasó?:** En Peluquería, "Semana anterior", "Hoy", "Semana siguiente" (36 px) y "Nuevo turno" (40 px). En Pacientes, "Editar datos del paciente" (40 px). Tienen clases `min-h-*` propias que ganan sobre la regla global de 44 px.
- **Archivo o pantalla sugerida:** controles de la agenda en `AgendaView.tsx` y botón de la ficha en `PatientProfileView.tsx`.

### ✅ Resueltos y verificados en producción
| Error | Verificación |
|---|---|
| 8. Dosis con fecha futura | El campo tiene `max=2026-10-01` y no se agregó ninguna dosis al intentar 2030-01-01. |
| 9. Sin borrar dosis | Botón "Eliminar dosis" de 44×44 px, diálogo de confirmación, y la dosis errónea de 2030 desapareció también tras recargar. |
| 6. Botones chicos en mobile | Inventario, Proveedores, WhatsApp y Cobros: 0 controles bajo 44 px. |
| 5. Inputs < 16 px en Cobros | Falso positivo (eran radios ocultos y checkboxes). |
| Turno sin paciente (caso borde) | Aparece "Seleccione un paciente para agendar el turno." y se limpia al elegir paciente. No se crea turno. |
| 1 a 4 y 7 | Sin regresiones: AFIP destildado, consulta vacía con mensaje, autor correcto, dosis persiste. |

---

## 3. Casos Borde

| # | Perfil | Categoría | Qué se hizo | Esperado | Obtenido | Resultado |
|---|---|---|---|---|---|---|
| 1 | Admin | Datos | Producto con stock/precio negativos | Rechazo | Bloqueado | ✅ |
| 2 | Admin | Datos | Consulta vacía (ficha y Clínica) | Mensaje | Mensaje | ✅ |
| 3 | Admin | Estados | Recargar tras guardar dosis | Persiste | Persiste | ✅ |
| 4 | Admin | Datos | Dosis con fecha futura | Rechazo | Bloqueado | ✅ |
| 5 | Admin | Datos | Confirmar turno sin paciente | Mensaje | Mensaje claro | ✅ |
| 6 | Admin | Estados | Borrar dosis y recargar | Persiste el borrado | Persiste | ✅ |
| 7 | Admin | Datos | Gasto con importe negativo (validación) | Rechazo | `min=1` | ✅ |
| 8 | Admin | Datos | Factura manual con importe negativo (validación) | Rechazo | Aceptado | ❌ (Error 10) |

- **No ejecutados:** turno superpuesto, acceso por URL como otros perfiles, cobro con ítems, Nuevo paciente (solo exige 1 campo obligatorio; no se probó el alta para no crear registros no autorizados).
- **Registros de prueba (`QA-TEST`) para limpiar:**
  - 3 consultas en Mateo Prueba.
  - 1 dosis SÉXTUPLE (01/10/2026) en Mateo Prueba. Se puede borrar desde la app.
  - Turno de peluquería hoy 10:00 (Mateo Prueba).
  - Producto `QA-TEST Producto`.
  - Servicio `QA-TEST Servicio`.
  - Vacuna requerida ANTIRRÁBICA "aplicada" en Mateo Prueba 2 sin dosis en el historial.

---

## 4. Responsive y Mobile
- **Veredicto mobile:** Lista para celular, con detalles menores (Error 12).
- **Meta viewport:** correcto. Anchos probados: 390, 768 y 1366 px. Sin scroll horizontal en los 7 módulos en 390 ni en 768.
- **Paginación en 390 px:** entra completa (de 23 a 367 px de 390).
- **Camino feliz en mobile:** guardar una consulta desde la ficha de Mateo Prueba funciona (botón de 148×50 px).
- **No cubierto:** táctil real, red móvil, 360 px.

---

## 5. Mejoras de UX/UI
Resueltas: modal de turno sin paciente preseleccionado, buscador en Servicios, servicios filtrados por especie, mensaje al confirmar sin paciente, botón de borrar dosis, aviso de error al fallar el guardado de dosis.

Pendientes:
1. Deshabilitar "Procesar factura" sin archivo (Error 11). Medio / S.
2. Agregar `min="0"` a los importes de la factura manual (Error 10). Medio / S.
3. Llevar los controles de la agenda a 44 px (Error 12). Bajo / S.
4. Dividir el bundle JS: pesa 2,8 MB sin comprimir (690 KB gzip). Medio / M.

---

## 6. Tests Unitarios
- Vitest, 27 archivos, 339 tests: 339 pasan, 0 fallan (4 nuevos para `filterGroomingServicesBySpecies`).
- **Hueco:** no hay tests para `NewInvoiceDrawer` ni para el rechazo de fechas futuras en `handleRegisterDosis`.


---

## 7. Correcciones aplicadas tras la corrida 4 (pendientes de reverificación en producción)

| Hallazgo | Estado | Cambio |
|---|---|---|
| Error 10: importes negativos en factura manual | Corregido y reencuadrado | Subtotal y Total son campos de solo lectura calculados desde los ítems, así que no los edita el usuario (la prueba de la corrida 4 los forzó artificialmente). Lo editable es IVA y Percepciones: se les agregó `min="0"` en `NewInvoiceDrawer.tsx`. |
| Error 11: "Procesar factura" sin archivo llamaba al webhook | Corregido | `handleProcessInvoiceWithN8n` sale con el mensaje "Seleccione un archivo (PDF o imagen) antes de procesar la factura." si no hay archivo. |
| Error 12: controles de 36 a 40 px en mobile | Corregido | `AgendaView.tsx` (semana anterior, hoy, semana siguiente, Nuevo turno) y `PatientProfileView.tsx` (Editar datos del paciente) pasan a 44 px en mobile y conservan su tamaño actual desde `sm`. |

Verificación local: `tsc` sin errores y 339 tests pasan.

---

## 8. Reverificación en producción (bundle `index-DvEsKu3Z.js`)

| Hallazgo | Resultado |
|---|---|
| Error 10: IVA y Percepciones con `min` | ✅ Los dos campos editables tienen `min="0"`. Subtotal y Total siguen de solo lectura. |
| Error 11: Procesar factura sin archivo | ✅ Muestra "Seleccione un archivo (PDF o imagen) antes de procesar la factura." No pasa a "Procesando" y no se registró ningún request al webhook. |
| Error 12: controles de 36 a 40 px en mobile | ✅ Pacientes y los controles de semana y "Nuevo turno" de Peluquería llegan a 44 px. Sin scroll horizontal en los 7 módulos a 390 px. |

**Residual (bajo):** en las tarjetas de turno de Peluquería, "Completar" y "Cobrar" miden 42 px de alto en 390 px (2 px menos que el objetivo de 44 px).

**Sin ejecutar:** carga real con OCR y emisión de cobro (siguen pendientes).
