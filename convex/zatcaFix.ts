import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Simple function to fix ZATCA compliance for existing invoices
export const fixZATCACompliance = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    updated_invoices: v.number(),
    updated_items: v.number(),
  }),
  handler: async (ctx) => {
    console.log('🔄 Starting ZATCA compliance fix...');
    
    // Get all existing invoices
    const invoices = await ctx.db.query("invoices").collect();
    console.log(`📋 Found ${invoices.length} invoices to fix`);
    
    let updatedInvoices = 0;
    let updatedItems = 0;
    
    // Fix each invoice
    for (const invoice of invoices) {
      const updates: any = {
        updated_at: new Date().toISOString(),
      };
      
      let needsUpdate = false;
      
      // Add missing Arabic fields
      if (!invoice.customer_name_arabic) {
        updates.customer_name_arabic = invoice.customer_name || "Customer";
        needsUpdate = true;
      }
      
      if (!invoice.customer_address_arabic) {
        updates.customer_address_arabic = invoice.customer_address || "Address";
        needsUpdate = true;
      }
      
      if (!invoice.supply_date) {
        updates.supply_date = invoice.invoice_date;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await ctx.db.patch(invoice._id, updates);
        updatedInvoices++;
        console.log(`✅ Fixed invoice ${invoice.invoice_number}`);
      }
    }
    
    // Fix all invoice items
    const invoiceItems = await ctx.db.query("invoice_items").collect();
    console.log(`📋 Found ${invoiceItems.length} invoice items to fix`);
    
    for (const item of invoiceItems) {
      if (!item.description_arabic) {
        await ctx.db.patch(item._id, {
          description_arabic: item.description || "Item Description"
        });
        updatedItems++;
        console.log(`✅ Fixed invoice item ${item.item_number}`);
      }
    }
    
    console.log(`🎉 ZATCA compliance fix completed!`);
    console.log(`Updated ${updatedInvoices} invoices and ${updatedItems} invoice items`);
    
    return {
      success: true,
      message: `Successfully fixed ZATCA compliance for ${updatedInvoices} invoices and ${updatedItems} invoice items`,
      updated_invoices: updatedInvoices,
      updated_items: updatedItems,
    };
  },
});
