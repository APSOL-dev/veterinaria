import { supabase } from '../supabaseClient';

export interface UserSession {
  username: string;
  name: string;
  role: 'Administrador' | 'Veterinario' | 'Peluquero';
  roleLabel: string;
}

export interface DemoCredential {
  role: 'Administrador' | 'Veterinario' | 'Peluquero';
  username: string;
  pass: string;
  name: string;
  roleLabel: string;
}

const DEMO_USERS: DemoCredential[] = [
  {
    role: 'Administrador',
    username: 'Administrador',
    pass: 'VETSOFT123',
    name: 'Dr. J. Silva',
    roleLabel: 'Administrador General'
  },
  {
    role: 'Veterinario',
    username: 'Veterinario',
    pass: 'VETSOFT123',
    name: 'Dra. A. López',
    roleLabel: 'Médico Veterinario'
  },
  {
    role: 'Peluquero',
    username: 'Peluquero',
    pass: 'VETSOFT123',
    name: 'C. Gómez',
    roleLabel: 'Peluquería & Estética'
  }
];

export async function authenticateUser(email: string, pass: string): Promise<UserSession | null> {
  const cleanEmail = (email || '').trim();
  const cleanPass = (pass || '').trim();

  if (!cleanEmail || !cleanPass) return null;

  // Autenticación estricta con Supabase Auth usando correo y contraseña
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass
    });

    if (error || !data?.user) {
      return null;
    }

    const metadata = data.user.user_metadata || {};
    const rawRole = (metadata.role || '').toLowerCase();
    const userPrefix = cleanEmail.split('@')[0].toLowerCase();

    let role: 'Administrador' | 'Veterinario' | 'Peluquero' = 'Administrador';
    if (rawRole.includes('vet') || (userPrefix !== 'admin' && (userPrefix.includes('vet') || userPrefix.includes('veterinario')))) {
      role = 'Veterinario';
    } else if (rawRole.includes('pelu') || userPrefix.includes('pelu') || userPrefix.includes('peluquero')) {
      role = 'Peluquero';
    } else if (rawRole.includes('admin') || userPrefix.includes('admin')) {
      role = 'Administrador';
    }

    const roleLabel = metadata.roleLabel || (role === 'Administrador' ? 'Administrador General' : role === 'Veterinario' ? 'Médico Veterinario' : 'Peluquería & Estética');

    return {
      username: data.user.email || cleanEmail,
      name: metadata.full_name || metadata.nombre || metadata.name || cleanEmail,
      role,
      roleLabel
    };
  } catch (err) {
    return null;
  }
}

export function getDemoCredentials(): DemoCredential[] {
  return DEMO_USERS;
}

const STORAGE_KEY = 'vetsoft_user_session';

export function saveUserSession(session: UserSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('No se pudo guardar la sesión de usuario:', err);
  }
}

export function loadSavedUserSession(): UserSession | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn('Error leyendo la sesión guardada:', err);
    return null;
  }
}

export function clearUserSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Error borrando la sesión guardada:', err);
  }
}

