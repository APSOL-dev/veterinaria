import { describe, it, expect } from 'vitest';
import { formatChatTimestamp, extractMessageContent } from './chatFormat';

describe('chatFormat utility', () => {
  it('should format timestamp correctly', () => {
    const now = Math.floor(Date.now() / 1000);
    const formattedNow = formatChatTimestamp(now);
    expect(formattedNow).toMatch(/^\d{2}:\d{2}$/);

    const oldTimestamp = 1600000000; // 2020
    const formattedOld = formatChatTimestamp(oldTimestamp);
    expect(formattedOld).toMatch(/\d{2}\/\d{2}/);
  });

  it('should extract message text content correctly', () => {
    expect(extractMessageContent({ conversation: 'Hola Dr.' })).toBe('Hola Dr.');
    expect(extractMessageContent({ extendedTextMessage: { text: 'Turno confirmado' } })).toBe('Turno confirmado');
    expect(extractMessageContent({ imageMessage: { caption: 'Foto de Firulais' } })).toBe('📷 Imagen: Foto de Firulais');
    expect(extractMessageContent({ audioMessage: {} })).toBe('🎵 Audio');
    expect(extractMessageContent({ documentMessage: { fileName: 'Receta.pdf' } })).toBe('📄 Documento: Receta.pdf');
  });
});
