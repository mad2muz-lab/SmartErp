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

// 1. List Notifications for Organization & Target Role
export const listNotifications = query({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    role: v.optional(v.string()), // Filter by stakeholder role e.g. "hr_manager"
    urgency: v.optional(v.string()),
    unread_only: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let notifications = await ctx.db
      .query("stakeholder_notifications")
      .withIndex("by_org", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .collect();

    if (args.role && args.role !== "all" && args.role !== "super_admin") {
      notifications = notifications.filter(
        (n) => n.target_role === args.role || n.target_role === "all"
      );
    }

    if (args.urgency && args.urgency !== "all") {
      notifications = notifications.filter((n) => n.urgency === args.urgency);
    }

    if (args.unread_only) {
      notifications = notifications.filter((n) => !n.is_read);
    }

    return notifications.reverse();
  },
});

// 2. Mark Notification as Read
export const markNotificationRead = mutation({
  args: { notification_id: v.id("stakeholder_notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notification_id, { is_read: true });
    return { success: true };
  },
});

// 3. Mark All Notifications as Read
export const markAllNotificationsRead = mutation({
  args: { organization_id: v.union(v.id("organizations"), v.string()) },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("stakeholder_notifications")
      .withIndex("by_org", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .filter((q) => q.eq(q.field("is_read"), false))
      .collect();

    for (const n of notifications) {
      await ctx.db.patch(n._id, { is_read: true });
    }

    return { success: true, marked_count: notifications.length };
  },
});

// 4. Dispatch a Stakeholder Notification
export const dispatchNotification = mutation({
  args: {
    organization_id: v.union(v.id("organizations"), v.string()),
    category: v.string(), // "legal_document" | "fleet_vehicle" | "it_asset" | "asset_clearance" | "probation_review"
    target_role: v.string(), // "hr_manager" | "gro_officer" | "fleet_manager" | "it_admin" | "direct_manager" | "finance_manager"
    target_user_id: v.optional(v.string()),
    employee_id: v.optional(v.string()),
    asset_id: v.optional(v.string()),
    title: v.string(),
    title_arabic: v.string(),
    message: v.string(),
    message_arabic: v.string(),
    urgency: v.string(), // "info" | "warning" | "critical"
    action_url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("stakeholder_notifications", {
      ...args,
      is_read: false,
      action_taken: false,
      created_at: new Date().toISOString(),
    });
    return { success: true, notification_id: id };
  },
});

// 5. Automated Compliance Scanner (Evaluates Legal Documents & Fleet Renewals)
export const runDailyComplianceCheck = mutation({
  args: { organization_id: v.union(v.id("organizations"), v.string()) },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    let createdCount = 0;

    // A. Check Legal Documents (Iqama, Passport, CCHI Insurance)
    const docs = await ctx.db
      .query("employee_legal_documents")
      .withIndex("by_org", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .collect();

    const employees = await ctx.db
      .query("employees")
      .withIndex("by_organization", (q) =>
        q.eq("organization_id", args.organization_id as any)
      )
      .collect();

    const empMap = new Map(employees.map((e) => [String(e._id), e]));

    for (const doc of docs) {
      const days = getDaysUntil(doc.expiry_date_gregorian);
      const emp = empMap.get(String(doc.employee_id));
      const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Employee";
      const empNameAr = emp?.full_name_arabic || empName;

      if (days <= 30 && days >= 0) {
        const urgency = days <= 7 ? "critical" : "warning";
        const docLabel =
          doc.document_type === "iqama"
            ? "Iqama"
            : doc.document_type === "passport"
            ? "Passport"
            : doc.document_type === "medical_insurance"
            ? "Insurance Policy"
            : "Document";
        const docLabelAr =
          doc.document_type === "iqama"
            ? "الإقامة"
            : doc.document_type === "passport"
            ? "جواز السفر"
            : doc.document_type === "medical_insurance"
            ? "التأمين الطبي"
            : "الوثيقة";

        await ctx.db.insert("stakeholder_notifications", {
          organization_id: args.organization_id,
          category: "legal_document",
          target_role: "gro_officer", // Dedicated Government Relations Officer
          employee_id: String(doc.employee_id),
          title: `Expiry Alert: ${docLabel} for ${empName}`,
          title_arabic: `تنبيه انتهاء: ${docLabelAr} للموظف ${empNameAr}`,
          message: `${docLabel} (${doc.document_number}) expires in ${days} days (${doc.expiry_date_gregorian}). Please initiate renewal.`,
          message_arabic: `تنتهي صلاحية ${docLabelAr} (${doc.document_number}) خلال ${days} يوم (${doc.expiry_date_gregorian}). يرجى بدء إجراءات التجديد فوراً.`,
          urgency,
          action_url: "/hr",
          is_read: false,
          action_taken: false,
          created_at: now,
        });
        createdCount++;
      }
    }

    // B. Check Fleet Vehicles (Istimara & Fahas Expiry)
    const vehicles = await ctx.db
      .query("assets")
      .withIndex("by_category", (q) =>
        q.eq("organization_id", args.organization_id as any).eq("category", "vehicles_fleet")
      )
      .collect();

    for (const v of vehicles) {
      if (!v.vehicle_details) continue;

      const istimaraDays = getDaysUntil(v.vehicle_details.istimara_expiry);
      if (istimaraDays <= 30 && istimaraDays >= 0) {
        await ctx.db.insert("stakeholder_notifications", {
          organization_id: args.organization_id,
          category: "fleet_vehicle",
          target_role: "fleet_manager",
          asset_id: String(v._id),
          title: `Istimara Expiry: Vehicle ${v.vehicle_details.plate_number}`,
          title_arabic: `انتهاء استمارة: المركبة ${v.vehicle_details.plate_number}`,
          message: `Vehicle ${v.asset_name} (Plate ${v.vehicle_details.plate_number}) Istimara expires in ${istimaraDays} days.`,
          message_arabic: `استمارة المركبة ${v.asset_name} (لوحة ${v.vehicle_details.plate_number}) تنتهي خلال ${istimaraDays} يوم.`,
          urgency: istimaraDays <= 7 ? "critical" : "warning",
          action_url: "/assets",
          is_read: false,
          action_taken: false,
          created_at: now,
        });
        createdCount++;
      }

      const fahasDays = getDaysUntil(v.vehicle_details.fahas_expiry);
      if (fahasDays <= 14 && fahasDays >= 0) {
        await ctx.db.insert("stakeholder_notifications", {
          organization_id: args.organization_id,
          category: "fleet_vehicle",
          target_role: "fleet_manager",
          asset_id: String(v._id),
          title: `Fahas Inspection Due: ${v.vehicle_details.plate_number}`,
          title_arabic: `فحص دوري مطلوب: ${v.vehicle_details.plate_number}`,
          message: `Vehicle ${v.asset_name} requires Moroor periodic technical inspection (Fahas) in ${fahasDays} days.`,
          message_arabic: `المركبة ${v.asset_name} تتطلب فحصاً فنياً دورياً خلال ${fahasDays} يوم.`,
          urgency: "warning",
          action_url: "/assets",
          is_read: false,
          action_taken: false,
          created_at: now,
        });
        createdCount++;
      }
    }

    return { success: true, triggered_notifications: createdCount };
  },
});
