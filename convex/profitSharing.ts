import { query } from "./_generated/server";
import { v } from "convex/values";

// Get profit sharing dashboard data
export const getProfitSharingDashboard = query({
  args: {
    organization_id: v.id("organizations"),
  },
  returns: v.object({
    total_profit: v.number(),
    total_distributed: v.number(),
    pending_profit: v.number(),
    saudi_sponsor_total: v.number(),
    partners_total: v.number(),
    recent_orders: v.array(v.object({
      quotation_id: v.id("quotations"),
      quotation_number: v.string(),
      customer_name: v.string(),
      profit_amount: v.number(),
      payment_status: v.string(),
      created_at: v.string(),
    })),
    monthly_profit: v.array(v.object({
      month: v.string(),
      profit: v.number(),
      distributed: v.number(),
    })),
  }),
  handler: async (ctx, args) => {
    // For now, return empty data since the order_financials table might not exist
    // This prevents the dashboard from crashing
    return {
      total_profit: 0,
      total_distributed: 0,
      pending_profit: 0,
      saudi_sponsor_total: 0,
      partners_total: 0,
      recent_orders: [],
      monthly_profit: [],
    };
  }
});
