import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to calculate days until expiry
function getDaysUntil(expiryDateStr?: string): number {
  if (!expiryDateStr) return 999;
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

// 1. List All Assets for an Organization
export const listAssets = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    category: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("assets")
      .withIndex("by_organization", (query) =>
        query.eq("organization_id", args.organization_id as any)
      );

    const assets = await q.collect();

    // Fetch employee names for current holders
    const employeeIds = Array.from(
      new Set(assets.map((a) => a.current_holder_employee_id).filter(Boolean))
    );

    const employees = await Promise.all(
      employeeIds.map(async (id) => {
        try {
          return await ctx.db.get(id as any);
        } catch {
          return null;
        }
      })
    );

    const empMap = new Map(
      employees.filter(Boolean).map((e: any) => [String(e._id), e])
    );

    let filtered = assets.map((a) => {
      const holder = a.current_holder_employee_id
        ? empMap.get(String(a.current_holder_employee_id))
        : null;

      // Calculate vehicle compliance badges
      let vehicleCompliance = null;
      if (a.vehicle_details) {
        const istimaraDays = getDaysUntil(a.vehicle_details.istimara_expiry);
        const fahasDays = getDaysUntil(a.vehicle_details.fahas_expiry);
        const insDays = getDaysUntil(a.vehicle_details.insurance_expiry);
        vehicleCompliance = {
          istimaraDays,
          fahasDays,
          insuranceDays: insDays,
          needsAttention: istimaraDays <= 30 || fahasDays <= 14 || insDays <= 30,
        };
      }

      return {
        ...a,
        holder_name: holder ? `${holder.first_name} ${holder.last_name}` : null,
        holder_name_arabic: holder?.full_name_arabic || null,
        holder_employee_number: holder?.employee_number || null,
        holder_department: holder?.department || null,
        vehicleCompliance,
      };
    });

    if (args.category && args.category !== "all") {
      filtered = filtered.filter((a) => a.category === args.category);
    }
    if (args.status && args.status !== "all") {
      filtered = filtered.filter((a) => a.status === args.status);
    }

    return filtered;
  },
});

// 2. Get Single Asset Details with Full History
export const getAssetById = query({
  args: { asset_id: v.id("assets") },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.asset_id);
    if (!asset) return null;

    const custodyLogs = await ctx.db
      .query("asset_custody_logs")
      .withIndex("by_asset", (q) => q.eq("asset_id", args.asset_id))
      .collect();

    const maintenanceLogs = await ctx.db
      .query("asset_maintenance_logs")
      .withIndex("by_asset", (q) => q.eq("asset_id", args.asset_id))
      .collect();

    let currentHolder = null;
    if (asset.current_holder_employee_id) {
      try {
        currentHolder = await ctx.db.get(asset.current_holder_employee_id as any);
      } catch {
        currentHolder = null;
      }
    }

    return {
      ...asset,
      currentHolder,
      custodyLogs: custodyLogs.reverse(),
      maintenanceLogs: maintenanceLogs.reverse(),
    };
  },
});

// 3. Create New Asset
export const createAsset = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    asset_name: v.string(),
    asset_name_arabic: v.optional(v.string()),
    category: v.string(), // "it_hardware" | "vehicles_fleet" | "machinery_tools" | "furniture" | "mobile_telecom" | "facility_equipment"
    sub_category: v.optional(v.string()),
    brand: v.string(),
    model: v.string(),
    serial_number: v.optional(v.string()),
    purchase_date: v.string(),
    purchase_cost: v.number(),
    currency: v.optional(v.string()),
    supplier_id: v.optional(v.string()),
    warranty_expiry_date: v.optional(v.string()),
    useful_life_months: v.optional(v.number()),
    salvage_value: v.optional(v.number()),
    physical_location: v.string(),
    notes: v.optional(v.string()),
    vehicle_details: v.optional(
      v.object({
        plate_number: v.string(),
        plate_number_arabic: v.optional(v.string()),
        istimara_expiry: v.string(),
        fahas_expiry: v.string(),
        insurance_policy_number: v.string(),
        insurance_expiry: v.string(),
        fuel_card_number: v.optional(v.string()),
        current_odometer_km: v.optional(v.number()),
      })
    ),
    // Optional immediate assignment during onboarding/creation
    assigned_to_employee_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Auto-generate Asset Tag e.g. AST-IT-001 or AST-VEH-001
    const prefix =
      args.category === "vehicles_fleet"
        ? "AST-VEH"
        : args.category === "it_hardware"
        ? "AST-IT"
        : args.category === "mobile_telecom"
        ? "AST-MOB"
        : args.category === "machinery_tools"
        ? "AST-TLS"
        : "AST-GEN";

    const existingCount = (
      await ctx.db
        .query("assets")
        .withIndex("by_organization", (q) =>
          q.eq("organization_id", args.organization_id as any)
        )
        .collect()
    ).length;

    const assetTag = `${prefix}-${String(existingCount + 1).padStart(3, "0")}`;
    const qrCode = `ERP-ASSET:${args.organization_id}:${assetTag}`;

    const initialStatus = args.assigned_to_employee_id
      ? "assigned_custody"
      : "available";

    const assetId = await ctx.db.insert("assets", {
      organization_id: args.organization_id,
      asset_tag: assetTag,
      asset_name: args.asset_name.trim(),
      asset_name_arabic: args.asset_name_arabic?.trim(),
      category: args.category,
      sub_category: args.sub_category?.trim(),
      brand: args.brand.trim(),
      model: args.model.trim(),
      serial_number: args.serial_number?.trim(),
      barcode_or_qr_code: qrCode,
      purchase_date: args.purchase_date,
      purchase_cost: args.purchase_cost,
      currency: args.currency || "SAR",
      supplier_id: args.supplier_id,
      warranty_expiry_date: args.warranty_expiry_date,
      useful_life_months: args.useful_life_months || 36,
      salvage_value: args.salvage_value || 0,
      current_book_value: args.purchase_cost,
      physical_location: args.physical_location.trim(),
      notes: args.notes,
      vehicle_details: args.vehicle_details,
      status: initialStatus,
      current_holder_employee_id: args.assigned_to_employee_id,
      created_at: now,
      updated_at: now,
    });

    // If immediately assigned, record custody log
    if (args.assigned_to_employee_id) {
      await ctx.db.insert("asset_custody_logs", {
        organization_id: args.organization_id,
        asset_id: assetId,
        employee_id: args.assigned_to_employee_id as any,
        action: "handover",
        assigned_date: now.split("T")[0],
        condition_at_handover: "new",
        handed_over_by_user_id: "system_admin",
        notes: "Initial custody handover during asset creation",
        created_at: now,
      });
    }

    return { success: true, asset_id: assetId, asset_tag: assetTag };
  },
});

// 4. Update Asset Details
export const updateAsset = mutation({
  args: {
    asset_id: v.id("assets"),
    asset_name: v.optional(v.string()),
    asset_name_arabic: v.optional(v.string()),
    category: v.optional(v.string()),
    sub_category: v.optional(v.string()),
    brand: v.optional(v.string()),
    model: v.optional(v.string()),
    serial_number: v.optional(v.string()),
    physical_location: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
    vehicle_details: v.optional(
      v.object({
        plate_number: v.string(),
        plate_number_arabic: v.optional(v.string()),
        istimara_expiry: v.string(),
        fahas_expiry: v.string(),
        insurance_policy_number: v.string(),
        insurance_expiry: v.string(),
        fuel_card_number: v.optional(v.string()),
        current_odometer_km: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.asset_id);
    if (!asset) throw new Error("Asset record not found");

    const updates: any = { updated_at: new Date().toISOString() };
    if (args.asset_name !== undefined) updates.asset_name = args.asset_name.trim();
    if (args.asset_name_arabic !== undefined) updates.asset_name_arabic = args.asset_name_arabic.trim();
    if (args.category !== undefined) updates.category = args.category;
    if (args.sub_category !== undefined) updates.sub_category = args.sub_category.trim();
    if (args.brand !== undefined) updates.brand = args.brand.trim();
    if (args.model !== undefined) updates.model = args.model.trim();
    if (args.serial_number !== undefined) updates.serial_number = args.serial_number.trim();
    if (args.physical_location !== undefined) updates.physical_location = args.physical_location.trim();
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.status !== undefined) updates.status = args.status;
    if (args.vehicle_details !== undefined) updates.vehicle_details = args.vehicle_details;

    await ctx.db.patch(args.asset_id, updates);
    return { success: true };
  },
});

// 5. Assign Asset Custody to Employee (تسليم عهدة)
export const assignAssetCustody = mutation({
  args: {
    asset_id: v.id("assets"),
    employee_id: v.union(v.id("employees"), v.string()),
    assigned_date: v.string(), // YYYY-MM-DD
    condition_at_handover: v.string(), // "new" | "excellent" | "good" | "fair"
    handed_over_by_user_id: v.string(),
    notes: v.optional(v.string()),
    require_whatsapp_acceptance: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.asset_id);
    if (!asset) throw new Error("Asset not found");

    const employee: any = await ctx.db.get(args.employee_id as any);
    if (!employee) throw new Error("Employee not found");

    const now = new Date().toISOString();
    const shouldRequireWa = args.require_whatsapp_acceptance !== false; // default true

    let waRequestId: string | undefined = undefined;
    let waToken: string | undefined = undefined;
    const empPhone = employee.phone_number || employee.phone || "";

    if (shouldRequireWa && empPhone) {
      let cleanPhone = empPhone.trim().replace(/\s+/g, "");
      if (cleanPhone.startsWith("05")) cleanPhone = `+966${cleanPhone.slice(1)}`;
      else if (!cleanPhone.startsWith("+") && cleanPhone.startsWith("966")) cleanPhone = `+${cleanPhone}`;

      waToken = `wa_asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const summaryText = `Official Custody Handover / استلام عهدة رسمية:\nAsset: ${asset.asset_name} (${asset.asset_tag})\nBrand/Model: ${asset.brand} ${asset.model}\nS/N: ${asset.serial_number || 'N/A'}\nCondition: ${args.condition_at_handover.toUpperCase()}\nAssigned Date: ${args.assigned_date}\n\nPlease reply with (1/Approve) to accept custody or (2/Reject) with reason.`;

      const reqId = await ctx.db.insert("whatsapp_approval_requests", {
        organization_id: asset.organization_id,
        request_type: "asset_custody_acceptance",
        reference_id: asset.asset_tag,
        reference_record_id: String(args.asset_id),
        verification_token: waToken,
        approver_phone: cleanPhone,
        approver_name: `${employee.first_name} ${employee.last_name}`,
        status: "pending",
        summary_text: summaryText,
        sent_at: now,
      });
      waRequestId = String(reqId);
    }

    // 1. Update asset status
    const initialAssetStatus = shouldRequireWa && empPhone ? "pending_handover_acceptance" : "assigned_custody";
    await ctx.db.patch(args.asset_id, {
      status: initialAssetStatus,
      current_holder_employee_id: args.employee_id as string,
      custody_whatsapp_request_id: waRequestId,
      custody_acceptance_status: shouldRequireWa && empPhone ? "pending" : "accepted",
      custody_accepted_at: shouldRequireWa && empPhone ? undefined : now,
      updated_at: now,
    });

    // 2. Insert custody log
    const logId = await ctx.db.insert("asset_custody_logs", {
      organization_id: asset.organization_id,
      asset_id: args.asset_id,
      employee_id: args.employee_id,
      action: "handover",
      assigned_date: args.assigned_date,
      condition_at_handover: args.condition_at_handover,
      handed_over_by_user_id: args.handed_over_by_user_id,
      whatsapp_request_id: waRequestId,
      acceptance_status: shouldRequireWa && empPhone ? "pending" : "accepted",
      accepted_at: shouldRequireWa && empPhone ? undefined : now,
      notes: args.notes,
      created_at: now,
    });

    // 3. Dispatch notification to IT Admin or Fleet Manager
    const category = asset.category === "vehicles_fleet" ? "fleet_vehicle" : "it_asset";
    const targetRole = asset.category === "vehicles_fleet" ? "fleet_manager" : "it_admin";

    await ctx.db.insert("stakeholder_notifications", {
      organization_id: asset.organization_id,
      category,
      target_role: targetRole,
      employee_id: String(args.employee_id),
      asset_id: String(args.asset_id),
      title: `Asset Handover: ${asset.asset_tag}`,
      title_arabic: `تسليم عهدة: ${asset.asset_tag}`,
      message: `${asset.asset_name} was handed over to ${employee.first_name} ${employee.last_name}${shouldRequireWa && empPhone ? ' (Awaiting WhatsApp acceptance)' : ''}`,
      message_arabic: `تم تسليم ${asset.asset_name} إلى الموظف ${employee.full_name_arabic || employee.first_name}${shouldRequireWa && empPhone ? ' (بانتظار قبول العهدة عبر واتساب)' : ''}`,
      urgency: "info",
      action_url: "/assets",
      is_read: false,
      action_taken: false,
      created_at: now,
    });

    return {
      success: true,
      log_id: logId,
      whatsapp_requested: Boolean(waRequestId),
      whatsapp_token: waToken,
      employee_phone: empPhone,
    };
  },
});

// 6. Return Asset Custody from Employee (استرداد عهدة)
export const returnAssetCustody = mutation({
  args: {
    asset_id: v.id("assets"),
    returned_date: v.string(), // YYYY-MM-DD
    condition_at_return: v.string(), // "good" | "damaged" | "lost"
    received_by_user_id: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.asset_id);
    if (!asset) throw new Error("Asset not found");
    const previousHolder = asset.current_holder_employee_id;

    const now = new Date().toISOString();

    // 1. Update asset status
    const newStatus = args.condition_at_return === "damaged" ? "under_maintenance" : "available";
    await ctx.db.patch(args.asset_id, {
      status: newStatus,
      current_holder_employee_id: undefined,
      updated_at: now,
    });

    // 2. Insert return custody log
    if (previousHolder) {
      await ctx.db.insert("asset_custody_logs", {
        organization_id: asset.organization_id,
        asset_id: args.asset_id,
        employee_id: previousHolder as any,
        action: "return",
        assigned_date: asset.updated_at.split("T")[0],
        returned_date: args.returned_date,
        condition_at_handover: "good",
        condition_at_return: args.condition_at_return,
        handed_over_by_user_id: args.received_by_user_id,
        notes: args.notes,
        created_at: now,
      });
    }

    return { success: true };
  },
});

// 7. Record Maintenance / Repair Log
export const recordMaintenanceLog = mutation({
  args: {
    asset_id: v.id("assets"),
    service_type: v.string(), // "routine_inspection" | "preventative" | "repair" | "accident_damage"
    service_date: v.string(),
    cost: v.number(),
    service_provider: v.string(),
    invoice_reference: v.optional(v.string()),
    next_service_due_date: v.optional(v.string()),
    performed_by: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.asset_id);
    if (!asset) throw new Error("Asset not found");

    const now = new Date().toISOString();

    const logId = await ctx.db.insert("asset_maintenance_logs", {
      organization_id: asset.organization_id,
      asset_id: args.asset_id,
      service_type: args.service_type,
      service_date: args.service_date,
      cost: args.cost,
      service_provider: args.service_provider.trim(),
      invoice_reference: args.invoice_reference?.trim(),
      next_service_due_date: args.next_service_due_date,
      performed_by: args.performed_by.trim(),
      notes: args.notes,
      created_at: now,
    });

    return { success: true, log_id: logId };
  },
});

// 8. Get Employee Clearance Status (For HR Resignation / Termination - إخلاء طرف)
export const getEmployeeClearanceStatus = query({
  args: {
    employee_id: v.union(v.id("employees"), v.string()),
  },
  handler: async (ctx, args) => {
    const heldAssets = await ctx.db
      .query("assets")
      .withIndex("by_holder", (q) =>
        q.eq("current_holder_employee_id", args.employee_id as string)
      )
      .collect();

    const hasPendingAssets = heldAssets.length > 0;

    return {
      is_cleared: !hasPendingAssets,
      pending_assets_count: heldAssets.length,
      held_assets: heldAssets.map((a) => ({
        _id: a._id,
        asset_tag: a.asset_tag,
        asset_name: a.asset_name,
        category: a.category,
        brand: a.brand,
        model: a.model,
        serial_number: a.serial_number,
      })),
    };
  },
});

// 9. Asset Dashboard Statistics
export const getAssetStats = query({
  args: { organization_id: v.union(v.id("organizations"), v.string()) },
  handler: async (ctx, args) => {
    const assets = await ctx.db
      .query("assets")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .collect();

    const totalCount = assets.length;
    const assignedCount = assets.filter((a) => a.status === "assigned_custody").length;
    const pendingAcceptanceCount = assets.filter((a) => a.status === "pending_handover_acceptance").length;
    const availableCount = assets.filter((a) => a.status === "available").length;
    const maintenanceCount = assets.filter((a) => a.status === "under_maintenance").length;

    const totalValueSAR = assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0);
    const vehiclesCount = assets.filter((a) => a.category === "vehicles_fleet").length;
    const itCount = assets.filter((a) => a.category === "it_hardware").length;

    // Count vehicles with expiring Istimara or Fahas within 30 days
    const urgentFleetRenewals = assets.filter((a) => {
      if (!a.vehicle_details) return false;
      const ist = getDaysUntil(a.vehicle_details.istimara_expiry);
      const fah = getDaysUntil(a.vehicle_details.fahas_expiry);
      return ist <= 30 || fah <= 14;
    }).length;

    return {
      totalCount,
      assignedCount,
      pendingAcceptanceCount,
      availableCount,
      maintenanceCount,
      totalValueSAR,
      vehiclesCount,
      itCount,
      urgentFleetRenewals,
    };
  },
});

// 10. Submit Employee Self-Service Asset Audit (التدقيق والتحقق الذاتي من قبل الموظف)
export const submitAssetSelfAudit = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    asset_id: v.union(v.id("assets"), v.string()),
    employee_id: v.union(v.id("employees"), v.string()),
    audit_campaign_name: v.optional(v.string()),
    reported_condition: v.string(), // "excellent" | "good" | "fair" | "damaged" | "needs_maintenance"
    operational_status: v.string(), // "fully_operational" | "minor_issues" | "inoperable"
    qr_scanned_verified: v.boolean(),
    scanned_tag_payload: v.optional(v.string()),
    photos: v.array(v.string()),
    gps_latitude: v.optional(v.number()),
    gps_longitude: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const asset = await ctx.db.get(args.asset_id as any);
    if (!asset) throw new Error("Asset not found");

    const employee: any = await ctx.db.get(args.employee_id as any);
    if (!employee) throw new Error("Employee not found");

    const now = new Date().toISOString();
    const today = now.split("T")[0];

    // Determine verification status
    const isDiscrepancy =
      args.reported_condition === "damaged" ||
      args.reported_condition === "needs_maintenance" ||
      args.operational_status === "inoperable" ||
      !args.qr_scanned_verified;

    const verificationStatus = isDiscrepancy ? "flagged_discrepancy" : "submitted";

    // Insert audit log
    const auditId = await ctx.db.insert("asset_audits", {
      organization_id: args.organization_id,
      asset_id: args.asset_id,
      employee_id: args.employee_id,
      audit_campaign_name: args.audit_campaign_name || "Self-Service Physical Audit",
      audit_date: today,
      reported_condition: args.reported_condition,
      operational_status: args.operational_status,
      qr_scanned_verified: args.qr_scanned_verified,
      scanned_tag_payload: args.scanned_tag_payload,
      photos: args.photos,
      gps_latitude: args.gps_latitude,
      gps_longitude: args.gps_longitude,
      notes: args.notes,
      verification_status: verificationStatus,
      created_at: now,
    });

    // If asset was reported damaged or needing maintenance, update asset status & alert IT/Asset Admin
    if (args.reported_condition === "damaged" || args.reported_condition === "needs_maintenance") {
      await ctx.db.patch(args.asset_id as any, {
        notes: `Reported by ${employee.first_name} during self-audit: ${args.notes || args.reported_condition}`,
        updated_at: now,
      });

      await ctx.db.insert("stakeholder_notifications", {
        organization_id: asset.organization_id,
        category: "it_asset",
        target_role: "it_admin",
        employee_id: String(args.employee_id),
        asset_id: String(args.asset_id),
        title: `Self-Audit Alert: ${asset.asset_tag}`,
        title_arabic: `تنبيه فحص ذاتي: ${asset.asset_tag}`,
        message: `${employee.first_name} ${employee.last_name} reported ${asset.asset_name} as ${args.reported_condition.toUpperCase()}`,
        message_arabic: `أبلغ الموظف ${employee.full_name_arabic || employee.first_name} عن حالة ${args.reported_condition} للأصل ${asset.asset_name}`,
        urgency: "warning",
        action_url: "/assets",
        is_read: false,
        action_taken: false,
        created_at: now,
      });
    }

    return { success: true, audit_id: auditId, verification_status: verificationStatus };
  },
});

// 11. List Self-Audits for an Organization
export const listAssetAudits = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    asset_id: v.optional(v.union(v.id("assets"), v.string())),
    employee_id: v.optional(v.union(v.id("employees"), v.string())),
  },
  handler: async (ctx, args) => {
    let audits = await ctx.db
      .query("asset_audits")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .collect();

    // Populate asset details and employee names
    const populated = await Promise.all(
      audits.map(async (audit) => {
        let assetName = "Unknown Asset";
        let assetTag = "N/A";
        let employeeName = "Unknown Employee";

        try {
          const a = await ctx.db.get(audit.asset_id as any);
          if (a) {
            assetName = a.asset_name;
            assetTag = a.asset_tag;
          }
        } catch {}

        try {
          const emp = await ctx.db.get(audit.employee_id as any);
          if (emp) {
            employeeName = `${emp.first_name} ${emp.last_name}`;
          }
        } catch {}

        return {
          ...audit,
          asset_name: assetName,
          asset_tag: assetTag,
          employee_name: employeeName,
        };
      })
    );

    return populated.reverse();
  },
});

// 12. Review and Approve/Flag Asset Self-Audit
export const reviewAssetAudit = mutation({
  args: {
    audit_id: v.id("asset_audits"),
    decision: v.union(v.literal("approved"), v.literal("flagged_discrepancy")),
    reviewed_by: v.string(),
  },
  handler: async (ctx, args) => {
    const audit = await ctx.db.get(args.audit_id);
    if (!audit) throw new Error("Audit record not found");

    const now = new Date().toISOString();
    await ctx.db.patch(args.audit_id, {
      verification_status: args.decision,
      reviewed_by: args.reviewed_by,
      reviewed_at: now,
    });

    return { success: true };
  },
});
