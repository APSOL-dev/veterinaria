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

- **Cuenta Corriente (CC) del Tutor:**
  - Los cobros/comprobantes generados a un tutor solo se registran en los movimientos de su Cuenta Corriente (`Debe` y cálculo de `Saldo`) cuando el medio de pago seleccionado es **Cuenta Corriente** (`paymentMethod: 'cuenta-corriente'`).
  - Los cobros realizados en Efectivo, Tarjeta o Transferencia no impactan como deuda en la Cuenta Corriente del tutor.

**Casos borde conocidos:**
- **Tutores sin teléfono o sin dirección:** Se guarda el valor por defecto legible ("Sin teléfono" / "Sin dirección registrada") sin romper el formato ni causar errores nulos en base de datos.
- **Creación de nueva mascota:** Genera automáticamente un ID persistible (`patient-timestamp-rand`) vinculado al `owner_id` del tutor actual y ejecuta `insertPatientToSupabase`.
- **Cobros con Medios de Pago Inmediatos:** Los comprobantes emitidos con medio de pago `efectivo`, `tarjeta` o `transferencia` quedan excluidos de los cargos en Cuenta Corriente para no inflar saldos deudores de tutores que ya abonaron.

**Restricciones o supuestos:**
- Al cambiar el nombre o la dirección del tutor, se actualizan automáticamente todos los registros de pacientes y movimientos de cuenta corriente vinculados a ese `owner_id`.
