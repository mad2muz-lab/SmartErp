import { internalMutation } from "../_generated/server";

export const updateSchemaTimestamp = internalMutation({
  args: {},
  handler: async (ctx) => {
    // This migration adds the schema_timestamp field to existing customer records
    // to force frontend cache refresh
    
    console.log("🔄 Updating schema timestamp for customer records...");
    
    try {
      const customers = await ctx.db.query("customers").collect();
      
      for (const customer of customers) {
        // Add schema timestamp field
        await ctx.db.patch(customer._id, {
          schema_timestamp: new Date().toISOString()
        });
      }
      
      console.log(`✅ Updated schema timestamp for ${customers.length} customers`);
      
      return { 
        success: true, 
        message: `Schema timestamp updated for ${customers.length} customers. Frontend cache should now refresh.` 
      };
      
    } catch (error) {
      console.error("❌ Schema timestamp update failed:", error);
      return { success: false, error: error.message };
    }
  },
});
