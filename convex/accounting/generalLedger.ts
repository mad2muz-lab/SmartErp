import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// ========================================
// GENERAL LEDGER MODULE
// ========================================

// Create a general ledger entry
export const createLedgerEntry = mutation({
  args: {
    organization_id: v.id("organizations"),
    account_id: v.id("chart_of_accounts"),
    transaction_id: v.string(),
    transaction_type: v.union(
      v.literal("JOURNAL"),
      v.literal("RECEIPT"),
      v.literal("PAYMENT"),
      v.literal("INVOICE"),
      v.literal("QUOTATION"),
      v.literal("PURCHASE"),
      v.literal("OPENING_BALANCE")
    ),
    reference_id: v.optional(v.string()),
    reference_type: v.optional(v.string()),
    debit_amount: v.number(),
    credit_amount: v.number(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    transaction_date: v.string(),
    fiscal_year: v.string(),
    fiscal_period: v.string(),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    // Validate account exists
    const account = await ctx.db.get(args.account_id);
    if (!account) {
      throw new Error("Account not found");
    }

    if (!account.is_active) {
      throw new Error("Account is not active");
    }

    // Calculate running balance
    const lastEntry = await ctx.db
      .query("general_ledger")
      .withIndex("by_account", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_id", args.account_id)
      )
      .order("desc")
      .first();

    const previousBalance = lastEntry?.balance || 0;
    const newBalance = previousBalance + args.debit_amount - args.credit_amount;

    const now = new Date().toISOString();

    return await ctx.db.insert("general_ledger", {
      ...args,
      balance: newBalance,
      created_at: now,
      updated_at: now,
    });
  },
});

// Create multiple ledger entries (for double-entry bookkeeping)
export const createLedgerEntries = mutation({
  args: {
    organization_id: v.id("organizations"),
    transaction_id: v.string(),
    transaction_type: v.union(
      v.literal("JOURNAL"),
      v.literal("RECEIPT"),
      v.literal("PAYMENT"),
      v.literal("INVOICE"),
      v.literal("QUOTATION"),
      v.literal("PURCHASE"),
      v.literal("OPENING_BALANCE")
    ),
    reference_id: v.optional(v.string()),
    reference_type: v.optional(v.string()),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    transaction_date: v.string(),
    fiscal_year: v.string(),
    fiscal_period: v.string(),
    created_by: v.id("user_profiles"),
    entries: v.array(v.object({
      account_id: v.id("chart_of_accounts"),
      debit_amount: v.number(),
      credit_amount: v.number(),
      description: v.string(),
      description_arabic: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate that total debits equal total credits
    const totalDebits = args.entries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredits = args.entries.reduce((sum, entry) => sum + entry.credit_amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) { // Allow for small rounding differences
      throw new Error("Total debits must equal total credits");
    }

    const createdEntries = [];
    const now = new Date().toISOString();

    // Create each entry
    for (const entry of args.entries) {
      // Validate account exists
      const account = await ctx.db.get(entry.account_id);
      if (!account) {
        throw new Error(`Account not found: ${entry.account_id}`);
      }

      if (!account.is_active) {
        throw new Error(`Account is not active: ${account.account_name}`);
      }

      // Calculate running balance
      const lastEntry = await ctx.db
        .query("general_ledger")
        .withIndex("by_account", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_id", entry.account_id)
        )
        .order("desc")
        .first();

      const previousBalance = lastEntry?.balance || 0;
      const newBalance = previousBalance + entry.debit_amount - entry.credit_amount;

      const ledgerEntryId = await ctx.db.insert("general_ledger", {
        organization_id: args.organization_id,
        account_id: entry.account_id,
        transaction_id: args.transaction_id,
        transaction_type: args.transaction_type,
        reference_id: args.reference_id,
        reference_type: args.reference_type,
        debit_amount: entry.debit_amount,
        credit_amount: entry.credit_amount,
        balance: newBalance,
        currency: args.currency,
        exchange_rate: args.exchange_rate,
        description: entry.description,
        description_arabic: entry.description_arabic,
        transaction_date: args.transaction_date,
        fiscal_year: args.fiscal_year,
        fiscal_period: args.fiscal_period,
        created_by: args.created_by,
        created_at: now,
        updated_at: now,
      });

      createdEntries.push(ledgerEntryId);
    }

    return { 
      message: "Ledger entries created successfully", 
      entry_ids: createdEntries,
      transaction_id: args.transaction_id 
    };
  },
});

// Get ledger entries for an account
export const getAccountLedger = query({
  args: {
    organization_id: v.id("organizations"),
    account_id: v.id("chart_of_accounts"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("general_ledger")
      .withIndex("by_account", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_id", args.account_id)
      );

    const entries = await query.order("asc").collect();

    // Apply filters
    let filteredEntries = entries;

    if (args.start_date) {
      filteredEntries = filteredEntries.filter(entry => entry.transaction_date >= args.start_date!);
    }

    if (args.end_date) {
      filteredEntries = filteredEntries.filter(entry => entry.transaction_date <= args.end_date!);
    }

    if (args.fiscal_period) {
      filteredEntries = filteredEntries.filter(entry => entry.fiscal_period === args.fiscal_period);
    }

    return filteredEntries;
  },
});

// Get all ledger entries for a transaction
export const getTransactionLedger = query({
  args: {
    organization_id: v.id("organizations"),
    transaction_id: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("general_ledger")
      .withIndex("by_transaction", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("transaction_id", args.transaction_id)
      )
      .collect();
  },
});

// Get account balance
export const getAccountBalance = query({
  args: {
    organization_id: v.id("organizations"),
    account_id: v.id("chart_of_accounts"),
    as_of_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("general_ledger")
      .withIndex("by_account", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_id", args.account_id)
      );

    const entries = await query.order("asc").collect();

    // Filter by date if specified
    let filteredEntries = entries;
    if (args.as_of_date) {
      filteredEntries = entries.filter(entry => entry.transaction_date <= args.as_of_date!);
    }

    // Calculate balance
    const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
    const balance = totalDebits - totalCredits;

    return {
      account_id: args.account_id,
      total_debits: totalDebits,
      total_credits: totalCredits,
      balance: balance,
      entry_count: filteredEntries.length,
      as_of_date: args.as_of_date || new Date().toISOString().split('T')[0],
    };
  },
});

// Get trial balance
export const getTrialBalance = query({
  args: {
    organization_id: v.id("organizations"),
    as_of_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all active accounts
    const accounts = await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      )
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    const trialBalance = [];

    for (const account of accounts) {
      // Get account balance
      let query = ctx.db
        .query("general_ledger")
        .withIndex("by_account", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_id", account._id)
        );

      const entries = await query.order("asc").collect();

      // Apply filters
      let filteredEntries = entries;
      if (args.as_of_date) {
        filteredEntries = entries.filter(entry => entry.transaction_date <= args.as_of_date!);
      }
      if (args.fiscal_period) {
        filteredEntries = filteredEntries.filter(entry => entry.fiscal_period === args.fiscal_period);
      }

      // Calculate balance
      const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
      const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
      const balance = totalDebits - totalCredits;

      // Only include accounts with transactions or non-zero balance
      if (filteredEntries.length > 0 || balance !== 0) {
        trialBalance.push({
          account_id: account._id,
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          account_category: account.account_category,
          total_debits: totalDebits,
          total_credits: totalCredits,
          balance: balance,
          debit_balance: balance > 0 ? balance : 0,
          credit_balance: balance < 0 ? Math.abs(balance) : 0,
        });
      }
    }

    // Sort by account code
    trialBalance.sort((a, b) => a.account_code.localeCompare(b.account_code));

    // Calculate totals
    const totalDebits = trialBalance.reduce((sum, item) => sum + item.total_debits, 0);
    const totalCredits = trialBalance.reduce((sum, item) => sum + item.total_credits, 0);
    const totalDebitBalance = trialBalance.reduce((sum, item) => sum + item.debit_balance, 0);
    const totalCreditBalance = trialBalance.reduce((sum, item) => sum + item.credit_balance, 0);

    return {
      trial_balance: trialBalance,
      totals: {
        total_debits: totalDebits,
        total_credits: totalCredits,
        total_debit_balance: totalDebitBalance,
        total_credit_balance: totalCreditBalance,
        is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
      as_of_date: args.as_of_date || new Date().toISOString().split('T')[0],
      fiscal_period: args.fiscal_period,
    };
  },
});

// Reverse a transaction (create reversing entries)
export const reverseTransaction = mutation({
  args: {
    organization_id: v.id("organizations"),
    original_transaction_id: v.string(),
    reversal_date: v.string(),
    reversal_description: v.string(),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    // Get original transaction entries
    const originalEntries = await ctx.db
      .query("general_ledger")
      .withIndex("by_transaction", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("transaction_id", args.original_transaction_id)
      )
      .collect();

    if (originalEntries.length === 0) {
      throw new Error("Original transaction not found");
    }

    // Create reversal transaction ID
    const reversalTransactionId = `REV-${args.original_transaction_id}-${Date.now()}`;
    const now = new Date().toISOString();
    const fiscalYear = new Date(args.reversal_date).getFullYear().toString();
    const fiscalPeriod = `${fiscalYear}-${String(new Date(args.reversal_date).getMonth() + 1).padStart(2, '0')}`;

    const reversalEntries = [];

    // Create reversing entries (swap debits and credits)
    for (const originalEntry of originalEntries) {
      const reversalEntryId = await ctx.db.insert("general_ledger", {
        organization_id: args.organization_id,
        account_id: originalEntry.account_id,
        transaction_id: reversalTransactionId,
        transaction_type: "JOURNAL",
        reference_id: args.original_transaction_id,
        reference_type: "REVERSAL",
        debit_amount: originalEntry.credit_amount, // Swap
        credit_amount: originalEntry.debit_amount, // Swap
        balance: 0, // Will be calculated
        currency: originalEntry.currency,
        exchange_rate: originalEntry.exchange_rate,
        description: `REVERSAL: ${args.reversal_description}`,
        description_arabic: originalEntry.description_arabic,
        transaction_date: args.reversal_date,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
        created_by: args.created_by,
        created_at: now,
        updated_at: now,
      });

      reversalEntries.push(reversalEntryId);
    }

    return {
      message: "Transaction reversed successfully",
      reversal_transaction_id: reversalTransactionId,
      reversal_entry_ids: reversalEntries,
    };
  },
});

// Get recent transactions for dashboard
export const getRecentTransactions = query({
  args: {
    organization_id: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    // Get recent ledger entries with account names
    const entries = await ctx.db
      .query("general_ledger")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      )
      .order("desc")
      .take(limit);

    // Enrich with account names
    const enrichedEntries = [];
    for (const entry of entries) {
      const account = await ctx.db.get(entry.account_id);
      enrichedEntries.push({
        ...entry,
        account_name: account?.account_name || "Unknown Account",
      });
    }

    return enrichedEntries;
  },
});
