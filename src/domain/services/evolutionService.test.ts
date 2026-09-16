import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evolutionService } from '../../services/evolutionService';

describe('evolutionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return config object from environment or default fallbacks', () => {
    const config = evolutionService.getConfig();
    expect(config.apiUrl).toBeTruthy();
    expect(config.apiKey).toBeTruthy();
    expect(config.instance).toBeTruthy();
  });

  it('should return close state when fetch throws error or instance not configured', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    const state = await evolutionService.getConnectionState();
    expect(state).toBe('close');
  });

  it('should return not_found when server returns Not Found error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ message: 'Instance not found' }),
    } as any);
    const state = await evolutionService.getConnectionState();
    expect(state).toBe('not_found');
  });

  it('should fetch QR code base64 properly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }),
    } as any);

    const result = await evolutionService.getQrCode();
    expect(result.base64).toContain('data:image/png;base64');
  });

  it('should fetch base64 media for a message properly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ mediaType: 'imageMessage', base64: 'abc123base64', mimetype: 'image/jpeg' }),
    } as any);

    const result = await evolutionService.getBase64FromMediaMessage('msg-id-123');
    expect(result).toEqual({ mediaType: 'imageMessage', base64: 'abc123base64', mimetype: 'image/jpeg' });
  });

  it('should format message payload with clean phone number when sending text', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'PENDING' }),
    } as any);
    globalThis.fetch = fetchSpy;

    await evolutionService.sendTextMessage('5493425681359@s.whatsapp.net', 'Hola');
    expect(fetchSpy).toHaveBeenCalled();
    const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(callBody.number).toBe('5493425681359');
    expect(callBody.text).toBe('Hola');
  });

  it('should fetch and sort messages for a single remoteJid', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        messages: {
          records: [
            { key: { id: 'msg-2', remoteJid: '123@s.whatsapp.net' }, messageTimestamp: 200 },
            { key: { id: 'msg-1', remoteJid: '123@s.whatsapp.net' }, messageTimestamp: 100 }
          ]
        }
      })
    } as any);
    globalThis.fetch = fetchSpy;

    const result = await evolutionService.fetchMessages('123@s.whatsapp.net');
    expect(result.length).toBe(2);
    expect(result[0].key.id).toBe('msg-1');
    expect(result[1].key.id).toBe('msg-2');
  });

  it('should merge, deduplicate, and sort messages when altJid is provided', async () => {
    const fetchSpy = vi.fn().mockImplementation(async (url, options) => {
      const body = JSON.parse(options.body);
      const targetJid = body.where?.key?.remoteJid;
      if (targetJid === '149052612210901@lid') {
        return {
          ok: true,
          json: async () => ({
            messages: {
              records: [
                { key: { id: 'msg-lid-1', remoteJid: '149052612210901@lid' }, messageTimestamp: 100, message: { conversation: 'Hola' } },
                { key: { id: 'msg-common', remoteJid: '149052612210901@lid' }, messageTimestamp: 150, message: { conversation: 'Shared' } }
              ]
            }
          })
        };
      }
      return {
        ok: true,
        json: async () => ({
          messages: {
            records: [
              { key: { id: 'msg-common', remoteJid: '5493425681359@s.whatsapp.net' }, messageTimestamp: 150, message: { conversation: 'Shared' } },
              { key: { id: 'msg-phone-1', remoteJid: '5493425681359@s.whatsapp.net' }, messageTimestamp: 200, message: { conversation: 'Chau' } }
            ]
          }
        })
      };
    });
    globalThis.fetch = fetchSpy;

    const result = await evolutionService.fetchMessages('149052612210901@lid', 1, 50, '5493425681359@s.whatsapp.net');
    expect(result.length).toBe(3);
    expect(result[0].key.id).toBe('msg-lid-1');
    expect(result[1].key.id).toBe('msg-common');
    expect(result[2].key.id).toBe('msg-phone-1');
  });
});

