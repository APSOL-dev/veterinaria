# Hoja de Ruta para Funcionalidad Completa y Conexión a Base de Datos (VETSOFT)

## 1. Estado Actual de Módulos y Submódulos

| Módulo | Submódulo | Estado Frontend | Estado Datos Actual |
| :--- | :--- | :--- | :--- |
| **Pacientes** | `ficha-pacientes` | Completo (Búsqueda, Perfil, Historial Peso, Alertas) | React State (`initialPatients`) |
| **Pacientes** | `tutores` | Completo (Desglose Propietarios, Mascotas a cargo) | Derivado de Patients |
| **Pacientes** | `control-vacunas` | Completo (Semáforo de Vigencia, Filtros) | React State (`initialVaccineDoses`) |
| **Clínica** | `fichas-medicas` | Completo (Notas Clínicas, Receta, Adjuntos Drag&Drop) | React State (`initialClinicalNotes`) |
| **Clínica** | `vacunas` | Completo (Registro Dosis con Lote/Vencimiento) | React State (`initialVaccineCatalog`) |
| **Clínica** | `calendario-clinica` | Completo (Agenda Médica, Estados de Turnos) | React State (`initialMedicalAppointments`) |
| **Peluquería** | `calendario-peluqueria` | Completo (Agenda Peluquería, Precios, Estados) | React State (`initialGroomingAppointments`) |
| **Proveedores** | `facturas` | Completo (Carga Auto/Manual, Webhook, Filtro Pagos) | React State (`initialSupplierBills`) |
| **Proveedores** | `presupuestos` | Completo (Gestión de Presupuestos, Estados) | React State (`initialSupplierQuotes`) |
| **Inventario** | `productos-fisicos` | Completo (Stock, Ajustes, Alertas Stock Bajo) | React State (`initialProducts`) |
| **Inventario** | `servicios-catalogo` | Completo (Lista de Precios, Servicios Clínicos/Peluquería) | React State (`initialServicesCatalog`) |
| **Cobros** | `nueva-facturacion` | Completo (Punto de Venta POS, Carrito, IVA, Checkout) | React State (`initialReceipts`) |
| **Cobros** | `historial-cobros` | Completo (Historial Recibos, Filtro Métodos Pago) | React State (`initialReceipts`) |

---

## 2. Acciones para Garantizar 100% de Funcionalidad Antes de la Base de Datos

### A. Implementar Capa de Servicios / Repositorios (Repository Pattern)
Actualmente los componentes y `App.tsx` leen directamente de `initialMockData`. Para que la conexión a la base de datos sea inmediata y transparente:
1. Crear una interfaz genérica de almacenamiento en `src/domain/repositories/`:
   - `PatientRepository`
   - `ConsultationRepository`
   - `InventoryRepository`
   - `BillingRepository`
   - `SupplierRepository`
2. Crear la implementación `LocalStorageRepository` que guarde y lea de `window.localStorage`.
3. Esto permitirá que la app sea **100% funcional y persistente entre recargas de pantalla** hoy mismo.

### B. Validaciones y Manejo de Errores en Formularios
- Garantizar que ningún formulario admita campos obligatorios vacíos (`required` HTML5 + validación en servicios).
- Asegurar sanitización de entradas numéricas (cantidades, precios, IVA, importes) para evitar `NaN` o desbordamientos.

---

## 3. Plan de Conexión a Base de Datos (Supabase / PostgreSQL)

Cuando decidas conectar la base de datos:

1. **Creación del Esquema Relacional:**
   - Tablas principales: `tutores`, `pacientes`, `consultas_clinicas`, `catalogo_vacunas`, `dosis_vacunas`, `turnos_clinica`, `turnos_peluqueria`, `productos`, `catalogo_servicios`, `facturas_proveedores`, `presupuestos_proveedores`, `recibos`, `detalle_recibos`, `gastos`.
   - Claves foráneas (FK) e índices para búsquedas por `patient_id`, `owner_id`, `cuit`.

2. **Reemplazo Transparente del Repositorio:**
   - Sustituir la implementación de `LocalStorageRepository` por `SupabaseRepository` utilizando el cliente de Supabase / REST client.
   - El frontend (`App.tsx` y los componentes de vista) no sufrirá ningún cambio en su lógica de UI.

3. **Habilitación de Autenticación RLS (Row Level Security):**
   - Configurar políticas en la base de datos para restringir accesos según los roles existentes (Veterinario, Recepcionista, Administrador).
