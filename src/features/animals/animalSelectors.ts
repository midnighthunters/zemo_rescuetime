import type { Animal, RescueProgress } from "../../data/types";

export function getCurrentAnimal(
  animals: Animal[],
  rescueProgress: RescueProgress | null
) {
  if (!rescueProgress) {
    return animals[0];
  }

  return (
    animals.find((animal) => animal.id === rescueProgress.currentAnimalId) ??
    animals.find((animal) => !rescueProgress.rescuedAnimalIds.includes(animal.id))
  );
}

export function getUnlockedAnimals(
  animals: Animal[],
  rescueProgress: RescueProgress | null
) {
  if (!rescueProgress) {
    return [];
  }

  return animals.filter((animal) =>
    rescueProgress.rescuedAnimalIds.includes(animal.id)
  );
}

export function getLockedAnimals(
  animals: Animal[],
  rescueProgress: RescueProgress | null
) {
  if (!rescueProgress) {
    return animals;
  }

  return animals.filter(
    (animal) => !rescueProgress.rescuedAnimalIds.includes(animal.id)
  );
}
