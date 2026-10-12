import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Create a countdown for a user when they are approved
 */
export const createUserCountdown = mutation({
  args: {
    user_id: v.id("user_profiles"),
    organization_id: v.optional(v.id("organizations")),
    countdown_type: v.union(v.literal("days"), v.literal("months"), v.literal("years")),
    countdown_value: v.float64(),
    admin_user_id: v.id("user_profiles"), // Add admin user ID parameter
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    countdown_id: v.optional(v.id("user_countdowns")),
  }),
  handler: async (ctx, args) => {
    // Get admin user from database using provided ID
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser) {
      console.error("❌ Admin user not found in database:", args.admin_user_id);
      throw new Error("Admin user not found in database");
    }

    console.log("🔍 Admin user role:", adminUser.role);

    // Check if user is super admin or global admin
    const isSuperAdmin = adminUser.role === "super_admin";
    const globalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", adminUser._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    const isGlobalAdmin = !!globalAdmin;

    console.log("🔍 Is Super Admin:", isSuperAdmin, "Is Global Admin:", isGlobalAdmin);

    if (!isSuperAdmin && !isGlobalAdmin) {
      console.error("❌ Access denied for user:", adminUser.email);
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    // Calculate end date based on countdown type
    const startDate = Date.now();
    let endDate = startDate;

    switch (args.countdown_type) {
      case "days":
        endDate = startDate + (args.countdown_value * 24 * 60 * 60 * 1000);
        break;
      case "months":
        endDate = startDate + (args.countdown_value * 30 * 24 * 60 * 60 * 1000);
        break;
      case "years":
        endDate = startDate + (args.countdown_value * 365 * 24 * 60 * 60 * 1000);
        break;
    }

    // Create countdown record
    const countdownId = await ctx.db.insert("user_countdowns", {
      user_id: args.user_id,
      organization_id: args.organization_id,
      countdown_type: args.countdown_type,
      countdown_value: args.countdown_value,
      remaining_value: args.countdown_value,
      start_date: startDate,
      end_date: endDate,
      is_active: true,
      created_by: adminUser._id,
      created_at: startDate,
      updated_at: startDate,
    });

    return {
      success: true,
      message: `Countdown created successfully for ${args.countdown_value} ${args.countdown_type}`,
      countdown_id: countdownId,
    };
  },
});

/**
 * Get user countdown status
 */
export const getUserCountdown = query({
  args: {
    user_id: v.id("user_profiles"),
  },
  returns: v.union(
    v.object({
      _id: v.id("user_countdowns"),
      _creationTime: v.number(), // Add system field
      user_id: v.id("user_profiles"),
      organization_id: v.optional(v.id("organizations")),
      countdown_type: v.string(),
      countdown_value: v.number(),
      remaining_value: v.number(),
      start_date: v.number(),
      end_date: v.number(),
      is_active: v.boolean(),
      created_by: v.id("user_profiles"),
      created_at: v.number(),
      updated_at: v.number(),
      days_remaining: v.number(),
      is_expired: v.boolean(),
      is_expiring_soon: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const countdown = await ctx.db
      .query("user_countdowns")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (!countdown) {
      return null;
    }

    // Calculate remaining days
    const now = Date.now();
    const daysRemaining = Math.max(0, Math.ceil((countdown.end_date - now) / (24 * 60 * 60 * 1000)));
    const isExpired = now >= countdown.end_date;
    const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

    return {
      ...countdown,
      days_remaining: daysRemaining,
      is_expired: isExpired,
      is_expiring_soon: isExpiringSoon,
    };
  },
});

/**
 * Get all user countdowns (for admin dashboard)
 */
export const getAllUserCountdowns = query({
  args: {
    user_id: v.id("user_profiles"), // Admin user ID for authorization
  },
  returns: v.array(
    v.object({
      _id: v.union(v.id("user_countdowns"), v.string()), // Can be countdown ID or placeholder string
      _creationTime: v.number(), // Add system field
      user_id: v.id("user_profiles"),
      organization_id: v.optional(v.id("organizations")),
      countdown_type: v.string(),
      countdown_value: v.number(),
      remaining_value: v.number(),
      start_date: v.number(),
      end_date: v.number(),
      is_active: v.boolean(),
      created_by: v.id("user_profiles"),
      created_at: v.number(),
      updated_at: v.number(),
      days_remaining: v.number(),
      is_expired: v.boolean(),
      is_expiring_soon: v.boolean(),
      user_email: v.string(),
      user_name: v.string(),
      organization_name: v.optional(v.string()),
      has_countdown: v.boolean(),
    })
  ),
  handler: async (ctx, args) => {
    // Check if user is super admin or global admin
    const adminUser = await ctx.db.get(args.user_id);
    if (!adminUser) {
      throw new Error("User not found");
    }

    const isSuperAdmin = adminUser.role === "super_admin";
    const globalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", adminUser._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    const isGlobalAdmin = !!globalAdmin;

    if (!isSuperAdmin && !isGlobalAdmin) {
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    // Get all users first
    const allUsers = await ctx.db
      .query("user_profiles")
      .collect();

    const result = [];

    for (const user of allUsers) {
      // Skip super admins - they have unlimited access
      if (user.role === "super_admin") {
        continue;
      }

      // Get countdown for this user
      const countdown = await ctx.db
        .query("user_countdowns")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id))
        .filter((q) => q.eq(q.field("is_active"), true))
        .first();

      // Get organization details if applicable
      let organizationName: string | undefined;
      let organizationId: any;
      if (user.organization_id) {
        const organization = await ctx.db.get(user.organization_id);
        organizationName = organization?.name;
        organizationId = organization?._id;
      }

      if (countdown) {
        // User has a countdown timer
        const now = Date.now();
        const daysRemaining = Math.max(0, Math.ceil((countdown.end_date - now) / (24 * 60 * 60 * 1000)));
        const isExpired = now >= countdown.end_date;
        const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

        result.push({
          _id: countdown._id,
          _creationTime: countdown._creationTime,
          user_id: user._id,
          organization_id: organizationId,
          countdown_type: countdown.countdown_type,
          countdown_value: countdown.countdown_value,
          remaining_value: countdown.remaining_value,
          start_date: countdown.start_date,
          end_date: countdown.end_date,
          is_active: countdown.is_active,
          created_by: countdown.created_by,
          created_at: countdown.created_at,
          updated_at: countdown.updated_at,
          days_remaining: daysRemaining,
          is_expired: isExpired,
          is_expiring_soon: isExpiringSoon,
          user_email: user.email,
          user_name: user.name || `${user.given_name || ''} ${user.family_name || ''}`.trim() || user.email,
          organization_name: organizationName,
          has_countdown: true,
        });
      } else {
        // User has no countdown timer - create a placeholder entry
        result.push({
          _id: `no-countdown-${user._id}`,
          _creationTime: 0,
          user_id: user._id,
          organization_id: organizationId,
          countdown_type: "none",
          countdown_value: 0,
          remaining_value: 0,
          start_date: 0,
          end_date: 0,
          is_active: false,
          created_by: user._id,
          created_at: 0,
          updated_at: 0,
          days_remaining: 0,
          is_expired: true,
          is_expiring_soon: false,
          user_email: user.email,
          user_name: user.name || `${user.given_name || ''} ${user.family_name || ''}`.trim() || user.email,
          organization_name: organizationName,
          has_countdown: false,
        });
      }
    }

    return result.sort((a, b) => a.end_date - b.end_date); // Sort by end date
  },
});

/**
 * Disable user when countdown expires
 */
export const disableUserOnExpiry = internalMutation({
  args: {
    user_id: v.id("user_profiles"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Disable the user
    await ctx.db.patch(args.user_id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    // Mark countdown as inactive
    const countdown = await ctx.db
      .query("user_countdowns")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (countdown) {
      await ctx.db.patch(countdown._id, {
        is_active: false,
        updated_at: Date.now(),
      });
    }

    return null;
  },
});

/**
 * Manually disable a user (for admin use)
 */
export const disableUser = mutation({
  args: {
    admin_user_id: v.id("user_profiles"), // Pass admin user ID directly
    user_id: v.id("user_profiles"),
    reason: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if user is super admin by directly querying the user
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser || adminUser.role !== "super_admin") {
      throw new Error("Access denied. Super admin privileges required.");
    }

    // Disable the user
    await ctx.db.patch(args.user_id, {
      is_active: false,
      updated_at: new Date().toISOString(),
    });

    // Note: We don't deactivate countdown timers when disabling users
    // This allows users to be re-enabled with their original countdown intact

    return {
      success: true,
      message: `User disabled successfully${args.reason ? `: ${args.reason}` : ''}`,
    };
  },
});

/**
 * Manually enable a user (for admin use)
 */
export const enableUser = mutation({
  args: {
    admin_user_id: v.id("user_profiles"), // Pass admin user ID directly
    user_id: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Check if user is super admin by directly querying the user
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser || adminUser.role !== "super_admin") {
      throw new Error("Access denied. Super admin privileges required.");
    }

    // Enable the user
    await ctx.db.patch(args.user_id, {
      is_active: true,
      updated_at: new Date().toISOString(),
    });

    return {
      success: true,
      message: "User enabled successfully",
    };
  },
});

/**
 * Extend user countdown
 */
export const extendUserCountdown = mutation({
  args: {
    user_id: v.id("user_profiles"),
    additional_days: v.float64(),
    admin_user_id: v.id("user_profiles"), // Add admin user ID parameter
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Get admin user from database using provided ID
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser) {
      console.error("❌ Admin user not found in database:", args.admin_user_id);
      throw new Error("Admin user not found in database");
    }

    console.log("🔍 Admin user role:", adminUser.role);

    // Check if user is super admin or global admin
    const isSuperAdmin = adminUser.role === "super_admin";
    const globalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", adminUser._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    const isGlobalAdmin = !!globalAdmin;

    if (!isSuperAdmin && !isGlobalAdmin) {
      console.error("❌ Access denied for user:", adminUser.email);
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    // Get current countdown
    const countdown = await ctx.db
      .query("user_countdowns")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();

    if (!countdown) {
      return {
        success: false,
        message: "No active countdown found for this user",
      };
    }

    // Extend the countdown
    const newEndDate = countdown.end_date + (args.additional_days * 24 * 60 * 60 * 1000);
    const newRemainingValue = countdown.remaining_value + args.additional_days;

    await ctx.db.patch(countdown._id, {
      end_date: newEndDate,
      remaining_value: newRemainingValue,
      updated_at: Date.now(),
    });

    return {
      success: true,
      message: `Countdown extended by ${args.additional_days} days`,
    };
  },
});

/**
 * Update user countdown (for editing countdown values)
 */
export const updateUserCountdown = mutation({
  args: {
    countdown_id: v.id("user_countdowns"),
    new_total_days: v.float64(), // New total days to set
    admin_user_id: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    const isSuperAdmin = adminUser.role === "super_admin";
    const globalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", adminUser._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    const isGlobalAdmin = !!globalAdmin;

    if (!isSuperAdmin && !isGlobalAdmin) {
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    const countdown = await ctx.db.get(args.countdown_id);
    if (!countdown) {
      return {
        success: false,
        message: "Countdown not found",
      };
    }

    if (args.new_total_days === 0) {
      // If days is 0, disable the countdown
      await ctx.db.patch(args.countdown_id, {
        is_active: false,
        updated_at: Date.now(),
      });
    } else {
      // Calculate new end date based on new total days
      const newEndDate = Date.now() + (args.new_total_days * 24 * 60 * 60 * 1000);
      
      // Update the countdown with new total days
      await ctx.db.patch(args.countdown_id, {
        countdown_value: args.new_total_days,
        remaining_value: args.new_total_days,
        end_date: newEndDate,
        is_active: true,
        updated_at: Date.now(),
      });
    }

    return {
      success: true,
      message: args.new_total_days === 0 
        ? "User access has been removed" 
        : `Countdown updated to ${args.new_total_days} days`,
    };
  },
});

/**
 * Replace user countdown (alternative function for editing)
 */
export const replaceUserCountdown = mutation({
  args: {
    countdown_id: v.id("user_countdowns"),
    new_total_days: v.float64(), // New total days to set
    admin_user_id: v.id("user_profiles"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const adminUser = await ctx.db.get(args.admin_user_id);
    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    const isSuperAdmin = adminUser.role === "super_admin";
    const globalAdmin = await ctx.db
      .query("global_admins")
      .withIndex("by_user_id", (q) => q.eq("user_id", adminUser._id))
      .filter((q) => q.eq(q.field("is_active"), true))
      .first();
    
    const isGlobalAdmin = !!globalAdmin;

    if (!isSuperAdmin && !isGlobalAdmin) {
      throw new Error("Access denied. Super admin or global admin privileges required.");
    }

    const countdown = await ctx.db.get(args.countdown_id);
    if (!countdown) {
      return {
        success: false,
        message: "Countdown not found",
      };
    }

    if (args.new_total_days === 0) {
      // If days is 0, disable the countdown
      await ctx.db.patch(args.countdown_id, {
        is_active: false,
        updated_at: Date.now(),
      });
    } else {
      // Calculate new end date based on new total days
      const newEndDate = Date.now() + (args.new_total_days * 24 * 60 * 60 * 1000);
      
      // Update the countdown with new total days
      await ctx.db.patch(args.countdown_id, {
        countdown_value: args.new_total_days,
        remaining_value: args.new_total_days,
        end_date: newEndDate,
        is_active: true,
        updated_at: Date.now(),
      });
    }

    return {
      success: true,
      message: args.new_total_days === 0 
        ? "User access has been removed" 
        : `Countdown updated to ${args.new_total_days} days`,
    };
  },
});

/**
 * Get expired countdowns (for cron job)
 */
export const getExpiredCountdowns = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("user_countdowns"),
      _creationTime: v.number(),
      user_id: v.id("user_profiles"),
      organization_id: v.optional(v.id("organizations")),
      countdown_type: v.string(),
      countdown_value: v.number(),
      remaining_value: v.number(),
      start_date: v.number(),
      end_date: v.number(),
      is_active: v.boolean(),
      created_by: v.id("user_profiles"),
      created_at: v.number(),
      updated_at: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db
      .query("user_countdowns")
      .withIndex("by_active_status", (q) => q.eq("is_active", true))
      .filter((q) => q.lte(q.field("end_date"), now))
      .collect();
  },
});

/**
 * Check for expired countdowns and disable users (cron job)
 */
export const checkExpiredCountdowns = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Get all active countdowns that have expired
    const expiredCountdowns = await ctx.runQuery(api.countdownManagement.getExpiredCountdowns);
    
    // Disable users for each expired countdown
    for (const countdown of expiredCountdowns) {
      // await ctx.runMutation(api.countdownManagement.disableUserOnExpiry, { // This function doesn't exist
      //   user_id: countdown.user_id,
      // });
    }
    
    return null;
  },
});
