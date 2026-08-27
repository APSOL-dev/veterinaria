## Navegación de Accesos Directos

**Qué hace:** 
Gestiona la resolución de redirecciones dinámicas entre módulos y submódulos cuando el usuario presiona los botones de acceso rápido desde la ficha de paciente o menús contextuales.

**Escenarios cubiertos:**
- **Botón `Registrar Vacuna`:** Redirige inmediatamente al módulo **Pacientes** -> submódulo **Control de vacunas** (`activeModule: 'pacientes'`, `activeSubmodule: 'control-vacunas'`).
- **Botón `Registrar Cobro`:** Redirige inmediatamente al módulo **Cobros** -> submódulo **Nueva Facturación** (`activeModule: 'cobros'`, `activeSubmodule: 'nueva-facturacion'`).
- **Botón `Nueva Consulta`:** Redirige al módulo **Clínica** -> submódulo **Registrar consultas** (`activeModule: 'clinica'`, `activeSubmodule: 'fichas-medicas'`).
- **Botón `Agendar Turno`:** Redirige al módulo **Clínica** -> submódulo **Calendario de clínica** (`activeModule: 'clinica'`, `activeSubmodule: 'calendario-clinica'`).

**Casos borde conocidos:**
- **Navegación entre módulos distintos:** Al cambiar de módulo principal (ej: de Pacientes a Cobros), se actualizan simultáneamente la barra lateral y los submódulos superiores en el Header.
