import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// ========================================
// FINANCIAL REPORTS PDF GENERATOR
// ========================================

// Generate Balance Sheet PDF
export const generateBalanceSheetPDF = action({
  args: {
    organization_id: v.id("organizations"),
    as_of_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ pdfBuffer: any; filename: string }> => {
    // Get balance sheet data
    const balanceSheet: any = await ctx.runQuery(api.accounting.reports.generateBalanceSheet, {
      organization_id: args.organization_id,
      as_of_date: args.as_of_date,
      fiscal_period: args.fiscal_period,
    });

    // Get organization details
    const organization = await ctx.runQuery(api.organizations.getOrganization, {
      organization_id: args.organization_id,
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Generate HTML for Balance Sheet
    const html = generateBalanceSheetHTML(balanceSheet, organization);

    // Generate PDF using the existing PDF generation system
    const pdfBuffer: any = await ctx.runAction(api.pdfGenerator.generatePDF, {
      html: html,
      filename: `Balance_Sheet_${balanceSheet.report_date.replace(/-/g, '_')}.pdf`,
    });

    return {
      pdf_url: pdfBuffer,
      filename: `Balance_Sheet_${balanceSheet.report_date.replace(/-/g, '_')}.pdf`,
      report_data: balanceSheet,
    };
  },
});

// Generate Profit & Loss Statement PDF
export const generateProfitLossPDF = action({
  args: {
    organization_id: v.id("organizations"),
    start_date: v.string(),
    end_date: v.string(),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ pdfBuffer: any; filename: string }> => {
    // Get P&L data
    const profitLoss: any = await ctx.runQuery(api.accounting.reports.generateProfitLossStatement, {
      organization_id: args.organization_id,
      start_date: args.start_date,
      end_date: args.end_date,
      fiscal_period: args.fiscal_period,
    });

    // Get organization details
    const organization = await ctx.runQuery(api.organizations.getOrganization, {
      organization_id: args.organization_id,
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Generate HTML for P&L Statement
    const html = generateProfitLossHTML(profitLoss, organization);

    // Generate PDF
    const pdfBuffer: any = await ctx.runAction(api.pdfGenerator.generatePDF, {
      html: html,
      filename: `Profit_Loss_${args.start_date.replace(/-/g, '_')}_to_${args.end_date.replace(/-/g, '_')}.pdf`,
    });

    return {
      pdf_url: pdfBuffer,
      filename: `Profit_Loss_${args.start_date.replace(/-/g, '_')}_to_${args.end_date.replace(/-/g, '_')}.pdf`,
      report_data: profitLoss,
    };
  },
});

// Generate Customer Statement PDF
export const generateCustomerStatementPDF = action({
  args: {
    organization_id: v.id("organizations"),
    customer_id: v.id("customers"),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ pdfBuffer: any; filename: string }> => {
    // Get customer statement data
    const statement: any = await ctx.runQuery(api.accounting.reports.generateCustomerStatement, {
      organization_id: args.organization_id,
      customer_id: args.customer_id,
      start_date: args.start_date,
      end_date: args.end_date,
    });

    // Get organization details
    const organization = await ctx.runQuery(api.organizations.getOrganization, {
      organization_id: args.organization_id,
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Generate HTML for Customer Statement
    const html = generateCustomerStatementHTML(statement, organization);

    // Generate PDF
    const pdfBuffer: any = await ctx.runAction(api.pdfGenerator.generatePDF, {
      html: html,
      filename: `Customer_Statement_${statement.customer_name.replace(/\s+/g, '_')}_${statement.statement_period.end_date.replace(/-/g, '_')}.pdf`,
    });

    return {
      pdf_url: pdfBuffer,
      filename: `Customer_Statement_${statement.customer_name.replace(/\s+/g, '_')}_${statement.statement_period.end_date.replace(/-/g, '_')}.pdf`,
      report_data: statement,
    };
  },
});

// Generate Trial Balance PDF
export const generateTrialBalancePDF = action({
  args: {
    organization_id: v.id("organizations"),
    as_of_date: v.optional(v.string()),
    fiscal_period: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ pdfBuffer: any; filename: string }> => {
    // Get trial balance data
    const trialBalance: any = await ctx.runQuery(api.accounting.generalLedger.getTrialBalance, {
      organization_id: args.organization_id,
      as_of_date: args.as_of_date,
      fiscal_period: args.fiscal_period,
    });

    // Get organization details
    const organization = await ctx.runQuery(api.organizations.getOrganization, {
      organization_id: args.organization_id,
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    // Generate HTML for Trial Balance
    const html = generateTrialBalanceHTML(trialBalance, organization);

    // Generate PDF
    const pdfBuffer: any = await ctx.runAction(api.pdfGenerator.generatePDF, {
      html: html,
      filename: `Trial_Balance_${trialBalance.as_of_date.replace(/-/g, '_')}.pdf`,
    });

    return {
      pdf_url: pdfBuffer,
      filename: `Trial_Balance_${trialBalance.as_of_date.replace(/-/g, '_')}.pdf`,
      report_data: trialBalance,
    };
  },
});

// Helper function to generate Balance Sheet HTML
function generateBalanceSheetHTML(balanceSheet: any, organization: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Balance Sheet - ${organization.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .report-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .report-date { font-size: 14px; color: #666; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .account-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .account-name { flex: 2; }
            .account-amount { flex: 1; text-align: right; font-weight: bold; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333; font-weight: bold; font-size: 16px; }
            .subtotal { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #333; font-weight: bold; }
            .currency { font-family: monospace; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">${organization.name}</div>
            <div class="report-title">BALANCE SHEET</div>
            <div class="report-date">As of ${balanceSheet.report_date}</div>
        </div>

        <div style="display: flex; justify-content: space-between;">
            <!-- Assets -->
            <div style="flex: 1; margin-right: 20px;">
                <div class="section">
                    <div class="section-title">ASSETS</div>
                    
                    <div style="margin-left: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">Current Assets</div>
                        ${balanceSheet.assets.current_assets.map((asset: any) => `
                            <div class="account-row">
                                <span class="account-name">${asset.account_name}</span>
                                <span class="account-amount currency">${formatCurrency(asset.balance)}</span>
                            </div>
                        `).join('')}
                        <div class="subtotal">
                            <span>Total Current Assets</span>
                            <span class="currency">${formatCurrency(balanceSheet.assets.total_current_assets)}</span>
                        </div>
                    </div>

                    <div style="margin-left: 20px; margin-top: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">Fixed Assets</div>
                        ${balanceSheet.assets.fixed_assets.map((asset: any) => `
                            <div class="account-row">
                                <span class="account-name">${asset.account_name}</span>
                                <span class="account-amount currency">${formatCurrency(asset.balance)}</span>
                            </div>
                        `).join('')}
                        <div class="subtotal">
                            <span>Total Fixed Assets</span>
                            <span class="currency">${formatCurrency(balanceSheet.assets.total_fixed_assets)}</span>
                        </div>
                    </div>

                    <div class="total-row">
                        <span>TOTAL ASSETS</span>
                        <span class="currency">${formatCurrency(balanceSheet.assets.total_assets)}</span>
                    </div>
                </div>
            </div>

            <!-- Liabilities & Equity -->
            <div style="flex: 1;">
                <div class="section">
                    <div class="section-title">LIABILITIES & EQUITY</div>
                    
                    <div style="margin-left: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">Current Liabilities</div>
                        ${balanceSheet.liabilities.current_liabilities.map((liability: any) => `
                            <div class="account-row">
                                <span class="account-name">${liability.account_name}</span>
                                <span class="account-amount currency">${formatCurrency(liability.balance)}</span>
                            </div>
                        `).join('')}
                        <div class="subtotal">
                            <span>Total Current Liabilities</span>
                            <span class="currency">${formatCurrency(balanceSheet.liabilities.total_current_liabilities)}</span>
                        </div>
                    </div>

                    <div style="margin-left: 20px; margin-top: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">Long-term Liabilities</div>
                        ${balanceSheet.liabilities.long_term_liabilities.map((liability: any) => `
                            <div class="account-row">
                                <span class="account-name">${liability.account_name}</span>
                                <span class="account-amount currency">${formatCurrency(liability.balance)}</span>
                            </div>
                        `).join('')}
                        <div class="subtotal">
                            <span>Total Long-term Liabilities</span>
                            <span class="currency">${formatCurrency(balanceSheet.liabilities.total_long_term_liabilities)}</span>
                        </div>
                    </div>

                    <div style="margin-left: 20px; margin-top: 20px;">
                        <div style="font-weight: bold; margin-bottom: 10px;">Owner's Equity</div>
                        ${balanceSheet.equity.owner_equity.map((equity: any) => `
                            <div class="account-row">
                                <span class="account-name">${equity.account_name}</span>
                                <span class="account-amount currency">${formatCurrency(equity.balance)}</span>
                            </div>
                        `).join('')}
                        <div class="subtotal">
                            <span>Total Equity</span>
                            <span class="currency">${formatCurrency(balanceSheet.equity.total_equity)}</span>
                        </div>
                    </div>

                    <div class="total-row">
                        <span>TOTAL LIABILITIES & EQUITY</span>
                        <span class="currency">${formatCurrency(balanceSheet.liabilities.total_liabilities + balanceSheet.equity.total_equity)}</span>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Helper function to generate Profit & Loss HTML
function generateProfitLossHTML(profitLoss: any, organization: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Profit & Loss Statement - ${organization.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .report-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .report-period { font-size: 14px; color: #666; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
            .account-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
            .account-name { flex: 2; }
            .account-amount { flex: 1; text-align: right; }
            .total-row { display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333; font-weight: bold; font-size: 16px; }
            .subtotal { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #333; font-weight: bold; }
            .currency { font-family: monospace; }
            .net-profit { background-color: #f0f0f0; padding: 15px; border: 2px solid #333; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">${organization.name}</div>
            <div class="report-title">PROFIT & LOSS STATEMENT</div>
            <div class="report-period">For the period ${profitLoss.period_start} to ${profitLoss.period_end}</div>
        </div>

        <div class="section">
            <div class="section-title">REVENUE</div>
            <div style="margin-left: 20px;">
                <div style="font-weight: bold; margin-bottom: 10px;">Sales Revenue</div>
                ${profitLoss.revenue.sales_revenue.map((revenue: any) => `
                    <div class="account-row">
                        <span class="account-name">${revenue.account_name}</span>
                        <span class="account-amount currency">${formatCurrency(revenue.balance)}</span>
                    </div>
                `).join('')}
                <div style="font-weight: bold; margin-bottom: 10px; margin-top: 15px;">Other Income</div>
                ${profitLoss.revenue.other_income.map((revenue: any) => `
                    <div class="account-row">
                        <span class="account-name">${revenue.account_name}</span>
                        <span class="account-amount currency">${formatCurrency(revenue.balance)}</span>
                    </div>
                `).join('')}
                <div class="subtotal">
                    <span>TOTAL REVENUE</span>
                    <span class="currency">${formatCurrency(profitLoss.revenue.total_revenue)}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">EXPENSES</div>
            <div style="margin-left: 20px;">
                <div style="font-weight: bold; margin-bottom: 10px;">Cost of Goods Sold</div>
                ${profitLoss.expenses.cost_of_goods_sold.map((expense: any) => `
                    <div class="account-row">
                        <span class="account-name">${expense.account_name}</span>
                        <span class="account-amount currency">${formatCurrency(expense.balance)}</span>
                    </div>
                `).join('')}
                
                <div style="font-weight: bold; margin-bottom: 10px; margin-top: 15px;">Operating Expenses</div>
                ${profitLoss.expenses.operating_expenses.map((expense: any) => `
                    <div class="account-row">
                        <span class="account-name">${expense.account_name}</span>
                        <span class="account-amount currency">${formatCurrency(expense.balance)}</span>
                    </div>
                `).join('')}
                
                <div style="font-weight: bold; margin-bottom: 10px; margin-top: 15px;">Administrative Expenses</div>
                ${profitLoss.expenses.administrative_expenses.map((expense: any) => `
                    <div class="account-row">
                        <span class="account-name">${expense.account_name}</span>
                        <span class="account-amount currency">${formatCurrency(expense.balance)}</span>
                    </div>
                `).join('')}
                
                <div style="font-weight: bold; margin-bottom: 10px; margin-top: 15px;">Selling Expenses</div>
                ${profitLoss.expenses.selling_expenses.map((expense: any) => `
                    <div class="account-row">
                        <span class="account-name">${expense.account_name}</span>
                        <span class="account-amount currency">${formatCurrency(expense.balance)}</span>
                    </div>
                `).join('')}
                
                <div style="font-weight: bold; margin-bottom: 10px; margin-top: 15px;">Financial Expenses</div>
                ${profitLoss.expenses.financial_expenses.map((expense: any) => `
                    <div class="account-row">
                        <span class="account-name">${expense.account_name}</span>
                        <span class="account-amount currency">${formatCurrency(expense.balance)}</span>
                    </div>
                `).join('')}
                
                <div class="subtotal">
                    <span>TOTAL EXPENSES</span>
                    <span class="currency">${formatCurrency(profitLoss.expenses.total_expenses)}</span>
                </div>
            </div>
        </div>

        <div class="net-profit">
            <div class="total-row">
                <span>NET PROFIT/LOSS</span>
                <span class="currency">${formatCurrency(profitLoss.net_profit)}</span>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Helper function to generate Customer Statement HTML
function generateCustomerStatementHTML(statement: any, organization: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Customer Statement - ${organization.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .report-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .customer-info { margin-bottom: 20px; }
            .statement-period { font-size: 14px; color: #666; margin-bottom: 20px; }
            .transactions-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .transactions-table th, .transactions-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .transactions-table th { background-color: #f2f2f2; font-weight: bold; }
            .transactions-table .amount { text-align: right; font-family: monospace; }
            .summary { background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; }
            .summary-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .summary-total { font-weight: bold; font-size: 16px; border-top: 2px solid #333; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">${organization.name}</div>
            <div class="report-title">CUSTOMER STATEMENT</div>
        </div>

        <div class="customer-info">
            <div><strong>Customer:</strong> ${statement.customer_name}</div>
            <div><strong>Email:</strong> ${statement.customer_email}</div>
            <div><strong>Phone:</strong> ${statement.customer_phone}</div>
        </div>

        <div class="statement-period">
            <strong>Statement Period:</strong> ${statement.statement_period.start_date} to ${statement.statement_period.end_date}
        </div>

        <table class="transactions-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                </tr>
            </thead>
            <tbody>
                ${statement.transactions.map((transaction: any) => `
                    <tr>
                        <td>${transaction.date}</td>
                        <td>${transaction.type}</td>
                        <td>${transaction.reference}</td>
                        <td>${transaction.description}</td>
                        <td class="amount">${transaction.debit > 0 ? formatCurrency(transaction.debit) : ''}</td>
                        <td class="amount">${transaction.credit > 0 ? formatCurrency(transaction.credit) : ''}</td>
                        <td class="amount">${formatCurrency(transaction.balance)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-row">
                <span>Total Invoices:</span>
                <span>${formatCurrency(statement.summary.total_invoices)}</span>
            </div>
            <div class="summary-row">
                <span>Total Payments:</span>
                <span>${formatCurrency(statement.summary.total_payments)}</span>
            </div>
            <div class="summary-row summary-total">
                <span>Current Balance:</span>
                <span>${formatCurrency(statement.summary.current_balance)}</span>
            </div>
        </div>

        <div style="margin-top: 30px; font-size: 12px; color: #666;">
            Generated on: ${new Date(statement.generated_at).toLocaleString()}
        </div>
    </body>
    </html>
  `;
}

// Helper function to generate Trial Balance HTML
function generateTrialBalanceHTML(trialBalance: any, organization: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Trial Balance - ${organization.name}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .report-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .report-date { font-size: 14px; color: #666; }
            .trial-balance-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .trial-balance-table th, .trial-balance-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .trial-balance-table th { background-color: #f2f2f2; font-weight: bold; }
            .trial-balance-table .amount { text-align: right; font-family: monospace; }
            .totals { background-color: #f9f9f9; padding: 15px; border: 1px solid #ddd; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .totals-final { font-weight: bold; font-size: 16px; border-top: 2px solid #333; padding-top: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="company-name">${organization.name}</div>
            <div class="report-title">TRIAL BALANCE</div>
            <div class="report-date">As of ${trialBalance.as_of_date}</div>
        </div>

        <table class="trial-balance-table">
            <thead>
                <tr>
                    <th>Account Code</th>
                    <th>Account Name</th>
                    <th>Account Type</th>
                    <th>Debit Balance</th>
                    <th>Credit Balance</th>
                </tr>
            </thead>
            <tbody>
                ${trialBalance.trial_balance.map((account: any) => `
                    <tr>
                        <td>${account.account_code}</td>
                        <td>${account.account_name}</td>
                        <td>${account.account_type}</td>
                        <td class="amount">${account.debit_balance > 0 ? formatCurrency(account.debit_balance) : ''}</td>
                        <td class="amount">${account.credit_balance > 0 ? formatCurrency(account.credit_balance) : ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>Total Debits:</span>
                <span>${formatCurrency(trialBalance.totals.total_debit_balance)}</span>
            </div>
            <div class="totals-row">
                <span>Total Credits:</span>
                <span>${formatCurrency(trialBalance.totals.total_credit_balance)}</span>
            </div>
            <div class="totals-row totals-final">
                <span>Difference:</span>
                <span>${formatCurrency(trialBalance.totals.total_debit_balance - trialBalance.totals.total_credit_balance)}</span>
            </div>
            <div class="totals-row" style="margin-top: 10px;">
                <span>Balanced:</span>
                <span style="color: ${trialBalance.totals.is_balanced ? 'green' : 'red'};">
                    ${trialBalance.totals.is_balanced ? 'YES' : 'NO'}
                </span>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
