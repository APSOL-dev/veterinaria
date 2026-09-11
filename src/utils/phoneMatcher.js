export function normalizePhoneForMatching(phone) {
  if (!phone) return '';
  let clean = String(phone).replace(/\D/g, '');
  if (clean.startsWith('549')) {
    clean = '54' + clean.slice(3);
  }
  if (clean.startsWith('15') && (clean.length === 9 || clean.length === 10)) {
    clean = clean.slice(2);
  }
  return clean;
}

export function findClientForPhone(phone, clientsList = []) {
  if (!phone || !Array.isArray(clientsList)) return null;
  const targetClean = normalizePhoneForMatching(phone);
  if (!targetClean) return null;
  const targetNo54 = targetClean.replace(/^54/, '');

  return clientsList.find(c => {
    const checkMatch = (val) => {
      if (!val) return false;
      const norm = normalizePhoneForMatching(val);
      if (!norm) return false;
      return norm === targetClean || norm.replace(/^54/, '') === targetNo54;
    };

    if (checkMatch(c.telefono)) return true;
    if (checkMatch(c.ownerPhone)) return true;
    if (checkMatch(c.phone)) return true;
    if (Array.isArray(c.telefonos)) {
      return c.telefonos.some(t => checkMatch(t.numero || t));
    }
    return false;
  }) || null;
}
