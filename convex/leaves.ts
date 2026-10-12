import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Pure calculator for Saudi Labor Law Article 117 (Sick Leave Tiers) & Article 116 (Unpaid Leave)
 *
 * Article 117 Rules (Per Single Work Year):
 * - Tier 1: Days 1 to 30 -> 100% pay (Ratio: 1.0)
 * - Tier 2: Days 31 to 90 -> 75% pay (Ratio: 0.75)
 * - Tier 3: Days 91 to 120 -> 0% pay (Unpaid, Ratio: 0.0)
 *
 * Article 116 (Unpaid Leave):
 * - Deducted pro-rata at 100% (Daily wage = monthly wage / monthDays)
 */
export function calculateMonthLeavePayrollImpact({
  basic_salary,
  housing_allowance,
  other_allowances,
  month_days = 30,
  unpaid_days = 0,
  sick_days_this_month = 0,
  prior_sick_days_in_year = 0,
}: {
  basic_salary: number;
  housing_allowance: number;
  other_allowances: number;
  month_days?: number;
  unpaid_days?: number;
  sick_days_this_month?: number;
  prior_sick_days_in_year?: number;
}) {
  const dailyBasic = basic_salary / month_days;
  const dailyHousing = housing_allowance / month_days;
  const dailyOther = other_allowances / month_days;

  let deductionAmount = 0;
  const deductionCodes: string[] = [];

  // 1. Unpaid Leave (Article 116)
  if (unpaid_days > 0) {
    const unpaidDeduction = (dailyBasic + dailyHousing + dailyOther) * unpaid_days;
    deductionAmount += unpaidDeduction;
    deductionCodes.push("UL"); // Mudad WPS code: Unpaid Leave
  }

  // 2. Sick Leave (Article 117 Tiers)
  if (sick_days_this_month > 0) {
    let sickDeduction = 0;
    for (let i = 1; i <= sick_days_this_month; i++) {
      const cumulativeDay = prior_sick_days_in_year + i;
      if (cumulativeDay <= 30) {
        // Tier 1: 100% paid (0% deduction)
      } else if (cumulativeDay <= 90) {
        // Tier 2: 75% paid (25% deduction)
        sickDeduction += (dailyBasic + dailyHousing + dailyOther) * 0.25;
      } else {
        // Tier 3: 0% paid (100% deduction)
        sickDeduction += (dailyBasic + dailyHousing + dailyOther) * 1.0;
      }
    }

    if (sickDeduction > 0) {
      deductionAmount += sickDeduction;
      deductionCodes.push("SL"); // Mudad WPS code: Sick Leave
    }
  }

  deductionAmount = Math.round(deductionAmount * 100) / 100;

  return {
    deduction_amount: deductionAmount,
    mudad_deduction_code: deductionCodes.length > 0 ? deductionCodes.join("+") : undefined,
  };
}

// Helper to check valid organization ID
function isValidOrgId(orgId: any): boolean {
  if (!orgId) return false;
  if (typeof orgId !== "string") return false;
  if (
    orgId.startsWith("org_") ||
    orgId.startsWith("temp_") ||
    orgId.startsWith("demo_") ||
    orgId.startsWith("local_") ||
    orgId.startsWith("vnd_") ||
    orgId.startsWith("vendor_")
  ) {
    return false;
  }
  return true;
}

// 1. List Leaves for Organization
export const listLeaves = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    employee_id: v.optional(v.union(v.id("employees"), v.string())),
  },
  handler: async (ctx, args) => {
    if (!args.organization_id || !isValidOrgId(args.organization_id)) {
      return [];
    }

    try {
      let leavesQuery = ctx.db
        .query("employee_leaves")
        .withIndex("by_org", (q) => q.eq("organization_id", args.organization_id as any));

      const leaves = await leavesQuery.collect();
      if (args.employee_id) {
        return leaves.filter((l) => l.employee_id === args.employee_id);
      }
      return leaves;
    } catch (err) {
      console.error("Error querying employee_leaves:", err);
      return [];
    }
  },
});

export const listExitReentryTasks = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.organization_id || !isValidOrgId(args.organization_id)) return [];
    return await ctx.db
      .query("employee_exit_reentry_tasks")
      .withIndex("by_org", (q) => q.eq("organization_id", args.organization_id as any))
      .collect();
  },
});

function normalizePhone(phone: string): string {
  const cleanPhone = phone.trim().replace(/\s+/g, "");
  if (cleanPhone.startsWith("05")) return `+966${cleanPhone.slice(1)}`;
  if (cleanPhone.startsWith("966")) return `+${cleanPhone}`;
  return cleanPhone;
}

function approvalToken(): string {
  return `wa_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// 2. Submit an employee leave request to sequential manager and HR approval.
export const submitLeave = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    employee_id: v.union(v.id("employees"), v.string()),
    leave_type: v.string(), // "annual" | "sick" | "unpaid" | "marriage" | "paternity" | "bereavement" | "maternity" | "hajj"
    start_date: v.string(),
    end_date: v.string(),
    days_count: v.number(),
    travel_outside_saudi: v.boolean(),
    medical_report_ref: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    if (!isValidOrgId(args.organization_id)) {
      throw new Error("A valid organization is required to submit leave.");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.start_date) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(args.end_date) ||
        args.end_date < args.start_date ||
        !Number.isFinite(args.days_count) ||
        args.days_count <= 0) {
      throw new Error("Leave dates and duration are invalid.");
    }

    const employee = await ctx.db.get(args.employee_id as any);
    if (!employee ||
        employee.organization_id !== args.organization_id ||
        !employee.is_active) {
      throw new Error("Active employee not found in this organization.");
    }
    if (!employee.reports_to_id) {
      throw new Error("Assign an immediate reporting manager to the employee before submitting leave.");
    }
    const manager = await ctx.db.get(employee.reports_to_id as any);
    if (!manager ||
        manager.organization_id !== args.organization_id ||
        !manager.is_active ||
        !manager.phone?.trim()) {
      throw new Error("The employee's immediate manager must be active and have a registered phone number.");
    }

    const hrApprovers = await ctx.db
      .query("stakeholder_approvers")
      .withIndex("by_org", (q) => q.eq("organization_id", args.organization_id as any))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
    const hrApproverMatches = hrApprovers.filter(
      (approver) => ["hr_manager", "hr_admin_manager"].includes(approver.role)
    );
    if (hrApproverMatches.length !== 1 || !hrApproverMatches[0].phone_number.trim()) {
      throw new Error("Configure exactly one active HR Admin Manager approver with a WhatsApp phone number.");
    }

    const leaveId = await ctx.db.insert("employee_leaves", {
      organization_id: args.organization_id,
      employee_id: args.employee_id,
      leave_type: args.leave_type,
      start_date: args.start_date,
      end_date: args.end_date,
      days_count: args.days_count,
      travel_outside_saudi: args.travel_outside_saudi,
      status: "pending_manager_approval",
      medical_report_ref: args.medical_report_ref?.trim(),
      notes: args.notes,
      created_at: now,
      updated_at: now,
    });

    const managerPhone = normalizePhone(manager.phone);
    const managerName = `${manager.first_name} ${manager.last_name}`.trim();
    const token = approvalToken();
    const requestId = await ctx.db.insert("whatsapp_approval_requests", {
      organization_id: args.organization_id,
      request_type: "leave_manager",
      reference_id: employee.employee_number,
      reference_record_id: leaveId,
      verification_token: token,
      approver_phone: managerPhone,
      approver_name: managerName,
      status: "pending",
      summary_text: `Leave request for ${employee.first_name} ${employee.last_name}\nType: ${args.leave_type}\nDates: ${args.start_date} to ${args.end_date} (${args.days_count} days)\nTravel outside Saudi Arabia: ${args.travel_outside_saudi ? "Yes" : "No"}`,
      sent_at: now,
    });
    await ctx.db.patch(leaveId, {
      manager_approval_request_id: requestId,
    });

    return {
      success: true,
      leave_id: leaveId,
      approval_request_id: requestId,
      approver_name: managerName,
      approver_phone: managerPhone,
      verification_token: token,
    };
  },
});

// 3. Delete Leave Request
export const deleteLeave = mutation({
  args: {
    leave_id: v.id("employee_leaves"),
  },
  handler: async (ctx, args) => {
    const leave = await ctx.db.get(args.leave_id);
    if (leave) {
      // Revert employee status to active if they were on_leave
      try {
        const emp = await ctx.db.get(leave.employee_id as any);
        if (emp && emp.status === "on_leave") {
          await ctx.db.patch(leave.employee_id as any, {
            status: "active",
            updated_at: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn("Could not revert employee status:", e);
      }
      await ctx.db.delete(args.leave_id);
    }
    return { success: true };
  },
});
