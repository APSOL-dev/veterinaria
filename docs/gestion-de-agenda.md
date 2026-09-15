## Gestión de Agenda y Calendarios (Área Médica y Peluquería)

**Qué hace:** 
Este módulo muestra el calendario semanal interactivo para el control de turnos tanto del **Área Médica** como de **Peluquería / Estética**.

**Diseño de Grilla e Indicadores Visuales:**
- **Color de Tarjetas de Turno:** Todos los turnos agendados, tanto del Área Médica (Clínica) como de Peluquería/Estética, se visualizan unificados en color verde (`bg-[#F0FDF4]` con bordes e insignias en verde esmeralda `emerald-300`/`emerald-900`), tanto en la tarjeta principal de inicio como en los bloques de continuación horaria.
- **Líneas Punteadas Horizontales:** Cada franja horaria (`08:00` a `19:00`) se separa mediante líneas punteadas (`border-b border-dashed border-purple-300/60`), permitiendo diferenciar visualmente las horas sin saturar la pantalla.
- **Cobertura de Franjas Horarias:** La grilla abarca turnos continuos desde las 08:00 hs hasta las 19:00 hs, garantizando la visibilidad completa de citas programadas en horario vespertino (17:30, 18:00, 18:30).
- **Líneas Verticales Continuas:** Cada columna de día (*LUN 24*, *MAR 25*, *MIÉ 26*, *JUE 27*, *VIE 28*, *SÁB 29*) está delimitada por bordes verticales continuos de definición clara (`border-r border-purple-200`).
- **Encabezados y Contraste:** La barra de días cuenta con un fondo suave de contraste (`#F9F6FC`) e indicadores destacados para el día actual.

**Botones de Cobro de Turnos y Estado:**
- **"Cobrar turno":** Botón limpio sin iconos decorativos. Al hacer clic redirige a la emisión de cobro.
- **"Completado":** Una vez cobrado o completado el turno, el botón morado cambia automáticamente a una etiqueta/botón de color verde (`bg-emerald-600`) con el texto **"Completado"**.
- **Inicialización Limpia y Datos Completos:** La vista de base de datos `vetsoft_vw_turnos_peluqueria` realiza los `JOIN` correspondientes con `vetsoft_pacientes` y `vetsoft_tutores`, garantizando que cada turno muestre el nombre real del paciente y del tutor.
- **Cobro Directo e Integración con Módulo de Cobros:** Al presionar "Cobrar turno" desde peluquería o clínica, el sistema precarga el paciente seleccionado y el ítem de servicio agendado en el formulario de cobro. Una vez completado el cobro, el estado del turno se actualiza a `completed` tanto en memoria como en Supabase DB.

**Modal de Interacción y Gestión de Turnos (Detalle de Cita):**
- **Acceso mediante Clic en Tarjeta:** Al hacer clic en cualquier tarjeta o franja de turno en la grilla semanal (clínica o peluquería), se despliega un modal con la información completa del paciente, tutor, especie, raza, fecha y horario.
- **Detención de Propagación en Cobro:** El botón "Cobrar turno" ejecuta su acción de cobro sin abrir el modal gracias a la detención de propagación de eventos (`e.stopPropagation()`).
- **Solapa 1 — "Registrar anotaciones":** Permite escribir y guardar observaciones, indicaciones o notas médicas asociadas al turno. Se persisten inmediatamente en Supabase (`vetsoft_turnos_clinica` o `vetsoft_turnos_peluqueria`).
- **Solapa 2 — "Cambiar turno":** Permite seleccionar una nueva fecha y hora de inicio para el turno. Al guardar, se recalculan automáticamente la hora de finalización (`endTime`) y la ocupación de bloques en la grilla semanal, persistiéndose en Supabase.
- **Solapa 3 — "Cancelar turno":** Permite cancelar el turno. Al confirmar la cancelación, el turno se elimina por completo de la grilla semanal y de la base de datos Supabase (`vetsoft_turnos_clinica` o `vetsoft_turnos_peluqueria`), liberando inmediatamente la franja horaria ocupada.

**Botón e Historial de Anotaciones:**
- **Ubicación:** Ubicado en la barra superior de controles del módulo de Agenda, al lado del botón "+ Nuevo turno".
- **Historial Contextual por Calendario:** Cuando la vista está en modo **Clínica**, muestra el historial de anotaciones de turnos médicos. Cuando está en modo **Peluquería**, muestra el historial de anotaciones de servicios de estética.
- **Visualización y Búsqueda:** Despliega una lista ordenada de forma descendente por fecha con los datos del paciente, especie, raza, tutor, fecha/hora y la anotación registrada. Incluye un buscador en tiempo real para filtrar rápidamente por paciente, tutor o contenido de la nota.


