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
