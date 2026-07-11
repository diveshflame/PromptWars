import type { ChecklistItem } from "./types";

const WATER_LITERS_PER_PERSON_PER_DAY = 3;
const EMERGENCY_SUPPLY_DAYS = 3;

/**
 * Pure quantity calculation, independent of the LLM call, so the numbers
 * shown to the user are always grounded rather than model-invented.
 */
export function computeChecklist(householdSize: number): ChecklistItem[] {
  const size = Math.max(1, Math.floor(householdSize));
  const waterLiters = size * WATER_LITERS_PER_PERSON_PER_DAY * EMERGENCY_SUPPLY_DAYS;
  const flashlights = Math.ceil(size / 2);
  const firstAidKits = Math.max(1, Math.ceil(size / 4));

  return [
    { item: "Drinking water", quantity: `${waterLiters} liters (${EMERGENCY_SUPPLY_DAYS} days)` },
    { item: "Non-perishable food", quantity: `${size * EMERGENCY_SUPPLY_DAYS} meals (${EMERGENCY_SUPPLY_DAYS} days)` },
    { item: "Flashlights / torches", quantity: `${flashlights}` },
    { item: "First aid kit", quantity: `${firstAidKits}` },
    { item: "Power bank / backup charger", quantity: "1 per household" },
    { item: "Waterproof document pouch", quantity: "1 (ID, insurance, cash)" },
    { item: "Essential medication supply", quantity: `${EMERGENCY_SUPPLY_DAYS}-day supply per person` },
    { item: "Blankets / warm clothing", quantity: `${size}` },
  ];
}
