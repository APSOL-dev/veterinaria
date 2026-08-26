import React from 'react';
import { getAccessibleModules, UserRoleType } from '../../domain/services/rbacService';

export type ActiveModule = 
  | 'proveedores' 
  | 'clinica' 
  | 'peluqueria' 
  | 'pacientes' 
  | 'inventario'
  | 'cobros';

interface SidebarProps {
  activeModule: ActiveModule;
  setActiveModule: (module: ActiveModule) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
  userName = 'Dr. J. Silva',
  userRole = 'Veterinario / Admin',
  userRoleType = 'Administrador',
  onLogout
}) => {
  const allModules: { id: ActiveModule; label: string; icon: string }[] = [
    { id: 'proveedores', label: 'Proveedores', icon: 'local_shipping' },
    { id: 'clinica', label: 'Clínica', icon: 'stethoscope' },
    { id: 'peluqueria', label: 'Peluquería', icon: 'content_cut' },
    { id: 'pacientes', label: 'Pacientes', icon: 'pets' },
    { id: 'inventario', label: 'Inventario', icon: 'inventory_2' },
    { id: 'cobros', label: 'Cobros', icon: 'point_of_sale' },
  ];

  const allowedModuleIds = getAccessibleModules(userRoleType);
  const modules = allModules.filter(m => allowedModuleIds.includes(m.id));

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      alert('Sesión cerrada correctamente.');
    }
  };

  return (
    <aside className={`fixed left-0 top-16 bottom-0 ${
      isCollapsed ? 'w-16' : 'w-64'
    } bg-surface-container-lowest z-30 shadow-md flex flex-col border-r border-outline-variant transition-all duration-300`}>
      {/* Floating Edge Collapse / Expand Toggle Button (Centrado Vertical) */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-50 bg-surface-container-lowest border border-outline-variant shadow-md text-primary rounded-full p-1.5 hover:bg-primary hover:text-white transition-all cursor-pointer flex items-center justify-center"
          title={isCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
        >
          <span className="material-symbols-outlined text-[16px]">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      )}

      {/* Header Title */}
      <div className={`p-md border-b border-outline-variant ${isCollapsed ? 'px-xs text-center' : 'px-lg'}`}>
        {!isCollapsed ? (
          <h2 className="font-label-md text-on-surface-variant uppercase tracking-wider text-xs font-bold truncate">
            Módulos del Sistema
          </h2>
        ) : (
          <span className="material-symbols-outlined text-primary text-[20px]">widgets</span>
        )}
      </div>

      {/* Navigation Buttons */}
      <nav className="flex-1 py-sm overflow-y-auto flex flex-col gap-xs px-xs">
        {!isCollapsed && (
          <div className="px-md mb-xs text-on-surface-variant font-label-sm uppercase text-[10px] font-semibold">
            Navegación Principal
          </div>
        )}

        {modules.map((mod) => {
          const isActive = activeModule === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              title={isCollapsed ? mod.label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-md px-md py-2.5'
              } rounded-xl text-left transition-all font-body-md text-sm ${
                isActive
                  ? 'bg-primary text-on-primary shadow-sm font-semibold'
                  : 'text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-on-primary' : 'text-primary'}`}>
                {mod.icon}
              </span>
              {!isCollapsed && <span className="truncate">{mod.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Footer */}
      <div className="p-sm border-t border-outline-variant flex flex-col gap-xs">
        {!isCollapsed ? (
          <>
            <div className="bg-surface-container text-on-surface-variant p-sm px-md rounded-xl text-[11px]">
              <p className="font-medium text-on-surface">Clínica Veterinaria San José</p>
              <p className="font-bold text-primary">Turno Mañana</p>
            </div>

            {/* User Card */}
            <div className="bg-surface-container-low p-xs px-sm rounded-xl flex items-center justify-between border border-outline-variant/40">
              <div className="flex items-center gap-xs min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">person</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-on-surface font-semibold truncate text-xs">{userName}</span>
                  <span className="font-label-sm text-on-surface-variant truncate text-[10px]">{userRole}</span>
                </div>
              </div>

              <button
                onClick={handleLogoutClick}
                title="Cerrar sesión"
                className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors shrink-0 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-xs py-1">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 shadow-sm" title={userName}>
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
            <button
              onClick={handleLogoutClick}
              title="Cerrar sesión"
              className="p-1 text-on-surface-variant hover:text-error hover:bg-error-container/30 rounded-lg transition-colors flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});
