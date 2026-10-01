## Vacunas y Catálogo por Clínica

**Qué hace:** 
Gestiona el catálogo personalizado de vacunas que ofrece la clínica, el registro de dosis aplicadas a cada paciente, el cálculo de **Cobertura Actual** según vacunas necesarias, la asignación automática del profesional activo y la generación de recordatorios para tutores.

**Formato de Mensaje de Recordatorio (WhatsApp / SMS):**
```text
Hola (Nombre tutor), te recordamos que la vacuna (Nombre vacuna) para (Nombre paciente) vence el (Dia de vencimiento) podemos agendar una visita para poner a (Nombre paciente) al día!
```

**Escenarios cubiertos:**
- **Cálculo de Próximo Refuerzo / Vencimiento en Vacunas Requeridas:** Cuando una vacuna requerida se marca como `aplicada`, la tarjeta del paciente en su perfil y en el control de vacunas muestra la fecha de aplicación (`Aplicada: DD/MM/AAAA`) y calcula de forma automática la fecha del **Próximo refuerzo** (`Próximo refuerzo: DD/MM/AAAA`). Esta fecha se obtiene a partir de la dosis registrada en el historial del paciente (`expirationDate`) o calculando `appliedDate + frequencyDays` (según catálogo o 365 días por defecto).
- **Estado Global de Vacunación del Paciente (`getPatientVaccineGlobalStatus`):**
  - **Sin datos (`sin_datos`):** Para pacientes nuevos sin dosis aplicadas en su historial y sin vacunas requeridas asignadas, el sistema muestra la etiqueta **"Sin datos"** con badge gris neutro (`text-slate-600 bg-slate-100`) y cobertura 0%, indicando claramente que aún no posee registros sanitarios (evitando catalogarlo erróneamente como "Al día").
  - **Pendiente (`pendiente`):** Cuando el paciente posee vacunas requeridas programadas a futuro cuya fecha límite aún no ha vencido, se indica con badge ámbar **"Pendiente"**.
  - **Vencida (`vencida`):** Si posee dosis aplicadas expiradas o vacunas requeridas cuya fecha sugerida ya pasó, se destaca con badge rojo **"Vencida"**.
  - **Al día (`al_dia`):** Se muestra con badge verde únicamente cuando todas sus vacunas vigentes están aplicadas y dentro de su período de validez.
- **Cobertura Actual y Vigencia Sanitaria:** Se calcula en función del estado de vigencia real de las vacunas a la fecha actual (`currentDate`):
  - Para pacientes con **vacunas requeridas**: solo contabilizan como cubiertas aquellas vacunas aplicadas cuya fecha de próximo vencimiento no ha expirado (`vencimiento >= hoy`). Si todas están vencidas o pendientes, la cobertura es **0%**.
  - Para pacientes con **historial de dosis**: se evalúa la última aplicación de cada tipo único de vacuna registrada. Si todas las últimas dosis se encuentran vencidas (por ejemplo, aplicaciones de años anteriores sin refuerzo vigente), la cobertura sanitaria es **0%** e indica *"0 de X vacunas al día (todas vencidas)"*.
  - La barra y el porcentaje adoptan colores semánticos: verde (100% al día), rojo (0% al día / vencidas) y lila/ámbar para coberturas parciales.
- **Eliminación en Cascada del Historial:** Al desmarcar o remover una vacuna aplicada del esquema del paciente, el registro de la dosis correspondiente se elimina de forma inmediata del Historial de Vacunación y de la base de datos Supabase (`vetsoft_dosis_vacunas`).
- **Profesional por Defecto:** El campo "Profesional / Veterinario" en los formularios de consulta, vacunación y agenda toma por defecto el nombre del usuario activo con sesión iniciada (`userSession.name`).
- Configuración de vacunas por clínica: Nombre y frecuencia de vencimiento (medida en días).
- Registro de dosis aplicada: Selección de la vacuna del catálogo, fecha de aplicación y cálculo automático de vencimiento.
- Tabla de historial de vacunación:
  - Columna **Vencimiento**: Muestra las etiquetas `Al día` (en verde) o `Vencida` (en rojo).
  - Columna **Estado**: Muestra las etiquetas `Aplicada` o `Pendiente`.

**Operaciones CRUD y Sincronización en Base de Datos:**
- **Catálogo de Vacunas (`public.vetsoft_vacunas_catalogo`):** Permite **Agregar**, **Editar** y **Eliminar** ítems del catálogo general, sincronizando en tiempo real con Supabase.
- **Dosis Aplicadas (`public.vetsoft_dosis_vacunas`):** Inserta (`insertVaccineDosisToSupabase`) y elimina (`deleteVaccineDosisFromSupabase` / `deleteVaccineDosesByPatientAndVaccineFromSupabase`) las dosis aplicadas del historial y la base de datos.
- **Detección Dinámica y Consistencia de Recordatorios:** El panel de recordatorios y la tarjeta de "Próxima aplicación" evalúan dinámicamente si el paciente tiene dosis aplicadas vencidas/por vencer o vacunas requeridas en estado `pendiente`. Si el paciente no posee dosis pendientes ni vacunas requeridas, se muestra el estado "Sin recordatorios pendientes" y "Todas las vacunas están al día", eliminando cualquier recordatorio artificial o datos hardcodeados inventados.

- **Navegación Móvil Master-Detail y Acceso a Ficha Médica:**
  - En dispositivos móviles (`< md`), la interfaz de Control de Vacunas presenta inicialmente el listado de pacientes gestionados.
  - Al presionar cualquier paciente del listado, la pantalla cambia al detalle del carnet y control de vacunas del paciente seleccionado.
  - En la cabecera del detalle se incluye el botón **`← Volver a la lista de pacientes`** para regresar al listado rápidamente.
  - Asimismo, se incluye el botón **`Ficha médica`** en el encabezado para acceder a la historia clínica integral del paciente con un solo toque.

**Catálogo Estándar de Biológicos e Inmunizaciones Configurado:**
- **Caninos:**
  - `SÉXTUPLE CANINA` (365 días / 12 meses)
  - `ANTIRRÁBICA` (365 días / 12 meses)
  - `QUÍNTUPLE CANINA` (365 días / 12 meses)
  - `PUPPY DP / PRIMOVACUNACIÓN` (30 días / 1 mes)
  - `TOS DE LAS PERRERAS / KC` (365 días / 12 meses)
  - `GIARDIA CANINA` (365 días / 12 meses)
  - `CORONAVIRUS CANINO` (365 días / 12 meses)
  - `LEPTOSPIROSIS REFUERZO` (180 días / 6 meses)
- **Felinos:**
  - `TRIPLE FELINA` (365 días / 12 meses)
  - `LEUCEMIA FELINA` (365 días / 12 meses)
  - `PANLEUCOPENIA` (365 días / 12 meses)
- **Preventivos / Antiparasitarios:**
  - `ANTIPARASITARIA INTERNA` (90 días / 3 meses)
  - `ANTIPARASITARIA EXTERNA (Pipeta / Comprimido)` (30 días / 1 mes)
  - `ANTICONCEPTIVA` (150 días / 5 meses)
  - `ANTITETÁNICA` (365 días / 12 meses)

**Casos borde conocidos:**
- **Paciente sin vacunas previas:** No muestra recordatorios ficticios; la tarjeta de próxima aplicación ofrece agendar control preventivo general.

**Garantías de persistencia — Error 7 (corregido 01/10/2026):**
- `handleRegisterDosis` en `App.tsx` es ahora `async`. Aguarda el resultado de `insertVaccineDosisToSupabase` antes de actualizar el estado local.
- Si la escritura a Supabase falla, **no se modifica el estado local** (la dosis no aparece en pantalla) y se muestra el modal de error de notificación (`AppNotificationModal` con `type: 'error'`).
- `insertVaccineDosisToSupabase` en `supabaseService.ts` realiza un **upsert previo** en `vetsoft_catalogo_vacunas` (tabla objetivo del FK) antes de insertar en `vetsoft_dosis_vacunas`. Esto garantiza que la restricción `vetsoft_dosis_vacunas_vaccine_id_fkey` nunca falle por IDs de catálogo no presentes en la tabla legacy, independientemente de si el ID viene del catálogo local o fue generado en runtime.

