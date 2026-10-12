import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Session configuration
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const SESSION_REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour before expiry

// Create a new session
export const createSession = mutation({
  args: {
    userId: v.id("user_profiles"),
    userAgent: v.string(),
    ipAddress: v.string(),
    deviceInfo: v.optional(v.string()),
  },
  returns: v.object({
    sessionId: v.id("user_sessions"),
    expiresAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const expiresAt = Date.now() + SESSION_TIMEOUT;

    const sessionId = await ctx.db.insert("user_sessions", {
      user_id: args.userId,
      user_agent: args.userAgent,
      ip_address: args.ipAddress,
      device_info: args.deviceInfo || "",
      created_at: Date.now(),
      expires_at: expiresAt,
      is_active: true,
      last_activity: Date.now(),
    });

    return {
      sessionId,
      expiresAt,
    };
  },
});

// Validate session
export const validateSession = query({
  args: {
    sessionId: v.id("user_sessions"),
  },
  returns: v.union(
    v.object({
      valid: v.boolean(),
      userId: v.optional(v.id("user_profiles")),
      expiresAt: v.optional(v.number()),
      lastActivity: v.optional(v.number()),
      reason: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    
    if (!session) {
      return { valid: false, reason: "Session not found" };
    }

    if (!session.is_active) {
      return { valid: false, reason: "Session inactive" };
    }

    if (Date.now() > session.expires_at) {
      return { valid: false, reason: "Session expired" };
    }

    return {
      valid: true,
      userId: session.user_id,
      expiresAt: session.expires_at,
      lastActivity: session.last_activity,
    };
  },
});

// Refresh session activity
export const refreshSession = mutation({
  args: {
    sessionId: v.id("user_sessions"),
  },
  returns: v.union(
    v.object({
      success: v.boolean(),
      newExpiresAt: v.optional(v.number()),
      reason: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    
    if (!session || !session.is_active) {
      return { success: false, reason: "Session not found or inactive" };
    }

    if (Date.now() > session.expires_at) {
      return { success: false, reason: "Session expired" };
    }

    // Check if session needs refresh (within threshold)
    const timeUntilExpiry = session.expires_at - Date.now();
    let newExpiresAt = session.expires_at;

    if (timeUntilExpiry < SESSION_REFRESH_THRESHOLD) {
      newExpiresAt = Date.now() + SESSION_TIMEOUT;
    }

    await ctx.db.patch(args.sessionId, {
      last_activity: Date.now(),
      expires_at: newExpiresAt,
    });

    return {
      success: true,
      newExpiresAt,
    };
  },
});

// Invalidate session (logout)
export const invalidateSession = mutation({
  args: {
    sessionId: v.id("user_sessions"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    
    if (!session) {
      return false;
    }

    await ctx.db.patch(args.sessionId, {
      is_active: false,
    });

    return true;
  },
});

// Invalidate all sessions for a user
export const invalidateAllUserSessions = mutation({
  args: {
    userId: v.id("user_profiles"),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("user_sessions")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.eq(q.field("is_active"), true)
        )
      )
      .collect();

    let invalidatedCount = 0;
    for (const session of sessions) {
      await ctx.db.patch(session._id, {
        is_active: false,
      });
      invalidatedCount++;
    }

    return invalidatedCount;
  },
});

// Get active sessions for a user
export const getUserSessions = query({
  args: {
    userId: v.id("user_profiles"),
  },
  returns: v.array(v.object({
    _id: v.id("user_sessions"),
    user_agent: v.string(),
    ip_address: v.string(),
    device_info: v.string(),
    created_at: v.number(),
    expires_at: v.number(),
    last_activity: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_sessions")
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), args.userId),
          q.eq(q.field("is_active"), true)
        )
      )
      .order("desc")
      .collect();
  },
});

// Clean up expired sessions
export const cleanupExpiredSessions = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const now = Date.now();
    
    const expiredSessions = await ctx.db
      .query("user_sessions")
      .filter((q) => q.lt(q.field("expires_at"), now))
      .collect();

    let cleanedCount = 0;
    for (const session of expiredSessions) {
      await ctx.db.patch(session._id, {
        is_active: false,
      });
      cleanedCount++;
    }

    return cleanedCount;
  },
});
