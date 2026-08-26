import { describe, it, expect } from 'vitest';
import { Patient } from '../types';
import { 
  filterPatients, 
  createNewPatientRecord, 
  calculateWeightTrend 
} from './patientService';

const mockPatients: Patient[] = [
  {
    id: 'pat-1',
    ownerId: 'own-1',
    ownerName: 'Carlos Mendoza',
    ownerPhone: '+54 9 11 2345-6789',
    name: 'Rocky',
    species: 'Canino',
    breed: 'Golden Retriever',
    sex: 'Macho',
    birthDate: '2018-03-12',
    status: 'active',
    weightKg: 32.4,
    alerts: ['Alérgico a Penicilina'],
    weightHistory: [
      { date: 'Ene', weightKg: 31.0 },
      { date: 'Mar', weightKg: 31.5 },
      { date: 'Ago', weightKg: 32.4 }
    ]
  },
  {
    id: 'pat-2',
    ownerId: 'own-2',
    ownerName: 'Laura Vargas',
    ownerPhone: '+54 9 11 8765-4321',
    name: 'Muna',
    species: 'Felino',
    breed: 'Gato Siamés',
    sex: 'Hembra',
    birthDate: '2020-06-15',
    status: 'active',
    weightKg: 4.2,
    alerts: []
  }
];

describe('patientService', () => {
  it('filterPatients should filter by search text correctly', () => {
    const result = filterPatients(mockPatients, 'rocky', 'Todos');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Rocky');
  });

  it('filterPatients should filter by category "Canino"', () => {
    const result = filterPatients(mockPatients, '', 'Canino');
    expect(result).toHaveLength(1);
    expect(result[0].species).toBe('Canino');
  });

  it('filterPatients should filter by category "Felino"', () => {
    const result = filterPatients(mockPatients, '', 'Felino');
    expect(result).toHaveLength(1);
    expect(result[0].species).toBe('Felino');
  });

  it('filterPatients should filter by category "Con Alertas"', () => {
    const result = filterPatients(mockPatients, '', 'Con Alertas');
    expect(result).toHaveLength(1);
    expect(result[0].alerts).toContain('Alérgico a Penicilina');
  });

  it('createNewPatientRecord should create a complete patient object', () => {
    const newPat = createNewPatientRecord({
      name: 'Thor',
      species: 'Canino',
      breed: 'Bulldog',
      sex: 'Macho',
      birthDate: '2022-01-10',
      ownerName: 'Juan Pérez',
      ownerPhone: '+54 9 11 1111-2222',
      weightKg: 25.0,
      alerts: ['Esterilizado']
    });

    expect(newPat.id).toBeDefined();
    expect(newPat.name).toBe('Thor');
    expect(newPat.alerts).toHaveLength(1);
    expect(newPat.weightHistory).toHaveLength(1);
    expect(newPat.weightHistory![0].weightKg).toBe(25.0);
  });

  it('calculateWeightTrend should compute net weight change and trend text', () => {
    const history = [
      { date: 'Ene', weightKg: 31.0 },
      { date: 'Ago', weightKg: 32.4 }
    ];

    const trend = calculateWeightTrend(history);
    expect(trend.diff).toBeCloseTo(1.4);
    expect(trend.direction).toBe('up');
    expect(trend.formatted).toBe('+1.4 kg');
  });
});
