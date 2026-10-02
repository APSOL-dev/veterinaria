/**
 * Convierte un data URL (data:application/pdf;base64,...) en un File.
 * Devuelve null si el texto no es un data URL válido.
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File | null {
  const match = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(dataUrl || '');
  if (!match) return null;
  try {
    const mime = match[1] || 'application/octet-stream';
    const raw = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    return new File([bytes], fileName || 'comprobante', { type: mime });
  } catch {
    return null;
  }
}

/**
 * Nombre de archivo apto para almacenamiento: sin acentos ni caracteres raros, conservando la extensión.
 */
export function toSafeFileName(name: string): string {
  const cleaned = (name || 'comprobante')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || 'comprobante';
}

/**
 * Indica si el archivo se puede mostrar embebido (PDF o imagen).
 */
export function getVoucherKind(fileName?: string, url?: string): 'pdf' | 'image' | 'other' {
  const ref = `${fileName || ''} ${(url || '').startsWith('data:') ? (url || '').slice(0, 30) : url || ''}`.toLowerCase();
  if (/\.pdf\b|application\/pdf/.test(ref)) return 'pdf';
  if (/\.(png|jpe?g|webp|gif)\b|image\//.test(ref)) return 'image';
  return 'other';
}
