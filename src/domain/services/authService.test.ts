import { describe, it, expect, vi } from 'vitest';
import { authenticateUser, getDemoCredentials, saveUserSession, loadSavedUserSession, clearUserSession } from './authService';
import { supabase } from '../supabaseClient';

describe('authService', () => {
  it('authenticateUser should validate email credentials with Supabase Auth correctly', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-1',
          email: 'admin@vetsoft.com',
          user_metadata: { full_name: 'Dr. J. Silva', role: 'Administrador' }
        } as any,
        session: {} as any
      },
      error: null
    });

    const user = await authenticateUser('admin@vetsoft.com', 'VETSOFT123');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('Administrador');
    expect(user?.name).toBe('Dr. J. Silva');
  });

  it('authenticateUser should validate Veterinario email credentials correctly', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-2',
          email: 'vet@vetsoft.com',
          user_metadata: { full_name: 'Dra. A. López', role: 'Veterinario' }
        } as any,
        session: {} as any
      },
      error: null
    });

    const user = await authenticateUser('vet@vetsoft.com', 'VETSOFT123');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('Veterinario');
    expect(user?.name).toBe('Dra. A. López');
  });

  it('authenticateUser should validate Peluquero email credentials correctly', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: {
        user: {
          id: 'user-3',
          email: 'peluquero@vetsoft.com',
          user_metadata: { full_name: 'C. Gómez', role: 'Peluquero' }
        } as any,
        session: {} as any
      },
      error: null
    });

    const user = await authenticateUser('peluquero@vetsoft.com', 'VETSOFT123');
    expect(user).not.toBeNull();
    expect(user?.role).toBe('Peluquero');
    expect(user?.name).toBe('C. Gómez');
  });

  it('authenticateUser should reject invalid credentials or missing email', async () => {
    vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
      data: { user: null, session: null },
      error: new Error('Invalid login credentials') as any
    });

    const user = await authenticateUser('wrong@vetsoft.com', 'WrongPassword');
    expect(user).toBeNull();
  });



  it('getDemoCredentials should return the 3 specified role credentials', () => {
    const demo = getDemoCredentials();
    expect(demo.length).toBe(3);
    expect(demo[0].username).toBe('Administrador');
    expect(demo[1].username).toBe('Veterinario');
    expect(demo[2].username).toBe('Peluquero');
  });

  it('session persistence helpers should save, load, and clear session in localStorage', () => {
    const mockSession = {
      username: 'admin@vetsoft.com',
      name: 'Dr. J. Silva',
      role: 'Administrador' as const,
      roleLabel: 'Administrador General'
    };

    saveUserSession(mockSession);
    expect(loadSavedUserSession()).toEqual(mockSession);

    clearUserSession();
    expect(loadSavedUserSession()).toBeNull();
  });
});
