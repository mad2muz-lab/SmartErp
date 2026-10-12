import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

const quotationReturn = v.object({
  _id: v.id("quotations"),
  _creationTime: v.number(),
  quotation_number: v.string(),
  customer_id: v.id("customers"),
  customer_name: v.optional(v.string()),
  reference_number: v.optional(v.string()), // Renamed from subject
  description: v.optional(v.string()),
  status: v.string(),
  valid_until: v.string(),
  terms_conditions: v.optional(v.string()),
  notes: v.optional(v.string()),
  subtotal: v.number(),
  tax_rate: v.optional(v.number()),
  tax_amount: v.number(),
  total_amount: v.number(),
  currency: v.string(),
  organization_id: v.id("organizations"),
  // New fields for enhanced quotation management
  salesperson: v.optional(v.string()),
  markup_percentage: v.optional(v.number()),
  // Lead connection fields
  lead_id: v.optional(v.id("leads")),
  lead_number: v.optional(v.string()),
});

export const listQuotations = query({
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
        .query("quotations")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .order("desc")
        .collect();

    // Fetch customer names for all quotations
    const quotationsWithCustomers = await Promise.all(
      docs.map(async (d) => {
        let customerName = 'Unknown Customer';
        try {
          const customer = await ctx.db.get(d.customer_id);
          if (customer) {
            customerName = customer.customer_company_name || 'Unknown Customer';
          }
        } catch (error) {
          console.warn('Failed to fetch customer:', error);
        }

        return {
          _id: d._id,
          _creationTime: d._creationTime,
          quotation_number: d.quotation_number,
          customer_id: d.customer_id,
          customer_name: customerName,
          reference_number: d.reference_number || '', // Use reference_number field
          description: d.description || '',
          status: d.status,
          valid_until: d.expiry_date,
          terms_conditions: d.terms_conditions,
          notes: d.notes,
          subtotal: d.subtotal,
          tax_rate: 15, // Fixed VAT rate as per Saudi regulations
          tax_amount: d.tax_amount,
          total_amount: d.total_amount,
          currency: d.currency,
          organization_id: d.organization_id,
          // New fields for enhanced quotation management
          salesperson: d.salesperson || '',
          markup_percentage: d.markup_percentage || 0,
          // Include lead connection information
          lead_id: d.lead_id,
          lead_number: d.lead_number,
        };
      })
    );

    return quotationsWithCustomers;
    } catch (err) {
      console.warn("listQuotations fallback:", err);
      return [];
    }
  },
});

export const getQuotation = query({
  args: { id: v.id("quotations") },
  returns: v.union(quotationReturn, v.null()),
  handler: async (ctx, args) => {
    const d = await ctx.db.get(args.id);
    if (!d) return null;
    let customerName: string | undefined = undefined;
    try {
      const customer = await ctx.db.get(d.customer_id);
      if (customer) {
        customerName = customer.customer_company_name || undefined;
      }
    } catch (error) {
      console.warn('Failed to fetch customer in getQuotation:', error);
    }
    return {
      _id: d._id,
      _creationTime: d._creationTime,
      quotation_number: d.quotation_number,
      customer_id: d.customer_id,
      customer_name: customerName,
      reference_number: d.reference_number || '', // Use reference_number field
      description: d.description || '',
      status: d.status,
      valid_until: d.expiry_date,
      terms_conditions: d.terms_conditions,
      notes: d.notes,
      subtotal: d.subtotal,
      tax_rate: d.tax_rate ?? 15,
      tax_amount: d.tax_amount,
      total_amount: d.total_amount,
      currency: d.currency,
      organization_id: d.organization_id,
      // New fields for enhanced quotation management
      salesperson: d.salesperson || '',
      markup_percentage: d.markup_percentage || 0,
      // Include lead connection information
      lead_id: d.lead_id,
      lead_number: d.lead_number,
    };
  },
});

// Get quotations by customer for invoice conversion
export const getQuotationsByCustomer = query({
  args: { 
    customer_id: v.union(v.id("customers"), v.string()),
    organization_id: v.union(v.id("organizations"), v.string())
  },
  returns: v.array(v.object({
    _id: v.id("quotations"),
    quotation_number: v.string(),
    status: v.string(),
    total_amount: v.number(),
    currency: v.string(),
    valid_until: v.string(),
    reference_number: v.optional(v.string()),
    description: v.optional(v.string()),
    markup_percentage: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    try {
      // Handle both string and ID types
      const customerId = typeof args.customer_id === 'string' ? args.customer_id as any : args.customer_id;
      const organizationId = typeof args.organization_id === 'string' ? args.organization_id as any : args.organization_id;
      
      console.log('🔍 getQuotationsByCustomer called with:', { 
        customerId, 
        organizationId,
        customerIdType: typeof customerId,
        organizationIdType: typeof organizationId
      });
      
      // Validate inputs
      if (!customerId || !organizationId) {
        console.log('❌ Missing required parameters');
        return [];
      }
      
      // Check if we're in the correct database by trying to find the organization
      const org = await ctx.db.get(organizationId);
      if (!org) {
        console.log('❌ Organization not found - likely wrong database');
        return [];
      }
      
      // Use organization index first, then filter by customer
      const quotations = await ctx.db
        .query("quotations")
        .withIndex("by_organization", (q) => q.eq("organization_id", organizationId))
        .filter((q) => q.eq(q.field("customer_id"), customerId))
        .filter((q) => q.neq(q.field("status"), "cancelled"))
        .order("desc")
        .collect();

      console.log('✅ Found quotations:', quotations.length);

      const result = quotations.map(quotation => ({
        _id: quotation._id,
        quotation_number: quotation.quotation_number,
        status: quotation.status,
        total_amount: quotation.total_amount,
        currency: quotation.currency,
        valid_until: quotation.expiry_date,
        reference_number: quotation.reference_number,
        description: quotation.description,
        markup_percentage: quotation.markup_percentage || 0,
      }));
      
      console.log('📋 Returning quotations:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error in getQuotationsByCustomer:', error);
      // Return empty array instead of throwing error to prevent crashes
      return [];
    }
  },
});

export const createQuotation = mutation({
  args: {
    quotation_number: v.optional(v.string()),
    customer_id: v.id("customers"),
    customer_name: v.optional(v.string()),
    reference_number: v.optional(v.string()), // Renamed from subject
    description: v.optional(v.string()),
    status: v.string(),
    valid_until: v.string(),
    terms_conditions: v.optional(v.string()),
    notes: v.optional(v.string()),
    subtotal: v.number(),
    tax_rate: v.optional(v.number()),
    tax_amount: v.number(),
    total_amount: v.number(),
    currency: v.string(),
    organization_id: v.id("organizations"),
    created_by: v.optional(v.string()),
    // New fields for enhanced quotation management
    salesperson: v.optional(v.string()),
    markup_percentage: v.optional(v.number()),
    // Optional lead connection fields for quotations created from leads
    lead_id: v.optional(v.id("leads")),
    lead_number: v.optional(v.string()),
  },
  returns: v.id("quotations"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const quotationNumber = args.quotation_number ?? (() => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `QT-${year}${month}${day}-${random}`;
    })();

    return await ctx.db.insert("quotations", {
      quotation_number: quotationNumber,
      customer_id: args.customer_id,
      organization_id: args.organization_id,
      issue_date: now,
      expiry_date: args.valid_until,
      currency: args.currency,
      subtotal: args.subtotal,
      discount_amount: 0,
      tax_amount: args.tax_amount,
      total_amount: args.total_amount,
      status: args.status,
      terms_conditions: args.terms_conditions,
      notes: args.notes,
      // New fields for enhanced quotation management
      reference_number: args.reference_number,
      salesperson: args.salesperson,
      markup_percentage: args.markup_percentage,
      // Include lead connection if provided (only when quotation is created from a lead)
      lead_id: args.lead_id,
      lead_number: args.lead_number,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const updateQuotation = mutation({
  args: {
    id: v.id("quotations"),
    quotation_number: v.optional(v.string()),
    customer_id: v.optional(v.id("customers")),
    status: v.optional(v.string()),
    valid_until: v.optional(v.string()),
    terms_conditions: v.optional(v.string()),
    notes: v.optional(v.string()),
    subtotal: v.optional(v.number()),
    tax_rate: v.optional(v.number()),
    tax_amount: v.optional(v.number()),
    total_amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    // New fields for enhanced quotation management
    reference_number: v.optional(v.string()),
    salesperson: v.optional(v.string()),
    markup_percentage: v.optional(v.number()),
    // Additional fields for frontend compatibility
    customer_name: v.optional(v.string()),
    description: v.optional(v.string()),
    // Additional fields that frontend might send
    organization_id: v.optional(v.id("organizations")),
    issue_date: v.optional(v.string()),
    created_by: v.optional(v.string()),
    discount_amount: v.optional(v.number()),
    lead_id: v.optional(v.id("leads")),
    lead_number: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, valid_until, ...updates } = args;
    const now = new Date().toISOString();
    let updateData: any = null;
    
    try {
      // Use the same simple pattern as updateCustomer - spread operator with field mapping
      updateData = {
        ...updates,
        updated_at: now,
      };
      
      // Map valid_until to expiry_date (same as createQuotation)
      if (valid_until !== undefined) {
        updateData.expiry_date = valid_until;
      }
      
      await ctx.db.patch(id, updateData);
      
      // Trigger profit calculation if status changed to "delivered"
      if (args.status === "delivered") {
        try {
          // Get the quotation to check if it has the required data
          const quotation = await ctx.db.get(id);
          if (quotation && quotation.organization_id) {
            // Check if profit calculation already exists
            const existingOrderFinancial = await ctx.db
              .query("order_financials")
              .withIndex("by_quotation", (q) => q.eq("quotation_id", id))
              .unique();
            
            if (!existingOrderFinancial) {
              // Calculate profit using the quotation data
              // For now, we'll use a default cost calculation based on markup
              // In a real implementation, you might want to get actual costs from inventory
              const markupPercentage = quotation.markup_percentage || 0;
              const subtotal = quotation.subtotal || 0;
              
              // Calculate cost based on markup percentage
              // If markup is 20%, then cost = subtotal / 1.2
              const costExclVat = markupPercentage > 0 ? subtotal / (1 + markupPercentage / 100) : subtotal * 0.8; // Default 80% cost
              const costVat = quotation.tax_amount || 0; // Use same VAT as quotation
              
              // Call the profit calculation function
              await ctx.runMutation(api.profitSharing.calculateOrderProfit, {
                organization_id: quotation.organization_id,
                quotation_id: id,
                cost_excl_vat: costExclVat,
                cost_vat: costVat,
                created_by: quotation.created_by || "system",
              });
            }
          }
        } catch (profitError) {
          console.error('Error calculating profit for quotation:', id, profitError);
          // Don't throw error - profit calculation failure shouldn't break quotation update
        }
      }
      
      return null;
    } catch (error) {
      console.error('updateQuotation error:', error);
      console.error('updateQuotation args:', JSON.stringify(args, null, 2));
      if (updateData) {
        console.error('updateQuotation updateData:', JSON.stringify(updateData, null, 2));
      }
      throw error;
    }
  },
});

export const deleteQuotation = mutation({
  args: { id: v.id("quotations") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const quotation = await ctx.db.get(args.id);
    if (!quotation) {
      throw new Error("Quotation not found");
    }

    const now = new Date().toISOString();
    
    // [2025-01-11] Added - Check for delivery notes before deletion
    const deliveryNotes = await ctx.db
      .query("delivery_notes")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.id))
      .collect();
    
    if (deliveryNotes.length > 0) {
      throw new Error(`Cannot delete quotation: ${deliveryNotes.length} delivery note(s) exist for this quotation. Please delete the delivery notes first.`);
    }
    
    // Check if quotation is already archived
    if (quotation.status === "archived") {
      // Second click: Permanently delete from database
      // First delete all quotation items
      const items = await ctx.db
        .query("quotation_items")
        .withIndex("by_quotation", (q) => q.eq("quotation_id", args.id))
        .collect();
      
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      
      // Then delete the quotation itself
      await ctx.db.delete(args.id);
    } else {
      // First click: Archive the quotation
      await ctx.db.patch(args.id, { status: "archived", updated_at: now });
    }
    
    return null;
  },
});

export const createQuotationItem = mutation({
  args: {
    quotation_id: v.id("quotations"),
    inventory_id: v.id("inventory"),
    quantity: v.number(),
    unit: v.optional(v.string()),
    unit_price: v.number(),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.number(),
    notes: v.optional(v.string()),
    purchase_price: v.optional(v.number()),
    markup_amount: v.optional(v.number()),
    inventory_name: v.optional(v.string()),
  },
  returns: v.id("quotation_items"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("quotation_items", {
      quotation_id: args.quotation_id,
      inventory_id: args.inventory_id,
      quantity: args.quantity,
      unit: args.unit,
      unit_price: args.unit_price,
      discount_percentage: args.discount_percentage,
      discount_amount: args.discount_amount,
      total_price: args.total_price,
      notes: args.notes,
      purchase_price: args.purchase_price,
      markup_amount: args.markup_amount,
      inventory_name: args.inventory_name,
      created_at: now,
    });
  },
});

// This function has been removed as lead-to-quotation conversion now happens directly in the convertToQuotation function

export const listQuotationItems = query({
  args: { quotation_id: v.id("quotations") },
  returns: v.array(v.object({
    _id: v.id("quotation_items"),
    _creationTime: v.number(),
    quotation_id: v.id("quotations"),
    inventory_id: v.optional(v.id("inventory")),
    quantity: v.number(),
    unit: v.optional(v.string()),
    unit_price: v.number(),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.number(),
    notes: v.optional(v.string()),
    created_at: v.string(),
    // Include inventory item details
    inventory_name: v.optional(v.string()),
    inventory_name_arabic: v.optional(v.string()),
    inventory_sku: v.optional(v.string()),
    purchase_price: v.optional(v.number()),
    markup_amount: v.optional(v.number()),
    // [2025-01-11] Added - VAT amount per line item for enhanced quotation management
    vat_amount: v.optional(v.number()), // VAT amount per line item
    // [2025-01-11] Added - Delivery tracking fields for partial delivery management
    delivered_quantity: v.optional(v.number()), // Total quantity delivered across all delivery notes
    remaining_quantity: v.optional(v.number()), // Remaining quantity to be delivered (calculated field)
    wbs_code: v.optional(v.string()),
    item_title: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
  })),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("quotation_items")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
      .collect();

    // Get inventory details for each item
    const itemsWithInventory = await Promise.all(
      items.map(async (item) => {
        const inventory = item.inventory_id ? await ctx.db.get(item.inventory_id) : null;
        return {
          ...item,
          inventory_name: inventory?.name || item.inventory_name || (item.is_section_header ? (item.item_title || '') : undefined),
          inventory_name_arabic: inventory?.name_arabic,
          inventory_sku: inventory?.sku,
          // [2025-01-11] Added - Include vat_amount field in returned data
          vat_amount: item.vat_amount,
          // [2025-01-11] Added - Include delivery tracking fields in returned data
          delivered_quantity: item.delivered_quantity,
          remaining_quantity: item.remaining_quantity,
          wbs_code: item.wbs_code,
          item_title: item.item_title,
          is_section_header: item.is_section_header,
        };
      })
    );

    return itemsWithInventory;
  },
});

export const deleteQuotationItem = mutation({
  args: { id: v.id("quotation_items") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// [2025-01-11] Added - Get quotation delivery status and remaining quantities
export const getQuotationDeliveryStatus = query({
  args: { quotation_id: v.id("quotations") },
  returns: v.object({
    quotation_id: v.id("quotations"),
    total_items: v.number(),
    fully_delivered_items: v.number(),
    partially_delivered_items: v.number(),
    pending_items: v.number(),
    delivery_notes_count: v.number(),
    can_create_delivery_note: v.boolean(),
    items: v.array(v.object({
      item_id: v.id("quotation_items"),
      inventory_name: v.string(),
      ordered_quantity: v.number(),
      delivered_quantity: v.number(),
      remaining_quantity: v.number(),
      unit: v.optional(v.string()),
      can_deliver: v.boolean(),
    })),
  }),
  handler: async (ctx, args) => {
    // Get quotation items
    const quotationItems = await ctx.db
      .query("quotation_items")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
      .collect();

    // Get delivery notes for this quotation
    const deliveryNotes = await ctx.db
      .query("delivery_notes")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
      .collect();

    // Calculate delivery status for deliverable items (exclude section headers)
    const deliverableItems = quotationItems.filter(item => !item.is_section_header);

    const itemsWithStatus = await Promise.all(
      deliverableItems.map(async (item) => {
        const inventory = item.inventory_id ? await ctx.db.get(item.inventory_id) : null;
        const deliveredQuantity = item.delivered_quantity || 0;
        const remainingQuantity = Math.max(0, item.quantity - deliveredQuantity);
        
        return {
          item_id: item._id,
          inventory_name: inventory?.name || item.inventory_name || item.item_title || 'Unknown Item',
          ordered_quantity: item.quantity,
          delivered_quantity: deliveredQuantity,
          remaining_quantity: remainingQuantity,
          unit: item.unit || 'pcs',
          can_deliver: remainingQuantity > 0,
        };
      })
    );

    // Calculate summary statistics
    const totalItems = itemsWithStatus.length;
    const fullyDeliveredItems = itemsWithStatus.filter(item => item.remaining_quantity === 0).length;
    const partiallyDeliveredItems = itemsWithStatus.filter(item => 
      item.delivered_quantity > 0 && item.remaining_quantity > 0
    ).length;
    const pendingItems = itemsWithStatus.filter(item => item.delivered_quantity === 0).length;
    const canCreateDeliveryNote = itemsWithStatus.some(item => item.can_deliver);

    return {
      quotation_id: args.quotation_id,
      total_items: totalItems,
      fully_delivered_items: fullyDeliveredItems,
      partially_delivered_items: partiallyDeliveredItems,
      pending_items: pendingItems,
      delivery_notes_count: deliveryNotes.length,
      can_create_delivery_note: canCreateDeliveryNote,
      items: itemsWithStatus,
    };
  },
});

// Get quotation items for a specific quotation - [2025-01-11] Preserved original validator - DO NOT MODIFY
/*
export const getQuotationItems = query({
  args: { quotation_id: v.id("quotations") },
  // [2025-01-11] Fixed - Simplified validator to use v.any() to avoid field mismatch issues
  returns: v.any(),
*/

// [2025-01-11] Added working version with proper validator using append methodology
export const getQuotationItems = query({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(), // Simplified validator to handle all fields from database
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("quotation_items")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
      .collect();

    // Fetch inventory names for all items
    const itemsWithNames = await Promise.all(
      items.map(async (item) => {
        let itemName = item.inventory_name || item.item_title || 'Unknown Item';
        let itemNameArabic = '';
        let inventorySku = '';
        try {
          if (item.inventory_id) {
            const inventory = await ctx.db.get(item.inventory_id);
            if (inventory) {
              itemName = inventory.name || itemName;
              itemNameArabic = inventory.name_arabic || '';
              inventorySku = inventory.sku || ''; // [2025-01-11] Added - Include SKU for PDF
            }
          }
        } catch (error) {
          console.warn('Failed to fetch inventory:', error);
        }

        // [2025-01-11] Preserved original debug logging - DO NOT REMOVE
        console.log(`Item ${item._id} unit value:`, item.unit, typeof item.unit);
        
        // [2025-01-11] Added - Enhanced debug logging to diagnose unit field issue
        console.log(`Item ${item._id} raw database fields:`, {
          unit: item.unit,
          inventory_name: item.inventory_name,
          hasUnitDefined: item.unit !== undefined,
          hasUnitValue: !!item.unit
        });
        
        // [2025-01-11] Fixed - Ensure unit field is always included with proper fallback
        const unitValue = item.unit && item.unit.trim() !== '' ? item.unit : 'pcs';
        console.log(`Item ${item._id} final unit value:`, unitValue);
        
        return {
          _id: item._id,
          _creationTime: item._creationTime,
          quotation_id: item.quotation_id,
          inventory_id: item.inventory_id,
          item_name: itemName,
          item_name_arabic: itemNameArabic,
          quantity: item.quantity,
          unit: unitValue, // [2025-01-11] Enhanced - More robust unit handling
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes,
          discount_percentage: item.discount_percentage,
          purchase_price: item.purchase_price,
          markup_amount: item.markup_amount, // [2025-01-11] Added - Include markup amount
          inventory_name: item.inventory_name, // [2025-01-11] Added - Include inventory name
          inventory_name_arabic: itemNameArabic, // [2025-01-11] Added - Include Arabic name
          inventory_sku: inventorySku, // [2025-01-11] Added - Include inventory SKU
          wbs_code: item.wbs_code,
          item_title: item.item_title,
          is_section_header: item.is_section_header,
          created_at: item.created_at,
        };
      })
    );

    return itemsWithNames;
  },
});

// [2025-01-11] Preserved original working PDF function - DO NOT MODIFY
/*
export const getQuotationItemsForPDF = action({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(), // Simplified to avoid validator conflicts
  handler: async (ctx, args) => {
    try {
      // Query database directly to avoid validator issues
      const items = await ctx.db
        .query("quotation_items")
        .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
        .collect();
      
      console.log('PDF items from database:', items.map(item => ({ 
        id: item._id, 
        unit: item.unit, 
        inventory_name: item.inventory_name,
        hasUnit: item.unit !== undefined
      })));
      
      return items;
    } catch (error) {
      console.error('Error in getQuotationItemsForPDF:', error);
      throw error;
    }
  },
});
*/

// [2025-01-11] Preserved original working PDF function - DO NOT MODIFY
/*
export const getQuotationItemsForPDF = action({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      const items = await ctx.runQuery(api.quotations.getQuotationItems, {
        quotation_id: args.quotation_id
      });
      return items;
    } catch (error) {
      console.error('Error in getQuotationItemsForPDF:', error);
      throw error;
    }
  },
});
*/

// [2025-01-11] Preserved - Original PDF function that calls getQuotationItems (has validator issues)
/*
export const getQuotationItemsForPDF = action({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(),
  handler: async (ctx, args) => {
    try {
      const items = await ctx.runQuery(api.quotations.getQuotationItems, {
        quotation_id: args.quotation_id
      });
      return items;
    } catch (error) {
      console.error('Error in getQuotationItemsForPDF:', error);
      throw error;
    }
  },
});
*/

// [2025-01-11] Fixed - Simple working PDF function that directly queries database to avoid validator issues
export const getQuotationItemsForPDF = action({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    try {
      console.log('PDF function: Using working query for quotation:', args.quotation_id);
      
      // [2025-01-11] Fixed - Use working getQuotationItems query instead of direct database access
      const items = await ctx.runQuery(api.quotations.getQuotationItems, {
        quotation_id: args.quotation_id
      });
      
      console.log('PDF function: Found', items.length, 'items');
      
      // Items already processed by getQuotationItems, just return them directly
      console.log('PDF function returning items with units:', items.map((item: any) => ({ id: item._id, unit: item.unit })));
      return items;
    } catch (error) {
      console.error('Error in getQuotationItemsForPDF:', error);
      throw error;
    }
  },
});

// [2025-01-11] Test function - Simple test to check if unit data can be returned
export const testQuotationItemsUnits = action({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(),
  handler: async (ctx, args) => {
    console.log('TEST: Starting unit test for quotation:', args.quotation_id);
    
    const items = await (ctx as any).db
      .query("quotation_items")
      .withIndex("by_quotation", (q: any) => q.eq("quotation_id", args.quotation_id))
      .collect();
    
    console.log('TEST: Found items:', items.length);
    
    const result = items.map((item: any) => ({
      id: item._id,
      unit: item.unit,
      unitDefined: item.unit !== undefined,
      unitValue: String(item.unit),
    }));
    
    console.log('TEST: Unit data:', result);
    return result;
  },
});

// [2025-01-11] Added - Simple working query for quotation items that includes unit field
export const getQuotationItemsWithUnits = query({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(), // Allow all fields to bypass validator issues
  handler: async (ctx, args) => {
    console.log('getQuotationItemsWithUnits called for quotation:', args.quotation_id);
    
    // Get raw items from database
    const items = await ctx.db
      .query("quotation_items")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
      .collect();
    
    console.log('Raw items retrieved:', items.length);
    
    // Return items with enhanced mapping
    const processedItems = await Promise.all(
      items.map(async (item) => {
        // Get inventory data for item names
        let itemName = item.is_section_header ? (item.inventory_name || item.item_title || 'Section Header') : 'Unknown Item';
        let itemNameArabic = '';
        try {
          if (item.inventory_id) {
            const inventory = await ctx.db.get(item.inventory_id);
            if (inventory) {
              itemName = inventory.name || 'Unknown Item';
              itemNameArabic = inventory.name_arabic || '';
            }
          }
        } catch (error) {
          console.warn('Failed to fetch inventory for item:', item._id);
        }
        
        // Ensure unit field is properly handled
        const unit = item.unit !== undefined ? item.unit : '';
        
        return {
          _id: item._id,
          _creationTime: item._creationTime,
          quotation_id: item.quotation_id,
          inventory_id: item.inventory_id,
          item_name: itemName,
          item_name_arabic: itemNameArabic,
          quantity: item.quantity,
          unit: unit, // Properly handle unit field
          unit_price: item.unit_price,
          total_price: item.total_price,
          notes: item.notes,
          discount_percentage: item.discount_percentage,
          purchase_price: item.purchase_price,
          markup_amount: item.markup_amount,
          wbs_code: item.wbs_code,
          item_title: item.item_title,
          is_section_header: item.is_section_header,
          created_at: item.created_at,
        };
      })
    );
    
    console.log('Processed items with units:', processedItems.map(item => ({ id: item._id, unit: item.unit })));
    return processedItems;
  },
});

// Organization Terms & Conditions Management
export const getOrganizationTerms = query({
  args: { organization_id: v.id("organizations") },
  returns: v.union(v.object({
    _id: v.id("organization_terms"),
    organization_id: v.id("organizations"),
    terms_conditions: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
    _creationTime: v.optional(v.number()),
  }), v.null()),
  handler: async (ctx, args) => {
    const terms = await ctx.db
      .query("organization_terms")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .first();
    
    return terms;
  },
});

export const saveOrganizationTerms = mutation({
  args: {
    organization_id: v.id("organizations"),
    terms_conditions: v.string(),
  },
  returns: v.id("organization_terms"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Check if terms already exist for this organization
    const existingTerms = await ctx.db
      .query("organization_terms")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .first();
    
    if (existingTerms) {
      // Update existing terms
      await ctx.db.patch(existingTerms._id, {
        terms_conditions: args.terms_conditions,
        updated_at: now,
      });
      return existingTerms._id;
    } else {
      // Create new terms
      return await ctx.db.insert("organization_terms", {
        organization_id: args.organization_id,
        terms_conditions: args.terms_conditions,
        created_at: now,
        updated_at: now,
      });
    }
  },
});

// Enhanced quotation item creation with new fields
export const createQuotationItemEnhanced = mutation({
  args: {
    quotation_id: v.id("quotations"),
    inventory_id: v.optional(v.id("inventory")),
    inventory_name: v.optional(v.string()),
    quantity: v.number(),
    unit: v.optional(v.string()),
    unit_price: v.number(),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.number(),
    // [2025-01-11] Added - VAT amount per line item for enhanced quotation management
    vat_amount: v.optional(v.number()), // VAT amount per line item
    notes: v.optional(v.string()),
    purchase_price: v.optional(v.number()),
    markup_amount: v.optional(v.number()), // Add missing markup_amount field
    wbs_code: v.optional(v.string()),
    item_title: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
  },
  returns: v.id("quotation_items"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("quotation_items", {
      quotation_id: args.quotation_id,
      inventory_id: args.inventory_id,
      inventory_name: args.inventory_name,
      quantity: args.quantity,
      unit: args.unit,
      unit_price: args.unit_price,
      discount_percentage: args.discount_percentage,
      discount_amount: args.discount_amount,
      total_price: args.total_price,
      // [2025-01-11] Added - Include vat_amount in database insert
      vat_amount: args.vat_amount, // Include vat_amount in insert
      notes: args.notes,
      purchase_price: args.purchase_price,
      markup_amount: args.markup_amount, // Include markup_amount in insert
      wbs_code: args.wbs_code,
      item_title: args.item_title,
      is_section_header: args.is_section_header,
      created_at: now,
    });
  },
});

// [2025-01-11] Added - Missing updateQuotationItem function for editing quotation items
export const updateQuotationItem = mutation({
  args: {
    id: v.id("quotation_items"),
    inventory_id: v.optional(v.id("inventory")),
    inventory_name: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()), // Unit field for quotation items
    unit_price: v.optional(v.number()),
    discount_percentage: v.optional(v.number()),
    discount_amount: v.optional(v.number()),
    total_price: v.optional(v.number()),
    // [2025-01-11] Added - VAT amount per line item for enhanced quotation management
    vat_amount: v.optional(v.number()), // VAT amount per line item
    notes: v.optional(v.string()),
    purchase_price: v.optional(v.number()),
    markup_amount: v.optional(v.number()),
    wbs_code: v.optional(v.string()),
    item_title: v.optional(v.string()),
    is_section_header: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    try {
      const { id, ...updates } = args;
      
      // Build update object with only provided fields
      const updateData: any = {};
      
      if (updates.inventory_id !== undefined) updateData.inventory_id = updates.inventory_id;
      if (updates.inventory_name !== undefined) updateData.inventory_name = updates.inventory_name;
      if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
      if (updates.unit !== undefined) updateData.unit = updates.unit; // Explicitly handle unit field
      if (updates.unit_price !== undefined) updateData.unit_price = updates.unit_price;
      if (updates.discount_percentage !== undefined) updateData.discount_percentage = updates.discount_percentage;
      if (updates.discount_amount !== undefined) updateData.discount_amount = updates.discount_amount;
      if (updates.total_price !== undefined) updateData.total_price = updates.total_price;
      // [2025-01-11] Added - Handle vat_amount field updates
      if (updates.vat_amount !== undefined) updateData.vat_amount = updates.vat_amount;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.purchase_price !== undefined) updateData.purchase_price = updates.purchase_price;
      if (updates.markup_amount !== undefined) updateData.markup_amount = updates.markup_amount;
      if (updates.wbs_code !== undefined) updateData.wbs_code = updates.wbs_code;
      if (updates.item_title !== undefined) updateData.item_title = updates.item_title;
      if (updates.is_section_header !== undefined) updateData.is_section_header = updates.is_section_header;
      
      console.log('Updating quotation item with:', { id, updateData });
      
      await ctx.db.patch(id, updateData);
      return null;
    } catch (error) {
      console.error('Error updating quotation item:', error);
      throw error;
    }
  },
});

// [2025-01-11] Added - Simple function to test unit field updates
export const updateQuotationItemUnit = mutation({
  args: {
    id: v.id("quotation_items"),
    unit: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log('Updating quotation item unit:', { id: args.id, unit: args.unit });
    await ctx.db.patch(args.id, { unit: args.unit });
    return null;
  },
});

// [2025-01-11] Preserved - Delete quotation item function already exists at line 407
// export const deleteQuotationItem = mutation({
//   args: {
//     id: v.id("quotation_items"),
//   },
//   returns: v.null(),
//   handler: async (ctx, args) => {
//     await ctx.db.delete(args.id);
//     return null;
//   },
// });

// Bulk import quotation items
export const importQuotationItems = mutation({
  args: {
    quotation_id: v.id("quotations"),
    items: v.array(v.object({
      inventory_name: v.string(),
      quantity: v.number(),
      unit_price: v.number(),
      discount_percentage: v.optional(v.number()),
      notes: v.optional(v.string()),
      purchase_price: v.optional(v.number()),
      markup_amount: v.optional(v.number()),
      wbs_code: v.optional(v.string()),
      item_title: v.optional(v.string()),
      is_section_header: v.optional(v.boolean()),
    })),
  },
  returns: v.array(v.id("quotation_items")),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const createdItems: any[] = [];
    
    for (const item of args.items) {
      // Find or create inventory item
      let inventoryId: any;
      const existingInventory = await ctx.db
        .query("inventory")
        .filter((q) => q.eq(q.field("name"), item.inventory_name))
        .first();
      
      if (existingInventory) {
        inventoryId = existingInventory._id;
      } else {
        // Create new inventory item
        inventoryId = await ctx.db.insert("inventory", {
          name: item.inventory_name,
          sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          category: 'General Item',
          unit: 'pcs',
          cost_price: item.purchase_price || 0,
          current_price: item.unit_price,
          quantity_in_stock: 0,
          currency: 'SAR',
          is_active: true,
          created_at: now,
          updated_at: now,
          organization_id: (await ctx.db.get(args.quotation_id))?.organization_id!,
        });
        await ctx.db.patch(inventoryId, {
          qr_code: `smart-erp://inventory/${inventoryId}`,
          qr_generated_at: now,
        });
      }
      
      // Calculate discount amount
      const discountAmount = item.discount_percentage 
        ? (item.unit_price * item.quantity * item.discount_percentage) / 100 
        : 0;
      
      // Calculate total price
      const totalPrice = (item.unit_price * item.quantity) - discountAmount;
      
      // Create quotation item
      const itemId = await ctx.db.insert("quotation_items", {
        quotation_id: args.quotation_id,
        inventory_id: inventoryId,
        inventory_name: item.inventory_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        discount_amount: discountAmount,
        total_price: totalPrice,
        notes: item.notes,
        purchase_price: item.purchase_price,
        markup_amount: item.markup_amount,
        wbs_code: item.wbs_code,
        item_title: item.item_title,
        is_section_header: item.is_section_header,
        created_at: now,
      });
      
      createdItems.push(itemId);
    }
    
    return createdItems;
  },
});

// Export quotation items to CSV format
export const exportQuotationItems = query({
  args: { quotation_id: v.id("quotations") },
  returns: v.object({
    quotation_number: v.string(),
    customer_name: v.string(),
    items: v.array(v.object({
      inventory_name: v.string(),
      quantity: v.number(),
      unit_price: v.number(),
      discount_percentage: v.optional(v.number()),
      total_price: v.number(),
      notes: v.optional(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const quotation = await ctx.db.get(args.quotation_id);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    const customer = await ctx.db.get(quotation.customer_id);
    const customerName = customer?.customer_company_name || 'Unknown Customer';
    
    const items = await ctx.db
      .query("quotation_items")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
      .collect();
    
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const inventory = await ctx.db.get(item.inventory_id);
        return {
          inventory_name: inventory?.name || item.inventory_name || 'Unknown Item',
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percentage: item.discount_percentage,
          total_price: item.total_price,
          notes: item.notes,
        };
      })
    );
    
    return {
      quotation_number: quotation.quotation_number,
      customer_name: customerName,
      items: itemsWithDetails,
    };
  },
});

// [2025-01-11] NEW - Working PDF function with unique name to avoid conflicts
export const getQuotationItemsForPDFWorking = action({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    console.log('NEW PDF function: Getting items for quotation:', args.quotation_id);
    
    // Use the working getQuotationItems query
    const items = await ctx.runQuery(api.quotations.getQuotationItems, {
      quotation_id: args.quotation_id
    });
    
    console.log('NEW PDF function: Successfully retrieved', items.length, 'items with units:', 
      items.map((item: any) => ({ id: item._id, unit: item.unit })));
    
    return items;
  },
});

// [2025-01-11] WORKING - Simple action wrapper for PDF generation that uses working query
export const getQuotationItemsForPDFFixed = action({
  args: { quotation_id: v.id("quotations") },
  returns: v.any(),
  handler: async (ctx, args): Promise<any> => {
    try {
      console.log('FIXED PDF function: Using working getQuotationItems query');
      
      // Call the working query function
      const items = await ctx.runQuery(api.quotations.getQuotationItems, {
        quotation_id: args.quotation_id
      });
      
      console.log('FIXED PDF function: Retrieved', items.length, 'items successfully');
      console.log('FIXED PDF function: Units found:', items.map((item: any) => ({ 
        id: item._id, 
        name: item.inventory_name, 
        unit: item.unit 
      })));
      
      return items;
    } catch (error) {
      console.error('FIXED PDF function error:', error);
      throw new Error(`Failed to get quotation items: ${error}`);
    }
  },
});
