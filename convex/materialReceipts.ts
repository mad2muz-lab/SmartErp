import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Generate MR number
export const generateMRNumber = query({
  args: { organization_id: v.id("organizations") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const year = new Date().getFullYear();
    const existingMRs = await ctx.db
      .query("material_receipts")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.gte(q.field("receipt_number"), `MR-${year}-`))
      .filter((q) => q.lt(q.field("receipt_number"), `MR-${year + 1}-`))
      .collect();

    const nextNumber = existingMRs.length + 1;
    return `MR-${year}-${nextNumber.toString().padStart(5, '0')}`;
  },
});

// Create material receipt
export const createMaterialReceipt = mutation({
  args: {
    organization_id: v.id("organizations"),
    receipt_number: v.string(),
    purchase_order_id: v.id("purchase_orders"),
    supplier_id: v.id("suppliers"),
    receipt_date: v.string(),
    delivery_note_number: v.optional(v.string()),
    truck_number: v.optional(v.string()),
    driver_name: v.optional(v.string()),
    notes: v.optional(v.string()),
    received_by: v.optional(v.string()),
    created_by: v.optional(v.string()),
  },
  returns: v.id("material_receipts"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("material_receipts", {
      ...args,
      status: "received",
      created_at: now,
      updated_at: now,
    });
  },
});

// Update material receipt
export const updateMaterialReceipt = mutation({
  args: {
    id: v.id("material_receipts"),
    purchase_order_id: v.optional(v.id("purchase_orders")),
    supplier_id: v.optional(v.id("suppliers")),
    receipt_date: v.optional(v.string()),
    delivery_note_number: v.optional(v.string()),
    status: v.optional(v.union(v.literal("received"), v.literal("partially_received"), v.literal("completed"))),
    notes: v.optional(v.string()),
    received_by: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

// List material receipts
export const listMaterialReceipts = query({
  args: { organization_id: v.id("organizations") },
  returns: v.array(v.object({
    _id: v.id("material_receipts"),
    _creationTime: v.number(),
    receipt_number: v.string(),
    organization_id: v.id("organizations"),
    purchase_order_id: v.id("purchase_orders"),
    supplier_id: v.id("suppliers"),
    receipt_date: v.string(),
    delivery_note_number: v.optional(v.string()),
    status: v.union(v.literal("received"), v.literal("partially_received"), v.literal("completed")),
    notes: v.optional(v.string()),
    received_by: v.optional(v.string()),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("material_receipts")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .order("desc")
      .collect();
  },
});

// Get material receipt by ID
export const getMaterialReceipt = query({
  args: { id: v.id("material_receipts") },
  returns: v.union(
    v.object({
      _id: v.id("material_receipts"),
      _creationTime: v.number(),
      receipt_number: v.string(),
      organization_id: v.id("organizations"),
      purchase_order_id: v.id("purchase_orders"),
      supplier_id: v.id("suppliers"),
      receipt_date: v.string(),
      delivery_note_number: v.optional(v.string()),
      status: v.union(v.literal("received"), v.literal("partially_received"), v.literal("completed")),
      notes: v.optional(v.string()),
      received_by: v.optional(v.string()),
      created_by: v.optional(v.string()),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Delete material receipt
export const deleteMaterialReceipt = mutation({
  args: { id: v.id("material_receipts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First delete all related items
    const items = await ctx.db
      .query("material_receipt_items")
      .withIndex("by_material_receipt", (q) => q.eq("material_receipt_id", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Then delete the material receipt
    await ctx.db.delete(args.id);
    return null;
  },
});

// Mark material receipt as partially received
export const markPartiallyReceived = mutation({
  args: { 
    id: v.id("material_receipts")
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "partially_received",
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

// Complete material receipt
export const completeMaterialReceipt = mutation({
  args: { 
    id: v.id("material_receipts")
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});
