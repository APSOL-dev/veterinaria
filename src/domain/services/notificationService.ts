export interface AppNotification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
}

export function createInAppNotification(
  message: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'info',
  title?: string
): AppNotification {
  return {
    id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    message: message.trim(),
    type,
    title: title || (type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Notificación')
  };
}
