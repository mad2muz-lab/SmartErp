import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

// 1. List Employees for an Organization
export const listEmployees = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    department: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.organization_id || !isValidOrgId(args.organization_id)) {
      return [];
    }

    let employeesQuery = ctx.db
      .query("employees")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      );

    const employees = await employeesQuery.collect();

    let filtered = employees;
    if (args.department && args.department !== "all") {
      filtered = filtered.filter((e) => e.department === args.department);
    }
    if (args.status && args.status !== "all") {
      filtered = filtered.filter((e) => e.status === args.status);
    }

    // Attach latest compensation details for convenience
    const enriched = await Promise.all(
      filtered.map(async (emp) => {
        const comp = await ctx.db
          .query("employee_compensation")
          .withIndex("by_employee", (q) => q.eq("employee_id", emp._id))
          .filter((q) => q.eq(q.field("is_active"), true))
          .first();

        return {
          ...emp,
          compensation: comp || null,
        };
      })
    );

    return enriched;
  },
});

// 2. Get Single Employee Details
export const getEmployee = query({
  args: {
    employee_id: v.union(v.id("employees"), v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const emp = await ctx.db.get(args.employee_id as any);
      if (!emp) return null;

      const comp = await ctx.db
        .query("employee_compensation")
        .withIndex("by_employee", (q) => q.eq("employee_id", emp._id))
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();

      return {
        ...emp,
        compensation: comp || null,
      };
    } catch {
      return null;
    }
  },
});

// 3. Create New Employee (with KSA ID & Saudi IBAN validation)
export const createEmployee = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    first_name: v.string(),
    last_name: v.string(),
    full_name_arabic: v.string(),
    national_id_or_iqama: v.string(),
    nationality: v.string(),
    is_saudi: v.boolean(),
    gender: v.string(),
    job_title: v.string(),
    job_title_arabic: v.optional(v.string()),
    department: v.string(),
    date_of_birth: v.optional(v.string()),
    hire_date: v.string(),
    contract_type: v.string(),
    probation_end_date: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Banking & WPS
    bank_name: v.string(),
    bank_swift_code: v.string(),
    iban: v.string(),

    // ERP Access settings
    erp_access_enabled: v.boolean(),
    assigned_role: v.string(),
    module_permissions: v.array(v.string()),
    data_scope: v.string(),

    // Employment Level (1 to 7) & Org Chart Hierarchy
    employment_level: v.optional(v.number()),
    reports_to_id: v.optional(v.string()),

    // 2FA Security
    phone_2fa_verified: v.optional(v.boolean()),
    two_factor_enabled: v.optional(v.boolean()),

    // Qiwa (منصة قوى) Contract Integration
    qiwa_contract_id: v.optional(v.string()),
    qiwa_contract_status: v.optional(v.string()),
    qiwa_authenticated_at: v.optional(v.string()),

    // Enhanced Employment Classification & Work Parameters
    employment_type: v.optional(v.string()),
    work_location: v.optional(v.string()),
    site_project_name: v.optional(v.string()),
    work_location_spl: v.optional(v.string()),
    work_location_gps: v.optional(v.string()),
    work_location_maps_url: v.optional(v.string()),

    // National Address (SPL)
    national_address: v.optional(
      v.object({
        short_address: v.optional(v.string()), // e.g. "RRRD2929"
        spl_address: v.optional(v.string()),
        gps_coordinates: v.optional(v.string()),
        building_number: v.optional(v.string()),
        street_name: v.optional(v.string()),
        street_name_arabic: v.optional(v.string()),
        district: v.optional(v.string()),
        district_arabic: v.optional(v.string()),
        city: v.optional(v.string()),
        city_arabic: v.optional(v.string()),
        postal_code: v.optional(v.string()),
        additional_number: v.optional(v.string()),
      })
    ),

    // Medical Examination & Reports (Efada platform / Pre-employment)
    medical_report: v.optional(
      v.object({
        status: v.string(), // "fit" | "unfit" | "pending_results"
        medical_center: v.string(),
        exam_date: v.string(),
        report_reference_no: v.optional(v.string()),
        attachment_url: v.optional(v.string()),
        file_name: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),

    // Emergency Contact & Medical
    emergency_contact: v.optional(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phone_primary: v.string(),
        phone_secondary: v.optional(v.string()),
        city: v.optional(v.string()),
      })
    ),
    blood_group: v.optional(v.string()),
    chronic_medical_notes: v.optional(v.string()),

    // GOSI
    gosi_subscriber_number: v.optional(v.string()),
    gosi_registration_date: v.optional(v.string()),

    // Dependents for CCHI
    dependents: v.optional(
      v.array(
        v.object({
          full_name: v.string(),
          relationship: v.string(),
          national_id_or_iqama: v.string(),
          date_of_birth: v.optional(v.string()),
          gender: v.string(),
        })
      )
    ),

    // Initial Legal Documents (Iqama, Passport, Medical Insurance)
    initial_legal_docs: v.optional(
      v.array(
        v.object({
          document_type: v.string(),
          document_number: v.string(),
          issue_date_gregorian: v.string(),
          issue_date_hijri: v.optional(v.string()),
          expiry_date_gregorian: v.string(),
          expiry_date_hijri: v.optional(v.string()),
          issuing_authority: v.optional(v.string()),
          insurance_provider: v.optional(v.string()),
          insurance_class: v.optional(v.string()),
          insurance_policy_number: v.optional(v.string()),
        })
      )
    ),

    // Initial Assigned Assets IDs (e.g. Laptop, Phone, Vehicle)
    initial_asset_ids: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Auto-generate employee number e.g. EMP-001
    const existingEmployees = await ctx.db
      .query("employees")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .collect();

    const count = existingEmployees.length + 1;
    const employee_number = `EMP-${String(count).padStart(3, "0")}`;

    // Normalize Saudi IBAN (remove spaces, ensure uppercase SA)
    let cleanIban = args.iban.replace(/\s+/g, "").toUpperCase();
    if (!cleanIban.startsWith("SA") && cleanIban.length === 22) {
      cleanIban = `SA${cleanIban}`;
    }

    const employeeId = await ctx.db.insert("employees", {
      organization_id: args.organization_id,
      employee_number,
      first_name: args.first_name.trim(),
      last_name: args.last_name.trim(),
      full_name_arabic: args.full_name_arabic.trim(),
      national_id_or_iqama: args.national_id_or_iqama.trim(),
      nationality: args.nationality.trim(),
      is_saudi: args.is_saudi,
      gender: args.gender,
      job_title: args.job_title.trim(),
      job_title_arabic: args.job_title_arabic?.trim(),
      department: args.department.trim(),
      date_of_birth: args.date_of_birth,
      hire_date: args.hire_date,
      contract_type: args.contract_type,
      probation_end_date: args.probation_end_date,
      employment_type: args.employment_type || "permanent",
      work_location: args.work_location || "head_office_riyadh",
      site_project_name: args.site_project_name,
      work_location_spl: args.work_location_spl,
      work_location_gps: args.work_location_gps,
      work_location_maps_url: args.work_location_maps_url,
      national_address: args.national_address,
      medical_report: args.medical_report,
      emergency_contact: args.emergency_contact,
      blood_group: args.blood_group,
      chronic_medical_notes: args.chronic_medical_notes,
      gosi_subscriber_number: args.gosi_subscriber_number,
      gosi_registration_date: args.gosi_registration_date,
      dependents: args.dependents,
      email: args.email?.trim().toLowerCase(),
      phone: args.phone?.trim(),
      bank_name: args.bank_name.trim(),
      bank_swift_code: args.bank_swift_code.trim(),
      iban: cleanIban,

      // ERP Access Control
      erp_access_enabled: args.erp_access_enabled,
      assigned_role: args.assigned_role,
      module_permissions: args.module_permissions,
      data_scope: args.data_scope,

      // Employment Level (1 to 7) & Org Chart Hierarchy
      employment_level: args.employment_level || 6,
      reports_to_id: args.reports_to_id,

      // 2FA Security
      phone_2fa_verified: args.phone_2fa_verified || false,
      two_factor_enabled: args.two_factor_enabled || false,

      // Qiwa Contract Fields
      qiwa_contract_id: args.qiwa_contract_id?.trim(),
      qiwa_contract_status: args.qiwa_contract_status || (args.qiwa_contract_id ? "authenticated" : "unlinked"),
      qiwa_authenticated_at: args.qiwa_authenticated_at,

      // If ERP access is enabled, it requires WhatsApp sign-off
      access_approval_status: args.erp_access_enabled
        ? "pending_whatsapp_approval"
        : "none",
      status: "active",
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    // 1. Insert Initial Legal Documents if provided
    if (args.initial_legal_docs && args.initial_legal_docs.length > 0) {
      for (const d of args.initial_legal_docs) {
        await ctx.db.insert("employee_legal_documents", {
          organization_id: args.organization_id,
          employee_id: employeeId,
          document_type: d.document_type,
          document_number: d.document_number.trim(),
          issue_date_gregorian: d.issue_date_gregorian,
          issue_date_hijri: d.issue_date_hijri,
          expiry_date_gregorian: d.expiry_date_gregorian,
          expiry_date_hijri: d.expiry_date_hijri,
          issuing_authority: d.issuing_authority,
          insurance_provider: d.insurance_provider,
          insurance_class: d.insurance_class,
          insurance_policy_number: d.insurance_policy_number,
          status: "valid",
          created_at: now,
          updated_at: now,
        });
      }
    }

    // 1b. Register Medical Report in employee_legal_documents for expiry tracking
    if (args.medical_report && args.medical_report.exam_date) {
      try {
        const examDate = new Date(args.medical_report.exam_date);
        const expiryDate = new Date(examDate);
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        const expiryStr = expiryDate.toISOString().split("T")[0];

        await ctx.db.insert("employee_legal_documents", {
          organization_id: args.organization_id,
          employee_id: employeeId,
          document_type: "medical_examination",
          document_number: args.medical_report.report_reference_no?.trim() || `MED-${args.medical_report.exam_date}`,
          issue_date_gregorian: args.medical_report.exam_date,
          expiry_date_gregorian: expiryStr,
          issuing_authority: args.medical_report.medical_center?.trim() || "Efada / MoH",
          file_url: args.medical_report.attachment_url,
          status: args.medical_report.status === "fit" ? "valid" : "expiring_soon",
          notes: `Center: ${args.medical_report.medical_center}. Status: ${args.medical_report.status}. ${args.medical_report.notes || ""}`.trim(),
          created_at: now,
          updated_at: now,
        });
      } catch {
        // Fallback silently if date formatting fails
      }
    }

    // 2. Assign Initial Assets Custody if provided
    if (args.initial_asset_ids && args.initial_asset_ids.length > 0) {
      for (const assetIdStr of args.initial_asset_ids) {
        try {
          const assetRecord = await ctx.db.get(assetIdStr as any);
          if (assetRecord) {
            await ctx.db.patch(assetRecord._id, {
              status: "assigned_custody",
              current_holder_employee_id: String(employeeId),
              updated_at: now,
            });

            await ctx.db.insert("asset_custody_logs", {
              organization_id: args.organization_id,
              asset_id: assetRecord._id,
              employee_id: employeeId,
              action: "handover",
              assigned_date: now.split("T")[0],
              condition_at_handover: "good",
              handed_over_by_user_id: "hr_admin",
              notes: "Initial custody assigned during onboarding",
              created_at: now,
            });
          }
        } catch (e) {
          console.warn("Failed to assign initial asset during onboarding:", e);
        }
      }
    }

    // 3. Dispatch Stakeholder Notification for New Onboarding
    await ctx.db.insert("stakeholder_notifications", {
      organization_id: args.organization_id,
      category: "it_asset",
      target_role: "it_admin",
      employee_id: String(employeeId),
      title: `New Onboarding: ${args.first_name} ${args.last_name}`,
      title_arabic: `تعيين جديد: ${args.full_name_arabic || args.first_name}`,
      message: `Employee ${employee_number} onboarded (${args.job_title}). Ensure corporate email, system credentials and hardware are provisioned.`,
      message_arabic: `تم تسجيل الموظف ${employee_number} (${args.job_title}). يرجى تهيئة البريد وتجهيزات العمل.`,
      urgency: "info",
      action_url: "/hr",
      is_read: false,
      action_taken: false,
      created_at: now,
    });

    return {
      success: true,
      employee_id: employeeId,
      employee_number,
      message: "Employee profile created successfully",
    };
  },
});

// 4. Update Employee Profile
export const updateEmployee = mutation({
  args: {
    employee_id: v.union(v.id("employees"), v.string()),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    full_name_arabic: v.optional(v.string()),
    job_title: v.optional(v.string()),
    job_title_arabic: v.optional(v.string()),
    department: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    bank_name: v.optional(v.string()),
    bank_swift_code: v.optional(v.string()),
    iban: v.optional(v.string()),
    status: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    employment_level: v.optional(v.number()),
    reports_to_id: v.optional(v.string()),
    phone_2fa_verified: v.optional(v.boolean()),
    qiwa_contract_id: v.optional(v.string()),
    qiwa_contract_status: v.optional(v.string()),
    qiwa_authenticated_at: v.optional(v.string()),
    employment_type: v.optional(v.string()),
    work_location: v.optional(v.string()),
    site_project_name: v.optional(v.string()),
    blood_group: v.optional(v.string()),
    chronic_medical_notes: v.optional(v.string()),
    gosi_subscriber_number: v.optional(v.string()),
    gosi_registration_date: v.optional(v.string()),
    national_address: v.optional(
      v.object({
        building_number: v.string(),
        street_name: v.string(),
        street_name_arabic: v.optional(v.string()),
        district: v.string(),
        district_arabic: v.optional(v.string()),
        city: v.string(),
        city_arabic: v.optional(v.string()),
        postal_code: v.string(),
        additional_number: v.optional(v.string()),
        short_address: v.optional(v.string()),
      })
    ),
    emergency_contact: v.optional(
      v.object({
        name: v.string(),
        relationship: v.string(),
        phone_primary: v.string(),
        phone_secondary: v.optional(v.string()),
        city: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const emp = await ctx.db.get(args.employee_id as any);
    if (!emp) throw new Error("Employee record not found");

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (args.first_name !== undefined) updates.first_name = args.first_name.trim();
    if (args.last_name !== undefined) updates.last_name = args.last_name.trim();
    if (args.full_name_arabic !== undefined) updates.full_name_arabic = args.full_name_arabic.trim();
    if (args.job_title !== undefined) updates.job_title = args.job_title.trim();
    if (args.job_title_arabic !== undefined) updates.job_title_arabic = args.job_title_arabic?.trim();
    if (args.department !== undefined) updates.department = args.department.trim();
    if (args.email !== undefined) updates.email = args.email?.trim().toLowerCase();
    if (args.phone !== undefined) updates.phone = args.phone?.trim();
    if (args.bank_name !== undefined) updates.bank_name = args.bank_name.trim();
    if (args.bank_swift_code !== undefined) updates.bank_swift_code = args.bank_swift_code.trim();
    if (args.iban !== undefined) updates.iban = args.iban.replace(/\s+/g, "").toUpperCase();
    if (args.status !== undefined) updates.status = args.status;
    if (args.is_active !== undefined) updates.is_active = args.is_active;
    if (args.employment_level !== undefined) updates.employment_level = args.employment_level;
    if (args.reports_to_id !== undefined) updates.reports_to_id = args.reports_to_id;
    if (args.phone_2fa_verified !== undefined) updates.phone_2fa_verified = args.phone_2fa_verified;
    if (args.qiwa_contract_id !== undefined) updates.qiwa_contract_id = args.qiwa_contract_id;
    if (args.qiwa_contract_status !== undefined) updates.qiwa_contract_status = args.qiwa_contract_status;
    if (args.qiwa_authenticated_at !== undefined) updates.qiwa_authenticated_at = args.qiwa_authenticated_at;
    if (args.employment_type !== undefined) updates.employment_type = args.employment_type;
    if (args.work_location !== undefined) updates.work_location = args.work_location;
    if (args.site_project_name !== undefined) updates.site_project_name = args.site_project_name;
    if (args.blood_group !== undefined) updates.blood_group = args.blood_group;
    if (args.chronic_medical_notes !== undefined) updates.chronic_medical_notes = args.chronic_medical_notes;
    if (args.gosi_subscriber_number !== undefined) updates.gosi_subscriber_number = args.gosi_subscriber_number;
    if (args.gosi_registration_date !== undefined) updates.gosi_registration_date = args.gosi_registration_date;
    if (args.national_address !== undefined) updates.national_address = args.national_address;
    if (args.emergency_contact !== undefined) updates.emergency_contact = args.emergency_contact;
    if (args.phone !== undefined) updates.phone = args.phone?.trim();
    if (args.bank_name !== undefined) updates.bank_name = args.bank_name.trim();
    if (args.bank_swift_code !== undefined) updates.bank_swift_code = args.bank_swift_code.trim();
    if (args.iban !== undefined) {
      let cleanIban = args.iban.replace(/\s+/g, "").toUpperCase();
      if (!cleanIban.startsWith("SA") && cleanIban.length === 22) {
        cleanIban = `SA${cleanIban}`;
      }
      updates.iban = cleanIban;
    }
    if (args.status !== undefined) updates.status = args.status;
    if (args.is_active !== undefined) updates.is_active = args.is_active;
    if (args.employment_level !== undefined) updates.employment_level = args.employment_level;
    if (args.reports_to_id !== undefined) updates.reports_to_id = args.reports_to_id;
    if (args.phone_2fa_verified !== undefined) updates.phone_2fa_verified = args.phone_2fa_verified;
    if (args.qiwa_contract_id !== undefined) updates.qiwa_contract_id = args.qiwa_contract_id?.trim();
    if (args.qiwa_contract_status !== undefined) updates.qiwa_contract_status = args.qiwa_contract_status;
    if (args.qiwa_authenticated_at !== undefined) updates.qiwa_authenticated_at = args.qiwa_authenticated_at;

    await ctx.db.patch(args.employee_id as any, updates);

    return { success: true, message: "Employee profile updated" };
  },
});

// 5. Update ERP Access & Role Permissions (Queues WhatsApp Approval)
export const updateErpAccess = mutation({
  args: {
    employee_id: v.union(v.id("employees"), v.string()),
    erp_access_enabled: v.boolean(),
    assigned_role: v.string(),
    module_permissions: v.array(v.string()),
    data_scope: v.string(),
    user_id: v.optional(v.union(v.id("user_profiles"), v.string())),
  },
  handler: async (ctx, args) => {
    const emp = await ctx.db.get(args.employee_id as any);
    if (!emp) throw new Error("Employee record not found");

    const now = new Date().toISOString();

    // If access is being enabled or permissions modified, mark as pending WhatsApp approval
    const isPending = args.erp_access_enabled;

    await ctx.db.patch(args.employee_id as any, {
      erp_access_enabled: args.erp_access_enabled,
      assigned_role: args.assigned_role,
      module_permissions: args.module_permissions,
      data_scope: args.data_scope,
      user_id: args.user_id || emp.user_id,
      access_approval_status: isPending ? "pending_whatsapp_approval" : "none",
      updated_at: now,
    });

    return {
      success: true,
      pending_whatsapp_approval: isPending,
      message: isPending
        ? "Access permissions queued for WhatsApp stakeholder sign-off"
        : "ERP access disabled successfully",
    };
  },
});
