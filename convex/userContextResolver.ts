import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Resolve user's context including organization access and permissions
 * This handles users with undefined/null organization_id and provides proper fallbacks
 */
export const resolveUserContext = query({
  args: {
    user_id: v.id("user_profiles"),
  },
  returns: v.object({
    user: v.object({
      _id: v.id("user_profiles"),
      email: v.string(),
      role: v.string(),
      is_active: v.boolean(),
      organization_id: v.optional(v.id("organizations")),
      permissions: v.optional(v.array(v.string())),
    }),
    is_global_admin: v.boolean(),
    has_organization_access: v.boolean(),
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
    context_status: v.union(
      v.literal("complete"), // User has full context
      v.literal("missing_organization"), // User has no organization access
      v.literal("needs_initialization"), // User needs permission initialization
      v.literal("global_admin") // User is global admin
    ),
    recommended_actions: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    // Get user profile
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
    if (isGlobalAdmin || user.role === "super_admin") {
      // Global admin has access to all organizations
      const allOrganizations = await ctx.db
        .query("organizations")
        .filter((q) => q.eq(q.field("is_active"), true))
        .collect();

      const organizationAssignments = allOrganizations.map((org) => ({
        organization_id: org._id,
        organization_name: org.name,
        role: "super_admin",
        permissions: ["read", "write", "delete", "admin", "super_admin"],
        is_active: true,
        is_primary: org._id === user.organization_id,
      }));

      const primaryOrg = user.organization_id ? 
        organizationAssignments.find(org => org.organization_id === user.organization_id) || organizationAssignments[0] :
        organizationAssignments[0];

      return {
        user: {
          _id: user._id,
          email: user.email,
          role: user.role,
          is_active: user.is_active,
          organization_id: user.organization_id,
          permissions: user.permissions,
        },
        is_global_admin: true,
        has_organization_access: true,
        primary_organization: primaryOrg ? {
          organization_id: primaryOrg.organization_id,
          organization_name: primaryOrg.organization_name,
          role: primaryOrg.role,
          permissions: primaryOrg.permissions,
        } : undefined,
        organization_assignments: organizationAssignments,
        context_status: "global_admin" as const,
        recommended_actions: [],
      };
    }

    // Get user's organization assignments
    const assignments = await ctx.db
      .query("user_organization_access")
      .withIndex("by_user_org", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    const organizationAssignments = await Promise.all(
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

    // Determine primary organization
    let primaryOrganization = undefined;
    
    if (user.organization_id) {
      // Try to find assignment for primary org
      const primaryAssignment = organizationAssignments.find(
        org => org.organization_id === user.organization_id
      );
      
      if (primaryAssignment) {
        primaryOrganization = {
          organization_id: primaryAssignment.organization_id,
          organization_name: primaryAssignment.organization_name,
          role: primaryAssignment.role,
          permissions: primaryAssignment.permissions,
        };
      } else {
        // User has organization_id but no assignment - need to create one
        const primaryOrg = await ctx.db.get(user.organization_id);
        if (primaryOrg) {
          primaryOrganization = {
            organization_id: user.organization_id,
            organization_name: primaryOrg.name,
            role: user.role || "user",
            permissions: user.permissions || ["read"],
          };
          
          // Add to assignments for consistency
          organizationAssignments.push({
            organization_id: user.organization_id,
            organization_name: primaryOrg.name,
            role: user.role || "user",
            permissions: user.permissions || ["read"],
            is_active: true,
            is_primary: true,
          });
        }
      }
    } else if (organizationAssignments.length > 0) {
      // User has no primary org but has assignments - use first one
      const firstAssignment = organizationAssignments[0];
      primaryOrganization = {
        organization_id: firstAssignment.organization_id,
        organization_name: firstAssignment.organization_name,
        role: firstAssignment.role,
        permissions: firstAssignment.permissions,
      };
    }

    // Determine context status and recommendations
    let contextStatus: "complete" | "missing_organization" | "needs_initialization" | "global_admin";
    let recommendedActions: string[] = [];

    if (!user.organization_id && organizationAssignments.length === 0) {
      contextStatus = "missing_organization";
      recommendedActions.push("Contact administrator to assign you to an organization");
    } else if (!user.organization_id && organizationAssignments.length > 0) {
      contextStatus = "needs_initialization";
      recommendedActions.push("Set primary organization from available assignments");
    } else if (user.organization_id && organizationAssignments.length === 0) {
      contextStatus = "needs_initialization";
      recommendedActions.push("Initialize organization access permissions");
    } else {
      contextStatus = "complete";
    }

    return {
      user: {
        _id: user._id,
        email: user.email,
        role: user.role,
        is_active: user.is_active,
        organization_id: user.organization_id,
        permissions: user.permissions,
      },
      is_global_admin: false,
      has_organization_access: organizationAssignments.length > 0 || !!user.organization_id,
      primary_organization: primaryOrganization,
      organization_assignments: organizationAssignments,
      context_status: contextStatus,
      recommended_actions: recommendedActions,
    };
  },
});

/**
 * Fix user context by initializing missing permissions and organization access
 */
export const fixUserContext = mutation({
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
        message: "Only global admins or system admins can fix user context",
        actions_taken: [],
      };
    }

    const now = new Date().toISOString();
    const actionsTaken: string[] = [];

    // If user has organization_id but no organization access record, create it
    if (user.organization_id) {
      const existingAccess = await ctx.db
        .query("user_organization_access")
        .withIndex("by_user_org", (q) => 
          q.eq("user_id", args.user_id).eq("organization_id", user.organization_id!)
        )
        .unique();

      if (!existingAccess) {
        await ctx.db.insert("user_organization_access", {
          user_id: args.user_id,
          organization_id: user.organization_id,
          role: user.role || "user",
          permissions: user.permissions || ["read"],
          is_active: true,
          created_at: now,
          updated_at: now,
        });
        actionsTaken.push("Created organization access record");
      }

      // Create model permissions if they don't exist
      const defaultModels = ["customers", "leads", "inventory", "suppliers", "quotations", "process_flows", "settings", "reports"];
      
      for (const modelName of defaultModels) {
        const existingModelAccess = await ctx.db
          .query("model_access_control")
          .withIndex("by_user_org_model", (q) => 
            q.eq("user_id", args.user_id)
             .eq("organization_id", user.organization_id!)
             .eq("model_name", modelName)
          )
          .unique();

        if (!existingModelAccess) {
          // Create model access based on user's role
          let canRead = true;
          let canCreate = false;
          let canUpdate = false;
          let canDelete = false;

          if (user.role === "admin" || user.role === "super_admin") {
            canCreate = true;
            canUpdate = true;
            canDelete = true;
          } else if (user.role === "manager") {
            canCreate = true;
            canUpdate = true;
          } else if (user.role === "user") {
            canCreate = true;
          }

          await ctx.db.insert("model_access_control", {
            user_id: args.user_id,
            organization_id: user.organization_id,
            model_name: modelName,
            can_read: canRead,
            can_create: canCreate,
            can_update: canUpdate,
            can_delete: canDelete,
            created_at: now,
            updated_at: now,
          });
        }
      }
      
      if (actionsTaken.length === 1) {
        actionsTaken.push("Created model permissions");
      }
    } else {
      // User has no organization_id - check if they have any assignments
      const assignments = await ctx.db
        .query("user_organization_access")
        .withIndex("by_user_org", (q) => q.eq("user_id", args.user_id))
        .filter((q) => q.eq(q.field("is_active"), true))
        .collect();

      if (assignments.length > 0) {
        // Set the first assignment as primary organization
        const primaryAssignment = assignments[0];
        await ctx.db.patch(args.user_id, {
          organization_id: primaryAssignment.organization_id,
          role: primaryAssignment.role,
          permissions: primaryAssignment.permissions,
          updated_at: now,
        });
        actionsTaken.push("Set primary organization from existing assignments");
      }
    }

    return {
      success: true,
      message: `User context fixed successfully. ${actionsTaken.length} actions taken.`,
      actions_taken: actionsTaken,
    };
  },
});
