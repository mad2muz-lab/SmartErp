import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Helper type for UI-friendly lead object
const leadReturnValidator = v.object({
  _id: v.id("leads"),
  _creationTime: v.float64(),
  lead_number: v.string(),
  name: v.string(),
  status: v.string(),
  priority: v.string(),
  assigned_to: v.optional(v.string()),
  
  // Quotation-like fields
  customer_id: v.optional(v.id("customers")),
  customer_name: v.optional(v.string()),
  subject: v.optional(v.string()),
  description: v.optional(v.string()),
  currency: v.string(),
  subtotal: v.optional(v.float64()),
  tax_rate: v.optional(v.float64()),
  tax_amount: v.optional(v.float64()),
  total_amount: v.optional(v.float64()),
  terms_conditions: v.optional(v.string()),
  notes: v.optional(v.string()),
  
  // Legacy fields for backward compatibility
  company: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  source: v.string(),
  estimated_value: v.optional(v.float64()), // Maps to total_amount
  organization_id: v.id("organizations"),
  reminder_scheduled: v.optional(v.boolean()),
  reminder_date: v.optional(v.string()),
  closure_type: v.optional(v.string()),
  quotation_id: v.optional(v.id("quotations")),
});

export const listLeads = query({
  args: { organization_id: v.union(v.id("organizations"), v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      if (!args.organization_id || (typeof args.organization_id === "string" && (
        args.organization_id.startsWith("org_") ||
        args.organization_id.startsWith("temp_") ||
        args.organization_id.startsWith("demo_") ||
        args.organization_id.startsWith("local_") ||
        args.organization_id.startsWith("vnd_") ||
        args.organization_id.startsWith("vendor_")
      ))) {
        return [];
      }

      const docs = await ctx.db
        .query("leads")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .filter((q) => q.eq(q.field("is_active"), true))
        .order("asc")
        .collect();

      return docs.map((d) => ({
        _id: d._id,
        _creationTime: d._creationTime,
        lead_number: d.lead_number,
        name: d.name,
        status: d.status,
        priority: d.priority,
        assigned_to: d.assigned_to,
        
        // Quotation-like fields
        customer_id: d.customer_id,
        customer_name: d.customer_name, // Use the stored customer_name
        subject: d.subject,
        description: d.description,
        currency: d.currency,
        subtotal: d.subtotal || 0,
        tax_rate: d.tax_rate || 0,
        tax_amount: d.tax_amount || 0,
        total_amount: d.total_amount || 0,
        terms_conditions: d.terms_conditions,
        notes: d.notes,
        
        // Legacy fields for backward compatibility
        company: d.company,
        email: d.email,
        phone: d.phone,
        source: d.source,
        estimated_value: d.total_amount, // Map to total_amount
        organization_id: d.organization_id,
        reminder_scheduled: d.reminder_scheduled,
        reminder_date: d.reminder_date,
        closure_type: d.closure_type,
        quotation_id: d.quotation_id,
      }));
    } catch (err) {
      console.warn("listLeads fallback:", err);
      return [];
    }
  },
});

export const getLead = query({
  args: { id: v.id("leads") },
  returns: v.union(leadReturnValidator, v.null()),
  handler: async (ctx, args) => {
    const d = await ctx.db.get(args.id);
    if (!d) return null;
    return {
      _id: d._id,
      _creationTime: d._creationTime,
      lead_number: d.lead_number,
      name: d.name,
      status: d.status,
      priority: d.priority,
      assigned_to: d.assigned_to,
      
      // Quotation-like fields
      customer_id: d.customer_id,
      customer_name: d.customer_name, // Use the stored customer_name
      subject: d.subject,
      description: d.description,
      currency: d.currency,
      subtotal: d.subtotal || 0,
      tax_rate: d.tax_rate || 0,
      tax_amount: d.tax_amount || 0,
      total_amount: d.total_amount || 0,
      terms_conditions: d.terms_conditions,
      notes: d.notes,
      
      // Legacy fields for backward compatibility
      company: d.company,
      email: d.email,
      phone: d.phone,
      source: d.source,
      estimated_value: d.total_amount, // Map to total_amount
      organization_id: d.organization_id,
      reminder_scheduled: d.reminder_scheduled,
      reminder_date: d.reminder_date,
      closure_type: d.closure_type,
      quotation_id: d.quotation_id,
    };
  },
});

export const createLead = mutation({
  // Args aligned with new lead form structure
  args: {
    // Essential lead fields
    lead_number: v.optional(v.string()),
    name: v.string(),
    status: v.string(),
    priority: v.string(),
    assigned_to: v.optional(v.string()),
    
    // Quotation-like fields
    customer_id: v.optional(v.id("customers")),
    customer_name: v.optional(v.string()),
    subject: v.optional(v.string()),
    description: v.optional(v.string()),
    currency: v.optional(v.string()),
    subtotal: v.optional(v.float64()),
    tax_rate: v.optional(v.float64()),
    tax_amount: v.optional(v.float64()),
    total_amount: v.optional(v.float64()),
    terms_conditions: v.optional(v.string()),
    notes: v.optional(v.string()),
    
    // Legacy fields for backward compatibility
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    estimated_value: v.optional(v.float64()),
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
  },
  returns: v.id("leads"),
  handler: async (ctx, args): Promise<any> => {
    const now = new Date().toISOString();

    // Use provided lead number if available; otherwise generate one
    const leadNumber: string = args.lead_number ?? await ctx.runMutation(api.reminders.generateLeadNumber, {
      organization_id: args.organization_id,
    });

    // Get organization to use its currency
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const inserted: any = await ctx.db.insert("leads", {
      // Essential lead fields
      lead_number: leadNumber,
      name: args.name,
      status: args.status,
      priority: args.priority,
      assigned_to: args.assigned_to,
      
      // Quotation-like fields
      customer_id: args.customer_id,
      customer_name: args.customer_name,
      subject: args.subject,
      description: args.description,
      currency: args.currency || organization.currency,
      subtotal: args.subtotal || 0,
      tax_rate: args.tax_rate || 0,
      tax_amount: args.tax_amount || 0,
      total_amount: args.total_amount || args.estimated_value || 0,
      terms_conditions: args.terms_conditions,
      notes: args.notes,
      
      // Legacy fields for backward compatibility
      company: args.company,
      email: args.email,
      phone: args.phone,
      source: args.source ?? "unknown",
      value: args.total_amount || args.estimated_value || 0, // Map to total_amount
      organization_id: args.organization_id,
      next_follow_up: undefined,
      reminder_scheduled: false,
      reminder_date: undefined,
      closure_type: undefined,
      quotation_id: undefined,
      tags: undefined,
      created_by: args.created_by,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // Schedule reminder based on priority
    await ctx.runMutation(api.reminders.scheduleReminder, {
      lead_id: inserted,
      priority: args.priority,
    });

    return inserted;
  },
});

export const updateLead = mutation({
  args: {
    id: v.id("leads"),
    // Essential lead fields
    name: v.optional(v.string()),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assigned_to: v.optional(v.string()),
    
    // Quotation-like fields
    customer_id: v.optional(v.id("customers")),
    customer_name: v.optional(v.string()),
    subject: v.optional(v.string()),
    description: v.optional(v.string()),
    currency: v.optional(v.string()),
    subtotal: v.optional(v.float64()),
    tax_rate: v.optional(v.float64()),
    tax_amount: v.optional(v.float64()),
    total_amount: v.optional(v.float64()),
    terms_conditions: v.optional(v.string()),
    notes: v.optional(v.string()),
    
    // Legacy fields for backward compatibility
    company: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    source: v.optional(v.string()),
    estimated_value: v.optional(v.float64()),
    value: v.optional(v.float64()), // Maps to total_amount
    is_active: v.optional(v.boolean()),
    
    // Additional fields that might be sent from frontend
    reminder_date: v.optional(v.string()),
    reminder_scheduled: v.optional(v.boolean()),
    next_follow_up: v.optional(v.string()),
    closure_type: v.optional(v.union(v.literal("quotation"), v.literal("lost"), v.literal("closed"))),
    quotation_id: v.optional(v.id("quotations")),
    tags: v.optional(v.array(v.string())),
    created_by: v.optional(v.string()),
    
    // Additional fields that might be sent from formData
    lead_number: v.optional(v.string()), // Exclude this from actual update
    organization_id: v.optional(v.id("organizations")), // Exclude this from actual update
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log('🔍 updateLead called with args:', JSON.stringify(args, null, 2));
    const { id, priority, customer_name, lead_number, organization_id, ...rest } = args;
    const now = new Date().toISOString();

    // Map estimated_value to total_amount for backward compatibility
    const updateData = {
      ...rest,
      total_amount: rest.estimated_value || rest.total_amount,
      updated_at: now,
    };

    // Only include customer_name if it's provided and the schema supports it
    if (customer_name !== undefined) {
      try {
        await ctx.db.patch(id, {
          ...updateData,
          customer_name: customer_name,
        });
      } catch (error) {
        // If customer_name field is not supported in schema, update without it
        console.warn('customer_name field not supported in schema, updating without it');
        await ctx.db.patch(id, updateData);
      }
    } else {
      await ctx.db.patch(id, updateData);
    }

    // If priority changed, reschedule reminder
    if (priority) {
      await ctx.runMutation(api.reminders.cancelReminder, { lead_id: id });
      await ctx.runMutation(api.reminders.scheduleReminder, {
        lead_id: id,
        priority: priority,
      });
    }

    return null;
  },
});

export const deleteLead = mutation({
  args: { id: v.id("leads") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // First, delete all items associated with this lead
    const leadItems = await ctx.db
      .query("lead_items")
      .withIndex("by_lead", (q) => q.eq("lead_id", args.id))
      .collect();
    
    // Delete all items
    for (const item of leadItems) {
      await ctx.db.delete(item._id);
    }
    
    // Cancel any scheduled reminders
    await ctx.runMutation(api.reminders.cancelReminder, { lead_id: args.id });
    
    // Finally, delete the lead
    await ctx.db.delete(args.id);
    return null;
  },
});

// New function to close a lead
export const closeLead = mutation({
  args: {
    id: v.id("leads"),
    closure_type: v.union(v.literal("quotation"), v.literal("lost"), v.literal("closed")),
    quotation_id: v.optional(v.id("quotations")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.id, {
      status: "closed",
      closure_type: args.closure_type,
      quotation_id: args.quotation_id,
      updated_at: now,
    });

    // Cancel any scheduled reminders
    await ctx.runMutation(api.reminders.cancelReminder, { lead_id: args.id });
    
    return null;
  },
});

// Function to convert lead to quotation - UPDATED FOR NEW STRUCTURE
export const convertToQuotation = mutation({
  args: {
    lead_id: v.id("leads"),
    issue_date: v.string(),
    expiry_date: v.string(),
    terms_conditions: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  returns: v.id("quotations"),
  handler: async (ctx, args) => {
    const lead = await ctx.db.get(args.lead_id);
    if (!lead) {
      throw new Error("Lead not found");
    }

    // Get lead items to calculate total value
    const leadItems = await ctx.db
      .query("lead_items")
      .withIndex("by_lead", (q) => q.eq("lead_id", args.lead_id))
      .collect();

    // Use lead's financial data if available, otherwise calculate from items
    const subtotal = lead.subtotal || leadItems.reduce((sum, item) => sum + item.total_price, 0);
    const taxAmount = lead.tax_amount || 0;
    const totalAmount = lead.total_amount || subtotal + taxAmount;
    const now = new Date().toISOString();

    // Check if lead has a customer_id, if not, we need to handle this case
    if (!lead.customer_id) {
      throw new Error(`Cannot convert lead "${lead.name}" (${lead.lead_number}) to quotation: Lead does not have an associated customer. Please edit the lead and assign a customer first. You can select an existing customer or create a new one.`);
    }

    // Create quotation with lead data
    const quotationId = await ctx.db.insert("quotations", {
      quotation_number: `QT-${Date.now()}`,
      customer_id: lead.customer_id, // Now we know this exists
      organization_id: lead.organization_id,
      issue_date: args.issue_date,
      expiry_date: args.expiry_date,
      currency: lead.currency,
      subtotal: subtotal,
      discount_amount: 0,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: "draft",
      terms_conditions: args.terms_conditions || lead.terms_conditions,
      notes: args.notes || lead.notes, // Use lead notes if no notes provided
      // Link this quotation to the lead
      lead_id: args.lead_id,
      lead_number: lead.lead_number,
      created_by: lead.created_by,
      created_at: now,
      updated_at: now,
    });

    // Convert lead items to quotation items
    for (const leadItem of leadItems) {
      // Try to find existing inventory item by name
      let inventoryId: any = null;
      const existingInventory = await ctx.db
        .query("inventory")
        .withIndex("by_organization", (q) => q.eq("organization_id", lead.organization_id))
        .filter((q) => q.eq(q.field("name"), leadItem.item_name))
        .first();
      
      if (existingInventory) {
        inventoryId = existingInventory._id;
      } else {
        // Create new inventory item from lead item data
        inventoryId = await ctx.db.insert("inventory", {
          name: leadItem.item_name,
          sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          description: leadItem.description,
          category: "General Item",
          unit: "pcs",
          cost_price: 0,
          current_price: leadItem.unit_price,
          currency: leadItem.currency,
          quantity_in_stock: 0,
          organization_id: lead.organization_id,
          created_by: lead.created_by || "system",
          is_active: true,
          created_at: now,
          updated_at: now,
        });
        await ctx.db.patch(inventoryId, {
          qr_code: `smart-erp://inventory/${inventoryId}`,
          qr_generated_at: now,
        });
      }

      // Create quotation item
      await ctx.db.insert("quotation_items", {
        quotation_id: quotationId,
        inventory_id: inventoryId,
        quantity: leadItem.quantity,
        unit_price: leadItem.unit_price,
        discount_percentage: 0,
        discount_amount: 0,
        total_price: leadItem.total_price,
        notes: leadItem.description,
        created_at: now,
      });
    }

    // Close the lead as converted to quotation
    await ctx.runMutation(api.leads.closeLead, {
      id: args.lead_id,
      closure_type: "quotation",
      quotation_id: quotationId,
    });

    return quotationId;
  },
});
