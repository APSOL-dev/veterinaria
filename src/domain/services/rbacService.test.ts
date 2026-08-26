import { describe, it, expect } from 'vitest';
import { 
  canAccessModule, 
  canAccessSubmodule, 
  getAccessibleModules 
} from './rbacService';

describe('rbacService', () => {
  it('Administrador should have full access to all modules including cobros', () => {
    const modules = getAccessibleModules('Administrador');
    expect(modules).toEqual(['proveedores', 'clinica', 'peluqueria', 'pacientes', 'inventario', 'cobros']);

    expect(canAccessModule('Administrador', 'cobros')).toBe(true);
    expect(canAccessModule('Administrador', 'proveedores')).toBe(true);
    expect(canAccessModule('Administrador', 'inventario')).toBe(true);
    expect(canAccessModule('Administrador', 'clinica')).toBe(true);
  });

  it('Veterinario should access clinica, pacientes, AND cobros, but NOT peluqueria, proveedores or inventario', () => {
    const modules = getAccessibleModules('Veterinario');
    expect(modules).toEqual(['clinica', 'pacientes', 'cobros']);

    expect(canAccessModule('Veterinario', 'clinica')).toBe(true);
    expect(canAccessModule('Veterinario', 'pacientes')).toBe(true);
    expect(canAccessModule('Veterinario', 'cobros')).toBe(true);
    expect(canAccessModule('Veterinario', 'peluqueria')).toBe(false);
    expect(canAccessModule('Veterinario', 'proveedores')).toBe(false);
    expect(canAccessModule('Veterinario', 'inventario')).toBe(false);
  });

  it('Peluquero should ONLY access peluqueria module and NOT cobros or proveedores', () => {
    const modules = getAccessibleModules('Peluquero');
    expect(modules).toEqual(['peluqueria']);

    expect(canAccessModule('Peluquero', 'peluqueria')).toBe(true);
    expect(canAccessModule('Peluquero', 'cobros')).toBe(false);
    expect(canAccessModule('Peluquero', 'clinica')).toBe(false);
    expect(canAccessModule('Peluquero', 'pacientes')).toBe(false);
    expect(canAccessModule('Peluquero', 'inventario')).toBe(false);
    expect(canAccessModule('Peluquero', 'proveedores')).toBe(false);
  });
});
