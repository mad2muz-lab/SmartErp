import { query } from "./_generated/server";
import { v } from "convex/values";

// Get procurement metrics for analytics dashboard
export const getProcurementMetrics = query({
  args: {
    organization_id: v.string(),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organization_id, start_date, end_date } = args;

    // For now, return mock data since this is a placeholder
    // In a real implementation, you would query the actual database
    return {
      total_requisitions: 25,
      total_orders: 18,
      total_spend: 125000,
      average_processing_time: 3.5,
      approval_rate: 85.5,
      pending_approvals: 7,
      completed_orders: 15,
      cancelled_orders: 2,
      topSuppliers: [
        {
          supplier_id: "supplier1",
          supplier_name: "ABC Supplies",
          total_spend: 45000,
          po_count: 8
        },
        {
          supplier_id: "supplier2", 
          supplier_name: "XYZ Corporation",
          total_spend: 32000,
          po_count: 5
        },
        {
          supplier_id: "supplier3",
          supplier_name: "Tech Solutions Ltd",
          total_spend: 28000,
          po_count: 4
        }
      ]
    };
  },
});

// Get spend analysis data
export const getSpendAnalysis = query({
  args: {
    organization_id: v.string(),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organization_id, start_date, end_date } = args;

    // Return mock data for now
    return {
      totalSpend: 125000,
      averageOrderValue: 6944.44,
      largestOrder: 25000,
      smallestOrder: 500,
      spendBySupplier: [
        {
          supplier_id: "supplier1",
          supplier_name: "ABC Supplies",
          total_spend: 45000,
          order_count: 8,
          average_order: 5625
        },
        {
          supplier_id: "supplier2",
          supplier_name: "XYZ Corporation", 
          total_spend: 32000,
          order_count: 5,
          average_order: 6400
        },
        {
          supplier_id: "supplier3",
          supplier_name: "Tech Solutions Ltd",
          total_spend: 28000,
          order_count: 4,
          average_order: 7000
        }
      ],
      spendByCategory: [
        { category: "Office Supplies", spend: 35000 },
        { category: "IT Equipment", spend: 45000 },
        { category: "Furniture", spend: 25000 },
        { category: "Services", spend: 20000 }
      ],
      monthlySpend: [
        { month: "Jan", spend: 15000 },
        { month: "Feb", spend: 18000 },
        { month: "Mar", spend: 22000 },
        { month: "Apr", spend: 19000 },
        { month: "May", spend: 25000 },
        { month: "Jun", spend: 26000 }
      ]
    };
  },
});

// Get supplier performance data
export const getSupplierPerformance = query({
  args: {
    organization_id: v.string(),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organization_id, start_date, end_date } = args;

    // Return mock data for now
    return {
      topSuppliers: [
        {
          supplier_id: "supplier1",
          supplier_name: "ABC Supplies",
          total_spend: 45000,
          po_count: 8,
          rating: 4.5,
          delivery_performance: 95
        },
        {
          supplier_id: "supplier2",
          supplier_name: "XYZ Corporation",
          total_spend: 32000,
          po_count: 5,
          rating: 4.2,
          delivery_performance: 88
        },
        {
          supplier_id: "supplier3",
          supplier_name: "Tech Solutions Ltd",
          total_spend: 28000,
          po_count: 4,
          rating: 4.8,
          delivery_performance: 92
        }
      ],
      supplierRatings: [
        { supplier_name: "ABC Supplies", rating: 4.5, reviews: 12 },
        { supplier_name: "XYZ Corporation", rating: 4.2, reviews: 8 },
        { supplier_name: "Tech Solutions Ltd", rating: 4.8, reviews: 15 }
      ],
      deliveryPerformance: [
        { supplier_name: "ABC Supplies", on_time: 95, late: 5 },
        { supplier_name: "XYZ Corporation", on_time: 88, late: 12 },
        { supplier_name: "Tech Solutions Ltd", on_time: 92, late: 8 }
      ],
      qualityMetrics: [
        { supplier_name: "ABC Supplies", quality_score: 4.6, returns: 2 },
        { supplier_name: "XYZ Corporation", quality_score: 4.1, returns: 5 },
        { supplier_name: "Tech Solutions Ltd", quality_score: 4.7, returns: 1 }
      ]
    };
  },
});

// Get procurement efficiency metrics
export const getProcurementEfficiency = query({
  args: {
    organization_id: v.string(),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organization_id, start_date, end_date } = args;

    // Return mock data for now
    return {
      cycleTime: 3.5,
      costSavings: 15000,
      efficiencyScore: 85.5,
      conversionRate: 72.0,
      processImprovements: [
        { improvement: "Automated approval workflow", impact: "Reduced cycle time by 2 days" },
        { improvement: "Supplier consolidation", impact: "Saved 12% on procurement costs" },
        { improvement: "Digital document management", impact: "Improved accuracy by 95%" }
      ]
    };
  },
});
