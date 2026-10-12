import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const addCustomerArabicFields = internalMutation({
  args: {},
  handler: async (ctx) => {
    // This migration adds the missing Arabic address fields to existing customer records
    // The schema changes should already be applied, this is just to ensure data consistency
    
    const customers = await ctx.db.query("customers").collect();
    
    for (const customer of customers) {
      // Add missing Arabic fields if they don't exist
      const updates: any = {};
      
      if (customer.building_number_arabic === undefined) {
        updates.building_number_arabic = "";
      }
      if (customer.street_arabic === undefined) {
        updates.street_arabic = "";
      }
      if (customer.additional_number_arabic === undefined) {
        updates.additional_number_arabic = "";
      }
      if (customer.district_arabic === undefined) {
        updates.district_arabic = "";
      }
      if (customer.city_arabic === undefined) {
        updates.city_arabic = "";
      }
      if (customer.state_province_arabic === undefined) {
        updates.state_province_arabic = "";
      }
      if (customer.zip_postal_code_arabic === undefined) {
        updates.zip_postal_code_arabic = "";
      }
      if (customer.country_arabic === undefined) {
        updates.country_arabic = "";
      }
      
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(customer._id, updates);
        console.log(`Updated customer ${customer._id} with Arabic fields`);
      }
    }
    
    console.log(`Migration completed for ${customers.length} customers`);
  },
});
