import { describe, it, expect } from 'vitest';
import { 
  getDefaultSubmoduleForModule, 
  isValidSubmoduleForModule, 
  resolveNavigationState,
  resolveShortcutNavigationTarget 
} from './navigationService';

describe('navigationService', () => {
  it('getDefaultSubmoduleForModule should return correct default submodules', () => {
    expect(getDefaultSubmoduleForModule('proveedores')).toBe('facturas');
    expect(getDefaultSubmoduleForModule('clinica')).toBe('fichas-medicas');
    expect(getDefaultSubmoduleForModule('peluqueria')).toBe('calendario-peluqueria');
    expect(getDefaultSubmoduleForModule('pacientes')).toBe('ficha-pacientes');
    expect(getDefaultSubmoduleForModule('inventario')).toBe('productos-fisicos');
  });

  it('isValidSubmoduleForModule should validate submodule ownership correctly', () => {
    expect(isValidSubmoduleForModule('clinica', 'fichas-medicas')).toBe(true);
    expect(isValidSubmoduleForModule('clinica', 'vacunas')).toBe(true);
    expect(isValidSubmoduleForModule('pacientes', 'control-vacunas')).toBe(true);
    expect(isValidSubmoduleForModule('clinica', 'control-vacunas')).toBe(false);
    expect(isValidSubmoduleForModule('proveedores', 'presupuestos')).toBe(true);
  });

  it('resolveNavigationState should preserve valid submodules or fallback to default', () => {
    const validNav = resolveNavigationState('pacientes', 'control-vacunas');
    expect(validNav.module).toBe('pacientes');
    expect(validNav.submodule).toBe('control-vacunas');

    const invalidNav = resolveNavigationState('clinica', 'invalid-submodule');
    expect(invalidNav.module).toBe('clinica');
    expect(invalidNav.submodule).toBe('fichas-medicas');
  });

  it('resolveShortcutNavigationTarget should map shortcut keys to correct module and submodule', () => {
    expect(resolveShortcutNavigationTarget('vacunas')).toEqual({ module: 'pacientes', submodule: 'control-vacunas' });
    expect(resolveShortcutNavigationTarget('control-vacunas')).toEqual({ module: 'pacientes', submodule: 'control-vacunas' });
    expect(resolveShortcutNavigationTarget('cobros')).toEqual({ module: 'cobros', submodule: 'nueva-facturacion' });
    expect(resolveShortcutNavigationTarget('cobrar-turno')).toEqual({ module: 'cobros', submodule: 'nueva-facturacion' });
    expect(resolveShortcutNavigationTarget('facturacion')).toEqual({ module: 'cobros', submodule: 'nueva-facturacion' });
    expect(resolveShortcutNavigationTarget('nueva-consulta')).toEqual({ module: 'clinica', submodule: 'fichas-medicas' });
    expect(resolveShortcutNavigationTarget('agenda')).toEqual({ module: 'clinica', submodule: 'calendario-clinica' });
  });
});
