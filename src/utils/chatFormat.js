import { findClientForPhone } from './phoneMatcher';

export function formatChatTimestamp(timestamp) {
  if (!timestamp) return '';
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1)) 
    : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}


export function extractMessageContent(msg) {
  if (!msg) return '';
  if (typeof msg === 'string') return msg;
  if (msg.conversation) return msg.conversation;
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
  if (msg.imageMessage) return '📷 Imagen' + (msg.imageMessage.caption ? `: ${msg.imageMessage.caption}` : '');
  if (msg.audioMessage) return '🎵 Audio';
  if (msg.documentMessage) return `📄 Documento: ${msg.documentMessage.fileName || 'Archivo'}`;
  if (msg.videoMessage) return '🎥 Video';
  return '';
}

/**
 * Extrae el número de teléfono limpio de un objeto de chat de WhatsApp,
 * resolviendo LIDs (remoteJidAlt) cuando corresponda.
 */
export function extractPhoneFromChat(chat) {
  if (!chat) return '';

  const remoteJidAlt = chat.lastMessage?.key?.remoteJidAlt || chat.remoteJidAlt;
  if (remoteJidAlt && typeof remoteJidAlt === 'string' && !remoteJidAlt.includes('@lid')) {
    const raw = remoteJidAlt.split('@')[0].replace(/\D/g, '');
    if (raw) return raw;
  }

  const remoteJid = chat.remoteJid || chat.id || '';
  if (remoteJid && typeof remoteJid === 'string' && !remoteJid.includes('@lid')) {
    const raw = remoteJid.split('@')[0].replace(/\D/g, '');
    if (raw) return raw;
  }

  const msgRemoteJid = chat.lastMessage?.key?.remoteJid;
  if (msgRemoteJid && typeof msgRemoteJid === 'string' && !msgRemoteJid.includes('@lid')) {
    const raw = msgRemoteJid.split('@')[0].replace(/\D/g, '');
    if (raw) return raw;
  }

  const fallback = (chat.remoteJid || chat.id || '').split('@')[0].replace(/\D/g, '');
  return fallback;
}

/**
 * Formatea un número numérico de teléfono para mostrar legiblemente.
 */
export function formatPhoneNumber(phone) {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 13 && clean.startsWith('549')) {
    return `+54 9 ${clean.slice(3, 6)} ${clean.slice(6, 9)}-${clean.slice(9)}`;
  }
  if (clean.length === 12 && clean.startsWith('54')) {
    return `+54 ${clean.slice(2, 5)} ${clean.slice(5, 8)}-${clean.slice(8)}`;
  }
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)}-${clean.slice(6)}`;
  }
  return clean;
}

/**
 * Resuelve el nombre de contacto a mostrar para un chat de WhatsApp:
 * 1. Prioriza cliente/tutor de VETSOFT (haciendo match por teléfono).
 * 2. Si no hay match, usa el pushName / contact name de WhatsApp.
 * 3. Si no hay pushName válido, formatea el número de teléfono.
 */
export function resolveChatDisplayName(chat, patientsList = []) {
  if (!chat) return '';

  const cleanPhone = extractPhoneFromChat(chat);
  const clientMatch = cleanPhone ? findClientForPhone(cleanPhone, patientsList) : null;

  if (clientMatch) {
    return clientMatch.ownerName 
      ? `${clientMatch.ownerName} (${clientMatch.name || 'Mascota'})` 
      : (clientMatch.name || 'Cliente');
  }

  const candidateNames = [
    chat.pushName,
    chat.name,
    chat.verifiedName,
    chat.contact?.pushName,
    chat.contact?.name,
    chat.lastMessage?.pushName
  ];

  for (const name of candidateNames) {
    if (name && typeof name === 'string') {
      const trimmed = name.trim();
      if (
        trimmed && 
        trimmed !== 'Você' && 
        trimmed !== 'Usted' && 
        !/^\d+$/.test(trimmed)
      ) {
        return trimmed;
      }
    }
  }

  if (cleanPhone && cleanPhone.length >= 8) {
    return formatPhoneNumber(cleanPhone);
  }

  const rawNum = (chat.remoteJid || chat.id || '').split('@')[0];
  return rawNum || 'Contacto';
}

/**
 * Obtiene la URL de la foto de perfil del chat o cliente si está disponible.
 */
export function getChatAvatarUrl(chat) {
  if (!chat) return null;
  return chat.profilePicUrl || 
         chat.pictureUrl || 
         chat.profilePictureUrl || 
         chat.clientData?.photo || 
         chat.clientData?.avatar || 
         null;
}

