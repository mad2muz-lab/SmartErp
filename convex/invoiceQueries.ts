import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all invoices for an organization
 * Serves as backwards compatible alias for invoiceQueries.getInvoices
 */
export const getInvoices = query({
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

      if (args.status && args.status !== "all") {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }

      if (args.invoice_type && args.invoice_type !== "all") {
        query = query.filter((q) => q.eq(q.field("invoice_type"), args.invoice_type));
      }

      const invoices = await query
        .order("desc")
        .take(args.limit || 100);

      return invoices;
    } catch (err) {
      console.warn("getInvoices fallback:", err);
      return [];
    }
  },
});

export const listInvoices = getInvoices;

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
      return null;
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
