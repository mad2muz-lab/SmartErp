import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Simple test function
export const testInvoice = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return "Invoice functions are working!";
  },
});

// List all invoices for an organization
export const listInvoices = query({
  args: {
    organization_id: v.id("organizations"),
  },
  returns: v.array(v.object({
    _id: v.id("invoices"),
    invoice_number: v.string(),
    customer_id: v.id("customers"),
    organization_id: v.id("organizations"),
    currency: v.string(),
    subtotal: v.number(),
    status: v.string(),
    created_at: v.string(),
  })),
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_organization", (q: any) => q.eq("organization_id", args.organization_id))
      .collect();
    
    return invoices.map(invoice => ({
      _id: invoice._id,
      invoice_number: invoice.invoice_number,
      customer_id: invoice.customer_id,
      organization_id: invoice.organization_id,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      status: invoice.status,
      created_at: invoice.created_at,
    }));
  },
});

// Create invoice from quotation
export const createInvoiceFromQuotation = mutation({
  args: {
    quotation_id: v.id("quotations"),
    due_date: v.optional(v.string()),
    payment_terms: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_by: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.id("invoices"),
  handler: async (ctx, args) => {
    // Get quotation details
    const quotation = await ctx.db.get(args.quotation_id);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    // Generate simple invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
      invoice_number: invoiceNumber,
      quotation_id: args.quotation_id,
      customer_id: quotation.customer_id,
      organization_id: quotation.organization_id,
      invoice_date: now.split('T')[0],
      due_date: args.due_date,
      currency: quotation.currency,
      subtotal: quotation.subtotal,
      grand_total: quotation.total_amount,
      total_discount: quotation.discount_amount,
      total_vat: quotation.tax_amount,
      vat_amount_sar: quotation.tax_amount,
      vat_rate: quotation.tax_rate || 15,
      status: args.status || "draft",
      payment_terms: args.payment_terms,
      notes: args.notes,
      customer_name: undefined,
      customer_name_arabic: undefined,
      customer_address: undefined,
      customer_address_arabic: undefined,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
    
    return invoiceId;
  },
});

// Create standalone invoice
export const createInvoice = mutation({
  args: {
    customer_id: v.id("customers"),
    organization_id: v.id("organizations"),
    invoice_date: v.string(),
    due_date: v.optional(v.string()),
    currency: v.string(),
    payment_terms: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_by: v.optional(v.string()),
    status: v.optional(v.string()),
    items: v.array(v.object({
      item_name: v.string(),
      description: v.optional(v.string()),
      quantity: v.number(),
      unit: v.string(),
      unit_price: v.number(),
      tax_rate: v.optional(v.number()),
    })),
  },
  returns: v.id("invoices"),
  handler: async (ctx, args) => {
    // Generate simple invoice number
    const invoiceNumber = `INV-${Date.now()}`;
    const now = new Date().toISOString();
    
    // Calculate totals
    let subtotal = 0;
    let totalTax = 0;
    
    args.items.forEach(item => {
      const lineTotal = item.quantity * item.unit_price;
      subtotal += lineTotal;
      const taxAmount = lineTotal * (item.tax_rate || 15) / 100;
      totalTax += taxAmount;
    });
    
    const grandTotal = subtotal + totalTax;
    
    // Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
      invoice_number: invoiceNumber,
      customer_id: args.customer_id,
      organization_id: args.organization_id,
      invoice_date: args.invoice_date,
      due_date: args.due_date,
      currency: args.currency,
      subtotal: subtotal,
      grand_total: grandTotal,
      total_discount: 0,
      total_vat: totalTax,
      vat_amount_sar: totalTax,
      vat_rate: 15,
      status: args.status || "draft",
      payment_terms: args.payment_terms,
      notes: args.notes,
      customer_name: undefined,
      customer_name_arabic: undefined,
      customer_address: undefined,
      customer_address_arabic: undefined,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
    
    return invoiceId;
  },
});

// Update invoice
export const updateInvoice = mutation({
  args: {
    invoice_id: v.id("invoices"),
    due_date: v.optional(v.string()),
    payment_terms: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { invoice_id, ...updates } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(invoice_id, {
      ...updates,
      updated_at: now,
    });
  },
});

// Delete invoice
export const deleteInvoice = mutation({
  args: {
    invoice_id: v.id("invoices"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.invoice_id);
  },
});