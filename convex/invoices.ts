import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all invoices for an organization
 */
export const listInvoices = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    status: v.optional(v.string()),
    invoice_type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("invoices")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any));

      if (args.status && args.status !== 'all') {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }

      if (args.invoice_type && args.invoice_type !== 'all') {
        query = query.filter((q) => q.eq(q.field("invoice_type"), args.invoice_type));
      }

      const invoices = await query
        .order("desc")
        .take(args.limit || 50);

      return invoices;
    } catch (err) {
      console.warn("listInvoices query error:", err);
      return [];
    }
  },
});

export const getInvoices = listInvoices;

/**
 * Get invoice details with items
 */
export const getInvoiceDetails = query({
  args: {
    invoice_id: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoice_id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const items = await ctx.db
      .query("invoice_items")
      .withIndex("by_invoice", (q) => q.eq("invoice_id", args.invoice_id))
      .collect();

    return {
      invoice,
      items,
    };
  },
});
