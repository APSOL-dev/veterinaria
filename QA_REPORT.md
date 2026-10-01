# Reporte de Control de Calidad (QA)
- **Fecha y Hora:** 2026-10-01
- **Objetivo evaluado:** VETSOFT en producción (https://veterinaria.apsol-consultora.com.ar/): Pacientes, Clínica, Peluquería, Inventario, Cobros (solo lectura), Proveedores (solo lectura), WhatsApp (solo navegación).
- **Perfiles evaluados:** Administrador. **No probados:** Veterinario y Peluquero (sin credenciales hoy).
- **Alcance:** E2E felices ⚠️ parcial · Casos borde ⚠️ pocos · Mobile ✅ (medición por JS) · UX/UI ✅ · Unitarios ✅

---

## 1. Resumen General para el Usuario
- **Estado general:** Con observaciones (sin errores críticos detectados en lo probado).
- **Resumen:** Se probó con los pacientes "Mateo Prueba" y "Mateo Prueba 2". Los flujos recorridos funcionaron: consulta, dosis de vacuna, turno de peluquería, producto y servicio. En mobile no hay scroll horizontal en ningún módulo. Hay observaciones de coherencia de datos y de UX.
- **Errores encontrados:** 0 críticos, 3 medios, 3 bajos.
- **Casos borde:** 2 probados: 1 pasa (stock/precio negativos bloqueados), 1 sin feedback visible (consulta vacía).
- **Mejoras de UX/UI sugeridas:** 5 (3 quick wins).
- **Tests unitarios:** 323 pasan / 0 fallan, 27 archivos. No se agregaron tests nuevos. No se midió cobertura.
- **Pasos no ejecutados:**
  - Emitir cobro: AFIP (CAE) viene tildado por defecto y es integración real. Falta tu confirmación.
  - Carga de factura con OCR: no había un archivo de muestra.
  - Ajuste por inflación: prohibido.
  - Mensajes de WhatsApp: prohibidos.
  - Perfiles Veterinario y Peluquero: sin credenciales.
  - Recetas y registro de peso: no ejecutados.
  - Edición y borrado de los registros de prueba: no ejecutados.

---

## 2. Detalle de Errores Encontrados

### 🔴 Errores Críticos
Sin errores críticos detectados.

### 🟡 Errores Medios

#### Error 1: "Emitir Comprobante AFIP (CAE)" viene activado por defecto en Nueva facturación
- **Detectado en:** Administrador · Camino feliz · Escritorio
- **¿Qué pasó?:** Al abrir Cobros → Nueva facturación el checkbox ya está tildado. Cada cobro intentaría una autorización real en AFIP salvo que se destilde a mano. Es fácil emitir fiscalmente por error.
- **Pasos:** 1. Ir a Cobros. 2. Ver "Configuración de cobro".
- **Archivo o pantalla sugerida:** Cobros / Nueva facturación (a investigar)
- **Elemento:** `input[type=checkbox]` AFIP, `checked=true` al cargar.

#### Error 2: Paciente nuevo sin vacunas figura "Al día"
- **Detectado en:** Administrador · Camino feliz · Escritorio
- **¿Qué pasó?:** Mateo Prueba sin dosis mostraba estado "Al día" y cobertura 0%. Después de cargar una dosis pasó a 100%. Un paciente sin vacunas debería figurar "Sin datos" o "Pendiente".
- **Pasos:** 1. Pacientes → Control de vacunas. 2. Elegir un paciente sin dosis.
- **Archivo o pantalla sugerida:** Control de vacunas / vaccineService (a investigar)

#### Error 3: Autor de la consulta inconsistente
- **Detectado en:** Administrador · Camino feliz · Escritorio
- **¿Qué pasó?:** Una consulta nueva guardada desde la ficha figura como "Dr. J. Silva". Las consultas históricas figuran como "ADM". En Clínica, el campo "Veterinario asignado" aparece vacío. Parece un autor fijo en el código y no el usuario logueado.
- **Pasos:** 1. Ficha de Mateo Prueba. 2. Guardar una consulta. 3. Ver "Consultas anteriores".
- **Archivo o pantalla sugerida:** Ficha de paciente / guardado de consulta (a investigar)

### 🟢 Errores Bajos

#### Error 4: Guardar consulta en Clínica con las notas vacías no da feedback
- **Detectado en:** Administrador · Caso borde · Datos
- **¿Qué pasó?:** Al presionar "Guardar consulta" sin notas no apareció ningún mensaje y la pantalla no cambió. No se verificó si se guardó un registro vacío.
- **Archivo o pantalla sugerida:** Clínica / Registrar consultas (a investigar)

#### Error 5: Inputs de Cobros con fuente menor a 16 px en mobile
- **Detectado en:** Administrador · Celular 390px
- **¿Qué pasó?:** 6 campos de Cobros tienen fuente menor a 16 px. iPhone hace zoom automático al tocarlos.
- **Elemento:** `input, select` en Cobros → Nueva facturación.

#### Error 6: Botones de acción pequeños en tablas (mobile)
- **Detectado en:** Administrador · Celular 390px
- **¿Qué pasó?:** Inventario (15) y Proveedores (10) tienen botones o inputs menores a 36 px. Es difícil tocarlos con el dedo.

---

## 3. Casos Borde

| # | Perfil | Categoría | Qué se hizo | Esperado | Obtenido | Resultado |
|---|---|---|---|---|---|---|
| 1 | Admin | Datos | Producto `QA-TEST Negativo` con stock -5 y precio -100 | Rechazo | Bloqueado por validación del navegador (valor ≥ 0). No se verificó el servidor. | ✅ |
| 2 | Admin | Datos | Guardar consulta con notas vacías | Mensaje de validación | Sin feedback visible | ❌ (Error 4) |

- **Casos propuestos y no ejecutados:** edición de datos de Mateo Prueba (nombre vacío, peso negativo), vacuna con fecha futura, turno de peluquería superpuesto, acceso directo por URL como Veterinario o Peluquero (sin credenciales), cobro con ítems y AFIP (necesita OK).
- **Registros de prueba creados (para limpiar):**
  - Consulta `QA-TEST consulta de prueba…` en Mateo Prueba.
  - Dosis SÉXTUPLE CANINA (hoy) en Mateo Prueba.
  - Turno de peluquería hoy 10:00, Baño Perro chico, Mateo Prueba.
  - Producto `QA-TEST Producto`.
  - Servicio `QA-TEST Servicio`.
  - Posible consulta vacía (Error 4), a confirmar en la ficha.

---

## 4. Responsive y Mobile
- **Veredicto mobile:** Usable, con detalles menores.
- **Meta viewport:** presente y correcto (`width=device-width, initial-scale=1.0`).
- **Anchos realmente probados:** 390px (todos los módulos) y 1366px. Tablet 768px y 360px no se probaron.

| Pantalla | Celular | Escritorio |
|---|---|---|
| Pacientes | ✅ | ✅ |
| Clínica | ✅ | ✅ |
| Peluquería | ✅ | ✅ |
| Inventario | ⚠️ botones chicos | ✅ |
| Cobros | ⚠️ inputs < 16px | ✅ |
| WhatsApp | ✅ | ✅ |
| Proveedores | ⚠️ botones chicos | ✅ |

- **Peso y carga:**
  - Carga completa: ~3,8 s.
  - Bundle JS: 694 KB (por debajo del umbral de 1 MB).
  - Medición hecha sobre producción, pero con red del evaluador.
- **No cubierto:** táctil real, red móvil. El happy path completo en mobile no se repitió.

---

## 5. Mejoras de UX/UI
**Quick wins:** 1, 2, 3.

1. **Desmarcar AFIP por defecto, o pedir confirmación al emitir.** Impacto Alto / Esfuerzo S. Cobros.
2. **No preseleccionar un paciente real en el modal "Agendar turno" (hoy VALKIRIA); dejar "Seleccione paciente".** Impacto Medio / Esfuerzo S. Peluquería.
3. **Agregar buscador en Inventario → Servicios (71 servicios en 4 páginas; Productos sí lo tiene).** Impacto Medio / Esfuerzo S.
4. **Mostrar los servicios de peluquería filtrados por especie del paciente (hoy solo "Perro" aun para felinos).** Impacto Medio / Esfuerzo M.
5. **Los productos nuevos no aparecen arriba en el listado; mostrar toast de confirmación y ordenar por creación.** Impacto Bajo / Esfuerzo S.

Nota: los selectores de paciente cierran el desplegable al hacer clic o escribir con el mouse en el buscador. Puede ser un artefacto del navegador integrado y no se cuenta como error.

---

## 6. Tests Unitarios
- **Runner:** Vitest.
- **Suite existente:** 323 tests, 27 archivos: 323 pasan, 0 fallan.
- **Cobertura:** no medida en esta corrida.
- **Tests nuevos escritos:** ninguno.
