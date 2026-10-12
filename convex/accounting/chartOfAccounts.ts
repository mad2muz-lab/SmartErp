import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// ========================================
// CHART OF ACCOUNTS MODULE
// ========================================

// Create a new account
export const createAccount = mutation({
  args: {
    organization_id: v.id("organizations"),
    account_code: v.string(),
    account_name: v.string(),
    account_name_arabic: v.optional(v.string()),
    account_type: v.union(
      v.literal("ASSET"),
      v.literal("LIABILITY"), 
      v.literal("EQUITY"),
      v.literal("REVENUE"),
      v.literal("EXPENSE")
    ),
    account_category: v.string(),
    parent_account_id: v.optional(v.id("chart_of_accounts")),
    description: v.optional(v.string()),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    // Check if account code already exists
    const existingAccount = await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_account_code", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_code", args.account_code)
      )
      .first();

    if (existingAccount) {
      throw new Error("Account code already exists");
    }

    const now = new Date().toISOString();
    
    return await ctx.db.insert("chart_of_accounts", {
      ...args,
      is_active: true,
      is_system_account: false,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update an account
export const updateAccount = mutation({
  args: {
    account_id: v.id("chart_of_accounts"),
    account_name: v.optional(v.string()),
    account_name_arabic: v.optional(v.string()),
    account_category: v.optional(v.string()),
    parent_account_id: v.optional(v.id("chart_of_accounts")),
    description: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { account_id, ...updateData } = args;
    
    const existingAccount = await ctx.db.get(account_id);
    if (!existingAccount) {
      throw new Error("Account not found");
    }

    if (existingAccount.is_system_account) {
      throw new Error("Cannot modify system accounts");
    }

    return await ctx.db.patch(account_id, {
      ...updateData,
      updated_at: new Date().toISOString(),
    });
  },
});

// Get all accounts for an organization
export const getAccounts = query({
  args: {
    organization_id: v.id("organizations"),
    account_type: v.optional(v.union(
      v.literal("ASSET"),
      v.literal("LIABILITY"), 
      v.literal("EQUITY"),
      v.literal("REVENUE"),
      v.literal("EXPENSE")
    )),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("chart_of_accounts")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    if (args.account_type) {
      query = ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_type", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_type", args.account_type!)
        );
    }

    const accounts = await query.collect();
    
    // Filter by is_active if specified
    if (args.is_active !== undefined) {
      return accounts.filter(account => account.is_active === args.is_active);
    }
    
    return accounts;
  },
});

// Get account by ID
export const getAccount = query({
  args: {
    account_id: v.id("chart_of_accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.account_id);
  },
});

// Get account by code
export const getAccountByCode = query({
  args: {
    organization_id: v.id("organizations"),
    account_code: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_account_code", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_code", args.account_code)
      )
      .first();
  },
});

// Get child accounts
export const getChildAccounts = query({
  args: {
    organization_id: v.id("organizations"),
    parent_account_id: v.id("chart_of_accounts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      )
      .filter((q) => q.eq(q.field("parent_account_id"), args.parent_account_id))
      .collect();
  },
});

// Initialize default chart of accounts for new organization
export const initializeDefaultAccounts = mutation({
  args: {
    organization_id: v.id("organizations"),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Default chart of accounts structure
    const defaultAccounts = [
      // ASSETS
      { code: "1000", name: "Current Assets", type: "ASSET", category: "Current Assets" },
      { code: "1100", name: "Cash and Cash Equivalents", type: "ASSET", category: "Current Assets", parent: "1000" },
      { code: "1110", name: "Cash in Hand", type: "ASSET", category: "Current Assets", parent: "1100" },
      { code: "1120", name: "Bank Account", type: "ASSET", category: "Current Assets", parent: "1100" },
      { code: "1200", name: "Accounts Receivable", type: "ASSET", category: "Current Assets", parent: "1000" },
      { code: "1300", name: "Inventory", type: "ASSET", category: "Current Assets", parent: "1000" },
      { code: "1400", name: "Prepaid Expenses", type: "ASSET", category: "Current Assets", parent: "1000" },
      
      { code: "1500", name: "Fixed Assets", type: "ASSET", category: "Fixed Assets" },
      { code: "1510", name: "Equipment", type: "ASSET", category: "Fixed Assets", parent: "1500" },
      { code: "1520", name: "Furniture & Fixtures", type: "ASSET", category: "Fixed Assets", parent: "1500" },
      { code: "1530", name: "Accumulated Depreciation", type: "ASSET", category: "Fixed Assets", parent: "1500" },
      
      // LIABILITIES
      { code: "2000", name: "Current Liabilities", type: "LIABILITY", category: "Current Liabilities" },
      { code: "2100", name: "Accounts Payable", type: "LIABILITY", category: "Current Liabilities", parent: "2000" },
      { code: "2200", name: "Accrued Expenses", type: "LIABILITY", category: "Current Liabilities", parent: "2000" },
      { code: "2300", name: "VAT Payable", type: "LIABILITY", category: "Current Liabilities", parent: "2000" },
      { code: "2400", name: "Short-term Loans", type: "LIABILITY", category: "Current Liabilities", parent: "2000" },
      
      { code: "2500", name: "Long-term Liabilities", type: "LIABILITY", category: "Long-term Liabilities" },
      { code: "2510", name: "Long-term Loans", type: "LIABILITY", category: "Long-term Liabilities", parent: "2500" },
      
      // EQUITY
      { code: "3000", name: "Owner's Equity", type: "EQUITY", category: "Owner's Equity" },
      { code: "3100", name: "Capital", type: "EQUITY", category: "Owner's Equity", parent: "3000" },
      { code: "3200", name: "Retained Earnings", type: "EQUITY", category: "Owner's Equity", parent: "3000" },
      { code: "3300", name: "Current Year Profit/Loss", type: "EQUITY", category: "Owner's Equity", parent: "3000" },
      
      // REVENUE
      { code: "4000", name: "Revenue", type: "REVENUE", category: "Revenue" },
      { code: "4100", name: "Sales Revenue", type: "REVENUE", category: "Revenue", parent: "4000" },
      { code: "4200", name: "Service Revenue", type: "REVENUE", category: "Revenue", parent: "4000" },
      { code: "4300", name: "Other Income", type: "REVENUE", category: "Revenue", parent: "4000" },
      
      // EXPENSES
      { code: "5000", name: "Operating Expenses", type: "EXPENSE", category: "Operating Expenses" },
      { code: "5100", name: "Cost of Goods Sold", type: "EXPENSE", category: "Operating Expenses", parent: "5000" },
      { code: "5200", name: "Administrative Expenses", type: "EXPENSE", category: "Operating Expenses", parent: "5000" },
      { code: "5300", name: "Selling Expenses", type: "EXPENSE", category: "Operating Expenses", parent: "5000" },
      { code: "5400", name: "Financial Expenses", type: "EXPENSE", category: "Operating Expenses", parent: "5000" },
    ];

    const createdAccounts = [];
    const accountMap = new Map();

    // First pass: create all accounts
    for (const account of defaultAccounts) {
      const accountId = await ctx.db.insert("chart_of_accounts", {
        organization_id: args.organization_id,
        account_code: account.code,
        account_name: account.name,
        account_type: account.type as "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE",
        account_category: account.category,
        parent_account_id: undefined, // Will be updated in second pass
        is_active: true,
        is_system_account: true,
        description: `Default ${account.category} account`,
        created_by: args.created_by,
        created_at: now,
        updated_at: now,
      });
      
      accountMap.set(account.code, accountId);
      createdAccounts.push({ ...account, id: accountId });
    }

    // Second pass: update parent relationships
    for (const account of createdAccounts) {
      if (account.parent) {
        const parentId = accountMap.get(account.parent);
        if (parentId) {
          await ctx.db.patch(account.id, {
            parent_account_id: parentId,
            updated_at: now,
          });
        }
      }
    }

    return { message: "Default chart of accounts initialized successfully", count: createdAccounts.length };
  },
});

// Delete account (only if no transactions exist)
export const deleteAccount = mutation({
  args: {
    account_id: v.id("chart_of_accounts"),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db.get(args.account_id);
    if (!account) {
      throw new Error("Account not found");
    }

    if (account.is_system_account) {
      throw new Error("Cannot delete system accounts");
    }

    // Check if account has any transactions
    const hasTransactions = await ctx.db
      .query("general_ledger")
      .withIndex("by_account", (q) => 
        q.eq("organization_id", account.organization_id)
         .eq("account_id", args.account_id)
      )
      .first();

    if (hasTransactions) {
      throw new Error("Cannot delete account with existing transactions");
    }

    // Check if account has child accounts
    const hasChildren = await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", account.organization_id)
      )
      .filter((q) => q.eq(q.field("parent_account_id"), args.account_id))
      .first();

    if (hasChildren) {
      throw new Error("Cannot delete account with child accounts");
    }

    await ctx.db.delete(args.account_id);
    return { message: "Account deleted successfully" };
  },
});

// List accounts (alias for getAccounts for frontend compatibility)
export const listAccounts = query({
  args: {
    organization_id: v.id("organizations"),
    account_type: v.optional(v.union(
      v.literal("ASSET"),
      v.literal("LIABILITY"), 
      v.literal("EQUITY"),
      v.literal("REVENUE"),
      v.literal("EXPENSE")
    )),
    is_active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("chart_of_accounts")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    if (args.account_type) {
      query = ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_type", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_type", args.account_type!)
        );
    }

    const accounts = await query.collect();
    
    // Filter by is_active if specified
    if (args.is_active !== undefined) {
      return accounts.filter(account => account.is_active === args.is_active);
    }
    
    return accounts;
  },
});

// Get account summary for dashboard
export const getAccountSummary = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // For now, return mock data until we implement proper calculations
    return {
      total_assets: 0,
      total_liabilities: 0,
      net_worth: 0,
      monthly_revenue: 0,
    };
  },
});
