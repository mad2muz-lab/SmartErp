import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const deliveryNoteReturn = v.object({
  _id: v.id("delivery_notes"),
  _creationTime: v.number(),
  delivery_note_number: v.string(),
  quotation_id: v.optional(v.id("quotations")),
  quotation_number: v.optional(v.string()),
  customer_id: v.id("customers"),
  customer_name: v.optional(v.string()),
  customer_name_arabic: v.optional(v.string()),
  organization_id: v.id("organizations"),
  issue_date: v.string(),
  delivery_date: v.string(),
  delivery_address: v.string(),
  delivery_address_arabic: v.optional(v.string()),
  // Detailed delivery address fields for precise delivery location
  delivery_building_number: v.optional(v.string()),
  delivery_street: v.optional(v.string()),
  delivery_additional_number: v.optional(v.string()),
  delivery_district: v.optional(v.string()),
  delivery_city: v.optional(v.string()),
  delivery_state_province: v.optional(v.string()),
  delivery_zip_postal_code: v.optional(v.string()),
  delivery_country: v.optional(v.string()),
  received_by: v.optional(v.string()),
  received_by_signature: v.optional(v.string()),
  status: v.string(),
  notes: v.optional(v.string()),
  template_id: v.optional(v.id("print_templates")),
  created_by: v.optional(v.string()),
  created_at: v.string(),
  updated_at: v.string(),
});

const deliveryNoteItemReturn = v.object({
  _id: v.id("delivery_note_items"),
  _creationTime: v.number(),
  delivery_note_id: v.id("delivery_notes"),
  inventory_id: v.id("inventory"),
  inventory_name: v.optional(v.string()),
  inventory_name_arabic: v.optional(v.string()),
  quantity: v.number(),
  unit: v.optional(v.string()),
  delivered_quantity: v.optional(v.number()),
  notes: v.optional(v.string()),
  created_at: v.string(),
});

// Generate unique delivery note number using timestamp approach - COMPLETELY NEW FUNCTION NAME TO AVOID CACHE
const generateUniqueDeliveryNoteNumber = async (ctx: any, organizationId: Id<"organizations">) => {
  const year = new Date().getFullYear();
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // COMPLETELY NEW APPROACH - NO DATABASE QUERIES AT ALL - SIMPLE TIMESTAMP - NO STRING OPERATIONS
  return `DN-${year}-${timestamp}${randomSuffix}`;
};

// List all delivery notes for an organization
export const listDeliveryNotes = query({
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
        .query("delivery_notes")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .order("desc")
        .collect();

    // Fetch customer names for all delivery notes
    const deliveryNotesWithCustomers = await Promise.all(
      docs.map(async (d) => {
        let customerName = 'Unknown Customer';
        try {
          const customer = await ctx.db.get(d.customer_id);
          if (customer) {
            customerName = customer.customer_company_name || customer.customer_company_name || 'Unknown Customer';
          }
        } catch (error) {
          console.warn('Failed to fetch customer:', error);
        }

        return {
          _id: d._id,
          _creationTime: d._creationTime,
          delivery_note_number: d.delivery_note_number,
          quotation_id: d.quotation_id,
          quotation_number: d.quotation_number,
          customer_id: d.customer_id,
          customer_name: customerName,
          organization_id: d.organization_id,
          issue_date: d.issue_date,
          delivery_date: d.delivery_date,
          delivery_address: d.delivery_address,
          delivery_address_arabic: d.delivery_address_arabic,
          // Detailed delivery address fields
          delivery_building_number: d.delivery_building_number,
          delivery_street: d.delivery_street,
          delivery_additional_number: d.delivery_additional_number,
          delivery_district: d.delivery_district,
          delivery_city: d.delivery_city,
          delivery_state_province: d.delivery_state_province,
          delivery_zip_postal_code: d.delivery_zip_postal_code,
          delivery_country: d.delivery_country,
          received_by: d.received_by,
          received_by_signature: d.received_by_signature,
          status: d.status,
          notes: d.notes,
          created_by: d.created_by,
          created_at: d.created_at,
          updated_at: d.updated_at,
        };
      })
    );

      return deliveryNotesWithCustomers;
    } catch (err) {
      console.warn("listDeliveryNotes fallback:", err);
      return [];
    }
  },
});

// Get a single delivery note by ID
export const getDeliveryNote = query({
  args: { id: v.id("delivery_notes") },
  returns: v.union(deliveryNoteReturn, v.null()),
  handler: async (ctx, args) => {
    const d = await ctx.db.get(args.id);
    if (!d) return null;

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
      delivery_note_number: d.delivery_note_number,
      quotation_id: d.quotation_id,
      customer_id: d.customer_id,
      customer_name: customerName,
      organization_id: d.organization_id,
      issue_date: d.issue_date,
      delivery_date: d.delivery_date,
      delivery_address: d.delivery_address,
      delivery_address_arabic: d.delivery_address_arabic,
      received_by: d.received_by,
      received_by_signature: d.received_by_signature,
      status: d.status,
      notes: d.notes,
      created_by: d.created_by,
      created_at: d.created_at,
      updated_at: d.updated_at,
    };
  },
});

// Get delivery note items
export const getDeliveryNoteItems = query({
  args: { delivery_note_id: v.id("delivery_notes") },
  returns: v.array(deliveryNoteItemReturn),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("delivery_note_items")
      .withIndex("by_delivery_note", (q) => q.eq("delivery_note_id", args.delivery_note_id))
      .collect();

    // Fetch inventory names for all items
    const itemsWithInventory = await Promise.all(
      items.map(async (item) => {
        let inventoryName = 'Unknown Item';
        let inventoryNameArabic = '';
        try {
          const inventory = await ctx.db.get(item.inventory_id);
          if (inventory) {
            inventoryName = inventory.name || 'Unknown Item';
            inventoryNameArabic = inventory.name_arabic || '';
          }
        } catch (error) {
          console.warn('Failed to fetch inventory:', error);
        }

        return {
          _id: item._id,
          _creationTime: item._creationTime,
          delivery_note_id: item.delivery_note_id,
          inventory_id: item.inventory_id,
          inventory_name: inventoryName,
          inventory_name_arabic: inventoryNameArabic,
          quantity: item.quantity,
          unit: item.unit,
          delivered_quantity: item.delivered_quantity,
          notes: item.notes,
          created_at: item.created_at,
        };
      })
    );

    return itemsWithInventory;
  },
});

// Create a new delivery note
export const createDeliveryNote = mutation({
  args: {
    quotation_id: v.optional(v.id("quotations")),
    customer_id: v.id("customers"),
    organization_id: v.id("organizations"),
    issue_date: v.string(),
    delivery_date: v.string(),
    delivery_address: v.string(),
    delivery_address_arabic: v.optional(v.string()),
    // Detailed delivery address fields for precise delivery location
    delivery_building_number: v.optional(v.string()),
    delivery_street: v.optional(v.string()),
    delivery_additional_number: v.optional(v.string()),
    delivery_district: v.optional(v.string()),
    delivery_city: v.optional(v.string()),
    delivery_state_province: v.optional(v.string()),
    delivery_zip_postal_code: v.optional(v.string()),
    delivery_country: v.optional(v.string()),
    received_by: v.optional(v.string()),
    received_by_signature: v.optional(v.string()),
    status: v.string(),
    notes: v.optional(v.string()),
    template_id: v.optional(v.id("print_templates")), // Assigned print template
    created_by: v.optional(v.string()),
  },
  returns: v.id("delivery_notes"),
  handler: async (ctx, args) => {
    const deliveryNoteNumber = await generateUniqueDeliveryNoteNumber(ctx, args.organization_id);
    if (typeof deliveryNoteNumber !== 'string' || deliveryNoteNumber.length < 10) {
      throw new Error(`Invalid delivery note number generated: ${deliveryNoteNumber}`);
    }
    const now = new Date().toISOString();

    return await ctx.db.insert("delivery_notes", {
      delivery_note_number: deliveryNoteNumber,
      quotation_id: args.quotation_id,
      customer_id: args.customer_id,
      organization_id: args.organization_id,
      issue_date: args.issue_date,
      delivery_date: args.delivery_date,
      delivery_address: args.delivery_address,
      delivery_address_arabic: args.delivery_address_arabic,
      // Detailed delivery address fields
      delivery_building_number: args.delivery_building_number,
      delivery_street: args.delivery_street,
      delivery_additional_number: args.delivery_additional_number,
      delivery_district: args.delivery_district,
      delivery_city: args.delivery_city,
      delivery_state_province: args.delivery_state_province,
      delivery_zip_postal_code: args.delivery_zip_postal_code,
      delivery_country: args.delivery_country,
      received_by: args.received_by,
      received_by_signature: args.received_by_signature,
      status: args.status,
      notes: args.notes,
      template_id: args.template_id, // Assigned print template
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

// Create delivery note from quotation
export const createDeliveryNoteFromQuotation = mutation({
  args: {
    quotation_id: v.id("quotations"),
    delivery_date: v.string(),
    delivery_address: v.string(),
    delivery_address_arabic: v.optional(v.string()),
    // Detailed delivery address fields for precise delivery location
    delivery_building_number: v.optional(v.string()),
    delivery_street: v.optional(v.string()),
    delivery_additional_number: v.optional(v.string()),
    delivery_district: v.optional(v.string()),
    delivery_city: v.optional(v.string()),
    delivery_state_province: v.optional(v.string()),
    delivery_zip_postal_code: v.optional(v.string()),
    delivery_country: v.optional(v.string()),
    received_by: v.optional(v.string()),
    received_by_signature: v.optional(v.string()),
    notes: v.optional(v.string()),
    template_id: v.optional(v.id("print_templates")), // Assigned print template
    created_by: v.optional(v.string()),
    status: v.optional(v.string()),
    // [2025-01-11] Added - Delivery items with specific quantities for partial delivery
    delivery_items: v.optional(v.array(v.object({
      quotation_item_id: v.id("quotation_items"),
      quantity_to_deliver: v.number(),
    }))),
  },
  returns: v.id("delivery_notes"),
  handler: async (ctx, args) => {
    // Get quotation details
    const quotation = await ctx.db.get(args.quotation_id);
    if (!quotation) {
      throw new Error("Quotation not found");
    }

    // Get customer details for delivery address
    const customer = await ctx.db.get(quotation.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    const deliveryNoteNumber = await generateUniqueDeliveryNoteNumber(ctx, quotation.organization_id);
    if (typeof deliveryNoteNumber !== 'string' || deliveryNoteNumber.length < 10) {
      throw new Error(`Invalid delivery note number generated: ${deliveryNoteNumber}`);
    }
    const now = new Date().toISOString();

    // Create delivery note
    const deliveryNoteId = await ctx.db.insert("delivery_notes", {
      delivery_note_number: deliveryNoteNumber,
      quotation_id: args.quotation_id,
      quotation_number: quotation.quotation_number, // Store quotation number for display
      customer_id: quotation.customer_id,
      organization_id: quotation.organization_id,
      issue_date: now.split('T')[0], // Today's date
      delivery_date: args.delivery_date,
      delivery_address: args.delivery_address || customer.address || '',
      delivery_address_arabic: args.delivery_address_arabic || customer.address_arabic || '',
      // Detailed delivery address fields
      delivery_building_number: args.delivery_building_number,
      delivery_street: args.delivery_street,
      delivery_additional_number: args.delivery_additional_number,
      delivery_district: args.delivery_district,
      delivery_city: args.delivery_city,
      delivery_state_province: args.delivery_state_province,
      delivery_zip_postal_code: args.delivery_zip_postal_code,
      delivery_country: args.delivery_country,
      received_by: args.received_by,
      received_by_signature: args.received_by_signature,
      status: args.status || "delivered", // Default to delivered instead of draft
      notes: args.notes,
      template_id: args.template_id, // Assigned print template
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });

    // Get quotation items and create delivery note items
    const quotationItems = await ctx.db
      .query("quotation_items")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
      .collect();

    // [2025-01-11] Enhanced - Create delivery note items with partial delivery support
    console.log('DEBUG: delivery_items received:', args.delivery_items);
    if (args.delivery_items && args.delivery_items.length > 0) {
      // Use specific delivery items for partial delivery
      console.log('DEBUG: Using delivery_items for partial delivery');
      for (const deliveryItem of args.delivery_items) {
        const quotationItem = quotationItems.find(item => item._id === deliveryItem.quotation_item_id);
        console.log('DEBUG: Processing delivery item:', deliveryItem, 'Found quotation item:', quotationItem);
        if (quotationItem) {
          await ctx.db.insert("delivery_note_items", {
            delivery_note_id: deliveryNoteId,
            inventory_id: quotationItem.inventory_id,
            quantity: deliveryItem.quantity_to_deliver, // [2025-01-11] Use specific quantity to deliver
            unit: quotationItem.unit,
            delivered_quantity: deliveryItem.quantity_to_deliver, // [2025-01-11] Use specific quantity to deliver
            notes: quotationItem.notes,
            quotation_item_id: quotationItem._id,
            created_at: now,
          });
          console.log('DEBUG: Created delivery note item with quantity:', deliveryItem.quantity_to_deliver);
        }
      }
    } else {
      // Fallback to original behavior - deliver all items
      for (const item of quotationItems) {
        await ctx.db.insert("delivery_note_items", {
          delivery_note_id: deliveryNoteId,
          inventory_id: item.inventory_id,
          quantity: item.quantity,
          unit: item.unit,
          delivered_quantity: item.quantity,
          notes: item.notes,
          quotation_item_id: item._id,
          created_at: now,
        });
      }
    }

    // [2025-01-11] Enhanced - Update quotation status based on delivery progress
    // Calculate delivered quantities for each quotation item
    if (args.delivery_items && args.delivery_items.length > 0) {
      // Update quantities based on specific delivery items
      for (const deliveryItem of args.delivery_items) {
        const quotationItem = quotationItems.find(item => item._id === deliveryItem.quotation_item_id);
        if (quotationItem) {
          const deliveredQuantity = deliveryItem.quantity_to_deliver; // This delivery note's quantity
          const existingDelivered = quotationItem.delivered_quantity || 0;
          const totalDelivered = existingDelivered + deliveredQuantity;
          const remainingQuantity = quotationItem.quantity - totalDelivered;
          
          // Update quotation item with delivered and remaining quantities
          await ctx.db.patch(quotationItem._id, {
            delivered_quantity: totalDelivered,
            remaining_quantity: Math.max(0, remainingQuantity),
          });
        }
      }
    } else {
      // Fallback to original behavior - deliver all items
      for (const item of quotationItems) {
        const deliveredQuantity = item.quantity; // This delivery note's quantity
        const existingDelivered = item.delivered_quantity || 0;
        const totalDelivered = existingDelivered + deliveredQuantity;
        const remainingQuantity = item.quantity - totalDelivered;
        
        // Update quotation item with delivered and remaining quantities
        await ctx.db.patch(item._id, {
          delivered_quantity: totalDelivered,
          remaining_quantity: Math.max(0, remainingQuantity),
        });
      }
    }
    
    // Determine quotation status based on delivery progress
    const updatedQuotationItems = await ctx.db
      .query("quotation_items")
      .withIndex("by_quotation", (q) => q.eq("quotation_id", args.quotation_id))
      .collect();
    
    const allFullyDelivered = updatedQuotationItems.every(item => 
      (item.delivered_quantity || 0) >= item.quantity
    );
    const anyPartiallyDelivered = updatedQuotationItems.some(item => 
      (item.delivered_quantity || 0) > 0 && (item.delivered_quantity || 0) < item.quantity
    );
    
    let newStatus = "delivered";
    if (allFullyDelivered) {
      newStatus = "delivered";
    } else if (anyPartiallyDelivered) {
      newStatus = "partially_delivered";
    }
    
    await ctx.db.patch(args.quotation_id, {
      status: newStatus,
      updated_at: now,
    });

    return deliveryNoteId;
  },
});

// Add item to delivery note
export const addDeliveryNoteItem = mutation({
  args: {
    delivery_note_id: v.id("delivery_notes"),
    inventory_id: v.id("inventory"),
    quantity: v.number(),
    unit: v.optional(v.string()),
    delivered_quantity: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.id("delivery_note_items"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("delivery_note_items", {
      delivery_note_id: args.delivery_note_id,
      inventory_id: args.inventory_id,
      quantity: args.quantity,
      unit: args.unit,
      delivered_quantity: args.delivered_quantity || args.quantity,
      notes: args.notes,
      created_at: now,
    });
  },
});

// Update delivery note
export const updateDeliveryNote = mutation({
  args: {
    id: v.id("delivery_notes"),
    customer_id: v.optional(v.id("customers")),
    delivery_date: v.optional(v.string()),
    delivery_address: v.optional(v.string()),
    delivery_address_arabic: v.optional(v.string()),
    // Detailed delivery address fields for precise delivery location
    delivery_building_number: v.optional(v.string()),
    delivery_street: v.optional(v.string()),
    delivery_additional_number: v.optional(v.string()),
    delivery_district: v.optional(v.string()),
    delivery_city: v.optional(v.string()),
    delivery_state_province: v.optional(v.string()),
    delivery_zip_postal_code: v.optional(v.string()),
    delivery_country: v.optional(v.string()),
    received_by: v.optional(v.string()),
    received_by_signature: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
    template_id: v.optional(v.id("print_templates")), // Assigned print template
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();

    await ctx.db.patch(id, {
      ...updates,
      updated_at: now,
    });

    return null;
  },
});

// Update delivery note item
export const updateDeliveryNoteItem = mutation({
  args: {
    id: v.id("delivery_note_items"),
    quantity: v.optional(v.number()),
    delivered_quantity: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return null;
  },
});

// Delete delivery note item
export const deleteDeliveryNoteItem = mutation({
  args: { id: v.id("delivery_note_items") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return null;
  },
});

// Delete delivery note
export const deleteDeliveryNote = mutation({
  args: { id: v.id("delivery_notes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Delete all items first
    const items = await ctx.db
      .query("delivery_note_items")
      .withIndex("by_delivery_note", (q) => q.eq("delivery_note_id", args.id))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    // Delete the delivery note
    await ctx.db.delete(args.id);
    return null;
  },
});

// Clean up invalid delivery note numbers
export const cleanDeliveryNoteNumbers = mutation({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db.query("delivery_notes").collect();
    let fixedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const note of notes) {
      try {
        // Check for invalid delivery_note_number values
        const isInvalid = 
          typeof note.delivery_note_number !== 'string' || 
          !note.delivery_note_number || 
          note.delivery_note_number === 'null' ||
          note.delivery_note_number === 'undefined' ||
          note.delivery_note_number.trim() === '';

        if (isInvalid) {
          const newNumber = await generateUniqueDeliveryNoteNumber(ctx, note.organization_id);
          
          // Validate the new number before updating
          if (typeof newNumber !== 'string' || newNumber.length < 10) {
            throw new Error(`Generated invalid number: ${newNumber}`);
          }
          
          await ctx.db.patch(note._id, { delivery_note_number: newNumber });
          console.log(`Fixed delivery note ${note._id} with new number: ${newNumber}`);
          fixedCount++;
        }
      } catch (error: any) {
        errorCount++;
        const errorMsg = `Failed to fix delivery note ${note._id}: ${error.message}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    if (errorCount > 0) {
      throw new Error(`Cleanup completed with ${errorCount} errors: ${errors.join('; ')}`);
    }

    return { 
      message: `Successfully fixed ${fixedCount} delivery notes with invalid delivery_note_number`,
      fixedCount,
      errorCount: 0
    };
  },
});

// Get delivery note data for PDF generation
export const getDeliveryNoteForPDF = query({
  args: { delivery_note_id: v.id("delivery_notes") },
  returns: v.object({
    delivery_note: deliveryNoteReturn,
    items: v.array(deliveryNoteItemReturn),
    organization: v.any(),
    customer: v.any(),
  }),
  handler: async (ctx, args) => {
    const deliveryNote = await ctx.db.get(args.delivery_note_id);
    if (!deliveryNote) {
      throw new Error("Delivery note not found");
    }

    // Get items
    const items = await ctx.db
      .query("delivery_note_items")
      .withIndex("by_delivery_note", (q) => q.eq("delivery_note_id", args.delivery_note_id))
      .collect();

    // Get organization details with header/footer configuration
    const organization = await ctx.db.get(deliveryNote.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Ensure header and footer configuration are included
    const organizationWithConfig = {
      ...organization,
      header_config: organization.header_display_config || {
        logo: true,
        name: true,
        name_arabic: true,
        email: true,
        phone: true,
        address: true,
        address_arabic: true,
        website: true,
        vat_number: true,
        vat_number_arabic: true,
        cr_number: true,
        cr_number_arabic: true,
        industry: true,
      },
      footer_config: organization.footer_display_config || {
        name: true,
        name_arabic: true,
        email: true,
        phone: true,
        address_arabic: true,
        website: true,
      }
    };

    // Get customer details
    const customer = await ctx.db.get(deliveryNote.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get items with inventory details
    const itemsWithInventory = await Promise.all(
      items.map(async (item) => {
        const inventory = await ctx.db.get(item.inventory_id);
        return {
          _id: item._id,
          _creationTime: item._creationTime,
          delivery_note_id: item.delivery_note_id,
          inventory_id: item.inventory_id,
          inventory_name: inventory?.name || 'Unknown Item',
          inventory_name_arabic: inventory?.name_arabic || '',
          quantity: item.quantity,
          unit: item.unit, // [2025-01-11] Fixed - Include unit field for PDF generation
          delivered_quantity: item.delivered_quantity,
          notes: item.notes,
          created_at: item.created_at,
        };
      })
    );

    // Get delivery note with customer name
    let customerName = 'Unknown Customer';
    let customerNameArabic = '';
    if (customer) {
      customerName = customer.customer_company_name || 'Unknown Customer';
      customerNameArabic = customer.customer_company_name_arabic || '';
    }

    const deliveryNoteWithCustomer = {
      _id: deliveryNote._id,
      _creationTime: deliveryNote._creationTime,
      delivery_note_number: deliveryNote.delivery_note_number,
      quotation_id: deliveryNote.quotation_id,
      quotation_number: deliveryNote.quotation_number,
      customer_id: deliveryNote.customer_id,
      customer_name: customerName,
      customer_name_arabic: customerNameArabic,
      organization_id: deliveryNote.organization_id,
      issue_date: deliveryNote.issue_date,
      delivery_date: deliveryNote.delivery_date,
      delivery_address: deliveryNote.delivery_address,
      delivery_address_arabic: deliveryNote.delivery_address_arabic,
      received_by: deliveryNote.received_by,
      received_by_signature: deliveryNote.received_by_signature,
      status: deliveryNote.status,
      notes: deliveryNote.notes,
      created_by: deliveryNote.created_by,
      created_at: deliveryNote.created_at,
      updated_at: deliveryNote.updated_at,
    };

    return {
      delivery_note: deliveryNoteWithCustomer,
      items: itemsWithInventory,
      organization: organizationWithConfig,
      customer,
    };
  },
});
