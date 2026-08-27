import { ActiveModule } from '../../components/Navigation/Sidebar';

export const MODULE_SUBMODULE_MAP: Record<ActiveModule, string[]> = {
  proveedores: ['facturas', 'presupuestos'],
  clinica: ['fichas-medicas', 'vacunas', 'calendario-clinica'],
  peluqueria: ['calendario-peluqueria'],
  pacientes: ['ficha-pacientes', 'tutores', 'control-vacunas'],
  inventario: ['productos-fisicos', 'servicios-catalogo'],
  cobros: ['nueva-facturacion', 'historial-cobros']
};

export function getDefaultSubmoduleForModule(module: ActiveModule): string {
  const submodules = MODULE_SUBMODULE_MAP[module];
  return submodules ? submodules[0] : '';
}

export function isValidSubmoduleForModule(module: ActiveModule, submodule: string): boolean {
  const submodules = MODULE_SUBMODULE_MAP[module];
  return submodules ? submodules.includes(submodule) : false;
}

export function resolveNavigationState(module: ActiveModule, requestedSubmodule?: string): {
  module: ActiveModule;
  submodule: string;
} {
  if (requestedSubmodule && isValidSubmoduleForModule(module, requestedSubmodule)) {
    return { module, submodule: requestedSubmodule };
  }
  return { module, submodule: getDefaultSubmoduleForModule(module) };
}

export function resolveShortcutNavigationTarget(target: string): {
  module: ActiveModule;
  submodule: string;
} {
  switch (target) {
    case 'control-vacunas':
    case 'vacunas':
      return { module: 'pacientes', submodule: 'control-vacunas' };
    case 'cobros':
    case 'facturacion':
    case 'registrar-cobro':
    case 'cobrar-turno':
      return { module: 'cobros', submodule: 'nueva-facturacion' };
    case 'nueva-consulta':
      return { module: 'clinica', submodule: 'fichas-medicas' };
    case 'agenda':
      return { module: 'clinica', submodule: 'calendario-clinica' };
    default:
      return { module: 'pacientes', submodule: 'ficha-pacientes' };
  }
}
