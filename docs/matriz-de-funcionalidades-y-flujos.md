# Matriz de Funcionalidades, Botones y Conexiones entre Módulos (VETSOFT)

Este documento detalla todas las funcionalidades interactivas, acciones de botones y conexiones transversales entre módulos y submódulos en la aplicación.

---

## 1. Conexiones Transversales entre Módulos

```
 [ Pacientes & Tutores ] ──(1. Nueva Consulta)──> [ Clínica (Fichas Médicas) ]
           │                                                │
           ├──(2. Control Vacunas)──────────────> [ Vacunas / Dosis ]
           │                                                │
           └──(3. Cobrar Servicios)─────────────┐           │
                                                ▼           ▼
 [ Proveedores (Facturas) ] ──(Entrada Stock)──> [ Inventario & Servicios ] ──(Stock Actualizado)──> [ Cobros / POS (Facturación) ]
                                                                                                            │
                                                                                                            ▼
                                                                                                  [ Historial de Cobros ]
```

---

## 2. Inventario de Botones y Acciones por Módulo

### 🐶 Módulo: Pacientes & Tutores
- **Submódulo `ficha-pacientes`:**
  - **`+ Nuevo Paciente`**: Abre el modal `NewPatientModal` para alta rápida (Nombre, Especie, Raza, Sexo, Peso, WhatsApp del dueño).
  - **`+ Nueva Consulta`**: Deriva directamente a **Clínica $\rightarrow$ Fichas Médicas** preseleccionando el paciente activo.
  - **`+ Aplicar Vacuna`**: Abre el modal de aplicación rápida de vacuna en la ficha.
  - **`WhatsApp` (Acción rápida)**: Inicia chat directo vía `wa.me/` con el dueño.
  - **`Imprimir / Exportar Ficha`**: Dispara la vista de impresión nativa de la ficha clínica.
- **Submódulo `tutores`:**
  - **`Ver Mascotas`**: Expande el listado de mascotas del dueño y permite saltar directamente a la ficha del paciente.
- **Submódulo `control-vacunas`:**
  - **`+ Registrar Dosis`**: Registra la aplicación con número de lote y fecha de vencimiento.

---

### 🩺 Módulo: Clínica Veterinaria
- **Submódulo `fichas-medicas`:**
  - **`Guardar Consulta`**: Almacena el diagnóstico y anamnesis en la ficha del paciente.
  - **`Generar Receta`**: Habilita el panel de prescripción médica con posología y fármacos.
  - **`Guardar y Generar Receta`**: Guarda la consulta e imprime/despliega la receta médica para el tutor.
  - **`Adjuntar Archivos / Drag & Drop`**: Permite seleccionar o arrastrar análisis de laboratorio, placas y ecografías (.PDF, .PNG, .JPG).
- **Submódulo `calendario-clinica`:**
  - **`+ Nuevo Turno Médico`**: Agenda cita médica especificando hora, motivo y paciente.
  - **`Cobrar Turno`**: Deriva el servicio al Punto de Venta (POS) en **Cobros**.

---

### ✂️ Módulo: Peluquería Canina
- **Submódulo `calendario-peluqueria`:**
  - **`+ Nuevo Turno Peluquería`**: Registra turno con tipo de servicio (Baño, Corte, Desmotado).
  - **`Cambiar Estado`**: Modifica estado (Pendiente $\rightarrow$ En Proceso $\rightarrow$ Completado).
  - **`Cobrar Servicio`**: Envía el turno al módulo de **Cobros** precalculando la tarifa.

---

### 📦 Módulo: Inventario & Servicios
- **Submódulo `productos-fisicos`:**
  - **`+ Nuevo Producto`**: Alta de ítems de stock con SKU, categoría, precio y stock mínimo.
  - **`Ajustar Stock`**: Incrementa o descuenta inventario registrando el motivo.
  - **`Alerta de Stock Bajo`**: Dispara el modal automático al iniciar sesión si hay ítems por debajo del stock mínimo.
- **Submódulo `servicios-catalogo`:**
  - **`+ Nuevo Servicio`**: Agrega tarifas al catálogo de peluquería o clínica médica.

---

### 🧾 Módulo: Proveedores & Compras
- **Submódulo `facturas`:**
  - **`+ Registrar Factura`**: Despliega el panel lateral derecho (`NewInvoiceDrawer`).
  - **`Procesar factura`**: Envía el archivo adjunto al Webhook para autocompletar proveedor, CUIT, importes e IVA.
  - **`Cargar otra factura`**: Resetea el formulario para subir otro comprobante secuencialmente.
  - **`Cancelar`**: Cierra el panel deslizante.
  - **`Registrar cobros`**: Botón de navegación rápida hacia **Cobros**.
  - **`Registrar vacunas`**: Botón de navegación rápida hacia **Control de Vacunas**.

---

### 💳 Módulo: Cobros & Facturación
- **Submódulo `nueva-facturacion` (POS):**
  - **`Buscar / Seleccionar Paciente`**: Vincula la venta a un cliente/paciente.
  - **`Agregar Producto / Servicio`**: Añade ítems al carrito con cálculo automático de IVA y subtotal.
  - **`Procesar Pago`**: Emite la factura/recibo (Efectivo, Tarjeta, Transferencia), registra la venta y **descuenta automáticamente el stock** en Inventario.
- **Submódulo `historial-cobros`:**
  - **`Ver Recibo / Imprimir`**: Muestra el desglose del comprobante cobrado.
