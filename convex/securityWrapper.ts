import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Secure wrapper for creating records with permission validation
 */
export const secureCreate = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    model_name: v.string(),
    data: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    record_id: v.optional(v.id("organizations")), // This will be dynamic based on model
  }),
  handler: async (ctx, args): Promise<{ success: boolean; message: string; record_id?: any }> => {
    // Validate user permissions first
    const permissionCheck = await ctx.runMutation(api.permissions.validateUserPermissions, {
      user_id: args.user_id,
      organization_id: args.organization_id,
      model_name: args.model_name,
      action: "create",
    });

    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: "Insufficient permissions to create this record",
      };
    }

    try {
      let recordId: any;

      // Route to appropriate creation function based on model name
      switch (args.model_name) {
        case "customers":
          recordId = await ctx.runMutation(api.customers.createCustomer, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "suppliers":
          recordId = await ctx.runMutation(api.suppliers.createSupplier, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "quotations":
          recordId = await ctx.runMutation(api.quotations.createQuotation, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "purchase_orders":
          recordId = await ctx.runMutation(api.purchaseOrders.createPurchaseOrder, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "invoices":
          recordId = await ctx.runMutation(api.invoiceManagement.createInvoice, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "delivery_notes":
          recordId = await ctx.runMutation(api.deliveryNotes.createDeliveryNote, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "inventory":
          recordId = await ctx.runMutation(api.inventory.createInventoryItem, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "leads":
          recordId = await ctx.runMutation(api.leads.createLead, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "partners":
          recordId = await ctx.runMutation(api.partners.createPartner, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        case "company_expenses":
          recordId = await ctx.runMutation(api.companyExpenses.createExpense, {
            ...args.data,
            organization_id: args.organization_id,
            created_by: args.user_id,
          });
          break;

        default:
          return {
            success: false,
            message: `Unsupported model: ${args.model_name}`,
          };
      }

      return {
        success: true,
        message: `${args.model_name} created successfully`,
        record_id: recordId,
      };

    } catch (error: any) {
      console.error(`Error creating ${args.model_name}:`, error);
      return {
        success: false,
        message: `Failed to create ${args.model_name}: ${error.message}`,
      };
    }
  },
});

/**
 * Secure wrapper for updating records with permission validation
 */
export const secureUpdate = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    model_name: v.string(),
    record_id: v.any(),
    data: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    // Validate user permissions first
    const permissionCheck = await ctx.runMutation(api.permissions.validateUserPermissions, {
      user_id: args.user_id,
      organization_id: args.organization_id,
      model_name: args.model_name,
      action: "update",
    });

    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: "Insufficient permissions to update this record",
      };
    }

    try {
      // Route to appropriate update function based on model name
      switch (args.model_name) {
        case "customers":
          await ctx.runMutation(api.customers.updateCustomer, {
            customer_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "suppliers":
          await ctx.runMutation(api.suppliers.updateSupplier, {
            supplier_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "quotations":
          await ctx.runMutation(api.quotations.updateQuotation, {
            quotation_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "purchase_orders":
          await ctx.runMutation(api.purchaseOrders.updatePurchaseOrder, {
            purchase_order_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "invoices":
          await ctx.runMutation(api.invoiceManagement.updateInvoice, {
            invoice_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "delivery_notes":
          await ctx.runMutation(api.deliveryNotes.updateDeliveryNote, {
            delivery_note_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "inventory":
          await ctx.runMutation(api.inventory.updateInventoryItem, {
            item_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "leads":
          await ctx.runMutation(api.leads.updateLead, {
            lead_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "partners":
          await ctx.runMutation(api.partners.updatePartner, {
            partner_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        case "company_expenses":
          await ctx.runMutation(api.companyExpenses.updateExpense, {
            expense_id: args.record_id,
            ...args.data,
            updated_by: args.user_id,
          });
          break;

        default:
          return {
            success: false,
            message: `Unsupported model: ${args.model_name}`,
          };
      }

      return {
        success: true,
        message: `${args.model_name} updated successfully`,
      };

    } catch (error: any) {
      console.error(`Error updating ${args.model_name}:`, error);
      return {
        success: false,
        message: `Failed to update ${args.model_name}: ${error.message}`,
      };
    }
  },
});

/**
 * Secure wrapper for deleting records with permission validation
 */
export const secureDelete = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    model_name: v.string(),
    record_id: v.any(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; message: string }> => {
    // Validate user permissions first
    const permissionCheck = await ctx.runMutation(api.permissions.validateUserPermissions, {
      user_id: args.user_id,
      organization_id: args.organization_id,
      model_name: args.model_name,
      action: "delete",
    });

    if (!permissionCheck.hasPermission) {
      return {
        success: false,
        message: "Insufficient permissions to delete this record",
      };
    }

    try {
      // Route to appropriate delete function based on model name
      switch (args.model_name) {
        case "customers":
          await ctx.runMutation(api.customers.deleteCustomer, {
            customer_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "suppliers":
          await ctx.runMutation(api.suppliers.deleteSupplier, {
            supplier_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "quotations":
          await ctx.runMutation(api.quotations.deleteQuotation, {
            quotation_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "purchase_orders":
          await ctx.runMutation(api.purchaseOrders.deletePurchaseOrder, {
            purchase_order_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "invoices":
          await ctx.runMutation(api.invoiceManagement.deleteInvoice, {
            invoice_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "delivery_notes":
          await ctx.runMutation(api.deliveryNotes.deleteDeliveryNote, {
            delivery_note_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "inventory":
          await ctx.runMutation(api.inventory.deleteInventoryItem, {
            item_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "leads":
          await ctx.runMutation(api.leads.deleteLead, {
            lead_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "partners":
          await ctx.runMutation(api.partners.deletePartner, {
            partner_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        case "company_expenses":
          await ctx.runMutation(api.companyExpenses.deleteExpense, {
            expense_id: args.record_id,
            deleted_by: args.user_id,
          });
          break;

        default:
          return {
            success: false,
            message: `Unsupported model: ${args.model_name}`,
          };
      }

      return {
        success: true,
        message: `${args.model_name} deleted successfully`,
      };

    } catch (error: any) {
      console.error(`Error deleting ${args.model_name}:`, error);
      return {
        success: false,
        message: `Failed to delete ${args.model_name}: ${error.message}`,
      };
    }
  },
});