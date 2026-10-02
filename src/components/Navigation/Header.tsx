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
        className={`px-3.5 py-2.5 min-h-[44px] rounded-xl transition-all font-label-md text-xs flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
          isActive
            ? 'bg-secondary text-on-secondary shadow-md font-semibold'
            : 'text-on-primary hover:bg-primary/40 font-medium'
        }`}
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">{sub.icon}</span>
        <span>{sub.label}</span>
      </button>
    );
  });

  // En celular los submódulos se reparten el ancho por igual (sin scroll horizontal), con el texto en hasta dos líneas
  const mobileSubmoduleButtons = submodules.map((sub) => {
    const isActive = activeSubmodule === sub.id;
    return (
      <button
        key={sub.id}
        onClick={() => setActiveSubmodule(sub.id)}
        aria-current={isActive ? 'page' : undefined}
        className={`min-h-[44px] min-w-0 px-1.5 py-1 rounded-xl transition-all text-[11px] leading-tight flex items-center justify-center gap-1 text-center cursor-pointer ${
          isActive
            ? 'bg-secondary text-on-secondary shadow-md font-semibold'
            : 'text-on-primary hover:bg-primary/40 font-medium'
        }`}
      >
        <span className="material-symbols-outlined text-[16px] shrink-0" aria-hidden="true">{sub.icon}</span>
        <span className="min-w-0 break-words">{sub.label}</span>
      </button>
    );
  });

  const notificationsButton = (
    <button
      onClick={onToggleAlerts}
      className="text-on-primary hover:bg-primary p-2 min-h-[44px] min-w-[44px] rounded-full transition-colors relative flex items-center justify-center cursor-pointer"
      title={lowStockCount > 0 ? `${lowStockCount} alertas de stock activo` : "Notificaciones"}
      aria-label={lowStockCount > 0 ? `${lowStockCount} alertas de stock activo` : "Notificaciones"}
    >
      <span className="material-symbols-outlined text-[22px]" aria-hidden="true">notifications</span>
      {lowStockCount > 0 && (
        <span className="absolute 1.5 top-1.5 right-1.5 bg-error text-on-error text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
          {lowStockCount}
        </span>
      )}
    </button>
  );

  if (isMobile) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-primary-container z-30 shadow-lg flex flex-col">
        {/* Fila 1: Menú hamburguesa, marca y notificaciones */}
        <div className="h-16 shrink-0 flex items-center justify-between pr-md">
          <div className="h-full flex items-center gap-xs px-sm">
            <button
              onClick={onOpenMobileNav}
              className="text-on-primary min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-xl hover:bg-primary/40 transition-colors cursor-pointer"
              title="Abrir menú"
              aria-label="Abrir menú de módulos"
            >
              <span className="material-symbols-outlined text-[24px]" aria-hidden="true">menu</span>
            </button>
            <span className="font-headline-sm text-on-primary text-[19px] font-bold truncate">VetSoft</span>
          </div>
          {notificationsButton}
        </div>

        {/* Fila 2: Submódulos repartidos en partes iguales a todo el ancho, sin necesidad de deslizar */}
        {submodules.length > 0 && (
          <nav
            aria-label="Submódulos"
            className="h-12 shrink-0 grid items-center gap-1 px-2 border-t border-white/20"
            style={{ gridTemplateColumns: `repeat(${submodules.length}, minmax(0, 1fr))` }}
          >
            {mobileSubmoduleButtons}
          </nav>
        )}
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-primary-container z-30 flex items-center justify-between shadow-lg pr-md">
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
