import { describe, it, expect } from 'vitest';
import { 
  formatChatTimestamp, 
  extractMessageContent, 
  extractPhoneFromChat, 
  formatPhoneNumber, 
  resolveChatDisplayName,
  getChatAvatarUrl 
} from './chatFormat';

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

  describe('extractPhoneFromChat', () => {
    it('should extract real phone from remoteJidAlt when main JID is LID', () => {
      const chat = {
        id: '6794822828039@lid',
        remoteJid: '6794822828039@lid',
        lastMessage: {
          key: {
            remoteJid: '6794822828039@lid',
            remoteJidAlt: '5493424476596@s.whatsapp.net'
          }
        }
      };
      expect(extractPhoneFromChat(chat)).toBe('5493424476596');
    });

    it('should extract phone directly from remoteJid when not LID', () => {
      const chat = {
        id: '5493425123456@s.whatsapp.net',
        remoteJid: '5493425123456@s.whatsapp.net'
      };
      expect(extractPhoneFromChat(chat)).toBe('5493425123456');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format 13-digit 549 AR numbers cleanly', () => {
      expect(formatPhoneNumber('5493424476596')).toBe('+54 9 342 447-6596');
    });

    it('should format 12-digit 54 AR numbers cleanly', () => {
      expect(formatPhoneNumber('543424476596')).toBe('+54 342 447-6596');
    });
  });

  describe('resolveChatDisplayName', () => {
    const patients = [
      {
        ownerName: 'Juan Pérez',
        name: 'Firulais',
        telefono: '3424476596'
      }
    ];

    it('should resolve name matching VETSOFT patient/tutor phone even if chat JID is LID', () => {
      const chat = {
        id: '6794822828039@lid',
        remoteJid: '6794822828039@lid',
        lastMessage: {
          key: {
            remoteJidAlt: '5493424476596@s.whatsapp.net'
          }
        }
      };
      expect(resolveChatDisplayName(chat, patients)).toBe('Juan Pérez (Firulais)');
    });

    it('should use pushName when present and no VETSOFT client matches', () => {
      const chat = {
        id: '5493425999999@s.whatsapp.net',
        remoteJid: '5493425999999@s.whatsapp.net',
        pushName: 'María Alejandra'
      };
      expect(resolveChatDisplayName(chat, [])).toBe('María Alejandra');
    });

    it('should use lastMessage.pushName if top-level pushName is missing', () => {
      const chat = {
        id: '5493425888888@s.whatsapp.net',
        remoteJid: '5493425888888@s.whatsapp.net',
        lastMessage: {
          pushName: 'Carlos Gómez'
        }
      };
      expect(resolveChatDisplayName(chat, [])).toBe('Carlos Gómez');
    });

    it('should fall back to formatted phone number if pushName is missing', () => {
      const chat = {
        id: '5493424476596@s.whatsapp.net',
        remoteJid: '5493424476596@s.whatsapp.net'
      };
      expect(resolveChatDisplayName(chat, [])).toBe('+54 9 342 447-6596');
    });

    it('should ignore pushName "Você" or numeric LID strings', () => {
      const chat = {
        id: '6794822828039@lid',
        remoteJid: '6794822828039@lid',
        lastMessage: {
          pushName: 'Você',
          key: {
            remoteJidAlt: '5493424476596@s.whatsapp.net'
          }
        }
      };
      expect(resolveChatDisplayName(chat, [])).toBe('+54 9 342 447-6596');
    });
  });

  describe('getChatAvatarUrl', () => {
    it('should return profilePicUrl if present', () => {
      const chat = { profilePicUrl: 'https://example.com/pic.jpg' };
      expect(getChatAvatarUrl(chat)).toBe('https://example.com/pic.jpg');
    });

    it('should return client photo if profilePicUrl is missing', () => {
      const chat = { clientData: { photo: 'https://example.com/client.jpg' } };
      expect(getChatAvatarUrl(chat)).toBe('https://example.com/client.jpg');
    });

    it('should return null if no avatar is available', () => {
      const chat = {};
      expect(getChatAvatarUrl(chat)).toBeNull();
    });
  });
});

