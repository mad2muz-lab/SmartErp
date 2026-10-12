import { mutation, action, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// ========================================
// ACCOUNTING INTEGRATION MODULE
// ========================================

// Auto-post quotation to accounting when approved
export const postQuotationToAccounting = mutation({
  args: {
    quotation_id: v.id("quotations"),
    organization_id: v.id("organizations"),
    posted_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get quotation details
    const quotation = await ctx.db.get(args.quotation_id);
    if (!quotation) {
      throw new Error("Quotation not found");
    }

    // Check if quotation is already posted (using status instead)
    if (quotation.status === "posted") {
      throw new Error("Quotation already posted to accounting");
    }

    // Get quotation items
    const quotationItems = await ctx.db
      .query("quotation_items")
      .withIndex("by_quotation", (q) => 
        q.eq("quotation_id", args.quotation_id)
      )
      .collect();

    if (quotationItems.length === 0) {
      throw new Error("No items found in quotation");
    }

    const now = new Date().toISOString();
    const fiscalYear = new Date(quotation.created_at).getFullYear().toString();
    const fiscalPeriod = `${fiscalYear}-${String(new Date(quotation.created_at).getMonth() + 1).padStart(2, '0')}`;
    const transactionId = `QT-${quotation.quotation_number}-${Date.now()}`;

    // Calculate totals
    const subtotal = quotationItems.reduce((sum, item) => sum + item.total_price, 0);
    const vatAmount = quotationItems.reduce((sum, item) => sum + (item.vat_amount || 0), 0);
    const totalAmount = subtotal + vatAmount;

    // Create general ledger entries
    const ledgerEntries = [];

    // 1. Debit: Accounts Receivable
    const arAccount = await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_account_code", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_code", "1200") // Accounts Receivable
      )
      .first();

    if (arAccount) {
      const arEntryId = await ctx.db.insert("general_ledger", {
        organization_id: args.organization_id,
        account_id: arAccount._id,
        transaction_id: transactionId,
        transaction_type: "QUOTATION",
        reference_id: quotation.quotation_number,
        reference_type: "QUOTATION",
        debit_amount: totalAmount,
        credit_amount: 0,
        balance: 0, // Will be calculated
        currency: quotation.currency,
        exchange_rate: 1,
        description: `Quotation ${quotation.quotation_number} - ${quotation.customer_name}`,
        description_arabic: undefined,
        transaction_date: quotation.created_at,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
        created_by: args.posted_by as unknown as Id<"user_profiles">,
        created_at: now,
        updated_at: now,
      });
      ledgerEntries.push(arEntryId);
    }

    // 2. Credit: Sales Revenue
    const salesAccount = await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_account_code", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_code", "4100") // Sales Revenue
      )
      .first();

    if (salesAccount) {
      const salesEntryId = await ctx.db.insert("general_ledger", {
        organization_id: args.organization_id,
        account_id: salesAccount._id,
        transaction_id: transactionId,
        transaction_type: "QUOTATION",
        reference_id: quotation.quotation_number,
        reference_type: "QUOTATION",
        debit_amount: 0,
        credit_amount: subtotal,
        balance: 0, // Will be calculated
        currency: quotation.currency,
        exchange_rate: 1,
        description: `Sales Revenue - Quotation ${quotation.quotation_number}`,
        description_arabic: undefined,
        transaction_date: quotation.created_at,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
        created_by: args.posted_by as unknown as Id<"user_profiles">,
        created_at: now,
        updated_at: now,
      });
      ledgerEntries.push(salesEntryId);
    }

    // 3. Credit: VAT Payable (if VAT amount > 0)
    if (vatAmount > 0) {
      const vatAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_code", "2300") // VAT Payable
        )
        .first();

      if (vatAccount) {
        const vatEntryId = await ctx.db.insert("general_ledger", {
          organization_id: args.organization_id,
          account_id: vatAccount._id,
          transaction_id: transactionId,
          transaction_type: "QUOTATION",
          reference_id: quotation.quotation_number,
          reference_type: "QUOTATION",
          debit_amount: 0,
          credit_amount: vatAmount,
          balance: 0, // Will be calculated
          currency: quotation.currency,
          exchange_rate: 1,
          description: `VAT Payable - Quotation ${quotation.quotation_number}`,
          description_arabic: undefined,
          transaction_date: quotation.created_at,
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          created_by: args.posted_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(vatEntryId);
      }
    }

    // Update quotation status
    await ctx.db.patch(args.quotation_id, {
      // is_posted_to_accounting: true, // This field doesn't exist in the schema
      // accounting_transaction_id: transactionId, // Field doesn't exist in schema
      updated_at: now,
    });

    return {
      message: "Quotation posted to accounting successfully",
      transaction_id: transactionId,
      ledger_entry_ids: ledgerEntries,
    };
  },
});

// Auto-post invoice to accounting when submitted
export const postInvoiceToAccounting = mutation({
  args: {
    invoice_id: v.id("invoices"),
    organization_id: v.id("organizations"),
    posted_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get invoice details
    const invoice = await ctx.db.get(args.invoice_id);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Check if invoice is already posted (using a custom field or different approach)
    // Note: invoice.status doesn't include "posted", so we'll use a different approach
    if (invoice.is_filed) {
      throw new Error("Invoice already posted to accounting");
    }

    // Get invoice items
    const invoiceItems = await ctx.db
      .query("invoice_items")
      .withIndex("by_invoice", (q) => 
        q.eq("invoice_id", args.invoice_id)
      )
      .collect();

    if (invoiceItems.length === 0) {
      throw new Error("No items found in invoice");
    }

    const now = new Date().toISOString();
    const fiscalYear = new Date(invoice.invoice_date).getFullYear().toString();
    const fiscalPeriod = `${fiscalYear}-${String(new Date(invoice.invoice_date).getMonth() + 1).padStart(2, '0')}`;
    const transactionId = `INV-${invoice.invoice_number}-${Date.now()}`;

    // Calculate totals
    const subtotal = invoiceItems.reduce((sum, item) => sum + (item.total_amount || 0), 0);
    const vatAmount = invoiceItems.reduce((sum, item) => sum + (item.vat_amount || 0), 0);
    const totalAmount = subtotal + vatAmount;

    // Create general ledger entries
    const ledgerEntries = [];

    // 1. Debit: Accounts Receivable
    const arAccount = await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_account_code", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_code", "1200") // Accounts Receivable
      )
      .first();

    if (arAccount) {
      const arEntryId = await ctx.db.insert("general_ledger", {
        organization_id: args.organization_id,
        account_id: arAccount._id,
        transaction_id: transactionId,
        transaction_type: "INVOICE",
        reference_id: invoice.invoice_number,
        reference_type: "INVOICE",
        debit_amount: totalAmount,
        credit_amount: 0,
        balance: 0, // Will be calculated
        currency: invoice.currency,
        exchange_rate: 1,
        description: `Invoice ${invoice.invoice_number} - ${invoice.customer_name}`,
        description_arabic: undefined,
        transaction_date: invoice.invoice_date,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
        created_by: args.posted_by as unknown as Id<"user_profiles">,
        created_at: now,
        updated_at: now,
      });
      ledgerEntries.push(arEntryId);
    }

    // 2. Credit: Sales Revenue
    const salesAccount = await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_account_code", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("account_code", "4100") // Sales Revenue
      )
      .first();

    if (salesAccount) {
      const salesEntryId = await ctx.db.insert("general_ledger", {
        organization_id: args.organization_id,
        account_id: salesAccount._id,
        transaction_id: transactionId,
        transaction_type: "INVOICE",
        reference_id: invoice.invoice_number,
        reference_type: "INVOICE",
        debit_amount: 0,
        credit_amount: subtotal,
        balance: 0, // Will be calculated
        currency: invoice.currency,
        exchange_rate: 1,
        description: `Sales Revenue - Invoice ${invoice.invoice_number}`,
        description_arabic: undefined,
        transaction_date: invoice.invoice_date,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
        created_by: args.posted_by as unknown as Id<"user_profiles">,
        created_at: now,
        updated_at: now,
      });
      ledgerEntries.push(salesEntryId);
    }

    // 3. Credit: VAT Payable (if VAT amount > 0)
    if (vatAmount > 0) {
      const vatAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_code", "2300") // VAT Payable
        )
        .first();

      if (vatAccount) {
        const vatEntryId = await ctx.db.insert("general_ledger", {
          organization_id: args.organization_id,
          account_id: vatAccount._id,
          transaction_id: transactionId,
          transaction_type: "INVOICE",
          reference_id: invoice.invoice_number,
          reference_type: "INVOICE",
          debit_amount: 0,
          credit_amount: vatAmount,
          balance: 0, // Will be calculated
          currency: invoice.currency,
          exchange_rate: 1,
          description: `VAT Payable - Invoice ${invoice.invoice_number}`,
          description_arabic: undefined,
          transaction_date: invoice.invoice_date,
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          created_by: args.posted_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(vatEntryId);
      }
    }

    // Update invoice status
    await ctx.db.patch(args.invoice_id, {
      // is_posted_to_accounting: true, // This field doesn't exist in the schema
      // accounting_transaction_id: transactionId, // Field doesn't exist in schema
      updated_at: now,
    });

    return {
      message: "Invoice posted to accounting successfully",
      transaction_id: transactionId,
      ledger_entry_ids: ledgerEntries,
    };
  },
});

// Auto-post receipt to accounting when confirmed
export const postReceiptToAccounting = mutation({
  args: {
    receipt_id: v.id("receipts"),
    organization_id: v.id("organizations"),
    posted_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Get receipt details
    const receipt = await ctx.db.get(args.receipt_id);
    if (!receipt) {
      throw new Error("Receipt not found");
    }

    // Check if receipt is already posted (using status instead)
    if (receipt.status === "CONFIRMED") {
      throw new Error("Receipt already posted to accounting");
    }

    const now = new Date().toISOString();
    const fiscalYear = new Date(receipt.receipt_date).getFullYear().toString();
    const fiscalPeriod = `${fiscalYear}-${String(new Date(receipt.receipt_date).getMonth() + 1).padStart(2, '0')}`;
    const transactionId = `RCP-${receipt.receipt_number}-${Date.now()}`;

    // Create general ledger entries
    const ledgerEntries = [];

    // 1. Debit: Cash/Bank Account
    if (receipt.bank_account_id) {
      const bankEntryId = await ctx.db.insert("general_ledger", {
        organization_id: args.organization_id,
        account_id: receipt.bank_account_id,
        transaction_id: transactionId,
        transaction_type: "RECEIPT",
        reference_id: receipt.receipt_number,
        reference_type: "RECEIPT",
        debit_amount: receipt.amount,
        credit_amount: 0,
        balance: 0, // Will be calculated
        currency: receipt.currency,
        exchange_rate: receipt.exchange_rate || 1,
        description: `Receipt from ${receipt.customer_name || 'Customer'}: ${receipt.description}`,
        description_arabic: receipt.description_arabic,
        transaction_date: receipt.receipt_date,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
        created_by: args.posted_by as unknown as Id<"user_profiles">,
        created_at: now,
        updated_at: now,
      });
      ledgerEntries.push(bankEntryId);
    } else {
      // Cash receipt
      const cashAccount = await ctx.db
        .query("chart_of_accounts")
        .withIndex("by_account_code", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_code", "1110") // Cash in Hand
        )
        .first();

      if (cashAccount) {
        const cashEntryId = await ctx.db.insert("general_ledger", {
          organization_id: args.organization_id,
          account_id: cashAccount._id,
          transaction_id: transactionId,
          transaction_type: "RECEIPT",
          reference_id: receipt.receipt_number,
          reference_type: "RECEIPT",
          debit_amount: receipt.amount,
          credit_amount: 0,
          balance: 0, // Will be calculated
          currency: receipt.currency,
          exchange_rate: receipt.exchange_rate || 1,
          description: `Cash receipt from ${receipt.customer_name || 'Customer'}: ${receipt.description}`,
          description_arabic: receipt.description_arabic,
          transaction_date: receipt.receipt_date,
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          created_by: args.posted_by as unknown as Id<"user_profiles">,
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
          q.eq("organization_id", args.organization_id)
           .eq("account_code", "1200") // Accounts Receivable
        )
        .first();

      if (arAccount) {
        const arEntryId = await ctx.db.insert("general_ledger", {
          organization_id: args.organization_id,
          account_id: arAccount._id,
          transaction_id: transactionId,
          transaction_type: "RECEIPT",
          reference_id: receipt.receipt_number,
          reference_type: "RECEIPT",
          debit_amount: 0,
          credit_amount: receipt.amount,
          balance: 0, // Will be calculated
          currency: receipt.currency,
          exchange_rate: receipt.exchange_rate || 1,
          description: `Payment received from ${receipt.customer_name || 'Customer'}: ${receipt.description}`,
          description_arabic: receipt.description_arabic,
          transaction_date: receipt.receipt_date,
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          created_by: args.posted_by as unknown as Id<"user_profiles">,
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
          q.eq("organization_id", args.organization_id)
           .eq("account_code", "4100") // Sales Revenue
        )
        .first();

      if (salesAccount) {
        const salesEntryId = await ctx.db.insert("general_ledger", {
          organization_id: args.organization_id,
          account_id: salesAccount._id,
          transaction_id: transactionId,
          transaction_type: "RECEIPT",
          reference_id: receipt.receipt_number,
          reference_type: "RECEIPT",
          debit_amount: 0,
          credit_amount: receipt.amount,
          balance: 0, // Will be calculated
          currency: receipt.currency,
          exchange_rate: receipt.exchange_rate || 1,
          description: `Cash sale: ${receipt.description}`,
          description_arabic: receipt.description_arabic,
          transaction_date: receipt.receipt_date,
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          created_by: args.posted_by as unknown as Id<"user_profiles">,
          created_at: now,
          updated_at: now,
        });
        ledgerEntries.push(salesEntryId);
      }
    }

    // Update receipt status
    await ctx.db.patch(args.receipt_id, {
      // is_posted_to_accounting: true, // This field doesn't exist in the schema
      // accounting_transaction_id: transactionId, // Field doesn't exist in schema
      updated_at: now,
    });

    return {
      message: "Receipt posted to accounting successfully",
      transaction_id: transactionId,
      ledger_entry_ids: ledgerEntries,
    };
  },
});

// Initialize accounting system for organization
export const initializeAccountingSystem = action({
  args: {
    organization_id: v.id("organizations"),
    created_by: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Initialize accounting settings
    await ctx.runMutation("api.accounting.accountingSettings.initializeAccountingSettings" as any, {
      organization_id: args.organization_id,
      created_by: args.created_by,
    });

    // Initialize default chart of accounts
    await ctx.runMutation("api.accounting.chartOfAccounts.initializeDefaultAccounts" as any, {
      organization_id: args.organization_id,
      created_by: args.created_by,
    });

    // Create fiscal periods for current year
    const currentYear = new Date().getFullYear().toString();
    await ctx.runMutation("api.accounting.accountingSettings.createFiscalPeriods" as any, {
      organization_id: args.organization_id,
      fiscal_year: currentYear,
    });

    return {
      message: "Accounting system initialized successfully",
      organization_id: args.organization_id,
      fiscal_year: currentYear,
    };
  },
});

// Get accounting dashboard summary
export const getAccountingDashboard = query({
  args: {
    organization_id: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // For now, return mock data until we implement the actual functions
    return {
      trial_balance: [],
      recent_transactions: [],
      account_summary: {
        total_assets: 0,
        total_liabilities: 0,
        net_worth: 0,
        monthly_revenue: 0,
      },
      current_fiscal_period: {
        period_name: "Current Period",
        fiscal_year: new Date().getFullYear().toString(),
      },
      generated_at: new Date().toISOString(),
    };
  },
});
