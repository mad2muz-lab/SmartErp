import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ========================================
// PAYMENTS MODULE
// ========================================

// Create a payment
export const createPayment = mutation({
  args: {
    organization_id: v.id("organizations"),
    payment_date: v.string(),
    supplier_id: v.optional(v.id("suppliers")),
    supplier_name: v.optional(v.string()),
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
      throw new Error("Payment amount must be greater than zero");
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(ctx, args.organization_id);
    
    const now = new Date().toISOString();
    const fiscalYear = new Date(args.payment_date).getFullYear().toString();
    const fiscalPeriod = `${fiscalYear}-${String(new Date(args.payment_date).getMonth() + 1).padStart(2, '0')}`;

    // Create payment
    const paymentId = await ctx.db.insert("payments", {
      organization_id: args.organization_id,
      payment_number: paymentNumber,
      payment_date: args.payment_date,
      supplier_id: args.supplier_id,
      supplier_name: args.supplier_name,
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
      payment_id: paymentId,
      payment_number: paymentNumber,
      message: "Payment created successfully",
    };
  },
});

// Confirm a payment (move from DRAFT to CONFIRMED and create ledger entries)
export const confirmPayment = mutation({
  args: {
    payment_id: v.id("payments"),
    confirmed_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.payment_id);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "DRAFT") {
      throw new Error("Only draft payments can be confirmed");
    }

    const now = new Date().toISOString();
    const transactionId = `PAY-${payment.payment_number}-${Date.now()}`;

    // Create general ledger entries
    const ledgerEntries = [];

    // 1. Credit: Cash/Bank Account (decrease asset)
    if (payment.bank_account_id) {
      // Bank transfer
      const bankEntryId = await ctx.db.insert("general_ledger", {
        organization_id: payment.organization_id,
        account_id: payment.bank_account_id,
        transaction_id: transactionId,
        transaction_type: "PAYMENT",
        reference_id: payment.payment_number,
        reference_type: "PAYMENT",
        debit_amount: 0,
        credit_amount: payment.amount,
        balance: 0, // Will be calculated
        currency: payment.currency,
        exchange_rate: payment.exchange_rate,
        description: `Payment to ${payment.supplier_name || 'Supplier'}: ${payment.description}`,
        description_arabic: payment.description_arabic,
        transaction_date: payment.payment_date,
        fiscal_year: payment.fiscal_year,
        fiscal_period: payment.fiscal_period,
        created_by: args.confirmed_by as unknown as Id<"user_profiles">,
        created_at: now,
        updated_at: now,
      });
      ledgerEntries.push(bankEntryId);
    } else {
      // Cash payment - need to find cash account
      const cashAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", payment.organization_id)
           .eq("account_code", "1110") // Cash in Hand
        )
        .first();

      if (cashAccount) {
        const cashEntryId = await ctx.db.insert("general_ledger", {
          organization_id: payment.organization_id,
          account_id: cashAccount._id,
          transaction_id: transactionId,
          transaction_type: "PAYMENT",
          reference_id: payment.payment_number,
          reference_type: "PAYMENT",
          debit_amount: 0,
          credit_amount: payment.amount,
          balance: 0, // Will be calculated
          currency: payment.currency,
          exchange_rate: payment.exchange_rate,
          description: `Cash payment to ${payment.supplier_name || 'Supplier'}: ${payment.description}`,
          description_arabic: payment.description_arabic,
          transaction_date: payment.payment_date,
          fiscal_year: payment.fiscal_year,
          fiscal_period: payment.fiscal_period,
          created_by: args.confirmed_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(cashEntryId);
      }
    }

    // 2. Debit: Accounts Payable (if supplier specified)
    if (payment.supplier_id) {
      const apAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", payment.organization_id)
           .eq("account_code", "2100") // Accounts Payable
        )
        .first();

      if (apAccount) {
        const apEntryId = await ctx.db.insert("general_ledger", {
          organization_id: payment.organization_id,
          account_id: apAccount._id,
          transaction_id: transactionId,
          transaction_type: "PAYMENT",
          reference_id: payment.payment_number,
          reference_type: "PAYMENT",
          debit_amount: payment.amount,
          credit_amount: 0,
          balance: 0, // Will be calculated
          currency: payment.currency,
          exchange_rate: payment.exchange_rate,
          description: `Payment to ${payment.supplier_name || 'Supplier'}: ${payment.description}`,
          description_arabic: payment.description_arabic,
          transaction_date: payment.payment_date,
          fiscal_year: payment.fiscal_year,
          fiscal_period: payment.fiscal_period,
          created_by: args.confirmed_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(apEntryId);
      }
    } else {
      // Debit: Expense Account (for cash purchases)
      const expenseAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", payment.organization_id)
           .eq("account_code", "5200") // Administrative Expenses
        )
        .first();

      if (expenseAccount) {
        const expenseEntryId = await ctx.db.insert("general_ledger", {
          organization_id: payment.organization_id,
          account_id: expenseAccount._id,
          transaction_id: transactionId,
          transaction_type: "PAYMENT",
          reference_id: payment.payment_number,
          reference_type: "PAYMENT",
          debit_amount: payment.amount,
          credit_amount: 0,
          balance: 0, // Will be calculated
          currency: payment.currency,
          exchange_rate: payment.exchange_rate,
          description: `Cash purchase: ${payment.description}`,
          description_arabic: payment.description_arabic,
          transaction_date: payment.payment_date,
          fiscal_year: payment.fiscal_year,
          fiscal_period: payment.fiscal_period,
          created_by: args.confirmed_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(expenseEntryId);
      }
    }

    // Update payment status
    await ctx.db.patch(args.payment_id, {
      status: "CONFIRMED",
      confirmed_by: args.confirmed_by as unknown as Id<"user_profiles">,
      confirmed_at: now,
      updated_at: now,
    });

    return {
      message: "Payment confirmed successfully",
      transaction_id: transactionId,
      ledger_entry_ids: ledgerEntries,
    };
  },
});

// Update a payment (only if in DRAFT status)
export const updatePayment = mutation({
  args: {
    payment_id: v.id("payments"),
    payment_date: v.optional(v.string()),
    supplier_id: v.optional(v.id("suppliers")),
    supplier_name: v.optional(v.string()),
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
    const payment = await ctx.db.get(args.payment_id);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status !== "DRAFT") {
      throw new Error("Cannot update confirmed or cancelled payment");
    }

    if (args.amount !== undefined && args.amount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const now = new Date().toISOString();
    const updateData: any = {
      updated_at: now,
    };

    // Update fields
    if (args.payment_date !== undefined) updateData.payment_date = args.payment_date;
    if (args.supplier_id !== undefined) updateData.supplier_id = args.supplier_id;
    if (args.supplier_name !== undefined) updateData.supplier_name = args.supplier_name;
    if (args.payment_method !== undefined) updateData.payment_method = args.payment_method;
    if (args.bank_account_id !== undefined) updateData.bank_account_id = args.bank_account_id;
    if (args.amount !== undefined) updateData.amount = args.amount;
    if (args.currency !== undefined) updateData.currency = args.currency;
    if (args.exchange_rate !== undefined) updateData.exchange_rate = args.exchange_rate;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.description_arabic !== undefined) updateData.description_arabic = args.description_arabic;
    if (args.reference_invoice_ids !== undefined) updateData.reference_invoice_ids = args.reference_invoice_ids;

    // Update fiscal period if date changed
    if (args.payment_date !== undefined) {
      const fiscalYear = new Date(args.payment_date).getFullYear().toString();
      const fiscalPeriod = `${fiscalYear}-${String(new Date(args.payment_date).getMonth() + 1).padStart(2, '0')}`;
      updateData.fiscal_year = fiscalYear;
      updateData.fiscal_period = fiscalPeriod;
    }

    await ctx.db.patch(args.payment_id, updateData);

    return { message: "Payment updated successfully" };
  },
});

// Cancel a payment
export const cancelPayment = mutation({
  args: {
    payment_id: v.id("payments"),
    cancelled_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.payment_id);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status === "CANCELLED") {
      throw new Error("Payment is already cancelled");
    }

    const now = new Date().toISOString();

    // If payment is confirmed, we need to create reversing entries
    if (payment.status === "CONFIRMED") {
      // Find the general ledger entries for this payment
      const ledgerEntries = await ctx.db
        .query("general_ledger")
        .withIndex("by_transaction", (q) => 
          q.eq("organization_id", payment.organization_id)
           .eq("transaction_id", `PAY-${payment.payment_number}-*`)
        )
        .collect();

      if (ledgerEntries.length > 0) {
        // Create reversing entries
        const reversalTransactionId = `REV-PAY-${payment.payment_number}-${Date.now()}`;
        
        for (const entry of ledgerEntries) {
          await ctx.db.insert("general_ledger", {
            organization_id: payment.organization_id,
            account_id: entry.account_id,
            transaction_id: reversalTransactionId,
            transaction_type: "PAYMENT",
            reference_id: payment.payment_number,
            reference_type: "PAYMENT_CANCELLATION",
            debit_amount: entry.credit_amount, // Swap
            credit_amount: entry.debit_amount, // Swap
            balance: 0, // Will be calculated
            currency: entry.currency,
            exchange_rate: entry.exchange_rate,
            description: `CANCELLATION: ${entry.description}`,
            description_arabic: entry.description_arabic,
            transaction_date: now.split('T')[0],
            fiscal_year: payment.fiscal_year,
            fiscal_period: payment.fiscal_period,
            created_by: args.cancelled_by as unknown as Id<"user_profiles">,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }

    // Update payment status
    await ctx.db.patch(args.payment_id, {
      status: "CANCELLED",
      updated_at: now,
    });

    return { message: "Payment cancelled successfully" };
  },
});

// List payments (alias for getPayments)
export const listPayments = query({
  args: {
    organization_id: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("DRAFT"),
      v.literal("CONFIRMED"),
      v.literal("CANCELLED")
    )),
    supplier_id: v.optional(v.id("suppliers")),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    const payments = await query.order("desc").collect();

    // Apply filters
    let filteredPayments = payments;

    if (args.status) {
      filteredPayments = filteredPayments.filter(payment => payment.status === args.status);
    }

    if (args.supplier_id) {
      filteredPayments = filteredPayments.filter(payment => payment.supplier_id === args.supplier_id);
    }

    if (args.start_date) {
      filteredPayments = filteredPayments.filter(payment => payment.payment_date >= args.start_date!);
    }

    if (args.end_date) {
      filteredPayments = filteredPayments.filter(payment => payment.payment_date <= args.end_date!);
    }

    if (args.fiscal_period) {
      filteredPayments = filteredPayments.filter(payment => payment.fiscal_period === args.fiscal_period);
    }

    return filteredPayments;
  },
});

// Get payments
export const getPayments = query({
  args: {
    organization_id: v.id("organizations"),
    status: v.optional(v.union(
      v.literal("DRAFT"),
      v.literal("CONFIRMED"),
      v.literal("CANCELLED")
    )),
    supplier_id: v.optional(v.id("suppliers")),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("payments")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      );

    const payments = await query.order("desc").collect();

    // Apply filters
    let filteredPayments = payments;

    if (args.status) {
      filteredPayments = filteredPayments.filter(payment => payment.status === args.status);
    }

    if (args.supplier_id) {
      filteredPayments = filteredPayments.filter(payment => payment.supplier_id === args.supplier_id);
    }

    if (args.start_date) {
      filteredPayments = filteredPayments.filter(payment => payment.payment_date >= args.start_date!);
    }

    if (args.end_date) {
      filteredPayments = filteredPayments.filter(payment => payment.payment_date <= args.end_date!);
    }

    if (args.fiscal_period) {
      filteredPayments = filteredPayments.filter(payment => payment.fiscal_period === args.fiscal_period);
    }

    return filteredPayments;
  },
});

// Get payment by ID
export const getPayment = query({
  args: {
    payment_id: v.id("payments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.payment_id);
  },
});

// Get supplier statement (payments for a specific supplier)
export const getSupplierPayments = query({
  args: {
    organization_id: v.id("organizations"),
    supplier_id: v.id("suppliers"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("payments")
      .withIndex("by_supplier", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("supplier_id", args.supplier_id)
      );

    const payments = await query.order("asc").collect();

    // Apply date filters
    let filteredPayments = payments;
    if (args.start_date) {
      filteredPayments = filteredPayments.filter(payment => payment.payment_date >= args.start_date!);
    }
    if (args.end_date) {
      filteredPayments = filteredPayments.filter(payment => payment.payment_date <= args.end_date!);
    }

    // Calculate totals
    const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const confirmedAmount = filteredPayments
      .filter(payment => payment.status === "CONFIRMED")
      .reduce((sum, payment) => sum + payment.amount, 0);

    return {
      payments: filteredPayments,
      summary: {
        total_payments: filteredPayments.length,
        total_amount: totalAmount,
        confirmed_amount: confirmedAmount,
        draft_amount: totalAmount - confirmedAmount,
      },
    };
  },
});

// Helper function to generate payment number
async function generatePaymentNumber(ctx: any, organizationId: any): Promise<string> {
  // Get accounting settings
  const settings = await ctx.db
    .query("accounting_settings")
    .withIndex("by_organization", (q: any) => q.eq("organization_id", organizationId))
    .first();

  const prefix = settings?.payment_number_prefix || "PAY";
  const currentYear = new Date().getFullYear();
  
  // Get the last payment number for this year
  const lastPayment = await ctx.db
    .query("payments")
    .withIndex("by_organization", (q: any) => q.eq("organization_id", organizationId))
    .filter((q: any) => q.eq(q.field("fiscal_year"), currentYear.toString()))
    .order("desc")
    .first();

  let nextNumber = 1;
  if (lastPayment) {
    const lastNumber = parseInt(lastPayment.payment_number.split('-').pop() || '0');
    nextNumber = lastNumber + 1;
  }

  return `${prefix}-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
}
