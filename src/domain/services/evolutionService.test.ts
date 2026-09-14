import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evolutionService } from '../../services/evolutionService';

describe('evolutionService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return config object from environment', () => {
    const config = evolutionService.getConfig();
    expect(config).toHaveProperty('apiUrl');
    expect(config).toHaveProperty('apiKey');
    expect(config).toHaveProperty('instance');
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
});
