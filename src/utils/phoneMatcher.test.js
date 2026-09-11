import { describe, it, expect } from 'vitest';
import { normalizePhoneForMatching, findClientForPhone } from './phoneMatcher';

describe('phoneMatcher utility', () => {
  it('should normalize Argentine phone numbers for matching', () => {
    expect(normalizePhoneForMatching('+54 9 342 512-3456')).toBe('543425123456');
    expect(normalizePhoneForMatching('5493425123456')).toBe('543425123456');
    expect(normalizePhoneForMatching('155123456')).toBe('5123456');
  });

  it('should find client by matching phone number in clientsList', () => {
    const clients = [
      { id: '1', ownerName: 'Carlos Gómez', ownerPhone: '5493425123456', name: 'Firulais' },
      { id: '2', ownerName: 'María Fernández', ownerPhone: '3429876543', name: 'Lola' }
    ];

    const match = findClientForPhone('3425123456', clients);
    expect(match).not.toBeNull();
    expect(match.ownerName).toBe('Carlos Gómez');

    const noMatch = findClientForPhone('999999999', clients);
    expect(noMatch).toBeNull();
  });
});
