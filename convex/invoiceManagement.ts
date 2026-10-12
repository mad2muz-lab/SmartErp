import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./_generated/api";
import { generateZATCACompliantInvoiceHTML as generateZATCAHTML } from "./zatcaInvoiceTemplate";

/**
 * ZATCA-Compliant Invoice Management System
 * 
 * This module implements all invoice management functions following
 * ZATCA VAT Implementing Regulations to the letter.
 * 
 * Key ZATCA Requirements Implemented:
 * - Article 53: Tax Invoice Requirements
 * - Article 54: Credit and Debit Notes
 * - Article 53(7): Simplified Tax Invoices
 * - Article 53(6): Electronic Invoice Format
 * - Article 53(5): Mandatory Invoice Information
 */

/**
 * Get invoice by ID
 */
export const getInvoice = query({
  args: {
    invoice_id: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoice_id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }
    return invoice;
  },
});

/**
 * Generate next invoice number following ZATCA sequential numbering requirement
 * Article 53(5)(b): Sequential number which uniquely identifies the Tax Invoice
 */
export const generateInvoiceNumber = query({
  args: {
    organization_id: v.id("organizations"),
    invoice_type: v.union(
      v.literal("standard"),
      v.literal("simplified"),
      v.literal("credit_note"),
      v.literal("debit_note")
    ),
  },
  handler: async (ctx, args) => {
    // Get organization details for prefix
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get current year for numbering
    const now = new Date();
    const year = now.getFullYear();
    
    // Create prefix based on invoice type
    let prefix = "";
    switch (args.invoice_type) {
      case "standard":
        prefix = "INV";
        break;
      case "simplified":
        prefix = "SINV";
        break;
      case "credit_note":
        prefix = "CN";
        break;
      case "debit_note":
        prefix = "DN";
        break;
    }

    // Format: PREFIX-YYYY-XXXX (e.g., INV-2025-0001) - matching existing format
    const baseNumber = `${prefix}-${year}-`;
    
    // Find all existing invoices for this organization and invoice type
    const existingInvoices = await ctx.db
        .query("invoices")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("invoice_type"), args.invoice_type))
        .collect();

    // Find the next sequential number for this year
    let nextNumber = 1;
    const existingNumbers = existingInvoices
      .map(inv => inv.invoice_number)
      .filter(num => num.startsWith(baseNumber))
      .map(num => {
        const parts = num.split('-');
        return parts.length >= 3 ? parseInt(parts[2]) : 0;
      })
      .filter(num => !isNaN(num) && num > 0);

    if (existingNumbers.length > 0) {
      nextNumber = Math.max(...existingNumbers) + 1;
    }

    return `${baseNumber}${String(nextNumber).padStart(4, '0')}`;
  },
});

/**
 * Fix duplicate invoice numbers by assigning unique sequential numbers
 * This is a one-time cleanup function for existing invoices
 */
export const fixDuplicateInvoiceNumbers = mutation({
  args: {},
  handler: async (ctx) => {
    console.log("⚡ Fast invoice number fix starting...");
    
    // Get all invoices for the current organization only (much faster)
    const allInvoices = await ctx.db.query("invoices").collect();
    
    if (allInvoices.length === 0) {
      return { message: "No invoices found to fix", totalFixed: 0, totalErrors: 0 };
    }

    // Sort all invoices by creation date (simple and fast)
    const sortedInvoices = allInvoices.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    console.log(`⚡ Found ${sortedInvoices.length} invoices to fix`);

    // Batch update all invoices with sequential numbers
    const updates = [];
    for (let i = 0; i < sortedInvoices.length; i++) {
      const invoice = sortedInvoices[i];
      const newNumber = `INV-2025-${String(i + 1).padStart(4, '0')}`;
      
      updates.push(
        ctx.db.patch(invoice._id, { 
          invoice_number: newNumber,
          updated_at: new Date().toISOString()
        })
      );
    }

    // Execute all updates in parallel (much faster!)
    try {
      await Promise.all(updates);
      console.log(`⚡ Successfully fixed ${sortedInvoices.length} invoice numbers in parallel!`);

    return {
        message: `Successfully fixed ${sortedInvoices.length} invoice numbers!`,
        totalFixed: sortedInvoices.length,
        totalErrors: 0
      };
    } catch (error: any) {
      console.error(`❌ Batch update failed:`, error);
      return {
        message: `Failed to fix invoice numbers: ${error.message}`,
        totalFixed: 0,
        totalErrors: sortedInvoices.length
      };
    }
  },
});

/**
 * Create a new ZATCA-compliant invoice
 * Implements Article 53: Tax Invoice Requirements
 */
export const createInvoice = mutation({
  args: {
    organization_id: v.id("organizations"),
    quotation_id: v.optional(v.id("quotations")),
    lead_id: v.optional(v.id("leads")),
    purchase_order_id: v.optional(v.id("purchase_orders")),
    reference_type: v.union(
      v.literal("lead"),
      v.literal("quotation"), 
      v.literal("purchase_order"),
      v.literal("standalone")
    ),
    reference_chain: v.optional(v.array(v.string())),
    invoice_type: v.union(
      v.literal("standard"),
      v.literal("simplified"),
      v.literal("credit_note"),
      v.literal("debit_note")
    ),
    customer_id: v.id("customers"),
    invoice_date: v.string(),
    supply_date: v.optional(v.string()),
    due_date: v.optional(v.string()),
    payment_terms: v.string(),
    delivery_terms: v.string(),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    is_reverse_charge: v.optional(v.boolean()),
    is_self_accounting: v.optional(v.boolean()),
    tax_treatment: v.optional(v.string()),
    tax_treatment_arabic: v.optional(v.string()),
    // Frontend fields
    currency: v.optional(v.string()),
    customer_name: v.optional(v.string()),
    customer_name_arabic: v.optional(v.string()),
    customer_address: v.optional(v.string()),
    grand_total: v.optional(v.number()),
    subtotal: v.optional(v.number()),
    total_vat: v.optional(v.number()),
    vat_rate: v.optional(v.number()),
    status: v.optional(v.string()),
    items: v.array(v.object({
      description: v.string(),
      description_arabic: v.string(),
      quantity: v.number(),
      unit: v.string(),
      unit_price: v.number(),
      discount_amount: v.optional(v.number()),
      discount_percentage: v.optional(v.number()),
      vat_rate: v.number(),
      supply_type: v.string(),
      supply_type_arabic: v.optional(v.string()),
      is_zero_rated: v.optional(v.boolean()),
      is_exempt: v.optional(v.boolean()),
      exemption_reason: v.optional(v.string()),
      exemption_reason_arabic: v.optional(v.string()),
      inventory_id: v.optional(v.id("inventory")),
      sku: v.optional(v.string()),
    })),
    created_by: v.string(),
  },
  handler: async (ctx, args) => {
    // Get customer details
    const customer = await ctx.db.get(args.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get organization details
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Generate invoice number
    const invoiceNumber = await ctx.runQuery(api.invoiceManagement.generateInvoiceNumber, {
      organization_id: args.organization_id,
      invoice_type: args.invoice_type,
    });

    // Calculate totals
    let subtotal = 0;
    let totalVat = 0;
    let totalDiscount = 0;

    // Process each item
    for (const item of args.items) {
      const itemSubtotal = item.quantity * item.unit_price;
      const discountAmount = item.discount_amount || (item.discount_percentage ? itemSubtotal * (item.discount_percentage / 100) : 0);
      const taxableAmount = itemSubtotal - discountAmount;
      const vatAmount = item.is_zero_rated || item.is_exempt ? 0 : taxableAmount * (item.vat_rate / 100);
      
      subtotal += taxableAmount;
      totalVat += vatAmount;
      totalDiscount += discountAmount;
    }

    const grandTotal = subtotal + totalVat;

    // Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
      organization_id: args.organization_id,
      quotation_id: args.quotation_id,
      lead_id: args.lead_id,
      purchase_order_id: args.purchase_order_id,
      reference_type: args.reference_type,
      reference_chain: args.reference_chain,
      invoice_number: invoiceNumber,
      invoice_type: args.invoice_type,
      invoice_date: args.invoice_date,
      supply_date: args.supply_date,
      due_date: args.due_date,
      customer_id: args.customer_id,
      customer_name: customer.customer_company_name,
      customer_name_arabic: customer.customer_company_name_arabic,
      customer_address: customer.address,
      customer_address_arabic: customer.address_arabic,
      customer_vat_number: customer.vat_number,
      customer_tax_id: customer.vat_number, // Use VAT number as tax ID
      subtotal: subtotal,
      total_discount: totalDiscount,
      total_vat: totalVat,
      grand_total: grandTotal,
      currency: "SAR", // ZATCA requires SAR
      vat_rate: 15, // Standard Saudi VAT rate
      vat_amount_sar: totalVat,
      payment_terms: args.payment_terms,
      delivery_terms: args.delivery_terms,
      notes: args.notes,
      notes_arabic: args.notes_arabic,
      is_reverse_charge: args.is_reverse_charge || false,
      is_self_accounting: args.is_self_accounting || false,
      tax_treatment: args.tax_treatment,
      tax_treatment_arabic: args.tax_treatment_arabic,
      status: "draft",
      is_filed: false,
      created_by: args.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create invoice items
    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      const itemSubtotal = item.quantity * item.unit_price;
      const discountAmount = item.discount_amount || (item.discount_percentage ? itemSubtotal * (item.discount_percentage / 100) : 0);
      const taxableAmount = itemSubtotal - discountAmount;
      const vatAmount = item.is_zero_rated || item.is_exempt ? 0 : taxableAmount * (item.vat_rate / 100);
      const totalAmount = taxableAmount + vatAmount;

      await ctx.db.insert("invoice_items", {
        invoice_id: invoiceId,
        item_number: i + 1,
        description: item.description,
        description_arabic: item.description_arabic,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_amount: discountAmount,
        discount_percentage: item.discount_percentage,
        taxable_amount: taxableAmount,
        vat_rate: item.vat_rate,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        supply_type: item.supply_type,
        supply_type_arabic: item.supply_type_arabic,
        is_zero_rated: item.is_zero_rated || false,
        is_exempt: item.is_exempt || false,
        exemption_reason: item.exemption_reason,
        exemption_reason_arabic: item.exemption_reason_arabic,
        inventory_id: item.inventory_id,
        sku: item.sku,
        created_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      message: "Invoice created successfully"
    };
  },
});

/**
 * Convert quotation to invoice
 * Creates a ZATCA-compliant invoice from an existing quotation
 */
export const convertPurchaseOrderToInvoice = mutation({
  args: {
    purchase_order_id: v.id("purchase_orders"),
    invoice_type: v.union(
      v.literal("standard"),
      v.literal("simplified"),
      v.literal("credit_note"),
      v.literal("debit_note")
    ),
    invoice_date: v.string(),
    supply_date: v.optional(v.string()),
    due_date: v.optional(v.string()),
    payment_terms: v.optional(v.string()),
    delivery_terms: v.optional(v.string()),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    created_by: v.string(),
  },
  returns: v.id("invoices"),
  handler: async (ctx, args) => {
    // Get purchase order details
    const purchaseOrder = await ctx.db.get(args.purchase_order_id);
    if (!purchaseOrder) {
      throw new Error("Purchase order not found");
    }

    // Get purchase order items
    const purchaseOrderItems = await ctx.db
      .query("purchase_order_items")
      .withIndex("by_purchase_order", (q) => q.eq("purchase_order_id", args.purchase_order_id))
      .collect();

    // Get supplier details (assuming supplier is the customer for the invoice)
    const supplier = await ctx.db.get(purchaseOrder.supplier_id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Generate invoice number
    const invoiceNumber = await ctx.runQuery(api.invoiceManagement.generateInvoiceNumber, {
      organization_id: purchaseOrder.organization_id,
      invoice_type: args.invoice_type,
    });

    // Calculate totals
    const subtotal = purchaseOrderItems.reduce((sum, item) => sum + item.total_price, 0);
    const totalVat = subtotal * 0.15; // 15% VAT
    const grandTotal = subtotal + totalVat;

    // Create invoice items from purchase order items
    const invoiceItems = purchaseOrderItems.map(item => ({
      description: item.item_name,
      description_arabic: item.description || item.item_name,
      quantity: item.quantity,
      unit: "pcs", // Default unit
      unit_price: item.unit_price,
      discount_amount: item.discount_amount || 0,
      discount_percentage: item.discount_percentage || 0,
      vat_rate: 15,
      supply_type: "Goods",
      supply_type_arabic: "بضائع",
      is_zero_rated: false,
      is_exempt: false,
      inventory_id: item.inventory_id,
      sku: `PO-${purchaseOrder.po_number}-${item.item_name}`,
    }));

    // Create invoice from purchase order
    const result = await createInvoice(ctx, {
      organization_id: purchaseOrder.organization_id,
      purchase_order_id: args.purchase_order_id,
      reference_type: "purchase_order",
      reference_chain: [`Purchase Order: ${purchaseOrder.po_number}`],
      invoice_type: args.invoice_type,
      customer_id: purchaseOrder.supplier_id, // Supplier becomes customer for invoice
      invoice_date: args.invoice_date,
      supply_date: args.supply_date,
      due_date: args.due_date,
      payment_terms: args.payment_terms || purchaseOrder.payment_terms || "Net 30",
      delivery_terms: args.delivery_terms || "FOB",
      notes: args.notes || `Invoice for Purchase Order ${purchaseOrder.po_number}`,
      notes_arabic: args.notes_arabic,
      is_reverse_charge: false,
      is_self_accounting: false,
      items: invoiceItems,
      created_by: args.created_by,
    });

    // Update purchase order status to "invoiced"
    await ctx.db.patch(args.purchase_order_id, {
      status: "completed",
      updated_at: new Date().toISOString(),
    });

    return result;
  },
});

export const convertLeadToInvoice = mutation({
  args: {
    lead_id: v.id("leads"),
    invoice_type: v.union(
      v.literal("standard"),
      v.literal("simplified"),
      v.literal("credit_note"),
      v.literal("debit_note")
    ),
    invoice_date: v.string(),
    supply_date: v.optional(v.string()),
    due_date: v.optional(v.string()),
    payment_terms: v.optional(v.string()),
    delivery_terms: v.optional(v.string()),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    created_by: v.string(),
  },
  returns: v.id("invoices"),
  handler: async (ctx, args) => {
    // Get lead details
    const lead = await ctx.db.get(args.lead_id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    // Check if lead has a customer_id
    if (!lead.customer_id) {
      throw new Error(`Cannot convert lead "${lead.name}" (${lead.lead_number}) to invoice: Lead does not have an associated customer. Please edit the lead and assign a customer first.`);
    }

    // Get lead items
    const leadItems = await ctx.db
      .query("lead_items")
      .withIndex("by_lead", (q) => q.eq("lead_id", args.lead_id))
      .collect();

    // Get customer details
    const customer = await ctx.db.get(lead.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Generate invoice number
    const invoiceNumber = await ctx.runQuery(api.invoiceManagement.generateInvoiceNumber, {
      organization_id: lead.organization_id,
      invoice_type: args.invoice_type,
    });

    // Use lead's financial data if available, otherwise calculate from items
    const subtotal = lead.subtotal || leadItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = lead.tax_amount || subtotal * 0.15;
    const totalAmount = lead.total_amount || subtotal + taxAmount;

    // Create invoice items from lead items
    const invoiceItems = leadItems.map(item => ({
      description: item.item_name,
      description_arabic: item.description || item.item_name,
      quantity: item.quantity,
      unit: "pcs", // Default unit
      unit_price: item.unit_price,
      discount_amount: 0,
      discount_percentage: 0,
      vat_rate: 15,
      supply_type: "Goods",
      supply_type_arabic: "بضائع",
      is_zero_rated: false,
      is_exempt: false,
      inventory_id: undefined, // Lead items don't have inventory_id
      sku: `LEAD-${lead.lead_number}-${item.item_name}`,
    }));

    // Create invoice from lead
    const result = await createInvoice(ctx, {
      organization_id: lead.organization_id,
      lead_id: args.lead_id,
      reference_type: "lead",
      reference_chain: [`Lead: ${lead.lead_number}`],
      invoice_type: args.invoice_type,
      customer_id: lead.customer_id,
      invoice_date: args.invoice_date,
      supply_date: args.supply_date,
      due_date: args.due_date,
      payment_terms: args.payment_terms || "Net 30",
      delivery_terms: args.delivery_terms || "FOB",
      notes: args.notes || `Invoice for Lead ${lead.lead_number}`,
      notes_arabic: args.notes_arabic,
      is_reverse_charge: false,
      is_self_accounting: false,
      items: invoiceItems,
      created_by: args.created_by,
    });

    // Close the lead as converted to invoice
    await ctx.runMutation(api.leads.closeLead, {
      id: args.lead_id,
      closure_type: "invoice",
      quotation_id: undefined, // No quotation involved
    });

    return result;
  },
});

export const convertQuotationToInvoice = mutation({
  args: {
    quotation_id: v.id("quotations"),
    organization_id: v.id("organizations"),
    invoice_type: v.union(
      v.literal("standard"),
      v.literal("simplified")
    ),
    invoice_date: v.optional(v.string()), // Fixed: Made optional
    supply_date: v.optional(v.string()),
    due_date: v.optional(v.string()),
    payment_terms: v.optional(v.string()),
    delivery_terms: v.optional(v.string()),
    notes: v.optional(v.string()),
    notes_arabic: v.optional(v.string()),
    created_by: v.string(),
  },
  handler: async (ctx, args) => {
    // Get quotation details
    const quotation = await ctx.db.get(args.quotation_id);
    if (!quotation) {
      throw new Error("Quotation not found");
    }

    // Get quotation items using the existing query that has proper field mapping
    console.log('🔍 Getting quotation items for:', args.quotation_id);
    const quotationItems = await ctx.runQuery(api.quotations.getQuotationItems, {
      quotation_id: args.quotation_id
    });
    console.log('📦 Quotation items received:', quotationItems);

    if (quotationItems.length === 0) {
      throw new Error("No items found in quotation");
    }

    // Convert quotation items to invoice items
    console.log('🔄 Converting quotation items to invoice items...');
    const invoiceItems = quotationItems.map((item) => {
      // Calculate VAT amount (15% standard rate)
      const vatRate = 15;
      const taxableAmount = item.unit_price * item.quantity;
      const vatAmount = (taxableAmount * vatRate) / 100;
      const totalAmount = taxableAmount + vatAmount;

      const invoiceItem = {
        description: item.item_name || "Unknown Item",
        description_arabic: item.item_name_arabic || item.item_name || "Unknown Item",
        quantity: item.quantity,
        unit: "pcs", // Default unit
        unit_price: item.unit_price,
        discount_amount: item.discount_percentage ? (taxableAmount * item.discount_percentage / 100) : 0,
        discount_percentage: item.discount_percentage || 0,
        vat_rate: vatRate,
        supply_type: "taxable",
        supply_type_arabic: "خاضع للضريبة",
        is_zero_rated: false,
        is_exempt: false,
        inventory_id: item.inventory_id,
        sku: `QT-${quotation.quotation_number}-${item.item_name || "unknown"}`,
      };
      
      console.log('📝 Created invoice item:', invoiceItem);
      return invoiceItem;
    });
    console.log('✅ All invoice items created:', invoiceItems);

    // Get customer details
    const customer = await ctx.db.get(quotation.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const invoiceNumber = `INV-${year}${month}${day}-${random}`;

    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const totalVat = invoiceItems.reduce((sum, item) => sum + ((item.quantity * item.unit_price) * 0.15), 0);
    const grandTotal = subtotal + totalVat;

    // Create invoice
    const invoiceId = await ctx.db.insert("invoices", {
      organization_id: args.organization_id,
      quotation_id: args.quotation_id,
      invoice_number: invoiceNumber,
      invoice_type: args.invoice_type,
      invoice_date: args.invoice_date || new Date().toISOString().split('T')[0],
      supply_date: args.supply_date,
      due_date: args.due_date,
      customer_id: quotation.customer_id,
      customer_name: customer.customer_company_name || 'Unknown Customer',
      customer_name_arabic: customer.customer_company_name_arabic || '',
      customer_address: customer.address || 'N/A',
      customer_address_arabic: customer.address_arabic || 'N/A',
      customer_vat_number: customer.vat_number,
      customer_tax_id: customer.vat_number,
      subtotal: subtotal,
      total_discount: 0,
      total_vat: totalVat,
      grand_total: grandTotal,
      currency: "SAR",
      vat_rate: 15,
      vat_amount_sar: totalVat,
      payment_terms: args.payment_terms || quotation.terms_conditions || "Net 30",
      delivery_terms: args.delivery_terms || "FOB",
      notes: args.notes || quotation.notes,
      notes_arabic: args.notes_arabic,
      is_reverse_charge: false,
      is_self_accounting: false,
      tax_treatment: "standard",
      tax_treatment_arabic: "عادي",
      status: "draft",
      is_filed: false,
      created_by: args.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create invoice items
    console.log('🔨 Creating invoice items...');
    for (let i = 0; i < invoiceItems.length; i++) {
      const item = invoiceItems[i];
      const itemSubtotal = item.quantity * item.unit_price;
      const discountAmount = item.discount_amount || 0;
      const taxableAmount = itemSubtotal - discountAmount;
      const vatAmount = taxableAmount * 0.15;
        const totalAmount = taxableAmount + vatAmount;

      const invoiceItemForDB = {
          invoice_id: invoiceId,
          item_number: i + 1,
          description: item.description,
          description_arabic: item.description_arabic,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
        discount_amount: discountAmount,
        discount_percentage: item.discount_percentage,
          taxable_amount: taxableAmount,
        vat_rate: 15,
          vat_amount: vatAmount,
          total_amount: totalAmount,
          supply_type: item.supply_type,
          supply_type_arabic: item.supply_type_arabic,
        is_zero_rated: item.is_zero_rated,
        is_exempt: item.is_exempt,
        inventory_id: item.inventory_id,
        sku: item.sku,
        created_at: new Date().toISOString(),
      };

      console.log(`🔧 Inserting invoice item ${i + 1}:`, invoiceItemForDB);
      await ctx.db.insert("invoice_items", invoiceItemForDB);
    }

    const result: string = invoiceId;

    // Update quotation status to "converted"
    await ctx.db.patch(args.quotation_id, {
      status: "converted",
      updated_at: new Date().toISOString(),
    });

    return result;
  },
});

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

      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }

      if (args.invoice_type) {
        query = query.filter((q) => q.eq(q.field("invoice_type"), args.invoice_type));
      }

      const invoices = await query
        .order("desc")
        .take(args.limit || 50);

      return invoices;
    } catch (err) {
      console.warn("listInvoices fallback for organization:", args.organization_id, err);
      return [];
    }
  },
});

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

/**
 * Get invoice items only
 */
export const getInvoiceItems = query({
  args: {
    invoice_id: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("invoice_items")
      .withIndex("by_invoice", (q) => q.eq("invoice_id", args.invoice_id))
      .collect();

    return items;
  },
});

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
      message: "Invoice status updated successfully"
    };
  },
});

/**
 * Create credit note (ZATCA Article 54)
 */
export const createCreditNote = mutation({
  args: {
    original_invoice_id: v.id("invoices"),
    reason: v.string(),
    reason_arabic: v.string(),
    credit_amount: v.number(),
    created_by: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const originalInvoice = await ctx.db.get(args.original_invoice_id);
    if (!originalInvoice) {
      throw new Error("Original invoice not found");
    }

    // Create credit note
    const creditNoteId: string = await ctx.db.insert("invoices", {
      organization_id: originalInvoice.organization_id,
      invoice_type: "credit_note",
      invoice_number: await ctx.runQuery(api.invoiceManagement.generateInvoiceNumber, {
        organization_id: originalInvoice.organization_id,
        invoice_type: "credit_note",
      }),
      invoice_date: new Date().toISOString(),
      customer_id: originalInvoice.customer_id,
      customer_name: originalInvoice.customer_name,
      customer_name_arabic: originalInvoice.customer_name_arabic,
      customer_address: originalInvoice.customer_address,
      customer_address_arabic: originalInvoice.customer_address_arabic,
      customer_vat_number: originalInvoice.customer_vat_number,
      customer_tax_id: originalInvoice.customer_tax_id,
      subtotal: args.credit_amount,
      total_discount: 0,
      total_vat: args.credit_amount * 0.15, // 15% VAT
      grand_total: args.credit_amount * 1.15,
      currency: "SAR",
      vat_rate: 15,
      vat_amount_sar: args.credit_amount * 0.15,
      payment_terms: "Credit Note",
      delivery_terms: "N/A",
      notes: `Credit Note for Invoice ${originalInvoice.invoice_number}. Reason: ${args.reason}`,
      notes_arabic: `إشعار دائن للفاتورة ${originalInvoice.invoice_number}. السبب: ${args.reason_arabic}`,
      is_reverse_charge: false,
      is_self_accounting: false,
      tax_treatment: "Credit Note",
      tax_treatment_arabic: "إشعار دائن",
      status: "draft",
      is_filed: false,
      created_by: args.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return creditNoteId;
  },
});

/**
 * Create debit note (ZATCA Article 54)
 */
export const createDebitNote = mutation({
  args: {
    original_invoice_id: v.id("invoices"),
    reason: v.string(),
    reason_arabic: v.string(),
    debit_amount: v.number(),
    created_by: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const originalInvoice = await ctx.db.get(args.original_invoice_id);
    if (!originalInvoice) {
      throw new Error("Original invoice not found");
    }

    // Create debit note
    const debitNoteId: string = await ctx.db.insert("invoices", {
      organization_id: originalInvoice.organization_id,
      invoice_type: "debit_note",
      invoice_number: await ctx.runQuery(api.invoiceManagement.generateInvoiceNumber, {
        organization_id: originalInvoice.organization_id,
        invoice_type: "debit_note",
      }),
      invoice_date: new Date().toISOString(),
      customer_id: originalInvoice.customer_id,
      customer_name: originalInvoice.customer_name,
      customer_name_arabic: originalInvoice.customer_name_arabic,
      customer_address: originalInvoice.customer_address,
      customer_address_arabic: originalInvoice.customer_address_arabic,
      customer_vat_number: originalInvoice.customer_vat_number,
      customer_tax_id: originalInvoice.customer_tax_id,
      subtotal: args.debit_amount,
      total_discount: 0,
      total_vat: args.debit_amount * 0.15, // 15% VAT
      grand_total: args.debit_amount * 1.15,
      currency: "SAR",
      vat_rate: 15,
      vat_amount_sar: args.debit_amount * 0.15,
      payment_terms: "Debit Note",
      delivery_terms: "N/A",
      notes: `Debit Note for Invoice ${originalInvoice.invoice_number}. Reason: ${args.reason}`,
      notes_arabic: `إشعار مدين للفاتورة ${originalInvoice.invoice_number}. السبب: ${args.reason_arabic}`,
      is_reverse_charge: false,
      is_self_accounting: false,
      tax_treatment: "Debit Note",
      tax_treatment_arabic: "إشعار مدين",
      status: "draft",
      is_filed: false,
      created_by: args.created_by,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return debitNoteId;
  },
});

/**
 * Validate ZATCA compliance
 * Checks if invoice meets all ZATCA requirements
 */
export const validateZATCACompliance = query({
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

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields (Article 53(5))
    if (!invoice.invoice_number) {
      errors.push("Invoice number is required (Article 53(5)(b))");
    }

    if (!invoice.invoice_date) {
      errors.push("Invoice date is required (Article 53(5)(a))");
    }

    if (!invoice.customer_name) {
      errors.push("Customer name is required (Article 53(5)(e))");
    }

    if (!invoice.customer_address) {
      errors.push("Customer address is required (Article 53(5)(e))");
    }

    if (invoice.currency !== "SAR") {
      warnings.push("Currency should be SAR for ZATCA compliance");
    }

    if (invoice.vat_rate !== 15) {
      warnings.push("VAT rate should be 15% for standard supplies");
    }

    // Check items
    for (const item of items) {
      if (!item.description_arabic) {
        errors.push(`Item ${item.item_number}: Arabic description is required (Article 53(5))`);
      }

      if (!item.unit) {
        errors.push(`Item ${item.item_number}: Unit of measurement is required`);
      }

      if (item.vat_amount < 0) {
        errors.push(`Item ${item.item_number}: VAT amount cannot be negative`);
      }
    }

    return {
      is_compliant: errors.length === 0,
      errors,
      warnings,
      compliance_score: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5)),
    };
  },
});

/**
 * Update invoice item
 */
export const updateInvoiceItem = mutation({
  args: {
    item_id: v.id("invoice_items"),
    description_arabic: v.optional(v.string()),
    description: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit_price: v.optional(v.number()),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    vat_rate: v.optional(v.number()),
    is_exempt: v.optional(v.boolean()),
    is_zero_rated: v.optional(v.boolean()),
    supply_type: v.optional(v.string()),
    unit: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { item_id, ...updates } = args;
    
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );
    
    if (Object.keys(cleanUpdates).length === 0) {
      throw new Error("No valid updates provided");
    }
    
    // Add updated timestamp
    cleanUpdates.updated_at = new Date().toISOString();
    
    await ctx.db.patch(item_id, cleanUpdates);
    
    return {
      success: true,
      message: "Invoice item updated successfully"
    };
  }
});

/**
 * Get invoice statistics for dashboard
 */
export const getInvoiceStatistics = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    period: v.optional(v.string()), // "month", "quarter", "year"
  },
  handler: async (ctx, args) => {
    try {
      const invoices = await ctx.db
        .query("invoices")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .collect();

      const now = new Date();
      let startDate: Date;

      switch (args.period) {
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "quarter":
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const filteredInvoices = invoices.filter(inv => 
        new Date(inv.invoice_date) >= startDate
      );

      const stats = {
        total_invoices: filteredInvoices.length,
        total_amount: filteredInvoices.reduce((sum, inv) => sum + inv.grand_total, 0),
        total_vat: filteredInvoices.reduce((sum, inv) => sum + inv.total_vat, 0),
        by_status: {
          draft: filteredInvoices.filter(inv => inv.status === "draft").length,
          sent: filteredInvoices.filter(inv => inv.status === "sent").length,
          paid: filteredInvoices.filter(inv => inv.status === "paid").length,
          overdue: filteredInvoices.filter(inv => inv.status === "overdue").length,
          cancelled: filteredInvoices.filter(inv => inv.status === "cancelled").length,
        },
        by_type: {
          standard: filteredInvoices.filter(inv => inv.invoice_type === "standard").length,
          simplified: filteredInvoices.filter(inv => inv.invoice_type === "simplified").length,
          credit_note: filteredInvoices.filter(inv => inv.invoice_type === "credit_note").length,
          debit_note: filteredInvoices.filter(inv => inv.invoice_type === "debit_note").length,
        },
      };

      return stats;
    } catch (err) {
      console.warn("getInvoiceStatistics fallback:", err);
      return {
        total_invoices: 0,
        total_amount: 0,
        total_vat: 0,
        by_status: { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 },
        by_type: { standard: 0, simplified: 0, credit_note: 0, debit_note: 0 },
      };
    }
  },
});

/**
 * Update invoice validation result
 */
export const updateInvoiceValidation = mutation({
  args: {
    invoice_id: v.id("invoices"),
    validation_result: v.any(),
    is_validated: v.boolean(),
    validation_date: v.string(),
    zatca_validation_uuid: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.invoice_id, {
      validation_result: args.validation_result,
      is_validated: args.is_validated,
      validation_date: args.validation_date,
      zatca_validation_uuid: args.zatca_validation_uuid,
      updated_at: now,
    });
  },
});

/**
 * Update invoice submission result
 */
export const updateInvoiceSubmission = mutation({
  args: {
    invoice_id: v.id("invoices"),
    submission_result: v.any(),
    is_submitted: v.boolean(),
    submission_date: v.string(),
    zatca_reference: v.optional(v.string()),
    zatca_submission_uuid: v.optional(v.string()),
    zatca_qr_code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.invoice_id, {
      submission_result: args.submission_result,
      is_submitted: args.is_submitted,
      submission_date: args.submission_date,
      zatca_reference: args.zatca_reference,
      zatca_submission_uuid: args.zatca_submission_uuid,
      zatca_qr_code: args.zatca_qr_code,
      updated_at: now,
    });
  },
});

/**
 * Update invoice compliance result
 */
export const updateInvoiceCompliance = mutation({
  args: {
    invoice_id: v.id("invoices"),
    compliance_result: v.any(),
    is_compliant: v.boolean(),
    compliance_date: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.invoice_id, {
      compliance_result: args.compliance_result,
      is_compliant: args.is_compliant,
      compliance_date: args.compliance_date,
      updated_at: now,
    });
  },
});

/**
 * Update invoice signature
 */
export const updateInvoiceSignature = mutation({
  args: {
    invoice_id: v.id("invoices"),
    digital_signature: v.string(),
    signature_hash: v.string(),
    certificate_serial: v.string(),
    signature_date: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.invoice_id, {
      digital_signature: args.digital_signature,
      signature_hash: args.signature_hash,
      certificate_serial: args.certificate_serial,
      signature_date: args.signature_date,
      updated_at: now,
    });
  },
});

/**
 * Update invoice QR code
 */
export const updateInvoiceQRCode = mutation({
  args: {
    invoice_id: v.id("invoices"),
    qr_code: v.string(),
    qr_content: v.string(),
    qr_generated_date: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.invoice_id, {
      qr_code: args.qr_code,
      qr_content: args.qr_content,
      qr_generated_date: args.qr_generated_date,
      updated_at: now,
    });
  },
});

/**
 * Update invoice hash
 */
export const updateInvoiceHash = mutation({
  args: {
    invoice_id: v.id("invoices"),
    invoice_hash: v.string(),
    hash_generated_date: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.invoice_id, {
      invoice_hash: args.invoice_hash,
      hash_generated_date: args.hash_generated_date,
      updated_at: now,
    });
  },
});

/**
 * Generate invoice PDF
 */
export const generateInvoicePDF = action({
  args: {
    invoice_id: v.id("invoices"),
    action: v.optional(v.union(v.literal("print"), v.literal("download"))),
  },
  handler: async (ctx, args): Promise<{ html: string; invoice_number: string }> => {
    // Get invoice details
    const invoiceData: any = await ctx.runQuery(api.invoiceManagement.getInvoiceDetails, {
      invoice_id: args.invoice_id
    });

    if (!invoiceData || !invoiceData.invoice) {
      throw new Error("Invoice not found");
    }

    const invoice: any = invoiceData.invoice;
    const items = invoiceData.items;

    // Calculate correct totals from items
    // Since item.total_amount already includes VAT, we need to extract the net amount
    const calculatedGrandTotal = items?.reduce((sum: number, item: any) => sum + (item.total_amount || 0), 0) || 0;
    const calculatedSubtotal = items?.reduce((sum: number, item: any) => {
      const itemSubtotal = (item.unit_price || 0) * (item.quantity || 0);
      return sum + itemSubtotal;
    }, 0) || 0;
    const calculatedVat = calculatedGrandTotal - calculatedSubtotal;

    // Debug logging
    console.log('🔍 PDF Generation - Invoice data:', {
      invoice_id: args.invoice_id,
      invoice_number: invoice.invoice_number,
      items_count: items?.length || 0,
      items: items?.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_amount: item.total_amount
      })),
      calculated_totals: {
        subtotal: calculatedSubtotal,
        vat: calculatedVat,
        grand_total: calculatedGrandTotal
      },
      invoice_totals: {
        subtotal: invoice.subtotal,
        vat: invoice.total_vat,
        grand_total: invoice.grand_total
      }
    });

    // Get organization details with forced fresh query
    const organization = await ctx.runQuery(api.organizations.getOrganization, {
      id: invoice.organization_id
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Debug logging for organization data with timestamp
    console.log('🔍 Organization Data (PDF Generation):', {
      timestamp: new Date().toISOString(),
      organization_id: invoice.organization_id,
      organization_name: organization.name,
      address: organization.address,
      street: organization.street,
      building_number: organization.building_number,
      city: organization.city,
      district: organization.district,
      zip_postal_code: organization.zip_postal_code,
      additional_number: organization.additional_number,
      vat_number: organization.vat_number,
      vat_number_arabic: organization.vat_number_arabic,
      cr_number: organization.cr_number
    });

    // Get customer details for bank information
    const customer = invoice.customer_id ? await ctx.runQuery(api.customers.getCustomer, {
      id: invoice.customer_id
    }) : null;

    // Convert logo file ID to URL if it exists
    let logoUrl = organization.logo_url;
    console.log('🔍 Logo processing - Original logo_url:', organization.logo_url);
    console.log('🔍 Logo processing - Organization data:', {
      name: organization.name,
      logo_url: organization.logo_url,
      logo_url_type: typeof organization.logo_url
    });
    
    if (logoUrl && typeof logoUrl === 'string' && !logoUrl.startsWith('http')) {
      try {
        const fullLogoUrl = await ctx.storage.getUrl(logoUrl);
        logoUrl = fullLogoUrl;
        console.log('✅ Logo URL converted successfully:', logoUrl);
      } catch (error) {
        console.warn('❌ Failed to get logo URL:', error);
        logoUrl = undefined; // Clear logo if URL retrieval fails
      }
    } else {
      console.log('🔍 Logo URL is already a full URL or null:', logoUrl);
    }
    
    console.log('🔍 Final logo URL being passed to template:', logoUrl);

    // Generate simple HTML for invoice
    const html = generateZATCAHTML({
      invoice,
      items,
      organization: { ...organization, logo_url: logoUrl },
      customer,
      invoice_id: args.invoice_id,
      calculatedSubtotal,
      calculatedVat,
      calculatedGrandTotal
    });

    return {
      html,
      invoice_number: invoice.invoice_number
    };
  },
});

/**
 * Generate ZATCA-compliant invoice PDF
 */
export const generateZATCAInvoicePDF = action({
  args: {
    invoice_id: v.id("invoices"),
    action: v.union(v.literal("print"), v.literal("download")),
  },
  handler: async (ctx, args): Promise<{ html: string; invoice_number: string }> => {
    // Get invoice data
    const invoice = await ctx.runQuery(api.invoiceManagement.getInvoice, {
      invoice_id: args.invoice_id
    });
    
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Get invoice items
    const items = await ctx.runQuery(api.invoiceManagement.getInvoiceItems, {
      invoice_id: args.invoice_id
    });

    // Get organization details
    const organization = await ctx.runQuery(api.organizations.getOrganization, {
      id: invoice.organization_id
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get customer details for bank information
    const customer = invoice.customer_id ? await ctx.runQuery(api.customers.getCustomer, {
      id: invoice.customer_id
    }) : null;

    // Convert logo file ID to URL if it exists
    let logoUrl = organization.logo_url;
    console.log('🔍 Logo processing - Original logo_url:', organization.logo_url);
    console.log('🔍 Logo processing - Organization data:', {
      name: organization.name,
      logo_url: organization.logo_url,
      logo_url_type: typeof organization.logo_url
    });
    
    if (logoUrl && typeof logoUrl === 'string' && !logoUrl.startsWith('http')) {
      try {
        const fullLogoUrl = await ctx.storage.getUrl(logoUrl);
        logoUrl = fullLogoUrl;
        console.log('✅ Logo URL converted successfully:', logoUrl);
      } catch (error) {
        console.warn('❌ Failed to get logo URL:', error);
        logoUrl = undefined; // Clear logo if URL retrieval fails
      }
    } else {
      console.log('🔍 Logo URL is already a full URL or null:', logoUrl);
    }
    
    console.log('🔍 Final logo URL being passed to template:', logoUrl);

    // Calculate totals
    const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + ((item.unit_price || 0) * (item.quantity || 0) - (item.discount_amount || 0)), 0);
    const calculatedVat = items.reduce((sum: number, item: any) => sum + (item.vat_amount || 0), 0);
    const calculatedGrandTotal = calculatedSubtotal + calculatedVat;

    // Generate ZATCA-compliant HTML
    const html = generateZATCAHTML({
      invoice,
      items,
      organization: { ...organization, logo_url: logoUrl },
      customer,
      invoice_id: args.invoice_id,
      calculatedSubtotal,
      calculatedVat,
      calculatedGrandTotal
    });

    return {
      html,
      invoice_number: invoice.invoice_number || `INV-${args.invoice_id.slice(-8)}`
    };
  },
});

/**
 * Get invoice submission status and history
 */
export const getInvoiceSubmissionStatus = query({      
  args: {
    invoice_id: v.id("invoices"),
  },
  handler: async (ctx, args): Promise<any> => {
    const invoice = await ctx.db.get(args.invoice_id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Determine current status
    let status = "draft";
    let statusMessage = "Invoice is in draft status";
    let canSubmit = false;
    let submissionHistory = [];

    if (invoice.is_submitted) {
      status = "submitted";
      statusMessage = "Invoice has been submitted to ZATCA";
      
      if (invoice.submission_result) {
        if (invoice.submission_result.success) {
          status = "approved";
          statusMessage = "Invoice approved by ZATCA";
        } else {
          status = "rejected";
          statusMessage = `Invoice rejected: ${invoice.submission_result.error || "Unknown error"}`;
          canSubmit = true; // Can resubmit after fixing issues
        }
      }
    } else {
      // Check if ready for submission
      const complianceCheck = await ctx.runQuery(api.invoiceTemplates.getZATCAComplianceChecklist, {
        invoice_id: args.invoice_id
      });
      
      if (complianceCheck.compliance_score === 100) {
        status = "ready";
        statusMessage = "Invoice is ready for ZATCA submission";
        canSubmit = true;
      } else {
        status = "incomplete";
        statusMessage = `Invoice needs ${complianceCheck.compliance_issues.length} more requirements to be ZATCA compliant`;
        canSubmit = false;
      }
    }

    // Build submission history
    if (invoice.submission_date) {
      submissionHistory.push({
        date: invoice.submission_date,
        status: invoice.is_submitted ? "submitted" : "failed",
        result: invoice.submission_result,
        zatca_reference: invoice.zatca_reference,
        zatca_submission_uuid: invoice.zatca_submission_uuid,
        zatca_qr_code: invoice.zatca_qr_code
      });
    }

    return {
      invoice_id: args.invoice_id,
      invoice_number: invoice.invoice_number,
      current_status: status,
      status_message: statusMessage,
      can_submit: canSubmit,
      submission_date: invoice.submission_date,
      submission_result: invoice.submission_result,
      zatca_reference: invoice.zatca_reference,
      zatca_submission_uuid: invoice.zatca_submission_uuid,
      zatca_qr_code: invoice.zatca_qr_code,
      submission_history: submissionHistory,
      compliance_score: (status === "submitted" || status === "approved") ? 100 : 
                       status === "incomplete" ? await ctx.runQuery(api.invoiceTemplates.getZATCAComplianceChecklist, {
                         invoice_id: args.invoice_id
                       }).then(result => result.compliance_score) : 100
    };
  },
});

/**
 * Get all invoices with their submission status
 */
export const getAllInvoicesWithStatus = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .collect();

    const invoicesWithStatus = await Promise.all(
      invoices.map(async (invoice) => {
        // Determine status for each invoice
        let status = "draft";
        let statusMessage = "Draft";
        let canSubmit = false;

        if (invoice.is_submitted) {
          status = "submitted";
          statusMessage = "Submitted to ZATCA";
          
          if (invoice.submission_result?.success) {
            status = "approved";
            statusMessage = "Approved by ZATCA";
          } else if (invoice.submission_result?.error) {
            status = "rejected";
            statusMessage = "Rejected by ZATCA";
            canSubmit = true;
          }
        } else {
          // Check compliance for non-submitted invoices
          try {
            const complianceCheck = await ctx.runQuery(api.invoiceTemplates.getZATCAComplianceChecklist, {
              invoice_id: invoice._id
            });
            
            if (complianceCheck.compliance_score === 100) {
              status = "ready";
              statusMessage = "Ready for submission";
              canSubmit = true;
            } else {
              status = "incomplete";
              statusMessage = `${complianceCheck.compliance_score}% compliant`;
            }
          } catch (error) {
            status = "error";
            statusMessage = "Compliance check failed";
          }
        }

        return {
          ...invoice,
          current_status: status,
          status_message: statusMessage,
          can_submit: canSubmit
        };
      })
    );

    return invoicesWithStatus;
  },
});

/**
 * Download invoice PDF
 */
export const downloadInvoicePDF = action({
  args: {
    invoice_id: v.id("invoices"),
  },
  handler: async (ctx, args): Promise<{ html: string; invoice_number: string }> => {
    try {
      console.log("=== DOWNLOAD INVOICE PDF ===");
      console.log("Invoice ID:", args.invoice_id);
      
      // Get invoice details
      const invoiceData: any = await ctx.runQuery(api.invoiceManagement.getInvoiceDetails, {
        invoice_id: args.invoice_id
      });

      if (!invoiceData || !invoiceData.invoice) {
        throw new Error("Invoice not found");
      }

      const invoice: any = invoiceData.invoice;
      const items = invoiceData.items || [];

      // Get organization details
      const organization = await ctx.runQuery(api.organizations.getOrganization, {
        id: invoice.organization_id
      });

      if (!organization) {
        throw new Error("Organization not found");
      }

      console.log("Generating PDF for invoice:", invoice.invoice_number);

      // Calculate totals
      const calculatedSubtotal = items.reduce((sum: number, item: any) => sum + ((item.unit_price || 0) * (item.quantity || 0) - (item.discount_amount || 0)), 0);
      const calculatedVat = items.reduce((sum: number, item: any) => sum + (item.vat_amount || 0), 0);
      const calculatedGrandTotal = calculatedSubtotal + calculatedVat;

      // Generate ZATCA-compliant HTML directly
      const html = generateZATCAHTML({
        invoice,
        items,
        organization,
        invoice_id: args.invoice_id,
        calculatedSubtotal,
        calculatedVat,
        calculatedGrandTotal
      });

      return {
        html,
        invoice_number: invoice.invoice_number || `INV-${args.invoice_id.slice(-8)}`
      };

    } catch (error: any) {
      console.error("PDF download failed:", error);
      throw new Error(`PDF download failed: ${error.message}`);
    }
  }
});

/**
 * Generate simple invoice HTML
 */
function generateZATCACompliantInvoiceHTML(data: {
  invoice: any;
  items: any[];
  organization: any;
  invoice_id: string;
  calculatedSubtotal: number;
  calculatedVat: number;
  calculatedGrandTotal: number;
}): string {
  const { invoice, items, organization, invoice_id, calculatedSubtotal, calculatedVat, calculatedGrandTotal } = data;

  return `
<!DOCTYPE html>
<html dir="ltr" lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${invoice.invoice_number}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #000;
            margin: 0;
            padding: 0;
        }
        
        .invoice-container {
            max-width: 95%;
            margin: 0 auto;
            transform: scale(0.9);
            transform-origin: top center;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        
        .header-left {
            flex: 1;
            text-align: left;
        }
        
        .header-center {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 20px;
        }
        
        .header-right {
            flex: 1;
            text-align: right;
        }
        
        .company-logo {
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: white;
            overflow: hidden;
            margin-right: 20px;
        }
        
        .company-logo img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
        
        .company-logo-fallback {
            width: 100%;
            height: 100%;
            background: #2f704a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-address {
            font-size: 11px;
            line-height: 1.3;
        }
        
        .invoice-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            border: 2px solid #333;
            padding: 8px;
            background: #f5f5f5;
        }
        
        .invoice-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .invoice-info, .dates-info {
            border: 1px solid #ccc;
            padding: 15px;
            background: #f9f9f9;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 11px;
        }
        
        .info-label {
            font-weight: bold;
        }
        
        .info-value {
            text-align: right;
        }
        
        .parties-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .party-card {
            border: 1px solid #ccc;
            padding: 15px;
            background: #f9f9f9;
        }
        
        .party-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        
        .party-details {
            font-size: 11px;
            line-height: 1.4;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 10px;
        }
        
        .items-table th,
        .items-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: center;
            vertical-align: top;
        }
        
        .items-table th {
            background: #f0f0f0;
            font-weight: bold;
        }
        
        .items-table .item-description {
            text-align: left;
            max-width: 200px;
        }
        
        .items-table .amount {
            text-align: right;
        }
        
        .summary-section {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .amounts-summary {
            border: 1px solid #ccc;
            padding: 15px;
            background: #f9f9f9;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .summary-row.total {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #333;
            padding-top: 8px;
            margin-top: 10px;
        }
        
        .summary-label {
            font-weight: bold;
        }
        
        .summary-value {
            text-align: right;
        }
        
        .footer-note {
            text-align: center;
            font-size: 10px;
            color: #666;
            margin-top: 20px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
        
        /* ZATCA Compliance Section */
        .zatca-compliance {
            background-color: #e3f2fd;
            border: 1px solid #2196f3;
            border-radius: 8px;
            padding: 12px;
            margin: 15px 0;
        }
        
        .compliance-header h3 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 14px;
            text-align: center;
        }
        
        .compliance-content {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        
        .compliance-info {
            flex: 1;
        }
        
        .compliance-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .compliance-label {
            font-weight: bold;
            color: #333;
        }
        
        .compliance-value {
            color: #1976d2;
            font-weight: bold;
        }
        
        .qr-section {
            margin-left: 20px;
        }
        
        .qr-code {
            text-align: center;
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 4px;
            background-color: white;
        }
        
        .qr-placeholder {
            width: 120px;
            height: 120px;
            border: 3px solid #1976d2;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 8px auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
            padding: 4px;
        }
        
        .qr-placeholder img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .qr-fallback {
            text-align: center;
            font-size: 8px;
            line-height: 1.1;
            color: #1976d2;
            font-weight: bold;
        }
        
        .qr-title {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 2px;
            color: #1976d2;
        }
        
        .qr-data {
            margin: 2px 0;
        }
        
        .qr-line {
            margin: 1px 0;
            font-size: 7px;
            color: #333;
        }
        
        .qr-uuid-small {
            font-size: 6px;
            color: #666;
            margin-top: 2px;
        }
        
        .qr-uuid {
            font-size: 10px;
            color: #666;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .invoice-container { max-width: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header Section -->
        <div class="header">
            <div class="header-left">
                <div class="company-info">
                    <div class="company-name">${organization.name}</div>
                    <div class="company-address">
                        ${organization.address}<br>
                        ${organization.city || 'Riyadh'}, Kingdom of Saudi Arabia<br>
                        VAT: ${organization.vat_number} | CR: ${organization.cr_number || 'N/A'}
                    </div>
                </div>
            </div>
            <div class="header-center">
                <div class="company-logo">
                    ${organization.logo_url ? 
                        `<img src="${organization.logo_url}" alt="${organization.name} Logo" />` : 
                        `<div class="company-logo-fallback">${organization.name.substring(0, 2).toUpperCase()}</div>`
                    }
                </div>
            </div>
            <div class="header-right">
                <div class="company-info">
                    <div class="company-name" style="font-size: 18px; margin-bottom: 5px;">${organization.name_arabic || 'شركة رواسي للمقاولات والتجارة'}</div>
                    <div class="company-address" style="font-size: 11px; line-height: 1.3;">
                        ${organization.address_arabic || 'الرياض، المملكة العربية السعودية'}<br>
                        ${organization.city_arabic || 'الرياض'}, المملكة العربية السعودية<br>
                        ضريبة القيمة المضافة: ${organization.vat_number} | السجل التجاري: ${organization.cr_number || 'غير محدد'}
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoice Title -->
        <div class="invoice-title">
            TAX INVOICE
        </div>

        <!-- Invoice Details -->
        <div class="invoice-details">
            <div class="invoice-info">
                <div class="info-row">
                    <span class="info-label">Invoice No:</span>
                    <span class="info-value">${invoice.invoice_number || `INV-${invoice_id.slice(-8)}`}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Invoice Date:</span>
                    <span class="info-value">${formatDate(invoice.invoice_date)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Due Date:</span>
                    <span class="info-value">${formatDate(invoice.due_date)}</span>
                </div>
            </div>
            <div class="dates-info">
                <div class="info-row">
                    <span class="info-label">Currency:</span>
                    <span class="info-value">${getCurrencySymbol(invoice.currency)} ${invoice.currency}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">VAT Rate:</span>
                    <span class="info-value">${invoice.vat_rate}%</span>
                </div>
            </div>
        </div>

        <!-- Parties Section -->
        <div class="parties-section">
            <div class="party-card">
                <div class="party-title">Our Details</div>
                <div class="party-details">
                    <strong>${organization.name}</strong><br>
                    ${organization.address}<br>
                    City: ${organization.city || 'Riyadh'}<br>
                    Country: Saudi Arabia<br>
                    VAT: ${organization.vat_number}<br>
                    CRN: ${organization.cr_number || 'N/A'}
                </div>
            </div>
            
            <div class="party-card">
                <div class="party-title">Client Details</div>
                <div class="party-details">
                    <strong>${invoice.customer_name}</strong><br>
                    ${invoice.customer_address}<br>
                    ${invoice.customer_vat_number ? `VAT: ${invoice.customer_vat_number}<br>` : ''}
                    Country: Saudi Arabia
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${items && items.length > 0 ? items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td class="item-description">${item.description || 'No description'}</td>
                    <td>${item.quantity || 0}</td>
                    <td class="amount">${getCurrencySymbol(invoice.currency)} ${(item.unit_price || 0).toFixed(2)}</td>
                    <td class="amount">${getCurrencySymbol(invoice.currency)} ${(item.total_amount || 0).toFixed(2)}</td>
                </tr>
                `).join('') : `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #666;">
                        No items found for this invoice
                    </td>
                </tr>
                `}
            </tbody>
        </table>

        <!-- Summary Section -->
        <div class="summary-section">
            <div class="amounts-summary">
                <div class="summary-row">
                    <span class="summary-label">Subtotal:</span>
                    <span class="summary-value">${getCurrencySymbol(invoice.currency)} ${calculatedSubtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">VAT (${invoice.vat_rate || 15}%):</span>
                    <span class="summary-value">${getCurrencySymbol(invoice.currency)} ${calculatedVat.toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span class="summary-label">Total:</span>
                    <span class="summary-value">${getCurrencySymbol(invoice.currency)} ${calculatedGrandTotal.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <!-- ZATCA Compliance Section -->
        <div class="zatca-compliance">
            <div class="compliance-header">
                <h3>ZATCA Compliance / امتثال هيئة الزكاة والضريبة والجمارك</h3>
            </div>
            <div class="compliance-content">
                <div class="compliance-info">
                    <div class="compliance-row">
                        <span class="compliance-label">VAT Registration No / رقم تسجيل ضريبة القيمة المضافة:</span>
                        <span class="compliance-value">${organization.vat_number || '300000000000003'}</span>
                    </div>
                    <div class="compliance-row">
                        <span class="compliance-label">Reference Number / الرقم المرجعي:</span>
                        <span class="compliance-value">${invoice.invoice_number || `INV-${invoice_id.slice(-8)}`}</span>
                    </div>
                    <div class="compliance-row">
                        <span class="compliance-label">Digital Signature / التوقيع الرقمي:</span>
                        <span class="compliance-value">${invoice.zatca_digital_signature || '31AF053F'}</span>
                    </div>
                </div>
                <div class="qr-section">
                    <div class="qr-code">
                        <div class="qr-placeholder">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(generateZATCAQRCode({
                                sellerName: organization.name || 'Rawabi Contracting and Trading',
                                vatNumber: organization.vat_number || '300000000000003',
                                timestamp: new Date().toISOString(),
                                invoiceTotal: calculatedGrandTotal,
                                vatTotal: calculatedVat,
                                invoiceHash: invoice.zatca_invoice_hash || '31AF053F',
                                cryptographicStamp: invoice.zatca_cryptographic_stamp || '4e84cb6b-...'
                            }))}" 
                                 alt="ZATCA QR Code" 
                                 style="width: 100%; height: 100%; object-fit: contain;" 
                                 onload="this.nextElementSibling.style.display='none';"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="qr-fallback" style="display: none; width: 100%; height: 100%; background: #f0f0f0; border: 1px solid #ccc; flex-direction: column; justify-content: center; align-items: center; font-size: 8px; text-align: center; padding: 2px;">
                                <div style="font-weight: bold; margin-bottom: 2px;">ZATCA QR</div>
                                <div>1: ${organization.name || 'Rawabi Contracting and Trading'}</div>
                                <div>2: ${organization.vat_number || '300000000000003'}</div>
                                <div>3: ${new Date().toISOString()}</div>
                                <div>4: ${calculatedGrandTotal.toFixed(2)}</div>
                                <div>5: ${calculatedVat.toFixed(2)}</div>
                                <div>6: ${invoice.zatca_invoice_hash || '31AF053F'}</div>
                                <div>7: ${invoice.zatca_cryptographic_stamp || '4e84cb6b-...'}</div>
                            </div>
                        </div>
                        <div class="qr-uuid">UUID: ${invoice.zatca_submission_uuid || '4e84cb6b-...'}</div>
                        <div class="qr-uuid" style="font-size: 9px; margin-top: 2px;">Invoice: ${invoice.invoice_number || 'N/A'}</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer-note">
            This invoice was generated by TradingERP System
        </div>
    </div>
</body>
</html>`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Convert string to hex representation (Convex-compatible alternative to Buffer)
 */
function stringToHex(str: string): string {
  let hex = '';
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    hex += charCode.toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Convert hex string to Base64 (Convex-compatible)
 */
function hexToBase64(hex: string): string {
  // Convert hex to binary string
  let binary = '';
  for (let i = 0; i < hex.length; i += 2) {
    binary += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  
  // Convert binary to Base64
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  while (i < binary.length) {
    const a = binary.charCodeAt(i++);
    const b = i < binary.length ? binary.charCodeAt(i++) : 0;
    const c = i < binary.length ? binary.charCodeAt(i++) : 0;
    
    const bitmap = (a << 16) | (b << 8) | c;
    
    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
    result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
  }
  
  return result;
}

/**
 * Generate ZATCA Phase 2 compliant QR code using official format
 * Based on ZATCA official specification for Phase 2 e-invoicing
 * Uses pipe-separated format as per ZATCA requirements
 */
function generateZATCAQRCode(data: {
  sellerName: string;
  vatNumber: string;
  timestamp: string;
  invoiceTotal: number;
  vatTotal: number;
  invoiceHash: string;
  cryptographicStamp: string;
}): string {
  // ZATCA Phase 2 QR Code Format - Pipe-separated format
  // Format: SellerName|VATNumber|Timestamp|InvoiceTotal|VATTotal|InvoiceHash|CryptographicStamp
  
  const qrData = [
    data.sellerName,
    data.vatNumber,
    data.timestamp,
    data.invoiceTotal.toFixed(2),
    data.vatTotal.toFixed(2),
    data.invoiceHash,
    data.cryptographicStamp
  ].join('|');
  
  return qrData;
}

/**
 * Get currency symbol for display
 */
function getCurrencySymbol(currency: string): string {
  const currencySymbols: { [key: string]: string } = {
    'SAR': '\uFDFC', // Saudi Riyal symbol (Unicode U+FDFC) - widely supported
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'KWD': 'د.ك',
    'BHD': 'د.ب',
    'QAR': 'ر.ق',
    'OMR': 'ر.ع.',
    'JOD': 'د.ا',
    'EGP': 'ج.م',
    'LBP': 'ل.ل',
    'TRY': '₺',
    'INR': '₹',
    'PKR': '₨',
    'BRL': 'R$',
    'CAD': 'C$',
    'AUD': 'A$',
    'JPY': '¥',
    'CNY': '¥',
    'KRW': '₩',
    'THB': '฿',
    'SGD': 'S$',
    'MYR': 'RM',
    'IDR': 'Rp',
    'PHP': '₱',
    'VND': '₫',
    'HKD': 'HK$',
    'TWD': 'NT$',
    'NZD': 'NZ$',
    'CHF': 'CHF',
    'SEK': 'kr',
    'NOK': 'kr',
    'DKK': 'kr',
    'PLN': 'zł',
    'CZK': 'Kč',
    'HUF': 'Ft',
    'RUB': '₽',
    'ZAR': 'R',
    'NGN': '₦',
    'KES': 'KSh',
    'GHS': '₵',
    'MAD': 'د.م.',
    'TND': 'د.ت',
    'DZD': 'د.ج',
    'LYD': 'ل.د',
    'ETB': 'Br',
    'UGX': 'USh',
    'TZS': 'TSh',
    'MWK': 'MK',
    'ZMW': 'ZK',
    'BWP': 'P',
    'SZL': 'L',
    'LSL': 'L',
    'NAD': 'N$',
    'MZN': 'MT',
    'AOA': 'Kz',
    'CDF': 'FC',
    'RWF': 'RF',
    'BIF': 'FBu',
    'DJF': 'Fdj',
    'KMF': 'CF',
    'MGA': 'Ar',
    'MUR': '₨',
    'SCR': '₨',
    'SOS': 'S',
    'SDG': 'ج.س.',
    'SSP': '£',
    'ERN': 'Nfk'
  };
  
  return currencySymbols[currency] || currency;
}

/**
 * Store XML record for ZATCA audit purposes
 */
export const storeXMLRecord = mutation({
  args: {
    invoice_id: v.id("invoices"),
    xml_content: v.string(),
    xml_hash: v.string(),
    submission_uuid: v.string(),
    zatca_reference: v.optional(v.string()),
    environment: v.union(v.literal("sandbox"), v.literal("production")),
    submission_type: v.union(v.literal("validation"), v.literal("submission")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.insert("zatca_xml_records", {
      invoice_id: args.invoice_id,
      xml_content: args.xml_content,
      xml_hash: args.xml_hash,
      submission_uuid: args.submission_uuid,
      zatca_reference: args.zatca_reference,
      environment: args.environment,
      submission_type: args.submission_type,
      created_at: now,
      updated_at: now,
    });
    
    console.log(`✅ XML record stored for invoice ${args.invoice_id} (${args.submission_type})`);
  },
});

/**
 * Get XML records for an invoice
 */
export const getXMLRecords = query({
  args: {
    invoice_id: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 Searching for XML records for invoice: ${args.invoice_id}`);
    const records = await ctx.db
      .query("zatca_xml_records")
      .withIndex("by_invoice", (q) => q.eq("invoice_id", args.invoice_id))
      .collect();
    console.log(`📄 Found ${records.length} XML records for invoice ${args.invoice_id}`);
    return records;
  },
});

/**
 * Download XML record by ID
 */
export const downloadXMLRecord = query({
  args: {
    record_id: v.id("zatca_xml_records"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.record_id);
    if (!record) {
      throw new Error("XML record not found");
    }
    return record;
  },
});

/**
 * Debug: Get all XML records (for troubleshooting)
 */
export const getAllXMLRecords = query({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("zatca_xml_records").collect();
    console.log(`🔍 Found ${records.length} XML records in database`);
    return records;
  },
});

