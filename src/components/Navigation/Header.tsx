import React from 'react';
import { ActiveModule } from './Sidebar';

interface HeaderProps {
  activeModule: ActiveModule;
  activeSubmodule: string;
  setActiveSubmodule: (submodule: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarCollapsed?: boolean;
  lowStockCount?: number;
  onToggleAlerts?: () => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  activeModule,
  activeSubmodule,
  setActiveSubmodule,
  searchQuery,
  setSearchQuery,
  isSidebarCollapsed = false,
  lowStockCount = 0,
  onToggleAlerts
}) => {
  const getSubmodules = () => {
    switch (activeModule) {
      case 'proveedores':
        return [
          { id: 'facturas', label: 'Registrar facturas', icon: 'receipt' },
          { id: 'presupuestos', label: 'Registrar gastos', icon: 'payments' },
          { id: 'pagos', label: 'Pagos', icon: 'price_check' },
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
          { id: 'nueva-facturacion', label: 'Nueva Facturación', icon: 'point_of_sale' },
          { id: 'historial-cobros', label: 'Historial de Cobros', icon: 'receipt_long' },
        ];
      default:
        return [];
    }
  };

  const submodules = getSubmodules();

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary-container z-50 flex items-center justify-between shadow-lg pr-md">
      {/* Brand / Logo Section (Abarca el ancho de la sidebar y se separa con línea blanca) */}
      <div className={`h-full flex items-center border-r border-white/60 transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16 justify-center px-xs' : 'w-64 px-md justify-start'
      } shrink-0`}>
        <span className="font-headline-sm text-on-primary text-[19px] tracking-wider font-bold truncate">
          {isSidebarCollapsed ? 'VS' : 'VETSOFT'}
        </span>
      </div>

      {/* Top Header Submodules Bar (Separado con línea blanca del logo) */}
      <nav className="flex items-center gap-xs px-md overflow-x-auto scrollbar-hide flex-1 min-w-0">
        {submodules.map((sub) => {
          const isActive = activeSubmodule === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubmodule(sub.id)}
              className={`px-md py-1.5 rounded-lg transition-all font-label-md text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-secondary text-on-secondary shadow-md font-bold'
                  : 'text-on-primary hover:bg-primary/40'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{sub.icon}</span>
              <span>{sub.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Search Input */}
      <div className="flex-1 max-w-sm px-md hidden md:block">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute left-3 text-on-primary-container text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-primary/20 border-none rounded-lg py-1.5 pl-9 pr-3 text-white placeholder-on-primary-container focus:ring-2 focus:ring-secondary text-xs outline-none"
          />
        </div>
      </div>

      {/* Notifications Bell Button */}
      <div className="flex items-center gap-sm shrink-0">
        <button
          onClick={onToggleAlerts}
          className="text-on-primary hover:bg-primary p-2 rounded-full transition-colors relative cursor-pointer"
          title={lowStockCount > 0 ? `${lowStockCount} alertas de stock activo` : "Notificaciones"}
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          {lowStockCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-error text-on-error text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {lowStockCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
});
