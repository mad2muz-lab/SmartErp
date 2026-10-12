import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all units - NEW FILE
export const listUnits = query({
  args: {},
  handler: async (ctx) => {
    console.log("listUnits called from unitsNew.ts");
    return [
      "Piece",
      "Box", 
      "Pack",
      "Kg",
      "Gram",
      "Liter",
      "Meter",
      "Hour",
      "Day",
      "Custom"
    ];
  },
});

// Test function
export const testUnits = query({
  args: {},
  handler: async (ctx) => {
    return { message: "UnitsNew module working", timestamp: new Date().toISOString() };
  },
});

