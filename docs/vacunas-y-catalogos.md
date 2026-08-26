## Vacunas y Catálogo por Clínica

**Qué hace:** 
Gestiona el catálogo personalizado de vacunas que ofrece la clínica y el registro de dosis aplicadas a cada paciente, calculando automáticamente las fechas de vencimiento y próximas aplicaciones.

**Escenarios cubiertos:**
- Configuración de vacunas por clínica: Nombre y frecuencia de vencimiento (medida en días).
- Registro de dosis aplicada: Selección de la vacuna del catálogo, fecha de aplicación (por defecto hoy) y cálculo automático de fecha de vencimiento (`fecha_aplicacion + dias_frecuencia`).
- Modificación manual de fecha límite si la condición del paciente o el protocolo del veterinario lo exige.
- Registro opcional de lote y observaciones.
- Panel de control de vacunas al día, próximas a vencer y vencidas.

**Casos borde conocidos:**
- Ajuste manual de vencimiento: Prevalece el valor especificado por el profesional sobre el cálculo automático.
- Vacuna fuera del catálogo: Se debe agregar previamente la vacuna al catálogo de la clínica antes de aplicarla.

**Restricciones o supuestos:**
- En la etapa 1 se omiten los avisos automáticos salientes por WhatsApp, manteniendo el estado de recordatorio visible en el panel.
