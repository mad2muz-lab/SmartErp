import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create material receipt item
export const createMaterialReceiptItem = mutation({
  args: {
    material_receipt_id: v.id("material_receipts"),
    purchase_order_item_id: v.id("purchase_order_items"),
    item_name: v.string(),
    quantity_ordered: v.number(),
    quantity_received: v.number(),
    quantity_accepted: v.number(),
    quantity_rejected: v.number(),
    rejection_reason: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("material_receipt_items"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("material_receipt_items", {
      ...args,
      created_at: new Date().toISOString(),
    });
  },
});

// Update material receipt item
export const updateMaterialReceiptItem = mutation({
  args: {
    id: v.id("material_receipt_items"),
    item_name: v.optional(v.string()),
    quantity_ordered: v.optional(v.number()),
    quantity_received: v.optional(v.number()),
    quantity_accepted: v.optional(v.number()),
    quantity_rejected: v.optional(v.number()),
    rejection_reason: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

// Delete material receipt items
export const deleteMaterialReceiptItems = mutation({
  args: { material_receipt_id: v.id("material_receipts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("material_receipt_items")
      .withIndex("by_material_receipt", (q) => q.eq("material_receipt_id", args.material_receipt_id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return null;
  },
});

// List material receipt items
export const listMaterialReceiptItems = query({
  args: { material_receipt_id: v.id("material_receipts") },
  returns: v.array(v.object({
    _id: v.id("material_receipt_items"),
    _creationTime: v.number(),
    material_receipt_id: v.id("material_receipts"),
    purchase_order_item_id: v.id("purchase_order_items"),
    item_name: v.string(),
    quantity_ordered: v.number(),
    quantity_received: v.number(),
    quantity_accepted: v.number(),
    quantity_rejected: v.number(),
    rejection_reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_at: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("material_receipt_items")
      .withIndex("by_material_receipt", (q) => q.eq("material_receipt_id", args.material_receipt_id))
      .collect();
  },
});
