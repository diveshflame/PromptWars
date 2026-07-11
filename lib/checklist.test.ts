import { describe, expect, it } from "vitest";
import { computeChecklist } from "./checklist";

describe("computeChecklist", () => {
  it("scales water and food quantities to household size", () => {
    const items = computeChecklist(4);
    expect(items.find((i) => i.item === "Drinking water")?.quantity).toBe("36 liters (3 days)");
    expect(items.find((i) => i.item === "Non-perishable food")?.quantity).toBe("12 meals (3 days)");
  });

  it("rounds flashlights and first aid kits up for odd household sizes", () => {
    const items = computeChecklist(5);
    expect(items.find((i) => i.item === "Flashlights / torches")?.quantity).toBe("3");
    expect(items.find((i) => i.item === "First aid kit")?.quantity).toBe("2");
  });

  it("clamps household size to a minimum of 1", () => {
    const items = computeChecklist(0);
    expect(items.find((i) => i.item === "Drinking water")?.quantity).toBe("9 liters (3 days)");
  });
});
