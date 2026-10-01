## Gestión y Edición de Datos de Pacientes (Ficha Médica)

**Qué hace:** 
Este documento define el flujo de visualización y edición directa de los datos clínicos de la mascota desde el módulo **Ficha de Pacientes**.

**Edición de Datos de Mascota y Evolución de Peso:**
1. **Acceso al Formulario y Botón de Peso:**
   - En la tarjeta principal del paciente (Pet Hero Card) de la **Ficha Médica**, se muestra la pastilla interactiva **"Peso: X.X kg"** con indicador de tendencia histórica (+X.X kg / -X.X kg / Estable).
   - Al hacer clic sobre la pastilla de peso se abre el modal de **Historial y Evolución de Peso**, permitiendo registrar un nuevo pesaje rápido o consultar la tabla con todas las fechas y variaciones previas.
   - Botón **"Editar datos del paciente"** para modificar todos los datos clínicos de forma integral.
2. **Campos Editables:**
   - Nombre de la mascota
   - Especie (Canino, Felino, Ave, Roedor, Reptil, Otro)
   - Raza
   - Sexo (Macho, Hembra, Indeterminado)
   - Fecha de Nacimiento
   - Peso actual en kg (actualiza automáticamente el historial de evolución ponderal `weight_history` si cambia)
   - Alertas médicas y alergias conocidas
3. **Persistencia y Actualización:**
   - La función `updatePatientRecord` en `patientService.ts` procesa la modificación y refresca la lista global de pacientes.
   - La función `updatePatientInSupabase` en `supabaseService.ts` persiste automáticamente en la tabla `vetsoft_pacientes` y `vetsoft_tutores` todos los cambios de datos personales, peso (`weight_kg`), historial ponderal (`weight_history` JSONB) y alertas clínicas.

**Listado y Búsqueda de Pacientes (Últimos 15 gestionados):**
- **Vista por defecto:** Tanto en la barra lateral del Vacunatorio (`VaccinesView`) como en el selector desplegable (`SearchablePatientSelect`), se muestran de forma predeterminada los **últimos 15 pacientes gestionados/recientes** para evitar listas kilométricas y optimizar el rendimiento.
- **Búsqueda global:** Al escribir en la barra de búsqueda (por nombre de mascota, tutor, raza o especie), el sistema busca y filtra inmediatamente sobre la **totalidad de los pacientes registrados en la base de datos**.
- **Preservación del paciente activo:** Si el paciente actualmente seleccionado no forma parte de los primeros 15, el sistema lo incluye automáticamente para mantener su selección y contexto visibles.

**Desplegable Buscable de Pacientes y Tutores (`SearchablePatientSelect`):**
- **Funcionalidad:** Reemplaza todos los selectores simples de pacientes/tutores en la aplicación (Ficha de Pacientes, Nueva Consulta, Agenda Médica, Agenda Peluquería, Cobros / POS).
- **Búsqueda en Tiempo Real:** Permite escribir cualquier fragmento del nombre del paciente, especie, raza o nombre del tutor/dueño.
- **Filtrado Dinámico:** Filtra al instante las opciones disponibles mediante `getRecentOrFilteredPatients` / `filterPatients` y formatea la etiqueta mediante `formatPatientOptionLabel`.
- **Accesibilidad y Usabilidad:** Soporta autoenfocado, cierre al hacer clic fuera y resaltado del paciente actualmente seleccionado.
**Persistencia Estricta y Notificaciones al Usuario:**
- Al crear o editar un paciente o tutor, el sistema valida la respuesta de la base de datos Supabase. Si la inserción es exitosa, se incorpora al estado y se muestra una notificación de éxito. Si ocurre un error de permisos o conexión, el sistema cancela la incorporación local, no simula un guardado falso y notifica al usuario con un mensaje claro en lenguaje natural.

**Exportación de Historia Clínica (PDF / Impresión) y Adaptabilidad Mobile:**
- **Modal Visor y Descarga:** Permite previsualizar la historia clínica completa del paciente (resumen, alertas, evolución, consultas médicas, recetas emitidas y plan sanitario), descargar el PDF o imprimirlo.
- **Encabezado y Formato Oficial:** Encabezado limpio con título institucional y fecha de emisión.
- **Espacio para Firma y Sello:** Ubicado sobre el margen derecho del pie de página con espacio vertical despejado (`pt-16`) para firma manuscrita y sello del profesional actuante.
- **Capa y superposición (`z-[70]`):** La ventana emergente se posiciona por encima del encabezado y navegación de la app para evitar que el header la tape en celulares.
- **Scroll y disposición vertical en pantallas móviles:** En pantallas pequeñas (360px–390px), el contenedor utiliza `items-start`, padding superior adaptado (`pt-6 sm:pt-10`) y scroll vertical (`overflow-y-auto`), apilando los datos del tutor, botones de acción y bloques en una sola columna para garantizar que el título, botón de cierre y contenido sean 100% accesibles y legibles sin cortes ni desbordes.





