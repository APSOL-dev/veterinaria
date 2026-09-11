/**
 * Servicio para operaciones con Evolution API (WhatsApp)
 */
const getEnv = () => ({
  apiUrl: import.meta.env.VITE_EVOLUTION_API_URL || '',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || '',
  instance: import.meta.env.VITE_EVOLUTION_INSTANCE || '',
});

async function apiRequest(method, path, body = null) {
  const { apiUrl, apiKey } = getEnv();
  if (!apiUrl || !apiKey) {
    throw new Error('Faltan configurar las credenciales de Evolution API.');
  }
  const cleanUrl = apiUrl.replace(/\/$/, '');
  const url = `${cleanUrl}${path}`;
  const headers = {
    apikey: apiKey,
    'Content-Type': 'application/json',
  };
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    let errorJson;
    try { errorJson = JSON.parse(errorText); } catch (_) {}
    throw new Error(errorJson?.message || errorJson?.error || `Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const evolutionService = {
  getConfig: () => getEnv(),
  async getConnectionState() {
    const { instance } = getEnv();
    if (!instance) return 'close';
    try {
      const data = await apiRequest('GET', `/instance/connectionState/${instance}`);
      return data?.instance?.state || data?.connectionState?.state || 'close';
    } catch (err) {
      if (err.message?.toLowerCase().includes('not found')) return 'not_found';
      return 'close';
    }
  },
  async getConnectionStateFull() {
    const { instance } = getEnv();
    return await apiRequest('GET', `/instance/connectionState/${instance}`);
  },
  async getQrCode() {
    const { instance } = getEnv();
    const data = await apiRequest('GET', `/instance/connect/${instance}`);
    return {
      base64: data?.base64 || data?.code?.base64 || data?.qrcode?.base64 || '',
      code: data?.code || data?.qrcode?.code || '',
    };
  },
  async logoutInstance() {
    const { instance } = getEnv();
    return await apiRequest('DELETE', `/instance/logout/${instance}`);
  },
  async fetchChats() {
    const { instance } = getEnv();
    return await apiRequest('POST', `/chat/findChats/${instance}`, {});
  },
  async fetchMessages(remoteJid, page = 1, limit = 50) {
    const { instance } = getEnv();
    return await apiRequest('POST', `/chat/findMessages/${instance}`, {
      where: { key: { remoteJid } },
      limit,
      page,
    });
  },
  async sendTextMessage(number, text) {
    const { instance } = getEnv();
    const cleanNum = String(number).replace(/\D/g, '');
    return await apiRequest('POST', `/message/sendText/${instance}`, {
      number: cleanNum,
      text,
      options: { delay: 1200, presence: 'composing' },
    });
  },
  async sendMediaMessage(number, mediaBase64, mediatype, fileName, caption = '') {
    const { instance } = getEnv();
    const cleanNum = String(number).replace(/\D/g, '');
    return await apiRequest('POST', `/message/sendMedia/${instance}`, {
      number: cleanNum,
      mediaMessage: {
        mediatype,
        caption,
        media: mediaBase64,
        fileName,
      },
    });
  },
  async sendAudioMessage(number, audioBase64) {
    const { instance } = getEnv();
    const cleanNum = String(number).replace(/\D/g, '');
    return await apiRequest('POST', `/message/sendWhatsAppAudio/${instance}`, {
      number: cleanNum,
      audioMessage: { audio: audioBase64 },
    });
  },
  async markAsRead(remoteJid) {
    const { instance } = getEnv();
    return await apiRequest('POST', `/chat/markMessageAsRead/${instance}`, {
      readMessages: [{ remoteJid }],
    });
  },
};
