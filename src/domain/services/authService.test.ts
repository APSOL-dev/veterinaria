import { describe, it, expect } from 'vitest';
import { authenticateUser, getDemoCredentials } from './authService';

describe('authService', () => {
  it('authenticateUser should validate Administrador credentials correctly', () => {
    const user = authenticateUser('Administrador', 'VETSOFT123');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('Administrador');
    expect(user?.name).toBe('Dr. J. Silva');
  });

  it('authenticateUser should validate Veterinario credentials correctly', () => {
    const user = authenticateUser('Veterinario', 'VETSOFT123');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('Veterinario');
    expect(user?.name).toBe('Dra. A. López');
  });

  it('authenticateUser should validate Peluquero credentials correctly', () => {
    const user = authenticateUser('Peluquero', 'VETSOFT123');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('Peluquero');
    expect(user?.name).toBe('C. Gómez');
  });

  it('authenticateUser should reject invalid credentials', () => {
    const user = authenticateUser('WrongUser', 'WrongPassword');
    expect(user).toBeNull();
  });

  it('getDemoCredentials should return the 3 specified role credentials', () => {
    const demo = getDemoCredentials();
    expect(demo.length).toBe(3);
    expect(demo[0].username).toBe('Administrador');
    expect(demo[1].username).toBe('Veterinario');
    expect(demo[2].username).toBe('Peluquero');
  });
});
