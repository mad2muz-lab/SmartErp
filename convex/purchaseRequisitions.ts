import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Generate PR number
export const generatePRNumber = query({
  args: { organization_id: v.id("organizations") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const year = new Date().getFullYear();
    const existingPRs = await ctx.db
      .query("purchase_requisitions")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.gte(q.field("pr_number"), `PR-${year}-`))
      .filter((q) => q.lt(q.field("pr_number"), `PR-${year + 1}-`))
      .collect();

    const nextNumber = existingPRs.length + 1;
    return `PR-${year}-${nextNumber.toString().padStart(5, '0')}`;
  },
});

// Create purchase requisition
export const createPurchaseRequisition = mutation({
  args: {
    organization_id: v.id("organizations"),
    pr_number: v.string(),
    department: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    justification: v.string(),
    currency: v.string(),
    total_estimated_cost: v.number(),
    requisition_date: v.optional(v.string()), // [2025-01-11] Added - Requisition date field
    required_date: v.optional(v.string()), // [2025-01-11] Added - Required date field
    notes: v.optional(v.string()), // [2025-01-11] Added - Notes field
    created_by: v.optional(v.string()),
  },
  returns: v.id("purchase_requisitions"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("purchase_requisitions", {
      ...args,
      status: "draft",
      created_at: now,
      updated_at: now,
    });
  },
});

// Update purchase requisition
export const updatePurchaseRequisition = mutation({
  args: {
    id: v.id("purchase_requisitions"),
    department: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    justification: v.optional(v.string()),
    currency: v.optional(v.string()),
    total_estimated_cost: v.optional(v.number()),
    requisition_date: v.optional(v.string()), // [2025-01-11] Added - Requisition date field
    required_date: v.optional(v.string()), // [2025-01-11] Added - Required date field
    notes: v.optional(v.string()), // [2025-01-11] Added - Notes field
    status: v.optional(v.union(v.literal("draft"), v.literal("submitted"), v.literal("approved"), v.literal("rejected"), v.literal("converted"))),
    submitted_by: v.optional(v.string()),
    submitted_at: v.optional(v.string()),
    approved_by: v.optional(v.string()),
    approved_at: v.optional(v.string()),
    rejected_by: v.optional(v.string()),
    rejected_at: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
    converted_to_po: v.optional(v.id("purchase_orders")),
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

// List purchase requisitions
export const listPurchaseRequisitions = query({
  args: { organization_id: v.id("organizations") },
  returns: v.array(v.object({
    _id: v.id("purchase_requisitions"),
    _creationTime: v.number(),
    organization_id: v.id("organizations"),
    pr_number: v.string(),
    department: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    justification: v.string(),
    currency: v.string(),
    total_estimated_cost: v.number(),
    status: v.union(v.literal("draft"), v.literal("submitted"), v.literal("approved"), v.literal("rejected"), v.literal("converted")),
    requester_id: v.optional(v.string()),
    requisition_date: v.optional(v.string()), // [2025-01-11] Added - Requisition date field
    required_date: v.optional(v.string()), // [2025-01-11] Added - Required date field
    notes: v.optional(v.string()), // [2025-01-11] Added - Notes field
    submitted_by: v.optional(v.string()),
    submitted_at: v.optional(v.string()),
    approved_by: v.optional(v.string()),
    approved_at: v.optional(v.string()),
    rejected_by: v.optional(v.string()),
    rejected_at: v.optional(v.string()),
    rejection_reason: v.optional(v.string()),
    converted_to_po: v.optional(v.id("purchase_orders")),
    created_by: v.optional(v.string()),
    created_at: v.string(),
    updated_at: v.string(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("purchase_requisitions")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .order("desc")
      .collect();
  },
});

// Get purchase requisition by ID
export const getPurchaseRequisition = query({
  args: { id: v.id("purchase_requisitions") },
  returns: v.union(
    v.object({
      _id: v.id("purchase_requisitions"),
      _creationTime: v.number(),
      organization_id: v.id("organizations"),
      pr_number: v.string(),
      department: v.string(),
      priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
      justification: v.string(),
      currency: v.string(),
      total_estimated_cost: v.number(),
      status: v.union(v.literal("draft"), v.literal("submitted"), v.literal("approved"), v.literal("rejected"), v.literal("converted")),
      requester_id: v.optional(v.string()),
      submitted_by: v.optional(v.string()),
      submitted_at: v.optional(v.string()),
      approved_by: v.optional(v.string()),
      approved_at: v.optional(v.string()),
      rejected_by: v.optional(v.string()),
      rejected_at: v.optional(v.string()),
      rejection_reason: v.optional(v.string()),
      converted_to_po: v.optional(v.id("purchase_orders")),
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

// Delete purchase requisition
export const deletePurchaseRequisition = mutation({
  args: { id: v.id("purchase_requisitions") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First delete all related items
    const items = await ctx.db
      .query("purchase_requisition_items")
      .withIndex("by_purchase_requisition", (q) => q.eq("purchase_requisition_id", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Then delete the requisition
    await ctx.db.delete(args.id);
    return null;
  },
});

// Submit purchase requisition for approval
export const submitPurchaseRequisition = mutation({
  args: { 
    id: v.id("purchase_requisitions"),
    submitted_by: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "submitted",
      submitted_by: args.submitted_by,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

// Approve purchase requisition
export const approvePurchaseRequisition = mutation({
  args: { 
    id: v.id("purchase_requisitions"),
    approved_by: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "approved",
      approved_by: args.approved_by,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

// Reject purchase requisition
export const rejectPurchaseRequisition = mutation({
  args: { 
    id: v.id("purchase_requisitions"),
    rejected_by: v.string(),
    rejection_reason: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "rejected",
      rejected_by: args.rejected_by,
      rejected_at: new Date().toISOString(),
      rejection_reason: args.rejection_reason,
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});

// Convert purchase requisition to purchase order
export const convertToPurchaseOrder = mutation({
  args: { 
    id: v.id("purchase_requisitions"),
    converted_to_po: v.id("purchase_orders")
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "converted",
      converted_to_po: args.converted_to_po,
      updated_at: new Date().toISOString(),
    });
    return null;
  },
});
