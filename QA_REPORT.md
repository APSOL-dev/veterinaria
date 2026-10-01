# Reporte de Control de Calidad (QA), corrida 3
- **Fecha y Hora:** 2026-10-01 (re-test tras el commit "Fix persistencia de vacunas…", bundle `index-J5Ly4etl.js`)
- **Objetivo evaluado:** VETSOFT en producción. Reverificación de errores previos, casos borde nuevos y mobile.
- **Perfiles evaluados:** Administrador. **No probados:** Veterinario y Peluquero (sin credenciales).
- **Alcance:** E2E felices ⚠️ parcial · Casos borde ⚠️ pocos · Mobile ✅ (390px) · UX/UI ✅ · Unitarios ✅

---

## 1. Resumen General para el Usuario
- **Estado general:** **Con observaciones.** Se resolvió el error crítico anterior. No quedan errores críticos.
- **Resumen:** Las dosis de vacuna ahora persisten tras recargar (sin error en consola). Se confirmó también el modal de turno sin paciente preseleccionado y el buscador de Servicios. Aparecieron dos observaciones nuevas de validación en vacunas.
- **Errores:** 0 críticos, 1 medio (nuevo), 3 bajos. De 7 errores previos quedan resueltos 5.
- **Casos borde:** 6 ejecutados en total: 5 pasan, 1 falla.
- **Tests unitarios:** 335 pasan / 0 fallan (27 archivos).
- **Pasos no ejecutados:** emisión de cobro (necesita tu OK), OCR (sin archivo de muestra), ajuste por inflación y WhatsApp (prohibidos).

---

## 2. Detalle de Errores

### 🔴 Errores Críticos
Sin errores críticos detectados.

### 🟡 Errores Medios

#### Error 8 (nuevo): Se acepta una dosis de vacuna con fecha de aplicación futura
- **Detectado en:** Administrador · Caso borde · Datos
- **¿Qué pasó?:** Registrar una dosis con fecha 01/01/2030 se guarda sin advertencia. Queda "Aplicada / Al día" con vencimiento 2031, y el paciente figura 100% al día aunque la vacuna aún no se aplicó.
- **Pasos para repetirlo:**
  1. Control de vacunas → Mateo Prueba → Registrar aplicación.
  2. Poner fecha de aplicación 2030-01-01 → Guardar dosis.
- **Archivo o pantalla sugerida:** `src/components/Vaccines/VaccinesView.tsx` (modal de registro de dosis), a investigar.
- **Corrección sugerida:** `max=hoy` en el input y validación en `handleRegisterDosis` (`src/App.tsx`).

### 🟢 Errores Bajos

#### Error 9 (nuevo): No se puede editar ni borrar una dosis registrada
- La tabla "Historial de vacunación" no tiene botones de acción. Una dosis cargada por error no se puede corregir desde la app. El código tiene `handleDeleteDosis` en `src/App.tsx:540` que no está conectado a la tabla.

#### Error 5 (persiste): Inputs de Cobros con fuente < 16 px en mobile (6 campos a 390 px).

#### Error 6 (persiste): Botones < 36 px en tablas en mobile (Inventario 15, Proveedores 10 a 390 px).

### ✅ Resueltos
| Error | Verificación |
|---|---|
| 1. AFIP tildado por defecto | Corrida 2 |
| 2. Paciente sin vacunas "Al día" | Corrida 2 |
| 3. Autor "Dr. J. Silva" | Corrida 2 |
| 4. Consulta vacía sin feedback | Corrida 2 |
| 7. Dosis no persiste | Verificado: registrar → recargar → la fila sigue en el historial con cobertura 100%. Sin errores en consola. |

---

## 3. Casos Borde

| # | Perfil | Categoría | Qué se hizo | Esperado | Obtenido | Resultado |
|---|---|---|---|---|---|---|
| 1 | Admin | Datos | Producto con stock/precio negativos | Rechazo | Bloqueado | ✅ |
| 2 | Admin | Datos | Consulta vacía en ficha | Mensaje | Mensaje | ✅ |
| 3 | Admin | Datos | Consulta vacía en Clínica | Mensaje | Mensaje | ✅ |
| 4 | Admin | Estados | Recargar tras guardar dosis | Persiste | Persiste | ✅ |
| 5 | Admin | Datos | Confirmar turno sin paciente | Rechazo | No se crea el turno; solo se ve el placeholder "Seleccionar paciente…", sin mensaje claro | ✅ (mejorable) |
| 6 | Admin | Datos | Dosis con fecha futura (2030) | Rechazo | Aceptada | ❌ (Error 8) |

- **No ejecutados:** turno superpuesto, acceso por URL como otros perfiles, cobro con ítems, edición con nombre vacío.
- **Registros de prueba para limpiar:**
  - 2 consultas `QA-TEST` en Mateo Prueba.
  - 2 dosis SÉXTUPLE en Mateo Prueba (una con fecha 01/10/2026 y otra con 01/01/2030, esta última errónea). Sin botón de borrado en la UI.
  - Turno de peluquería hoy 10:00 (Mateo Prueba).
  - Producto `QA-TEST Producto`.
  - Servicio `QA-TEST Servicio`.
  - Vacuna requerida ANTIRRÁBICA "aplicada" en Mateo Prueba 2 sin dosis en el historial.
  - Posibles dosis duplicadas de pruebas previas.

---

## 4. Responsive y Mobile
- **Veredicto:** Usable, con detalles menores. Sin scroll horizontal en los 7 módulos a 390 px.
- **Meta viewport:** correcto. 390 y 1366 px probados. Tablet y 360 px no probados.
- **No cubierto:** táctil real, red móvil.

---

## 5. Mejoras de UX/UI
Resueltas y verificadas: modal de turno sin paciente preseleccionado, buscador en Servicios.
Pendientes:
1. Mensaje claro "Seleccione un paciente" al confirmar un turno sin paciente. Medio / S.
2. Servicios de peluquería solo de "Perro" aun para felinos. Medio / M.
3. Botones de editar/borrar en el historial de vacunas (Error 9). Medio / S.
4. Toast de error visible cuando falla una escritura a la base (revisar el cambio del fix). Alto / S.

---

## 6. Tests Unitarios
- Vitest, 27 archivos, 335 tests: 335 pasan, 0 fallan (el commit sumó 7 tests).
- **Hueco:** falta un test para el rechazo de fechas futuras en `handleRegisterDosis`.


---

## 7. Correcciones aplicadas en el código (pendientes de push y reverificación en producción)

Verificado localmente: `tsc --noEmit` sin errores, build de producción OK y 339 tests pasan (4 nuevos). **No se re-probó en la app publicada**, porque los cambios aún no están desplegados.

| Hallazgo | Estado | Cambio |
|---|---|---|
| Error 8: dosis con fecha futura | Corregido | `VaccinesView.tsx`: `max` = hoy local, mensaje de error y fecha local (antes UTC). `App.tsx`: guard en `handleRegisterDosis`. |
| Error 9: sin editar/borrar dosis | Corregido (borrar) | Columna "Acciones" con botón eliminar y confirmación. `handleDeleteDosis` ahora espera a la base y avisa si falla. Si no queda otra dosis de esa vacuna, la vacuna requerida vuelve a "pendiente". **Editar no se implementó**: se borra y se vuelve a cargar. |
| Error 5: inputs de Cobros < 16 px | **Falso positivo** | Los 6 elementos eran radios ocultos y checkboxes. Los campos de texto ya forzaban 16 px (`index.css`). |
| Error 6: botones chicos en mobile | Corregido | `index.css`: mínimo 44 px de alto en botones, selects y campos dentro de `main` y `header` en pantallas ≤ 768 px. Paginación ajustada (`Pagination.tsx`). |
| Caso borde: turno sin paciente | Corregido | `AgendaView.tsx`: mensaje "Seleccione un paciente para agendar el turno." |
| Mejora: servicios por especie | Corregido | `filterGroomingServicesBySpecies` en `agendaService.ts`. Si el catálogo solo tiene servicios de perro, un felino ve todos con un aviso. |
| Mejora: aviso de error al fallar una escritura | Corregido | `reportSyncFailure` en `App.tsx` para consultas, turnos, productos, cobros y pagos. Quedan sin cubrir otras escrituras (catálogo de vacunas, pacientes, gastos y presupuestos). |

**A verificar tras el deploy:**
- La paginación en 390 px (calculada por ancho, no vista).
- Que el aumento de alto de los botones no rompa tablas densas en Inventario y Proveedores.
- Los sliders de Proveedores quedaron excluidos de la regla.

**Nota de rendimiento:** el bundle JS pesa 2,8 MB sin comprimir (690 KB gzip). Conviene dividirlo con `import()` dinámico por módulo.
