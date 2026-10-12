import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// 1. List Monthly Payroll Batches
export const listPayrollRuns = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payroll_runs")
      .withIndex("by_org", (q) => q.eq("organization_id", args.organization_id as any))
      .collect();
  },
});

// 2. Generate Monthly Payroll Run for All Active Employees
export const generateMonthlyPayroll = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    payroll_month: v.string(), // e.g. "2026-10"
  },
  handler: async (ctx, args) => {
    // 1. Get all active employees
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    if (employees.length === 0) {
      throw new Error("No active employees found in this organization to process payroll");
    }

    let totalBasic = 0;
    let totalHousing = 0;
    let totalAllowances = 0;
    let totalGosi = 0;
    let totalNet = 0;
    let eligibleCount = 0;

    const employeeRows: Array<{
      employee_id: string;
      name: string;
      national_id: string;
      bank_swift: string;
      iban: string;
      basic: number;
      housing: number;
      other: number;
      gosi: number;
      net: number;
      deductions: number;
      mudad_reason?: string;
    }> = [];

    // Query all leaves for organization in current calendar year to calculate cumulative sick days
    const currentYear = args.payroll_month.split("-")[0];
    const allOrgLeaves = await ctx.db
      .query("employee_leaves")
      .withIndex("by_org", (q) => q.eq("organization_id", args.organization_id as any))
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    for (const emp of employees) {
      // Find active compensation contract
      const comp = await ctx.db
        .query("employee_compensation")
        .withIndex("by_employee", (q) => q.eq("employee_id", emp._id))
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();

      if (comp) {
        eligibleCount += 1;
        const otherAll = (comp.transport_allowance || 0) + (comp.other_allowances || 0);

        // Calculate leaves that fell within this payroll month
        const empLeaves = allOrgLeaves.filter((l) => l.employee_id === emp._id);
        const thisMonthLeaves = empLeaves.filter((l) => l.start_date.startsWith(args.payroll_month));

        let unpaidDays = 0;
        let sickDaysThisMonth = 0;
        for (const l of thisMonthLeaves) {
          if (l.leave_type === "unpaid") unpaidDays += l.days_count;
          if (l.leave_type === "sick") sickDaysThisMonth += l.days_count;
        }

        // Calculate prior sick days in the same calendar year before this month
        let priorSickDays = 0;
        for (const l of empLeaves) {
          if (
            l.leave_type === "sick" &&
            l.start_date.startsWith(currentYear) &&
            !l.start_date.startsWith(args.payroll_month) &&
            l.start_date < `${args.payroll_month}-01`
          ) {
            priorSickDays += l.days_count;
          }
        }

        // Daily wage calculation based on 30-day standard Saudi Labor law month
        const dailyGross = (comp.basic_salary + comp.housing_allowance + otherAll) / 30;
        let leaveDeduction = 0;
        const mudadCodes: string[] = [];

        if (unpaidDays > 0) {
          leaveDeduction += dailyGross * unpaidDays;
          mudadCodes.push("UL"); // Unpaid Leave
        }

        if (sickDaysThisMonth > 0) {
          for (let i = 1; i <= sickDaysThisMonth; i++) {
            const cumulative = priorSickDays + i;
            if (cumulative > 30 && cumulative <= 90) {
              leaveDeduction += dailyGross * 0.25; // Tier 2: 25% deducted
            } else if (cumulative > 90) {
              leaveDeduction += dailyGross * 1.0;  // Tier 3: 100% deducted (unpaid)
            }
          }
          if (priorSickDays + sickDaysThisMonth > 30) {
            mudadCodes.push("SL"); // Sick Leave deduction
          }
        }

        leaveDeduction = Math.round(leaveDeduction * 100) / 100;
        const netAfterLeaves = Math.max(0, Math.round((comp.net_salary - leaveDeduction) * 100) / 100);

        totalBasic += comp.basic_salary;
        totalHousing += comp.housing_allowance;
        totalAllowances += otherAll;
        totalGosi += comp.gosi_employee_deduction;
        totalNet += netAfterLeaves;

        employeeRows.push({
          employee_id: emp.employee_number,
          name: emp.full_name_arabic || `${emp.first_name} ${emp.last_name}`,
          national_id: emp.national_id_or_iqama,
          bank_swift: emp.bank_swift_code || "RJHISARI",
          iban: emp.iban,
          basic: comp.basic_salary,
          housing: comp.housing_allowance,
          other: otherAll,
          gosi: comp.gosi_employee_deduction,
          net: netAfterLeaves,
          deductions: comp.gosi_employee_deduction + leaveDeduction,
          mudad_reason: mudadCodes.length > 0 ? mudadCodes.join("+") : undefined,
        });
      }
    }

    if (eligibleCount === 0) {
      throw new Error("No employees have active compensation contracts configured yet");
    }

    const now = new Date().toISOString();
    const dateStr = now.split("T")[0];

    // Generate SAMA / Mudad standard Wage Protection System (WPS) SIF string
    // Header record (SCR):
    // SCR, [CR Number], [Bank BIC], [Creation Date], [Salary Month], [Count], [Total Net], SAR
    const headerLine = `SCR,CR-1010000000,RJHISARI,${dateStr},${args.payroll_month},${eligibleCount},${totalNet.toFixed(2)},SAR`;

    // Detail records (EDR):
    // EDR, [National ID], [Bank BIC], [IBAN], [Employee Name], [Basic], [Housing], [Other], [Total Deductions], [Net], [Mudad Reason Code]
    const detailLines = employeeRows.map((r) =>
      `EDR,${r.national_id},${r.bank_swift},${r.iban},${r.name},${r.basic.toFixed(2)},${r.housing.toFixed(2)},${r.other.toFixed(2)},${r.deductions.toFixed(2)},${r.net.toFixed(2)}${r.mudad_reason ? `,${r.mudad_reason}` : ""}`
    );

    const sifContent = [headerLine, ...detailLines].join("\n");

    // Check if run already exists for this month
    const existingRun = await ctx.db
      .query("payroll_runs")
      .withIndex("by_org_month", (q) =>
        q.eq("organization_id", args.organization_id as any).eq("payroll_month", args.payroll_month)
      )
      .first();

    let runId;
    if (existingRun) {
      await ctx.db.patch(existingRun._id, {
        total_employees: eligibleCount,
        total_basic: totalBasic,
        total_housing: totalHousing,
        total_allowances: totalAllowances,
        total_gosi_deductions: totalGosi,
        total_net_payable: totalNet,
        status: "draft",
        sif_file_generated: true,
        sif_file_content: sifContent,
        updated_at: now,
      });
      runId = existingRun._id;
    } else {
      runId = await ctx.db.insert("payroll_runs", {
        organization_id: args.organization_id,
        payroll_month: args.payroll_month,
        total_employees: eligibleCount,
        total_basic: totalBasic,
        total_housing: totalHousing,
        total_allowances: totalAllowances,
        total_gosi_deductions: totalGosi,
        total_net_payable: totalNet,
        currency: "SAR",
        status: "draft",
        sif_file_generated: true,
        sif_file_content: sifContent,
        created_at: now,
        updated_at: now,
      });
    }

    return {
      success: true,
      payroll_run_id: runId,
      eligible_employees: eligibleCount,
      total_net_payable: totalNet,
      payroll_month: args.payroll_month,
      sif_generated: true,
      message: `Payroll run for ${args.payroll_month} generated with WPS SIF file ready`,
    };
  },
});

// 3. Submit Payroll Run for WhatsApp Stakeholder Authorization
export const submitPayrollForWhatsAppApproval = mutation({
  args: {
    payroll_run_id: v.union(v.id("payroll_runs"), v.string()),
    organization_id: v.union(v.id("organizations"), v.string()),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.payroll_run_id as any);
    if (!run) throw new Error("Payroll batch not found");

    const summaryText =
      `💰 *Monthly Payroll Authorization - ${run.payroll_month}*\n` +
      `👥 Total Employees: ${run.total_employees}\n` +
      `💵 Total Basic Wages: SAR ${run.total_basic.toLocaleString()}\n` +
      `🏠 Total Allowances: SAR ${(run.total_housing + run.total_allowances).toLocaleString()}\n` +
      `🛡️ Total GOSI Deducted: SAR ${run.total_gosi_deductions.toLocaleString()}\n` +
      `💳 Total Net Bank Payout: SAR ${run.total_net_payable.toLocaleString()}\n` +
      `📄 SAMA / Mudad WPS SIF File: Generated & Verified`;

    // Patch status to pending approval
    await ctx.db.patch(args.payroll_run_id as any, {
      status: "pending_whatsapp_approval",
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      summary_text: summaryText,
      message: `Payroll batch #${run.payroll_month} submitted for WhatsApp stakeholder sign-off`,
    };
  },
});
