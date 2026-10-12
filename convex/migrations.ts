import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Migration to update existing leads with lead numbers
export const migrateExistingLeads = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all existing leads without lead numbers
    const existingLeads = await ctx.db
      .query("leads")
      .filter((q) => q.eq(q.field("lead_number"), undefined))
      .collect();

    for (const lead of existingLeads) {
      // Generate lead number for each existing lead
      const leadNumber = await ctx.runMutation(api.reminders.generateLeadNumber, {
        organization_id: lead.organization_id,
      });

      // Update the lead with the new fields
      await ctx.db.patch(lead._id, {
        lead_number: leadNumber,
        reminder_scheduled: false,
        reminder_date: undefined,
        closure_type: undefined,
        quotation_id: undefined,
      });
    }

    return null;
  },
});

// Fix inventory schema validation error
export const fixInventorySchema = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all inventory items with supplier_name field
    const inventoryItems = await ctx.db
      .query("inventory")
      .collect();

    for (const item of inventoryItems) {
      // Remove supplier_name field if it exists
      if ('supplier_name' in item) {
        const { supplier_name, ...cleanItem } = item;
        await ctx.db.replace(item._id, cleanItem);
      }
    }

    return null;
  },
});

// Fix rate limiting schema validation error
export const fixRateLimitingSchema = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all rate limit attempts that might have the wrong field name
    const rateLimitAttempts = await ctx.db
      .query("rate_limit_attempts")
      .collect();

    for (const attempt of rateLimitAttempts) {
      // Check if the record has userAgent instead of user_agent
      if ('userAgent' in attempt && !('user_agent' in attempt)) {
        // Create new record with correct field name
        await ctx.db.insert("rate_limit_attempts", {
          ip: attempt.ip,
          action: attempt.action,
          user_agent: (attempt.userAgent as string) || "unknown",
          timestamp: attempt.timestamp,
        });
        
        // Delete the old record
        await ctx.db.delete(attempt._id);
      }
    }

    return null;
  },
});

// Migration to add estimated_value field to existing leads
export const addEstimatedValueToLeads = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log('🚀 Starting migration: addEstimatedValueToLeads');
    
    // Get all existing leads
    const existingLeads = await ctx.db
      .query("leads")
      .collect();

    console.log(`📊 Found ${existingLeads.length} leads to process`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const lead of existingLeads) {
      try {
        // If lead doesn't have estimated_value field, add it
        if (!('estimated_value' in lead)) {
          await ctx.db.patch(lead._id, {
            estimated_value: lead.total_amount || lead.value || 0,
          });
          updatedCount++;
          console.log(`📝 Added estimated_value field to lead ${lead.lead_number}`);
        }
      } catch (error) {
        errorCount++;
        console.warn(`❌ Failed to process lead ${lead._id}:`, error);
      }
    }

    console.log(`🎉 Migration completed: ${updatedCount} leads updated, ${errorCount} errors`);
    return null;
  },
});

// Migration to add customer_name field to existing leads
export const addCustomerNameToLeads = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    console.log('🚀 Starting migration: addCustomerNameToLeads');
    
    // Get all existing leads
    const existingLeads = await ctx.db
      .query("leads")
      .collect();

    console.log(`📊 Found ${existingLeads.length} leads to process`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const lead of existingLeads) {
      try {
        // If lead has customer_id but no customer_name, fetch customer name
        if (lead.customer_id && !lead.customer_name) {
          const customer = await ctx.db.get(lead.customer_id);
          if (customer) {
            const customerName = customer.customer_company_name || (customer as any).name || 'Unknown Customer';
            await ctx.db.patch(lead._id, {
              customer_name: customerName,
            });
            updatedCount++;
            console.log(`✅ Updated lead ${lead.lead_number} with customer name: ${customerName}`);
          }
        }
        // If lead doesn't have customer_name field at all, add it as undefined
        else if (!('customer_name' in lead)) {
          await ctx.db.patch(lead._id, {
            customer_name: undefined,
          });
          console.log(`📝 Added customer_name field to lead ${lead.lead_number}`);
        }
      } catch (error) {
        errorCount++;
        console.warn(`❌ Failed to process lead ${lead._id}:`, error);
      }
    }

    console.log(`🎉 Migration completed: ${updatedCount} leads updated, ${errorCount} errors`);
    return null;
  },
});

export const createSuperAdminInProduction = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Create a new super admin account in production
    const superAdminId = await ctx.db.insert("user_profiles", {
      email: "ksa.amk2008@gmail.com",
      name: "Abdul Majeed Khan",
      given_name: "Abdul Majeed",
      family_name: "Khan",
      google_id: "104850560179954643368",
      email_verified: true,
      role: "super_admin",
      permissions: ["read", "write", "delete", "admin", "super_admin"],
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      picture: "https://lh3.googleusercontent.com/a/ACg8ocKtR5i9yVwJgjbLCP21C3Fp3q7p_kNw8D7XV1pFGiWgbtX56g=s96-c"
    });
    
    // Also create an organization if none exists
    const organizations = await ctx.db.query("organizations").collect();
    let orgId;
    
    if (organizations.length === 0) {
      orgId = await ctx.db.insert("organizations", {
        name: "Trading ERP Company",
        slug: "trading-erp-company",
        email: "admin@tradingerp.com",
        phone: "+1234567890",
        address: "123 Business St, City",
        website: "https://tradingerp.com",
        currency: "USD",
        vat_number: "VAT123456",
        vat_rate: "15.00",
        timezone: "UTC",
        language: "en",
        profit_sharing_enabled: false,
        profit_sharing_percentage: "0.00",
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      orgId = organizations[0]._id;
    }
    
    // Update the super admin with organization access
    await ctx.db.patch(superAdminId, {
      organization_id: orgId
    });
    
    return `Super admin created! ID: ${String(superAdminId)}, Organization ID: ${String(orgId)}`;
  },
});

export const fixOrganizationIdsAfterImport = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    // Get the target organization ID (Rawabi Trading)
    const organizations = await ctx.db.query("organizations").collect();
    if (organizations.length === 0) {
      throw new Error("No organization found");
    }
    
    // Find the Rawabi Trading organization
    const rawabiOrg = organizations.find(org => org.name && org.name.includes("Rawabi"));
    if (!rawabiOrg) {
      throw new Error("Rawabi Trading organization not found");
    }
    
    const targetOrgId = rawabiOrg._id;
    console.log(`Target organization ID: ${String(targetOrgId)}`);
    
    // Update all customers to use the correct organization
    const customers = await ctx.db.query("customers").collect();
    let customerUpdateCount = 0;
    
    for (const customer of customers) {
      await ctx.db.patch(customer._id, { organization_id: targetOrgId });
      customerUpdateCount++;
    }
    
    // Update all quotations
    const quotations = await ctx.db.query("quotations").collect();
    let quotationUpdateCount = 0;
    
    for (const quotation of quotations) {
      await ctx.db.patch(quotation._id, { organization_id: targetOrgId });
      quotationUpdateCount++;
    }
    
    // Update all inventory
    const inventory = await ctx.db.query("inventory").collect();
    let inventoryUpdateCount = 0;
    
    for (const item of inventory) {
      await ctx.db.patch(item._id, { organization_id: targetOrgId });
      inventoryUpdateCount++;
    }
    
    // Update all leads
    const leads = await ctx.db.query("leads").collect();
    let leadUpdateCount = 0;
    
    for (const lead of leads) {
      await ctx.db.patch(lead._id, { organization_id: targetOrgId });
      leadUpdateCount++;
    }
    
    // Update all suppliers
    const suppliers = await ctx.db.query("suppliers").collect();
    let supplierUpdateCount = 0;
    
    for (const supplier of suppliers) {
      await ctx.db.patch(supplier._id, { organization_id: targetOrgId });
      supplierUpdateCount++;
    }
    
    // Update all delivery notes
    const deliveryNotes = await ctx.db.query("delivery_notes").collect();
    let deliveryNoteUpdateCount = 0;
    
    for (const deliveryNote of deliveryNotes) {
      await ctx.db.patch(deliveryNote._id, { organization_id: targetOrgId });
      deliveryNoteUpdateCount++;
    }
    
    return `Organization IDs fixed! Updated: ${customerUpdateCount} customers, ${quotationUpdateCount} quotations, ${inventoryUpdateCount} inventory items, ${leadUpdateCount} leads, ${supplierUpdateCount} suppliers, ${deliveryNoteUpdateCount} delivery notes to use organization ID: ${String(targetOrgId)}`;
  },
});

// Migration to add detailed address fields to existing records
export const addDetailedAddressFields = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    console.log('🚀 Starting migration: addDetailedAddressFields');
    
    // Since the new address fields are optional, no data migration is needed
    // The schema update will automatically handle the new fields
    // This migration serves as a verification that the schema changes are applied
    
    // Count existing records for verification
    const organizations = await ctx.db.query("organizations").collect();
    const customers = await ctx.db.query("customers").collect();
    const suppliers = await ctx.db.query("suppliers").collect();
    const deliveryNotes = await ctx.db.query("delivery_notes").collect();
    
    console.log(`📊 Schema verification complete:`);
    console.log(`   - Organizations: ${organizations.length}`);
    console.log(`   - Customers: ${customers.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Delivery Notes: ${deliveryNotes.length}`);
    
    return `Detailed address fields migration completed successfully! Schema updated for ${organizations.length} organizations, ${customers.length} customers, ${suppliers.length} suppliers, and ${deliveryNotes.length} delivery notes. New address fields are now available as optional fields.`;
  },
});

// Migration to create print_templates table and verify schema
export const createPrintTemplatesTable = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    console.log('🚀 Starting migration: createPrintTemplatesTable');
    
    try {
      // Try to query the print_templates table to see if it exists
      const templates = await ctx.db.query("print_templates").collect();
      console.log(`📊 Print templates table exists with ${templates.length} records`);
      
      return `Print templates table verification completed! Table exists with ${templates.length} records.`;
    } catch (error) {
      console.error('❌ Print templates table does not exist:', error);
      return `Print templates table does not exist. Error: ${(error as Error).message}`;
    }
  },
});

// Migration to add header/footer image fields to existing print templates
export const updatePrintTemplatesWithHeaderFooterFields = mutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    templatesUpdated: v.number(),
    message: v.string(),
  }),
  handler: async (ctx) => {
    console.log('🚀 Starting migration: updatePrintTemplatesWithHeaderFooterFields');
    
    try {
      // Get all existing print templates
      const allTemplates = await ctx.db
        .query("print_templates")
        .collect();

      let updatedCount = 0;

      for (const template of allTemplates) {
        let needsUpdate = false;
        const updates: any = {};

        // Check if header_config needs updating
        if (template.header_config && 
            (template.header_config as any).company_header_image === undefined) {
          updates.header_config = {
            ...template.header_config,
            company_header_image: false,
            company_footer_image: false,
          };
          needsUpdate = true;
        }

        // Check if footer_config needs updating
        if (template.footer_config && 
            (template.footer_config as any).company_header_image === undefined) {
          updates.footer_config = {
            ...template.footer_config,
            company_header_image: false,
            company_footer_image: false,
          };
          needsUpdate = true;
        }

        // Update template if needed
        if (needsUpdate) {
          updates.updated_at = new Date().toISOString();
          await ctx.db.patch(template._id, updates);
          updatedCount++;
          console.log(`✅ Updated template: ${template.name}`);
        }
      }

      const message = `Successfully updated ${updatedCount} print templates with header/footer image fields`;
      console.log(`🎉 Migration complete: ${message}`);

      return {
        success: true,
        templatesUpdated: updatedCount,
        message,
      };
    } catch (error) {
      console.error("❌ Migration error:", error);
      return {
        success: false,
        templatesUpdated: 0,
        message: `Migration failed: ${error}`,
      };
    }
  },
});
