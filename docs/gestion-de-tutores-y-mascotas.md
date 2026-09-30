## Gestión y Edición de Tutores y Sus Mascotas

**Qué hace:**
Gestión centralizada del padrón de tutores (propietarios) y sus mascotas asociadas desde el módulo Tutores / Pacientes.

**Escenarios cubiertos:**
- **Persistencia en Base de Datos (Supabase):**
  - La vista SQL `vetsoft_vw_pacientes` realiza un `LEFT JOIN` con la tabla `vetsoft_tutores` en base al `owner_id`.
  - Los datos del tutor (Nombre, Teléfono/WhatsApp, Dirección) y de las mascotas se persisten en `vetsoft_tutores` y `vetsoft_pacientes`.
- **Edición Integral de Tutores:**
  - Nombre completo (`ownerName`).
  - Número de teléfono o WhatsApp (`ownerPhone`).
  - Dirección física (`address`).
- **Edición de Mascotas Existentes:**
  - Modificación individual de Nombre, Especie, Raza, Sexo, Fecha de Nacimiento y Peso (kg) para cada mascota del tutor.
- **Alta Directa de Nueva Mascota:**
  - Sección en el modal para vincular una nueva mascota al tutor actual sin necesidad de salir del módulo.
- **Rendimiento y Carga Optimizada:**
  - En lugar de renderizar cientos de tutores simultáneamente en el DOM y calcular cuentas corrientes pesadas en cada render, la vista despliega los primeros 20 tutores más recientes de forma instantánea y calcula la deuda en memoria únicamente para los elementos visibles, permitiendo búsqueda fluida y sin demoras en todo el padrón al tipear en la barra.

- **Cuenta Corriente (CC) del Tutor:**
  - Los cobros/comprobantes generados a un tutor solo se registran en los movimientos de su Cuenta Corriente (`Debe` y cálculo de `Saldo`) cuando el medio de pago seleccionado es **Cuenta Corriente** (`paymentMethod: 'cuenta-corriente'`).
  - Los cobros realizados en Efectivo, Tarjeta o Transferencia no impactan como deuda en la Cuenta Corriente del tutor.
  - **Distinción visual de Saldos Positivos, Negativos y Neutros:**
    - **Saldo Deudor / Deuda (`saldo > 0`):** Se muestra claramente en **Rojo** (`text-red-700`) indicando el monto adeudado.
    - **Saldo a Favor / Crédito (`saldo < 0`):** Se muestra claramente en **Verde** (`text-[#27AE60]`), indicando el crédito disponible del tutor (`- $ monto`).
    - **Al día (`saldo === 0`):** Se visualiza en tono neutro indicando "Al día (sin saldo pendiente)".
  - **Cálculo de Antigüedad de Deuda / Último Abono ("Hace cuánto no achica la deuda"):**
    - Para tutores con deuda pendiente (`saldo > 0`), el sistema calcula dinámicamente el tiempo transcurrido desde el último abono registrado (`haber > 0`).
    - Informa en tiempo real: *"Último pago hoy"*, *"Último pago ayer"* o *"Último pago hace X días (DD/MM/AAAA)"*.
    - Si el tutor nunca registró un abono, informa *"Sin pagos registrados (deuda desde hace X días)"*.
  - **Consulta y Detalle de Comprobantes al hacer Clic en la CC:**
    - Al hacer clic en cualquier fila de la tabla de movimientos de la Cuenta Corriente, se despliega el modal interactivo de **Detalle de Comprobante / Abono** ([`ComprobanteDetailModal.tsx`](file:///c:/Users/Mateo/Documents/Proyecto%20VETSOFT/src/components/Billing/ComprobanteDetailModal.tsx)).
    - **Si es un comprobante/factura:** Muestra el encabezado oficial (Tipo y Nº de comprobante, CAE AFIP si aplica, fecha, tutor y mascota), desglose detallado de todos los ítems facturados (servicios, productos, cantidad, precio unitario, descuentos), totales discriminados, botón para descargar archivo adjunto/PDF y opción de imprimir.
    - **Si es un abono/pago:** Muestra la fecha de acreditación, concepto, importe recibido y estado computado a favor en la cuenta corriente.

**Casos borde conocidos:**
- **Tutores sin teléfono o sin dirección:** Se guarda el valor por defecto legible ("Sin teléfono" / "Sin dirección registrada") sin romper el formato ni causar errores nulos en base de datos.
- **Creación de nueva mascota:** Genera automáticamente un ID persistible (`patient-timestamp-rand`) vinculado al `owner_id` del tutor actual y ejecuta `insertPatientToSupabase`.
- **Cobros con Medios de Pago Inmediatos:** Los comprobantes emitidos con medio de pago `efectivo`, `tarjeta` o `transferencia` quedan excluidos de los cargos en Cuenta Corriente para no inflar saldos deudores de tutores que ya abonaron.

**Restricciones o supuestos:**
- Al cambiar el nombre o la dirección del tutor, se actualizan automáticamente todos los registros de pacientes y movimientos de cuenta corriente vinculados a ese `owner_id`.
