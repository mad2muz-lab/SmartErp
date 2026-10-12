import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Fix super admin context by ensuring they have access to all organizations
 * This is a utility function to resolve issues with super admins having undefined organization_id
 */
export const fixSuperAdminContext = mutation({
  args: {
    user_id: v.id("user_profiles"),
    fixed_by: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    actions_taken: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return {
        success: false,
        message: "User not found",
        actions_taken: [],
      };
    }

    // Verify the fixer has permission
    const fixer = await ctx.db.get(args.fixed_by);
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.fixed_by))
      .collect();
    
    const isFixerGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;
    
    if (!isFixerGlobalAdmin && fixer?.role !== "admin" && fixer?.role !== "super_admin") {
      return {
        success: false,
        message: "Only global admins or system admins can fix super admin context",
        actions_taken: [],
      };
    }

    // Check if user is actually a super admin
    if (user.role !== "super_admin") {
      return {
        success: false,
        message: "User is not a super admin",
        actions_taken: [],
      };
    }

    const now = new Date().toISOString();
    const actionsTaken: string[] = [];

    // Get all organizations
    const allOrganizations = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    // If super admin has no organization_id, set them to the first organization
    if (!user.organization_id && allOrganizations.length > 0) {
      const firstOrg = allOrganizations[0];
      await ctx.db.patch(args.user_id, {
        organization_id: firstOrg._id,
        updated_at: now,
      });
      actionsTaken.push(`Set primary organization to ${firstOrg.name}`);
    }

    // Ensure super admin has access to all organizations
    for (const org of allOrganizations) {
      const existingAccess = await ctx.db
        .query("user_organization_access")
        .withIndex("by_user_org", (q) => 
          q.eq("user_id", args.user_id).eq("organization_id", org._id)
        )
        .unique();

      if (!existingAccess) {
        await ctx.db.insert("user_organization_access", {
          user_id: args.user_id,
          organization_id: org._id,
          role: "super_admin",
          permissions: ["read", "write", "delete", "admin", "super_admin"],
          is_active: true,
          created_at: now,
          updated_at: now,
        });
        actionsTaken.push(`Created access to ${org.name}`);
      }
    }

    // Ensure super admin has model permissions for all organizations
    const defaultModels = ["customers", "leads", "inventory", "suppliers", "quotations", "process_flows", "settings", "reports"];
    
    for (const org of allOrganizations) {
      for (const modelName of defaultModels) {
        const existingModelAccess = await ctx.db
          .query("model_access_control")
          .withIndex("by_user_org_model", (q) => 
            q.eq("user_id", args.user_id)
             .eq("organization_id", org._id)
             .eq("model_name", modelName)
          )
          .unique();

        if (!existingModelAccess) {
          await ctx.db.insert("model_access_control", {
            user_id: args.user_id,
            organization_id: org._id,
            model_name: modelName,
            can_read: true,
            can_create: true,
            can_update: true,
            can_delete: true,
            created_at: now,
            updated_at: now,
          });
        }
      }
    }
    
    if (actionsTaken.length === 0) {
      actionsTaken.push("Super admin context was already properly configured");
    }

    return {
      success: true,
      message: `Super admin context fixed successfully. ${actionsTaken.length} actions taken.`,
      actions_taken: actionsTaken,
    };
  },
});

/**
 * Get super admin status and context information
 */
export const getSuperAdminStatus = query({
  args: {
    user_id: v.id("user_profiles"),
  },
  returns: v.object({
    is_super_admin: v.boolean(),
    has_organization_id: v.boolean(),
    organization_count: v.number(),
    access_count: v.number(),
    model_permissions_count: v.number(),
    context_status: v.string(),
    recommendations: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      throw new Error("User not found");
    }

    const isSuperAdmin = user.role === "super_admin";
    const hasOrganizationId = !!user.organization_id;

    // Get all organizations
    const allOrganizations = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    // Get organization access count
    const accessCount = await ctx.db
      .query("user_organization_access")
      .withIndex("by_user_org", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    // Get model permissions count
    const modelPermissionsCount = await ctx.db
      .query("model_access_control")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .collect();

    let contextStatus = "unknown";
    const recommendations: string[] = [];

    if (isSuperAdmin) {
      if (!hasOrganizationId) {
        contextStatus = "missing_primary_org";
        recommendations.push("Set primary organization");
      }
      
      if (accessCount.length < allOrganizations.length) {
        contextStatus = "missing_org_access";
        recommendations.push("Create access to all organizations");
      }
      
      if (modelPermissionsCount.length < (allOrganizations.length * 8)) { // 8 default models
        contextStatus = "missing_model_permissions";
        recommendations.push("Create model permissions for all organizations");
      }
      
      if (contextStatus === "unknown") {
        contextStatus = "complete";
        recommendations.push("Super admin context is properly configured");
      }
    } else {
      contextStatus = "not_super_admin";
      recommendations.push("User is not a super admin");
    }

    return {
      is_super_admin: isSuperAdmin,
      has_organization_id: hasOrganizationId,
      organization_count: allOrganizations.length,
      access_count: accessCount.length,
      model_permissions_count: modelPermissionsCount.length,
      context_status: contextStatus,
      recommendations: recommendations,
    };
  },
});
