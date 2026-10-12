import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create purchase requisition item
export const createPurchaseRequisitionItem = mutation({
  args: {
    purchase_requisition_id: v.id("purchase_requisitions"),
    inventory_id: v.optional(v.id("inventory")),
    item_name: v.string(),
    description: v.optional(v.string()),
    quantity: v.number(),
    estimated_unit_price: v.number(),
    total_estimated_price: v.number(),
    specifications: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
    item_no: v.optional(v.string()),
    item_title: v.optional(v.string()),
    unit: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))), // [2025-01-11] Added - Item priority
    required_date: v.optional(v.string()), // [2025-01-11] Added - Item required date
  },
  returns: v.id("purchase_requisition_items"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("purchase_requisition_items", {
      ...args,
      created_at: new Date().toISOString(),
    });
  },
});

// Update purchase requisition item
export const updatePurchaseRequisitionItem = mutation({
  args: {
    id: v.id("purchase_requisition_items"),
    inventory_id: v.optional(v.id("inventory")),
    item_name: v.optional(v.string()),
    description: v.optional(v.string()),
    quantity: v.optional(v.number()),
    estimated_unit_price: v.optional(v.number()),
    total_estimated_price: v.optional(v.number()),
    specifications: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
    item_no: v.optional(v.string()),
    item_title: v.optional(v.string()),
    unit: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))), // [2025-01-11] Added - Item priority
    required_date: v.optional(v.string()), // [2025-01-11] Added - Item required date
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

// Delete purchase requisition items
export const deletePurchaseRequisitionItems = mutation({
  args: { purchase_requisition_id: v.id("purchase_requisitions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("purchase_requisition_items")
      .withIndex("by_purchase_requisition", (q) => q.eq("purchase_requisition_id", args.purchase_requisition_id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return null;
  },
});

// List purchase requisition items
export const listPurchaseRequisitionItems = query({
  args: { purchase_requisition_id: v.id("purchase_requisitions") },
  returns: v.array(v.object({
    _id: v.id("purchase_requisition_items"),
    _creationTime: v.number(),
    purchase_requisition_id: v.id("purchase_requisitions"),
    inventory_id: v.optional(v.id("inventory")),
    item_name: v.string(),
    description: v.optional(v.string()),
    quantity: v.number(),
    estimated_unit_price: v.number(),
    total_estimated_price: v.number(),
    specifications: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
    item_no: v.optional(v.string()),
    item_title: v.optional(v.string()),
    unit: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))), // [2025-01-11] Added - Item priority
    required_date: v.optional(v.string()), // [2025-01-11] Added - Item required date
    created_at: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchase_requisition_items")
      .withIndex("by_purchase_requisition", (q) => q.eq("purchase_requisition_id", args.purchase_requisition_id))
      .collect();
  },
});
