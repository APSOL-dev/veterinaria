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
   - La función `updatePatientRecord` en `patientService.ts` procesa la modificación y refresca la lista global de pacientes y el estado de la vista en tiempo real.
