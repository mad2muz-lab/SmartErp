import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Get user's current permissions and roles across all organizations
 */
export const getUserPermissionsSummary = query({
  args: {
    user_id: v.id("user_profiles"),
  },
  returns: v.object({
    user_id: v.id("user_profiles"),
    primary_organization: v.optional(v.object({
      organization_id: v.id("organizations"),
      organization_name: v.string(),
      role: v.string(),
      permissions: v.array(v.string()),
    })),
    organization_assignments: v.array(v.object({
      organization_id: v.id("organizations"),
      organization_name: v.string(),
      role: v.string(),
      permissions: v.array(v.string()),
      is_active: v.boolean(),
      is_primary: v.boolean(),
    })),
    is_global_admin: v.boolean(),
    can_switch_organizations: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user is global admin (from global_admins table)
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    // PROFESSIONAL FIX: Super admin role should have global access
    const hasGlobalAccess = isGlobalAdmin || user.role === "super_admin";

    // Get primary organization details
    let primaryOrganization: any = undefined;
    if (user.organization_id) {
      const primaryOrg = await ctx.db.get(user.organization_id);
      if (primaryOrg) {
        primaryOrganization = {
          organization_id: primaryOrg._id,
          organization_name: primaryOrg.name,
          role: user.role || "user",
          permissions: user.permissions || ["read"],
        };
      }
    }

    // Get all organization assignments
    let organizationAssignments = [];
    
    if (hasGlobalAccess) {
      // Super admin and global admin have access to all organizations
      const allOrganizations = await ctx.db
        .query("organizations")
        .filter((q) => q.eq(q.field("is_active"), true))
        .collect();
      
      organizationAssignments = allOrganizations.map((org) => ({
        organization_id: org._id,
        organization_name: org.name,
        role: "super_admin",
        permissions: ["read", "write", "delete", "admin", "super_admin"],
        is_active: true,
        is_primary: org._id === user.organization_id,
      }));
    } else {
      // Regular users get their assignments
      const assignments = await ctx.db
        .query("user_organization_access")
        .withIndex("by_user_org", (q) => q.eq("user_id", args.user_id))
        .filter((q) => q.eq(q.field("is_active"), true))
        .collect();

      organizationAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const org = await ctx.db.get(assignment.organization_id);
          return {
            organization_id: assignment.organization_id,
            organization_name: org?.name || "Unknown Organization",
            role: assignment.role,
            permissions: assignment.permissions,
            is_active: assignment.is_active,
            is_primary: assignment.organization_id === user.organization_id,
          };
        })
      );
    }

    // Determine if user can switch organizations
    const canSwitchOrganizations = organizationAssignments.length > 1 || hasGlobalAccess;

    return {
      user_id: args.user_id,
      primary_organization: primaryOrganization,
      organization_assignments: organizationAssignments,
      is_global_admin: isGlobalAdmin,
      can_switch_organizations: canSwitchOrganizations,
    };
  },
});

/**
 * Switch user's active organization context
 */
export const switchUserOrganization = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    new_context: v.optional(v.object({
      organization_id: v.id("organizations"),
      organization_name: v.string(),
      role: v.string(),
      permissions: v.array(v.string()),
    })),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Check if user is global admin (from global_admins table)
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    // PROFESSIONAL FIX: Super admin role should have global access
    const hasGlobalAccess = isGlobalAdmin || user.role === "super_admin";

    // If global admin or super admin, they can switch to any organization
    if (hasGlobalAccess) {
      const org = await ctx.db.get(args.organization_id);
      if (!org) {
        return {
          success: false,
          message: "Organization not found",
        };
      }

      // Update user's primary organization
      await ctx.db.patch(args.user_id, {
        organization_id: args.organization_id,
        role: "super_admin",
        permissions: ["read", "write", "delete", "admin", "super_admin"],
        updated_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: `Switched to ${org.name} successfully`,
        new_context: {
          organization_id: org._id,
          organization_name: org.name,
          role: "super_admin",
          permissions: ["read", "write", "delete", "admin", "super_admin"],
        },
      };
    }

    // Check if user has access to this organization
    const assignment = await ctx.db
      .query("user_organization_access")
      .withIndex("by_user_org", (q) => 
        q.eq("user_id", args.user_id).eq("organization_id", args.organization_id)
      )
      .filter((q) => q.eq(q.field("is_active"), true))
      .unique();

    if (!assignment) {
      return {
        success: false,
        message: "You don't have access to this organization",
      };
    }

    // Update user's primary organization
    await ctx.db.patch(args.user_id, {
      organization_id: args.organization_id,
      role: assignment.role,
      permissions: assignment.permissions,
      updated_at: new Date().toISOString(),
    });

    const org = await ctx.db.get(args.organization_id);

    return {
      success: true,
      message: `Switched to ${org?.name} successfully`,
      new_context: {
        organization_id: args.organization_id,
        organization_name: org?.name || "Unknown Organization",
        role: assignment.role,
        permissions: assignment.permissions,
      },
    };
  },
});

/**
 * Grant permissions to user for specific organization
 */
export const grantUserPermissions = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    role: v.string(),
    permissions: v.array(v.string()),
    granted_by: v.id("user_profiles"),
    model_permissions: v.optional(v.record(v.string(), v.object({
      can_read: v.boolean(),
      can_create: v.boolean(),
      can_update: v.boolean(),
      can_delete: v.boolean(),
    }))),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify the granter has permission to grant permissions
    const granter = await ctx.db.get(args.granted_by);
    if (!granter) {
      return {
        success: false,
        message: "Granter not found",
      };
    }

    // Check if granter is global admin or has admin role in the organization
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.granted_by))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    if (!isGlobalAdmin && granter.role !== "admin" && granter.role !== "super_admin") {
      return {
        success: false,
        message: "Only global admins or organization admins can grant permissions",
      };
    }

    const now = new Date().toISOString();

    // Check if assignment already exists
    const existingAssignment = await ctx.db
      .query("user_organization_access")
      .withIndex("by_user_org", (q) => 
        q.eq("user_id", args.user_id).eq("organization_id", args.organization_id)
      )
      .unique();

    if (existingAssignment) {
      // Update existing assignment
      await ctx.db.patch(existingAssignment._id, {
        role: args.role,
        permissions: args.permissions,
        updated_at: now,
      });
    } else {
      // Create new assignment
      await ctx.db.insert("user_organization_access", {
        user_id: args.user_id,
        organization_id: args.organization_id,
        role: args.role,
        permissions: args.permissions,
        is_active: true,
        created_at: now,
        updated_at: now,
      });
    }

    // Grant model-specific permissions if provided
    if (args.model_permissions) {
      const defaultModels = ["customers", "leads", "inventory", "suppliers", "quotations", "process_flows", "settings", "reports"];
      
      for (const [modelName, permissions] of Object.entries(args.model_permissions)) {
        if (defaultModels.includes(modelName)) {
          // Check if model access already exists
          const existingModelAccess = await ctx.db
            .query("model_access_control")
            .withIndex("by_user_org_model", (q) => 
              q.eq("user_id", args.user_id)
               .eq("organization_id", args.organization_id)
               .eq("model_name", modelName)
            )
            .unique();

          if (existingModelAccess) {
            // Update existing model access
            await ctx.db.patch(existingModelAccess._id, {
              can_read: permissions.can_read,
              can_create: permissions.can_create,
              can_update: permissions.can_update,
              can_delete: permissions.can_delete,
              updated_at: now,
            });
          } else {
            // Create new model access
            await ctx.db.insert("model_access_control", {
              user_id: args.user_id,
              organization_id: args.organization_id,
              model_name: modelName,
              can_read: permissions.can_read,
              can_create: permissions.can_create,
              can_update: permissions.can_update,
              can_delete: permissions.can_delete,
              created_at: now,
              updated_at: now,
            });
          }
        }
      }
    }

    const org = await ctx.db.get(args.organization_id);
    const user = await ctx.db.get(args.user_id);

    return {
      success: true,
      message: `Permissions granted to ${user?.email} for ${org?.name}`,
    };
  },
});

/**
 * Revoke user permissions for specific organization
 */
export const revokeUserPermissions = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    revoked_by: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify the revoker has permission to revoke permissions
    const revoker = await ctx.db.get(args.revoked_by);
    if (!revoker) {
      return {
        success: false,
        message: "Revoker not found",
      };
    }

    // Check if revoker is global admin or has admin role
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.revoked_by))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    if (!isGlobalAdmin && revoker.role !== "admin" && revoker.role !== "super_admin") {
      return {
        success: false,
        message: "Only global admins or organization admins can revoke permissions",
      };
    }

    // Find and deactivate the assignment
    const assignment = await ctx.db
      .query("user_organization_access")
      .withIndex("by_user_org", (q) => 
        q.eq("user_id", args.user_id).eq("organization_id", args.organization_id)
      )
      .unique();

    if (assignment) {
      await ctx.db.patch(assignment._id, {
        is_active: false,
        updated_at: new Date().toISOString(),
      });
    }

    // Remove model access controls
    const modelAccessList = await ctx.db
      .query("model_access_control")
      .filter((q) => 
        q.eq(q.field("user_id"), args.user_id) &&
        q.eq(q.field("organization_id"), args.organization_id)
      )
      .collect();

    for (const modelAccess of modelAccessList) {
      await ctx.db.delete(modelAccess._id);
    }

    const org = await ctx.db.get(args.organization_id);
    const user = await ctx.db.get(args.user_id);

    return {
      success: true,
      message: `Permissions revoked from ${user?.email} for ${org?.name}`,
    };
  },
});
