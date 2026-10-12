import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ========================================
// RECEIPTS MODULE
// ========================================

// Create a receipt
export const createReceipt = mutation({
  args: {
    organization_id: v.id("organizations"),
    receipt_date: v.string(),
    customer_id: v.optional(v.id("customers")),
    customer_name: v.optional(v.string()),
    payment_method: v.union(
      v.literal("CASH"),
      v.literal("BANK_TRANSFER"),
      v.literal("CHECK"),
      v.literal("CREDIT_CARD"),
      v.literal("OTHER")
    ),
    bank_account_id: v.optional(v.id("chart_of_accounts")),
    amount: v.number(),
    currency: v.string(),
    exchange_rate: v.optional(v.number()),
    description: v.string(),
    description_arabic: v.optional(v.string()),
    reference_invoice_ids: v.optional(v.array(v.string())),
    created_by: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new Error("Receipt amount must be greater than zero");
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(ctx, args.organization_id);
    
    const now = new Date().toISOString();
    const fiscalYear = new Date(args.receipt_date).getFullYear().toString();
    const fiscalPeriod = `${fiscalYear}-${String(new Date(args.receipt_date).getMonth() + 1).padStart(2, '0')}`;

    // Create receipt
    const receiptId = await ctx.db.insert("receipts", {
      organization_id: args.organization_id,
      receipt_number: receiptNumber,
      receipt_date: args.receipt_date,
      customer_id: args.customer_id,
      customer_name: args.customer_name,
      payment_method: args.payment_method,
      bank_account_id: args.bank_account_id,
      amount: args.amount,
      currency: args.currency,
      exchange_rate: args.exchange_rate,
      description: args.description,
      description_arabic: args.description_arabic,
      reference_invoice_ids: args.reference_invoice_ids,
      status: "DRAFT",
      fiscal_year: fiscalYear,
      fiscal_period: fiscalPeriod,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
    });

    return {
      receipt_id: receiptId,
      receipt_number: receiptNumber,
      message: "Receipt created successfully",
    };
  },
});

// Confirm a receipt (move from DRAFT to CONFIRMED and create ledger entries)
export const confirmReceipt = mutation({
  args: {
    receipt_id: v.id("receipts"),
    confirmed_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receipt_id);
    if (!receipt) {
      throw new Error("Receipt not found");
    }

    if (receipt.status !== "DRAFT") {
      throw new Error("Only draft receipts can be confirmed");
    }

    const now = new Date().toISOString();
    const transactionId = `RCP-${receipt.receipt_number}-${Date.now()}`;

    // Create general ledger entries
    const ledgerEntries = [];

    // 1. Debit: Cash/Bank Account
    if (receipt.bank_account_id) {
      // Bank transfer
      const bankEntryId = await ctx.db.insert("general_ledger", {
        organization_id: receipt.organization_id,
        account_id: receipt.bank_account_id,
        transaction_id: transactionId,
        transaction_type: "RECEIPT",
        reference_id: receipt.receipt_number,
        reference_type: "RECEIPT",
        debit_amount: receipt.amount,
        credit_amount: 0,
        balance: 0, // Will be calculated
        currency: receipt.currency,
        exchange_rate: receipt.exchange_rate,
        description: `Receipt from ${receipt.customer_name || 'Customer'}: ${receipt.description}`,
        description_arabic: receipt.description_arabic,
        transaction_date: receipt.receipt_date,
        fiscal_year: receipt.fiscal_year,
        fiscal_period: receipt.fiscal_period,
        created_by: args.confirmed_by as unknown as Id<"user_profiles">,
        created_at: now,
        updated_at: now,
      });
      ledgerEntries.push(bankEntryId);
    } else {
      // Cash receipt - need to find cash account
      const cashAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", receipt.organization_id)
           .eq("account_code", "1110") // Cash in Hand
        )
        .first();

      if (cashAccount) {
        const cashEntryId = await ctx.db.insert("general_ledger", {
          organization_id: receipt.organization_id,
          account_id: cashAccount._id,
          transaction_id: transactionId,
          transaction_type: "RECEIPT",
          reference_id: receipt.receipt_number,
          reference_type: "RECEIPT",
          debit_amount: receipt.amount,
          credit_amount: 0,
          balance: 0, // Will be calculated
          currency: receipt.currency,
          exchange_rate: receipt.exchange_rate,
          description: `Cash receipt from ${receipt.customer_name || 'Customer'}: ${receipt.description}`,
          description_arabic: receipt.description_arabic,
          transaction_date: receipt.receipt_date,
          fiscal_year: receipt.fiscal_year,
          fiscal_period: receipt.fiscal_period,
          created_by: args.confirmed_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(cashEntryId);
      }
    }

    // 2. Credit: Accounts Receivable (if customer specified)
    if (receipt.customer_id) {
      const arAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", receipt.organization_id)
           .eq("account_code", "1200") // Accounts Receivable
        )
        .first();

      if (arAccount) {
        const arEntryId = await ctx.db.insert("general_ledger", {
          organization_id: receipt.organization_id,
          account_id: arAccount._id,
          transaction_id: transactionId,
          transaction_type: "RECEIPT",
          reference_id: receipt.receipt_number,
          reference_type: "RECEIPT",
          debit_amount: 0,
          credit_amount: receipt.amount,
          balance: 0, // Will be calculated
          currency: receipt.currency,
          exchange_rate: receipt.exchange_rate,
          description: `Payment received from ${receipt.customer_name || 'Customer'}: ${receipt.description}`,
          description_arabic: receipt.description_arabic,
          transaction_date: receipt.receipt_date,
          fiscal_year: receipt.fiscal_year,
          fiscal_period: receipt.fiscal_period,
          created_by: args.confirmed_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(arEntryId);
      }
    } else {
      // Credit: Sales Revenue (for cash sales)
      const salesAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", receipt.organization_id)
           .eq("account_code", "4100") // Sales Revenue
        )
        .first();

      if (salesAccount) {
        const salesEntryId = await ctx.db.insert("general_ledger", {
          organization_id: receipt.organization_id,
          account_id: salesAccount._id,
          transaction_id: transactionId,
          transaction_type: "RECEIPT",
          reference_id: receipt.receipt_number,
          reference_type: "RECEIPT",
          debit_amount: 0,
          credit_amount: receipt.amount,
          balance: 0, // Will be calculated
          currency: receipt.currency,
          exchange_rate: receipt.exchange_rate,
          description: `Cash sale: ${receipt.description}`,
          description_arabic: receipt.description_arabic,
          transaction_date: receipt.receipt_date,
          fiscal_year: receipt.fiscal_year,
          fiscal_period: receipt.fiscal_period,
          created_by: args.confirmed_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(salesEntryId);
      }
    }

    // Update receipt status
    await ctx.db.patch(args.receipt_id, {
      status: "CONFIRMED",
      confirmed_by: args.confirmed_by as unknown as Id<"user_profiles">,
      confirmed_at: now,
      updated_at: now,
    });

    return {
      message: "Receipt confirmed successfully",
      transaction_id: transactionId,
      ledger_entry_ids: ledgerEntries,
    };
  },
});

// Update a receipt (only if in DRAFT status)
export const updateReceipt = mutation({
  args: {
    receipt_id: v.id("receipts"),
    receipt_date: v.optional(v.string()),
    customer_id: v.optional(v.id("customers")),
    customer_name: v.optional(v.string()),
    payment_method: v.optional(v.union(
      v.literal("CASH"),
      v.literal("BANK_TRANSFER"),
      v.literal("CHECK"),
      v.literal("CREDIT_CARD"),
      v.literal("OTHER")
    )),
    bank_account_id: v.optional(v.id("chart_of_accounts")),
    amount: v.optional(v.number()),
    currency: v.optional(v.string()),
    exchange_rate: v.optional(v.number()),
    description: v.optional(v.string()),
    description_arabic: v.optional(v.string()),
    reference_invoice_ids: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receipt_id);
    if (!receipt) {
      throw new Error("Receipt not found");
    }

    if (receipt.status !== "DRAFT") {
      throw new Error("Cannot update confirmed or cancelled receipt");
    }

    if (args.amount !== undefined && args.amount <= 0) {
      throw new Error("Receipt amount must be greater than zero");
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now,
    };

    // Update fields
    if (args.receipt_date !== undefined) updateData.receipt_date = args.receipt_date;
    if (args.customer_id !== undefined) updateData.customer_id = args.customer_id;
    if (args.customer_name !== undefined) updateData.customer_name = args.customer_name;
    if (args.payment_method !== undefined) updateData.payment_method = args.payment_method;
    if (args.bank_account_id !== undefined) updateData.bank_account_id = args.bank_account_id;
    if (args.amount !== undefined) updateData.amount = args.amount;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.exchange_rate !== undefined) updateData.exchange_rate = args.exchange_rate;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.description_arabic !== undefined) updateData.description_arabic = args.description_arabic;
    if (args.reference_invoice_ids !== undefined) updateData.reference_invoice_ids = args.reference_invoice_ids;

    // Update fiscal period if date changed
    if (args.receipt_date !== undefined) {
      const fiscalYear = new Date(args.receipt_date).getFullYear().toString();
      const fiscalPeriod = `${fiscalYear}-${String(new Date(args.receipt_date).getMonth() + 1).padStart(2, '0')}`;
      updateData.fiscal_year = fiscalYear;
      updateData.fiscal_period = fiscalPeriod;
    }

    await ctx.db.patch(args.receipt_id, updateData);

    return { message: "Receipt updated successfully" };
  },
});

// Cancel a receipt
export const cancelReceipt = mutation({
  args: {
    receipt_id: v.id("receipts"),
    cancelled_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const receipt = await ctx.db.get(args.receipt_id);
    if (!receipt) {
      throw new Error("Receipt not found");
    }

    if (receipt.status === "CANCELLED") {
      throw new Error("Receipt is already cancelled");
    }

    const now = new Date().toISOString();

    // If receipt is confirmed, we need to create reversing entries
    if (receipt.status === "CONFIRMED") {
      // Find the general ledger entries for this receipt
      const ledgerEntries = await ctx.db
        .query("general_ledger")
        .withIndex("by_transaction", (q) => 
          q.eq("organization_id", receipt.organization_id)
           .eq("transaction_id", `RCP-${receipt.receipt_number}-*`)
        )
        .collect();

      if (ledgerEntries.length > 0) {
        // Create reversing entries
        const reversalTransactionId = `REV-RCP-${receipt.receipt_number}-${Date.now()}`;
        
        for (const entry of ledgerEntries) {
          await ctx.db.insert("general_ledger", {
            organization_id: receipt.organization_id,
            account_id: entry.account_id,
            transaction_id: reversalTransactionId,
            transaction_type: "RECEIPT",
            reference_id: receipt.receipt_number,
            reference_type: "RECEIPT_CANCELLATION",
            debit_amount: entry.credit_amount, // Swap
            credit_amount: entry.debit_amount, // Swap
            balance: 0, // Will be calculated
            currency: entry.currency,
            exchange_rate: entry.exchange_rate,
            description: `CANCELLATION: ${entry.description}`,
            description_arabic: entry.description_arabic,
            transaction_date: now.split('T')[0],
            fiscal_year: receipt.fiscal_year,
            fiscal_period: receipt.fiscal_period,
            created_by: args.cancelled_by as unknown as Id<"user_profiles">,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    // Update receipt status
    await ctx.db.patch(args.receipt_id, {
      status: "CANCELLED",
      updated_at: now,
    });

    return { message: "Receipt cancelled successfully" };
  },
});

// List receipts (alias for getReceipts)
export const listReceipts = query({
  args: {
    organization_id: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("DRAFT"),
      v.literal("CONFIRMED"),
      v.literal("CANCELLED")
    )),
    customer_id: v.optional(v.id("customers")),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("receipts")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    const receipts = await query.order("desc").collect();

    // Apply filters
    let filteredReceipts = receipts;

    if (args.status) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.status === args.status);
    }

    if (args.customer_id) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.customer_id === args.customer_id);
    }

    if (args.start_date) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.receipt_date >= args.start_date!);
    }

    if (args.end_date) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.receipt_date <= args.end_date!);
    }

    if (args.fiscal_period) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.fiscal_period === args.fiscal_period);
    }

    return filteredReceipts;
  },
});

// Get receipts
export const getReceipts = query({
  args: {
    organization_id: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("DRAFT"),
      v.literal("CONFIRMED"),
      v.literal("CANCELLED")
    )),
    customer_id: v.optional(v.id("customers")),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("receipts")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    const receipts = await query.order("desc").collect();

    // Apply filters
    let filteredReceipts = receipts;

    if (args.status) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.status === args.status);
    }

    if (args.customer_id) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.customer_id === args.customer_id);
    }

    if (args.start_date) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.receipt_date >= args.start_date!);
    }

    if (args.end_date) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.receipt_date <= args.end_date!);
    }

    if (args.fiscal_period) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.fiscal_period === args.fiscal_period);
    }

    return filteredReceipts;
  },
});

// Get receipt by ID
export const getReceipt = query({
  args: {
    receipt_id: v.id("receipts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.receipt_id);
  },
});

// Get customer statement (receipts for a specific customer)
export const getCustomerReceipts = query({
  args: {
    organization_id: v.id("organizations"),
    customer_id: v.id("customers"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("receipts")
      .withIndex("by_customer", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("customer_id", args.customer_id)
      );

    const receipts = await query.order("asc").collect();

    // Apply date filters
    let filteredReceipts = receipts;
    if (args.start_date) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.receipt_date >= args.start_date!);
    }
    if (args.end_date) {
      filteredReceipts = filteredReceipts.filter(receipt => receipt.receipt_date <= args.end_date!);
    }

    // Calculate totals
    const totalAmount = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);
    const confirmedAmount = filteredReceipts
      .filter(receipt => receipt.status === "CONFIRMED")
      .reduce((sum, receipt) => sum + receipt.amount, 0);

    return {
      receipts: filteredReceipts,
      summary: {
        total_receipts: filteredReceipts.length,
        total_amount: totalAmount,
        confirmed_amount: confirmedAmount,
        draft_amount: totalAmount - confirmedAmount,
      },
    };
  },
});

// Helper function to generate receipt number
async function generateReceiptNumber(ctx: any, organizationId: any): Promise<string> {
  // Get accounting settings
  const settings = await ctx.db
    .query("accounting_settings")
    .withIndex("by_organization", (q: any) => q.eq("organization_id", organizationId))
    .first();

  const prefix = settings?.receipt_number_prefix || "RCP";
  const currentYear = new Date().getFullYear();
  
  // Get the last receipt number for this year
  const lastReceipt = await ctx.db
    .query("receipts")
    .withIndex("by_organization", (q: any) => q.eq("organization_id", organizationId))
    .filter((q: any) => q.eq(q.field("fiscal_year"), currentYear.toString()))
    .order("desc")
    .first();

  let nextNumber = 1;
  if (lastReceipt) {
    const lastNumber = parseInt(lastReceipt.receipt_number.split('-').pop() || '0');
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}
