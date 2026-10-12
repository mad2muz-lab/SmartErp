import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ========================================
// ACCOUNTING SETTINGS MODULE
// ========================================

// Initialize accounting settings for an organization
export const initializeAccountingSettings = mutation({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year_start: v.optional(v.string()), // e.g., "01-01" for January 1st
    default_currency: v.optional(v.string()),
    base_currency: v.optional(v.string()),
    auto_generate_voucher_numbers: v.optional(v.boolean()),
    voucher_number_prefix: v.optional(v.string()),
    receipt_number_prefix: v.optional(v.string()),
    payment_number_prefix: v.optional(v.string()),
    enable_multi_currency: v.optional(v.boolean()),
    enable_budget_control: v.optional(v.boolean()),
    enable_approval_workflow: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if settings already exist
    const existingSettings = await ctx.db
      .query("accounting_settings")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .first();

    if (existingSettings) {
      throw new Error("Accounting settings already exist for this organization");
    }

    const now = new Date().toISOString();

    // Get organization details for default values
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const settingsId = await ctx.db.insert("accounting_settings", {
      organization_id: args.organization_id,
      fiscal_year_start: args.fiscal_year_start || "01-01",
      default_currency: args.default_currency || organization.currency || "SAR",
      base_currency: args.base_currency || organization.currency || "SAR",
      auto_generate_voucher_numbers: args.auto_generate_voucher_numbers ?? true,
      voucher_number_prefix: args.voucher_number_prefix || "JV",
      receipt_number_prefix: args.receipt_number_prefix || "RCP",
      payment_number_prefix: args.payment_number_prefix || "PAY",
      enable_multi_currency: args.enable_multi_currency ?? false,
      enable_budget_control: args.enable_budget_control ?? false,
      enable_approval_workflow: args.enable_approval_workflow ?? false,
      created_at: now,
      updated_at: now,
    });

    return {
      settings_id: settingsId,
      message: "Accounting settings initialized successfully",
    };
  },
});

// Update accounting settings
export const updateAccountingSettings = mutation({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year_start: v.optional(v.string()),
    default_currency: v.optional(v.string()),
    base_currency: v.optional(v.string()),
    auto_generate_voucher_numbers: v.optional(v.boolean()),
    voucher_number_prefix: v.optional(v.string()),
    receipt_number_prefix: v.optional(v.string()),
    payment_number_prefix: v.optional(v.string()),
    enable_multi_currency: v.optional(v.boolean()),
    enable_budget_control: v.optional(v.boolean()),
    enable_approval_workflow: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("accounting_settings")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id))
      .first();

    if (!settings) {
      throw new Error("Accounting settings not found. Please initialize settings first.");
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now,
    };

    // Update fields
    if (args.fiscal_year_start !== undefined) updateData.fiscal_year_start = args.fiscal_year_start;
    if (args.default_currency !== undefined) updateData.default_currency = args.default_currency;
    if (args.base_currency !== undefined) updateData.base_currency = args.base_currency;
    if (args.auto_generate_voucher_numbers !== undefined) updateData.auto_generate_voucher_numbers = args.auto_generate_voucher_numbers;
    if (args.voucher_number_prefix !== undefined) updateData.voucher_number_prefix = args.voucher_number_prefix;
    if (args.receipt_number_prefix !== undefined) updateData.receipt_number_prefix = args.receipt_number_prefix;
    if (args.payment_number_prefix !== undefined) updateData.payment_number_prefix = args.payment_number_prefix;
    if (args.enable_multi_currency !== undefined) updateData.enable_multi_currency = args.enable_multi_currency;
    if (args.enable_budget_control !== undefined) updateData.enable_budget_control = args.enable_budget_control;
    if (args.enable_approval_workflow !== undefined) updateData.enable_approval_workflow = args.enable_approval_workflow;

    await ctx.db.patch(settings._id, updateData);

    return { message: "Accounting settings updated successfully" };
  },
});

// Get accounting settings
export const getAccountingSettings = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
  },
  handler: async (ctx, args) => {
    const orgId = ctx.db.normalizeId("organizations", String(args.organization_id));
    if (!orgId) {
      return null;
    }
    return await ctx.db
      .query("accounting_settings")
      .withIndex("by_organization", (q) => q.eq("organization_id", orgId))
      .first();
  },
});

// Create fiscal periods for a year
export const createFiscalPeriods = mutation({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year: v.string(),
    fiscal_year_start: v.optional(v.string()), // e.g., "01-01" for January 1st
  },
  handler: async (ctx, args) => {
    // Check if fiscal periods already exist for this year
    const existingPeriods = await ctx.db
      .query("fiscal_periods")
      .withIndex("by_fiscal_year", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("fiscal_year", args.fiscal_year)
      )
      .first();

    if (existingPeriods) {
      throw new Error("Fiscal periods already exist for the specified year");
    }

    const fiscalYearStart = args.fiscal_year_start || "01-01";
    const [startMonth, startDay] = fiscalYearStart.split('-').map(Number);
    
    const now = new Date().toISOString();
    const createdPeriods = [];

    // Create 12 monthly periods
    for (let month = 0; month < 12; month++) {
      const periodStart = new Date(parseInt(args.fiscal_year), startMonth - 1 + month, startDay);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(periodEnd.getDate() - 1);

      const periodCode = `${args.fiscal_year}-${String(month + 1).padStart(2, '0')}`;
      const periodName = periodStart.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });

      const periodId = await ctx.db.insert("fiscal_periods", {
        organization_id: args.organization_id,
        fiscal_year: args.fiscal_year,
        period_name: periodName,
        period_code: periodCode,
        start_date: periodStart.toISOString().split('T')[0],
        end_date: periodEnd.toISOString().split('T')[0],
        is_closed: false,
        created_at: now,
        updated_at: now,
      });

      createdPeriods.push({
        period_id: periodId,
        period_code: periodCode,
        period_name: periodName,
        start_date: periodStart.toISOString().split('T')[0],
        end_date: periodEnd.toISOString().split('T')[0],
      });
    }

    // Create quarterly periods
    const quarterlyPeriods = [
      { quarter: 1, months: [1, 2, 3], name: "Q1" },
      { quarter: 2, months: [4, 5, 6], name: "Q2" },
      { quarter: 3, months: [7, 8, 9], name: "Q3" },
      { quarter: 4, months: [10, 11, 12], name: "Q4" },
    ];

    for (const quarter of quarterlyPeriods) {
      const quarterStart = new Date(parseInt(args.fiscal_year), startMonth - 1 + quarter.months[0] - 1, startDay);
      const quarterEnd = new Date(parseInt(args.fiscal_year), startMonth - 1 + quarter.months[2] - 1, startDay);
      quarterEnd.setMonth(quarterEnd.getMonth() + 1);
      quarterEnd.setDate(quarterEnd.getDate() - 1);

      const periodCode = `${args.fiscal_year}-${quarter.name}`;
      const periodName = `${quarter.name} ${args.fiscal_year}`;

      const periodId = await ctx.db.insert("fiscal_periods", {
        organization_id: args.organization_id,
        fiscal_year: args.fiscal_year,
        period_name: periodName,
        period_code: periodCode,
        start_date: quarterStart.toISOString().split('T')[0],
        end_date: quarterEnd.toISOString().split('T')[0],
        is_closed: false,
        created_at: now,
        updated_at: now,
      });

      createdPeriods.push({
        period_id: periodId,
        period_code: periodCode,
        period_name: periodName,
        start_date: quarterStart.toISOString().split('T')[0],
        end_date: quarterEnd.toISOString().split('T')[0],
      });
    }

    return {
      message: "Fiscal periods created successfully",
      fiscal_year: args.fiscal_year,
      periods_created: createdPeriods.length,
      periods: createdPeriods,
    };
  },
});

// Get fiscal periods
export const getFiscalPeriods = query({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year: v.optional(v.string()),
    is_closed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("fiscal_periods")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    const periods = await query.collect();

    // Apply filters
    let filteredPeriods = periods;

    if (args.fiscal_year) {
      filteredPeriods = filteredPeriods.filter(period => period.fiscal_year === args.fiscal_year);
    }

    if (args.is_closed !== undefined) {
      filteredPeriods = filteredPeriods.filter(period => period.is_closed === args.is_closed);
    }

    // Sort by period code
    filteredPeriods.sort((a, b) => a.period_code.localeCompare(b.period_code));

    return filteredPeriods;
  },
});

// Close a fiscal period
export const closeFiscalPeriod = mutation({
  args: {
    organization_id: v.id("organizations"),
    period_code: v.string(),
    closed_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const period = await ctx.db
      .query("fiscal_periods")
      .withIndex("by_period_code", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("period_code", args.period_code)
      )
      .first();

    if (!period) {
      throw new Error("Fiscal period not found");
    }

    if (period.is_closed) {
      throw new Error("Fiscal period is already closed");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(period._id, {
      is_closed: true,
      closed_by: args.closed_by as unknown as Id<"user_profiles">,
      closed_at: now,
      updated_at: now,
    });

    return { message: "Fiscal period closed successfully" };
  },
});

// Get current fiscal period
export const getCurrentFiscalPeriod = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear().toString();

    // Get all periods for current year
    const periods = await ctx.db
      .query("fiscal_periods")
      .withIndex("by_fiscal_year", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("fiscal_year", currentYear)
      )
      .collect();

    // Find the current period
    const currentPeriod = periods.find(period => 
      period.start_date <= currentDate && 
      period.end_date >= currentDate &&
      !period.is_closed
    );

    return currentPeriod || null;
  },
});

// Get fiscal year summary
export const getFiscalYearSummary = query({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all periods for the fiscal year
    const periods = await ctx.db
      .query("fiscal_periods")
      .withIndex("by_fiscal_year", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("fiscal_year", args.fiscal_year)
      )
      .collect();

    // Separate monthly and quarterly periods
    const monthlyPeriods = periods.filter(period => !period.period_code.includes('Q'));
    const quarterlyPeriods = periods.filter(period => period.period_code.includes('Q'));

    // Calculate summary
    const closedPeriods = periods.filter(period => period.is_closed);
    const openPeriods = periods.filter(period => !period.is_closed);

    return {
      fiscal_year: args.fiscal_year,
      total_periods: periods.length,
      monthly_periods: monthlyPeriods.length,
      quarterly_periods: quarterlyPeriods.length,
      closed_periods: closedPeriods.length,
      open_periods: openPeriods.length,
      periods: periods.sort((a, b) => a.period_code.localeCompare(b.period_code)),
    };
  },
});
