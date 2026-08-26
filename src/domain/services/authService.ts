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

export function authenticateUser(username: string, pass: string): UserSession | null {
  const found = DEMO_USERS.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase() && u.pass === pass.trim()
  );

  if (!found) return null;

  return {
    username: found.username,
    name: found.name,
    role: found.role,
    roleLabel: found.roleLabel
  };
}

export function getDemoCredentials(): DemoCredential[] {
  return DEMO_USERS;
}
