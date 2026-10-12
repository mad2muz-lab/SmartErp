import { mutation, query, internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

// Security audit logging
export const logSecurityEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("login_success"),
      v.literal("login_failed"),
      v.literal("logout"),
      v.literal("password_reset"),
      v.literal("account_locked"),
      v.literal("suspicious_activity"),
      v.literal("data_access"),
      v.literal("data_modification"),
      v.literal("permission_change"),
      v.literal("session_timeout"),
      v.literal("rate_limit_exceeded"),
      v.literal("signup"),
      v.literal("admin_action"),
      v.literal("file_upload"),
      v.literal("export_data")
    ),
    userId: v.optional(v.id("user_profiles")),
    ipAddress: v.string(),
    userAgent: v.string(),
    details: v.optional(v.string()),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    metadata: v.optional(v.record(v.string(), v.any())),
  },
  returns: v.id("security_audit_logs"),
  handler: async (ctx, args) => {
    const logId = await ctx.db.insert("security_audit_logs", {
      event_type: args.eventType,
      user_id: args.userId,
      ip_address: args.ipAddress,
      user_agent: args.userAgent,
      details: args.details || "",
      severity: args.severity,
      metadata: args.metadata || {},
      timestamp: Date.now(),
    });

    // For critical events, trigger additional security measures
    if (args.severity === "critical") {
      await ctx.db.insert("security_alerts", {
        log_id: logId,
        alert_type: "critical_security_event",
        message: `Critical security event: ${args.eventType}`,
        is_resolved: false,
        created_at: Date.now(),
      });
    }

    // For high severity events, check for suspicious patterns
    if (args.severity === "high" || args.severity === "critical") {
      await ctx.scheduler.runAfter(0, internal.securityAudit.checkSuspiciousActivity, {
        userId: args.userId,
        eventType: args.eventType,
        ipAddress: args.ipAddress,
      });
    }

    return logId;
  },
});

// Check for suspicious activity patterns
export const checkSuspiciousActivity = internalAction({
  args: {
    userId: v.optional(v.id("user_profiles")),
    eventType: v.string(),
    ipAddress: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!args.userId) return null;

    // Get recent events for this user
    const recentEvents = await ctx.runQuery(api.securityAudit.getRecentUserEvents, {
      userId: args.userId,
      hours: 1,
    });

    // Check for multiple failed login attempts
    const failedLogins = recentEvents.filter(
      (event: any) => event.event_type === "login_failed"
    ).length;

    if (failedLogins >= 5) {
      await ctx.runMutation(internal.securityAudit.lockUserAccount, {
        userId: args.userId,
        reason: "Multiple failed login attempts",
        duration: 30, // minutes
      });
    }

    // Check for unusual IP addresses
    const uniqueIPs = new Set(recentEvents.map((event: any) => event.ip_address));
    if (uniqueIPs.size > 3) {
      await ctx.runMutation(api.securityAudit.logSecurityEvent, {
        eventType: "suspicious_activity",
        userId: args.userId,
        ipAddress: args.ipAddress,
        userAgent: "System",
        details: "Multiple IP addresses detected in short time",
        severity: "high",
      });
    }

    return null;
  },
});

// Lock user account temporarily
export const lockUserAccount = internalMutation({
  args: {
    userId: v.id("user_profiles"),
    reason: v.string(),
    duration: v.number(), // minutes
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const lockUntil = Date.now() + (args.duration * 60 * 1000);
    
    await ctx.db.insert("account_locks", {
      user_id: args.userId,
      reason: args.reason,
      locked_until: lockUntil,
      created_at: Date.now(),
    });

    // Log the lock event
    await ctx.db.insert("security_audit_logs", {
      event_type: "account_locked",
      user_id: args.userId,
      ip_address: "System",
      user_agent: "System",
      details: args.reason,
      severity: "high",
      metadata: { lockDuration: args.duration },
      timestamp: Date.now(),
    });

    return null;
  },
});

// Get recent user events for security analysis
export const getRecentUserEvents = query({
  args: {
    userId: v.id("user_profiles"),
    hours: v.number(),
  },
  returns: v.array(v.object({
    _id: v.id("security_audit_logs"),
    event_type: v.string(),
    ip_address: v.string(),
    user_agent: v.string(),
    details: v.string(),
    severity: v.string(),
    timestamp: v.number(),
  })),
  handler: async (ctx, args) => {
    const cutoffTime = Date.now() - (args.hours * 60 * 60 * 1000);
    
    return await ctx.db
      .query("security_audit_logs")
      .filter((q) => 
        q.eq(q.field("user_id"), args.userId) &&
        q.gte(q.field("timestamp"), cutoffTime)
      )
      .order("desc")
      .collect();
  },
});

// Get security audit logs
export const getSecurityAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    eventType: v.optional(v.string()),
  },
  returns: v.array(v.object({
    _id: v.id("security_audit_logs"),
    event_type: v.string(),
    user_id: v.optional(v.id("user_profiles")),
    ip_address: v.string(),
    user_agent: v.string(),
    details: v.string(),
    severity: v.string(),
    metadata: v.record(v.string(), v.any()),
    timestamp: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db.query("security_audit_logs");
    
    if (args.severity) {
      query = query.filter((q) => q.eq(q.field("severity"), args.severity));
    }
    
    if (args.eventType) {
      query = query.filter((q) => q.eq(q.field("event_type"), args.eventType));
    }
    
    return await query
      .order("desc")
      .take(args.limit || 100);
  },
});

// Session management
export const createUserSession = mutation({
  args: {
    userId: v.id("user_profiles"),
    ipAddress: v.string(),
    userAgent: v.string(),
  },
  returns: v.id("user_sessions"),
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("user_sessions", {
      user_id: args.userId,
      ip_address: args.ipAddress,
      user_agent: args.userAgent,
      device_info: "unknown",
      created_at: Date.now(),
      expires_at: Date.now() + (8 * 60 * 60 * 1000), // 8 hours
      last_activity: Date.now(),
      is_active: true,
    });

    // Log session creation
    await ctx.db.insert("security_audit_logs", {
      event_type: "login_success",
      user_id: args.userId,
      ip_address: args.ipAddress,
      user_agent: args.userAgent,
      details: "User session created",
      severity: "low",
      metadata: { sessionId },
      timestamp: Date.now(),
    });

    return sessionId;
  },
});

// Validate user session
export const validateUserSession = mutation({
  args: {
    sessionId: v.id("user_sessions"),
  },
  returns: v.union(
    v.object({
      valid: v.boolean(),
      userId: v.optional(v.id("user_profiles")),
      expiresAt: v.optional(v.number()),
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
      // Mark session as expired
      await ctx.db.patch(args.sessionId, { is_active: false });
      
      // Log session timeout
      await ctx.db.insert("security_audit_logs", {
        event_type: "session_timeout",
        user_id: session.user_id,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        details: "Session expired",
        severity: "medium",
        metadata: { sessionId: args.sessionId },
        timestamp: Date.now(),
      });
      
      return { valid: false, reason: "Session expired" };
    }
    
    return {
      valid: true,
      userId: session.user_id,
      expiresAt: session.expires_at,
    };
  },
});

// Clean up expired sessions (run as cron job)
export const cleanupExpiredSessions = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const expiredSessions = await ctx.runQuery(api.securityAudit.getExpiredSessions);
    
    for (const session of expiredSessions) {
      await ctx.runMutation(internal.securityAudit.invalidateSession, {
        sessionId: session._id,
      });
    }
    
    return null;
  },
});

// Get expired sessions
export const getExpiredSessions = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("user_sessions"),
    user_id: v.id("user_profiles"),
    expires_at: v.number(),
  })),
  handler: async (ctx) => {
    return await ctx.db
      .query("user_sessions")
      .filter((q) => 
        q.lt(q.field("expires_at"), Date.now()) &&
        q.eq(q.field("is_active"), true)
      )
      .collect();
  },
});

// Invalidate session
export const invalidateSession = internalMutation({
  args: {
    sessionId: v.id("user_sessions"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, { is_active: false });
    return null;
  },
});
