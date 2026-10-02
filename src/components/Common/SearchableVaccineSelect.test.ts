import { describe, it, expect } from 'vitest';
import { filterVaccineCatalog } from '../../domain/services/vaccineService';
import { VaccineCatalogItem } from '../../domain/types';

describe('SearchableVaccineSelect logic', () => {
  const sampleCatalog: VaccineCatalogItem[] = [
    { id: 'vac-1', name: 'SÉXTUPLE CANINA', species: 'Canino', frequencyDays: 365, description: 'Parvovirus, Moquillo, Hepatitis' },
    { id: 'vac-2', name: 'TRIPLE FELINA', species: 'Felino', frequencyDays: 365, description: 'Rinotraqueítis, Calicivirus, Panleucopenia' },
    { id: 'vac-3', name: 'ANTIRRÁBICA', species: 'Ambos', frequencyDays: 365, description: 'Rabia' }
  ];

  it('filters catalog accurately based on user search input', () => {
    const result = filterVaccineCatalog(sampleCatalog, 'triple');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('vac-2');
  });

  it('filters catalog accurately based on species and text search', () => {
    const felinoOnly = filterVaccineCatalog(sampleCatalog, '', 'Felino');
    expect(felinoOnly).toHaveLength(2); // TRIPLE FELINA + ANTIRRÁBICA (Ambos)

    const caninoAntirrabica = filterVaccineCatalog(sampleCatalog, 'rabia', 'Canino');
    expect(caninoAntirrabica).toHaveLength(1);
    expect(caninoAntirrabica[0].id).toBe('vac-3');
  });
});
