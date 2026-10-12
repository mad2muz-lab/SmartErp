import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Update invoice status
 */
export const updateInvoiceStatus = mutation({
  args: {
    invoice_id: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled"),
      v.literal("refunded")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.invoice_id, {
      status: args.status,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Invoice status updated successfully",
    };
  },
});

/**
 * Create invoice from quotation
 */
export const createInvoiceFromQuotation = mutation({
  args: {
    quotation_id: v.id("quotations"),
    due_date: v.optional(v.string()),
    invoice_type: v.union(
      v.literal("standard"),
      v.literal("simplified")
    ),
    created_by: v.string(),
  },
  handler: async (ctx, args) => {
    const quotation = await ctx.db.get(args.quotation_id);
    if (!quotation) {
      throw new Error("Quotation not found");
    }

    // Call the comprehensive convertQuotationToInvoice function in invoiceManagement
    return await ctx.runMutation(api.invoiceManagement.convertQuotationToInvoice, {
      quotation_id: args.quotation_id,
      organization_id: quotation.organization_id,
      invoice_type: args.invoice_type,
      due_date: args.due_date,
      created_by: args.created_by,
    });
  },
});
