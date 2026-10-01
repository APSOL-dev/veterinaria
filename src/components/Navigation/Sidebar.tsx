import React from 'react';
import { canAccessModule, UserRoleType } from '../../domain/services/rbacService';
import { getSubmodulesForModule } from './submodulesConfig';

export type ActiveModule = 
  | 'proveedores' 
  | 'clinica' 
  | 'peluqueria' 
  | 'pacientes' 
  | 'inventario'
  | 'cobros'
  | 'whatsapp';

interface SidebarProps {
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  userName?: string;
  userRole?: string;
  userRoleType?: UserRoleType;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeModule,
  setActiveModule,
  isCollapsed = false,
  onToggleCollapse,
  isMobile = false,
  isMobileOpen = false,
  onCloseMobile,
  userName = 'Dr. J. Silva',
  userRole = 'Veterinario / Admin',
  userRoleType = 'Administrador',
  onLogout
}) => {
  // En mobile la sidebar es un drawer oculto por defecto: no ocupa espacio hasta que se abre.
  if (isMobile && !isMobileOpen) {
    return null;
  }
  const allModules: { id: ActiveModule; label: string; icon: string }[] = [
    { id: 'pacientes', label: 'Pacientes', icon: 'pets' },
    { id: 'clinica', label: 'Clínica', icon: 'stethoscope' },
    { id: 'peluqueria', label: 'Peluquería', icon: 'content_cut' },
    { id: 'inventario', label: 'Inventario', icon: 'inventory_2' },
    { id: 'cobros', label: 'Cobros', icon: 'point_of_sale' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
    { id: 'proveedores', label: 'Proveedores', icon: 'local_shipping' },
  ];

  const modules = allModules.filter(m => canAccessModule(userRoleType, m.id));


  const handleLogoutClick = () => {
    onLogout?.();
  };

  // En el drawer mobile siempre se muestran las etiquetas completas, sin importar
  // el estado de "colapsado" de la barra lateral de escritorio.
  const collapsed = isMobile ? false : isCollapsed;

  // En mobile el header puede tener una o dos filas (según si el módulo activo
  // tiene submódulos), así que el drawer arranca justo debajo de esa altura real.
  const mobileTopOffset = getSubmodulesForModule(activeModule).length > 0 ? 'top-28' : 'top-16';

  return (
    <>
      {isMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 animate-fade-in"
          aria-hidden="true"
        />
      )}

      <aside className={`fixed left-0 ${isMobile ? mobileTopOffset : 'top-16'} bottom-0 ${
        collapsed ? 'w-16' : 'w-64'
      } bg-surface-container-lowest ${isMobile ? 'z-50 shadow-xl' : 'z-30 shadow-md'} flex flex-col border-r border-outline-variant transition-all duration-300`}>
        {/* Floating Edge Collapse / Expand Toggle Button (solo escritorio) */}
        {!isMobile && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 bg-surface-container-lowest border border-outline-variant shadow-md text-primary rounded-full p-1.5 hover:bg-primary hover:text-white transition-all cursor-pointer flex items-center justify-center"
            title={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          >
            <span className="material-symbols-outlined text-[16px]">
              {collapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        )}

      {/* Header Title */}
      <div className={`p-md border-b border-outline-variant flex items-center justify-between ${collapsed ? 'px-xs text-center' : 'px-lg'}`}>
        {!collapsed ? (
          <h2 className="font-label-md text-on-surface-variant text-xs font-semibold truncate">
            Módulos del sistema
          </h2>
        ) : (
          <span className="material-symbols-outlined text-primary text-[20px]">widgets</span>
        )}
        {isMobile && (
          <button
            onClick={onCloseMobile}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center p-2 transition-colors cursor-pointer"
            title="Cerrar menú"
            aria-label="Cerrar menú de módulos"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        )}
      </div>

      {/* Navigation Buttons */}
      <nav className="flex-1 py-sm overflow-y-auto flex flex-col gap-1 px-2">
        {!collapsed && (
          <div className="px-md mb-xs text-on-surface-variant font-label-sm text-[11px] font-medium">
            Navegación principal
          </div>
        )}

        {modules.map((mod) => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              aria-label={mod.label}
              title={mod.label}
              className={`w-full flex items-center min-h-[44px] ${
                collapsed ? 'justify-center p-2.5' : 'gap-md px-md py-2.5'
              } rounded-xl text-left transition-all font-body-md text-sm ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'text-on-surface hover:bg-surface-container-high font-medium'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-on-primary' : 'text-primary'}`} aria-hidden="true">
                {mod.icon}
              </span>
              {!collapsed && <span className="truncate">{mod.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="p-sm border-t border-outline-variant flex flex-col gap-xs">
        {!collapsed ? (
          <>
            <div className="bg-surface-container text-on-surface-variant p-sm px-md rounded-xl text-[11px]">
              <p className="font-medium text-on-surface">Veterinaria Arlekyn</p>
              <p className="font-medium text-primary">Turno mañana</p>
            </div>

            {/* User Card */}
            <div className="bg-surface-container-low p-xs px-sm rounded-xl flex items-center justify-between border border-outline-variant/40 min-h-[44px]">
              <div className="flex items-center gap-xs min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-on-surface font-semibold truncate text-xs">{userName}</span>
                  <span className="font-label-sm text-on-surface-variant truncate text-[10px]">{userRole}</span>
                </div>
              </div>

              <button
                onClick={handleLogoutClick}
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
                className="p-2.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-xl transition-colors shrink-0 flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-xs py-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm" title={userName}>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person</span>
            </div>
            <button
              onClick={handleLogoutClick}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="p-2.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-xl transition-colors flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>
            </button>
          </div>
        )}
      </div>
      </aside>
    </>
  );
});
