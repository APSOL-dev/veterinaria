import { ActiveModule } from '../../components/Navigation/Sidebar';

export type UserRoleType = 'Administrador' | 'Veterinario' | 'Peluquero';

const ROLE_MODULE_PERMISSIONS: Record<UserRoleType, ActiveModule[]> = {
  Administrador: ['proveedores', 'clinica', 'peluqueria', 'pacientes', 'inventario', 'cobros'],
  Veterinario: ['clinica', 'pacientes', 'cobros'],
  Peluquero: ['peluqueria']
};

export function getAccessibleModules(role: UserRoleType): ActiveModule[] {
  return ROLE_MODULE_PERMISSIONS[role] || ['peluqueria'];
}

export function canAccessModule(role: UserRoleType, module: ActiveModule): boolean {
  const allowed = getAccessibleModules(role);
  return allowed.includes(module);
}

export function canAccessSubmodule(role: UserRoleType, module: ActiveModule, submodule: string): boolean {
  if (!canAccessModule(role, module)) return false;

  // Additional submodule restrictions if needed
  if (role === 'Peluquero') {
    return module === 'peluqueria';
  }

  return true;
}

export function getDefaultModuleForRole(role: UserRoleType): ActiveModule {
  const allowed = getAccessibleModules(role);
  return allowed[0] || 'peluqueria';
}
