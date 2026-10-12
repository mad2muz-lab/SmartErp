import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Initialize permissions for all users (Global Admin only)
 * This ensures all users have proper organization access and model permissions
 */
export const initializeAllUserPermissions = mutation({
  args: {
    initialized_by: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    users_processed: v.number(),
    permissions_created: v.number(),
  }),
  handler: async (ctx, args) => {
    // Verify the initializer is a global admin
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.initialized_by))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    if (!isGlobalAdmin) {
      return {
        success: false,
        message: "Only global admins can initialize permissions",
        users_processed: 0,
        permissions_created: 0,
      };
    }

    const now = new Date().toISOString();
    let usersProcessed = 0;
    let permissionsCreated = 0;

    // Get all active users
    const allUsers = await ctx.db
      .query("user_profiles")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    for (const user of allUsers) {
      usersProcessed++;
      
      // Skip global admins as they have all permissions
      const userGlobalAdmin = await ctx.db
        .query("global_admins")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .collect();
      
      if (userGlobalAdmin.length > 0 && userGlobalAdmin[0].is_active) {
        console.log(`Skipping global admin: ${user.email}`);
        continue;
      }

      // Ensure user has organization access record for their primary organization
      if (user.organization_id) {
        const existingOrgAccess = await ctx.db
          .query("user_organization_access")
          .withIndex("by_user_org", (q) => 
            q.eq("user_id", user._id).eq("organization_id", user.organization_id!)
          )
          .unique();

        if (!existingOrgAccess) {
          // Create organization access record
          await ctx.db.insert("user_organization_access", {
            user_id: user._id,
            organization_id: user.organization_id,
            role: user.role || "user",
            permissions: user.permissions || ["read"],
            is_active: true,
            created_at: now,
            updated_at: now,
          });
          permissionsCreated++;
          console.log(`Created org access for ${user.email} in ${user.organization_id}`);
        }

        // Ensure user has model permissions
        const defaultModels = ["customers", "leads", "inventory", "suppliers", "quotations", "delivery_notes", "invoices", "process_flows", "settings", "reports", "profit_sharing"];
        
        for (const modelName of defaultModels) {
          const existingModelAccess = await ctx.db
            .query("model_access_control")
            .withIndex("by_user_org_model", (q) => 
              q.eq("user_id", user._id)
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
            // viewer role only has read access

            await ctx.db.insert("model_access_control", {
              user_id: user._id,
              organization_id: user.organization_id,
              model_name: modelName,
              can_read: canRead,
              can_create: canCreate,
              can_update: canUpdate,
              can_delete: canDelete,
              created_at: now,
              updated_at: now,
            });
            permissionsCreated++;
            console.log(`Created model access for ${user.email} on ${modelName}`);
          }
        }
      }
    }

    return {
      success: true,
      message: `Permissions initialized successfully for ${usersProcessed} users`,
      users_processed: usersProcessed,
      permissions_created: permissionsCreated,
    };
  },
});

/**
 * Initialize permissions for a specific user
 */
export const initializeUserPermissions = mutation({
  args: {
    user_id: v.id("user_profiles"),
    initialized_by: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    permissions_created: v.number(),
  }),
  handler: async (ctx, args) => {
    // Verify the initializer is a global admin
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.initialized_by))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    if (!isGlobalAdmin) {
      return {
        success: false,
        message: "Only global admins can initialize permissions",
        permissions_created: 0,
      };
    }

    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return {
        success: false,
        message: "User not found",
        permissions_created: 0,
      };
    }

    // Skip global admins
    const userGlobalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .collect();
    
    if (userGlobalAdmin.length > 0 && userGlobalAdmin[0].is_active) {
      return {
        success: false,
        message: "Global admins don't need permission initialization",
        permissions_created: 0,
      };
    }

    const now = new Date().toISOString();
    let permissionsCreated = 0;

    // Ensure user has organization access record for their primary organization
    if (user.organization_id) {
      const existingOrgAccess = await ctx.db
        .query("user_organization_access")
        .withIndex("by_user_org", (q) => 
          q.eq("user_id", user._id).eq("organization_id", user.organization_id!)
        )
        .unique();

      if (!existingOrgAccess) {
        // Create organization access record
        await ctx.db.insert("user_organization_access", {
          user_id: user._id,
          organization_id: user.organization_id,
          role: user.role || "user",
          permissions: user.permissions || ["read"],
          is_active: true,
          created_at: now,
          updated_at: now,
        });
        permissionsCreated++;
      }

      // Ensure user has model permissions
      const defaultModels = ["customers", "leads", "inventory", "suppliers", "quotations", "process_flows", "settings", "reports", "profit_sharing"];
      
      for (const modelName of defaultModels) {
        const existingModelAccess = await ctx.db
          .query("model_access_control")
          .withIndex("by_user_org_model", (q) => 
            q.eq("user_id", user._id)
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
          // viewer role only has read access

          await ctx.db.insert("model_access_control", {
            user_id: user._id,
            organization_id: user.organization_id,
            model_name: modelName,
            can_read: canRead,
            can_create: canCreate,
            can_update: canUpdate,
            can_delete: canDelete,
            created_at: now,
            updated_at: now,
          });
          permissionsCreated++;
        }
      }
    }

    return {
      success: true,
      message: `Permissions initialized for ${user.email}`,
      permissions_created: permissionsCreated,
    };
  },
});

/**
 * Get permission status for all users
 */
export const getPermissionStatus = query({
  args: {
    requested_by: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    users_with_permissions: v.number(),
    users_without_permissions: v.number(),
    total_users: v.number(),
    details: v.array(v.object({
      user_id: v.id("user_profiles"),
      email: v.string(),
      role: v.string(),
      has_org_access: v.boolean(),
      has_model_permissions: v.boolean(),
      organization_id: v.optional(v.id("organizations")),
    })),
  }),
  handler: async (ctx, args) => {
    // Verify the requester is a global admin
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.requested_by))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    if (!isGlobalAdmin) {
      return {
        success: false,
        message: "Only global admins can check permission status",
        users_with_permissions: 0,
        users_without_permissions: 0,
        total_users: 0,
        details: [],
      };
    }

    const allUsers = await ctx.db
      .query("user_profiles")
      .filter((q) => q.eq(q.field("is_active"), true))
      .collect();

    const details = [];
    let usersWithPermissions = 0;
    let usersWithoutPermissions = 0;

    for (const user of allUsers) {
      // Skip global admins
      const userGlobalAdmin = await ctx.db
        .query("global_admins")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .collect();
      
      if (userGlobalAdmin.length > 0 && userGlobalAdmin[0].is_active) {
        details.push({
          user_id: user._id,
          email: user.email,
          role: user.role,
          has_org_access: true,
          has_model_permissions: true,
          organization_id: user.organization_id,
        });
        usersWithPermissions++;
        continue;
      }

      let hasOrgAccess = false;
      let hasModelPermissions = false;

      if (user.organization_id) {
        // Check organization access
        const orgAccess = await ctx.db
          .query("user_organization_access")
          .withIndex("by_user_org", (q) => 
            q.eq("user_id", user._id).eq("organization_id", user.organization_id!)
          )
          .unique();

        hasOrgAccess = !!orgAccess;

        // Check model permissions
        const modelAccess = await ctx.db
          .query("model_access_control")
          .filter((q) => 
            q.eq(q.field("user_id"), user._id) &&
            q.eq(q.field("organization_id"), user.organization_id!)
          )
          .collect();

        hasModelPermissions = modelAccess.length > 0;
      }

      details.push({
        user_id: user._id,
        email: user.email,
        role: user.role,
        has_org_access: hasOrgAccess,
        has_model_permissions: hasModelPermissions,
        organization_id: user.organization_id,
      });

      if (hasOrgAccess && hasModelPermissions) {
        usersWithPermissions++;
      } else {
        usersWithoutPermissions++;
      }
    }

    return {
      success: true,
      message: "Permission status retrieved successfully",
      users_with_permissions: usersWithPermissions,
      users_without_permissions: usersWithoutPermissions,
      total_users: allUsers.length,
      details,
    };
  },
});
