import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


// Modularized: constants moved to userManagement/constants.ts
import { GLOBAL_ADMIN_APPROVAL_STATUS, ORG_ASSIGNMENT_STATUS, USER_STATUS, USER_ROLES } from "./userManagement/constants";

// Modularized: queries and mutations moved to userManagement/
export * from "./userManagement/userQueries";
export * from "./userManagement/userMutations";
export * from "./userManagement/organizationQueries";
export * from "./userManagement/organizationMutations";

/**
 * Get all users with their organization assignments (Super Admin only)
 * This query shows ALL users from both user_profiles and global_admins tables
 */
export const getAllUsersWithOrganizations = query({
  args: {
    user_id: v.id("user_profiles"), // Current user ID for authorization check
  },
  returns: v.array(
    v.object({
      _id: v.id("user_profiles"),
      _creationTime: v.float64(),
      email: v.string(),
      name: v.optional(v.string()),
      given_name: v.optional(v.string()),
      family_name: v.optional(v.string()),
      role: v.string(),
      is_active: v.boolean(),
      last_login: v.optional(v.string()),
      permissions: v.optional(v.array(v.string())),
      primary_organization_id: v.optional(v.id("organizations")),
      primary_organization_name: v.union(v.string(), v.null()),
      // Google OAuth fields
      google_id: v.optional(v.string()),
      picture: v.optional(v.string()),
      email_verified: v.optional(v.boolean()),
      updated_at: v.optional(v.string()),
      organization_assignments: v.array(
        v.object({
          organization_id: v.id("organizations"),
          organization_name: v.string(),
          role: v.string(),
          permissions: v.array(v.string()),
          is_active: v.boolean(),
          created_at: v.string(),
        })
      ),
      // Add missing fields
      created_at: v.optional(v.string()),
      department: v.optional(v.string()),
      first_name: v.optional(v.string()),
      last_name: v.optional(v.string()),
      organization_id: v.optional(v.id("organizations")),
      user_id: v.optional(v.string()),
      // Global admin indicator
      is_global_admin: v.boolean(),
      user_source: v.string(), // "user_profiles" or "global_admins"
      // Role change tracking fields
      role_changed_at: v.optional(v.string()),
      role_changed_by: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Check if user is super admin or global admin
    console.log('🔍 getAllUsersWithOrganizations - Looking up user:', args.user_id);
    const currentUser = await ctx.db.get(args.user_id);
    if (!currentUser) {
      console.log('❌ getAllUsersWithOrganizations - User not found:', args.user_id);
      throw new Error("User not found");
    }

    console.log('✅ getAllUsersWithOrganizations - User found:', {
      _id: currentUser._id,
      email: currentUser.email,
      role: currentUser.role
    });

    const isSuperAdmin = currentUser.role === "super_admin";
    const globalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", currentUser._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    const isGlobalAdmin = !!globalAdmin;

    if (!isSuperAdmin && !isGlobalAdmin) {
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }
    
    // Get all users from user_profiles table
    const users = await ctx.db.query("user_profiles").order("desc").collect();
    
    // Get all global admins
    const globalAdmins = await ctx.db.query("global_admins").collect();
    const globalAdminUserIds = new Set(globalAdmins.map(ga => ga.user_id));
    
    // Get all organizations for reference
    const organizations = await ctx.db.query("organizations").collect();
    const orgMap = new Map(organizations.map(org => [org._id, org.name]));
    
    // Enrich users with organization assignments
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        const isGlobalAdmin = globalAdminUserIds.has(user._id);
        
        // Get primary organization name
        let primary_organization_name = null;
        if (user.organization_id && user.role !== "super_admin") {
          primary_organization_name = orgMap.get(user.organization_id) || null;
        } else if (user.role === "super_admin" || isGlobalAdmin) {
          primary_organization_name = "Global Admin (No Organization)";
        }
        
        // Get all organization assignments for this user
        let organization_assignments = [];
        if (user.role !== "super_admin" && !isGlobalAdmin) {
          const assignments = await ctx.db
            .query("user_organization_access")
            .withIndex("by_user_org", (q) => q.eq("user_id", user._id))
            .collect();
          
          organization_assignments = assignments.map(assignment => ({
            organization_id: assignment.organization_id,
            organization_name: orgMap.get(assignment.organization_id) || "Unknown",
            role: assignment.role,
            permissions: assignment.permissions,
            is_active: assignment.is_active,
            created_at: assignment.created_at,
          }));
        } else {
          // Super admin or global admin has access to all organizations
          organization_assignments = organizations.map(org => ({
            organization_id: org._id,
            organization_name: org.name,
            role: "super_admin",
            permissions: ["read", "write", "delete", "admin", "super_admin"],
            is_active: true,
            created_at: user.created_at || new Date().toISOString(),
          }));
        }
        
        return {
          ...user,
          primary_organization_id: user.organization_id,
          primary_organization_name,
          organization_assignments,
          is_global_admin: isGlobalAdmin,
          user_source: "user_profiles",
        };
      })
    );
    
    return enrichedUsers;
  },
});

/**
 * Get all organizations with their assigned users (Super Admin only)
 */
export const getAllOrganizationsWithUsers = query({
  args: {
    user_id: v.id("user_profiles"), // Current user ID for authorization check
  },
  // FIXED: Removed complex returns validator to prevent server errors
  handler: async (ctx, args) => {
    // Check if user is super admin or global admin
    const currentUser = await ctx.db.get(args.user_id);
    if (!currentUser) {
      throw new Error("User not found");
    }

    const isSuperAdmin = currentUser.role === "super_admin";
    const globalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", currentUser._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    const isGlobalAdmin = !!globalAdmin;

    if (!isSuperAdmin && !isGlobalAdmin) {
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    // Get all organizations
    const organizations = await ctx.db.query("organizations").collect();
    
    // Get all users for reference
    const users = await ctx.db.query("user_profiles").collect();
    const userMap = new Map(users.map(user => [user._id, user]));
    
    // Enrich organizations with assigned users
    const enrichedOrganizations = await Promise.all(
      organizations.map(async (org) => {
        // Get all user assignments for this organization
        const assignments = await ctx.db
          .query("user_organization_access")
          .filter((q) => q.eq(q.field("organization_id"), org._id))
          .collect();
        
        // Get users who have this as their primary organization
        const primaryUsers = users.filter(user => user.organization_id === org._id);
        const primaryUserIds = new Set(primaryUsers.map(user => user._id));
        
        const assigned_users = assignments.map(assignment => {
          const user = userMap.get(assignment.user_id);
          return {
            user_id: assignment.user_id,
            user_name: user ? `${user.given_name || user.first_name || ''} ${user.family_name || user.last_name || ''}`.trim() : 'Unknown',
            user_email: user?.email || 'Unknown',
            role: assignment.role,
            permissions: assignment.permissions,
            is_active: assignment.is_active,
            is_primary: primaryUserIds.has(assignment.user_id),
          };
        });
        
        return {
          ...org,
          assigned_users,
          total_users: assigned_users.length,
          active_users: assigned_users.filter(u => u.is_active).length,
        };
      })
    );
    
    return enrichedOrganizations;
  },
});

/**
 * Fix super admin primary organization if missing
 */
export const fixSuperAdminPrimaryOrganization = mutation({
  args: {
    user_id: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    organization_id: v.optional(v.id("organizations")),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    if (user.role !== "super_admin") {
      return {
        success: false,
        message: "User is not a super admin",
      };
    }

    // If user already has a primary organization, no action needed
    if (user.organization_id) {
      return {
        success: true,
        message: "Super admin already has a primary organization",
        organization_id: user.organization_id,
      };
    }

    // Get the first active organization
    const firstOrg = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (!firstOrg) {
      return {
        success: false,
        message: "No active organizations found",
      };
    }

    // Set the first organization as primary
    await ctx.db.patch(args.user_id, {
      organization_id: firstOrg._id,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Set primary organization to ${firstOrg.name}`,
      organization_id: firstOrg._id,
    };
  },
});

/**
 * Assign user to organization with specific role and permissions
 */
export const assignUserToOrganization = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    role: v.string(),
    permissions: v.array(v.string()),
    model_permissions: v.optional(v.record(v.string(), v.array(v.string()))),
    countdown_days: v.optional(v.number()),
    is_primary: v.optional(v.boolean()),
    approved_by: v.id("user_profiles"), // ID of the user approving the assignment
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if assignment already exists
    const existingAssignment = await ctx.db
      .query("user_organization_access")
      .withIndex("by_user_org", (q) => 
        q.eq("user_id", args.user_id).eq("organization_id", args.organization_id)
      )
      .unique();
    
    if (existingAssignment) {
      return {
        success: false,
        message: "User is already assigned to this organization.",
      };
    }
    
    const now = new Date().toISOString();
    
    // Create organization assignment
    await ctx.db.insert("user_organization_access", {
      user_id: args.user_id,
      organization_id: args.organization_id,
      role: args.role,
      permissions: args.permissions,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    
    // If this is set as primary organization, update user profile
    if (args.is_primary) {
      await ctx.db.patch(args.user_id, {
        organization_id: args.organization_id,
        role: args.role,
        permissions: args.permissions,
        updated_at: now,
      });
    }

    // Subscription access management has been replaced with countdown timer system
    // Countdown timers are now handled automatically during user approval
    
    // Get organization and user names for message
    const org = await ctx.db.get(args.organization_id);
    const user = await ctx.db.get(args.user_id);
    
    return {
      success: true,
      message: `User ${user?.email} has been assigned to ${org?.name}${args.is_primary ? ' as primary organization' : ''}.`,
    };
  },
});

/**
 * Remove user from organization
 */
export const removeUserFromOrganization = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Find the assignment
    const assignment = await ctx.db
      .query("user_organization_access")
      .withIndex("by_user_org", (q) => 
        q.eq("user_id", args.user_id).eq("organization_id", args.organization_id)
      )
      .unique();
    
    if (!assignment) {
      return {
        success: false,
        message: "User assignment to this organization not found.",
      };
    }
    
    // Remove the assignment
    await ctx.db.delete(assignment._id);
    
    // Check if this was the user's primary organization
    const user = await ctx.db.get(args.user_id);
    if (user?.organization_id === args.organization_id) {
      // Find another organization to set as primary, or set to null
      const otherAssignments = await ctx.db
        .query("user_organization_access")
        .withIndex("by_user_org", (q) => q.eq("user_id", args.user_id))
        .collect();
      
      if (otherAssignments.length > 0) {
        // Set the first remaining organization as primary
        const newPrimary = otherAssignments[0];
        await ctx.db.patch(args.user_id, {
          organization_id: newPrimary.organization_id,
          role: newPrimary.role,
          permissions: newPrimary.permissions,
          updated_at: new Date().toISOString(),
        });
      } else {
        // No other organizations, remove primary
        await ctx.db.patch(args.user_id, {
          organization_id: undefined,
          updated_at: new Date().toISOString(),
        });
      }
    }
    
    // Get names for message
    const org = await ctx.db.get(args.organization_id);
    const userName = user?.email || 'User';
    
    return {
      success: true,
      message: `${userName} has been removed from ${org?.name}.`,
    };
  },
});

/**
 * Update user's role and permissions in specific organization
 */
export const updateUserOrganizationAccess = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    role: v.string(),
    permissions: v.array(v.string()),
    model_permissions: v.optional(v.record(v.string(), v.array(v.string()))),
    is_active: v.boolean(),
    make_primary: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Find the assignment
    const assignment = await ctx.db
      .query("user_organization_access")
      .withIndex("by_user_org", (q) => 
        q.eq("user_id", args.user_id).eq("organization_id", args.organization_id)
      )
      .unique();
    
    if (!assignment) {
      return {
        success: false,
        message: "User assignment to this organization not found.",
      };
    }
    
    const now = new Date().toISOString();
    
    // Update the assignment
    await ctx.db.patch(assignment._id, {
      role: args.role,
      permissions: args.permissions,
      is_active: args.is_active,
      updated_at: now,
    });
    
    // If making this the primary organization or if it already is primary
    const user = await ctx.db.get(args.user_id);
    if (args.make_primary || user?.organization_id === args.organization_id) {
      await ctx.db.patch(args.user_id, {
        organization_id: args.organization_id,
        role: args.role,
        permissions: args.permissions,
        updated_at: now,
      });
    }
    
    // Get names for message
    const org = await ctx.db.get(args.organization_id);
    const userName = user?.email || 'User';
    
    return {
      success: true,
      message: `${userName}'s access to ${org?.name} has been updated.`,
    };
  },
});

/**
 * Get user's organization assignments (for organization switching)
 */
export const getUserOrganizationAssignments = query({
  args: {
    user_id: v.union(v.id("user_profiles"), v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const rawId = typeof args.user_id === 'string' ? args.user_id : String(args.user_id);
      if (!rawId || rawId.startsWith('vnd_') || rawId.startsWith('vendor_') || rawId.startsWith('org_')) {
        return [];
      }
      console.log('🔍 getUserOrganizationAssignments called with user_id:', rawId);
      
      // Safely check if rawId is a valid user_profiles document ID
      let user = null;
      const normalizedUserId = ctx.db.normalizeId("user_profiles", rawId);
      if (normalizedUserId) {
        user = await ctx.db.get(normalizedUserId);
      } else if (rawId.includes('@')) {
        // Find user by email if given an email string
        const users = await ctx.db
          .query("user_profiles")
          .withIndex("by_email", (q) => q.eq("email", rawId))
          .collect();
        user = users[0] || null;
      } else {
        // Not a valid Convex user_profiles ID or email format
        return [];
      }
      
      if (!user) {
        console.log('❌ User not found:', rawId);
        return [];
      }
      
      // Type guard: only access organization_id if user is a user_profile
      const primaryOrgId = (user && 'organization_id' in user) ? (user as any).organization_id ?? undefined : undefined;
      console.log('🔍 User primary org:', primaryOrgId);
      
      // Check if user is a global admin (from global_admins table) using user._id
      let globalAdmins: any[] = [];
      try {
        globalAdmins = await ctx.db
          .query("global_admins")
          .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
          .collect();
      } catch (e) {
        // Safe fallback
      }
      
      const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;
      
      // PROFESSIONAL FIX: Super admin role should have access to all organizations
      if (isGlobalAdmin || ('role' in user && (user as any).role === "super_admin")) {
        console.log('👑 User is global admin or super admin, returning all organizations for:', (user as any).email);
        // Global admin and super admin have access to all organizations
        const allOrganizations = await ctx.db
          .query("organizations")
          .filter((q) => q.eq(q.field("is_active"), true))
          .collect();
        
        // If super admin has no primary organization, set the first one as primary
        let effectivePrimaryOrgId = primaryOrgId;
        if (!effectivePrimaryOrgId && allOrganizations.length > 0) {
          effectivePrimaryOrgId = allOrganizations[0]._id;
          console.log('🔧 Setting first organization as primary for super admin:', effectivePrimaryOrgId);
        }
        return allOrganizations.map((org) => ({
          organization_id: org._id,
          organization_name: org.name ?? "Unknown Organization",
          organization_currency: org.currency ?? undefined,
          role: "super_admin",
          permissions: ["read", "write", "delete", "admin", "super_admin"],
          is_active: true,
          is_primary: org._id === effectivePrimaryOrgId,
        }));
      }
      
      // Get all assignments for this user from user_organization_access table
      let assignments: any[] = [];
      try {
        const allUserAccess = await ctx.db
          .query("user_organization_access")
          .collect();
        assignments = allUserAccess.filter(
          (a) => a.user_id === user._id && a.is_active !== false
        );
      } catch (e) {
        console.warn("Could not query user_organization_access:", e);
      }
      
      console.log('🔍 User assignments found:', assignments.length);
      
      // Create organization details from assignments
      const organizationDetails = await Promise.all(
        assignments.map(async (assignment) => {
          let org = null;
          try {
            org = await ctx.db.get(assignment.organization_id);
          } catch (e) {
            // Ignore
          }
          return {
            organization_id: assignment.organization_id,
            organization_name: org && 'name' in org ? (org as any).name || "Unknown Organization" : "Unknown Organization",
            organization_currency: org && 'currency' in org ? (org as any).currency : undefined,
            role: assignment.role,
            permissions: assignment.permissions,
            is_active: assignment.is_active,
            is_primary: assignment.organization_id === primaryOrgId,
          };
        })
      );
      
      // If user has a primary organization but no assignments, create a default assignment
      if (primaryOrgId && assignments.length === 0) {
        console.log('🔍 Creating default assignment for primary org:', primaryOrgId);
        try {
          const primaryOrg = await ctx.db.get(primaryOrgId);
          if (primaryOrg && 'name' in primaryOrg) {
            organizationDetails.push({
              organization_id: primaryOrgId,
              organization_name: (primaryOrg as any).name ?? "Unknown Organization",
              organization_currency: (primaryOrg as any).currency ?? undefined,
              role: 'role' in user ? (user as any).role ?? "user" : "user",
              permissions: 'permissions' in user ? (user as any).permissions ?? ["read"] : ["read"],
              is_active: true,
              is_primary: true,
            });
          }
        } catch (e) {
          // Ignore
        }
      }
      
      // Remove duplicates based on organization_id
      const uniqueOrganizations = organizationDetails.filter((org, index, self) => 
        index === self.findIndex(o => o.organization_id === org.organization_id)
      );
      
      console.log('✅ Returning organizations:', uniqueOrganizations.length);
      return uniqueOrganizations;
    } catch (e) {
      console.warn("getUserOrganizationAssignments error handled gracefully:", e);
      return [];
    }
  },
});

/**
 * Switch user's primary organization
 */
export const switchUserPrimaryOrganization = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    console.log('🔄 Switching organization for user:', args.user_id, 'to org:', args.organization_id);
    
    // Get user details
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      console.log('❌ User not found:', args.user_id);
      return {
        success: false,
        message: "User not found.",
      };
    }

    console.log('👤 User found:', user.email, 'Role:', user.role);

    // Check if user is a global admin or super admin
    const globalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    const isGlobalAdmin = !!globalAdmin;
    const isSuperAdmin = user.role === "super_admin";
    
    console.log('🔍 Admin check - isGlobalAdmin:', isGlobalAdmin, 'isSuperAdmin:', isSuperAdmin);

    // For super admins and global admins, they have access to all organizations
    if (isSuperAdmin || isGlobalAdmin) {
      console.log('👑 User is super admin or global admin, checking organization access');
      
      // Verify the organization exists and is active
      const org = await ctx.db.get(args.organization_id);
      console.log('🏢 Organization found:', org?.name, 'Active:', org?.is_active);
      
      if (!org || !org.is_active) {
        console.log('❌ Organization not found or inactive');
        return {
          success: false,
          message: "Organization not found or inactive.",
        };
      }

      console.log('✅ Organization is valid, updating user primary organization');
      
      // Update user's primary organization
      await ctx.db.patch(args.user_id, {
        organization_id: args.organization_id,
        role: "super_admin", // Super admin role for all organizations
        permissions: ["read", "write", "delete", "admin", "super_admin"],
        updated_at: new Date().toISOString(),
      });

      console.log('✅ Successfully switched to organization:', org.name);
      return {
        success: true,
        message: `Switched to ${org.name} successfully.`,
      };
    }

    // For regular users, check if they have access to this organization
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
        message: "You don't have access to this organization.",
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
      message: `Switched to ${org?.name} successfully.`,
    };
  },
});

/**
 * List all global admins
 */
export const listGlobalAdmins = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("global_admins"),
      _creationTime: v.float64(),
      user_id: v.id("user_profiles"),
      email: v.string(),
      name: v.string(),
      role: v.string(),
      permissions: v.array(v.string()),
      is_active: v.boolean(),
      created_at: v.string(),
      updated_at: v.string(),
      last_login: v.optional(v.string()),
      notes: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db.query("global_admins").order("desc").collect();
  },
});

/**
 * Add user to global admin database
 */
export const addGlobalAdmin = mutation({
  args: {
    user_id: v.id("user_profiles"),
    role: v.string(),
    permissions: v.array(v.string()),
    created_by: v.optional(v.id("user_profiles")),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    global_admin_id: v.optional(v.id("global_admins")),
  }),
  handler: async (ctx, args) => {
    // Check if user is already a global admin
    const existingGlobalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();

    if (existingGlobalAdmin) {
      return {
        success: false,
        message: "User is already a global admin.",
      };
    }

    // Get user details
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    const now = new Date().toISOString();

    // Add to global admin database
    const globalAdminId = await ctx.db.insert("global_admins", {
      user_id: args.user_id,
      email: user.email,
      name: user.name || `${user.given_name} ${user.family_name}`,
      role: args.role,
      permissions: args.permissions,
      is_active: true,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
      notes: args.notes,
    });

    // Update user role to match global admin role
    await ctx.db.patch(args.user_id, {
      role: args.role,
      permissions: args.permissions,
      updated_at: now,
    });

    return {
      success: true,
      message: `User ${user.email} has been added as a global admin.`,
      global_admin_id: globalAdminId,
    };
  },
});

/**
 * Promote existing user to global admin by email
 */
export const promoteUserToGlobalAdmin = mutation({
  args: {
    email: v.string(),
    role: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    created_by: v.optional(v.id("user_profiles")),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    global_admin_id: v.optional(v.id("global_admins")),
  }),
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return {
        success: false,
        message: `User with email ${args.email} not found.`,
      };
    }

    // Check if user is already a global admin
    const existingGlobalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
      .unique();

    if (existingGlobalAdmin) {
      return {
        success: false,
        message: "User is already a global admin.",
      };
    }

    const now = new Date().toISOString();
    const role = args.role || "super_admin";
    const permissions = args.permissions || ["super_admin"];

    // Add to global admin database
    const globalAdminId = await ctx.db.insert("global_admins", {
      user_id: user._id,
      email: user.email,
      name: user.name || `${user.given_name || user.first_name || ''} ${user.family_name || user.last_name || ''}`.trim(),
      role: role,
      permissions: permissions,
      is_active: true,
      created_by: args.created_by,
      created_at: now,
      updated_at: now,
      notes: args.notes,
    });

    // Update user role to match global admin role
    await ctx.db.patch(user._id, {
      role: role,
      permissions: permissions,
      updated_at: now,
    });

    return {
      success: true,
      message: `User ${user.email} has been promoted to global admin with role: ${role}`,
      global_admin_id: globalAdminId,
    };
  },
});

/**
 * Process new user signup - Create global admin approval request
 */
export const createGlobalAdminApprovalRequest = mutation({
  args: {
    google_id: v.string(),
    email: v.string(),
    name: v.string(),
    given_name: v.string(),
    family_name: v.string(),
    picture: v.optional(v.string()),
    email_verified: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    user_id: v.optional(v.id("user_profiles")),
    requires_global_admin_approval: v.boolean(),
  }),
  handler: async (ctx, args) => {
    console.log('🔍 Creating global admin approval request for:', args.email);
    
    // Check if user already exists
    const existingUser = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      console.log('❌ User already exists:', args.email);
      return {
        success: false,
        message: "User already exists. Please contact administrator if you need access.",
        requires_global_admin_approval: false,
      };
    }

    console.log('✅ Creating new user profile for:', args.email);

    // Create user profile (inactive until global admin approval)
    const userId = await ctx.db.insert("user_profiles", {
      google_id: args.google_id,
      email: args.email,
      name: args.name,
      given_name: args.given_name,
      family_name: args.family_name,
      picture: args.picture,
      email_verified: args.email_verified,
      role: "pending", // Special role for users awaiting global admin approval
      permissions: [],
      is_active: false,
      last_login: new Date().toISOString(),
    });

    // Create global admin approval request
    await ctx.db.insert("global_admin_approvals", {
      user_id: userId,
      email: args.email,
      name: args.name,
      given_name: args.given_name,
      family_name: args.family_name,
      picture: args.picture,
      email_verified: args.email_verified,
      requested_at: new Date().toISOString(),
      status: GLOBAL_ADMIN_APPROVAL_STATUS.PENDING_GLOBAL_APPROVAL,
      notes: `New Google OAuth signup - ${args.name} (${args.email})`,
    });

    console.log('✅ User profile and approval request created successfully for:', args.email);
    
    return {
      success: true,
      message: "Your signup request has been submitted for global admin approval. You will receive access once approved.",
      user_id: userId,
      requires_global_admin_approval: true,
    };
  },
});

/**
 * List pending global admin approval requests
 */
export const listPendingGlobalAdminApprovals = query({
  args: {
    global_admin_id: v.id("global_admins"), // To verify caller is global admin
  },
  returns: v.array(
    v.object({
      _id: v.id("global_admin_approvals"),
      _creationTime: v.float64(),
      user_id: v.id("user_profiles"),
      email: v.string(),
      name: v.string(),
      given_name: v.string(),
      family_name: v.string(),
      picture: v.optional(v.string()),
      email_verified: v.boolean(),
      requested_at: v.string(),
      status: v.string(),
      notes: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    // Verify caller is a global admin
    const globalAdmin = await ctx.db.get(args.global_admin_id);
    if (!globalAdmin || !globalAdmin.is_active) {
      throw new Error("Access denied. Global admin privileges required.");
    }

    return await ctx.db
      .query("global_admin_approvals")
      .withIndex("by_status", (q) => q.eq("status", GLOBAL_ADMIN_APPROVAL_STATUS.PENDING_GLOBAL_APPROVAL))
      .order("desc")
      .collect();
  },
});

/**
 * Approve user globally with complete access setup (Global Admin only)
 */
export const approveUserGloballyWithAccess = mutation({
  args: {
    user_id: v.id("user_profiles"),
    approved_by: v.id("global_admins"),
    organization_id: v.optional(v.id("organizations")),
    role: v.string(),
    permissions: v.array(v.string()),
    model_permissions: v.optional(v.object({
      customers: v.optional(v.array(v.string())),
      leads: v.optional(v.array(v.string())),
      inventory: v.optional(v.array(v.string())),
      suppliers: v.optional(v.array(v.string())),
      quotations: v.optional(v.array(v.string())),
      process_flows: v.optional(v.array(v.string())),
      settings: v.optional(v.array(v.string())),
      reports: v.optional(v.array(v.string())),
    })),
    is_global_admin: v.optional(v.boolean()),
    // Countdown timer fields (replaced subscription system)
    access_type: v.optional(v.union(v.literal("countdown"), v.literal("permanent"))),
    access_period_days: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Find the global admin approval request
    const approvalRequest = await ctx.db
      .query("global_admin_approvals")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();

    if (!approvalRequest) {
      return {
        success: false,
        message: "Global admin approval request not found.",
      };
    }

    const now = new Date().toISOString();

    // Update approval request status
    await ctx.db.patch(approvalRequest._id, {
      status: GLOBAL_ADMIN_APPROVAL_STATUS.APPROVED,
      global_admin_approved: args.approved_by,
      global_admin_approved_at: now,
    });

    // Update user profile with complete access setup
    await ctx.db.patch(args.user_id, {
      role: args.role,
      permissions: args.permissions,
  organization_id: args.organization_id ?? undefined,
      is_active: true,
      updated_at: now,
    });

    // Save model access control permissions if provided
    if (args.model_permissions && args.organization_id) {
      for (const [modelName, permissions] of Object.entries(args.model_permissions)) {
        if (permissions && permissions.length > 0) {
          await ctx.db.insert("model_access_control", {
            user_id: args.user_id,
            organization_id: args.organization_id,
            model_name: modelName,
            can_read: permissions.includes('read'),
            can_create: permissions.includes('create'),
            can_update: permissions.includes('update'),
            can_delete: permissions.includes('delete'),
            created_at: now,
            updated_at: now,
          });
        }
      }
    } else if (args.organization_id) {
      // Grant default permissions if no specific model permissions provided
      const defaultModels = ["customers", "leads", "inventory", "suppliers", "quotations", "process_flows", "settings", "reports"];
      const defaultPermissions = args.role === "admin" || args.role === "super_admin" 
        ? ["read", "create", "update", "delete"] 
        : ["read", "create", "update"];
      
      for (const modelName of defaultModels) {
        await ctx.db.insert("model_access_control", {
          user_id: args.user_id,
          organization_id: args.organization_id,
          model_name: modelName,
          can_read: defaultPermissions.includes('read'),
          can_create: defaultPermissions.includes('create'),
          can_update: defaultPermissions.includes('update'),
          can_delete: defaultPermissions.includes('delete'),
          created_at: now,
          updated_at: now,
        });
      }
    }

                // If user is being made a global admin, add to global_admins table
            if (args.is_global_admin) {
              const user = await ctx.db.get(args.user_id);
              if (user) {
                await ctx.db.insert("global_admins", {
                  user_id: args.user_id,
                  email: user.email,
                  name: user.name || `${user.given_name} ${user.family_name}`,
                  role: args.role,
                  permissions: args.permissions,
                  is_active: true,
                  created_at: now,
                  updated_at: now,
                  notes: `Promoted to global admin during approval by ${args.approved_by}`,
                });
              }
            } else if (args.organization_id && args.access_type && args.access_period_days) {
              // Grant user access with countdown timer system
              if (args.access_type === "countdown" && args.access_period_days) {
                // @ts-ignore: api may be imported from _generated/api in modularized version
                await ctx.runMutation(api.countdownManagement.createUserCountdown, {
                  user_id: args.user_id,
                  organization_id: args.organization_id,
                  countdown_type: "days",
                  countdown_value: args.access_period_days,
                });
              }
            }

    const accessType = args.is_global_admin 
      ? "global admin access" 
      : args.organization_id 
        ? "organization access" 
        : "system access";

    return {
      success: true,
      message: `User has been approved with ${accessType}. They now have full system access.`,
    };
  },
});

/**
 * Grant default permissions to existing users (Global Admin only)
 */
export const grantDefaultPermissionsToUser = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
    role: v.string(),
    granted_by: v.id("global_admins"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify the granter is a global admin
    const globalAdmin = await ctx.db.get(args.granted_by);
    if (!globalAdmin || !globalAdmin.is_active) {
      throw new Error("Unauthorized: Only active global admins can grant permissions");
    }

    const now = new Date().toISOString();
    const defaultModels = ["customers", "leads", "inventory", "suppliers", "quotations", "process_flows", "settings", "reports"];
    const defaultPermissions = args.role === "admin" || args.role === "super_admin" 
      ? ["read", "create", "update", "delete"] 
      : ["read", "create", "update"];
    
          // Check if user already has permissions for this organization
      const existingPermissions = await ctx.db
        .query("model_access_control")
        .filter((q) => 
          q.eq(q.field("user_id"), args.user_id) &&
          q.eq(q.field("organization_id"), args.organization_id)
        )
        .collect();

    if (existingPermissions.length > 0) {
      return {
        success: false,
        message: "User already has permissions for this organization",
      };
    }

    // Grant default permissions
    for (const modelName of defaultModels) {
      await ctx.db.insert("model_access_control", {
        user_id: args.user_id,
        organization_id: args.organization_id,
        model_name: modelName,
        can_read: defaultPermissions.includes('read'),
        can_create: defaultPermissions.includes('create'),
        can_update: defaultPermissions.includes('update'),
        can_delete: defaultPermissions.includes('delete'),
        created_at: now,
        updated_at: now,
      });
    }

    return {
      success: true,
      message: "Default permissions granted successfully",
    };
  },
});

/**
 * Approve user globally (Global Admin only) - Legacy function for basic approval
 */
export const approveUserGlobally = mutation({
  args: {
    user_id: v.id("user_profiles"),
    approved_by: v.id("global_admins"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Find the global admin approval request
    const approvalRequest = await ctx.db
      .query("global_admin_approvals")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();

    if (!approvalRequest) {
      return {
        success: false,
        message: "Global admin approval request not found.",
      };
    }

    const now = new Date().toISOString();

    // Update approval request status
    await ctx.db.patch(approvalRequest._id, {
      status: GLOBAL_ADMIN_APPROVAL_STATUS.APPROVED,
      global_admin_approved: args.approved_by,
      global_admin_approved_at: now,
    });

    // Update user profile to approved status (but still no organization access)
    await ctx.db.patch(args.user_id, {
      role: "approved", // User is approved globally but needs organization assignment
      permissions: ["read"],
      is_active: true,
      updated_at: now,
    });

    return {
      success: true,
      message: "User has been approved globally. They still need organization assignment for system access.",
    };
  },
});

/**
 * Reject user globally (Global Admin only)
 */
export const rejectUserGlobally = mutation({
  args: {
    user_id: v.id("user_profiles"),
    rejected_by: v.id("global_admins"),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Find the global admin approval request
    const approvalRequest = await ctx.db
      .query("global_admin_approvals")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .unique();

    if (!approvalRequest) {
      return {
        success: false,
        message: "Global admin approval request not found.",
      };
    }

    // Update approval request status
    await ctx.db.patch(approvalRequest._id, {
      status: GLOBAL_ADMIN_APPROVAL_STATUS.REJECTED,
      rejection_reason: args.reason,
    });

    // Deactivate user and mark as rejected
    await ctx.db.patch(args.user_id, {
      is_active: false,
      role: "rejected", // Mark role as rejected
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: "User has been rejected globally.",
    };
  },
});

/**
 * Create a new user with predefined access (Global Admin only)
 */
export const createUserWithAccess = mutation({
  args: {
    email: v.string(),
    given_name: v.string(),
    family_name: v.string(),
    role: v.string(),
    organization_id: v.optional(v.id("organizations")),
    permissions: v.array(v.string()),
    is_global_admin: v.optional(v.boolean()),
    created_by: v.id("global_admins"),
    notes: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    user_id: v.optional(v.id("user_profiles")),
  }),
  handler: async (ctx, args) => {
    // Verify the creator is a global admin
    const globalAdmin = await ctx.db.get(args.created_by);
    if (!globalAdmin || !globalAdmin.is_active) {
      throw new Error("Unauthorized: Only active global admins can create users");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      return {
        success: false,
        message: "User with this email already exists",
      };
    }

    // Get organization name if organization_id is provided
    let organizationName = "";
    if (args.organization_id) {
      const org = await ctx.db.get(args.organization_id);
      organizationName = org?.name || "";
    }

    // Create user profile
    const userId = await ctx.db.insert("user_profiles", {
      email: args.email,
      given_name: args.given_name,
      family_name: args.family_name,
      name: `${args.given_name} ${args.family_name}`,
      role: args.role,
      permissions: args.permissions,
      is_active: true, // Pre-approved
      organization_id: args.organization_id,
  // primary_organization_id: args.organization_id, // Removed: not in schema
  // primary_organization_name: organizationName, // Removed: not in schema
      // organization_assignments: args.organization_id ? [{
      //   organization_id: args.organization_id,
      //   organization_name: organizationName,
      //   role: args.role,
      //   permissions: args.permissions,
      //   is_active: true,
      //   created_at: new Date().toISOString(),
      // }] : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // If user should be a global admin, add to global_admins table
    if (args.is_global_admin) {
      await ctx.db.insert("global_admins", {
        user_id: userId,
        email: args.email,
        name: `${args.given_name} ${args.family_name}`,
        role: args.role,
        permissions: args.permissions,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: args.notes,
      });
    }

    return {
      success: true,
      message: "User created successfully. They will have access when they sign in with Google.",
      user_id: userId,
    };
  },
});

/**
 * Delete a user (Global Admin only)
 */
export const deleteUser = mutation({
  args: {
    user_id: v.id("user_profiles"),
    deleted_by: v.id("global_admins"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify the deleter is a global admin
    const globalAdmin = await ctx.db.get(args.deleted_by);
    if (!globalAdmin || !globalAdmin.is_active) {
      throw new Error("Unauthorized: Only active global admins can delete users");
    }

    // Get user to delete
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Remove from global_admins if exists
    const globalAdminEntry = await ctx.db
      .query("global_admins")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .unique();
    
    if (globalAdminEntry) {
      await ctx.db.delete(globalAdminEntry._id);
    }

    // Delete user profile
    await ctx.db.delete(args.user_id);

    return {
      success: true,
      message: "User deleted successfully",
    };
  },
});

/**
 * Update user role and permissions (Global Admin only)
 */
export const updateUserAccess = mutation({
  args: {
    user_id: v.id("user_profiles"),
    role: v.optional(v.string()),
    permissions: v.optional(v.array(v.string())),
    organization_id: v.optional(v.id("organizations")),
    is_active: v.optional(v.boolean()),
    updated_by: v.id("global_admins"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify the updater is a global admin
    const globalAdmin = await ctx.db.get(args.updated_by);
    if (!globalAdmin || !globalAdmin.is_active) {
      throw new Error("Unauthorized: Only active global admins can update users");
    }

    // Get user to update
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (args.role !== undefined) updateData.role = args.role;
    if (args.permissions !== undefined) updateData.permissions = args.permissions;
    if (args.is_active !== undefined) updateData.is_active = args.is_active;

    // Handle organization assignment
    if (args.organization_id !== undefined) {
      const org = await ctx.db.get(args.organization_id);
      updateData.organization_id = args.organization_id;
      updateData.primary_organization_id = args.organization_id;
      updateData.primary_organization_name = org?.name || null;
    }

    // Update user profile
    await ctx.db.patch(args.user_id, updateData);

    // Update global admin entry if exists
    const globalAdminEntry = await ctx.db
      .query("global_admins")
      .filter((q) => q.eq(q.field("user_id"), args.user_id))
      .unique();
    
    if (globalAdminEntry && (args.role !== undefined || args.permissions !== undefined)) {
      await ctx.db.patch(globalAdminEntry._id, {
        role: args.role || globalAdminEntry.role,
        permissions: args.permissions || globalAdminEntry.permissions,
        updated_at: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: "User access updated successfully",
    };
  },
});

/**
 * Create a new organization (Global Admin only)
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    created_by: v.id("global_admins"),
    settings: v.optional(v.object({
      max_users: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    organization_id: v.optional(v.id("organizations")),
  }),
  handler: async (ctx, args) => {
    // Verify the creator is a global admin
    const globalAdmin = await ctx.db.get(args.created_by);
    if (!globalAdmin || !globalAdmin.is_active) {
      throw new Error("Unauthorized: Only active global admins can create organizations");
    }

    // Check if organization name already exists
    const existingOrg = await ctx.db
      .query("organizations")
      .filter((q) => q.eq(q.field("name"), args.name))
      .unique();

    if (existingOrg) {
      return {
        success: false,
        message: "Organization with this name already exists",
      };
    }

    // Create organization
    const orgId = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.name.toLowerCase().replace(/\s+/g, "-"),
      email: args.contact_email ?? "placeholder@example.com",
      phone: args.phone ?? "",
      address: args.address ?? "",
      website: args.website ?? "",
      logo_url: "",
      currency: "SAR",
      vat_number: "0000000000",
      vat_rate: "15",
      timezone: "Asia/Riyadh",
      language: "en",
      profit_sharing_enabled: false,
      profit_sharing_percentage: "0",
      is_active: true,
      is_default: false,
      name_arabic: undefined,
      industry: Array.isArray(args.industry) ? args.industry : args.industry ? [args.industry] : undefined,
      address_arabic: undefined,
      vat_number_arabic: undefined,
      cr_number: undefined,
      cr_number_arabic: undefined,
      header_display_config: undefined,
      footer_display_config: undefined,
      company_footer_image_url: undefined,
      company_header_image_url: undefined,
      use_custom_header_footer: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Organization created successfully",
      organization_id: orgId,
    };
  },
});

/**
 * Update organization (Global Admin only)
 */
export const updateOrganization = mutation({
  args: {
    organization_id: v.id("organizations"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    industry: v.optional(v.string()),
    website: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    updated_by: v.id("global_admins"),
    settings: v.optional(v.object({
      max_users: v.optional(v.number()),
      features: v.optional(v.array(v.string())),
    })),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify the updater is a global admin
    const globalAdmin = await ctx.db.get(args.updated_by);
    if (!globalAdmin || !globalAdmin.is_active) {
      throw new Error("Unauthorized: Only active global admins can update organizations");
    }

    // Get organization to update
    const org = await ctx.db.get(args.organization_id);
    if (!org) {
      return {
        success: false,
        message: "Organization not found",
      };
    }

    // Prepare update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    if (args.industry !== undefined) updateData.industry = args.industry;
    if (args.website !== undefined) updateData.website = args.website;
    if (args.contact_email !== undefined) updateData.contact_email = args.contact_email;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.is_active !== undefined) updateData.is_active = args.is_active;
    if (args.settings !== undefined) updateData.settings = args.settings;

    // Update organization
    await ctx.db.patch(args.organization_id, updateData);

    return {
      success: true,
      message: "Organization updated successfully",
    };
  },
});

/**
 * Delete organization (Global Admin only)
 */
export const deleteOrganization = mutation({
  args: {
    organization_id: v.id("organizations"),
    deleted_by: v.id("global_admins"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Verify the deleter is a global admin
    const globalAdmin = await ctx.db.get(args.deleted_by);
    if (!globalAdmin || !globalAdmin.is_active) {
      throw new Error("Unauthorized: Only active global admins can delete organizations");
    }

    // Get organization to delete
    const org = await ctx.db.get(args.organization_id);
    if (!org) {
      return {
        success: false,
        message: "Organization not found",
      };
    }

    // Check if organization has active users
    const activeUsers = await ctx.db
      .query("user_profiles")
      .filter((q) => q.eq(q.field("organization_id"), args.organization_id))
      .collect();

    if (activeUsers.length > 0) {
      return {
        success: false,
        message: `Cannot delete organization. It has ${activeUsers.length} active users. Please reassign or remove users first.`,
      };
    }

    // Delete organization
    await ctx.db.delete(args.organization_id);

    return {
      success: true,
      message: "Organization deleted successfully",
    };
  },
});
