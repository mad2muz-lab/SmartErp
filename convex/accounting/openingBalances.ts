import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ========================================
// OPENING BALANCES MODULE
// ========================================

// Set opening balance for an account
export const setOpeningBalance = mutation({
  args: {
    organization_id: v.id("organizations"),
    account_id: v.id("chart_of_accounts"),
    fiscal_year: v.string(),
    opening_debit: v.number(),
    opening_credit: v.number(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    description: v.optional(v.string()),
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

    // Check if opening balance already exists for this account and fiscal year
    const existingBalance = await ctx.db
      .query("opening_balances")
      .withIndex("by_account_fiscal_year", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_id", args.account_id)
         .eq("fiscal_year", args.fiscal_year)
      )
      .first();

    const now = new Date().toISOString();
    const openingBalance = args.opening_debit - args.opening_credit;

    if (existingBalance) {
      // Update existing opening balance
      await ctx.db.patch(existingBalance._id, {
        opening_debit: args.opening_debit,
        opening_credit: args.opening_credit,
        opening_balance: openingBalance,
        currency: args.currency,
        exchange_rate: args.exchange_rate,
        description: args.description,
        updated_at: now,
      });

      return {
        opening_balance_id: existingBalance._id,
        message: "Opening balance updated successfully",
      };
    } else {
      // Create new opening balance
      const openingBalanceId = await ctx.db.insert("opening_balances", {
        organization_id: args.organization_id,
        account_id: args.account_id,
        fiscal_year: args.fiscal_year,
        opening_debit: args.opening_debit,
        opening_credit: args.opening_credit,
        opening_balance: openingBalance,
        currency: args.currency,
        exchange_rate: args.exchange_rate,
        description: args.description,
        created_by: args.created_by,
        created_at: now,
        updated_at: now,
      });

      return {
        opening_balance_id: openingBalanceId,
        message: "Opening balance created successfully",
      };
    }
  },
});

// Set multiple opening balances for a fiscal year
export const setMultipleOpeningBalances = mutation({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year: v.string(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    created_by: v.id("user_profiles"),
    balances: v.array(v.object({
      account_id: v.id("chart_of_accounts"),
      opening_debit: v.number(),
      opening_credit: v.number(),
      description: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const results = [];

    for (const balance of args.balances) {
      // Validate account exists
      const account = await ctx.db.get(balance.account_id);
      if (!account) {
        throw new Error(`Account not found: ${balance.account_id}`);
      }

      if (!account.is_active) {
        throw new Error(`Account is not active: ${account.account_name}`);
      }

      // Check if opening balance already exists
      const existingBalance = await ctx.db
        .query("opening_balances")
        .withIndex("by_account_fiscal_year", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_id", balance.account_id)
           .eq("fiscal_year", args.fiscal_year)
        )
        .first();

      const openingBalance = balance.opening_debit - balance.opening_credit;

      if (existingBalance) {
        // Update existing opening balance
        await ctx.db.patch(existingBalance._id, {
          opening_debit: balance.opening_debit,
          opening_credit: balance.opening_credit,
          opening_balance: openingBalance,
          currency: args.currency,
          exchange_rate: args.exchange_rate,
          description: balance.description,
          updated_at: now,
        });

        results.push({
          account_id: balance.account_id,
          account_name: account.account_name,
          opening_balance_id: existingBalance._id,
          action: "updated",
        });
      } else {
        // Create new opening balance
        const openingBalanceId = await ctx.db.insert("opening_balances", {
          organization_id: args.organization_id,
          account_id: balance.account_id,
          fiscal_year: args.fiscal_year,
          opening_debit: balance.opening_debit,
          opening_credit: balance.opening_credit,
          opening_balance: openingBalance,
          currency: args.currency,
          exchange_rate: args.exchange_rate,
          description: balance.description,
          created_by: args.created_by,
          created_at: now,
          updated_at: now,
        });

        results.push({
          account_id: balance.account_id,
          account_name: account.account_name,
          opening_balance_id: openingBalanceId,
          action: "created",
        });
      }
    }

    return {
      message: "Opening balances processed successfully",
      results: results,
      total_processed: results.length,
    };
  },
});

// Get opening balance for an account
export const getOpeningBalance = query({
  args: {
    organization_id: v.id("organizations"),
    account_id: v.id("chart_of_accounts"),
    fiscal_year: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("opening_balances")
      .withIndex("by_account_fiscal_year", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_id", args.account_id)
         .eq("fiscal_year", args.fiscal_year)
      )
      .first();
  },
});

// Get all opening balances for a fiscal year
export const getOpeningBalances = query({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year: v.string(),
  },
  handler: async (ctx, args) => {
    const openingBalances = await ctx.db
      .query("opening_balances")
      .withIndex("by_fiscal_year", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("fiscal_year", args.fiscal_year)
      )
      .collect();

    // Get account details for each opening balance
    const balancesWithAccounts = [];
    for (const balance of openingBalances) {
      const account = await ctx.db.get(balance.account_id);
      if (account) {
        balancesWithAccounts.push({
          ...balance,
          account_code: account.account_code,
          account_name: account.account_name,
          account_type: account.account_type,
          account_category: account.account_category,
        });
      }
    }

    // Sort by account code
    balancesWithAccounts.sort((a, b) => a.account_code.localeCompare(b.account_code));

    // Calculate totals
    const totalDebits = balancesWithAccounts.reduce((sum, balance) => sum + balance.opening_debit, 0);
    const totalCredits = balancesWithAccounts.reduce((sum, balance) => sum + balance.opening_credit, 0);
    const totalBalance = balancesWithAccounts.reduce((sum, balance) => sum + balance.opening_balance, 0);

    return {
      opening_balances: balancesWithAccounts,
      summary: {
        total_accounts: balancesWithAccounts.length,
        total_debits: totalDebits,
        total_credits: totalCredits,
        total_balance: totalBalance,
        is_balanced: Math.abs(totalDebits - totalCredits) < 0.01,
      },
      fiscal_year: args.fiscal_year,
    };
  },
});

// Post opening balances to general ledger
export const postOpeningBalances = mutation({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year: v.string(),
    posted_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get all opening balances for the fiscal year
    const openingBalances = await ctx.db
      .query("opening_balances")
      .withIndex("by_fiscal_year", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("fiscal_year", args.fiscal_year)
      )
      .collect();

    if (openingBalances.length === 0) {
      throw new Error("No opening balances found for the specified fiscal year");
    }

    const now = new Date().toISOString();
    const transactionId = `OB-${args.fiscal_year}-${Date.now()}`;
    const fiscalPeriod = `${args.fiscal_year}-01`; // Opening balances are typically posted to the first period

    const ledgerEntryIds = [];

    // Create general ledger entries for each opening balance
    for (const balance of openingBalances) {
      if (balance.opening_balance !== 0) {
        const debitAmount = balance.opening_balance > 0 ? balance.opening_balance : 0;
        const creditAmount = balance.opening_balance < 0 ? Math.abs(balance.opening_balance) : 0;

        const ledgerEntryId = await ctx.db.insert("general_ledger", {
          organization_id: args.organization_id,
          account_id: balance.account_id,
          transaction_id: transactionId,
          transaction_type: "OPENING_BALANCE",
          reference_id: `OB-${args.fiscal_year}`,
          reference_type: "OPENING_BALANCE",
          debit_amount: debitAmount,
          credit_amount: creditAmount,
          balance: balance.opening_balance,
          currency: balance.currency,
          exchange_rate: balance.exchange_rate,
          description: `Opening Balance ${args.fiscal_year}${balance.description ? ': ' + balance.description : ''}`,
          description_arabic: undefined,
          transaction_date: `${args.fiscal_year}-01-01`,
          fiscal_year: args.fiscal_year,
          fiscal_period: fiscalPeriod,
          created_by: args.posted_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });

        ledgerEntryIds.push(ledgerEntryId);
      }
    }

    return {
      message: "Opening balances posted to general ledger successfully",
      transaction_id: transactionId,
      ledger_entry_ids: ledgerEntryIds,
      accounts_processed: openingBalances.length,
    };
  },
});

// Delete opening balance
export const deleteOpeningBalance = mutation({
  args: {
    opening_balance_id: v.id("opening_balances"),
  },
  handler: async (ctx, args) => {
    const openingBalance = await ctx.db.get(args.opening_balance_id);
    if (!openingBalance) {
      throw new Error("Opening balance not found");
    }

    // Check if opening balances have been posted to general ledger
    const hasLedgerEntries = await ctx.db
      .query("general_ledger")
      .withIndex("by_transaction", (q) => 
        q.eq("organization_id", openingBalance.organization_id)
         .eq("transaction_id", `OB-${openingBalance.fiscal_year}-*`)
      )
      .first();

    if (hasLedgerEntries) {
      throw new Error("Cannot delete opening balance that has been posted to general ledger");
    }

    await ctx.db.delete(args.opening_balance_id);

    return { message: "Opening balance deleted successfully" };
  },
});

// Get opening balance summary by account type
export const getOpeningBalanceSummary = query({
  args: {
    organization_id: v.id("organizations"),
    fiscal_year: v.string(),
  },
  handler: async (ctx, args) => {
    const openingBalances = await ctx.db
      .query("opening_balances")
      .withIndex("by_fiscal_year", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("fiscal_year", args.fiscal_year)
      )
      .collect();

    // Group by account type
    const summaryByType: { [key: string]: any } = {};

    for (const balance of openingBalances) {
      const account = await ctx.db.get(balance.account_id);
      if (account) {
        const accountType = account.account_type;
        
        if (!summaryByType[accountType]) {
          summaryByType[accountType] = {
            account_type: accountType,
            total_debits: 0,
            total_credits: 0,
            total_balance: 0,
            account_count: 0,
          };
        }

        summaryByType[accountType].total_debits += balance.opening_debit;
        summaryByType[accountType].total_credits += balance.opening_credit;
        summaryByType[accountType].total_balance += balance.opening_balance;
        summaryByType[accountType].account_count += 1;
      }
    }

    // Convert to array and sort by account type
    const summary = Object.values(summaryByType).sort((a: any, b: any) => 
      a.account_type.localeCompare(b.account_type)
    );

    // Calculate grand totals
    const grandTotals = {
      total_debits: summary.reduce((sum: number, item: any) => sum + item.total_debits, 0),
      total_credits: summary.reduce((sum: number, item: any) => sum + item.total_credits, 0),
      total_balance: summary.reduce((sum: number, item: any) => sum + item.total_balance, 0),
      total_accounts: summary.reduce((sum: number, item: any) => sum + item.account_count, 0),
    };

    return {
      summary_by_type: summary,
      grand_totals: grandTotals,
      is_balanced: Math.abs(grandTotals.total_debits - grandTotals.total_credits) < 0.01,
      fiscal_year: args.fiscal_year,
    };
  },
});
