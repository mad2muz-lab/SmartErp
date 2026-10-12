import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default starter departments
const DEFAULT_DEPARTMENTS = [
  { name: "Executive Leadership", name_arabic: "الإدارة التنفيذية العليا", code: "EXEC", description: "C-Suite, Managing Directors & Corporate Leadership" },
  { name: "Sales & Marketing", name_arabic: "المبيعات والتسويق", code: "SALES", description: "Customer relationships, quotations, and pipeline management" },
  { name: "Procurement & Supply Chain", name_arabic: "المشتريات وسلاسل الإمداد", code: "PROC", description: "Vendor sourcing, purchase requisitions, and orders" },
  { name: "Operations & Warehouse", name_arabic: "العمليات والمستودعات", code: "OPS", description: "Inventory custody, fulfillment, and delivery notes" },
  { name: "Finance & Accounting", name_arabic: "المالية والمحاسبة", code: "FIN", description: "General ledger, invoicing, audits, and corporate governance" },
  { name: "Human Resources", name_arabic: "الموارد البشرية", code: "HR", description: "Personnel, Saudi Labor compliance, GOSI, and WPS payroll" },
  { name: "Point of Sale & Retail", name_arabic: "نقاط البيع والتجزئة", code: "POS", description: "Store counters, cashiers, and direct retail checkout" },
];

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

// 1. List Departments (returns stored departments or seed defaults)
export const listDepartments = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.organization_id || !isValidOrgId(args.organization_id)) {
      return DEFAULT_DEPARTMENTS.map((d, i) => ({
        _id: `default_${i}`,
        ...d,
        is_active: true,
      }));
    }

    const stored = await ctx.db
      .query("departments")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    if (stored.length > 0) {
      return stored;
    }

    // Return defaults if none created yet
    return DEFAULT_DEPARTMENTS.map((d, i) => ({
      _id: `default_${i}`,
      ...d,
      is_active: true,
    }));
  },
});

// 2. Create Custom Department
export const createDepartment = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    name: v.string(),
    name_arabic: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    parent_department_id: v.optional(v.string()),
    head_of_department_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const deptId = await ctx.db.insert("departments", {
      organization_id: args.organization_id,
      name: args.name.trim(),
      name_arabic: args.name_arabic?.trim(),
      code: args.code?.trim().toUpperCase(),
      description: args.description?.trim(),
      parent_department_id: args.parent_department_id,
      head_of_department_id: args.head_of_department_id,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    return { success: true, department_id: deptId, message: "Department created successfully" };
  },
});

// 3. List Custom & Organization Bank Accounts
export const listOrganizationBanks = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.organization_id || !isValidOrgId(args.organization_id)) {
      return [];
    }

    return await ctx.db
      .query("organization_banks")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();
  },
});

// 4. Create Custom Bank / Bank Account
export const createOrganizationBank = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    bank_name: v.string(),
    bank_name_arabic: v.optional(v.string()),
    swift_code: v.string(),
    account_number: v.optional(v.string()),
    iban: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let cleanIban = args.iban ? args.iban.replace(/\s+/g, "").toUpperCase() : undefined;
    if (cleanIban && !cleanIban.startsWith("SA") && cleanIban.length === 22) {
      cleanIban = `SA${cleanIban}`;
    }

    const bankId = await ctx.db.insert("organization_banks", {
      organization_id: args.organization_id,
      bank_name: args.bank_name.trim(),
      bank_name_arabic: args.bank_name_arabic?.trim(),
      swift_code: args.swift_code.trim().toUpperCase(),
      account_number: args.account_number?.trim(),
      iban: cleanIban,
      currency: args.currency || "SAR",
      is_active: true,
      created_at: new Date().toISOString(),
    });

    return { success: true, bank_id: bankId, message: "Bank registered successfully" };
  },
});

// 5. Dynamic Org Chart Query (Updates reactively on every new addition!)
export const getOrgChart = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.organization_id || !isValidOrgId(args.organization_id)) {
      return {
        company: null,
        departments: [],
        levels: [],
        nodes: [],
        total_employees: 0,
      };
    }

    // 1. Fetch organization info
    let company: any = null;
    try {
      company = await ctx.db.get(args.organization_id as any);
    } catch {
      company = null;
    }

    // 2. Fetch all departments
    const storedDepts = await ctx.db
      .query("departments")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    const depts = storedDepts.length > 0
      ? storedDepts
      : DEFAULT_DEPARTMENTS.map((d, i) => ({
          _id: `default_${i}`,
          ...d,
          is_active: true,
        }));

    // 3. Fetch all active employees
    const employees = await ctx.db
      .query("employees")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    // Standard Employment Level Definitions (Levels 1 to 7)
    const LEVEL_DEFINITIONS: Record<number, { titleEn: string; titleAr: string; color: string }> = {
      1: { titleEn: "Level 1: Executive Leadership (C-Suite)", titleAr: "المستوى 1: القيادة التنفيذية العليا", color: "purple" },
      2: { titleEn: "Level 2: Directors & Division Heads", titleAr: "المستوى 2: مديرو العموم والقطاعات", color: "blue" },
      3: { titleEn: "Level 3: Department Managers", titleAr: "المستوى 3: مديرو الإدارات والأقسام", color: "teal" },
      4: { titleEn: "Level 4: Supervisors & Team Leads", titleAr: "المستوى 4: المشرفون وقادة الفرق", color: "cyan" },
      5: { titleEn: "Level 5: Senior Specialists & Engineers", titleAr: "المستوى 5: كبار الأخصائيين والمهندسين", color: "green" },
      6: { titleEn: "Level 6: Associates, Specialists & Cashiers", titleAr: "المستوى 6: الأخصائيون، الكاشير والتشغيل", color: "orange" },
      7: { titleEn: "Level 7: Entry-Level, Assistants & Support", titleAr: "المستوى 7: المساعدون، المتدربون والدعم", color: "gray" },
    };

    // Group employees by level
    const levelBuckets: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
    const empMap = new Map<string, any>();

    for (const emp of employees) {
      empMap.set(emp._id, emp);
      const lvl = emp.employment_level && emp.employment_level >= 1 && emp.employment_level <= 7
        ? emp.employment_level
        : 6; // default Level 6 (Associate/Specialist)
      levelBuckets[lvl].push({
        _id: emp._id,
        employee_number: emp.employee_number,
        name: emp.full_name_arabic || `${emp.first_name} ${emp.last_name}`,
        name_en: `${emp.first_name} ${emp.last_name}`,
        job_title: emp.job_title_arabic || emp.job_title,
        job_title_en: emp.job_title,
        department: emp.department,
        level: lvl,
        level_info: LEVEL_DEFINITIONS[lvl],
        reports_to_id: emp.reports_to_id,
        is_saudi: emp.is_saudi,
        erp_access_enabled: emp.erp_access_enabled,
        status: emp.status,
      });
    }

    // Build hierarchical levels array
    const levels = Object.keys(LEVEL_DEFINITIONS).map((lvlKey) => {
      const num = parseInt(lvlKey, 10);
      return {
        level: num,
        ...LEVEL_DEFINITIONS[num],
        employees: levelBuckets[num] || [],
        count: (levelBuckets[num] || []).length,
      };
    });

    // Build department breakdown with employee counts and head
    const departmentBreakdown = depts.map((d) => {
      const deptEmployees = employees.filter(
        (e) => e.department.toLowerCase() === d.name.toLowerCase() || (d.name_arabic && e.department.includes(d.name_arabic))
      );
      return {
        ...d,
        member_count: deptEmployees.length,
        employees: deptEmployees.map((e) => ({
          _id: e._id,
          name: e.full_name_arabic || `${e.first_name} ${e.last_name}`,
          job_title: e.job_title,
          level: e.employment_level || 6,
        })),
      };
    });

    return {
      company: company
        ? {
            id: company._id,
            name: company.name,
            name_arabic: company.name_arabic,
            currency: company.currency || "SAR",
          }
        : { name: "Trading ERP Enterprise" },
      departments: departmentBreakdown,
      levels,
      total_employees: employees.length,
      timestamp: new Date().toISOString(),
    };
  },
});
