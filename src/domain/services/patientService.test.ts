import { describe, it, expect } from 'vitest';
import { Patient } from '../types';
import { 
  filterPatients, 
  createNewPatientRecord, 
  calculateWeightTrend,
  formatAttachmentFileList,
  updatePatientRecord,
  shouldAutoTriggerPdfOnSave,
  formatConsultationPdfTitle,
  updateClinicalNoteRecord,
  deleteClinicalNoteRecord,
  prepareConsultationPrescriptionText,
  toggleAlertItem,
  formatPatientOptionLabel
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

  it('createNewPatientRecord should set safe default fallback values', () => {
    const newPat = createNewPatientRecord({
      name: 'Max',
      species: 'Canino',
      breed: 'Labrador',
      sex: 'Macho',
      birthDate: '2021-01-01',
      ownerName: 'Ana Gomez'
    });

    expect(newPat.id).toBeDefined();
    expect(newPat.name).toBe('Max');
    expect(newPat.ownerPhone).toBe('+54 9 11 0000-0000');
  });

  it('formatAttachmentFileList should process File objects or names into clean attachment strings', () => {
    const mockFiles = [
      { name: 'radiografia_torax.png' } as File,
      { name: 'analisis_sangre.pdf' } as File
    ];
    const formatted = formatAttachmentFileList(mockFiles);
    expect(formatted).toEqual(['radiografia_torax.png', 'analisis_sangre.pdf']);
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

  it('updatePatientRecord should preserve requiredVaccines when updating patient fields', () => {
    const patientWithReqs: Patient = {
      ...mockPatients[0],
      requiredVaccines: [{ id: 'req-1', vaccineName: 'Antiparasitaria', suggestedDate: '2026-09-20', status: 'pendiente' }]
    };
    const updated = updatePatientRecord([patientWithReqs], 'pat-1', { weightKg: 35 });
    expect(updated[0].requiredVaccines).toHaveLength(1);
    expect(updated[0].requiredVaccines![0].vaccineName).toBe('Antiparasitaria');
  });

  it('updatePatientRecord should update target pet fields correctly', () => {
    const updatedList = updatePatientRecord(mockPatients, 'pat-2', {
      name: 'Muna Editada',
      weightKg: 4.8,
      breed: 'Siamés Mestizo'
    });

    const muna = updatedList.find(p => p.id === 'pat-2');
    expect(muna?.name).toBe('Muna Editada');
    expect(muna?.weightKg).toBe(4.8);
    expect(muna?.breed).toBe('Siamés Mestizo');
    expect(muna?.weightHistory).toContainEqual(expect.objectContaining({ weightKg: 4.8 }));
  });

  describe('PDF Generation Helpers', () => {
    it('shouldAutoTriggerPdfOnSave should return true only when generatePdf flag is set AND prescription is present', () => {
      expect(shouldAutoTriggerPdfOnSave(true, 'Amoxicilina 500mg')).toBe(true);
      expect(shouldAutoTriggerPdfOnSave(false, 'Amoxicilina 500mg')).toBe(false);
      expect(shouldAutoTriggerPdfOnSave(true, '')).toBe(false);
      expect(shouldAutoTriggerPdfOnSave(false, undefined)).toBe(false);
    });

    it('formatConsultationPdfTitle should construct a standardized document title', () => {
      expect(formatConsultationPdfTitle('Rocky', 'Consulta')).toBe('Receta_Consulta_Rocky.pdf');
    });
  });

  describe('Clinical Note Helpers', () => {
    const mockNotes = [
      {
        id: 'note-1',
        patientId: 'pat-1',
        date: '2026-09-10T10:00:00Z',
        vetName: 'Dr. J. Silva',
        notes: 'Consulta inicial de control.',
        prescription: 'Amoxicilina 500mg'
      },
      {
        id: 'note-2',
        patientId: 'pat-1',
        date: '2026-09-12T15:30:00Z',
        vetName: 'Dra. M. Perez',
        notes: 'Control post-operatorio.'
      }
    ];

    it('updateClinicalNoteRecord should update notes, vetName, and prescription of a note', () => {
      const updated = updateClinicalNoteRecord(mockNotes, 'note-1', {
        notes: 'Consulta inicial editada.',
        prescription: 'Amoxicilina 250mg'
      });
      const note1 = updated.find(n => n.id === 'note-1');
      expect(note1?.notes).toBe('Consulta inicial editada.');
      expect(note1?.prescription).toBe('Amoxicilina 250mg');
      expect(note1?.vetName).toBe('Dr. J. Silva');
    });

    it('deleteClinicalNoteRecord should remove the specified clinical note', () => {
      const updated = deleteClinicalNoteRecord(mockNotes, 'note-1');
      expect(updated).toHaveLength(1);
      expect(updated[0].id).toBe('note-2');
    });

    it('prepareConsultationPrescriptionText should return prescription text or fallback to notes', () => {
      expect(prepareConsultationPrescriptionText('Notas de consulta', 'Receta especifica')).toBe('Receta especifica');
      expect(prepareConsultationPrescriptionText('Notas de consulta', '')).toBe('Notas de consulta');
      expect(prepareConsultationPrescriptionText('', '')).toBe('Consulta médica registrada.');
    });

    it('toggleAlertItem should add item if not present, and remove if present', () => {
      const initial = ['Cuidados Especiales'];
      const added = toggleAlertItem(initial, 'Diabético');
      expect(added).toEqual(['Cuidados Especiales', 'Diabético']);

      const removed = toggleAlertItem(added, 'Cuidados Especiales');
      expect(removed).toEqual(['Diabético']);
    });
  });

  describe('formatPatientOptionLabel', () => {
    const mockPat: Patient = {
      id: 'pat-1',
      ownerId: 'own-1',
      ownerName: 'Juan Perez',
      name: 'Prueba 2',
      species: 'Canino',
      breed: 'Mestizo',
      sex: 'Macho',
      birthDate: '2020-01-01',
      status: 'active'
    };

    it('should format full patient option label with breed and tutor', () => {
      expect(formatPatientOptionLabel(mockPat, 'full')).toBe('Prueba 2 (Canino - Mestizo | Tutor: Juan Perez)');
    });

    it('should format short patient option label with species and ownerName', () => {
      expect(formatPatientOptionLabel(mockPat, 'short')).toBe('Prueba 2 (Canino - Juan Perez)');
    });

    it('should format agenda patient option label with Dueño label', () => {
      expect(formatPatientOptionLabel(mockPat, 'agenda')).toBe('Prueba 2 (Canino - Dueño: Juan Perez)');
    });
  });
});
