import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Temporary fix to update user role to super_admin
 * This will fix the access control issue
 */
export const fixUserRole = mutation({
  args: {
    user_id: v.id("user_profiles"),
  },
  handler: async (ctx, args) => {
    // Update the user's role to super_admin
    await ctx.db.patch(args.user_id, {
      role: "super_admin"
    });
    
    console.log('✅ User role updated to super_admin for user:', args.user_id);
    return { success: true, message: "User role updated to super_admin" };
  },
});
