import { describe, it, expect } from 'vitest';
import { createInAppNotification } from './notificationService';

describe('notificationService', () => {
  it('createInAppNotification should construct a valid notification object', () => {
    const notif = createInAppNotification('Consulta registrada con éxito', 'success');

    expect(notif.id).toBeDefined();
    expect(notif.message).toBe('Consulta registrada con éxito');
    expect(notif.type).toBe('success');
    expect(notif.title).toBe('Éxito');
  });

  it('createInAppNotification should handle custom title and error type', () => {
    const notif = createInAppNotification('Permiso denegado', 'error', 'Acceso Restringido');

    expect(notif.type).toBe('error');
    expect(notif.title).toBe('Acceso Restringido');
  });
});
