import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to calculate days until expiry
function getDaysUntil(expiryDateStr: string): number {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 999;
  }
}

// 1. List Legal Documents for an Employee
export const listEmployeeDocuments = query({
  args: {
    employee_id: v.union(v.id("employees"), v.string()),
  },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("employee_legal_documents")
      .withIndex("by_employee", (q) => q.eq("employee_id", args.employee_id as any))
      .collect();

    return docs.map((doc) => {
      const daysLeft = getDaysUntil(doc.expiry_date_gregorian);
      let status = "valid";
      if (daysLeft < 0) {
        status = "expired";
      } else if (daysLeft <= 60) {
        status = "expiring_soon";
      }

      return {
        ...doc,
        calculated_status: status,
        days_until_expiry: daysLeft,
      };
    });
  },
});

// 2. List All Expiring Documents Across Organization (For HR / GRO Compliance Dashboard)
export const listExpiringDocuments = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    within_days: v.optional(v.number()), // e.g. 60 or 30
    document_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const thresholdDays = args.within_days ?? 60;
    const docs = await ctx.db
      .query("employee_legal_documents")
      .withIndex("by_org", (q) => q.eq("organization_id", args.organization_id as any))
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organization_id as any))
      .collect();

    const empMap = new Map(employees.map((e) => [String(e._id), e]));

    const enriched = docs
      .map((doc) => {
        const daysLeft = getDaysUntil(doc.expiry_date_gregorian);
        let status = "valid";
        if (daysLeft < 0) {
          status = "expired";
        } else if (daysLeft <= 60) {
          status = "expiring_soon";
        }

        const emp = empMap.get(String(doc.employee_id));

        return {
          ...doc,
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Employee",
          employee_name_arabic: emp?.full_name_arabic || "",
          employee_number: emp?.employee_number || "",
          job_title: emp?.job_title || "",
          department: emp?.department || "",
          days_until_expiry: daysLeft,
          calculated_status: status,
        };
      })
      .filter((d) => {
        if (args.document_type && args.document_type !== "all" && d.document_type !== args.document_type) {
          return false;
        }
        // Include expired or expiring within threshold
        return d.days_until_expiry <= thresholdDays;
      })
      .sort((a, b) => a.days_until_expiry - b.days_until_expiry);

    return enriched;
  },
});

// 3. Add Legal Document
export const addLegalDocument = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    employee_id: v.union(v.id("employees"), v.string()),
    document_type: v.string(), // "iqama" | "national_id" | "passport" | "medical_insurance" | "driving_license" | "professional_accreditation" | "ajeer_notice"
    document_number: v.string(),
    issue_date_gregorian: v.string(),
    issue_date_hijri: v.optional(v.string()),
    expiry_date_gregorian: v.string(),
    expiry_date_hijri: v.optional(v.string()),
    issuing_authority: v.optional(v.string()),
    insurance_provider: v.optional(v.string()),
    insurance_class: v.optional(v.string()),
    insurance_policy_number: v.optional(v.string()),
    file_url: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const daysLeft = getDaysUntil(args.expiry_date_gregorian);
    let status = "valid";
    if (daysLeft < 0) status = "expired";
    else if (daysLeft <= 60) status = "expiring_soon";

    const docId = await ctx.db.insert("employee_legal_documents", {
      organization_id: args.organization_id,
      employee_id: args.employee_id,
      document_type: args.document_type,
      document_number: args.document_number.trim(),
      issue_date_gregorian: args.issue_date_gregorian,
      issue_date_hijri: args.issue_date_hijri,
      expiry_date_gregorian: args.expiry_date_gregorian,
      expiry_date_hijri: args.expiry_date_hijri,
      issuing_authority: args.issuing_authority,
      insurance_provider: args.insurance_provider,
      insurance_class: args.insurance_class,
      insurance_policy_number: args.insurance_policy_number,
      file_url: args.file_url,
      status,
      notes: args.notes,
      created_at: now,
      updated_at: now,
    });

    return { success: true, document_id: docId };
  },
});

// 4. Update Legal Document
export const updateLegalDocument = mutation({
  args: {
    document_id: v.id("employee_legal_documents"),
    document_number: v.optional(v.string()),
    issue_date_gregorian: v.optional(v.string()),
    issue_date_hijri: v.optional(v.string()),
    expiry_date_gregorian: v.optional(v.string()),
    expiry_date_hijri: v.optional(v.string()),
    issuing_authority: v.optional(v.string()),
    insurance_provider: v.optional(v.string()),
    insurance_class: v.optional(v.string()),
    insurance_policy_number: v.optional(v.string()),
    file_url: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.document_id);
    if (!doc) throw new Error("Document record not found");

    const updates: any = { updated_at: new Date().toISOString() };
    if (args.document_number !== undefined) updates.document_number = args.document_number.trim();
    if (args.issue_date_gregorian !== undefined) updates.issue_date_gregorian = args.issue_date_gregorian;
    if (args.issue_date_hijri !== undefined) updates.issue_date_hijri = args.issue_date_hijri;
    if (args.expiry_date_gregorian !== undefined) {
      updates.expiry_date_gregorian = args.expiry_date_gregorian;
      const daysLeft = getDaysUntil(args.expiry_date_gregorian);
      updates.status = daysLeft < 0 ? "expired" : daysLeft <= 60 ? "expiring_soon" : "valid";
    }
    if (args.expiry_date_hijri !== undefined) updates.expiry_date_hijri = args.expiry_date_hijri;
    if (args.issuing_authority !== undefined) updates.issuing_authority = args.issuing_authority;
    if (args.insurance_provider !== undefined) updates.insurance_provider = args.insurance_provider;
    if (args.insurance_class !== undefined) updates.insurance_class = args.insurance_class;
    if (args.insurance_policy_number !== undefined) updates.insurance_policy_number = args.insurance_policy_number;
    if (args.file_url !== undefined) updates.file_url = args.file_url;
    if (args.notes !== undefined) updates.notes = args.notes;

    await ctx.db.patch(args.document_id, updates);
    return { success: true };
  },
});

// 5. Delete Legal Document
export const deleteLegalDocument = mutation({
  args: { document_id: v.id("employee_legal_documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.document_id);
    return { success: true };
  },
});
