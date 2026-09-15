## Gestión y Edición de Datos de Pacientes (Ficha Médica)

**Qué hace:** 
Este documento define el flujo de visualización y edición directa de los datos clínicos de la mascota desde el módulo **Ficha de Pacientes**.

**Edición de Datos de Mascota:**
1. **Acceso al Formulario:**
   - En la tarjeta principal del paciente (Pet Hero Card) de la **Ficha Médica**, se incluye el botón **"Editar Mascota"**.
2. **Campos Editables:**
   - Nombre de la mascota
   - Especie (Canino, Felino, Ave, Roedor, Reptil, Otro)
   - Raza
   - Sexo (Macho, Hembra, Indeterminado)
   - Fecha de Nacimiento
   - Peso actual en kg (actualiza automáticamente el historial de evolución ponderal si cambia)
   - Alertas médicas y alergias conocidas
3. **Persistencia y Actualización:**
   - La función `updatePatientRecord` en `patientService.ts` procesa la modificación y refresca la lista global de pacientes.
   - La función `updatePatientInSupabase` en `supabaseService.ts` persiste automáticamente en la tabla `vetsoft_pacientes` y `vetsoft_tutores` todos los cambios de datos personales, peso, historial ponderal y alertas clínicas.

**Desplegable Buscable de Pacientes y Tutores (`SearchablePatientSelect`):**
- **Funcionalidad:** Reemplaza todos los selectores simples de pacientes/tutores en la aplicación (Ficha de Pacientes, Nueva Consulta, Agenda Médica, Agenda Peluquería, Cobros / POS).
- **Búsqueda en Tiempo Real:** Permite escribir cualquier fragmento del nombre del paciente, especie, raza o nombre del tutor/dueño.
- **Filtrado Dinámico:** Filtra al instante las opciones disponibles mediante `filterPatients` y formatea la etiqueta mediante `formatPatientOptionLabel`.
- **Accesibilidad y Usabilidad:** Soporta autoenfocado, cierre al hacer clic fuera y resaltado del paciente actualmente seleccionado.
- **Disposición en Cabecera:** En la Ficha del Paciente, el botón **"+ Nuevo paciente"** se posiciona en la misma fila a la derecha del selector desplegable buscable (`flex-nowrap`), garantizando una navegación limpia sin saltos de línea.


