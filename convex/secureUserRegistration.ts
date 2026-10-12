import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

// Secure user registration - no profile creation until approved
export const secureUserRegistration = mutation({
  args: {
    google_id: v.string(),
    email: v.string(),
    name: v.string(),
    given_name: v.optional(v.string()),
    family_name: v.optional(v.string()),
    picture: v.optional(v.string()),
    email_verified: v.optional(v.boolean()),
    ip_address: v.string(),
    user_agent: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    registration_id: v.optional(v.id("pending_registrations")),
    requires_approval: v.boolean(),
  }),
  handler: async (ctx, args): Promise<any> => {
    // Step 1: Rate limiting check
    const rateLimitResult: any = await ctx.runMutation(api.rateLimiting.rateLimitAttempt, {
      ip: args.ip_address,
      action: "signup",
      userAgent: args.user_agent,
    });

    if (!rateLimitResult.allowed) {
      return {
        success: false,
        message: `Too many signup attempts. Please try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 60000)} minutes.`,
        requires_approval: false,
      };
    }

    // Step 2: Input validation and sanitization
    const validationResult = validateGoogleOAuthData(args);
    if (!validationResult.isValid) {
      return {
        success: false,
        message: `Invalid registration data: ${validationResult.errors.join(", ")}`,
        requires_approval: false,
      };
    }

    // Step 3: Check if user already exists
    const existingUser = await ctx.db
      .query("user_profiles")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingUser) {
      return {
        success: false,
        message: "User already exists. Please sign in instead.",
        requires_approval: false,
      };
    }

    // Step 4: Check for existing pending registration
    const existingPending = await ctx.db
      .query("pending_registrations")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existingPending) {
      return {
        success: false,
        message: "Registration already pending approval. Please wait for verification.",
        requires_approval: true,
      };
    }

    // Step 5: Create pending registration (NOT user profile)
    const registrationId = await ctx.db.insert("pending_registrations", {
      google_id: args.google_id,
      email: args.email,
      name: args.name,
      given_name: args.given_name || "",
      family_name: args.family_name || "",
      picture: args.picture || "",
      email_verified: args.email_verified || false,
      ip_address: args.ip_address,
      user_agent: args.user_agent,
      status: "pending_approval",
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Step 6: Log security event
    await ctx.runMutation(api.securityAudit.logSecurityEvent, {
      eventType: "signup",
      ipAddress: args.ip_address,
      userAgent: args.user_agent,
      details: `New user registration: ${args.email}`,
      severity: "low",
      metadata: { registration_id: registrationId },
    });

    return {
      success: true,
      message: "Registration submitted for approval. You will receive access once your account is verified.",
      registration_id: registrationId,
      requires_approval: true,
    };
  },
});

// Validate Google OAuth data
function validateGoogleOAuthData(data: any) {
  const errors: string[] = [];

  // Email validation
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  if (data.email && data.email.length > 254) {
    errors.push("Email too long");
  }

  // Name validation
  if (!data.name || data.name.length < 2 || data.name.length > 100) {
    errors.push("Invalid name length");
  }

  // Check for XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
  ];

  for (const [field, value] of Object.entries(data)) {
    if (typeof value === "string") {
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          errors.push(`Suspicious content in ${field}`);
          break;
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Get pending registrations (Global Admin only)
export const getPendingRegistrations = query({
  args: {
    admin_user_id: v.id("user_profiles"), // Pass the admin user ID directly
  },
  returns: v.array(v.object({
    _id: v.id("pending_registrations"),
    _creationTime: v.number(), // Convex system field
    google_id: v.string(),
    email: v.string(),
    name: v.string(),
    given_name: v.string(),
    family_name: v.string(),
    picture: v.string(),
    email_verified: v.boolean(),
    ip_address: v.string(),
    user_agent: v.string(),
    status: v.union(v.literal("pending_approval"), v.literal("approved"), v.literal("rejected")),
    approved_by: v.optional(v.id("user_profiles")),
    approved_at: v.optional(v.number()),
    rejected_by: v.optional(v.id("user_profiles")),
    rejected_at: v.optional(v.number()),
    rejection_reason: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })),
  handler: async (ctx, args) => {
    // Check if user is super admin or global admin
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser) {
      throw new Error("Access denied. User not found.");
    }

    // Check if user is super admin
    const isSuperAdmin = adminUser.role === "super_admin";
    
    // Check if user is global admin
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.admin_user_id))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    if (!isSuperAdmin && !isGlobalAdmin) {
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    return await ctx.db
      .query("pending_registrations")
      .filter((q) => q.eq(q.field("status"), "pending_approval"))
      .order("desc")
      .collect();
  },
});

// Approve registration (Global Admin only)
export const approveRegistration = mutation({
  args: {
    admin_user_id: v.id("user_profiles"), // Pass admin user ID directly
    registrationId: v.id("pending_registrations"),
    organizationId: v.optional(v.id("organizations")), // Optional for global admins
    role: v.union(v.literal("super_admin"), v.literal("admin"), v.literal("manager"), v.literal("user"), v.literal("viewer")),
    permissions: v.array(v.string()),
    modelPermissions: v.record(v.string(), v.array(v.string())),
    countdownDays: v.number(),
    isGlobalAdmin: v.optional(v.boolean()),
    isPrimaryOrg: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    userId: v.optional(v.id("user_profiles")),
  }),
  handler: async (ctx, args) => {
    // Check if user is super admin or global admin
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser) {
      throw new Error("Access denied. User not found.");
    }

    // Check if user is super admin
    const isSuperAdmin = adminUser.role === "super_admin";
    
    // Check if user is global admin
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.admin_user_id))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    if (!isSuperAdmin && !isGlobalAdmin) {
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    // Get pending registration
    const registration = await ctx.db.get(args.registrationId);
    if (!registration || registration.status !== "pending_approval") {
      return {
        success: false,
        message: "Registration not found or already processed",
      };
    }

    // Validate organization requirement for non-global admins
    if (!args.isGlobalAdmin && !args.organizationId) {
      return {
        success: false,
        message: "Organization is required for non-global admin users",
      };
    }

    // Create user profile
    const userId = await ctx.db.insert("user_profiles", {
      google_id: registration.google_id,
      email: registration.email,
      name: registration.name,
      given_name: registration.given_name,
      family_name: registration.family_name,
      picture: registration.picture,
      email_verified: registration.email_verified,
      role: args.role,
      organization_id: args.organizationId,
      permissions: args.permissions,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Update registration status
    await ctx.db.patch(args.registrationId, {
      status: "approved",
      approved_by: adminUser._id,
      approved_at: Date.now(),
      updated_at: Date.now(),
    });

    // Add model access control if specified and organization exists
    if (args.modelPermissions && args.organizationId) {
      for (const [model, permissions] of Object.entries(args.modelPermissions)) {
        await ctx.db.insert("model_access_control", {
          user_id: userId,
          organization_id: args.organizationId,
          model_name: model,
          can_read: permissions.includes("read"),
          can_create: permissions.includes("create"),
          can_update: permissions.includes("update"),
          can_delete: permissions.includes("delete"),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Create countdown timer for user access if organization exists and countdown days > 0
    if (args.organizationId && args.countdownDays > 0) {
      const startDate = Date.now();
      const endDate = startDate + (args.countdownDays * 24 * 60 * 60 * 1000);

      await ctx.db.insert("user_countdowns", {
        user_id: userId,
        organization_id: args.organizationId,
        countdown_type: "days",
        countdown_value: args.countdownDays,
        remaining_value: args.countdownDays,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        created_by: adminUser._id,
        created_at: startDate,
        updated_at: startDate,
      });
    }

    // Create global admin entry if user is being made a global admin
    if (args.isGlobalAdmin) {
      await ctx.db.insert("global_admins", {
        user_id: userId,
        email: registration.email,
        name: registration.name,
        role: args.role,
        permissions: args.permissions,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: `Promoted to global admin during approval by ${adminUser.email}`,
      });
    }

    // Log security event
    await ctx.runMutation(api.securityAudit.logSecurityEvent, {
      eventType: "permission_change",
      userId: userId,
      ipAddress: "System", // Since we don't have identity, use "System"
      userAgent: "System",
      details: `User approved: ${registration.email} by ${adminUser.email}`,
      severity: "medium",
      metadata: { 
        approved_user: registration.email,
        role: args.role,
        organization_id: args.organizationId,
      },
    });

    return {
      success: true,
      message: `User ${registration.email} approved successfully`,
      userId,
    };
  },
});

// Reject registration (Global Admin only)
export const rejectRegistration = mutation({
  args: {
    admin_user_id: v.id("user_profiles"), // Pass admin user ID directly
    registrationId: v.id("pending_registrations"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if user is super admin or global admin
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser) {
      throw new Error("Access denied. User not found.");
    }

    // Check if user is super admin
    const isSuperAdmin = adminUser.role === "super_admin";
    
    // Check if user is global admin
    const globalAdmins = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.admin_user_id))
      .collect();
    
    const isGlobalAdmin = globalAdmins.length > 0 && globalAdmins[0].is_active;

    if (!isSuperAdmin && !isGlobalAdmin) {
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    // Get pending registration
    const registration = await ctx.db.get(args.registrationId);
    if (!registration || registration.status !== "pending_approval") {
      return {
        success: false,
        message: "Registration not found or already processed",
      };
    }

    // Update registration status
    await ctx.db.patch(args.registrationId, {
      status: "rejected",
      rejected_by: adminUser._id,
      rejected_at: Date.now(),
      rejection_reason: args.reason || "Rejected by administrator",
      updated_at: Date.now(),
    });

    // Log security event
    await ctx.runMutation(api.securityAudit.logSecurityEvent, {
      eventType: "account_locked",
      ipAddress: "System", // Since we don't have identity, use "System"
      userAgent: "System",
      details: `Registration rejected: ${registration.email} by ${adminUser.email}`,
      severity: "medium",
      metadata: { 
        rejected_user: registration.email,
        reason: args.reason,
      },
    });

    return {
      success: true,
      message: `Registration for ${registration.email} rejected`,
    };
  },
});

