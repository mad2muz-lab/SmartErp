import { query } from "./_generated/server";
import { v } from "convex/values";

// Minimal test function to check if profitSharing functions can deploy
export const testProfitSharing = query({
  args: {},
  returns: v.string(),
  handler: async () => {
    return "profitSharing test function working";
  },
});
