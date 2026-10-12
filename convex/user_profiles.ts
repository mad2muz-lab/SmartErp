import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user profiles by organization
export const listUserProfiles = query({
  args: { organizationId: v.id("organizations") },
  returns: v.array(v.object({
    _id: v.id("user_profiles"),
    _creationTime: v.number(),
    user_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.string(),
    department: v.optional(v.string()),
    organization_id: v.id("organizations"),
    is_active: v.boolean(),
    created_at: v.string(),
    updated_at: v.string(),
  })),
  handler: async (ctx, args) => {
    const userProfiles = await ctx.db
      .query("user_profiles")
      .withIndex("by_organization", (q) => q.eq("organization_id", args.organizationId))
      .filter((q) => q.eq(q.field("is_active"), true))
      .order("asc")
      .collect();

    // Ensure all required fields are present and not undefined
    return userProfiles.map(user => {
      if (!user.organization_id) throw new Error("User profile missing required organization_id");
      return {
        _id: user._id,
        _creationTime: user._creationTime,
        user_id: user.user_id ?? "",
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? undefined,
        role: user.role ?? "user",
        department: user.department ?? undefined,
        organization_id: user.organization_id,
        is_active: user.is_active ?? true,
        created_at: user.created_at ?? "",
        updated_at: user.updated_at ?? "",
      };
    });
  },
});

// Get user profile by ID
export const getUserProfile = query({
  args: { id: v.id("user_profiles") },
  returns: v.union(
    v.object({
      _id: v.id("user_profiles"),
      _creationTime: v.number(),
      user_id: v.string(),
      first_name: v.string(),
      last_name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      role: v.string(),
      department: v.optional(v.string()),
      organization_id: v.id("organizations"),
      is_active: v.boolean(),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    // Ensure all required fields are present and fallback to empty string if missing
    // Ensure organization_id is always present (required by schema)
    if (!user.organization_id) {
      throw new Error("User profile missing required organization_id");
    }
    return {
      _id: user._id,
      _creationTime: user._creationTime,
      user_id: user.user_id ?? "",
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? undefined,
      role: user.role ?? "user",
      department: user.department ?? undefined,
      organization_id: user.organization_id,
      is_active: user.is_active ?? true,
      created_at: user.created_at ?? "",
      updated_at: user.updated_at ?? "",
    };
  },
});

// Create new user profile
export const createUserProfile = mutation({
  args: {
    user_id: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.string(),
    department: v.optional(v.string()),
    organization_id: v.id("organizations"),
  },
  returns: v.id("user_profiles"),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("user_profiles", {
      ...args,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    id: v.id("user_profiles"),
    first_name: v.optional(v.string()),
    last_name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.string()),
    department: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updates,
      updated_at: now,
    });
    
    return null;
  },
});

// Delete user profile (soft delete)
export const deleteUserProfile = mutation({
  args: { id: v.id("user_profiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    await ctx.db.patch(args.id, {
      is_active: false,
      updated_at: now,
    });
    
    return null;
  },
});
