import type { AnimalCardStatus } from "../../data/types";

export const FREE_ANIMAL_COUNT = 4;

export function canAccessAnimalIndex(index: number, isPro: boolean) {
  return isPro || index < FREE_ANIMAL_COUNT;
}

export function getAnimalCardStatus(options: {
  index: number;
  animalId: string;
  currentAnimalId: string;
  rescuedAnimalIds: string[];
  isPro: boolean;
}): AnimalCardStatus {
  const isRescued = options.rescuedAnimalIds.includes(options.animalId);

  if (isRescued) {
    return "unlocked";
  }

  if (!canAccessAnimalIndex(options.index, options.isPro)) {
    return "pro_locked";
  }

  if (options.currentAnimalId === options.animalId) {
    return "active";
  }

  return "locked";
}
