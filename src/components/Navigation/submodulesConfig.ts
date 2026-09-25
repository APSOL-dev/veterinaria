import { ActiveModule } from './Sidebar';

export interface SubmoduleConfig {
  id: string;
  label: string;
  icon: string;
}

export const getSubmodulesForModule = (activeModule: ActiveModule): SubmoduleConfig[] => {
  switch (activeModule) {
    case 'proveedores':
      return [
        { id: 'facturas', label: 'Resumen y Facturas', icon: 'receipt' },
        { id: 'presupuestos', label: 'Registrar gastos', icon: 'payments' },
        { id: 'cuentas', label: 'Cuentas corrientes', icon: 'account_balance' },
      ];
    case 'clinica':
      return [
        { id: 'fichas-medicas', label: 'Registrar consultas', icon: 'stethoscope' },
        { id: 'vacunas', label: 'Vacunas', icon: 'vaccines' },
        { id: 'calendario-clinica', label: 'Calendario de clínica', icon: 'calendar_month' },
      ];
    case 'peluqueria':
      return [
        { id: 'calendario-peluqueria', label: 'Gestionar calendario', icon: 'content_cut' },
      ];
    case 'pacientes':
      return [
        { id: 'ficha-pacientes', label: 'Pacientes', icon: 'pets' },
        { id: 'tutores', label: 'Tutores', icon: 'badge' },
        { id: 'control-vacunas', label: 'Control de vacunas', icon: 'vaccines' },
      ];
    case 'inventario':
      return [
        { id: 'productos-fisicos', label: 'Productos', icon: 'inventory_2' },
        { id: 'servicios-catalogo', label: 'Servicios', icon: 'medical_services' },
      ];
    case 'cobros':
      return [
        { id: 'nueva-facturacion', label: 'Nueva facturación', icon: 'point_of_sale' },
        { id: 'historial-cobros', label: 'Historial de cobros', icon: 'receipt_long' },
      ];
    default:
      return [];
  }
};
