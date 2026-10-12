import { query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";

// Type definitions for report data
interface AccountData {
  account_id: Id<"chart_of_accounts">;
  account_code: string;
  account_name: string;
  balance: number;
  debit_balance: number;
  credit_balance: number;
}

// ========================================
// FINANCIAL REPORTS MODULE
// ========================================

// Get Balance Sheet (alias for generateBalanceSheet)
export const getBalanceSheet = query({
  args: {
    organization_id: v.id("organizations"),
    as_of_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // For now, return null to indicate no data available
    // This will be replaced with actual implementation later
    return null;
  },
});

// Get Profit & Loss (alias for generateProfitLossStatement)
export const getProfitLoss = query({
  args: {
    organization_id: v.id("organizations"),
    start_date: v.string(),
    end_date: v.string(),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // For now, return null to indicate no data available
    // This will be replaced with actual implementation later
    return null;
  },
});

// Get Trial Balance
export const getTrialBalance = query({
  args: {
    organization_id: v.id("organizations"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    as_of_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // For now, return empty array to indicate no data available
    // This will be replaced with actual implementation later
    return [];
  },
});

// Get General Ledger (alias for generateGeneralLedgerReport)
export const getGeneralLedger = query({
  args: {
    organization_id: v.id("organizations"),
    account_id: v.optional(v.id("chart_of_accounts")),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // For now, return empty array to indicate no data available
    // This will be replaced with actual implementation later
    return [];
  },
});

// Generate Balance Sheet
export const generateBalanceSheet = query({
  args: {
    organization_id: v.id("organizations"),
    as_of_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asOfDate = args.as_of_date || new Date().toISOString().split('T')[0];
    
    // Get all active accounts
    const accounts = await ctx.db
      .query("chart_of_accounts")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      )
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    // Get organization details
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const balanceSheet = {
      organization_name: organization.name,
      report_date: asOfDate,
      fiscal_period: args.fiscal_period,
      assets: {
        current_assets: [] as AccountData[],
        fixed_assets: [] as AccountData[],
        total_current_assets: 0,
        total_fixed_assets: 0,
        total_assets: 0,
      },
      liabilities: {
        current_liabilities: [] as AccountData[],
        long_term_liabilities: [] as AccountData[],
        total_current_liabilities: 0,
        total_long_term_liabilities: 0,
        total_liabilities: 0,
      },
      equity: {
        owner_equity: [] as AccountData[],
        total_equity: 0,
      },
    };

    // Process each account
    for (const account of accounts) {
      // Get account balance
      const ledgerEntries = await ctx.db
        .query("general_ledger")
        .withIndex("by_account", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_id", account._id)
        )
        .collect();

      // Apply date filter
      let filteredEntries = ledgerEntries;
      if (args.as_of_date) {
        filteredEntries = ledgerEntries.filter(entry => entry.transaction_date <= asOfDate);
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
        const accountData = {
          account_id: account._id,
          account_code: account.account_code,
          account_name: account.account_name,
          balance: balance,
          debit_balance: balance > 0 ? balance : 0,
          credit_balance: balance < 0 ? Math.abs(balance) : 0,
        };

        // Categorize by account type
        switch (account.account_type) {
          case "ASSET":
            if (account.account_category.includes("Current")) {
              balanceSheet.assets.current_assets.push(accountData);
              balanceSheet.assets.total_current_assets += accountData.debit_balance;
            } else {
              balanceSheet.assets.fixed_assets.push(accountData);
              balanceSheet.assets.total_fixed_assets += accountData.debit_balance;
            }
            break;
          
          case "LIABILITY":
            if (account.account_category.includes("Current")) {
              balanceSheet.liabilities.current_liabilities.push(accountData);
              balanceSheet.liabilities.total_current_liabilities += accountData.credit_balance;
            } else {
              balanceSheet.liabilities.long_term_liabilities.push(accountData);
              balanceSheet.liabilities.total_long_term_liabilities += accountData.credit_balance;
            }
            break;
          
          case "EQUITY":
            balanceSheet.equity.owner_equity.push(accountData);
            balanceSheet.equity.total_equity += accountData.credit_balance;
            break;
        }
      }
    }

    // Calculate totals
    balanceSheet.assets.total_assets = balanceSheet.assets.total_current_assets + balanceSheet.assets.total_fixed_assets;
    balanceSheet.liabilities.total_liabilities = balanceSheet.liabilities.total_current_liabilities + balanceSheet.liabilities.total_long_term_liabilities;

    // Sort accounts by account code
    balanceSheet.assets.current_assets.sort((a, b) => a.account_code.localeCompare(b.account_code));
    balanceSheet.assets.fixed_assets.sort((a, b) => a.account_code.localeCompare(b.account_code));
    balanceSheet.liabilities.current_liabilities.sort((a, b) => a.account_code.localeCompare(b.account_code));
    balanceSheet.liabilities.long_term_liabilities.sort((a, b) => a.account_code.localeCompare(b.account_code));
    balanceSheet.equity.owner_equity.sort((a, b) => a.account_code.localeCompare(b.account_code));

    return balanceSheet;
  },
});

// Generate Profit & Loss Statement
export const generateProfitLossStatement = query({
  args: {
    organization_id: v.id("organizations"),
    start_date: v.string(),
    end_date: v.string(),
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

    // Get organization details
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const profitLossStatement = {
      organization_name: organization.name,
      period_start: args.start_date,
      period_end: args.end_date,
      fiscal_period: args.fiscal_period,
      revenue: {
        sales_revenue: [] as AccountData[],
        other_income: [] as AccountData[],
        total_revenue: 0,
      },
      expenses: {
        cost_of_goods_sold: [] as AccountData[],
        operating_expenses: [] as AccountData[],
        administrative_expenses: [] as AccountData[],
        selling_expenses: [] as AccountData[],
        financial_expenses: [] as AccountData[],
        total_expenses: 0,
      },
      net_profit: 0,
    };

    // Process each account
    for (const account of accounts) {
      // Get account balance for the period
      const ledgerEntries = await ctx.db
        .query("general_ledger")
        .withIndex("by_account", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("account_id", account._id)
        )
        .collect();

      // Apply date filter
      let filteredEntries = ledgerEntries.filter(entry => 
        entry.transaction_date >= args.start_date && 
        entry.transaction_date <= args.end_date
      );

      if (args.fiscal_period) {
        filteredEntries = filteredEntries.filter(entry => entry.fiscal_period === args.fiscal_period);
      }

      // Calculate balance
      const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
      const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
      const balance = totalDebits - totalCredits;

      // Only include accounts with transactions
      if (filteredEntries.length > 0) {
        const accountData = {
          account_id: account._id,
          account_code: account.account_code,
          account_name: account.account_name,
          balance: balance,
          debit_balance: balance > 0 ? balance : 0,
          credit_balance: balance < 0 ? Math.abs(balance) : 0,
        };

        // Categorize by account type and category
        if (account.account_type === "REVENUE") {
          if (account.account_category.includes("Sales")) {
            profitLossStatement.revenue.sales_revenue.push(accountData);
            profitLossStatement.revenue.total_revenue += accountData.credit_balance;
          } else {
            profitLossStatement.revenue.other_income.push(accountData);
            profitLossStatement.revenue.total_revenue += accountData.credit_balance;
          }
        } else if (account.account_type === "EXPENSE") {
          if (account.account_category.includes("Cost of Goods")) {
            profitLossStatement.expenses.cost_of_goods_sold.push(accountData);
            profitLossStatement.expenses.total_expenses += accountData.debit_balance;
          } else if (account.account_category.includes("Administrative")) {
            profitLossStatement.expenses.administrative_expenses.push(accountData);
            profitLossStatement.expenses.total_expenses += accountData.debit_balance;
          } else if (account.account_category.includes("Selling")) {
            profitLossStatement.expenses.selling_expenses.push(accountData);
            profitLossStatement.expenses.total_expenses += accountData.debit_balance;
          } else if (account.account_category.includes("Financial")) {
            profitLossStatement.expenses.financial_expenses.push(accountData);
            profitLossStatement.expenses.total_expenses += accountData.debit_balance;
          } else {
            profitLossStatement.expenses.operating_expenses.push(accountData);
            profitLossStatement.expenses.total_expenses += accountData.debit_balance;
          }
        }
      }
    }

    // Calculate net profit
    profitLossStatement.net_profit = profitLossStatement.revenue.total_revenue - profitLossStatement.expenses.total_expenses;

    // Sort accounts by account code
    profitLossStatement.revenue.sales_revenue.sort((a, b) => a.account_code.localeCompare(b.account_code));
    profitLossStatement.revenue.other_income.sort((a, b) => a.account_code.localeCompare(b.account_code));
    profitLossStatement.expenses.cost_of_goods_sold.sort((a, b) => a.account_code.localeCompare(b.account_code));
    profitLossStatement.expenses.operating_expenses.sort((a, b) => a.account_code.localeCompare(b.account_code));
    profitLossStatement.expenses.administrative_expenses.sort((a, b) => a.account_code.localeCompare(b.account_code));
    profitLossStatement.expenses.selling_expenses.sort((a, b) => a.account_code.localeCompare(b.account_code));
    profitLossStatement.expenses.financial_expenses.sort((a, b) => a.account_code.localeCompare(b.account_code));

    return profitLossStatement;
  },
});

// Generate Customer Statement of Account
export const generateCustomerStatement = query({
  args: {
    organization_id: v.id("organizations"),
    customer_id: v.id("customers"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get customer details
    const customer = await ctx.db.get(args.customer_id);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Get organization details
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get all transactions related to this customer
    const transactions = [];

    // Get invoices
    const invoices = await ctx.db
      .query("invoices")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      )
      .filter((q) => q.eq(q.field("customer_id"), args.customer_id))
      .collect();

    for (const invoice of invoices) {
      // Apply date filter
      if (args.start_date && invoice.invoice_date < args.start_date) continue;
      if (args.end_date && invoice.invoice_date > args.end_date) continue;

      transactions.push({
        date: invoice.invoice_date,
        type: "INVOICE",
        reference: invoice.invoice_number,
        description: `Invoice ${invoice.invoice_number}`,
        debit: invoice.grand_total,
        credit: 0,
        balance: 0, // Will be calculated
      });
    }

    // Get receipts
    const receipts = await ctx.db
      .query("receipts")
      .withIndex("by_customer", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("customer_id", args.customer_id)
      )
      .collect();

    for (const receipt of receipts) {
      // Apply date filter
      if (args.start_date && receipt.receipt_date < args.start_date) continue;
      if (args.end_date && receipt.receipt_date > args.end_date) continue;

      transactions.push({
        date: receipt.receipt_date,
        type: "RECEIPT",
        reference: receipt.receipt_number,
        description: `Payment received - ${receipt.description}`,
        debit: 0,
        credit: receipt.amount,
        balance: 0, // Will be calculated
      });
    }

    // Sort transactions by date
    transactions.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance
    let runningBalance = 0;
    for (const transaction of transactions) {
      runningBalance += transaction.debit - transaction.credit;
      transaction.balance = runningBalance;
    }

    // Calculate summary
    const totalInvoices = transactions
      .filter(t => t.type === "INVOICE")
      .reduce((sum, t) => sum + t.debit, 0);
    
    const totalPayments = transactions
      .filter(t => t.type === "RECEIPT")
      .reduce((sum, t) => sum + t.credit, 0);

    const currentBalance = runningBalance;

    return {
      organization_name: organization.name,
      customer_name: customer.customer_company_name || customer.contact_person || 'Unknown',
      customer_email: customer.email,
      customer_phone: customer.phone,
      statement_period: {
        start_date: args.start_date || transactions[0]?.date || new Date().toISOString().split('T')[0],
        end_date: args.end_date || transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0],
      },
      transactions: transactions,
      summary: {
        total_invoices: totalInvoices,
        total_payments: totalPayments,
        current_balance: currentBalance,
        transaction_count: transactions.length,
      },
      generated_at: new Date().toISOString(),
    };
  },
});

// Generate Supplier Statement of Account
export const generateSupplierStatement = query({
  args: {
    organization_id: v.id("organizations"),
    supplier_id: v.id("suppliers"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get supplier details
    const supplier = await ctx.db.get(args.supplier_id);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Get organization details
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get all transactions related to this supplier
    const transactions = [];

    // Get payments
    const payments = await ctx.db
      .query("payments")
      .withIndex("by_supplier", (q) => 
        q.eq("organization_id", args.organization_id)
         .eq("supplier_id", args.supplier_id)
      )
      .collect();

    for (const payment of payments) {
      // Apply date filter
      if (args.start_date && payment.payment_date < args.start_date) continue;
      if (args.end_date && payment.payment_date > args.end_date) continue;

      transactions.push({
        date: payment.payment_date,
        type: "PAYMENT",
        reference: payment.payment_number,
        description: `Payment made - ${payment.description}`,
        debit: 0,
        credit: payment.amount,
        balance: 0, // Will be calculated
      });
    }

    // Note: In a complete system, you would also include purchase orders, bills, etc.
    // For now, we'll focus on payments

    // Sort transactions by date
    transactions.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance
    let runningBalance = 0;
    for (const transaction of transactions) {
      runningBalance += transaction.debit - transaction.credit;
      transaction.balance = runningBalance;
    }

    // Calculate summary
    const totalPayments = transactions
      .filter(t => t.type === "PAYMENT")
      .reduce((sum, t) => sum + t.credit, 0);

    const currentBalance = runningBalance;

    return {
      organization_name: organization.name,
      supplier_name: supplier.name,
      supplier_email: supplier.email,
      supplier_phone: supplier.phone,
      statement_period: {
        start_date: args.start_date || transactions[0]?.date || new Date().toISOString().split('T')[0],
        end_date: args.end_date || transactions[transactions.length - 1]?.date || new Date().toISOString().split('T')[0],
      },
      transactions: transactions,
      summary: {
        total_payments: totalPayments,
        current_balance: currentBalance,
        transaction_count: transactions.length,
      },
      generated_at: new Date().toISOString(),
    };
  },
});

// Generate General Ledger Report for specific account
export const generateGeneralLedgerReport = query({
  args: {
    organization_id: v.id("organizations"),
    account_id: v.id("chart_of_accounts"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get account details
    const account = await ctx.db.get(args.account_id);
    if (!account) {
      throw new Error("Account not found");
    }

    // Get organization details
    const organization = await ctx.db.get(args.organization_id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get ledger entries for this account
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

    // Calculate running balance
    let runningBalance = 0;
    const entriesWithBalance = filteredEntries.map(entry => {
      runningBalance += entry.debit_amount - entry.credit_amount;
      return {
        ...entry,
        running_balance: runningBalance,
      };
    });

    // Calculate totals
    const totalDebits = filteredEntries.reduce((sum, entry) => sum + entry.debit_amount, 0);
    const totalCredits = filteredEntries.reduce((sum, entry) => sum + entry.credit_amount, 0);
    const netBalance = totalDebits - totalCredits;

    return {
      organization_name: organization.name,
      account_code: account.account_code,
      account_name: account.account_name,
      account_type: account.account_type,
      account_category: account.account_category,
      report_period: {
        start_date: args.start_date || entries[0]?.transaction_date || new Date().toISOString().split('T')[0],
        end_date: args.end_date || entries[entries.length - 1]?.transaction_date || new Date().toISOString().split('T')[0],
        fiscal_period: args.fiscal_period,
      },
      entries: entriesWithBalance,
      summary: {
        total_debits: totalDebits,
        total_credits: totalCredits,
        net_balance: netBalance,
        entry_count: filteredEntries.length,
      },
      generated_at: new Date().toISOString(),
    };
  },
});

// Generate Aging Report for Accounts Receivable
export const generateAgingReport = query({
  args: {
    organization_id: v.id("organizations"),
    as_of_date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asOfDate = args.as_of_date || new Date().toISOString().split('T')[0];
    
    // Get all customers
    const customers = await ctx.db
      .query("customers")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      )
      .collect();

    const agingReport = [];

    for (const customer of customers) {
      // Get all invoices for this customer
      const invoices = await ctx.db
        .query("invoices")
      .withIndex("by_organization", (q) => 
        q.eq("organization_id", args.organization_id)
      )
      .filter((q) => q.eq(q.field("customer_id"), customer._id))
      .collect();

      // Get all receipts for this customer
      const receipts = await ctx.db
        .query("receipts")
        .withIndex("by_customer", (q) => 
          q.eq("organization_id", args.organization_id)
           .eq("customer_id", customer._id)
        )
        .collect();

      // Calculate outstanding balance
      const totalInvoices = invoices.reduce((sum, invoice) => sum + invoice.grand_total, 0);
      const totalReceipts = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
      const outstandingBalance = totalInvoices - totalReceipts;

      if (outstandingBalance > 0) {
        // Calculate aging buckets
        const agingBuckets = {
          current: 0,      // 0-30 days
          days_31_60: 0,   // 31-60 days
          days_61_90: 0,   // 61-90 days
          over_90: 0,      // Over 90 days
        };

        // For each invoice, calculate its age and assign to appropriate bucket
        for (const invoice of invoices) {
          const invoiceDate = new Date(invoice.invoice_date);
          const asOfDateObj = new Date(asOfDate);
          const daysDiff = Math.floor((asOfDateObj.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 30) {
            agingBuckets.current += invoice.grand_total;
          } else if (daysDiff <= 60) {
            agingBuckets.days_31_60 += invoice.grand_total;
          } else if (daysDiff <= 90) {
            agingBuckets.days_61_90 += invoice.grand_total;
          } else {
            agingBuckets.over_90 += invoice.grand_total;
          }
        }

        agingReport.push({
          customer_id: customer._id,
          customer_name: customer.customer_company_name || customer.contact_person || 'Unknown',
          customer_email: customer.email,
          total_invoices: totalInvoices,
          total_receipts: totalReceipts,
          outstanding_balance: outstandingBalance,
          aging_buckets: agingBuckets,
        });
      }
    }

    // Sort by outstanding balance (highest first)
    agingReport.sort((a, b) => b.outstanding_balance - a.outstanding_balance);

    // Calculate totals
    const totalOutstanding = agingReport.reduce((sum, item) => sum + item.outstanding_balance, 0);
    const totalCurrent = agingReport.reduce((sum, item) => sum + item.aging_buckets.current, 0);
    const total31_60 = agingReport.reduce((sum, item) => sum + item.aging_buckets.days_31_60, 0);
    const total61_90 = agingReport.reduce((sum, item) => sum + item.aging_buckets.days_61_90, 0);
    const totalOver90 = agingReport.reduce((sum, item) => sum + item.aging_buckets.over_90, 0);

    return {
      organization_id: args.organization_id,
      as_of_date: asOfDate,
      aging_report: agingReport,
      summary: {
        total_customers: agingReport.length,
        total_outstanding: totalOutstanding,
        total_current: totalCurrent,
        total_31_60_days: total31_60,
        total_61_90_days: total61_90,
        total_over_90_days: totalOver90,
      },
      generated_at: new Date().toISOString(),
    };
  },
});
