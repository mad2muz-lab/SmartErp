import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create purchase order item
export const createPurchaseOrderItem = mutation({
  args: {
    purchase_order_id: v.id("purchase_orders"),
    inventory_id: v.optional(v.id("inventory")),
    item_name: v.string(),
    description: v.optional(v.string()),
    quantity: v.number(),
    unit: v.optional(v.string()),
    unit_price: v.number(),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.number(),
    notes: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
    item_no: v.optional(v.string()),
    item_title: v.optional(v.string()),
  },
  returns: v.id("purchase_order_items"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("purchase_order_items", {
      ...args,
      created_at: new Date().toISOString(),
    });
  },
});

// Update purchase order item
export const updatePurchaseOrderItem = mutation({
  args: {
    id: v.id("purchase_order_items"),
    inventory_id: v.optional(v.id("inventory")),
    item_name: v.optional(v.string()),
    description: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    unit_price: v.optional(v.number()),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.optional(v.number()),
    notes: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
    item_no: v.optional(v.string()),
    item_title: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

// Delete purchase order item
export const deletePurchaseOrderItem = mutation({
  args: { id: v.id("purchase_order_items") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Delete all items for a purchase order
export const deletePurchaseOrderItems = mutation({
  args: { purchase_order_id: v.id("purchase_orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("purchase_order_items")
      .withIndex("by_purchase_order", (q) => q.eq("purchase_order_id", args.purchase_order_id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    return null;
  },
});

// List purchase order items
export const listPurchaseOrderItems = query({
  args: { purchase_order_id: v.id("purchase_orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchase_order_items")
      .withIndex("by_purchase_order", (q) => q.eq("purchase_order_id", args.purchase_order_id))
      .collect();
  },
});
