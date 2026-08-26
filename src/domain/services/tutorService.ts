import { Patient, Species } from '../types';

export interface TutorSummary {
  ownerName: string;
  ownerPhone: string;
  address?: string;
  email?: string;
  pets: Patient[];
}

export function getUniqueTutores(patients: Patient[]): TutorSummary[] {
  const tutorMap = new Map<string, TutorSummary>();

  patients.forEach(p => {
    const key = p.ownerName.trim().toLowerCase();
    if (!tutorMap.has(key)) {
      tutorMap.set(key, {
        ownerName: p.ownerName,
        ownerPhone: p.ownerPhone || 'Sin teléfono',
        pets: [p]
      });
    } else {
      tutorMap.get(key)!.pets.push(p);
    }
  });

  return Array.from(tutorMap.values());
}

export function updateTutorAndPetInfo(
  patients: Patient[],
  originalOwnerName: string,
  updates: {
    newOwnerName: string;
    newOwnerPhone: string;
    petUpdates?: Record<string, { name?: string; species?: Species; breed?: string; weightKg?: number }>;
  }
): Patient[] {
  const keyToMatch = originalOwnerName.trim().toLowerCase();

  return patients.map(p => {
    if (p.ownerName.trim().toLowerCase() === keyToMatch) {
      const petUpdate = updates.petUpdates?.[p.id];
      return {
        ...p,
        ownerName: updates.newOwnerName,
        ownerPhone: updates.newOwnerPhone,
        name: petUpdate?.name !== undefined ? petUpdate.name : p.name,
        species: (petUpdate?.species !== undefined ? petUpdate.species : p.species) as Species,
        breed: petUpdate?.breed !== undefined ? petUpdate.breed : p.breed,
        weightKg: petUpdate?.weightKg !== undefined ? petUpdate.weightKg : p.weightKg
      };
    }
    return p;
  });
}
