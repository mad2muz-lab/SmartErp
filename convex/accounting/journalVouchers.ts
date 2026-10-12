import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ========================================
// JOURNAL VOUCHERS MODULE
// ========================================

// Create a journal voucher
export const createJournalVoucher = mutation({
  args: {
    organization_id: v.id("organizations"),
    voucher_date: v.string(),
    reference_number: v.optional(v.string()),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    created_by: v.id("user_profiles"),
    entries: v.array(v.object({
      account_id: v.id("chart_of_accounts"),
      debit_amount: v.number(),
      credit_amount: v.number(),
      description: v.string(),
      description_arabic: v.optional(v.string()),
      reference: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Validate that total debits equal total credits
    const totalDebits = args.entries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredits = args.entries.reduce((sum, entry) => sum + entry.credit_amount, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error("Total debits must equal total credits");
    }

    // Generate voucher number
    const voucherNumber = await generateVoucherNumber(ctx, args.organization_id);
    
    const now = new Date().toISOString();
    const fiscalYear = new Date(args.voucher_date).getFullYear().toString();
    const fiscalPeriod = `${fiscalYear}-${String(new Date(args.voucher_date).getMonth() + 1).padStart(2, '0')}`;

    // Create journal voucher
    const voucherId = await ctx.db.insert("journal_vouchers", {
      organization_id: args.organization_id,
      voucher_number: voucherNumber,
      voucher_date: args.voucher_date,
      reference_number: args.reference_number,
      description: args.description,
      description_arabic: args.description_arabic,
      total_debit: totalDebits,
      total_credit: totalCredits,
      currency: args.currency,
      exchange_rate: args.exchange_rate,
      status: "DRAFT",
      fiscal_year: fiscalYear,
      fiscal_period: fiscalPeriod,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });

    // Create voucher entries
    const entryIds = [];
    for (const entry of args.entries) {
      const entryId = await ctx.db.insert("journal_voucher_entries", {
        organization_id: args.organization_id,
        voucher_id: voucherId,
        account_id: entry.account_id,
        debit_amount: entry.debit_amount,
        credit_amount: entry.credit_amount,
        description: entry.description,
        description_arabic: entry.description_arabic,
        reference: entry.reference,
        created_at: now,
      });
      entryIds.push(entryId);
    }

    return {
      voucher_id: voucherId,
      voucher_number: voucherNumber,
      entry_ids: entryIds,
      message: "Journal voucher created successfully",
    };
  },
});

// Update a journal voucher (only if in DRAFT status)
export const updateJournalVoucher = mutation({
  args: {
    voucher_id: v.id("journal_vouchers"),
    voucher_date: v.optional(v.string()),
    reference_number: v.optional(v.string()),
    description: v.optional(v.string()),
    description_arabic: v.optional(v.string()),
    currency: v.optional(v.string()),
    exchange_rate: v.optional(v.number()),
    entries: v.optional(v.array(v.object({
      account_id: v.id("chart_of_accounts"),
      debit_amount: v.number(),
      credit_amount: v.number(),
      description: v.string(),
      description_arabic: v.optional(v.string()),
      reference: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const voucher = await ctx.db.get(args.voucher_id);
    if (!voucher) {
      throw new Error("Journal voucher not found");
    }

    if (voucher.status !== "DRAFT") {
      throw new Error("Cannot update posted or cancelled voucher");
    }

    const now = new Date().toISOString();
    let updateData: any = {
      updated_at: now,
    };

    // Update voucher fields
    if (args.voucher_date !== undefined) updateData.voucher_date = args.voucher_date;
    if (args.reference_number !== undefined) updateData.reference_number = args.reference_number;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.description_arabic !== undefined) updateData.description_arabic = args.description_arabic;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.exchange_rate !== undefined) updateData.exchange_rate = args.exchange_rate;

    // Update entries if provided
    if (args.entries) {
      // Validate that total debits equal total credits
      const totalDebits = args.entries.reduce((sum, entry) => sum + entry.debit_amount, 0);
      const totalCredits = args.entries.reduce((sum, entry) => sum + entry.credit_amount, 0);

      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error("Total debits must equal total credits");
      }

      updateData.total_debit = totalDebits;
      updateData.total_credit = totalCredits;

      // Delete existing entries
      const existingEntries = await ctx.db
        .query("journal_voucher_entries")
        .withIndex("by_voucher", (q) => 
          q.eq("organization_id", voucher.organization_id)
           .eq("voucher_id", args.voucher_id)
        )
        .collect();

      for (const entry of existingEntries) {
        await ctx.db.delete(entry._id);
      }

      // Create new entries
      for (const entry of args.entries) {
        await ctx.db.insert("journal_voucher_entries", {
          organization_id: voucher.organization_id,
          voucher_id: args.voucher_id,
          account_id: entry.account_id,
          debit_amount: entry.debit_amount,
          credit_amount: entry.credit_amount,
          description: entry.description,
          description_arabic: entry.description_arabic,
          reference: entry.reference,
          created_at: now,
        });
      }
    }

    await ctx.db.patch(args.voucher_id, updateData);

    return { message: "Journal voucher updated successfully" };
  },
});

// Post a journal voucher (move from DRAFT to POSTED)
export const postJournalVoucher = mutation({
  args: {
    voucher_id: v.id("journal_vouchers"),
    posted_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const voucher = await ctx.db.get(args.voucher_id);
    if (!voucher) {
      throw new Error("Journal voucher not found");
    }

    if (voucher.status !== "DRAFT") {
      throw new Error("Only draft vouchers can be posted");
    }

    // Get voucher entries
    const entries = await ctx.db
      .query("journal_voucher_entries")
      .withIndex("by_voucher", (q) => 
        q.eq("organization_id", voucher.organization_id)
         .eq("voucher_id", args.voucher_id)
      )
      .collect();

    if (entries.length === 0) {
      throw new Error("Cannot post voucher without entries");
    }

    const now = new Date().toISOString();
    const transactionId = `JV-${voucher.voucher_number}-${Date.now()}`;

    // Create general ledger entries
    const ledgerEntryIds = [];
    for (const entry of entries) {
      const ledgerEntryId = await ctx.db.insert("general_ledger", {
        organization_id: voucher.organization_id,
        account_id: entry.account_id,
        transaction_id: transactionId,
        transaction_type: "JOURNAL",
        reference_id: voucher.voucher_number,
        reference_type: "JOURNAL_VOUCHER",
        debit_amount: entry.debit_amount,
        credit_amount: entry.credit_amount,
        balance: 0, // Will be calculated by the ledger module
        currency: voucher.currency,
        exchange_rate: voucher.exchange_rate,
        description: entry.description,
        description_arabic: entry.description_arabic,
        transaction_date: voucher.voucher_date,
        fiscal_year: voucher.fiscal_year,
        fiscal_period: voucher.fiscal_period,
        created_by: args.posted_by as unknown as Id<"user_profiles">,
        created_at: now,
        updated_at: now,
      });
      ledgerEntryIds.push(ledgerEntryId);
    }

    // Update voucher status
    await ctx.db.patch(args.voucher_id, {
      status: "POSTED",
      posted_by: args.posted_by as unknown as Id<"user_profiles">,
      posted_at: now,
      updated_at: now,
    });

    return {
      message: "Journal voucher posted successfully",
      transaction_id: transactionId,
      ledger_entry_ids: ledgerEntryIds,
    };
  },
});

// Cancel a journal voucher
export const cancelJournalVoucher = mutation({
  args: {
    voucher_id: v.id("journal_vouchers"),
    cancelled_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const voucher = await ctx.db.get(args.voucher_id);
    if (!voucher) {
      throw new Error("Journal voucher not found");
    }

    if (voucher.status === "CANCELLED") {
      throw new Error("Voucher is already cancelled");
    }

    const now = new Date().toISOString();

    // If voucher is posted, we need to create reversing entries
    if (voucher.status === "POSTED") {
      // Find the general ledger entries for this voucher
      const ledgerEntries = await ctx.db
        .query("general_ledger")
        .withIndex("by_transaction", (q) => 
          q.eq("organization_id", voucher.organization_id)
           .eq("transaction_id", `JV-${voucher.voucher_number}-*`)
        )
        .collect();

      if (ledgerEntries.length > 0) {
        // Create reversing entries
        const reversalTransactionId = `REV-JV-${voucher.voucher_number}-${Date.now()}`;
        
        for (const entry of ledgerEntries) {
          await ctx.db.insert("general_ledger", {
            organization_id: voucher.organization_id,
            account_id: entry.account_id,
            transaction_id: reversalTransactionId,
            transaction_type: "JOURNAL",
            reference_id: voucher.voucher_number,
            reference_type: "JOURNAL_VOUCHER_CANCELLATION",
            debit_amount: entry.credit_amount, // Swap
            credit_amount: entry.debit_amount, // Swap
            balance: 0, // Will be calculated
            currency: entry.currency,
            exchange_rate: entry.exchange_rate,
            description: `CANCELLATION: ${entry.description}`,
            description_arabic: entry.description_arabic,
            transaction_date: now.split('T')[0],
            fiscal_year: voucher.fiscal_year,
            fiscal_period: voucher.fiscal_period,
            created_by: args.cancelled_by as unknown as Id<"user_profiles">,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    // Update voucher status
    await ctx.db.patch(args.voucher_id, {
      status: "CANCELLED",
      updated_at: now,
    });

    return { message: "Journal voucher cancelled successfully" };
  },
});

// Get journal vouchers
export const getJournalVouchers = query({
  args: {
    organization_id: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("DRAFT"),
      v.literal("POSTED"),
      v.literal("CANCELLED")
    )),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("journal_vouchers")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    const vouchers = await query.order("desc").collect();

    // Apply filters
    let filteredVouchers = vouchers;

    if (args.status) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.status === args.status);
    }

    if (args.start_date) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.voucher_date >= args.start_date!);
    }

    if (args.end_date) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.voucher_date <= args.end_date!);
    }

    if (args.fiscal_period) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.fiscal_period === args.fiscal_period);
    }

    return filteredVouchers;
  },
});

// Get journal voucher by ID
export const getJournalVoucher = query({
  args: {
    voucher_id: v.id("journal_vouchers"),
  },
  handler: async (ctx, args) => {
    const voucher = await ctx.db.get(args.voucher_id);
    if (!voucher) {
      return null;
    }

    // Get voucher entries
    const entries = await ctx.db
      .query("journal_voucher_entries")
      .withIndex("by_voucher", (q) => 
        q.eq("organization_id", voucher.organization_id)
         .eq("voucher_id", args.voucher_id)
      )
      .collect();

    return {
      ...voucher,
      entries: entries,
    };
  },
});

// Get journal voucher entries
export const getJournalVoucherEntries = query({
  args: {
    organization_id: v.id("organizations"),
    voucher_id: v.id("journal_vouchers"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("journal_voucher_entries")
      .withIndex("by_voucher", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("voucher_id", args.voucher_id)
      )
      .collect();
  },
});

// List journal vouchers (alias for getJournalVouchers for frontend compatibility)
export const listJournalVouchers = query({
  args: {
    organization_id: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("DRAFT"),
      v.literal("POSTED"),
      v.literal("CANCELLED")
    )),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("journal_vouchers")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    const vouchers = await query.order("desc").collect();

    // Apply filters
    let filteredVouchers = vouchers;

    if (args.status) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.status === args.status);
    }

    if (args.start_date) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.voucher_date >= args.start_date!);
    }

    if (args.end_date) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.voucher_date <= args.end_date!);
    }

    if (args.fiscal_period) {
      filteredVouchers = filteredVouchers.filter(voucher => voucher.fiscal_period === args.fiscal_period);
    }

    return filteredVouchers;
  },
});

// Helper function to generate voucher number
async function generateVoucherNumber(ctx: any, organizationId: any): Promise<string> {
  // Get accounting settings
  const settings = await ctx.db
    .query("accounting_settings")
    .withIndex("by_organization", (q: any) => q.eq("organization_id", organizationId))
    .first();

  const prefix = settings?.voucher_number_prefix || "JV";
  const currentYear = new Date().getFullYear();
  
  // Get the last voucher number for this year
  const lastVoucher = await ctx.db
    .query("journal_vouchers")
    .withIndex("by_organization", (q: any) => q.eq("organization_id", organizationId))
    .filter((q: any) => q.eq(q.field("fiscal_year"), currentYear.toString()))
    .order("desc")
    .first();

  let nextNumber = 1;
  if (lastVoucher) {
    const lastNumber = parseInt(lastVoucher.voucher_number.split('-').pop() || '0');
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}
