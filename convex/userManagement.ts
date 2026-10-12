import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// User status types
const USER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved", 
  REJECTED: "rejected",
  SUSPENDED: "suspended"
} as const;

// Role types
const USER_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin", 
  MANAGER: "manager",
  USER: "user",
  VIEWER: "viewer"
} as const;

/**
 * Get user approval status
 */
export const getUserApprovalStatus = query({
  args: {
    email: v.string(),
  },
  returns: v.union(
    v.object({
      status: v.string(),
      message: v.string(),
      user_id: v.optional(v.id("user_profiles")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    // Check if user exists and is approved
    const user = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return {
        status: "not_registered",
        message: "User not found. Please contact administrator for access.",
      };
    }

    if (!user.is_active) {
      return {
        status: "suspended",
        message: "Your account has been suspended. Please contact administrator.",
        user_id: user._id,
      };
    }

    // Check if user has organization access
    if (!user.organization_id) {
      return {
        status: "pending_organization",
        message: "Your account is pending organization assignment. Please contact administrator.",
        user_id: user._id,
      };
    }

    return {
      status: "approved",
      message: "Welcome! You have access to the system.",
      user_id: user._id,
    };
  },
});

/**
 * Create pending user approval request
 */
export const createUserApprovalRequest = mutation({
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
  }),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (existingUser) {
      return {
        success: false,
        message: "User already exists. Please contact administrator if you need access.",
      };
    }

    // Check email domain whitelist (optional - you can configure this)
    const allowedDomains = ["yourdomain.com", "gmail.com"]; // Configure as needed
    const emailDomain = args.email.split("@")[1];
    
    // For now, we'll allow all domains but you can uncomment this for restriction
    // if (!allowedDomains.includes(emailDomain)) {
    //   return {
    //     success: false,
    //     message: "Your email domain is not authorized. Please contact administrator.",
    //   };
    // }

    // Create user with pending status
    const userId = await ctx.db.insert("user_profiles", {
      google_id: args.google_id,
      email: args.email,
      name: args.name,
      given_name: args.given_name,
      family_name: args.family_name,
      picture: args.picture,
      email_verified: args.email_verified,
      role: USER_ROLES.USER, // Default role
      permissions: ["read"], // Default permissions
      is_active: false, // Pending approval
      last_login: new Date().toISOString(),
    });

    // Create approval request entry
    await ctx.db.insert("pending_user_approvals", {
      user_id: userId.toString(),
      first_name: args.given_name,
      last_name: args.family_name,
      email: args.email,
      role: USER_ROLES.USER,
      organization_id: "k177v5nvxqq0xhx5wm5f7tqwpx7nwdek" as any, // Default organization
      requested_by: args.google_id,
      requested_at: new Date().toISOString(),
      status: USER_STATUS.PENDING,
      notes: `Google OAuth signup - ${args.name} (${args.email})`,
    });

    return {
      success: true,
      message: "Your access request has been submitted. An administrator will review and approve your account shortly.",
      user_id: userId,
    };
  },
});

/**
 * List all pending user approvals (Admin only)
 */
export const listPendingApprovals = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("pending_user_approvals"),
      _creationTime: v.number(),
      user_id: v.string(),
      first_name: v.string(),
      last_name: v.string(),
      email: v.string(),
      role: v.string(),
      organization_id: v.id("organizations"),
      requested_by: v.string(),
      requested_at: v.string(),
      status: v.string(),
      notes: v.optional(v.string()),
    })
  ),
  handler: async (ctx) => {
    const pendingApprovals = await ctx.db
      .query("pending_user_approvals")
      .withIndex("by_status", (q) => q.eq("status", USER_STATUS.PENDING))
      .order("desc")
      .collect();

    return pendingApprovals;
  },
});

/**
 * Approve user access (Admin only)
 */
export const approveUser = mutation({
  args: {
    approval_id: v.id("pending_user_approvals"),
    approved_by: v.string(),
    organization_id: v.id("organizations"),
    role: v.string(),
    permissions: v.array(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get the approval request
    const approval = await ctx.db.get(args.approval_id);
    if (!approval) {
      return {
        success: false,
        message: "Approval request not found.",
      };
    }

    // Get the user profile
    const user = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q) => q.eq("email", approval.email))
      .unique();

    if (!user) {
      return {
        success: false,
        message: "User profile not found.",
      };
    }

    // Activate user and assign organization
    await ctx.db.patch(user._id, {
      is_active: true,
      organization_id: args.organization_id,
      role: args.role,
      permissions: args.permissions,
    });

    // Update approval status
    await ctx.db.patch(args.approval_id, {
      status: USER_STATUS.APPROVED,
      approved_by: args.approved_by,
      approved_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: `User ${approval.email} has been approved and granted access.`,
    };
  },
});

/**
 * Reject user access (Admin only)
 */
export const rejectUser = mutation({
  args: {
    approval_id: v.id("pending_user_approvals"),
    rejected_by: v.string(),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const approval = await ctx.db.get(args.approval_id);
    if (!approval) {
      return {
        success: false,
        message: "Approval request not found.",
      };
    }

    // Update approval status
    await ctx.db.patch(args.approval_id, {
      status: USER_STATUS.REJECTED,
      approved_by: args.rejected_by,
      approved_at: new Date().toISOString(),
      notes: args.reason || "Access denied by administrator",
    });

    // Optionally delete the user profile or keep it inactive
    const user = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q) => q.eq("email", approval.email))
      .unique();

    if (user) {
      await ctx.db.patch(user._id, {
        is_active: false,
      });
    }

    return {
      success: true,
      message: `User ${approval.email} has been rejected.`,
    };
  },
});

/**
 * List all users (Admin only)
 */
export const listAllUsers = query({
  args: {
    organization_id: v.optional(v.id("organizations")),
  },
  returns: v.array(
    v.object({
      _id: v.id("user_profiles"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      given_name: v.optional(v.string()),
      family_name: v.optional(v.string()),
      role: v.string(),
      organization_id: v.optional(v.id("organizations")),
      is_active: v.boolean(),
      last_login: v.optional(v.string()),
      permissions: v.optional(v.array(v.string())),
    })
  ),
  handler: async (ctx, args) => {
    const users = args.organization_id 
      ? await ctx.db
          .query("user_profiles")
          .withIndex("by_organization", (q) => 
            q.eq("organization_id", args.organization_id)
          )
          .order("desc")
          .collect()
      : await ctx.db
          .query("user_profiles")
          .order("desc")
          .collect();
    return users;
  },
});

/**
 * List all users globally (Super Admin only) - FIXED VERSION
 */
export const listAllUsersGlobalNew = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("user_profiles"),
      _creationTime: v.number(),
      email: v.string(),
      name: v.optional(v.string()),
      given_name: v.optional(v.string()),
      family_name: v.optional(v.string()),
      role: v.string(),
      organization_id: v.optional(v.id("organizations")),
      organization_name: v.optional(v.string()),
      is_active: v.boolean(),
      last_login: v.optional(v.string()),
      permissions: v.optional(v.array(v.string())),
      // Add the extra fields that are actually being returned
      created_at: v.optional(v.string()),
      updated_at: v.optional(v.string()),
      email_verified: v.optional(v.boolean()),
      google_id: v.optional(v.string()),
      picture: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const users = await ctx.db.query("user_profiles").order("desc").collect();
    
    // Return all fields that are in the validator
    return users.map((user) => {
      return {
        _id: user._id,
        _creationTime: user._creationTime,
        email: user.email,
        name: user.name,
        given_name: user.given_name,
        family_name: user.family_name,
        role: user.role,
        organization_id: user.organization_id,
        organization_name: undefined,
        is_active: user.is_active,
        last_login: user.last_login,
        permissions: user.permissions,
        // Include the extra fields that are in the validator
        created_at: user.created_at,
        updated_at: user.updated_at,
        email_verified: user.email_verified,
        google_id: user.google_id,
        picture: user.picture,
      };
    });
  },
});

/**
 * Make user super admin (One-time setup)
 */
export const makeUserSuperAdmin = mutation({
  args: {
    email: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user_profiles")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    // Update user to super admin
    await ctx.db.patch(user._id, {
      role: USER_ROLES.SUPER_ADMIN,
      permissions: ["read", "write", "delete", "admin", "super_admin"],
      is_active: true,
    });

    return {
      success: true,
      message: `User ${args.email} has been upgraded to Super Admin.`,
    };
  },
});

/**
 * Update user role and permissions (Admin only)
 */
export const updateUserAccess = mutation({
  args: {
    user_id: v.id("user_profiles"),
    role: v.string(),
    permissions: v.array(v.string()),
    is_active: v.boolean(),
    organization_id: v.optional(v.id("organizations")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.user_id);
    if (!user) {
      return {
        success: false,
        message: "User not found.",
      };
    }

    await ctx.db.patch(args.user_id, {
      role: args.role,
      permissions: args.permissions,
      is_active: args.is_active,
      organization_id: args.organization_id,
    });

    return {
      success: true,
      message: `User access updated successfully.`,
    };
  },
});

// Export constants for use in frontend
export const USER_STATUS_CONSTANTS = USER_STATUS;
export const USER_ROLES_CONSTANTS = USER_ROLES;
