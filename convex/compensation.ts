import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// GOSI maximum contributory wage ceiling in Saudi Arabia (SAR 45,000)
const GOSI_MAX_CONTRIBUTORY_WAGE = 45000;

// GOSI Rates per Saudi Labor & Social Insurance Law
const SAUDI_GOSI_EMPLOYEE_RATE = 0.0975; // 9.0% Annuities + 0.75% SANED
const SAUDI_GOSI_EMPLOYER_RATE = 0.1175; // 9.0% Annuities + 0.75% SANED + 2.0% Occupational Hazard

const EXPAT_GOSI_EMPLOYEE_RATE = 0.0;    // Expats do not pay annuities/SANED
const EXPAT_GOSI_EMPLOYER_RATE = 0.02;   // 2.0% Occupational Hazard only

/**
 * Pure calculator for KSA Salary, GOSI deductions, and End of Service (EOSB) Accrual
 */
export function calculateKsaSalaryBreakdown({
  basic_salary,
  housing_allowance,
  transport_allowance = 0,
  other_allowances = 0,
  is_saudi,
}: {
  basic_salary: number;
  housing_allowance: number;
  transport_allowance?: number;
  other_allowances?: number;
  is_saudi: boolean;
}) {
  const gross_salary =
    basic_salary + housing_allowance + transport_allowance + other_allowances;

  // GOSI contributory wage is strictly (Basic Salary + Housing Allowance), capped at SAR 45,000
  const uncappedGosiWage = basic_salary + housing_allowance;
  const gosiSubjectWage = Math.min(uncappedGosiWage, GOSI_MAX_CONTRIBUTORY_WAGE);

  const employeeRate = is_saudi ? SAUDI_GOSI_EMPLOYEE_RATE : EXPAT_GOSI_EMPLOYEE_RATE;
  const employerRate = is_saudi ? SAUDI_GOSI_EMPLOYER_RATE : EXPAT_GOSI_EMPLOYER_RATE;

  const gosi_employee_deduction = Math.round(gosiSubjectWage * employeeRate * 100) / 100;
  const gosi_employer_contribution = Math.round(gosiSubjectWage * employerRate * 100) / 100;

  // Net payable = Gross - Employee GOSI deduction
  const net_salary = Math.round((gross_salary - gosi_employee_deduction) * 100) / 100;

  // Monthly End of Service Benefit (EOSB) liability accrual (Article 84)
  // Half month's wage per year for the first 5 years = (Monthly Wage * 0.5) / 12
  const eosbMonthlyAccrual = Math.round(((basic_salary + housing_allowance) * 0.5 / 12) * 100) / 100;

  return {
    basic_salary,
    housing_allowance,
    transport_allowance,
    other_allowances,
    gross_salary,
    gosi_subject_wage: gosiSubjectWage,
    is_saudi,
    gosi_employee_rate: employeeRate,
    gosi_employer_rate: employerRate,
    gosi_employee_deduction,
    gosi_employer_contribution,
    net_salary,
    eosb_monthly_accrual: eosbMonthlyAccrual,
  };
}

// 1. Query live calculation preview (callable from UI wizard before saving)
export const previewSalaryCalculation = query({
  args: {
    basic_salary: v.number(),
    housing_allowance: v.number(),
    transport_allowance: v.optional(v.number()),
    other_allowances: v.optional(v.number()),
    is_saudi: v.boolean(),
  },
  handler: async (_ctx, args) => {
    return calculateKsaSalaryBreakdown({
      basic_salary: args.basic_salary,
      housing_allowance: args.housing_allowance,
      transport_allowance: args.transport_allowance || 0,
      other_allowances: args.other_allowances || 0,
      is_saudi: args.is_saudi,
    });
  },
});

// 2. Get Employee Compensation Record
export const getCompensation = query({
  args: {
    employee_id: v.union(v.id("employees"), v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("employee_compensation")
      .withIndex("by_employee", (q) => q.eq("employee_id", args.employee_id as any))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
  },
});

// 3. Save or Update Compensation Contract (Queues for WhatsApp Approval)
export const saveCompensationContract = mutation({
  args: {
    employee_id: v.union(v.id("employees"), v.string()),
    organization_id: v.union(v.id("organizations"), v.string()),
    basic_salary: v.number(),
    housing_allowance: v.number(),
    transport_allowance: v.optional(v.number()),
    other_allowances: v.optional(v.number()),
    effective_date: v.string(),
    notes: v.optional(v.string()),
    qiwa_contract_id: v.optional(v.string()),
    qiwa_contract_status: v.optional(v.string()),
    qiwa_authenticated_at: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emp = await ctx.db.get(args.employee_id as any);
    if (!emp) throw new Error("Employee not found");

    const calculation = calculateKsaSalaryBreakdown({
      basic_salary: args.basic_salary,
      housing_allowance: args.housing_allowance,
      transport_allowance: args.transport_allowance || 0,
      other_allowances: args.other_allowances || 0,
      is_saudi: emp.is_saudi,
    });

    const now = new Date().toISOString();

    // Check if an existing compensation record is active
    const existing = await ctx.db
      .query("employee_compensation")
      .withIndex("by_employee", (q) => q.eq("employee_id", args.employee_id as any))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { is_active: false });
    }

    const contractId = await ctx.db.insert("employee_compensation", {
      employee_id: args.employee_id,
      organization_id: args.organization_id,
      basic_salary: calculation.basic_salary,
      housing_allowance: calculation.housing_allowance,
      transport_allowance: calculation.transport_allowance,
      other_allowances: calculation.other_allowances,
      currency: "SAR",
      is_saudi: emp.is_saudi,
      gosi_applicable: true,
      gosi_employee_rate: calculation.gosi_employee_rate,
      gosi_employer_rate: calculation.gosi_employer_rate,
      gosi_employee_deduction: calculation.gosi_employee_deduction,
      gosi_employer_contribution: calculation.gosi_employer_contribution,
      gross_salary: calculation.gross_salary,
      net_salary: calculation.net_salary,
      effective_date: args.effective_date,
      status: "pending_whatsapp_approval",
      notes: args.notes,
      qiwa_contract_id: args.qiwa_contract_id?.trim(),
      qiwa_contract_status: args.qiwa_contract_status || (args.qiwa_contract_id ? "authenticated" : "unlinked"),
      qiwa_authenticated_at: args.qiwa_authenticated_at,
      created_at: now,
      updated_at: now,
    });

    // Also sync Qiwa status to employee record
    if (args.qiwa_contract_id !== undefined || args.qiwa_contract_status !== undefined) {
      await ctx.db.patch(args.employee_id as any, {
        qiwa_contract_id: args.qiwa_contract_id?.trim(),
        qiwa_contract_status: args.qiwa_contract_status || (args.qiwa_contract_id ? "authenticated" : "unlinked"),
        qiwa_authenticated_at: args.qiwa_authenticated_at,
        updated_at: now,
      });
    }

    return {
      success: true,
      contract_id: contractId,
      calculation,
      message: "Compensation contract saved and queued for WhatsApp stakeholder sign-off",
    };
  },
});
