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

  it('createInAppNotification should handle warning type', () => {
    const notif = createInAppNotification('Por favor, ingrese el texto de la consulta', 'warning', 'Aviso de VetSoft');

    expect(notif.type).toBe('warning');
    expect(notif.title).toBe('Aviso de VetSoft');
    expect(notif.message).toBe('Por favor, ingrese el texto de la consulta');
  });
});
