import { describe, it, expect } from 'vitest';
import { GroomingService } from '../../domain/types';

const mockServices: GroomingService[] = [
  { id: 'srv-1', name: 'Baño y Corte Canino', durationMinutes: 60, price: 4500, description: 'Baño completo con corte de pelo' },
  { id: 'srv-2', name: 'Baño Sanitario Felino', durationMinutes: 45, price: 5200, description: 'Tratamiento antiparasitario' },
  { id: 'srv-3', name: 'Corte de Uñas', durationMinutes: 15, price: 1200 },
  { id: 'srv-4', name: 'Deslanado Profundo', durationMinutes: 90, price: 6000 }
];

describe('SearchableServiceSelect filtering logic', () => {
  it('returns all services when query is empty', () => {
    const query = '';
    const filtered = mockServices.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(query.toLowerCase())) ||
      s.price.toString().includes(query)
    );
    expect(filtered).toHaveLength(4);
  });

  it('filters services by name case-insensitively', () => {
    const query = 'corte';
    const filtered = mockServices.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(query.toLowerCase())) ||
      s.price.toString().includes(query)
    );
    expect(filtered.map(s => s.id)).toEqual(['srv-1', 'srv-3']);
  });

  it('filters services by description', () => {
    const query = 'antiparasitario';
    const filtered = mockServices.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(query.toLowerCase())) ||
      s.price.toString().includes(query)
    );
    expect(filtered.map(s => s.id)).toEqual(['srv-2']);
  });

  it('filters services by price', () => {
    const query = '6000';
    const filtered = mockServices.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(query.toLowerCase())) ||
      s.price.toString().includes(query)
    );
    expect(filtered.map(s => s.id)).toEqual(['srv-4']);
  });

  it('returns empty array when no match is found', () => {
    const query = 'inexistente';
    const filtered = mockServices.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(query.toLowerCase())) ||
      s.price.toString().includes(query)
    );
    expect(filtered).toHaveLength(0);
  });
});
