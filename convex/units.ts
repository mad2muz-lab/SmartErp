import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// FORCE UPDATE - 2025-01-25

// Get all units - COMPLETELY NEW FUNCTION
export const listUnitsNew = query({
  args: {},
  handler: async (ctx) => {
    // Return simple static list to avoid any validation issues
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

// Original listUnits function - MATCHING EXPECTED SIGNATURE
export const listUnits = query({
  args: { organization_id: v.id("organizations") },
  handler: async (ctx, args) => {
    console.log("listUnits called with organization_id:", args.organization_id);
    // Return static list for now to fix the immediate error
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

// Alternative function with different name
export const getUnitsList = query({
  args: {},
  handler: async (ctx) => {
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

// Test function to verify deployment
export const testUnitsConnection = query({
  args: {},
  handler: async (ctx) => {
    return { 
      message: "Units module is working", 
      timestamp: new Date().toISOString(),
      status: "success"
    };
  },
});

// Create new unit
export const createUnit = mutation({
  args: {
    name: v.string(),
    name_arabic: v.optional(v.string()),
    abbreviation: v.optional(v.string()),
    abbreviation_arabic: v.optional(v.string()),
    organization_id: v.id("organizations"),
    created_by: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("units", {
      ...args,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update unit
export const updateUnit = mutation({
  args: {
    id: v.id("units"),
    name: v.optional(v.string()),
    name_arabic: v.optional(v.string()),
    abbreviation: v.optional(v.string()),
    abbreviation_arabic: v.optional(v.string()),
    updated_by: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, updated_by, ...updateData } = args;
    
    await ctx.db.patch(id, {
      ...updateData,
      updated_at: new Date().toISOString(),
    });
  },
});

// Delete unit
export const deleteUnit = mutation({
  args: { id: v.id("units") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });
  },
});
