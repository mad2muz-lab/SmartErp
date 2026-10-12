import { query } from "./_generated/server";
import { v } from "convex/values";

// Dashboard statistics query
export const getDashboardStats = query({
  args: { organization_id: v.union(v.id("organizations"), v.string()) },
  returns: v.object({
    customers: v.number(),
    leads: v.number(),
    inventory: v.number(),
    quotations: v.number(),
    revenue: v.number(),
    growth: v.number(),
    currency: v.string(),
  }),
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
        return {
          customers: 0,
          leads: 0,
          inventory: 0,
          quotations: 0,
          revenue: 0,
          growth: 0,
          currency: "SAR",
        };
      }

      // Get organization details for currency
      const organization = await ctx.db.get(args.organization_id as any);
      if (!organization) {
        return {
          customers: 0,
          leads: 0,
          inventory: 0,
          quotations: 0,
          revenue: 0,
          growth: 0,
          currency: "SAR",
        };
      }
    // Get customer count
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
    
    // Get lead count
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
    
    // Get inventory count
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
    
    // Get quotation count (quotations table doesn't have is_active field, so remove the filter)
    const quotations = await ctx.db
      .query("quotations")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .collect();
    
    // Calculate revenue from quotations (sum of total_amount)
    const revenue = quotations.reduce((sum, quotation) => {
      return sum + (quotation.total_amount || 0);
    }, 0);
    
    // Calculate growth (for now, return 0 as we don't have historical data)
    const growth = 0;
    
    return {
      customers: customers.length,
      leads: leads.length,
      inventory: inventory.length,
      quotations: quotations.length,
      revenue,
      growth,
      currency: organization.currency,
    };
    } catch (err) {
      console.warn("getDashboardStats fallback:", err);
      return {
        customers: 0,
        leads: 0,
        inventory: 0,
        quotations: 0,
        revenue: 0,
        growth: 0,
        currency: "SAR",
      };
    }
  },
});

// Get recent activity for dashboard
export const getRecentActivity = query({
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

      const activities: any[] = [];
      
      // Get recent customers
      const recentCustomers = await ctx.db
        .query("customers")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .filter((q) => q.eq(q.field("is_active"), true))
        .order("desc")
        .take(5);
      
      recentCustomers.forEach(customer => {
        activities.push({
          type: "customer",
          title: "New Customer Added",
          description: customer.customer_company_name,
          timestamp: customer._creationTime,
          status: "New",
        });
      });
      
      // Get recent leads
      const recentLeads = await ctx.db
        .query("leads")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .filter((q) => q.eq(q.field("is_active"), true))
        .order("desc")
        .take(5);
      
      recentLeads.forEach(lead => {
        activities.push({
          type: "lead",
          title: "Lead Status Updated",
          description: `${lead.name} - ${lead.status}`,
          timestamp: lead._creationTime,
          status: "Updated",
        });
      });
      
      // Get recent quotations (quotations table doesn't have is_active field)
      const recentQuotations = await ctx.db
        .query("quotations")
        .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
        .order("desc")
        .take(5);
      
      recentQuotations.forEach(quotation => {
        activities.push({
          type: "quotation",
          title: "Quotation Generated",
          description: `${quotation.quotation_number} for ${quotation.customer_name || 'Unknown'}`,
          timestamp: quotation._creationTime,
          status: "Generated",
        });
      });
      
      // Sort by timestamp and return top 10
      return activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);
    } catch (err) {
      console.warn("getRecentActivity fallback:", err);
      return [];
    }
  },
});
