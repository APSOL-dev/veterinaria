import React from 'react';
import { ActiveModule } from './Sidebar';
import { getSubmodulesForModule } from './submodulesConfig';

export { getSubmodulesForModule };

interface HeaderProps {
  activeModule: ActiveModule;
  activeSubmodule: string;
  setActiveSubmodule: (submodule: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSidebarCollapsed?: boolean;
  isMobile?: boolean;
  onOpenMobileNav?: () => void;
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
  isMobile = false,
  onOpenMobileNav,
  lowStockCount = 0,
  onToggleAlerts
}) => {
  const submodules = getSubmodulesForModule(activeModule);

  const submoduleButtons = submodules.map((sub) => {
    const isActive = activeSubmodule === sub.id;
    return (
      <button
        key={sub.id}
        onClick={() => setActiveSubmodule(sub.id)}
        className={`px-3.5 py-2 rounded-lg transition-all font-label-md text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
          isActive
            ? 'bg-secondary text-on-secondary shadow-md font-semibold'
            : 'text-on-primary hover:bg-primary/40 font-medium'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">{sub.icon}</span>
        <span>{sub.label}</span>
      </button>
    );
  });

  const notificationsButton = (
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
  );

  if (isMobile) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-primary-container z-50 shadow-lg flex flex-col">
        {/* Fila 1: Menú hamburguesa, marca y notificaciones */}
        <div className="h-16 shrink-0 flex items-center justify-between pr-md">
          <div className="h-full flex items-center gap-xs px-sm">
            <button
              onClick={onOpenMobileNav}
              className="text-on-primary p-1.5 -ml-1 rounded-lg hover:bg-primary/40 transition-colors cursor-pointer"
              title="Abrir menú"
              aria-label="Abrir menú de módulos"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <span className="font-headline-sm text-on-primary text-[19px] font-bold truncate">VetSoft</span>
          </div>
          {notificationsButton}
        </div>

        {/* Fila 2: Submódulos a todo el ancho, debajo del encabezado */}
        {submodules.length > 0 && (
          <nav className="h-12 shrink-0 flex items-center gap-xs px-sm pb-2 overflow-x-auto scrollbar-hide border-t border-white/20">
            {submoduleButtons}
          </nav>
        )}
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary-container z-50 flex items-center justify-between shadow-lg pr-md">
      {/* Brand / Logo Section (Abarca el ancho de la sidebar y se separa con línea blanca) */}
      <div className={`h-full flex items-center gap-xs border-r border-white/60 transition-all duration-300 shrink-0 ${
        isSidebarCollapsed ? 'w-16 justify-center px-xs' : 'w-64 px-md justify-start'
      }`}>
        <span className="font-headline-sm text-on-primary text-[19px] font-bold truncate">
          {isSidebarCollapsed ? 'Vs' : 'VetSoft'}
        </span>
      </div>

      {/* Top Header Submodules Bar (Separado con línea blanca del logo) */}
      <nav className="flex items-center gap-xs px-md overflow-x-auto scrollbar-hide flex-1 min-w-0">
        {submoduleButtons}
      </nav>

      {/* Notifications Bell Button */}
      <div className="flex items-center gap-sm shrink-0">
        {notificationsButton}
      </div>
    </header>
  );
});
