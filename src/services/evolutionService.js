/**
 * Servicio para operaciones con Evolution API (WhatsApp)
 */
const DEFAULT_API_URL = 'https://prueba-evolution-api.uxxqdc.easypanel.host';
const DEFAULT_API_KEY = '8AF3602FB24C-4164-9BA6-8B98A684A682';
const DEFAULT_INSTANCE = 'Veterinaria Arlekyn';

const getEnv = () => ({
  apiUrl: import.meta.env.VITE_EVOLUTION_API_URL || DEFAULT_API_URL,
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || DEFAULT_API_KEY,
  instance: import.meta.env.VITE_EVOLUTION_INSTANCE || DEFAULT_INSTANCE,
});

function safeStringifyError(errorJson, errorText, status, statusText) {
  if (!errorJson) return errorText || `Error ${status}: ${statusText}`;

  const candidate = 
    errorJson.message ||
    errorJson.response?.message ||
    errorJson.response?.data?.message ||
    errorJson.response?.data ||
    errorJson.data?.message ||
    errorJson.error ||
    errorJson.reason;

  if (!candidate) {
    return typeof errorJson === 'object' ? JSON.stringify(errorJson) : String(errorJson);
  }

  if (typeof candidate === 'string') return candidate;
  if (Array.isArray(candidate)) {
    return candidate.map(c => typeof c === 'object' ? JSON.stringify(c) : String(c)).join(', ');
  }
  if (typeof candidate === 'object') {
    return JSON.stringify(candidate);
  }
  return String(candidate);
}

async function apiRequest(method, path, body = null) {
  const { apiUrl, apiKey } = getEnv();
  if (!apiUrl || !apiKey) {
    throw new Error('Faltan configurar las credenciales del servidor de mensajería.');
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
    const messageStr = safeStringifyError(errorJson, errorText, response.status, response.statusText);
    throw new Error(messageStr);
  }
  return response.json();
}

let resolvedInstanceName = null;

async function getInstanceName() {
  const { instance } = getEnv();
  if (resolvedInstanceName) return resolvedInstanceName;
  if (instance && instance !== 'DEFAULT') {
    resolvedInstanceName = instance;
    return resolvedInstanceName;
  }

  try {
    const list = await apiRequest('GET', '/instance/fetchInstances');
    const instancesList = Array.isArray(list) ? list : (list?.value || []);
    if (instancesList.length > 0 && instancesList[0]?.name) {
      resolvedInstanceName = instancesList[0].name;
      return resolvedInstanceName;
    }
  } catch (err) {
    console.warn('Error resolviendo instancia activa:', err);
  }

  resolvedInstanceName = instance || 'Veterinaria Arlekyn';
  return resolvedInstanceName;
}

export const evolutionService = {
  getConfig: () => getEnv(),
  async getConnectionState() {
    try {
      const instance = await getInstanceName();
      if (!instance) return 'close';
      const data = await apiRequest('GET', `/instance/connectionState/${encodeURIComponent(instance)}`);
      return data?.instance?.state || data?.connectionState?.state || 'close';
    } catch (err) {
      if (err.message?.toLowerCase().includes('not found')) return 'not_found';
      return 'close';
    }
  },
  async getConnectionStateFull() {
    const instance = await getInstanceName();
    return await apiRequest('GET', `/instance/connectionState/${encodeURIComponent(instance)}`);
  },
  async getQrCode() {
    const instance = await getInstanceName();
    const data = await apiRequest('GET', `/instance/connect/${encodeURIComponent(instance)}`);
    
    let rawBase64 = data?.base64 || 
                    data?.code?.base64 || 
                    data?.qrcode?.base64 || 
                    (typeof data?.qrcode === 'string' ? data.qrcode : '') ||
                    (typeof data?.code === 'string' && data.code.includes('base64') ? data.code : '');

    if (!rawBase64 && typeof data === 'object' && data !== null) {
      for (const val of Object.values(data)) {
        if (typeof val === 'string' && (val.startsWith('data:image') || val.length > 200)) {
          rawBase64 = val;
          break;
        } else if (val && typeof val === 'object') {
          for (const subVal of Object.values(val)) {
            if (typeof subVal === 'string' && (subVal.startsWith('data:image') || subVal.length > 200)) {
              rawBase64 = subVal;
              break;
            }
          }
        }
      }
    }

    let finalBase64 = rawBase64 || '';
    if (finalBase64 && !finalBase64.startsWith('data:')) {
      finalBase64 = `data:image/png;base64,${finalBase64}`;
    }

    return {
      base64: finalBase64,
      code: data?.code || data?.qrcode?.code || data?.pairingCode || '',
      raw: data
    };
  },
  async logoutInstance() {
    const instance = await getInstanceName();
    return await apiRequest('DELETE', `/instance/logout/${encodeURIComponent(instance)}`);
  },
  async fetchChats() {
    const instance = await getInstanceName();
    return await apiRequest('POST', `/chat/findChats/${encodeURIComponent(instance)}`, {});
  },
  async fetchMessages(remoteJid, page = 1, limit = 50) {
    const instance = await getInstanceName();
    return await apiRequest('POST', `/chat/findMessages/${encodeURIComponent(instance)}`, {
      where: { key: { remoteJid } },
      limit,
      page,
    });
  },
  async sendTextMessage(number, text) {
    const instance = await getInstanceName();
    const cleanNum = String(number).endsWith('@g.us') ? number : String(number).replace(/\D/g, '');
    return await apiRequest('POST', `/message/sendText/${encodeURIComponent(instance)}`, {
      number: cleanNum,
      text,
    });
  },
  async sendMediaMessage(number, mediaBase64, mediatype, fileName, caption = '') {
    const instance = await getInstanceName();
    const cleanNum = String(number).endsWith('@g.us') ? number : String(number).replace(/\D/g, '');
    const formattedMedia = mediaBase64.startsWith('data:') ? mediaBase64 : `data:${mediatype === 'image' ? 'image/png' : 'application/pdf'};base64,${mediaBase64}`;
    return await apiRequest('POST', `/message/sendMedia/${encodeURIComponent(instance)}`, {
      number: cleanNum,
      mediaMessage: {
        mediatype,
        caption,
        media: formattedMedia,
        fileName,
      },
      media: formattedMedia,
      mediatype,
      caption,
      fileName,
    });
  },
  async sendAudioMessage(number, audioBase64) {
    const instance = await getInstanceName();
    const cleanNum = String(number).endsWith('@g.us') ? number : String(number).replace(/\D/g, '');
    const formattedAudio = audioBase64.startsWith('data:') ? audioBase64 : `data:audio/ogg;codecs=opus;base64,${audioBase64}`;
    return await apiRequest('POST', `/message/sendWhatsAppAudio/${encodeURIComponent(instance)}`, {
      number: cleanNum,
      audio: formattedAudio,
      audioMessage: { audio: formattedAudio },
    });
  },
  async markAsRead(remoteJid) {
    const instance = await getInstanceName();
    return await apiRequest('POST', `/chat/markMessageAsRead/${encodeURIComponent(instance)}`, {
      readMessages: [{ remoteJid }],
    });
  },
  async getBase64FromMediaMessage(messageKeyOrId) {
    const instance = await getInstanceName();
    let keyObj = {};
    if (typeof messageKeyOrId === 'string') {
      keyObj = { id: messageKeyOrId };
    } else if (messageKeyOrId?.key) {
      keyObj = messageKeyOrId.key;
    } else if (messageKeyOrId?.id) {
      keyObj = { id: messageKeyOrId.id };
    }
    return await apiRequest('POST', `/chat/getBase64FromMediaMessage/${encodeURIComponent(instance)}`, {
      message: { key: keyObj },
      convertToMp4: false,
    });
  },
};
