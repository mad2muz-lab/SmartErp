import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_AUTH_ATTEMPTS = 5; // Max 5 auth attempts per 15 minutes
const MAX_SIGNUP_ATTEMPTS = 3; // Max 3 signup attempts per 15 minutes

// Rate limiting table schema
export const rateLimitAttempt = mutation({
  args: {
    ip: v.string(),
    action: v.union(v.literal("auth"), v.literal("signup"), v.literal("password_reset")),
    userAgent: v.optional(v.string()),
  },
  returns: v.object({
    allowed: v.boolean(),
    remainingAttempts: v.number(),
    resetTime: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Get recent attempts for this IP and action
    const recentAttempts = await ctx.db
      .query("rate_limit_attempts")
      .filter((q) => 
        q.and(
          q.eq(q.field("ip"), args.ip),
          q.eq(q.field("action"), args.action),
          q.gte(q.field("timestamp"), windowStart)
        )
      )
      .collect();

    const maxAttempts = args.action === "auth" ? MAX_AUTH_ATTEMPTS : MAX_SIGNUP_ATTEMPTS;
    const currentAttempts = recentAttempts.length;

    if (currentAttempts >= maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: windowStart + RATE_LIMIT_WINDOW,
      };
    }

    // Record this attempt
    await ctx.db.insert("rate_limit_attempts", {
      ip: args.ip,
      action: args.action,
      user_agent: args.userAgent || "unknown",
      timestamp: now,
    });

    return {
      allowed: true,
      remainingAttempts: maxAttempts - currentAttempts - 1,
      resetTime: windowStart + RATE_LIMIT_WINDOW,
    };
  },
});

// Check rate limit status
export const checkRateLimit = query({
  args: {
    ip: v.string(),
    action: v.union(v.literal("auth"), v.literal("signup"), v.literal("password_reset")),
  },
  returns: v.object({
    allowed: v.boolean(),
    remainingAttempts: v.number(),
    resetTime: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    const recentAttempts = await ctx.db
      .query("rate_limit_attempts")
      .filter((q) => 
        q.and(
          q.eq(q.field("ip"), args.ip),
          q.eq(q.field("action"), args.action),
          q.gte(q.field("timestamp"), windowStart)
        )
      )
      .collect();

    const maxAttempts = args.action === "auth" ? MAX_AUTH_ATTEMPTS : MAX_SIGNUP_ATTEMPTS;
    const currentAttempts = recentAttempts.length;

    return {
      allowed: currentAttempts < maxAttempts,
      remainingAttempts: Math.max(0, maxAttempts - currentAttempts),
      resetTime: windowStart + RATE_LIMIT_WINDOW,
    };
  },
});

// Clean up old rate limit records
export const cleanupRateLimits = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const cutoff = Date.now() - RATE_LIMIT_WINDOW;
    
    const oldAttempts = await ctx.db
      .query("rate_limit_attempts")
      .filter((q) => q.lt(q.field("timestamp"), cutoff))
      .collect();

    let deletedCount = 0;
    for (const attempt of oldAttempts) {
      await ctx.db.delete(attempt._id);
      deletedCount++;
    }

    return deletedCount;
  },
});
