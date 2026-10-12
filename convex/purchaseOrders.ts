import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Generate PO number
export const generatePONumber = query({
  args: { organization_id: v.id("organizations") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const todayPrefix = `PO-${year}${month}${day}-`;

    const todayPOs = await ctx.db
      .query("purchase_orders")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.gte(q.field("po_number"), todayPrefix))
      .filter((q) => q.lt(q.field("po_number"), `PO-${year}${month}${day}.`))
      .collect();

    const nextNumber = todayPOs.length + 1;
    return `${todayPrefix}${nextNumber.toString().padStart(3, '0')}`;
  },
});

// Create purchase order
export const createPurchaseOrder = mutation({
  args: {
    organization_id: v.id("organizations"),
    po_number: v.optional(v.string()),
    supplier_id: v.id("suppliers"),
    issue_date: v.string(),
    expected_delivery_date: v.optional(v.string()),
    currency: v.string(),
    subtotal: v.number(),
    discount_amount: v.number(),
    tax_rate: v.optional(v.number()),
    tax_amount: v.number(),
    total_amount: v.number(),
    payment_terms: v.optional(v.string()),
    delivery_address: v.optional(v.string()),
    project_name: v.optional(v.string()),
    supplier_quotation_ref: v.optional(v.string()),
    terms_conditions: v.optional(v.string()),
    terms_conditions_title: v.optional(v.string()),
    notes: v.optional(v.string()),
    source_pr_id: v.optional(v.id("purchase_requisitions")),
    created_by: v.optional(v.string()),
  },
  returns: v.id("purchase_orders"),
  handler: async (ctx, args) => {
    let poNumber = args.po_number;
    if (!poNumber || poNumber.trim() === '') {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const todayPrefix = `PO-${year}${month}${day}-`;

      const todayPOs = await ctx.db
        .query("purchase_orders")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
        .filter((q) => q.gte(q.field("po_number"), todayPrefix))
        .filter((q) => q.lt(q.field("po_number"), `PO-${year}${month}${day}.`))
        .collect();

      const nextNumber = todayPOs.length + 1;
      poNumber = `${todayPrefix}${nextNumber.toString().padStart(3, '0')}`;
    }

    const now = new Date().toISOString();
    return await ctx.db.insert("purchase_orders", {
      ...args,
      po_number: poNumber,
      tax_rate: args.tax_rate ?? 15,
      status: "draft",
      created_at: now,
      updated_at: now,
    });
  },
});

// Update purchase order
export const updatePurchaseOrder = mutation({
  args: {
    id: v.id("purchase_orders"),
    supplier_id: v.optional(v.id("suppliers")),
    issue_date: v.optional(v.string()),
    expected_delivery_date: v.optional(v.string()),
    currency: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    tax_rate: v.optional(v.number()),
    tax_amount: v.optional(v.number()),
    total_amount: v.optional(v.number()),
    status: v.optional(v.union(v.literal("draft"), v.literal("sent"), v.literal("confirmed"), v.literal("received"), v.literal("completed"), v.literal("cancelled"))),
    payment_terms: v.optional(v.string()),
    delivery_address: v.optional(v.string()),
    notes: v.optional(v.string()),
    sent_by: v.optional(v.string()),
    sent_at: v.optional(v.string()),
    confirmed_by: v.optional(v.string()),
    confirmed_at: v.optional(v.string()),
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

// List purchase orders
export const listPurchaseOrders = query({
  args: { organization_id: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchase_orders")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .order("desc")
      .collect();
  },
});

// Get purchase order by ID
export const getPurchaseOrder = query({
  args: { id: v.id("purchase_orders") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Delete purchase order
export const deletePurchaseOrder = mutation({
  args: { id: v.id("purchase_orders") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First delete all related items
    const items = await ctx.db
      .query("purchase_order_items")
      .withIndex("by_purchase_order", (q) => q.eq("purchase_order_id", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Then delete the purchase order
    await ctx.db.delete(args.id);
    return null;
  },
});

// Send purchase order to supplier
export const sendPurchaseOrder = mutation({
  args: { 
    id: v.id("purchase_orders"),
    sent_by: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "sent",
      sent_by: args.sent_by,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

// Confirm purchase order with supplier
export const confirmPurchaseOrder = mutation({
  args: { 
    id: v.id("purchase_orders"),
    confirmed_by: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "confirmed",
      confirmed_by: args.confirmed_by,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

// Mark purchase order as received
export const markPurchaseOrderReceived = mutation({
  args: { 
    id: v.id("purchase_orders")
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "received",
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

// Complete purchase order
export const completePurchaseOrder = mutation({
  args: { 
    id: v.id("purchase_orders")
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

// Cancel purchase order
export const cancelPurchaseOrder = mutation({
  args: { 
    id: v.id("purchase_orders")
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "cancelled",
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});
