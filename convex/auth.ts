import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { createUserApprovalRequest } from "./userManagement";
import { api } from "./_generated/api";

const userProfileValidator = v.object({
  google_id: v.string(),
  email: v.string(),
  name: v.string(),
  given_name: v.string(),
  family_name: v.string(),
  picture: v.optional(v.string()),
  email_verified: v.boolean(),
  organization_id: v.optional(v.id("organizations")),
  role: v.string(),
  permissions: v.array(v.string()),
  is_active: v.boolean(),
  last_login: v.optional(v.string()),
  created_at: v.optional(v.string()),
  updated_at: v.optional(v.string()),
  // Additional fields
  is_project_owner: v.optional(v.boolean()),
  role_changed_at: v.optional(v.string()),
  role_changed_by: v.optional(v.string()),
});

/**
 * Create or update user from Google OAuth data
 */
export const createOrUpdateGoogleUser = mutation({
  args: {
    google_id: v.string(),
    email: v.string(),

    name: v.string(),
    given_name: v.string(),
    family_name: v.string(),
    picture: v.optional(v.string()),
    email_verified: v.boolean(),
  },
  returns: v.union(
    v.object({
      _id: v.id("user_profiles"),
      google_id: v.string(),
      email: v.string(),
      name: v.string(),
      given_name: v.string(),
      family_name: v.string(),
      picture: v.optional(v.string()),
      email_verified: v.boolean(),
      organization_id: v.optional(v.id("organizations")),
      role: v.string(),
      permissions: v.array(v.string()),
      is_active: v.boolean(),
      last_login: v.optional(v.string()),
      created_at: v.optional(v.string()),
      updated_at: v.optional(v.string()),
      is_project_owner: v.optional(v.boolean()),
      role_changed_at: v.optional(v.string()),
      role_changed_by: v.optional(v.string()),
    }),
    v.object({
      _id: v.id("user_profiles"),
      status: v.string(),
      message: v.string(),
      requires_approval: v.boolean(),
    })
  ),
  handler: async (ctx: any, args: any): Promise<any> => {
    // Check if user already exists
    const existingUsers = await ctx.db
      .query("user_profiles")
  .withIndex("by_google_id", (q: any) => q.eq("google_id", args.google_id))
      .collect();
    const existingUser = existingUsers[0]; // Get the first user with this Google ID
    const now = new Date().toISOString();

    if (existingUser) {
      // Update existing user login time
      await ctx.db.patch(existingUser._id, {
        last_login: now,
      });

      console.log('🔍 Existing user found:', {
        email: existingUser.email,
        role: existingUser.role,
        is_active: existingUser.is_active,
        organization_id: existingUser.organization_id
      });

      // Check if user is rejected first
      const approvalRequests = await ctx.db
        .query("global_admin_approvals")
  .withIndex("by_user_id", (q: any) => q.eq("user_id", existingUser._id))
        .collect();
      
      const approvalRequest = approvalRequests[0]; // Get the first approval request

      console.log('🔍 Approval request found:', approvalRequest);

      if (approvalRequest && approvalRequest.status === "rejected") {
        console.log('🔍 User is rejected, returning rejection status');
        return {
          _id: existingUser._id,
          status: "rejected",
          message: "Your account request has been rejected. Please contact administrator.",
          requires_approval: true,
        } as any;
      }

      // Check user status and return appropriate response
      if (!existingUser.is_active) {
        console.log('🔍 User is not active, checking role:', existingUser.role);
        if (existingUser.role === "pending") {
          console.log('🔍 User is pending, returning pending status');
          return {
            _id: existingUser._id,
            status: "pending_global_admin_approval",
            message: "Your account is pending approval.",
            requires_approval: true,
          } as any;
        } else if (existingUser.role === "approved") {
          return {
            _id: existingUser._id,
            status: "approved_but_no_organization",
            message: "Your account is approved but you need to request organization access.",
            requires_approval: false,
          } as any;
        } else {
          return {
            _id: existingUser._id,
            status: "account_inactive",
            message: "Your account is inactive. Please contact administrator.",
            requires_approval: true,
          } as any;
        }
      }

      // Check if user is a super admin - they have permanent access and are excluded from subscription requirements
      if (existingUser.role === "super_admin") {
        console.log('👑 Super admin access granted:', existingUser.email);
        return {
          _id: existingUser._id,
          google_id: existingUser.google_id,
          email: existingUser.email,
          name: existingUser.name,
          given_name: existingUser.given_name,
          family_name: existingUser.family_name,
          picture: existingUser.picture,
          email_verified: existingUser.email_verified,
          organization_id: existingUser.organization_id,
          role: existingUser.role,
          permissions: existingUser.permissions,
          is_active: existingUser.is_active,
          last_login: existingUser.last_login,
          created_at: existingUser.created_at,
          updated_at: existingUser.updated_at,
          is_project_owner: existingUser.is_project_owner,
          role_changed_at: existingUser.role_changed_at,
          role_changed_by: existingUser.role_changed_by,
        } as any;
      }

      // Check if user is a global admin - they have permanent access
      const globalAdmins = await ctx.db
        .query("global_admins")
    .withIndex("by_user_id", (q: any) => q.eq("user_id", existingUser._id))
        .collect();
      
      const isGlobalAdmin = globalAdmins[0]; // Get the first global admin entry

      // Global admins have permanent access
      if (isGlobalAdmin && isGlobalAdmin.is_active) {
        console.log('👑 Global admin access granted:', existingUser.email);
        // SECURITY: Logging skipped (api.securityAudit not found)
        return {
          _id: existingUser._id,
          google_id: existingUser.google_id,
          email: existingUser.email,
          name: existingUser.name,
          given_name: existingUser.given_name,
          family_name: existingUser.family_name,
          picture: existingUser.picture,
          email_verified: existingUser.email_verified,
          organization_id: existingUser.organization_id,
          role: existingUser.role,
          permissions: existingUser.permissions,
          is_active: existingUser.is_active,
          last_login: existingUser.last_login,
          created_at: existingUser.created_at,
          updated_at: existingUser.updated_at,
          is_project_owner: existingUser.is_project_owner,
          role_changed_at: existingUser.role_changed_at,
          role_changed_by: existingUser.role_changed_by,
        } as any;
      }

      // For regular users, check countdown access if they have an organization
      if (existingUser.organization_id) {
        console.log('🔍 Checking countdown access for user:', existingUser.email);
        const countdownCheck = await ctx.runQuery(api.countdownManagement.getUserCountdown, {
          user_id: existingUser._id,
        });

        // CRITICAL FIX: Deny access if no countdown exists or countdown is expired
        if (!countdownCheck) {
          console.log('❌ Access denied for user:', existingUser.email, 'Reason: No countdown timer assigned');
          return {
            _id: existingUser._id,
            status: "no_access_timer",
            message: "No access timer assigned. Please contact administrator for access.",
            requires_approval: true,
          } as any;
        }

        if (countdownCheck.is_expired || countdownCheck.days_remaining <= 0) {
          console.log('❌ Access denied for user:', existingUser.email, 'Reason: Countdown expired or no days remaining');
          return {
            _id: existingUser._id,
            status: "access_expired",
            message: "Your access has expired. Please contact administrator.",
            requires_approval: true,
          } as any;
        }
        
        console.log('✅ Access granted for user:', existingUser.email, 'Days remaining:', countdownCheck.days_remaining);
      }

      // Check if user is approved but doesn't have organization access yet
      if (existingUser.role === "approved" && !existingUser.organization_id) {
        return {
          _id: existingUser._id,
          status: "approved_but_no_organization",
          message: "Your account is approved globally. Please wait for organization assignment and access permissions.",
          requires_approval: true, // User should not get system access yet
        } as any;
      }

      // Only allow system access if user has both approval AND organization assignment
      if (!existingUser.organization_id) {
        return {
          _id: existingUser._id,
          status: "pending_organization_assignment",
          message: "Please wait for organization assignment and access permissions.",
          requires_approval: true,
        } as any;
      }

      // CRITICAL FIX: Check if user is active and has proper role
      if (!existingUser.is_active || existingUser.role === "pending") {
        return {
          _id: existingUser._id,
          status: "pending_approval",
          message: "Your account is pending approval. Please wait for administrator action.",
          requires_approval: true,
        } as any;
      }

      return {
        _id: existingUser._id,
        google_id: existingUser.google_id,
        email: existingUser.email,
        name: existingUser.name,
        given_name: existingUser.given_name,
        family_name: existingUser.family_name,
        picture: existingUser.picture,
        email_verified: existingUser.email_verified,
        organization_id: existingUser.organization_id,
        role: existingUser.role,
        permissions: existingUser.permissions,
        is_active: existingUser.is_active,
        last_login: existingUser.last_login,
        created_at: existingUser.created_at,
        updated_at: existingUser.updated_at,
        is_project_owner: existingUser.is_project_owner,
        role_changed_at: existingUser.role_changed_at,
        role_changed_by: existingUser.role_changed_by,
      } as any;
    } else {
      console.log('🆕 New user signing up:', args.email);
      
      // Check for existing pending registration first
      const existingPending = await ctx.db
        .query("pending_registrations")
  .filter((q: any) => q.eq(q.field("email"), args.email))
        .first();

      if (existingPending) {
        console.log('🔍 Existing pending registration found for:', args.email);
        return {
          _id: existingPending._id,
          status: "pending_approval",
          message: "Registration already pending approval. Please wait for verification.",
          requires_approval: true,
        } as any;
      }
      
      // Use secure registration flow instead of creating user profile immediately
  const registrationResult: any = await ctx.runMutation(api.secureUserRegistration.secureUserRegistration, {
        google_id: args.google_id,
        email: args.email,
        name: args.name,
        given_name: args.given_name,
        family_name: args.family_name,
        picture: args.picture,
        email_verified: args.email_verified,
        ip_address: "unknown", // Will be passed from frontend
        user_agent: "unknown", // Will be passed from frontend
      });

      console.log('📋 Registration result:', registrationResult);

      if (!registrationResult.success) {
        console.log('❌ Registration failed:', registrationResult.message);
        // Return proper response instead of throwing error
        return {
          _id: "pending",
          status: "pending_approval",
          message: registrationResult.message,
          requires_approval: registrationResult.requires_approval,
        } as any;
      }

      console.log('✅ New user registration submitted, returning pending status');
      
      return {
        _id: registrationResult.registration_id || "pending",
        status: "pending_global_admin_approval",
        message: registrationResult.message,
        requires_approval: true,
      };
    }
  }
});

/**
 * Get user by Google ID
 */
export const getUserByGoogleId = query({
  args: {
    google_id: v.string(),
  },
  returns: v.union(userProfileValidator, v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user_profiles")
  .withIndex("by_google_id", (q: any) => q.eq("google_id", args.google_id))
      .unique();

    return user as any;
  },
});

/**
 * Get user by email - simplified version that handles duplicates
 */
export const getUserByEmailFixed = query({
  args: {
    email: v.string(),
  },
  returns: v.union(v.object({
    _id: v.id("user_profiles"),
    email: v.string(),
    name: v.union(v.string(), v.null()),
    role: v.string(),
    is_active: v.boolean(),
  }), v.null()),
  handler: async (ctx: any, args: any): Promise<any> => {
    // Handle multiple user profiles for same email by returning the most recent one
    const users = await ctx.db
      .query("user_profiles")
  .withIndex("by_email", (q: any) => q.eq("email", args.email))
      .order("desc")
      .collect();

    if (users.length === 0) {
      return null;
    }

    // Return the most recent user (first in descending order)
    // If there are multiple users, prefer the one with the most recent last_login
  const mostRecentUser = users.reduce((latest: any, current: any) => {
      const latestLogin = latest.last_login ? new Date(latest.last_login).getTime() : 0;
      const currentLogin = current.last_login ? new Date(current.last_login).getTime() : 0;
      return currentLogin > latestLogin ? current : latest;
    });

    return {
      _id: mostRecentUser._id,
      email: mostRecentUser.email,
      name: mostRecentUser.name ?? null,
      role: mostRecentUser.role,
      is_active: mostRecentUser.is_active,
    };
  },
});

/**
 * Update user organization
 */
export const updateUserOrganization = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.id("organizations"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.user_id, {
      organization_id: args.organization_id,
    });
    return null;
  },
});

/**
 * Update user role and permissions
 */
export const updateUserRole = mutation({
  args: {
    user_id: v.id("user_profiles"),
    role: v.string(),
    permissions: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.user_id, {
      role: args.role,
      permissions: args.permissions,
    });
    return null;
  },
});

/**
 * Deactivate user
 */
export const deactivateUser = mutation({
  args: {
    user_id: v.id("user_profiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.user_id, {
      is_active: false,
    });
    return null;
  },
});

/**
 * List all users (admin only)
 */
export const listUsers = query({
  args: {},
  returns: v.array(userProfileValidator),
  handler: async (ctx) => {
    const users = await ctx.db
      .query("user_profiles")
      .order("desc")
      .collect();

    return users as any;
  },
});
