import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Company Expenses Management System
 * Handles business expenses and partner expense sharing
 */

// Get all company expenses for organization
export const getCompanyExpenses = query({
  args: {
    organization_id: v.id("organizations"),
    expense_type: v.optional(v.union(v.literal("registration"), v.literal("office_rent"), v.literal("utilities"), v.literal("marketing"), v.literal("other"))),
    is_shared: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    items: v.array(v.object({
      _id: v.id("company_expenses"),
      organization_id: v.id("organizations"),
      expense_type: v.union(v.literal("registration"), v.literal("office_rent"), v.literal("utilities"), v.literal("marketing"), v.literal("Office Supplies"), v.literal("other")),
      description: v.string(),
      description_arabic: v.optional(v.string()),
      amount: v.number(),
      currency: v.optional(v.string()),
      expense_date: v.string(),
      category: v.optional(v.string()),
      status: v.optional(v.string()), // Added status field
      receipt_url: v.optional(v.string()),
      is_shared: v.optional(v.boolean()),
      shared_percentage: v.optional(v.number()),
      created_by: v.string(),
      created_at: v.string(),
      updated_at: v.string(),
    })),
    isDone: v.boolean(),
    continueCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    
    let query = ctx.db
      .query("company_expenses")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .order("desc");
    
    if (args.expense_type) {
      query = query.filter((q) => q.eq(q.field("expense_type"), args.expense_type));
    }
    
    if (args.is_shared !== undefined) {
      query = query.filter((q) => q.eq(q.field("is_shared"), args.is_shared));
    }
    
    let result;
    if (args.cursor) {
      result = await query.paginate({ cursor: args.cursor, numItems: limit });
    } else {
      result = await query.paginate({ cursor: null, numItems: limit });
    }
    
    // Map page to items to match the return validator, excluding internal fields
    return {
      items: result.page.map(item => {
        const { _creationTime, ...cleanItem } = item;
        return cleanItem;
      }),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

// Get expense by ID
export const getExpense = query({
  args: {
    expense_id: v.id("company_expenses"),
  },
  returns: v.union(v.object({
    _id: v.id("company_expenses"),
    organization_id: v.id("organizations"),
    expense_type: v.union(v.literal("registration"), v.literal("office_rent"), v.literal("utilities"), v.literal("marketing"), v.literal("Office Supplies"), v.literal("other")),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    expense_date: v.string(),
    category: v.optional(v.string()),
    receipt_url: v.optional(v.string()),
    is_shared: v.optional(v.boolean()),
    shared_percentage: v.optional(v.number()),
    created_by: v.string(),
    created_at: v.string(),
    updated_at: v.string(),
  }), v.null()),
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expense_id);
    return expense;
  },
});

// Create new expense
export const createExpense = mutation({
  args: {
    organization_id: v.id("organizations"),
    expense_type: v.union(v.literal("registration"), v.literal("office_rent"), v.literal("utilities"), v.literal("marketing"), v.literal("Office Supplies"), v.literal("other")),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(v.string()),
    expense_date: v.string(),
    category: v.optional(v.string()),
    receipt_url: v.optional(v.string()),
    is_shared: v.optional(v.boolean()),
    shared_percentage: v.optional(v.number()),
    status: v.optional(v.string()),
    approval_status: v.optional(v.string()),
    payment_source: v.optional(v.string()),
    vat_amount: v.optional(v.number()),
    subtotal_amount: v.optional(v.number()),
    vat_number: v.optional(v.string()),
    created_by: v.string(),
  },
  returns: v.id("company_expenses"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Provide default values for optional fields
    const currency = args.currency || "SAR";
    const isShared = args.is_shared !== undefined ? args.is_shared : false;
    
    // Validate shared percentage if expense is shared
    if (isShared && (!args.shared_percentage || args.shared_percentage <= 0 || args.shared_percentage > 100)) {
      throw new Error("Shared percentage must be between 1 and 100 when expense is shared");
    }
    
    return await ctx.db.insert("company_expenses", {
      organization_id: args.organization_id,
      expense_type: args.expense_type,
      description: args.description,
      description_arabic: args.description_arabic,
      amount: args.amount,
      currency: currency,
      expense_date: args.expense_date,
      category: args.category,
      receipt_url: args.receipt_url,
      is_shared: isShared,
      shared_percentage: args.shared_percentage,
      status: args.status || "pending_manager_approval",
      approval_status: args.approval_status || "pending_manager_approval",
      payment_source: args.payment_source,
      vat_amount: args.vat_amount,
      subtotal_amount: args.subtotal_amount,
      vat_number: args.vat_number,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });
  },
});

export const addCompanyExpense = createExpense;

// Update expense
export const updateExpense = mutation({
  args: {
    expense_id: v.id("company_expenses"),
    expense_type: v.optional(v.union(v.literal("registration"), v.literal("office_rent"), v.literal("utilities"), v.literal("marketing"), v.literal("other"))),
    description: v.optional(v.string()),
    description_arabic: v.optional(v.string()),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    expense_date: v.optional(v.string()),
    category: v.optional(v.string()),
    receipt_url: v.optional(v.string()),
    is_shared: v.optional(v.boolean()),
    shared_percentage: v.optional(v.number()),
    updated_by: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    const expense = await ctx.db.get(args.expense_id);
    if (!expense) {
      return {
        success: false,
        message: "Expense not found",
      };
    }
    
    // Validate shared percentage if expense is being set to shared
    const isShared = args.is_shared !== undefined ? args.is_shared : expense.is_shared;
    const sharedPercentage = args.shared_percentage !== undefined ? args.shared_percentage : expense.shared_percentage;
    
    if (isShared && (!sharedPercentage || sharedPercentage <= 0 || sharedPercentage > 100)) {
      return {
        success: false,
        message: "Shared percentage must be between 1 and 100 when expense is shared",
      };
    }
    
    const updateData: any = {
      updated_at: now,
    };
    
    if (args.expense_type !== undefined) updateData.expense_type = args.expense_type;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.description_arabic !== undefined) updateData.description_arabic = args.description_arabic;
    if (args.amount !== undefined) updateData.amount = args.amount;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.expense_date !== undefined) updateData.expense_date = args.expense_date;
    if (args.category !== undefined) updateData.category = args.category;
    if (args.receipt_url !== undefined) updateData.receipt_url = args.receipt_url;
    if (args.is_shared !== undefined) updateData.is_shared = args.is_shared;
    if (args.shared_percentage !== undefined) updateData.shared_percentage = args.shared_percentage;
    
    await ctx.db.patch(args.expense_id, updateData);
    
    return {
      success: true,
      message: "Expense updated successfully",
    };
  },
});

// Delete expense
export const deleteExpense = mutation({
  args: {
    expense_id: v.id("company_expenses"),
    deleted_by: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const expense = await ctx.db.get(args.expense_id);
    if (!expense) {
      return {
        success: false,
        message: "Expense not found",
      };
    }
    
    await ctx.db.delete(args.expense_id);
    
    return {
      success: true,
      message: "Expense deleted successfully",
    };
  },
});

// Get expenses summary for dashboard
export const getExpensesSummary = query({
  args: {
    organization_id: v.id("organizations"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  returns: v.object({
    total_expenses: v.number(),
    shared_expenses: v.number(),
    private_expenses: v.number(),
    expenses_by_type: v.array(v.object({
      expense_type: v.string(),
      count: v.number(),
      total_amount: v.number(),
    })),
    monthly_expenses: v.array(v.object({
      month: v.string(),
      total_amount: v.number(),
      shared_amount: v.number(),
      private_amount: v.number(),
    })),
    recent_expenses: v.array(v.object({
      _id: v.id("company_expenses"),
      expense_type: v.string(),
      description: v.string(),
      amount: v.number(),
      expense_date: v.string(),
      is_shared: v.optional(v.boolean()),
    })),
  }),
  handler: async (ctx, args) => {
    // Get all expenses for the organization
    let expenses = await ctx.db
      .query("company_expenses")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .collect();
    
    // Filter by date range if provided
    if (args.start_date || args.end_date) {
      expenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        if (args.start_date && expenseDate < new Date(args.start_date)) return false;
        if (args.end_date && expenseDate > new Date(args.end_date)) return false;
        return true;
      });
    }
    
    // Calculate totals
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const sharedExpenses = expenses
      .filter(expense => expense.is_shared)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const privateExpenses = totalExpenses - sharedExpenses;
    
    // Group by expense type
    const expensesByType = [];
    const expenseTypes = ["registration", "office_rent", "utilities", "marketing", "other"];
    
    for (const type of expenseTypes) {
      const typeExpenses = expenses.filter(expense => expense.expense_type === type);
      const typeTotal = typeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      expensesByType.push({
        expense_type: type,
        count: typeExpenses.length,
        total_amount: typeTotal,
      });
    }
    
    // Calculate monthly expenses (last 12 months)
    const monthlyExpenses = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toISOString().substring(0, 7); // YYYY-MM
      
      const monthExpenses = expenses.filter(expense => 
        expense.expense_date.startsWith(monthStr)
      );
      
      const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const monthShared = monthExpenses
        .filter(expense => expense.is_shared)
        .reduce((sum, expense) => sum + expense.amount, 0);
      const monthPrivate = monthTotal - monthShared;
      
      monthlyExpenses.push({
        month: monthStr,
        total_amount: monthTotal,
        shared_amount: monthShared,
        private_amount: monthPrivate,
      });
    }
    
    // Get recent expenses (last 10)
    const recentExpenses = expenses
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(expense => ({
        _id: expense._id,
        expense_type: expense.expense_type,
        description: expense.description,
        amount: expense.amount,
        expense_date: expense.expense_date,
        is_shared: expense.is_shared,
      }));
    
    return {
      total_expenses: totalExpenses,
      shared_expenses: sharedExpenses,
      private_expenses: privateExpenses,
      expenses_by_type: expensesByType,
      monthly_expenses: monthlyExpenses,
      recent_expenses: recentExpenses,
    };
  },
});

// Calculate partner expense shares
export const calculatePartnerExpenseShares = query({
  args: {
    organization_id: v.id("organizations"),
    partner_id: v.optional(v.id("partners")),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  returns: v.object({
    partner_shares: v.array(v.object({
      partner_id: v.id("partners"),
      partner_name: v.string(),
      partner_role: v.string(),
      total_shared_expenses: v.number(),
      expense_count: v.number(),
      expenses: v.array(v.object({
        expense_id: v.id("company_expenses"),
        description: v.string(),
        amount: v.number(),
        shared_percentage: v.number(),
        partner_share: v.number(),
        expense_date: v.string(),
      })),
    })),
    total_shared_expenses: v.number(),
    total_partner_shares: v.number(),
  }),
  handler: async (ctx, args) => {
    // Get all shared expenses
    let sharedExpenses = await ctx.db
      .query("company_expenses")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("is_shared"), true))
      .collect();
    
    // Filter by date range if provided
    if (args.start_date || args.end_date) {
      sharedExpenses = sharedExpenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        if (args.start_date && expenseDate < new Date(args.start_date)) return false;
        if (args.end_date && expenseDate > new Date(args.end_date)) return false;
        return true;
      });
    }
    
    // Get active partners
    let partners = await ctx.db
      .query("partners")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
    
    // Filter by specific partner if provided
    if (args.partner_id) {
      partners = partners.filter(p => p._id === args.partner_id);
    }
    
    // Only consider business partners and investors for expense sharing
    const businessPartners = partners.filter(p => 
      p.role === "business_partner" || p.role === "investor"
    );
    
    const partnerShares = [];
    let totalSharedExpenses = 0;
    let totalPartnerShares = 0;
    
    for (const partner of businessPartners) {
      const partnerExpenses = [];
      let partnerTotalShare = 0;
      
      for (const expense of sharedExpenses) {
        const partnerShare = (expense.amount * (expense.shared_percentage || 100)) / 100;
        partnerTotalShare += partnerShare;
        
        partnerExpenses.push({
          expense_id: expense._id,
          description: expense.description,
          amount: expense.amount,
          shared_percentage: expense.shared_percentage || 100,
          partner_share: partnerShare,
          expense_date: expense.expense_date,
        });
      }
      
      partnerShares.push({
        partner_id: partner._id,
        partner_name: partner.name,
        partner_role: partner.role,
        total_shared_expenses: partnerTotalShare,
        expense_count: partnerExpenses.length,
        expenses: partnerExpenses,
      });
      
      totalPartnerShares += partnerTotalShare;
    }
    
    totalSharedExpenses = sharedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    return {
      partner_shares: partnerShares,
      total_shared_expenses: totalSharedExpenses,
      total_partner_shares: totalPartnerShares,
    };
  },
});

// Get expense analytics
export const getExpenseAnalytics = query({
  args: {
    organization_id: v.id("organizations"),
    period: v.optional(v.union(v.literal("month"), v.literal("quarter"), v.literal("year"))),
  },
  returns: v.object({
    total_expenses: v.number(),
    average_expense: v.number(),
    largest_expense: v.number(),
    expense_trend: v.array(v.object({
      period: v.string(),
      amount: v.number(),
      count: v.number(),
    })),
    top_expense_types: v.array(v.object({
      expense_type: v.string(),
      amount: v.number(),
      percentage: v.number(),
    })),
    shared_vs_private: v.object({
      shared_amount: v.number(),
      private_amount: v.number(),
      shared_percentage: v.number(),
      private_percentage: v.number(),
    }),
  }),
  handler: async (ctx, args) => {
    const period = args.period || "month";
    
    // Get all expenses
    const expenses = await ctx.db
      .query("company_expenses")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .collect();
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
    const largestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
    
    // Calculate expense trend based on period
    const expenseTrend = [];
    const now = new Date();
    const periods = period === "month" ? 12 : period === "quarter" ? 4 : 1;
    
    for (let i = periods - 1; i >= 0; i--) {
      let periodStart, periodEnd, periodLabel;
      
      if (period === "month") {
        periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        periodLabel = periodStart.toISOString().substring(0, 7); // YYYY-MM
      } else if (period === "quarter") {
        const quarterStart = Math.floor((now.getMonth() - i * 3) / 3) * 3;
        periodStart = new Date(now.getFullYear(), quarterStart, 1);
        periodEnd = new Date(now.getFullYear(), quarterStart + 3, 0);
        periodLabel = `Q${Math.floor(quarterStart / 3) + 1} ${now.getFullYear()}`;
      } else {
        periodStart = new Date(now.getFullYear() - i, 0, 1);
        periodEnd = new Date(now.getFullYear() - i, 11, 31);
        periodLabel = (now.getFullYear() - i).toString();
      }
      
      const periodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.expense_date);
        return expenseDate >= periodStart && expenseDate <= periodEnd;
      });
      
      const periodAmount = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      expenseTrend.push({
        period: periodLabel,
        amount: periodAmount,
        count: periodExpenses.length,
      });
    }
    
    // Calculate top expense types
    const expenseTypes = ["registration", "office_rent", "utilities", "marketing", "other"];
    const topExpenseTypes = expenseTypes.map(type => {
      const typeExpenses = expenses.filter(expense => expense.expense_type === type);
      const typeAmount = typeExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const percentage = totalExpenses > 0 ? (typeAmount / totalExpenses) * 100 : 0;
      
      return {
        expense_type: type,
        amount: typeAmount,
        percentage,
      };
    }).sort((a, b) => b.amount - a.amount);
    
    // Calculate shared vs private
    const sharedExpenses = expenses.filter(expense => expense.is_shared);
    const privateExpenses = expenses.filter(expense => !expense.is_shared);
    
    const sharedAmount = sharedExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const privateAmount = privateExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const sharedPercentage = totalExpenses > 0 ? (sharedAmount / totalExpenses) * 100 : 0;
    const privatePercentage = totalExpenses > 0 ? (privateAmount / totalExpenses) * 100 : 0;
    
    return {
      total_expenses: totalExpenses,
      average_expense: averageExpense,
      largest_expense: largestExpense,
      expense_trend: expenseTrend,
      top_expense_types: topExpenseTypes,
      shared_vs_private: {
        shared_amount: sharedAmount,
        private_amount: privateAmount,
        shared_percentage: sharedPercentage,
        private_percentage: privatePercentage,
      },
    };
  },
});
