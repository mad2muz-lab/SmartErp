import { internalMutation } from "../_generated/server";

export const removeArabicFieldsTemporarily = internalMutation({
  args: {},
  handler: async (ctx) => {
    // This migration temporarily removes Arabic fields from existing customer records
    // to allow the schema to be updated properly
    
    console.log("🔄 Temporarily removing Arabic fields from customer records...");
    
    try {
      const customers = await ctx.db.query("customers").collect();
      
      for (const customer of customers) {
        // Remove Arabic fields temporarily
        const updates: any = {};
        
        // Remove all Arabic fields
        if (customer.building_number_arabic !== undefined) {
          updates.building_number_arabic = undefined;
        }
        if (customer.street_arabic !== undefined) {
          updates.street_arabic = undefined;
        }
        if (customer.additional_number_arabic !== undefined) {
          updates.additional_number_arabic = undefined;
        }
        if (customer.district_arabic !== undefined) {
          updates.district_arabic = undefined;
        }
        if (customer.city_arabic !== undefined) {
          updates.city_arabic = undefined;
        }
        if (customer.state_province_arabic !== undefined) {
          updates.state_province_arabic = undefined;
        }
        if (customer.zip_postal_code_arabic !== undefined) {
          updates.zip_postal_code_arabic = undefined;
        }
        if (customer.country_arabic !== undefined) {
          updates.country_arabic = undefined;
        }
        if (customer.email_arabic !== undefined) {
          updates.email_arabic = undefined;
        }
        if (customer.phone_arabic !== undefined) {
          updates.phone_arabic = undefined;
        }
        if (customer.website_arabic !== undefined) {
          updates.website_arabic = undefined;
        }
        if (customer.vat_number_arabic !== undefined) {
          updates.vat_number_arabic = undefined;
        }
        if (customer.cr_number_arabic !== undefined) {
          updates.cr_number_arabic = undefined;
        }
        if (customer.payment_terms_arabic !== undefined) {
          updates.payment_terms_arabic = undefined;
        }
        if (customer.custom_payment_terms_arabic !== undefined) {
          updates.custom_payment_terms_arabic = undefined;
        }
        if (customer.account_number_arabic !== undefined) {
          updates.account_number_arabic = undefined;
        }
        if (customer.iban_arabic !== undefined) {
          updates.iban_arabic = undefined;
        }
        if (customer.swift_code_arabic !== undefined) {
          updates.swift_code_arabic = undefined;
        }
        
        // Only update if there are fields to remove
        if (Object.keys(updates).length > 0) {
          await ctx.db.patch(customer._id, updates);
        }
      }
      
      console.log(`✅ Temporarily removed Arabic fields from ${customers.length} customers`);
      return { success: true, message: `Temporarily removed Arabic fields from ${customers.length} customers` };
      
    } catch (error) {
      console.error("❌ Failed to remove Arabic fields:", error);
      return { success: false, error: error.message };
    }
  },
});